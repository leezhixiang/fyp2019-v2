const express = require('express');
const router = express.Router();

// controllers
const quizzesController = require('../../controllers/library');

// @route   GET /api/library/favorites/
// @desc    get all favorited quizzes
// @access  private users
router.get("/favorites", quizzesController.getFavoritedQuizzes);

// @route   POST /api/library/favorites/ 
// @desc    get favorited quiz
// @access  private users
router.post("/favorites", quizzesController.addFavoritedQuiz);

// @route   DELETE /api/library/favorites/:quizId
// @desc    delete favorited quiz
// @access  private users
router.delete("/favorites/:quizId", quizzesController.removeFavoritedQuiz);

// @route   GET /api/library/shared/
// @desc    get all shared quizzes
// @access  private users
router.get("/shared", quizzesController.getSharedQuizzes);

// @route   POST /api/library/shared/
// @desc    get shared quiz
// @access  private users
router.post("/shared/", quizzesController.addSharedQuiz);

// @route   DELETE /api/library/shared/:quizId
// @desc    delete shared quiz
// @access  private users
router.delete("/shared/:sharedQuizId", quizzesController.deleteSharedQuiz);

module.exports = router;