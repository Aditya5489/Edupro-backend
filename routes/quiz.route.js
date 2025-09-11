const express=require("express");
const multer=require ("multer");
const{ handleGenerateContent } =require ("../controller/quiz.controller");

const quizRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

quizRouter.post("/", upload.single("file"), handleGenerateContent);

module.exports =quizRouter;
