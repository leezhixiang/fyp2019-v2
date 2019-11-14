const express = require('express');
const router = express.Router();

// root route
router.get('/', (req, res) => {
    res.render('quizzes/discover', {
        javascript: 'discover.js'
    })
})

router.get('/quizzes/:quizId', (req, res) => {
    res.render('quizzes/quiz-details', {
        javascript: 'quiz-details.js'
    })
})

router.get('/quizzes', (req, res) => {
    res.render('quizzes/quizzes', {
        javascript: 'quizzes.js'
    })
})



module.exports = router;