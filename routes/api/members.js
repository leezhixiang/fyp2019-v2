const express = require('express');
const router = express.Router();

// controllers
const membersController = require('../../controllers/members');

// @route   POST /api/members/
// @desc    join class as a student
// @access  private users
router.post("/", membersController.addNewMember);

// @route   DELETE /api/members/
// @desc    exit class
// @access  private user => class member
router.delete("/", membersController.removeExitClassMember);

// @route   DELETE /api/members/:classId
// @desc    remove member
// @access  private user => class admin
router.delete("/remove/:userId", membersController.removeMember);

module.exports = router;