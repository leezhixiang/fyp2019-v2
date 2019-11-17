const io = require('../models/socket').getIO()

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');
const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/hoster_report');

const playerRoutes = (socket) => {
    const userId = socket.request.user._id;

    socket.on('disconnect', (callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        if (player) {
            Player.removePlayer(socket.id);

            if (hoster) {
                hoster.answeredPlayers = hoster.answeredPlayers.filter((answeredPlayer) => answeredPlayer != socket.id)
                hoster.receivedPlayers = hoster.receivedPlayers.filter((receivedPlayer) => receivedPlayer != socket.id)
                Hoster.updateHoster(hoster);
            }

            console.log(`[disconnect] ${player.socketId} ${player.name} disconnected from room ${player.gameId}`)
            const players = Player.getPlayersByGameId(player.gameId);
            console.log(`[disconnect]`);
            console.log(players);

            // update names of lobby
            if (hoster && hoster.isGameLive == false) {
                const players = Player.getPlayersByGameId(player.gameId);
                const names = players.map((player) => player.name);
                // response to hoster
                io.to(`${hoster.socketId}`).emit('display-name', names);
            }

            // validation of last question
            if (hoster && hoster.isGameLive === true && hoster.isQuestionLive === true) {
                const totalAnsweredPlayers = hoster.answeredPlayers.length;
                const totalReceivedPlayers = hoster.receivedPlayers.length;

                if (totalAnsweredPlayers == totalReceivedPlayers) {
                    console.log('[checking] all answered');
                    console.log(`[checking] answered players: ${hoster.answeredPlayers}`);
                    console.log(`[checking] received players: ${hoster.receivedPlayers}`);
                    hoster.isQuestionLive = false;
                    Hoster.updateHoster(hoster);
                    // response to hoster
                    io.to(hoster.socketId).emit('display-summary');
                    // response to player
                    io.in(hoster.gameId).emit('open-results');
                }
            }
        }
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

        const hoster = Hoster.getHosterByGameId(gameId);
        const player = Player.getPlayerByName(name);

        if (!player && hoster) {
            const player = new Player(socket.id, name, gameId);
            // save to memory
            player.addPlayer();

            // const players = Player.getPlayersByGameId(player.gameId);
            // const names = players.map((player) => player.name);
            // console.log(`[join-game]`);
            // console.log(players);

            socket.join(player.gameId);
            console.log(`[join-game] ${player.socketId} ${player.name} disconnected from room ${player.gameId}`)

            const players = Player.getPlayersByGameId(player.gameId)
            const names = players.map((player) => player.name)

            // response to hoster
            if (hoster.isGameLive === false) {
                io.to(`${hoster.socketId}`).emit('display-name', names);
            }
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
            console.log(`[receive-question] answered players: ${hoster.answeredPlayers}`)
            console.log(`[receive-question] received players: ${hoster.receivedPlayers}`)
        }
    })

    socket.on('player-answer', (choiceId, callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        if (hoster.isQuestionLive === true) {
            hoster.answeredPlayers.push(socket.id);
            Hoster.updateHoster(hoster);
            // checking
            const correctChoicesId = hoster.question.choices.filter(choice => choice.is_correct === true)
                .map(correctChoice => correctChoice._id);
            // true/false
            const result = correctChoicesId.includes(choiceId)

            if (result === true) {
                const timeScore = Math.floor((hoster.timeLeft / hoster.question.timer) * 100);

                player.score += (100 + timeScore);
                player.correct += 1;
                Player.updatePlayer(player);
                // response to player
                callback(true)

            } else if (result === false) {
                player.incorrect += 1;
                Player.updatePlayer(player);
                // response to player
                callback(false)
            }

            // scoreboard
            const players = Player.getPlayersByGameId(player.gameId);

            const scoreBoard = players.map((player) => {
                    const scorer = {}
                    scorer.name = player.name
                    scorer.score = player.score
                    return scorer
                }).sort((a, b) => { b.score - a.score })
                .splice(0, 5);
            console.log(`[scoreboard]`);
            console.log(scoreBoard);

            // performance stats
            const unattepmted = (hoster.questionLength - player.correct - player.incorrect);
            console.log(`[stats] pts: ${player.score} corr: ${player.correct} incorr: ${player.incorrect} unatt: ${unattepmted}`);
            // console.log(`points: ${player.score}`)
            // console.log(`correct: ${player.correct}`)
            // console.log(`incorrect: ${player.incorrect}`)
            // console.log(`unattempted: ${unattepmted}`)

            hoster.question.choices.forEach((choice, index) => {
                if (choice._id == choiceId) {
                    hoster.summary[Object.keys(hoster.summary)[index]] += 1;
                    Hoster.updateHoster(hoster);
                }
            })

        } else if (hoster.isQuestionLive === false) {
            // answer is not allowed while question is not live
            callback(false);
        }

        const totalAnsweredPlayers = hoster.answeredPlayers.length;
        const totalReceivedPlayers = hoster.receivedPlayers.length;
        // validation of last question
        if (totalAnsweredPlayers == totalReceivedPlayers) {
            console.log('[checking] all answered');
            console.log(`[checking] answered players: ${hoster.answeredPlayers}`);
            console.log(`[checking] received players: ${hoster.receivedPlayers}`);

            hoster.isQuestionLive = false;
            Hoster.updateHoster(hoster);
            // response to hoster
            io.to(hoster.socketId).emit('display-summary');
            // response to player
            io.in(hoster.gameId).emit('open-results');
        }
    })

    socket.on('get-overall-result', (callback) => {
        const player = Player.getPlayerById(socket.id);
        if (!player) return;
        const hoster = Hoster.getHosterByGameId(player.gameId);

        const unattepmted = (hoster.questionLength - player.correct - player.incorrect);
        // response to player
        callback({
            score: player.score,
            correct: player.correct,
            incorrect: player.incorrect,
            unattepmted
        })
    })
};

module.exports = playerRoutes;