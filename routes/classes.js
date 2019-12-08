const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.render('classes/classes', {
        javascript: 'classes.js'
    })
})

router.get('/:classId', function(req, res) {
    res.render('classes/class-details', {
        javascript: 'class-details.js'
    })
})



module.exports = router;