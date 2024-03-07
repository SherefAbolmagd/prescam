const express = require('express');
const router = express.Router();
const userValidations = require('../validators/user.validation');
const {checkSchema} = require('express-validator');
const UserController = require("../controllers/user.controller");

/* Post Login. */
router.post('/login', checkSchema(userValidations.userLoginValidateSchema), UserController.login);

/* Post signup. */
router.post('/signup', checkSchema(userValidations.userSignupValidateSchema), UserController.signup);

module.exports = router;

