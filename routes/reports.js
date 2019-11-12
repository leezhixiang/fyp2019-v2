const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.render('reports/reports')
})

module.exports = router;