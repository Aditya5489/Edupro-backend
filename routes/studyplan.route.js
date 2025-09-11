const express = require('express');
const { generatePlan ,markPlanCompleted, getUserStudyPlans,deletePlan,getStudyPlanById} = require('../controller/studyplan.controller');
const planRouter = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

planRouter.post('/generateplan',authMiddleware, generatePlan);
planRouter.post('/completed',authMiddleware, markPlanCompleted);
planRouter.get('/',authMiddleware, getUserStudyPlans);
planRouter.post('/delete',authMiddleware, deletePlan);
planRouter.get('/:id',authMiddleware, getStudyPlanById);



module.exports = planRouter;
