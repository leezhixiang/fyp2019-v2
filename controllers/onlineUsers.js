// data model
const Class = require('../models/mongoose/class');
const OnlineUser = require('../models/user');

exports.addUser = (socket) => {
    // find classes which are user currently in
    Class.find({ members: { "$in": [socket.request.user._id] } })
        .select('class_id')
        .then(classes => {
            classIds = classes.map(myClass => myClass.class_id);

            const user = new OnlineUser(socket.id, socket.request.user._id, socket.request.user.email, classIds);

            user.addUser();
            const users = OnlineUser.getUsers();
            // console.log(users);
        })
        .catch(err => {
            console.log(err);
        });
};

exports.removeUser = (socket) => {
    const hasToken = socket.request.user.logged_in;

    socket.on('disconnect', (callback) => {
        if (hasToken) {
            // disconnect users
            OnlineUser.removeUser(socket.id);
            const users = OnlineUser.getUsers();
            // console.log(users);
        }
    });
}