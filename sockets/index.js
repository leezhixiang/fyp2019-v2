const io = require('../models/socket').getIO();
const notification_io = require('../models/socket').getNotificationIO();
// middleware
const socketAuth = require('../middleware/socket-auth');
// routes
const hosterRoutes = require('./hosters');
const playerRoutes = require('./players');
const notificationRoutes = require('./notifications');

module.exports = () => {
    // using middleware
    io.use(socketAuth);
    // using middleware
    notification_io.use(socketAuth);

    io.on('connection', (socket) => {
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

    notification_io.on('connection', (socket) => {
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