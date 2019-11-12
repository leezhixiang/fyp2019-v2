const express = require('express');
const router = express.Router();

router.get('/join-game', function(req, res) {
    res.render('games/join-game')
})

router.get('/host-game', function(req, res) {
    res.render('games/join-game')
})

router.get('/play-game', function(req, res) {
    res.render('games/join-game')
})



module.exports = router;