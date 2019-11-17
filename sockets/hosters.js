const io = require('../models/socket').getIO();

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');
const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');

const hosterRoutes = (socket, hasToken) => {

    socket.on('disconnect', (callback) => {
        const hoster = Hoster.getHosterById(socket.id);

        if (!hoster) return;

        if (hoster) {
            socket.to(hoster.gameId).emit('hoster-disconnect');

            // remove from mongoDB
            if (hasToken === true && hoster && hoster.isGameOver === false) {
                HosterReport.deleteOne({ socket_id: socket.id }, (err, data) => {
                    if (err) throw err;
                    console.log(`[disconenct] hoster report was deleted`);
                });
            }
            // remove from memory
            Hoster.removeHoster(socket.id);

            console.log(`[disconnect] ${hoster.socketId} hoster has left room ${hoster.gameId}`);

            const hosters = Hoster.getHosters();
            console.log(`[disconnect] hoster list:`);
            // console.log(hosters);
            console.log(hosters.map((hoster) => {
                return {
                    socketId: hoster.socketId,
                    name: hoster.name
                }
            }));
        }

        // remove from mongoDB
        if (hasToken === true && hoster && hoster.isGameOver === false) {
            PlayerReport.deleteMany({ game_id: hoster.gameId }, (err, data) => {
                if (err) throw err;
                console.log(`[disconenct] all players report were deleted`);
            });
        }
    });

    socket.on('host-game', (data, callback) => {
        const { quizId } = data;

        if (!quizId) {
            return callback({
                error: 'quizId is not defined',
                message: 'host game failed',
                isHosted: false
            });
        }

        const gameId = Hoster.generateGameId();

        // save hoster to memory
        passName = () => {
            if (hasToken === true) {
                return socket.request.user.name;
            }
        };

        const hoster = new Hoster(socket.id, quizId, gameId, passName());
        hoster.addHoster();

        // save hoster to mongoDB
        if (hasToken === true) {
            Quiz.findOne({ _id: hoster.quizId }, (err, quiz) => {
                if (err) throw err;

                const hosterReport = new HosterReport({
                    socket_id: socket.id,
                    game_id: hoster.gameId,
                    hoster: socket.request.user._id,
                    game_name: quiz.title,
                    questions: quiz.questions
                });
                hosterReport.save()
                console.log(`[host-game] hoster report was created`);
            });
        }

        const hosters = Hoster.getHosters();
        console.log(`[host-game] hoster list:`);
        // console.log(hosters);
        console.log(hosters.map((hoster) => {
            return {
                socketId: hoster.socketId,
                name: hoster.name
            }
        }));

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

        if (btnState === true) {
            hoster.isGameLive = true;
            hoster.isQuestionLive = true;
            hoster.questionIndex += 1;
            hoster.answeredPlayers = [];
            hoster.receivedPlayers = [];
            hoster.summary = { c1: 0, c2: 0, c3: 0, c4: 0 };
            Hoster.updateHoster(hoster);

            Quiz.findOne({ _id: hoster.quizId }, (err, quiz) => {
                if (err) throw err;

                if (hoster.questionIndex == quiz.questions.length) {
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

                    const playersResults = players.map((player) => {
                        const playerResults = {}
                        playerResults.name = player.name;
                        playerResults.correct = player.correct;
                        playerResults.incorrect = player.incorrect;
                        playerResults.unattempted = hoster.questionLength - player.correct - player.incorrect;
                        playerResults.accuracy = Math.floor((player.correct / (player.correct + player.incorrect + playerResults.unattempted) * 100));
                        return playerResults
                    });

                    const totalCorrect = players.map((player) => player.correct)
                        .reduce((accumulator, currentValue) => accumulator + currentValue);
                    const totalIncorrect = players.map((player) => player.incorrect)
                        .reduce((accumulator, currentValue) => accumulator + currentValue);
                    const totalUnattempted = players.map((player) => hoster.questionLength - player.correct - player.incorrect)
                        .reduce((accumulator, currentValue) => accumulator + currentValue);

                    const gameAccuracy = Math.floor((totalCorrect / (totalCorrect + totalIncorrect + totalUnattempted) * 100));

                    // save to mongoDB
                    HosterReport.findOneAndUpdate({ "socket_id": socket.id }, {
                        $set: { "accuracy": gameAccuracy, "scoreboard": scoreBoard, "player_results": playersResults }
                    }, { upsert: true }, (err, data) => {
                        if (err) throw err;
                        console.log(`[scoreboard] hoster report was updated`);
                    });

                    PlayerReport.updateMany({ "game_id": hoster.gameId }, {
                        $set: { "scoreboard": scoreBoard }
                    }, { upsert: true }, (err, data) => {
                        if (err) throw err;
                        console.log(`[scoreboard] player report was updated`);
                    });

                    // response to players
                    socket.to(hoster.gameId).emit('player-game-over');

                    // response to hoster
                    return callback({
                        nextQuestion: 0,
                        nextQuestionData: {
                            scoreBoard
                        }
                    })
                }

                hoster.question = quiz.questions[hoster.questionIndex];
                hoster.questionLength = quiz.questions.length;
                Hoster.updateHoster(hoster);

                // response to hoster
                callback({
                    nextQuestion: true,
                    nextQuestionData: {
                        question: hoster.question,
                        gameId: hoster.gameId
                    }
                });
                // response to players
                const choicesId = hoster.question.choices.map((choice) => choice._id);

                socket.to(hoster.gameId).emit('player-next-question', {
                    questionIndex: hoster.questionIndex + 1,
                    questionLength: quiz.questions.length,
                    choicesId
                });
            });
        } else if (btnState === false) {
            // response to hoster
            callback({
                nextQuestion: false,
                nextQuestionData: {
                    summary: hoster.summary
                }
            });
            // response to players
            socket.to(hoster.gameId).emit('open-results');

            // calculate choice accuracy
            calcChoiceAccuracy = (totalAnswered, totalPlayers) => {
                return Math.floor((totalAnswered / totalPlayers) * 100);
            }
            const choicesAccuracy = {};
            choicesAccuracy.c1 = calcChoiceAccuracy(hoster.summary.c1, hoster.receivedPlayers.length);
            choicesAccuracy.c2 = calcChoiceAccuracy(hoster.summary.c2, hoster.receivedPlayers.length);
            choicesAccuracy.c3 = calcChoiceAccuracy(hoster.summary.c3, hoster.receivedPlayers.length);
            choicesAccuracy.c4 = calcChoiceAccuracy(hoster.summary.c4, hoster.receivedPlayers.length);

            // save accuracy to mongoDB
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
                    if (err) throw err;
                    console.log(`[accuracy] player report was updated`);
                });
        }
    })

    socket.on('time-left', (timeLeft) => {
        const hoster = Hoster.getHosterById(socket.id);

        if (!hoster) return;

        if (hoster) {
            hoster.timeLeft = timeLeft;
            Hoster.updateHoster(hoster);
        }

        if (timeLeft === 0) {
            hoster.isQuestionLive = false;
            Hoster.updateHoster(hoster);
        }
    })
};

module.exports = hosterRoutes;


















// const hoster = Hoster.getHosterById(socket.id)

// if (hoster) {
//     Hoster.removeHoster(socket.id)

//     if (hoster.isGameLive === false) {
//         HosterReport.findOneAndRemove({ socket_id: socket.id }, (err, data) => {
//             if (!err) {
//                 console.log(`[disconenct] deleted hoster report`);
//             }
//         });
//     }

//     console.log(`[disconenct] ${socket.id} has left from room ${hoster.gameId}`);
// console.log(`[disconenct]`)
// console.log(Hoster.getHosters())
// }

// socket.on('host-game', (quizId, callback) => {
//     Quiz.findById(quizId)
//         .then(quiz => {
//             if (!quiz) {
//                 // callback(isHosted, message, gameId)
//                 return callback({
//                     isHosted: false,
//                     message: 'failed to host game as quiz doest not exist'
//                 })
//             }

//             const gameId = Hoster.generateRandomPIN()
//             const hoster = new Hoster(socket.request.user._id, socket.id, quizId, gameId);

//             hoster.addHoster();

//             // save to mongoDB
//             const hosterReport = new HosterReport({
//                 socket_id: socket.id,
//                 game_id: gameId,
//                 hoster: socket.request.user._id,
//                 game_name: quiz.title,
//                 questions: quiz.questions
//             });

//             hosterReport.save()

//             socket.join(hoster.gameId);
//             console.log(`[host-game] ${hoster.socketId} ${socket.request.user.name} hoster created new room ${hoster.gameId}`);
//             // console.log('[host-game]');
//             // console.log(Hoster.getHosters());
//             // callback(isHosted, message, gameId)
//             callback({
//                 isHosted: true,
//                 message: 'succeed to host game',
//                 gameId: hoster.gameId
//             })
//         })
//         .catch(err => {
//             console.log(`[host-game] ${err.message}`);
//             // callback(isHosted, message, gameId)
//             callback({
//                 isHosted: false,
//                 message: err.message
//             })
//         });
// });

// socket.on('next-question', (btnState, callback) => {
//     const hoster = Hoster.getHosterById(socket.id)

//     if (btnState == true) {
//         Quiz.findOne({ _id: hoster.quizId })
//             .then(quiz => {
//                 hoster.isGameLive = true;
//                 hoster.isQuestionLive = true;
//                 hoster.questionIndex += 1;
//                 hoster.answeredPlayers = [];
//                 hoster.receivedPlayers = [];
//                 hoster.summary = {}
//                 Hoster.updateHoster(hoster)

//                 if (questionIndex === quiz.questions.length) {
//                     console.log('Game Over')
//                 }

//                 console.log(`Current Question ${questionIndex + 1} | Total Question: ${quiz.questions.length}`)

//                 const question = quiz.questions[currentIndex];
//                 callback({ isStarted: true, question, gameId: hoster.gameId })
//             })
//             .catch((err) => {
//                 console.log(err)
//             })

//     } else if (btnState == false) {

//         hoster.setQuestionLive(existingHoster.pin, false);
//         console.log(hoster.summary)

//         // callback(false, data);
//         // socket.to(hoster.gameId).emit('open');
//     }






// })