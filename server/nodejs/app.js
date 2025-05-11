const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const AuthenticationRouter = require('./routes/auth/auth.router')
const teacherRouter = require('./routes/teacher/teacher.router')
const studentRouter = require('./routes/student/student.router')

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' , credentials: false}));
app.use(morgan('combined'));

app.use('/auth', AuthenticationRouter) 
app.use('/teacher' , teacherRouter)
app.use('/student' ,studentRouter )
app.use('/home', async (req, res) => {
    return res.status(201).send('Home reached');
});



app.all('/{*any}', async (req, res) => {
    return res.status(404).json({ message: 'Route Not found!' });
});

module.exports = { app };