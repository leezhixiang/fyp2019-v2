const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.render('reports/reports', {
        javascript: 'reports.js'
    })
})

module.exports = router;