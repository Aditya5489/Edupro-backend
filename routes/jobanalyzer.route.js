const express = require('express');
const { analyzeJobDescription } = require('../controller/jobanalyzer.controller');
const analyzeRouter = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

analyzeRouter.post('/',authMiddleware, analyzeJobDescription);

module.exports = analyzeRouter;