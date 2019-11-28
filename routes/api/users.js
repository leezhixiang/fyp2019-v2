const express = require('express');
const router = express.Router();

// controllers
const usersController = require('../../controllers/users');

// @POST /api/users/register
router.post('/register', usersController.userRegister);

// @POST /api/users/login
router.post('/login', usersController.userLogin);

module.exports = router;