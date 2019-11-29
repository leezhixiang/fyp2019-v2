const notification_io = require('../models/socket');

// data model
const OnlineUser = require('../models/user');
const Class = require('../models/mongoose/class');
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
        .catch(err => {
            console.log(err);
        });
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
                .catch(err => {
                    console.log(err);
                });
        };
    });
};

exports.sendAssignClassesNotification = (socket, hoster, assignClassIds) => {
    // if the hoster assigned to classes
    if (assignClassIds.length > 0) {
        assignClassIds.forEach(classId => {
            // find the members based on given classId
            Class.findOne({ class_id: classId })
                .select('members')
                .then(myClass => {

                    const memberIds = myClass.members;
                    memberIds.forEach((memberId) => {
                        const notification = new Notification({
                            recipient_id: memberId,
                            sender_id: socket.request.user._id,
                            type: 'HOST GAME',
                            content: `${hoster.name} assigned you to play game. (Game Code: ${hoster.gameId})`,
                            isRead: false
                        });

                        notification.save()
                            .then(() => {
                                // console.log(`[@player mongoDB] notification was created.`);
                            })
                            .catch(err => {
                                console.log(err);
                            });

                        // sending to individual socketid (private message)
                        const users = OnlineUser.getUsers();
                        const onlineUsers = users.filter(user => user.userId.equals(memberId));
                        onlineUsers.forEach((onlineUser) => {
                            notification_io.getNotificationIO().to(`${onlineUser.socketId}`).emit('new-notification', notification.content);
                        });
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        });
    };
};