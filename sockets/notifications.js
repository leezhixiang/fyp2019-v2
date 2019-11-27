const io = require('../models/socket');
const notification_io = require('../models/socket');

// data model
const OnlineUser = require('../models/user');

const Class = require('../models/mongoose/class');
const Notification = require('../models/mongoose/notification');

const notificationRoutes = (socket, hasToken) => {
    const userId = socket.request.user._id;
    const email = socket.request.user.email;

    if (hasToken) {
        // find classes which are user currently in
        Class.find({ members: { "$in": [userId] } })
            .select('class_id')
            .then(classes => {
                classIds = classes.map(myClass => myClass.class_id);

                // join user to room based on class id
                // classIds.forEach((classId) => {
                //     socket.join(classId);
                // });

                const user = new OnlineUser(socket.id, userId, email, classIds);

                user.addUser();
                const users = OnlineUser.getUsers();
                console.log(users);

                socket.to('68woir').emit('notifications', "let's play a game");
            })
            .catch(err => {
                console.log(err);
            });

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

    socket.on('disconnect', (callback) => {
        if (hasToken) {
            OnlineUser.removeUser(socket.id);
            const users = OnlineUser.getUsers();
            console.log(users);
        }
    });
};

module.exports = notificationRoutes;