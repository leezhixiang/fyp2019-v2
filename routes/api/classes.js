const express = require('express');
const router = express.Router();

// controllers
const classesController = require('../../controllers/classes');

// @route   GET /api/classes/
// @desc    view classes
// @access  private users
router.get("/", classesController.getClasses);

// @route   GET /api/classes/:classId
// @desc    view class
// @access  private users
router.get("/:classId", classesController.getClassDetails);

// @route   POST /api/classes/
// @desc    create class
// @access  private users
router.post("/", classesController.addNewClass);

// @route   PATCH /api/classes/:classId
// @desc    edit class
// @access  private user => class admin
router.patch("/:classId", classesController.updateClass);

// @route   DELETE /api/classes/:classId
// @desc    delete class
// @access  private user => class admin
router.delete("/:classId", classesController.deleteClass);

module.exports = router;