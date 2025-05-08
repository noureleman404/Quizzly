const express = require('express');
const { login, signup, getCurrentUser } = require('./auth.controller');
const router = express.Router()

router.post('/login' , login);
router.post('/register' , signup);
router.get('/current-user' , getCurrentUser);
module.exports = router;