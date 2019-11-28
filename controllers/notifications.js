// data model
const Notification = require('../models/mongoose/notification');

exports.getNotifications = (socket) => {
    const userId = socket.request.user._id;

    // fetch all notifications
    Notification.find({ recipient_id: userId, isRead: false })
        .populate('sender_id', 'name')
        .then(notifications => {
            const number = notifications.length;

            // send notifications
            socket.emit('total-notifications', number);
        })
        .catch(err => {
            console.log(err);
        });
};

exports.updateReadNotifications = (socket, hasToken) => {
    const userId = socket.request.user._id;

    socket.on('read-notification', (callback) => {
        if (hasToken) {
            // read event, chg isRead to false
            Notification.updateMany({ recipient_id: userId }, {
                    $set: { isRead: true }
                })
                .then(result => {
                    // fetch all notifications
                    Notification.find({ recipient_id: userId })
                        .populate('sender_id', 'name')
                        .then(notifications => {
                            // send all notifications
                            callback(notifications);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                })
                .catch(err => {
                    console.log(err);
                });
            console.log('click');
        };
    });
};