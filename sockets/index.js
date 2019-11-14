const io = require('../models/socket').getIO()
const jwtAuth = require('socketio-jwt-auth');
const config = require('config')

const hosterRoutes = require('./hosters')
const playerRoutes = require('./players')

// data model
const User = require('../models/mongoose/user')

module.exports = () => {

    // using middleware
    io.use(jwtAuth.authenticate({
        secret: config.get('jwtSecret'), // required, used to verify the token's signature
        algorithm: 'HS256', // optional, default to be HS256
        succeedWithoutToken: true
    }, (payload, done) => {
        // you done callback will not include any payload data now
        // if no token was supplied
        if (payload && payload.userInfo) {
            User.findOne({ email: payload.userInfo.email }, (err, user) => {
                if (err) {
                    // return error
                    return done(err);
                }
                if (!user) {
                    // return fail with an error message
                    return done(null, false, 'user does not exist');
                }
                // return success with a user info
                return done(null, user);
            });
        } else {
            return done() // in your connection handler user.logged_in will be false
        }
    }));

    io.on('connection', (socket) => {
        // now you can access user info through socket.request.user
        // socket.request.user.logged_in will be set to true if the user was authenticated
        socket.emit('success', {
            message: 'success logged in!',
            // user: socket.request.user
        });

        hosterRoutes(socket)
        playerRoutes(socket)
    });
};