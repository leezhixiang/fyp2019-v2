const express = require("express");
const router = express.Router();

// root route
router.get("/", (req, res) => {
  res.render("quizzes/discover", {
    javascript: "discover.js"
  });
});

router.get("/quizzes/:quizId", (req, res) => {
  res.render("quizzes/quiz-details", {
    javascript: "quiz-details.js"
  });
});

// print quiz
router.get("/print/quizzes/:quizId", (req, res) => {
  res.render("quizzes/print-layout", {
    javascript: "print-layout.js"
  });
});

router.get("/quizzes", (req, res) => {
  res.render("quizzes/quizzes", {
    javascript: "quizzes.js"
  });
});

router.get("/create/quizzes", (req, res) => {
  res.render("quizzes/create-quiz", {
    javascript: "create-quiz.js"
  });
});

module.exports = router;
