const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('config')

const User = require('../../models/mongoose/user');

// @POST /api/users/login
router.post('/login', (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            isLogged: false,
            message: 'all fields are required'
        })
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(400).json({
                    isLogged: false,
                    message: 'user account does not exist'
                })
            } else {
                bcrypt.compare(password, user.password)
                    .then(isMatch => {
                        if (!isMatch) {
                            return res.status(400).json({
                                isLogged: false,
                                message: 'invalid credentials'
                            })
                        }

                        const payload = {
                            _id: user.id,
                            name: user.name,
                            email: user.email,
                        }

                        jwt.sign({ payload }, config.get('jwtSecret'), (err, token) => {
                            if (err) throw err;
                            res.status(201).json({
                                isLogged: true,
                                token,
                                user
                            })
                        })
                    })
                    .catch(err => {
                        console.log(err)
                        res.status(400).json({
                            isLogged: false,
                            message: err
                        })
                    })
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json({
                isRegistered: false,
                message: err
            })
        })
})

// @POST /api/users/register
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body

    if (!name || !email || !password || !password2) {
        return res.status(400).json({
            isRegistered: false,
            message: 'all fields are required'
        })
    }

    if (password !== password2) {
        return res.status(400).json({
            isRegistered: false,
            message: 'passwords do not match'
        })
    }

    User.findOne({ email: email })
        .then(user => {
            if (user) {
                return res.status(400).json({
                    isRegistered: false,
                    message: 'user account is already exists'
                })
            } else {
                const newUser = new User({
                    _id: mongoose.Types.ObjectId(),
                    name,
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
                                    isRegistered: true,
                                    user
                                })
                            })
                            .catch(err => {
                                console.log(err)
                                res.status(400).json({
                                    isRegistered: false,
                                    message: err
                                })
                            });
                    })
                )
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json({
                isRegistered: false,
                message: err
            })
        })
});

module.exports = router;