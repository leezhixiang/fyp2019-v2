const hosterRoutes = require('./hosters')
const playerRoutes = require('./players')

module.exports = (io) => {

    io.on('connection', (socket) => {
        console.log(socket.id + 'has connected')
        hosterRoutes(socket)
        playerRoutes(socket)
    });
};