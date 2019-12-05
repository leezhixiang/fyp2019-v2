const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('reports/reports', {
        javascript: 'reports.js'
    })
})

router.get('/played/:played_reportId', (req, res) => {
    res.render('reports/played-report-details', {
        javascript: 'played-report-details.js'
    });
});

router.get('/hosted/:hosted_reportId', (req, res) => {
    res.render('reports/hosted-report-details', {
        javascript: 'hosted-report-details.js'
    });
});

module.exports = router;