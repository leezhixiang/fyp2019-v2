const io = require('../models/socket').getIO()

// data model
const Hoster = require('../models/hoster')
const Player = require('../models/player')

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

    socket.on('receive-question', function() {
        const player = Player.getPlayerById(socket.id);
        const hoster = Hoster.getHosterByGameId(player.gameId);

        hoster.receivedPlayers.push(socket.id);
        Hoster.updateHoster(hoster);

        console.log(`[receive-question] Answered players: ${hoster.answeredPlayers}`)
        console.log(`[receive-question] Received players: ${hoster.receivedPlayers}`)
    })
};

module.exports = playerRoutes;