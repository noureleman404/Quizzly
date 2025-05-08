const jwt = require('jsonwebtoken');
const md5 = require('md5');
const { pool } = require('../../databaseConf');

const JWT_SECRET = process.env.JWT_SECRET || '.';

const getBooks = async (req, res) => {
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
  }

const getQuizzes = async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT q.* FROM quizzes q
         JOIN classrooms c ON q.classroom_id = c.id
         WHERE c.teacher_id = $1`,
        [req.userID]
      );
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
  }

const getClassrooms = async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM classrooms WHERE teacher_id = $1',
        [req.userID]
      );
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      res.status(500).json({ message: 'Error fetching classrooms', error: error.message });
    }
  }

const kickStudent = async (req , res) => {
  const {id: classroom_id } = req.params;
  const {student_id} = req.body;
  try {
    const result = await pool.query('SELECT teacher_id FROM classrooms WHERE id = $1', [classroom_id]);

    // Check if a row is returned
    if (result.rows.length === 0) {
      throw new Error('Classroom not found');
    }
    
    const teacher_id = result.rows[0].teacher_id;

    console.log(teacher_id , req.userID)
    if (teacher_id !== req.userID){
      res.status(401).json({message: "Un-Authorized"});
    }
    await pool.query(
      'DELETE FROM classroom_students WHERE classroom_id = $1 AND student_id = $2' ,
      [classroom_id , student_id]
    );
    res.status(200).json({
      message : "Student removed from class"
    })
  }catch(err){
    console.error(err)
    res.status(500).json({message: "Error Kicking Student"});
  }

}

  const getClassroom = async (req, res) => {
    try {
      const { classroom_id } = req.params; 
      
      const classroomResult = await pool.query(
        'SELECT * FROM classrooms WHERE id = $1',
        [classroom_id]
      );
      const studentsResult = await pool.query(
        `SELECT s.id AS student_id, s.name, cs.joined_at
         FROM classroom_students cs
         JOIN students s ON cs.student_id = s.id
         WHERE cs.classroom_id = $1`,
        [classroom_id]
      );
      const quizzesResult = await pool.query(
        'SELECT * FROM quizzes WHERE classroom_id = $1',
        [classroom_id]
      );
  
      res.status(200).json({
        classroom: classroomResult.rows[0], // Return one classroom
        students: studentsResult.rows,
        quizzes: quizzesResult.rows,
      });
    } catch (error) {
      console.error('Error fetching classroom:', error);
      res.status(500).json({ message: 'Error fetching classroom', error: error.message });
    }
  };


const createClassroom = async (req, res) => {
    const { name, code  , subject , description} = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }
  
    try {
      const { rows } = await pool.query(
        'INSERT INTO classrooms (name, code, teacher_id , subject , description) VALUES ($1, $2, $3 , $4 , $5) RETURNING *',
        [name, code, req.userID , subject , description]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Classroom code already exists' });
      }
      console.error('Error creating classroom:', error);
      res.status(500).json({ message: 'Error creating classroom', error: error.message });
    }
  }
  const getDashboard = async (req, res) => {
    try {
      const teacherId = req.userID;
  
      // Execute all queries in parallel
      const [booksResult, classroomsResult, quizzesResult , students_num] = await Promise.all([
        pool.query('SELECT * FROM books WHERE teacher_id = $1', [teacherId]),
        pool.query(`SELECT 
          c.*, 
          COUNT(DISTINCT cs.student_id) AS student_count,
          COUNT(DISTINCT q.quiz_id) AS quiz_count
        FROM classrooms c
        LEFT JOIN classroom_students cs ON cs.classroom_id = c.id
        LEFT JOIN quizzes q ON q.classroom_id = c.id
        WHERE c.teacher_id = $1
        GROUP BY c.id`, [teacherId]),
        pool.query('SELECT * FROM quizzes WHERE teacher_id = $1', [teacherId]) , 
        pool.query(`SELECT COUNT(DISTINCT cs.student_id) AS student_count
          FROM classrooms c
          JOIN classroom_students cs ON c.id = cs.classroom_id
          WHERE c.teacher_id = $1;` , [teacherId])
        ]);
      const classrooms = classroomsResult.rows.map(c => ({
  id: c.id,
  name: c.name,
  code: c.code,
  students: c.student_count,
  quizzes: c.quiz_count,
  createdAt : c.created_at
}));
  
      res.status(200).json({
        students_num:students_num.rows[0].student_count,
        books: booksResult.rows,
        classrooms: classrooms,
        quizzes: quizzesResult.rows
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };






module.exports = {
getBooks , 
getQuizzes , 
createClassroom , 
getClassrooms , 
getDashboard , 
getClassroom , 
kickStudent
};