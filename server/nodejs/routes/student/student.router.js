const express = require('express');
const { verifyToken } = require('../../middlewares/authToken');
const {verifyTeacher} = require('../../middlewares/verifyTeacher')
const router = express.Router();
require('dotenv').config();


// get dashboard data
router.get('/dashboard', verifyToken , async (req, res) => {
  try {
    console.log(req.userID)
    const { rows } = await pool.query(
      'SELECT * FROM books WHERE teacher_id = $1',
      [req.userID] 
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});



module.exports = router;