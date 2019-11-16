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
        const player = Player.getPlayerById(socket.id)

        if (player) {
            Player.removePlayer(socket.id)
            console.log(`[disconnect] ${player.socketId} ${player.name} player has left from room ${player.gameId}`);

            const players = Player.getPlayersByGameId(player.gameId);
            console.log(`[disconnect]`)
            console.log(players)

            const hoster = Hoster.getHosterByGameId(player.gameId)

            if (hoster && hoster.isGameLive == false) {
                const players = Player.getPlayersByGameId(player.gameId)
                const names = players.map((player) => player.name)

                // response to hoster
                io.to(`${hoster.socketId}`).emit('display-name', names);
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

            const players = Player.getPlayersByGameId(player.gameId);
            const names = players.map((player) => player.name);
            console.log(`[join-game]`);
            console.log(players);

            socket.join(player.gameId);
            console.log(`[join-game] ${player.socketId} ${player.name} joined room ${player.gameId}`)

            // const players = Player.getPlayersByGameId(player.gameId)
            // const names = players.map((player) => player.name)

            // response to hoster
            io.to(`${hoster.socketId}`).emit('display-name', names);

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
            callback({
                error: 'display name or game PIN is invalid',
                message: 'join game failed',
                isJoined: false
            })
        }
    })

    socket.on('receive-question', () => {
        const player = Player.getPlayerById(socket.id);
        const hoster = Hoster.getHosterByGameId(player.gameId);

        hoster.receivedPlayers.push(socket.id);
        Hoster.updateHoster(hoster);

        console.log(`[receive-question] Answered players: ${hoster.answeredPlayers}`)
        console.log(`[receive-question] Received players: ${hoster.receivedPlayers}`)
    })

    socket.on('player-answer', (choiceId, callback) => {
        const player = Player.getPlayerById(socket.id);
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

                callback(true)

            } else if (result === false) {
                player.incorrect += 1;
                Player.updatePlayer(player);

                callback(false)
            }

            const players = Player.getPlayersByGameId(player.gameId);

            const scoreBoard = players.map((player) => {
                const scorer = {}
                scorer.name = player.name
                scorer.score = player.score
                return scorer
            }).sort((a, b) => { b.score - a.score }).splice(0, 5)

            console.log('Final Scoreboard')
            console.log(scoreBoard)

            const unattepmted = (hoster.questionLength - player.correct - player.incorrect)

            console.log('Performance Stats')
            console.log(`Points: ${player.score}`)
            console.log(`Correct: ${player.correct}`)
            console.log(`Incorrect: ${player.incorrect}`)
            console.log(`Unattempted: ${unattepmted}`)

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

            console.log('[player-answer] all players have answered');
            console.log(`[player-answer] Answered players: ${hoster.answeredPlayers}`)
            console.log(`[player-answer] Received players: ${hoster.receivedPlayers}`)

            // 设置开放问题
            hoster.isQuestionLive = true
            Hoster.updateHoster(hoster);

            // response to hoster
            io.to(hoster.socketId).emit('display-summary');
            // response to player
            io.in(hoster.gameId).emit('open-results');
        }
    })



};

module.exports = playerRoutes;