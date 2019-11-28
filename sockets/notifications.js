// controllers
const onlineUsersController = require('../controllers/onlineUsers');
const notificationsController = require('../controllers/notifications');

const notificationRoutes = (socket, hasToken) => {
    if (hasToken) {
        onlineUsersController.addUser(socket);
        notificationsController.getNotifications(socket);
    };

    notificationsController.updateReadNotifications(socket, hasToken);
    onlineUsersController.removeUser(socket, hasToken);
};

module.exports = notificationRoutes;