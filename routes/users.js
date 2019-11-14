const express = require('express');
const router = express.Router();

router.get('/login', function(req, res) {
    res.render('users/login', {
        javascript: 'login.js'
    })
})

router.get('/register', function(req, res) {
    res.render('users/register', {
        javascript: 'register.js'
    })
})

module.exports = router;