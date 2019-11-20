const io = require('../models/socket').getIO()

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
                    console.log(`[@player disconnection] player report was deleted from mongoDB`);
                });
            };

            console.log(`[@player disconnection] ${player.socketId} ${player.name} disconnected from room ${player.gameId}`);

            // show player list
            const players = Player.getPlayersByGameId(player.gameId);
            console.log(`[@player disconnection] player list:`);
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
                    // response to player
                    io.in(hoster.gameId).emit('open-results');

                    console.log('[@player disconnection] all players have answered');
                    // console.log(`[last-question] answered players: ${hoster.answeredPlayers}`);
                    // console.log(`[last-question] received players: ${hoster.receivedPlayers}`);
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
                console.log(`[@player game joint] plays number was updated to mongoDB`);
            });
            if (hasToken === true) {
                Quiz.findOne({ _id: hoster.quizId }, (err, quiz) => {
                    if (err) {
                        console.log(err);
                        return;
                    };
                    // save to mongoDB
                    const playerReport = new PlayerReport({
                        socket_id: socket.id,
                        game_id: gameId,
                        player: socket.request.user._id,
                        game_name: quiz.title,
                        hoster_name: hoster.name,
                        questions: quiz.questions
                    });
                    playerReport.save()
                    console.log(`[@player game joint] player report was saved to mongoDB`);
                });
            };

            // show player list
            const players = Player.getPlayersByGameId(player.gameId);
            console.log(`[@player game joint] player list:`);
            console.log(players.map((player) => {
                return { socketId: player.socketId, name: player.name }
            }));

            // join player to room
            socket.join(player.gameId);
            console.log(`[@player game joint] ${player.socketId} ${player.name} joined room ${player.gameId}`);

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

            // console.log(`[@player question reception] answered players: ${hoster.answeredPlayers}`)
            // console.log(`[@player question reception] received players: ${hoster.receivedPlayers}`)
        }
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
            console.log('[@player answer submission] Something went wrong!');
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
                const timeScore = Math.floor((hoster.timeLeft / hoster.question.timer) * 100);
                player.points += (100 + timeScore);
                player.correct += 1;
                Player.updatePlayer(player);

                // response to player
                callback(true);

            } else if (result === false) {
                player.incorrect += 1;
                Player.updatePlayer(player);

                // response to player
                callback(false);
            };

            // calculate summary
            hoster.question.choices.forEach((choice, index) => {
                if (choice._id == choiceId) {
                    hoster.summary[Object.keys(hoster.summary)[index]] += 1;
                    Hoster.updateHoster(hoster);
                };
            });

            if (hasToken === true) {
                // save to mongoDB
                PlayerReport.findOneAndUpdate({ "socket_id": socket.id }, { $set: { "questions.$[i].choices.$[j].is_answer": true } }, {
                        arrayFilters: [{ "i._id": hoster.question._id }, { "j._id": choiceId }],
                        upsert: true
                    },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                            return;
                        };
                        console.log(`[@player answer submission] player answer was saved to mongoDB`);
                    });
            };

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
            console.log(`[@player answer submission] current rank: ${currentRank + 1}`);

            // splice a top 5 scoreboard
            const top5ScoreBoard = scoreBoard.splice(0, 5).map((player) => {
                return {
                    name: player.name,
                    points: player.points
                };
            });
            console.log(`[@player answer submission] top 5 scoreboard:`);
            console.log(top5ScoreBoard);

            // calculate performance statistics
            const unattepmted = (hoster.questionLength - player.correct - player.incorrect);
            console.log(`[@player answer submission] points: ${player.points} correct: ${player.correct} incorrect: ${player.incorrect} unattempted: ${unattepmted}`);

        } else if (hoster.isQuestionLive === false) {
            // answer is not allowed while question is not live
            callback(false);
        };

        const totalAnsweredPlayers = hoster.answeredPlayers.length;
        const totalReceivedPlayers = hoster.receivedPlayers.length;
        // validation of last question
        if (totalAnsweredPlayers == totalReceivedPlayers) {
            hoster.isQuestionLive = false;
            Hoster.updateHoster(hoster);

            // response to hoster
            io.to(hoster.socketId).emit('display-summary');
            // response to player
            io.in(hoster.gameId).emit('open-results');

            console.log(`[@player answer submission] all players have answered`);
            // console.log(`[last-question] answered players: ${hoster.answeredPlayers}`);
            // console.log(`[last-question] received players: ${hoster.receivedPlayers}`);
        };
    });

    socket.on('get-overall-result', (callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        const unattempted = (hoster.questionLength - player.correct - player.incorrect);

        // response to player
        callback({
            points: player.points,
            correct: player.correct,
            incorrect: player.incorrect,
            unattempted
        });

        if (hasToken === true) {
            // save to mongoDB
            PlayerReport.findOneAndUpdate({ "socket_id": socket.id }, {
                $set: { "correct": player.correct, "incorrect": player.incorrect, "unattempted": unattempted }
            }, { upsert: true }, (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                };
                console.log(`[@player overall result generation] player results were saved in mongoDB`);
            });
        };
    })
};

module.exports = playerRoutes;