const io = require('../models/socket').getIO()

const playerRoutes = (socket) => {
    socket.on('join-game', function(data, callback) {
        const { name, pin } = data

        if (!name || !pin) {
            return callback({ isJoined: false, message: 'failed to join game, all fields are required' })
        }

        const existingPlayer = player.getPlayer(name, pin)
        const existingHoster = hoster.getHosterByPin(pin)

        if (!existingPlayer && existingHoster) {
            const newPlayer = player.addPlayer(socket.id, name, pin)

            socket.join(newPlayer.pin);

            const onlinePlayers = player.getOnlinePlayers(newPlayer.pin)

            io.to(`${existingHoster.socketId}`).emit('display-name', onlinePlayers);

            console.log(`${newPlayer.socketId} ${newPlayer.name} joined room ${newPlayer.pin}`)

            console.log(`Number of Online Players in Room ${existingHoster.pin}: ${onlinePlayers.length}`)

            const data = {}

            data["name"] = newPlayer.name
            data["gameLive"] = existingHoster.gameLive

            callback(true, data)
        } else {
            callback(false)
        }
    })
};
module.exports = playerRoutes;