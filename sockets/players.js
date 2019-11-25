const io = require('../models/socket').getIO();
const mongoose = require('mongoose');

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');
const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');

const playerRoutes = (socket, hasToken) => {
    const userId = socket.request.user._id;

    socket.on('disconnect', (callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        if (player) {
            // remove from memory
            Player.removePlayer(socket.id);

            if (hoster) {
                hoster.answeredPlayers = hoster.answeredPlayers.filter((answeredPlayer) => answeredPlayer != socket.id)
                hoster.receivedPlayers = hoster.receivedPlayers.filter((receivedPlayer) => receivedPlayer != socket.id)
                Hoster.updateHoster(hoster);
            };

            // remove from mongoDB
            if (hasToken === true && hoster && hoster.isGameOver === false) {
                PlayerReport.findOneAndRemove({ socket_id: socket.id }, (err, data) => {
                    if (err) {
                        console.log(err);
                        return;
                    };
                    console.log(`[@player disconnect] mongoDB responses success`);
                });
            };

            console.log(`[@player disconnect] ${player.socketId} ${player.name} disconnected from room ${player.gameId}`);

            // show player list
            const players = Player.getPlayersByGameId(player.gameId);
            console.log(`[@player disconnect] player list:`);
            console.log(players.map((player) => {
                return { socketId: player.socketId, name: player.name }
            }));

            // update names of lobby
            if (hoster && hoster.isGameLive === false) {
                const players = Player.getPlayersByGameId(player.gameId);
                const names = players.map((player) => player.name);

                // response to hoster
                io.to(`${hoster.socketId}`).emit('display-name', names);
            };

            // validation of last question
            if (hoster && hoster.isGameLive === true && hoster.isGameOver === false && hoster.isQuestionLive === true) {
                const totalAnsweredPlayers = hoster.answeredPlayers.length;
                const totalReceivedPlayers = hoster.receivedPlayers.length;

                if (totalAnsweredPlayers == totalReceivedPlayers) {
                    hoster.isQuestionLive = false;
                    Hoster.updateHoster(hoster);

                    // response to hoster
                    io.to(hoster.socketId).emit('display-summary');
                };
            };
        };
    });
    socket.on('join-game', function(data, callback) {
        const { name, gameId } = data

        if (!name || !gameId) {
            return callback({
                error: 'all fields are required',
                message: 'join game failed',
                isJoined: false
            })
        }

        const player = Player.getPlayerByName(name);
        const hoster = Hoster.getHosterByGameId(gameId);

        if (!player && hoster) {
            const player = new Player(socket.id, name, gameId);
            // save to memory
            player.addPlayer();
            // save to mongoDB
            Quiz.findOneAndUpdate({ _id: hoster.quizId }, { $inc: { plays: 1 } }, (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                };
                console.log(`[@player join-game] mongoDB responses success`);
            });
            if (hasToken === true) {
                Quiz.findOne({ _id: hoster.quizId }, (err, quiz) => {
                    if (err) {
                        console.log(err);
                        return;
                    };

                    HosterReport.findOne({ game_id: hoster.gameId })
                        .select('_id')
                        .then(hosterReport => {
                            // save to mongoDB
                            const playerReport = new PlayerReport({
                                socket_id: socket.id,
                                game_id: gameId,
                                player: socket.request.user._id,
                                game_name: quiz.title,
                                hoster_name: hoster.name,
                                hoster_report_id: hosterReport._id,
                                questions: quiz.questions
                            });
                            playerReport.save()
                            console.log(`[@player join-game] mongoDB responses success`);
                        });
                });
            };

            // show player list
            const players = Player.getPlayersByGameId(player.gameId);
            console.log(`[@player join-game] player list:`);
            console.log(players.map((player) => {
                return { socketId: player.socketId, name: player.name }
            }));

            // join player to room
            socket.join(player.gameId);
            console.log(`[@player join-game] ${player.socketId} ${player.name} joined room ${player.gameId}`);

            // response to hoster
            const names = players.map((player) => player.name);
            if (hoster.isGameLive === false) {
                io.to(`${hoster.socketId}`).emit('display-name', names);
            };

            // response to player
            callback({
                error: null,
                message: 'join game successful',
                isJoined: true,
                joinGameData: {
                    gameLive: hoster.isGameLive,
                    name
                }
            })

        } else {
            // response to player
            callback({
                error: 'display name or game PIN is invalid',
                message: 'join game failed',
                isJoined: false
            })
        }
    })

    socket.on('receive-question', () => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        if (hoster) {
            hoster.receivedPlayers.push(socket.id);
            Hoster.updateHoster(hoster);
        };

        // reset to false & 0 after receives new question, player did not answer will get these values
        player.didAnswer = false;
        player.responseTime = 0;
        player.currentPoints = 0;
        Player.updatePlayer(player);
    })

    socket.on('player-answer', (choiceId, callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        // Input Validation
        const choicesId = hoster.question.choices.map(choice => {
            return choice._id;
        });

        if (choicesId.includes(choiceId) === false) {
            console.log('[@player player-answer] Something went wrong!');
            return;
        };

        if (hoster.isQuestionLive === true) {
            hoster.answeredPlayers.push(socket.id);
            Hoster.updateHoster(hoster);

            // correct choice ids
            const correctChoicesId = hoster.question.choices
                .filter(choice => choice.is_correct === true)
                .map(correctChoice => correctChoice._id);

            // checking true/false
            const result = correctChoicesId.includes(choiceId)

            if (result === true) {
                const timeScore = Math.floor((hoster.timeLeft / hoster.question.timer) * 1000);
                // previous answer result is true && toggled to 1000
                if (player.answerResult === true && player.points >= 1000) {
                    player.responseTime = hoster.question.timer - hoster.timeLeft;
                    // gain streak
                    player.isLostStreak = false;
                    // maximum streak is 6
                    if (player.streak < 6) {
                        //streak ++
                        player.streak += 1;
                    }
                    player.currentPoints = (timeScore + ((player.streak * 100) - 100));
                    // points (up to 1000 points) + bonus
                    player.points += (timeScore + ((player.streak * 100) - 100));
                    console.log(`bonus ${((player.streak * 100) - 100)}`)
                    player.correct += 1;
                    // update answer result to true
                    player.answerResult = true;
                    player.didAnswer = true;
                    Player.updatePlayer(player);
                    console.log(`[@player player-answer] answerResult: ${true}, streak ${player.streak}`)

                } else {
                    player.responseTime = hoster.question.timer - hoster.timeLeft;
                    // gain streak
                    player.isLostStreak = false;
                    player.currentPoints = timeScore;
                    // points (up to 1000 points) 
                    player.points += timeScore;
                    player.correct += 1;
                    player.answerResult = true;
                    player.didAnswer = true;
                    Player.updatePlayer(player);
                    console.log(`[@player player-answer] answerResult: ${true}, streak ${player.streak}`)
                }

            } else if (result === false) {
                // having streak
                if (player.streak > 0) {
                    // lost streak
                    player.isLostStreak = true;
                    player.streak = 0;
                    Player.updatePlayer(player);
                }
                player.responseTime = hoster.question.timer - hoster.timeLeft;
                player.incorrect += 1;
                player.answerResult = false;
                player.didAnswer = true;
                Player.updatePlayer(player);
                console.log(`[@player player-answer] answerResult: ${false}, streak ${player.streak}`)
            };

            // calculate question results for hoster
            hoster.question.choices.forEach((choice, index) => {
                if (mongoose.Types.ObjectId(choiceId).equals(choice._id)) {
                    hoster.questionResults[Object.keys(hoster.questionResults)[index]] += 1;
                    Hoster.updateHoster(hoster);
                    console.log('hi')
                };
            });

            if (hasToken === true) {

                // save to mongoDB
                PlayerReport.findOneAndUpdate({ "socket_id": socket.id }, {
                        $set: {
                            "questions.$[i].choices.$[j].is_answer": true,
                            "questions.$[i].choices.$[j].response_time": player.responseTime
                        }
                    }, {
                        arrayFilters: [{
                            "i._id": hoster.question._id
                        }, {
                            "j._id": choiceId
                        }],
                        upsert: true
                    },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                            return;
                        };
                        console.log(`[@player player-answer] mongoDB responses success`);
                    });
            };

        } else if (hoster.isQuestionLive === false) {
            // answer is not allowed while question is not live
            console.log(`[@player player-answer] something went wrong!`)
            return;
        };

        const totalAnsweredPlayers = hoster.answeredPlayers.length;
        const totalReceivedPlayers = hoster.receivedPlayers.length;
        // validation of last question
        if (totalAnsweredPlayers == totalReceivedPlayers) {
            hoster.isQuestionLive = false;
            Hoster.updateHoster(hoster);

            // response to hoster
            io.to(hoster.socketId).emit('display-summary');
        };
    });

    socket.on('question-results', (callback) => {
        const player = Player.getPlayerById(socket.id);
        const hoster = Hoster.getHosterByGameId(player.gameId);

        // reset player who did not answer and having streak
        if (player.currentPoints === 0 && player.streak > 0) {
            // lost streak
            player.isLostStreak = true;
            player.streak = 0;
            Player.updatePlayer(player);
        }

        let bonus = 0;
        // calculate player bonus gained
        if (player.currentPoints !== 0 && player.streak > 1) {
            const timeScore = Math.floor(((hoster.question.timer - player.responseTime) / hoster.question.timer) * 1000);
            bonus = (player.currentPoints - timeScore);
        }

        // calculate scoreboard among all players
        const players = Player.getPlayersByGameId(player.gameId);
        const scoreBoard = players.map((player) => {
            return {
                socketId: player.socketId,
                name: player.name,
                points: player.points,
            };
        }).sort((a, b) => b.points - a.points);

        // find current rank among all players
        const currentRank = scoreBoard.findIndex((scorer) => scorer.socketId === socket.id);
        player.rank = currentRank + 1;
        Player.updatePlayer(player);
        console.log(`[@player player-answer] ${player.name}`)
        console.log(`[@player player-answer] current rank: ${currentRank + 1}`);

        // calculate previous distance
        let previousScorerPts = 0;
        let previousScorerName = null;
        let differencePts = null;
        if (currentRank > 0) {
            const previousScorer = scoreBoard[currentRank - 1];
            previousScorerName = previousScorer.name;
            previousScorerPts = previousScorer.points;
            differencePts = (previousScorerPts - player.points);
        }

        // calculate performance statistics
        const unattepmted = (hoster.questionLength - player.correct - player.incorrect);
        console.log(`[@player player-answer] points: ${player.points} correct: ${player.correct} incorrect: ${player.incorrect} unattempted: ${unattepmted}`);

        callback({
            didAnswer: player.didAnswer,
            answerResult: player.answerResult,

            responseTime: player.responseTime,

            isLostStreak: player.isLostStreak,
            streak: player.streak,
            bonus,

            currentPoints: player.currentPoints,
            points: player.points,

            rank: player.rank,
            previousScorerName,
            differencePts
        })
    })

    socket.on('get-overall-results', (callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        const unattempted = (hoster.questionLength - player.correct - player.incorrect);

        // response to player
        callback({
            points: player.points,
            rank: player.rank,
            correct: player.correct,
            incorrect: player.incorrect,
            unattempted
        });

        if (hasToken === true) {
            // save to mongoDB
            PlayerReport.findOneAndUpdate({ "socket_id": socket.id }, {
                $set: { "rank": player.rank, "correct": player.correct, "incorrect": player.incorrect, "unattempted": unattempted }
            }, { upsert: true }, (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                };
                console.log(`[@player get-overall-results] mongoDB responses success`);
            });
        };
    })
};

module.exports = playerRoutes;