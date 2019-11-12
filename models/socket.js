let io;

module.exports = {
    init: (httpServer, callback) => {
        io = require('socket.io')(httpServer);
        callback()
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        return io;
    }
}