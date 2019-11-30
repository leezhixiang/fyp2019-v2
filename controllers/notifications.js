// data model
const Notification = require('../models/mongoose/notification');

exports.getNotifications = (socket) => {
    // fetch all notifications
    Notification.find({ recipient_id: socket.request.user._id, isRead: false })
        .populate('sender_id', 'name')
        .then(notifications => {
            const number = notifications.length;

            // send notifications
            socket.emit('total-notifications', number);
        })
        .catch(err => console.log(err));
};

exports.updateReadNotifications = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('read-notification', (callback) => {
        if (hasToken) {
            // read event, chg isRead to false
            Notification.updateMany({ recipient_id: socket.request.user._id }, {
                    $set: { isRead: true }
                })
                .then(result => {
                    // fetch all notifications
                    Notification.find({ recipient_id: socket.request.user._id })
                        .populate('sender_id', 'name')
                        .then(notifications => {
                            // send all notifications
                            callback(notifications);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                })
                .catch(err => console.log(err));
        };
    });
};