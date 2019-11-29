// controllers
const onlineUsersController = require('../controllers/onlineUsers');
const notificationsController = require('../controllers/notifications');

const notificationRoutes = (socket) => {
    if (socket.request.user.logged_in) {
        onlineUsersController.addUser(socket);
        notificationsController.getNotifications(socket);
    };

    notificationsController.updateReadNotifications(socket);
    onlineUsersController.removeUser(socket);
};

module.exports = notificationRoutes;