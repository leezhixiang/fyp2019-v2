const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');

// data model
const User = require('../models/mongoose/user');

exports.userRegister = (req, res) => {
    const { first_name, last_name, email, password, password2 } = req.body
    console.log(req.body)
    if (!first_name || !last_name || !email || !password || !password2) {
        return res.status(400).json({
            message: 'Register failed.',
            err: 'All fields are required.',
            isRegistered: false
        });
    };

    if (password !== password2) {
        return res.status(400).json({
            message: 'Register failed.',
            err: 'Passwords do not match.',
            isRegistered: false
        });
    };

    User.findOne({ email: email })
        .then(user => {
            if (user) {
                return res.status(400).json({
                    message: 'Register failed.',
                    err: 'User account already exists.',
                    isRegistered: false
                });
            } else {
                const newUser = new User({
                    name: `${first_name} ${last_name}`,
                    email,
                    password
                });
                // Hash Password
                bcrypt.genSalt(10, (err, salt) =>
                    bcrypt.hash(newUser.password, salt, function(err, hash) {
                        if (err) throw err;
                        newUser.password = hash
                        newUser.save()
                            .then(function(user) {
                                res.status(200).json({
                                    message: 'Register successful.',
                                    user,
                                    isRegistered: true,
                                });
                            })
                            .catch(err => {
                                console.log(err);
                                res.status(400).json({
                                    message: 'Register failed.',
                                    err: err.message,
                                    isRegistered: false,
                                });
                            });
                    })
                );
            };
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json({
                message: 'Register failed.',
                err: err.message,
                isRegistered: false,
            });
        });
}

exports.userLogin = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Login failed.',
            err: 'All fields are required.',
            isLogged: false
        });
    };

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(400).json({
                    message: 'Login failed.',
                    err: 'User account does not exist.',
                    isLogged: false
                });
            } else {
                bcrypt.compare(password, user.password)
                    .then(isMatch => {
                        if (!isMatch) {
                            return res.status(400).json({
                                message: 'Login failed.',
                                err: 'Invalid credentials',
                                isLogged: false
                            });
                        };

                        const userData = {
                            _id: user._id,
                            name: user.name,
                            email: user.email,
                        };

                        jwt.sign({ userData }, config.get('jwtSecret'), (err, token) => {
                            if (err) throw err;
                            res.status(201).json({
                                message: 'Login successful.',
                                token,
                                user,
                                isLogged: true
                            });
                        });
                    })
                    .catch(err => {
                        console.log(err)
                        res.status(400).json({
                            message: 'Login failed.',
                            err: err.message,
                            isLogged: false
                        });
                    });
            };
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json({
                message: 'Login failed.',
                err: err.message,
                isLogged: false
            });
        });
}