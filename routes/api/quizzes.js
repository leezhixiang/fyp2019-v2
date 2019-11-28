const express = require('express');
const router = express.Router();
// const mongoose = require('mongoose');

const checkAuth = require('../../middleware/check-auth');
const checkAuthWithoutToken = require('../../middleware/check-auth-no-token');

// controllers
const quizzesController = require('../../controllers/quizzes');

// Tell Mongoose to use the native Node.js promise library.
// mongoose.Promise = global.Promise;

// @route   GET /api/quizzes
// @desc    fetch all quizzes
// @access  public users
router.get('/', quizzesController.getQuizzes);

// @route   GET /api/quizzes/:quizId
// @desc    get quiz details
// @access  public / private users
router.get('/:quizId', checkAuthWithoutToken, quizzesController.getQuizDetails);

// @route   POST /api/quizzes
// @desc    create new quiz
// @access  private users
router.post('/', checkAuth, quizzesController.addNewQuiz);

module.exports = router;