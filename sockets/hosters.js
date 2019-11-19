const io = require('../models/socket').getIO();

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');
const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');

const hosterRoutes = (socket, hasToken) => {

    socket.on('disconnect', () => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;
        if (hoster) {
            // remove from memory
            Hoster.removeHoster(socket.id);
            // remove from mongoDB
            if (hasToken === true && hoster && hoster.isGameOver === false) {
                HosterReport.deleteOne({ socket_id: socket.id }, (err, data) => {
                    if (err) {
                        console.log(err);
                        return;
                    };
                    console.log(`[disconenct] hoster report was deleted`);
                });
            };
            console.log(`[disconnect] ${hoster.socketId} hoster has left room ${hoster.gameId}`);
            // show hoster list
            const hosters = Hoster.getHosters();
            console.log(`[disconnect] hoster list:`);
            console.log(hosters.map((hoster) => {
                return { socketId: hoster.socketId, name: hoster.name }
            }));
            // response to players
            socket.to(hoster.gameId).emit('hoster-disconnect');
        };
        const onlinePlayers = Player.getOnlinePlayersByGameId(hoster.gameId);
        // remove from mongoDB
        if (hasToken === true && onlinePlayers.length > 0 && hoster && hoster.isGameOver === false) {
            PlayerReport.deleteMany({ game_id: hoster.gameId }, (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                };
                console.log(`[disconenct] all players report were deleted`);
            });
        };
    });
    socket.on('host-game', (data, callback) => {
        const { quizId } = data;
        if (!quizId) {
            return callback({
                error: 'quizId is not defined',
                message: 'host game failed',
                isHosted: false
            });
        };
        passName = () => {
            if (hasToken === true) { return socket.request.user.name };
        };
        const gameId = Hoster.generateGameId();
        // save to memory
        const hoster = new Hoster(socket.id, quizId, gameId, passName());
        hoster.addHoster();
        // save to mongoDB
        if (hasToken === true) {
            Quiz.findOne({ _id: hoster.quizId }, (err, quiz) => {
                if (err) {
                    console.log(err);
                    return;
                };
                const hosterReport = new HosterReport({
                    socket_id: socket.id,
                    game_id: hoster.gameId,
                    hoster: socket.request.user._id,
                    game_name: quiz.title,
                    questions: quiz.questions
                });
                hosterReport.save((err) => {
                    if (err) {
                        console.log(err);
                        return;
                    };
                    console.log(`[host-game] hoster report was created`);
                });
                // save to memory
                hoster.shuffledQuestionIds = quiz.questions.sort(() => Math.random() - .5).map((q) => q._id);
                Hoster.updateHoster(hoster);
            });
        };
        // show hoster list
        const hosters = Hoster.getHosters();
        console.log(`[host-game] hoster list:`);
        console.log(hosters.map((hoster) => {
            return { socketId: hoster.socketId, name: hoster.name }
        }));
        // join hoster to room
        socket.join(hoster.gameId);
        console.log(`[host-game] ${hoster.socketId} hoster created new room ${hoster.gameId}`);
        // response to hoster
        callback({
            error: null,
            message: 'host game successful',
            isHosted: true,
            gameId
        });
    });
    socket.on('next-question', (btnState, callback) => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;

        if (typeof(btnState) !== 'boolean') {
            console.log('Something went wrong!');
            return;
        };
        if (btnState === true) {
            // initialization
            hoster.isGameLive = true;
            hoster.isQuestionLive = true;
            hoster.questionIndex += 1;
            hoster.answeredPlayers = [];
            hoster.receivedPlayers = [];
            hoster.summary = { c1: 0, c2: 0, c3: 0, c4: 0 };
            Hoster.updateHoster(hoster);
            // get quizzes from mongoDB
            Quiz.findOne({ _id: hoster.quizId }, (err, quiz) => {
                if (err) {
                    console.log(err);
                    return;
                };
                // game over
                if (hoster.questionIndex == quiz.questions.length) {
                    // initialization
                    hoster.isGameOver = true;
                    Hoster.updateHoster(hoster);
                    // calculate scoreboard
                    const players = Player.getPlayersByGameId(hoster.gameId);
                    const scoreBoard = players.map((player) => {
                            const scorer = {}
                            scorer.name = player.name
                            scorer.points = player.points
                            return scorer
                        }).sort((a, b) => { b.points - a.points })
                        .splice(0, 5);

                    const onlinePlayers = Player.getOnlinePlayersByGameId(hoster.gameId);
                    if (hasToken === true && onlinePlayers.length > 0) {
                        // calculate game accuracy
                        const totalCorrect = players.map((player) => player.correct)
                            .reduce((accumulator, currentValue) => accumulator + currentValue);
                        const totalIncorrect = players.map((player) => player.incorrect)
                            .reduce((accumulator, currentValue) => accumulator + currentValue);
                        const totalUnattempted = players.map((player) => hoster.questionLength - player.correct - player.incorrect)
                            .reduce((accumulator, currentValue) => accumulator + currentValue);
                        const gameAccuracy = Math.floor((totalCorrect / (totalCorrect + totalIncorrect + totalUnattempted) * 100));
                        // calculate player results
                        const playersResults = players.map((player) => {
                            const results = {}
                            results.name = player.name;
                            results.correct = player.correct;
                            results.incorrect = player.incorrect;
                            results.unattempted = hoster.questionLength - player.correct - player.incorrect;
                            results.accuracy = Math.floor((player.correct / (player.correct + player.incorrect + results.unattempted) * 100));
                            return results
                        });
                        // save to mongoDB
                        HosterReport.findOneAndUpdate({ "socket_id": socket.id }, {
                            $set: { "accuracy": gameAccuracy, "scoreboard": scoreBoard, "player_results": playersResults }
                        }, { upsert: true }, (err, data) => {
                            if (err) {
                                console.log(err);
                                return;
                            };
                            console.log(`[scoreboard] hoster report was updated`);
                        });
                        PlayerReport.updateMany({ "game_id": hoster.gameId }, {
                            $set: { "scoreboard": scoreBoard }
                        }, { upsert: true }, (err, data) => {
                            if (err) {
                                console.log(err);
                                return;
                            };
                            console.log(`[scoreboard] player report was updated`);
                        });
                    };
                    // response to players
                    socket.to(hoster.gameId).emit('player-game-over');
                    // response to hoster
                    return callback({
                        nextQuestion: 0,
                        nextQuestionData: {
                            scoreBoard
                        }
                    });
                };
                // next question
                const shuffledQuestion = true;
                const shuffledChoices = true;
                // shuffle questions
                if (shuffledQuestion === true) {
                    quiz.questions.sort((a, b) => {
                        return hoster.shuffledQuestionIds.indexOf(a._id) - hoster.shuffledQuestionIds.indexOf(b._id);
                    });
                };
                hoster.question = (quiz.questions[hoster.questionIndex]);
                // shuffle choices
                if (shuffledChoices === true) {
                    hoster.question.choices.sort(() => Math.random() - .5);
                };
                hoster.questionLength = quiz.questions.length;
                Hoster.updateHoster(hoster);
                // response to players
                const choicesId = hoster.question.choices.map((choice) => choice._id);
                socket.to(hoster.gameId).emit('player-next-question', {
                    questionIndex: hoster.questionIndex + 1,
                    questionLength: quiz.questions.length,
                    choicesId
                });
                // response to hoster
                callback({
                    nextQuestion: true,
                    nextQuestionData: {
                        question: hoster.question,
                        gameId: hoster.gameId
                    }
                });
            });
        } else if (btnState === false) {
            const onlinePlayers = Player.getOnlinePlayersByGameId(hoster.gameId);
            if (hasToken === true && onlinePlayers.length > 0) {
                // calculate question accuracy
                calcQuestionAccuracy = () => {
                    const choicesSummary = [];
                    const keys = Object.keys(hoster.summary);

                    hoster.question.choices.forEach((choice, index) => {
                        if (choice.is_correct === true) {
                            choicesSummary.push(hoster.summary[keys[index]]);
                        };
                    });
                    const totalChoicesSummary = choicesSummary.reduce((accumulator, currentValue) => accumulator + currentValue);
                    return Math.floor((totalChoicesSummary / hoster.receivedPlayers.length) * 100);
                };
                const questionAccuracy = calcQuestionAccuracy();
                // calculate choice accuracy
                calcChoiceAccuracy = (totalChoices, totalPlayers) => {
                    return Math.floor((totalChoices / totalPlayers) * 100);
                }
                const choicesAccuracy = {};
                choicesAccuracy.c1 = calcChoiceAccuracy(hoster.summary.c1, hoster.receivedPlayers.length);
                choicesAccuracy.c2 = calcChoiceAccuracy(hoster.summary.c2, hoster.receivedPlayers.length);
                choicesAccuracy.c3 = calcChoiceAccuracy(hoster.summary.c3, hoster.receivedPlayers.length);
                choicesAccuracy.c4 = calcChoiceAccuracy(hoster.summary.c4, hoster.receivedPlayers.length);
                const noAnsAccuracy = Math.floor(((hoster.receivedPlayers.length - hoster.answeredPlayers.length) / hoster.receivedPlayers.length) * 100);
                // save to mongoDB
                PlayerReport.updateMany({ "game_id": hoster.gameId }, {
                        $set: {
                            "questions.$[q].choices.$[c1].accuracy": choicesAccuracy.c1,
                            "questions.$[q].choices.$[c2].accuracy": choicesAccuracy.c2,
                            "questions.$[q].choices.$[c3].accuracy": choicesAccuracy.c3,
                            "questions.$[q].choices.$[c4].accuracy": choicesAccuracy.c4
                        }
                    }, {
                        arrayFilters: [
                            { "q._id": hoster.question._id },
                            { "c1._id": hoster.question.choices[0]._id },
                            { "c2._id": hoster.question.choices[1]._id },
                            { "c3._id": hoster.question.choices[2]._id },
                            { "c4._id": hoster.question.choices[3]._id }
                        ],
                        upsert: true
                    },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                            return;
                        };
                        console.log(`[accuracy] player report was updated`);
                    });
                HosterReport.findOneAndUpdate({ "socket_id": socket.id }, {
                        $set: {
                            "questions.$[q].accuracy": questionAccuracy,
                            "questions.$[q].choices.$[c1].accuracy": choicesAccuracy.c1,
                            "questions.$[q].choices.$[c2].accuracy": choicesAccuracy.c2,
                            "questions.$[q].choices.$[c3].accuracy": choicesAccuracy.c3,
                            "questions.$[q].choices.$[c4].accuracy": choicesAccuracy.c4,
                            "questions.$[q].noAnsAccuracy": noAnsAccuracy,
                        }
                    }, {
                        arrayFilters: [
                            { "q._id": hoster.question._id },
                            { "c1._id": hoster.question.choices[0]._id },
                            { "c2._id": hoster.question.choices[1]._id },
                            { "c3._id": hoster.question.choices[2]._id },
                            { "c4._id": hoster.question.choices[3]._id }
                        ],
                        upsert: true
                    },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                            return;
                        };
                        console.log(`[accuracy] hoster report was updated`);
                    });
            };
            // response to players
            socket.to(hoster.gameId).emit('open-results');
            // response to hoster
            callback({
                nextQuestion: false,
                nextQuestionData: {
                    summary: hoster.summary
                }
            });
        };
    });
    socket.on('time-left', (timeLeft) => {
        const hoster = Hoster.getHosterById(socket.id);
        if (!hoster) return;

        if (typeof(timeLeft) !== 'number') {
            console.log('Something went wrong!');
            return;
        };

        hoster.timeLeft = timeLeft;
        Hoster.updateHoster(hoster);

        if (timeLeft === 0) {
            hoster.isQuestionLive = false;
            Hoster.updateHoster(hoster);
        };
    })
};

module.exports = hosterRoutes;