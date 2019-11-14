const express = require('express');
const router = express.Router();

router.post('/host-game', function(req, res) {
    res.render('games/host-game', {
        javascript: 'host-game.js'
    })
})

router.get('/play-game', function(req, res) {
    res.render('games/play-game', {
        javascript: 'play-game.js'
    })
})



module.exports = router;