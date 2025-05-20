const express = require('express');
const { verifyToken } = require('../../middlewares/authToken');
const { pool } = require('../../databaseConf');
const {verifyTeacher} = require('../../middlewares/verifyTeacher');
const { getBooks, getQuizzes, getClassrooms, createClassroom, getDashboard, getClassroom , kickStudent, deleteBook, updateClassroom, updateQuiz, deleteClassroom, getQuizAnalysis} = require('./teacher.controller');

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

router.delete('/classrooms/:id/kick' , verifyToken , verifyTeacher , kickStudent)

router.get('/dashboard' , verifyToken , verifyTeacher , getDashboard)

router.delete('/books/:book_id' , verifyToken , verifyTeacher , deleteBook);

router.put('/classrooms/:classroom_id' , verifyToken , verifyTeacher , updateClassroom);

router.put('/quiz/:quiz_id' , verifyToken , verifyTeacher , updateQuiz);

router.delete('/classrooms/:classroom_id' , verifyToken , verifyTeacher , deleteClassroom)

router.get('/quiz/:quiz_id' , verifyToken , verifyTeacher , getQuizAnalysis)
module.exports = router;