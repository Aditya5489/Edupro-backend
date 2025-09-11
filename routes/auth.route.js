const express = require('express');
const { signup, login, logout } = require('../controller/auth.controller');

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

module.exports = authRouter;