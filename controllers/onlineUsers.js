// data model
const Class = require('../models/mongoose/class');
const OnlineUser = require('../models/user');

exports.addUser = (socket) => {
    const userId = socket.request.user._id;
    const email = socket.request.user.email;

    // find classes which are user currently in
    Class.find({ members: { "$in": [userId] } })
        .select('class_id')
        .then(classes => {
            classIds = classes.map(myClass => myClass.class_id);

            const user = new OnlineUser(socket.id, userId, email, classIds);

            user.addUser();
            const users = OnlineUser.getUsers();
            console.log(users);
        })
        .catch(err => {
            console.log(err);
        });
};

exports.removeUser = (socket, hasToken) => {
    socket.on('disconnect', (callback) => {
        if (hasToken) {
            OnlineUser.removeUser(socket.id);
            const users = OnlineUser.getUsers();
            console.log(users);
        }
    });
}