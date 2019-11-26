let io;
let notification_io;
module.exports = {
    init: (httpServer, callback) => {
        io = require('socket.io')(httpServer);
        notification_io = io.of('/notification');
        callback()
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        return io;
    },
    getNotificationIO: () => {
        if (!notification_io) {
            throw new Error('Socket.io not initialized');
        }
        return notification_io;
    }
}