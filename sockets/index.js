const io = require('../models/socket');
const notification_io = require('../models/socket');

// middleware
const socketAuth = require('../middleware/socket-auth');

// routes
const hosterRoutes = require('./hosters');
const playerRoutes = require('./players');
const notificationRoutes = require('./notifications');

module.exports = () => {
    // using middleware
    io.getIO().use(socketAuth);

    io.getIO().on('connection', (socket) => {
        const hasToken = socket.request.user.logged_in;
        // now you can access user info through socket.request.user
        // socket.request.user.logged_in will be set to true if the user was authenticated
        socket.emit('socket-conn', {
            message: 'connected successful',
            hasToken
        });

        hosterRoutes(socket, hasToken);
        playerRoutes(socket, hasToken);
    });

    // using middleware
    notification_io.getNotificationIO().use(socketAuth);

    notification_io.getNotificationIO().on('connection', (socket) => {
        const hasToken = socket.request.user.logged_in;
        // now you can access user info through socket.request.user
        // socket.request.user.logged_in will be set to true if the user was authenticated
        socket.emit('socket-conn', {
            message: 'connected successful',
            hasToken
        });

        notificationRoutes(socket, hasToken);
    });
};