const io = require('../models/socket');
const mongoose = require('mongoose');

// controllers
const hostersController = require('../controllers/hosters');
const playersController = require('../controllers/players');
const quizzesController = require('../controllers/quizzes')
const playerReportsController = require('../controllers/player-reports');
const calculationsContoller = require('../controllers/calculations');

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
            playersController.deletePlayer(socket);

            if (hoster) {
                hostersController.removeAnsweredPlayer(hoster, socket);
                hostersController.removeReceivedPlayer(hoster, socket);
            };

            // mongoDB
            if (hasToken === true) {
                if (hoster && hoster.isGameLive === false) {
                    playerReportsController.deletePlayerReport(socket);
                };
            };

            console.log(`[@player disconnect] ${player.socketId} ${player.name} disconnected from room ${player.gameId}`);

            // logging player list
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
                io.getIO().to(`${hoster.socketId}`).emit('display-name', names);
            };

            // validation of last question
            if (hoster && hoster.isGameLive === true && hoster.isGameOver === false && hoster.isQuestionLive === true) {
                const totalAnsweredPlayers = hoster.answeredPlayers.length;
                const totalReceivedPlayers = hoster.receivedPlayers.length;

                if (totalAnsweredPlayers == totalReceivedPlayers) {
                    hostersController.setLastQuestionData(hoster);

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
            return callback({
                error: 'all fields are required',
                message: 'join game failed',
                isJoined: false
            });
        };

        const player = Player.getPlayerByName(name);
        const hoster = Hoster.getHosterByGameId(gameId);

        if (!player && hoster) {
            // memory
            const player = playersController.addPlayer(socket, data);

            // mongoDB
            if (hasToken === true) {
                playerReportsController.addPlayerReport(socket, hoster);
            };

            quizzesController.increasePlays(hoster);

            // join room
            socket.join(player.gameId);
            console.log(`[@player join-game] ${player.socketId} ${player.name} joined room ${player.gameId}`);

            // response to hoster
            const players = Player.getPlayersByGameId(player.gameId);
            const names = players.map((player) => player.name);
            if (hoster.isGameLive === false) {
                io.getIO().to(`${hoster.socketId}`).emit('display-name', names);
            };

            // show player list
            console.log(`[@player join-game] player list:`);
            console.log(players.map((player) => {
                return { socketId: player.socketId, name: player.name }
            }));

            // response to player
            callback({
                error: null,
                message: 'join game successful',
                isJoined: true,
                joinGameData: {
                    gameLive: hoster.isGameLive,
                    name
                }
            });

        } else {
            // response to player
            callback({
                error: 'display name or game PIN is invalid',
                message: 'join game failed',
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

        if (hoster) {
            hostersController.addReceivedPlayer(hoster, socket);
        };

        playersController.setQuestionData(player);
    });
};

exports.getPlayerAnswer = (socket) => {
    const hasToken = socket.request.user.logged_in;

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
            // memory
            hostersController.addAnsweredPlayer(hoster, socket);

            // check whether answer is true/false
            const correctChoiceIds = hoster.question.choices
                .filter(choice => choice.is_correct === true)
                .map(correctChoice => correctChoice._id);

            const result = correctChoiceIds.includes(choiceId);

            if (result === true) {
                playersController.setCorrectAnswerData(player, hoster);
            } else if (result === false) {
                playersController.setWrongAnswerData(player);
            };

            hostersController.addQuestionResults(hoster, choiceId);

            // mongoDB
            if (hasToken === true) {
                playerReportsController.setAnswerResults(player, hoster, choiceId);
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
            hostersController.setLastQuestionData(hoster);

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

        // reset player who did not answer and having streak
        if (player.currentPoints === 0 && player.streak > 0) {
            playersController.setStreakData(player);
        };

        // calculate player bonus gained
        if (player.currentPoints !== 0 && player.streak > 1) {
            bonus = calculationsContoller.calcBonus(hoster, player);
        };

        // calculate scoreboard among all players
        const scoreBoard = calculationsContoller.calcScoreboard(hoster);

        // find current rank among all players
        const currentRank = playersController.setCurrentRank(player, scoreBoard);

        // calculate previous distance
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

        // calculate performance statistics
        const unattepmted = (hoster.questionLength - player.correct - player.incorrect);
        // console.log(`[@player player-answer] points: ${player.points} correct: ${player.correct} incorrect: ${player.incorrect} unattempted: ${unattepmted}`);

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
            playerReportsController.setOverallResults(player, unattempted);
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