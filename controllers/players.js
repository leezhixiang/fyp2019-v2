const io = require('../models/socket');
const mongoose = require('mongoose');

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');

const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');

exports.disconnect = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('disconnect', (callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        if (player) {
            // memory
            Player.removePlayer(player.socketId);

            // console.log(`${player.socketId} ${player.name} disconnected from room ${player.gameId}`);

            // logging player list
            const players = Player.getPlayersByGameId(player.gameId);
            const playerList = players.map((player) => { return { socketId: player.socketId, name: player.name } })
            console.log(playerList);

            if (hoster) {
                hoster.answeredPlayers = hoster.answeredPlayers.filter((answeredPlayer) => answeredPlayer != player.socketId)
                hoster.receivedPlayers = hoster.receivedPlayers.filter((receivedPlayer) => receivedPlayer != player.socketId)
                Hoster.updateHoster(hoster);
            };

            // mongoDB
            if (hasToken === true) {
                if (hoster && hoster.isGameLive === false) {
                    PlayerReport.deleteOne({ socket_id: player.socketId }, )
                        .then(() => { console.log(`mongoDB responses success`) })
                        .catch(err => { console.log(err) });
                };
            };

            // update player names
            if (hoster && hoster.isGameLive === false) {
                const players = Player.getPlayersByGameId(player.gameId);
                const names = players.map((player) => player.name);

                // response to hoster
                io.getIO().to(`${hoster.socketId}`).emit('display-name', names);
            };

            // checking of last question
            if (hoster && hoster.isGameLive === true && hoster.isGameOver === false && hoster.isQuestionLive === true) {
                const totalAnsweredPlayers = hoster.answeredPlayers.length;
                const totalReceivedPlayers = hoster.receivedPlayers.length;

                if (totalAnsweredPlayers == totalReceivedPlayers) {
                    hoster.isQuestionLive = false;
                    Hoster.updateHoster(hoster);

                    // response to hoster
                    io.getIO().to(hoster.socketId).emit('display-summary');
                };
            };
        };
    });
};

exports.joinGame = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('join-game', (data, callback) => {
        const { name, gameId } = data;

        if (!name || !gameId) {
            console.log(`Something went wrong!`);
            return callback({
                message: 'join game failed',
                error: 'all fields are required',
                isJoined: false
            });
        };
        const player = Player.getPlayerByName(name);
        const hoster = Hoster.getHosterByGameId(gameId);

        if (!player && hoster) {
            // memory
            const player = new Player(socket.id, name, gameId);
            player.addPlayer();

            // logging player list
            const players = Player.getPlayersByGameId(player.gameId);
            const playerList = players.map((player) => { return { socketId: player.socketId, name: player.name } })
            console.log(playerList);

            // mongoDB
            Quiz.findOneAndUpdate({ _id: hoster.quizId }, { $inc: { plays: 1 } })
                .then(() => { console.log(`mongoDB responses success`) })
                .catch(err => { console.log(err) });

            if (hasToken) {
                const promises = [
                    Quiz.findOne({ _id: hoster.quizId }).exec(),
                    HosterReport.findOne({ game_id: hoster.gameId }).select('_id').exec()
                ];

                Promise.all(promises)
                    .then((results) => {
                        const quiz = results[0];
                        const hosterReport = results[1];
                        const playerReport = new PlayerReport({
                            socket_id: socket.id,
                            game_id: hoster.gameId,
                            player: socket.request.user._id,
                            game_name: quiz.title,
                            hoster_name: hoster.name,
                            hoster_report_id: hosterReport._id,
                            questions: quiz.questions
                        });
                        playerReport.save()
                            .then(() => console.log(`mongoDB responses success`))
                            .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
            };

            // join room
            socket.join(player.gameId);
            // console.log(`${player.socketId} ${player.name} joined room ${player.gameId}`);

            // response to hoster
            const onlinePlayers = Player.getPlayersByGameId(player.gameId);
            const names = onlinePlayers.map((player) => player.name);

            if (hoster.isGameLive === false) {
                io.getIO().to(`${hoster.socketId}`).emit('display-name', names);
            };

            // response to player
            callback({
                message: 'join game successful',
                joinGameData: {
                    gameLive: hoster.isGameLive,
                    name: player.name
                },
                isJoined: true,
            });

        } else {
            // response to player
            callback({
                message: 'join game failed',
                error: 'display name or game PIN is invalid',
                isJoined: false
            });
        };
    });
};

exports.getReceivedQuestion = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('receive-question', () => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        // memory
        if (hoster) {
            hoster.receivedPlayers.push(player.socketId);
            Hoster.updateHoster(hoster);
        };

        // reset to false & 0 after receives new question, player did not answer will get these values
        player.didAnswer = false;
        player.responseTime = 0;
        player.currentPoints = 0;
        Player.updatePlayer(player);
    });
};

exports.getPlayerAnswer = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('player-answer', (choiceId, callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        // Input Validation
        const choicesId = hoster.question.choices.map(choice => choice._id);

        if (choicesId.includes(choiceId) === false) {
            console.log(`Something went wrong!`);
            return;
        };

        if (hoster.isQuestionLive === false) {
            console.log(`Something went wrong!`);
            return;
        } else if (hoster.isQuestionLive === true) {
            // memory
            hoster.answeredPlayers.push(socket.id);
            Hoster.updateHoster(hoster);

            // question results
            hoster.question.choices.forEach((choice, index) => {
                if (mongoose.Types.ObjectId(choiceId).equals(choice._id)) {
                    hoster.questionResults[Object.keys(hoster.questionResults)[index]] += 1;
                    Hoster.updateHoster(hoster);
                };
            });

            // check whether answer is true/false
            const correctChoiceIds = hoster.question.choices
                .filter(choice => choice.is_correct === true)
                .map(correctChoice => correctChoice._id);
            const result = correctChoiceIds.includes(choiceId);

            if (result === true) {
                const timeScore = Math.floor((hoster.timeLeft / hoster.question.timer) * 1000);

                // previous answer result is true && toggled to 1000
                if (player.answerResult === true && player.points >= 1000) {
                    player.didAnswer = true;
                    player.answerResult = true;

                    // gain streak
                    player.isLostStreak = false;
                    // maximum streak is 6
                    if (player.streak < 7) {
                        //streak ++
                        player.streak += 1;
                    };

                    player.responseTime = hoster.question.timer - hoster.timeLeft;
                    // points (up to 1000 points) = timeScore + bonus
                    player.currentPoints = (timeScore + ((player.streak * 100) - 100));
                    player.points += (timeScore + ((player.streak * 100) - 100));
                    player.correct += 1;
                    Player.updatePlayer(player);

                } else {
                    player.didAnswer = true;
                    player.answerResult = true;

                    // gain streak
                    player.isLostStreak = false;
                    player.responseTime = hoster.question.timer - hoster.timeLeft;
                    // points = timeScore
                    player.currentPoints = timeScore;
                    player.points += timeScore;
                    player.correct += 1;
                    Player.updatePlayer(player);
                };

            } else if (result === false) {
                player.didAnswer = true;
                player.answerResult = false;

                // having streak
                if (player.streak > 0) {
                    // lost streak
                    player.isLostStreak = true;
                    player.streak = 0;
                    Player.updatePlayer(player);
                } else {
                    player.isLostStreak = false;
                    player.streak = 0;
                    Player.updatePlayer(player);
                }
                player.responseTime = hoster.question.timer - hoster.timeLeft;
                player.incorrect += 1;
                Player.updatePlayer(player);
            };

            // mongoDB
            if (hasToken === true) {
                PlayerReport.updateOne({ "socket_id": player.socketId }, {
                        $set: {
                            "questions.$[i].choices.$[j].is_answer": true,
                            "questions.$[i].choices.$[j].response_time": player.responseTime
                        }
                    }, { arrayFilters: [{ "i._id": hoster.question._id }, { "j._id": choiceId }], upsert: true })
                    .then(() => console.log(`mongoDB responses success`))
                    .catch(err => console.log(err));
            };
        };

        // checking of last question
        const totalAnsweredPlayers = hoster.answeredPlayers.length;
        const totalReceivedPlayers = hoster.receivedPlayers.length;

        if (totalAnsweredPlayers === totalReceivedPlayers) {
            hoster.isQuestionLive = false;
            Hoster.updateHoster(hoster);

            // response to hoster
            io.getIO().to(hoster.socketId).emit('display-summary');
        };
    });
};

exports.getQuestionResults = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('question-results', (callback) => {
        const player = Player.getPlayerById(socket.id);
        const hoster = Hoster.getHosterByGameId(player.gameId);
        let bonus = 0;

        if (player.currentPoints === 0) {
            player.answerResult = false;
            Player.updatePlayer(player);
            // reset player who did not answer and having streak
            if (player.streak > 0) {
                // lost streak
                player.isLostStreak = true;
                player.streak = 0;
                Player.updatePlayer(player);
            };
        };

        // calculate player bonus gained
        if (player.currentPoints !== 0 && player.streak > 1) {
            const timeScore = Math.floor(((hoster.question.timer - player.responseTime) / hoster.question.timer) * 1000);
            bonus = player.currentPoints - timeScore;
        };

        // rank among all players
        const players = Player.getPlayersByGameId(hoster.gameId);
        const scoreBoard = players.map((player) => {
            return {
                socketId: player.socketId,
                name: player.name,
                points: player.points
            };
        }).sort((a, b) => b.points - a.points).splice(0, 5);
        const currentRank = scoreBoard.findIndex((scorer) => scorer.socketId === player.socketId);
        player.rank = currentRank + 1;
        Player.updatePlayer(player);

        // previous distance
        let previousScorerName = null;
        let previousScorerPts = 0;
        let differencePts = null;

        // not the 1st rank
        if (currentRank > 0) {
            const previousScorer = scoreBoard[currentRank - 1];
            previousScorerName = previousScorer.name;
            previousScorerPts = previousScorer.points;
            differencePts = (previousScorerPts - player.points);
        };

        callback({
            didAnswer: player.didAnswer,
            answerResult: player.answerResult,
            //
            isLostStreak: player.isLostStreak,
            streak: player.streak,
            bonus,
            //
            responseTime: player.responseTime,
            currentPoints: player.currentPoints,
            points: player.points,
            rank: player.rank,
            correct: player.correct,
            incorrect: player.incorrect,
            unattepmted: (hoster.questionLength - player.correct - player.incorrect),
            // previous distance
            previousScorerName,
            differencePts
        });
    });
};

exports.getOverallResults = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('get-overall-results', (callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        const unattempted = (hoster.questionLength - player.correct - player.incorrect);

        // mongoDB
        if (hasToken === true) {
            PlayerReport.updateOne({ "socket_id": player.socketId }, {
                    $set: { "points": player.points, "rank": player.rank, "correct": player.correct, "incorrect": player.incorrect, "unattempted": unattempted }
                }, { upsert: true })
                .then(() => console.log(`mongoDB responses success`))
                .catch(err => console.log(err));
        };

        // response to player
        callback({
            points: player.points,
            rank: player.rank,
            correct: player.correct,
            incorrect: player.incorrect,
            unattempted
        });
    });
};