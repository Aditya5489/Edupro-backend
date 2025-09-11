const express = require('express');
const { getUserProfile,uploadProfileImage } = require('../controller/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

const profileRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

profileRouter.get('/', authMiddleware, getUserProfile);
profileRouter.post('/upload-profile-pic', authMiddleware, upload.single('profileImage'), uploadProfileImage);

module.exports = profileRouter;
