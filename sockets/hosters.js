const io = require('../models/socket').getIO();

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');
const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/hoster_report');

const hosterRoutes = (socket, hasToken) => {
    const userId = socket.request.user._id;

    socket.on('disconnect', (callback) => {
        const hoster = Hoster.getHosterById(socket.id);

        if (!hoster) return;

        if (hoster) {
            socket.to(hoster.gameId).emit('hoster-disconnect');

            Hoster.removeHoster(socket.id);

            console.log(`[disconnect] ${hoster.socketId} hoster has left room ${hoster.gameId}`);
            const hosters = Hoster.getHosters();
            console.log(`[disconnect]`);
            console.log(hosters);
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
        const hoster = new Hoster(socket.id, quizId, gameId);
        // save to memory
        hoster.addHoster();

        // const hosters = Hoster.getHosters();
        // console.log(`[host-game]`);
        // console.log(hosters);

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
                    // response to players
                    socket.to(hoster.gameId).emit('player-game-over');

                    // scoreboard calc
                    const players = Player.getPlayersByGameId(hoster.gameId);

                    const scoreBoard = players.map((player) => {
                            const scorer = {}
                            scorer.name = player.name
                            scorer.score = player.score
                            return scorer
                        }).sort((a, b) => { b.score - a.score })
                        .splice(0, 5);

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

                const choicesId = hoster.question.choices.map((choice) => choice._id);
                // response to players
                socket.to(hoster.gameId).emit('player-next-question', {
                    questionIndex: hoster.questionIndex + 1,
                    questionLength: quiz.questions.length,
                    choicesId
                });
            });
        } else if (btnState == false) {
            // response to hoster
            callback({
                nextQuestion: false,
                nextQuestionData: {
                    summary: hoster.summary
                }
            });
            // response to players
            socket.to(hoster.gameId).emit('open-results');
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