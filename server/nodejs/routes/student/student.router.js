const express = require('express');
const { verifyToken } = require('../../middlewares/authToken');
const {verifyStudent} = require('../../middlewares/verifyStudent');
const { getDashboard, joinClassroom, getExamQuestionsForStudent, submitQuizAnswers } = require('./student.controller');
const router = express.Router();
require('dotenv').config();


// get dashboard data
router.get('/dashboard', verifyToken , verifyStudent, getDashboard);
//join a classroom
router.post('/classroom' , verifyToken , verifyStudent, joinClassroom)

router.get('/quiz' , verifyToken , verifyStudent , getExamQuestionsForStudent)

router.post('/quiz' , verifyToken , verifyStudent , submitQuizAnswers);


module.exports = router ;