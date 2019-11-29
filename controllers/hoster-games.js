const io = require('../models/socket');

// controllers
const hostersController = require('../controllers/hosters');
const hosterReportsController = require('../controllers/hoster-reports');
const playerReportsController = require('../controllers/player-reports');
const notificationsContoller = require('../controllers/notifications');
const calculationsContoller = require('../controllers/calculations');

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');

const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');

exports.disconnect = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('disconnect', () => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;

        if (hoster) {
            // memory
            hostersController.removeHoster(socket);

            // remove from mongoDB
            if (hasToken === true) {
                hosterReportsController.deleteHosterReport(socket, hoster);
                playerReportsController.deletePlayerReports(hoster);
            };

            // response to players
            socket.to(hoster.gameId).emit('hoster-disconnect');

            console.log(`[@hoster disconenct] ${hoster.socketId} hoster has left room ${hoster.gameId}`);

            // logging hoster list
            const hosters = Hoster.getHosters();
            console.log(`[@hoster disconenct] hoster list:`);
            console.log(hosters.map((hoster) => {
                return { socketId: hoster.socketId, name: hoster.name }
            }));
        };
    });
};

exports.hostGame = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('host-game', (data, callback) => {
        const { quizId, suffleQuestions, suffleAnswerOptions, assignClassIds } = data;

        // input validation
        if (!quizId || !assignClassIds) {
            console.log('[@hoster host-game] Something went wrong!');
            return;
        };

        if (typeof(suffleQuestions) !== 'boolean' && typeof(suffleAnswerOptions) !== 'boolean') {
            console.log('[@hoster host-game] Something went wrong!');
            return;
        };

        // memory
        const hoster = hostersController.addHoster(socket, data);

        // mongoDB
        if (hasToken) {
            hosterReportsController.addHosterReports(socket, hoster);
            notificationsContoller.sendAssignClassesNotification(socket, hoster, assignClassIds);
        };

        // join room
        socket.join(hoster.gameId);
        console.log(`[@hoster host-game] ${hoster.socketId} hoster created new room ${hoster.gameId}`);

        // response to hoster
        callback({
            message: 'host game successful',
            isHosted: true,
            gameId: hoster.gameId
        });

        // logging hoster list
        const hosters = Hoster.getHosters();
        console.log(`[@hoster host-game] hoster list:`);
        console.log(hosters.map((hoster) => {
            return { socketId: hoster.socketId, name: hoster.name }
        }));
    });
}

exports.nextQuestion = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('next-question', (btnState, callback) => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;

        if (typeof(btnState) !== 'boolean') {
            console.log('[@hoster next-question] Something went wrong!');
            return;
        };

        if (btnState === true) {
            Quiz.findOne({ _id: hoster.quizId })
                .then((quiz) => {
                    // game over
                    const isGameOver = ((hoster.questionIndex + 1) === quiz.questions.length);

                    if (isGameOver) {
                        // memory
                        hostersController.setGameOverData(hoster);

                        // scoreboard should be calculated in advanced to prevent undefined
                        const scoreBoard = calculationsContoller.calcScoreboard(hoster);

                        const onlinePlayers = Player.getOnlinePlayersByGameId(hoster.gameId);

                        // mongoDB
                        if (hasToken === true && onlinePlayers.length > 0) {
                            const gameAccuracy = calculationsContoller.calcGameAccuracy(hoster);
                            const playerResults = calculationsContoller.calcPlayerResults(hoster);

                            hosterReportsController.setGameOverData(hoster, gameAccuracy, scoreBoard, playerResults);
                            playerReportsController.setGameOverData(hoster, scoreBoard);
                        };

                        // response to players
                        socket.to(hoster.gameId).emit('player-game-over');

                        // response to hoster
                        return callback({
                            nextQuestion: false,
                            isGameOver: hoster.isGameOver,
                            nextQuestionData: {
                                scoreBoard
                            }
                        });

                    } else { // next question
                        // memory
                        hostersController.setQuestionData(hoster, quiz);

                        const choiceIds = hoster.question.choices.map((choice) => choice._id);

                        // response to players
                        socket.to(hoster.gameId).emit('player-next-question', {
                            questionIndex: hoster.questionIndex + 1,
                            questionLength: quiz.questions.length,
                            choiceIds
                        });

                        // response to hoster
                        callback({
                            nextQuestion: true,
                            isGameOver: hoster.isGameOver,
                            nextQuestionData: {
                                question: hoster.question,
                                gameId: hoster.gameId
                            }
                        });
                    };
                })
                .catch(err => {
                    console.log(err);
                });

        } else if (btnState === false) {
            const onlinePlayers = Player.getOnlinePlayersByGameId(hoster.gameId);

            if (hasToken === true && onlinePlayers.length > 0) {

                const questionResultsAccuracy = calculationsContoller.calcQuestionResultsAccuracy(hoster);
                console.log(questionResultsAccuracy)
                const { choicesAccuracy, noAnsAccuracy } = calculationsContoller.calcChoicesAccuracy(hoster);

                // mongoDB
                hosterReportsController.setQuestionResults(hoster, questionResultsAccuracy, choicesAccuracy, noAnsAccuracy);
                playerReportsController.setQuestionResults(hoster, choicesAccuracy);
            };

            const scoreBoard = calculationsContoller.calcScoreboard(hoster);

            // response to players
            socket.to(hoster.gameId).emit('get-question-results');

            // response to hoster
            callback({
                nextQuestion: false,
                isGameOver: hoster.isGameOver,
                nextQuestionData: {
                    questionResults: hoster.questionResults,
                    scoreBoard
                }
            });
        };
    });
};

exports.timerCountdown = (socket) => {
    socket.on('time-left', (timeLeft) => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;

        if (typeof(timeLeft) !== 'number') {
            console.log('[@hoster time-left] Something went wrong!');
            return;
        };

        // memory
        hostersController.addCurrentTimeLeft(hoster, timeLeft);
    });
};