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
        `SELECT s.id AS student_id, s.name, cs.joined_at , s.email
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
const deleteBook = async (req, res) => {
    try {
      const { book_id } = req.params;
      const teacher_id  = req.userID; 
      
      // Check if the book belongs to the teacher
      const bookCheck = await pool.query(
        'SELECT * FROM books WHERE id = $1 AND teacher_id = $2',
        [book_id, teacher_id]
      );
  
      if (bookCheck.rowCount === 0) {
        return res.status(403).json({ message: 'Unauthorized: Book does not belong to you or does not exist' });
      }
  
      // Proceed to delete the book
      const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [book_id]);
  
      res.status(200).json({
        message: 'Book deleted successfully',
        deletedBook: result.rows[0]
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ message: 'Error deleting book', error: error.message });
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
      const classroom = rows[0];
      classroom.students = "0";
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

        pool.query(`SELECT 
                    q.quiz_id,
                    q.title,
                    q.created_at,
                    q.deadline_date,
                    q.duration,
                    c.name AS classroom_name
                  FROM quizzes q
                  JOIN classrooms c ON q.classroom_id = c.id
                  WHERE q.teacher_id = $1
                    AND q.deadline_date >= NOW()
                  ORDER BY q.deadline_date ASC;`, [teacherId]) , 
        
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

      const quizzes = quizzesResult.rows.map(q => {
        const deadline = new Date(q.deadline_date);
        const now = new Date();
        const timeDiff = deadline - now;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // convert ms to days

        return {
          quiz_id: q.quiz_id,
          title: q.title,
          created_at: q.created_at,
          days_left: `${daysLeft} days`,
          duration: q.duration,
          classroom_name: q.classroom_name
        };
      });
  
      res.status(200).json({
        students_num:students_num.rows[0].student_count,
        books: booksResult.rows,
        classrooms: classrooms,
        quizzes: quizzes
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const updateClassroom = async (req, res) => {
    try {
      const {classroom_id} = req.params;
      const { name, subject , description , joinCode } = req.body;
      const teacher_id = req.userID; 
  
      // Step 1: Check if the classroom belongs to the teacher
      const check = await pool.query(
        'SELECT * FROM classrooms WHERE id = $1 AND teacher_id = $2',
        [classroom_id, teacher_id]
      );
  
      if (check.rowCount === 0) {
        return res.status(403).json({ message: 'Unauthorized: You do not own this classroom' });
      }
  
      // Step 2: Update the classroom
      const update = await pool.query(
        `UPDATE classrooms 
         SET name = $1, subject = $2, description = $3  , code = $4
         WHERE id = $5
         RETURNING *`,
        [name,  subject, description , joinCode ,  classroom_id]
      );
  
      res.status(200).json({
        message: 'Classroom updated successfully',
        updatedClassroom: update.rows[0]
      });
  
    } catch (error) {
      console.error('Error updating classroom:', error);
      res.status(500).json({ message: 'Error updating classroom', error: error.message });
    }
  };






module.exports = {
getBooks , 
getQuizzes , 
createClassroom , 
getClassrooms , 
getDashboard , 
getClassroom , 
kickStudent ,
deleteBook , 
updateClassroom
};