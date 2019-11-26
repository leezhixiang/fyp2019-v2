const io = require('../models/socket').getIO();
const notification_io = require('../models/socket').getNotificationIO();
const mongoose = require('mongoose');

// data model
const Hoster = require('../models/hoster');
const Player = require('../models/player');
const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');
const PlayerReport = require('../models/mongoose/player_report');
const Class = require('../models/mongoose/class');

const notificationRoutes = (socket, hasToken) => {
    const userId = socket.request.user._id;

    // find classes which is user currently in

    socket.on('disconnect', (callback) => {});

    // disconnect class after being removed or exit from class
    socket.on('disconnect-class', (callback) => {});

    if (hasToken) {
        // notification event, send all notifications
        socket.emit('notifications', { notifications: 'notifications' });
    }

    socket.on('read-notification', () => {
        // read event, chg isRead to false
        socket.emit('notifications', { notifications: 'notifications' });
        console.log('click');
    });
};

module.exports = notificationRoutes;