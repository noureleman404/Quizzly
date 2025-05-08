const express = require('express');
const { verifyToken } = require('../../middlewares/authToken');
const { pool } = require('../../databaseConf');
const {verifyTeacher} = require('../../middlewares/verifyTeacher');
const { getBooks, getQuizzes, getClassrooms, createClassroom, getDashboard, getClassroom , kickStudent} = require('./teacher.controller');

const router = express.Router();
require('dotenv').config();


// GET all books for the authenticated teacher
router.get('/books', verifyToken ,  verifyTeacher , getBooks);

// GET all quizzes for the authenticated teacher
router.get('/quizzes', verifyToken, verifyTeacher , getQuizzes);

// GET all classrooms for the authenticated teacher
router.get('/classrooms', verifyToken, getClassrooms);

router.get('/classrooms/:classroom_id' , verifyToken , verifyTeacher , getClassroom)
// POST create a new classroom
router.post('/classrooms', verifyToken, createClassroom);

router.post('/classrooms/:id/kick' , verifyToken , verifyTeacher , kickStudent)
router.get('/dashboard' , verifyToken , verifyTeacher , getDashboard)

module.exports = router;