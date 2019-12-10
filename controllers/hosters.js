const io = require('../models/socket');
const notification_io = require('../models/socket');

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');
const OnlineUser = require('../models/user');

const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');

const Class = require('../models/mongoose/class');
const Notification = require('../models/mongoose/notification');


exports.disconnect = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('disconnect', () => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;

        if (hoster) {
            // memory
            Hoster.removeHoster(socket.id);

            // remove from mongoDB
            if (hasToken === true) {
                if (hoster && hoster.isGameOver === false) {
                    HosterReport.deleteOne({ socket_id: socket.id })
                        .then(() => console.log(`mongoDB responses success`))
                        .catch(err => console.log(err));

                    PlayerReport.deleteMany({ game_id: hoster.gameId })
                        .then(() => console.log(`mongoDB responses success`))
                        .catch(err => console.log(err));
                };
            };

            // response to players
            socket.to(hoster.gameId).emit('hoster-disconnect');

            // console.log(`[@hoster disconenct] ${hoster.socketId} hoster has left room ${hoster.gameId}`);

            // logging hoster list
            const hosters = Hoster.getHosters();
            const hosterList = hosters.map((hoster) => { return { socketId: hoster.socketId, name: hoster.name } });
            console.log(hosterList);
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
        const gameId = Hoster.generateGameId();

        passName = () => {
            if (hasToken === true) { return socket.request.user.name };
        };
        const hoster = new Hoster(socket.id, quizId, gameId, { suffleQuestions, suffleAnswerOptions }, passName());
        hoster.addHoster();

        // shuffled question ids
        if (hoster.settings.suffleQuestions === true) {
            Quiz.findOne({ _id: hoster.quizId })
                .then(quiz => {
                    hoster.shuffledQuestionIds = quiz.questions.sort(() => Math.random() - .5).map((q) => q._id);
                    Hoster.updateHoster(hoster);
                })
                .catch(err => console.log(err));
        };

        // logging hoster list
        const hosters = Hoster.getHosters();
        const hosterList = hosters.map((hoster) => { return { socketId: hoster.socketId, name: hoster.name } });
        console.log(hosterList);

        // mongoDB
        if (hasToken) {
            Quiz.findOne({ _id: hoster.quizId })
                .then(quiz => {
                    const hosterReport = new HosterReport({
                        socket_id: socket.id,
                        game_id: hoster.gameId,
                        hoster: socket.request.user._id,
                        game_name: quiz.title,
                        questions: quiz.questions
                    });
                    hosterReport.save()
                        .then(() => console.log(`mongoDB responses success`))
                        .catch(err => console.log(err));
                })
                .catch(err => { console.log(err) });

            // if the hoster assigned to classes
            if (assignClassIds.length > 0) {
                assignClassIds.forEach(classId => {
                    // find the members based on given classId
                    Class.findOne({ class_id: classId })
                        .select('name')
                        .select('members')
                        .then(myClass => {
                            const memberIds = myClass.members;
                            memberIds.forEach((memberId) => {
                                const notification = new Notification({
                                    recipient_id: memberId,
                                    sender_id: socket.request.user._id,
                                    type: 'HOST GAME',
                                    content: `${hoster.name} from ${myClass.name} assigned you to play game. (Game Code: ${hoster.gameId})`,
                                    isRead: false
                                });
                                notification.save()
                                    .then(() => console.log(`mongoDB responses success`))
                                    .catch(err => console.log(err));

                                // sending to individual socketid (private message)
                                const users = OnlineUser.getUsers();
                                const onlineUsers = users.filter(user => user.userId.equals(memberId));
                                onlineUsers.forEach((onlineUser) => {
                                    notification_io.getNotificationIO().to(`${onlineUser.socketId}`).emit('new-notification', notification);
                                });
                            });
                        })
                        .catch(err => { console.log(err) });
                });
            };
        };

        // join room
        socket.join(hoster.gameId);
        // console.log(`${hoster.socketId} hoster created new room ${hoster.gameId}`);

        // response to hoster
        callback({
            message: 'host game successful',
            gameId: hoster.gameId,
            isHosted: true,
        });
    });
}

exports.nextQuestion = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('next-question', (btnState, callback) => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;

        // input validation
        if (typeof(btnState) !== 'boolean') {
            console.log('Something went wrong!');
            return;
        };

        if (btnState === true) {
            Quiz.findOne({ _id: hoster.quizId })
                .then((quiz) => {
                    // game over
                    const isGameOver = ((hoster.questionIndex + 1) === quiz.questions.length);

                    if (isGameOver) {
                        // memory
                        hoster.isGameOver = true;
                        Hoster.updateHoster(hoster);

                        // scoreboard should be calculated in advanced to prevent undefined
                        const players = Player.getPlayersByGameId(hoster.gameId);
                        const scoreBoard = players.map((player) => {
                            return {
                                socketId: player.socketId,
                                name: player.name,
                                points: player.points
                            };
                        }).sort((a, b) => b.points - a.points).splice(0, 5);

                        const onlinePlayers = Player.getOnlinePlayersByGameId(hoster.gameId);

                        // mongoDB
                        if (hasToken === true && onlinePlayers.length > 0) {
                            const players = Player.getPlayersByGameId(hoster.gameId);
                            // game accuracy
                            const totalCorrect = players.map((player) => player.correct)
                                .reduce((accumulator, currentValue) => accumulator + currentValue);
                            const totalIncorrect = players.map((player) => player.incorrect)
                                .reduce((accumulator, currentValue) => accumulator + currentValue);
                            const totalUnattempted = players.map((player) => hoster.questionLength - player.correct - player.incorrect)
                                .reduce((accumulator, currentValue) => accumulator + currentValue);
                            const gameAccuracy = Math.floor((totalCorrect / (totalCorrect + totalIncorrect + totalUnattempted) * 100));

                            // player results
                            const playerResults = players.map((player) => {
                                const results = {}
                                results.name = player.name;
                                results.correct = player.correct;
                                results.incorrect = player.incorrect;
                                results.unattempted = hoster.questionLength - player.correct - player.incorrect;
                                results.accuracy = Math.floor((player.correct / (player.correct + player.incorrect + results.unattempted) * 100));
                                return results
                            });

                            HosterReport.updateOne({ "socket_id": hoster.socketId }, {
                                    $set: { "accuracy": gameAccuracy, "scoreboard": scoreBoard, "player_results": playerResults }
                                }, { upsert: true })
                                .then(() => console.log(`mongoDB responses success`))
                                .catch(err => console.log(err));

                            PlayerReport.updateMany({ "game_id": hoster.gameId }, {
                                    $set: { "scoreboard": scoreBoard }
                                }, { upsert: true })
                                .then(() => console.log(`mongoDB responses success`))
                                .catch(err => console.log(err));
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

                    } else {
                        // next question
                        // memory
                        hoster.isGameLive = true;
                        hoster.isQuestionLive = true;
                        hoster.questionIndex += 1;
                        hoster.answeredPlayers = [];
                        hoster.receivedPlayers = [];
                        hoster.questionResults = { choice1: 0, choice2: 0, choice3: 0, choice4: 0 };

                        // shuffle questions
                        if (hoster.settings.suffleQuestions === true) {
                            quiz.questions.sort((a, b) => hoster.shuffledQuestionIds.indexOf(a._id) - hoster.shuffledQuestionIds.indexOf(b._id));
                        };
                        hoster.question = (quiz.questions[hoster.questionIndex]);

                        // shuffle choices
                        if (hoster.settings.suffleAnswerOptions === true) {
                            hoster.question.choices.sort(() => Math.random() - .5);
                        };
                        hoster.questionLength = quiz.questions.length;
                        Hoster.updateHoster(hoster);

                        // response to players
                        const choiceIds = hoster.question.choices.map((choice) => choice._id);

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
                .catch(err => console.log(err));

        } else if (btnState === false) {
            const onlinePlayers = Player.getOnlinePlayersByGameId(hoster.gameId);

            // choices accuracy
            const choicesAccuracy = {};

            calcChoiceAccuracy = (totalChoices, totalPlayers) => {
                return Math.floor((totalChoices / totalPlayers) * 100);
            };

            choicesAccuracy.choice1 = calcChoiceAccuracy(hoster.questionResults.choice1, hoster.receivedPlayers.length);
            choicesAccuracy.choice2 = calcChoiceAccuracy(hoster.questionResults.choice2, hoster.receivedPlayers.length);
            choicesAccuracy.choice3 = calcChoiceAccuracy(hoster.questionResults.choice3, hoster.receivedPlayers.length);
            choicesAccuracy.choice4 = calcChoiceAccuracy(hoster.questionResults.choice4, hoster.receivedPlayers.length);

            if (hasToken === true && onlinePlayers.length > 0) {
                // question results accuracy
                const choiceResults = [];
                const keys = Object.keys(hoster.questionResults);
                hoster.question.choices.forEach((choice, index) => {
                    if (choice.is_correct === true) {
                        choiceResults.push(hoster.questionResults[keys[index]]);
                    };
                });
                const totalChoiceResults = choiceResults.reduce((accumulator, currentValue) => accumulator + currentValue);
                const questionResultsAccuracy = Math.floor((totalChoiceResults / hoster.receivedPlayers.length) * 100);

                // no answers accuracy
                const noAnsAccuracy = Math.floor(((hoster.receivedPlayers.length - hoster.answeredPlayers.length) / hoster.receivedPlayers.length) * 100);

                // mongoDB
                HosterReport.findOneAndUpdate({ "socket_id": hoster.socketId }, {
                        $set: {
                            "questions.$[question].accuracy": questionResultsAccuracy,
                            "questions.$[question].choices.$[choice1].numPlayers": hoster.questionResults.choice1,
                            "questions.$[question].choices.$[choice1].accuracy": choicesAccuracy.choice1,
                            "questions.$[question].choices.$[choice2].numPlayers": hoster.questionResults.choice2,
                            "questions.$[question].choices.$[choice2].accuracy": choicesAccuracy.choice2,
                            "questions.$[question].choices.$[choice3].numPlayers": hoster.questionResults.choice3,
                            "questions.$[question].choices.$[choice3].accuracy": choicesAccuracy.choice3,
                            "questions.$[question].choices.$[choice4].numPlayers": hoster.questionResults.choice4,
                            "questions.$[question].choices.$[choice4].accuracy": choicesAccuracy.choice4,
                            "questions.$[question].numNoAnsPlayers": (hoster.receivedPlayers.length - hoster.answeredPlayers.length),
                            "questions.$[question].noAnsAccuracy": noAnsAccuracy,
                        }
                    }, {
                        arrayFilters: [
                            { "question._id": hoster.question._id },
                            { "choice1._id": hoster.question.choices[0]._id },
                            { "choice2._id": hoster.question.choices[1]._id },
                            { "choice3._id": hoster.question.choices[2]._id },
                            { "choice4._id": hoster.question.choices[3]._id }
                        ],
                        upsert: true
                    })
                    .then(() => console.log(`mongoDB responses success`))
                    .catch(err => console.log(err));

                PlayerReport.updateMany({ "game_id": hoster.gameId }, {
                        $set: {
                            "questions.$[question].choices.$[choice1].accuracy": choicesAccuracy.choice1,
                            "questions.$[question].choices.$[choice2].accuracy": choicesAccuracy.choice2,
                            "questions.$[question].choices.$[choice3].accuracy": choicesAccuracy.choice3,
                            "questions.$[question].choices.$[choice4].accuracy": choicesAccuracy.choice4
                        }
                    }, {
                        arrayFilters: [
                            { "question._id": hoster.question._id },
                            { "choice1._id": hoster.question.choices[0]._id },
                            { "choice2._id": hoster.question.choices[1]._id },
                            { "choice3._id": hoster.question.choices[2]._id },
                            { "choice4._id": hoster.question.choices[3]._id }
                        ],
                        upsert: true
                    })
                    .then(() => console.log(`mongoDB responses success`))
                    .catch(err => console.log(err));
            };
            // scoreboard
            const players = Player.getPlayersByGameId(hoster.gameId);
            const scoreBoard = players.map((player) => {
                return {
                    socketId: player.socketId,
                    name: player.name,
                    points: player.points
                };
            }).sort((a, b) => b.points - a.points).splice(0, 5);

            // response to players
            socket.to(hoster.gameId).emit('get-question-results');

            // response to hoster
            callback({
                nextQuestion: false,
                isGameOver: hoster.isGameOver,
                nextQuestionData: {
                    choicesAccuracy,
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

        // input validation
        if (typeof(timeLeft) !== 'number') {
            console.log('[@hoster time-left] Something went wrong!');
            return;
        };

        // memory
        hoster.timeLeft = timeLeft;
        Hoster.updateHoster(hoster);

        if (timeLeft === 0) {
            hoster.isQuestionLive = false;
            Hoster.updateHoster(hoster);
        };
    });
};