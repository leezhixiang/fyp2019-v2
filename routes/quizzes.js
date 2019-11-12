const express = require('express');
const router = express.Router();

// root route
router.get('/', (req, res) => {
    res.render('discover')
})

router.get('/quizzes', (req, res) => {
    res.render('quizzes/quizzes')
})

router.get('/quizzes/:quizId', (req, res) => {
    res.render('quizzes/quiz-details')
})

module.exports = router;