const { pool } = require('../../databaseConf');

const getDashboard = async (req, res) => {
    try {
      const student_id = req.userID;
  
      // Execute all queries in parallel
      const [upcommingQuizzes, classroomsResult , completedQuizzes] = await Promise.all([
        pool.query(`SELECT 
                    q.quiz_id,
                    q.title,
                    q.created_at,
                    q.deadline_date ,
                    q.duration,
                    c.name AS classroom_name
                    FROM classroom_students cs
                    JOIN quizzes q ON q.classroom_id = cs.classroom_id
                    JOIN classrooms c ON q.classroom_id = c.id
                    WHERE cs.student_id = $1
                    AND q.deadline_date >= NOW()
                    ORDER BY q.deadline_date ASC;`, [student_id]),

        pool.query(`SELECT 
                    c.id,
                    c.name,
                    c.description,
                    c.subject,
                    t.name AS teacher_name,
                    (
                        SELECT COUNT(*) 
                        FROM classroom_students cs2 
                        WHERE cs2.classroom_id = c.id
                    ) AS student_count
                    FROM classroom_students cs
                    JOIN classrooms c ON cs.classroom_id = c.id
                    JOIN teachers t ON c.teacher_id = t.id
                    WHERE cs.student_id = $1;`, [student_id]) , 

        pool.query(`SELECT 
                    q.quiz_id,
                    q.title,
                    c.name AS classroom_name,
                    sqa.score,
                    sqa.completed_at,
                    CASE 
                        WHEN sqa.score >= 90 THEN 'A'
                        WHEN sqa.score >= 80 THEN 'B'
                        WHEN sqa.score >= 70 THEN 'C'
                        WHEN sqa.score >= 60 THEN 'D'
                        ELSE 'F'
                    END AS grade
                FROM student_quiz_attempts sqa
                JOIN quizzes q ON sqa.quiz_id = q.quiz_id
                JOIN classrooms c ON q.classroom_id = c.id
                WHERE sqa.student_id = $1
                ORDER BY sqa.completed_at DESC;`, [student_id])

        ]);
        
        const quizzes = upcommingQuizzes.rows.map(q => {
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
        upcommingQuizzes: quizzes , 
        classrooms : classroomsResult.rows , 
        completedQuizzes: completedQuizzes.rows
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
};

const joinClassroom = async (req, res) => {
    try {
      const student_id = req.userID;
      const { classroom_code } = req.body;
  
      if (!classroom_code) {
        return res.status(400).json({ message: 'Classroom code is required.' });
      }
  
      // Check if classroom exists
      const classroomResult = await pool.query(
        'SELECT id FROM classrooms WHERE code = $1',
        [classroom_code]
      );
  
      if (classroomResult.rows.length === 0) {
        return res.status(404).json({ message: 'Classroom not found.' });
      }
  
      const classroom_id = classroomResult.rows[0].id;
  
      // Check if student is already enrolled
      const enrollmentCheck = await pool.query(
        'SELECT * FROM classroom_students WHERE student_id = $1 AND classroom_id = $2',
        [student_id, classroom_id]
      );
  
      if (enrollmentCheck.rows.length > 0) {
        return res.status(400).json({ message: 'You are already enrolled in this classroom.' });
      }
  
      // Enroll student
      await pool.query(
        'INSERT INTO classroom_students (student_id, classroom_id) VALUES ($1, $2)',
        [student_id, classroom_id]
      );
  
      res.status(200).json({ message: 'Successfully joined the classroom.' });
    } catch (error) {
      console.error('Error joining classroom:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
const getExamQuestionsForStudent = async (req, res) => {
    try {
        const student_id = req.userID;
        const { quiz_id } = req.body;

        // Step 1: Check if the student is in the classroom of this quiz
        const enrollmentCheckQuery = `
            SELECT 1
            FROM classroom_students cs
            JOIN quizzes q ON cs.classroom_id = q.classroom_id
            WHERE cs.student_id = $1 AND q.quiz_id = $2
        `;
        const enrollmentResult = await pool.query(enrollmentCheckQuery, [student_id, quiz_id]);

        if (enrollmentResult.rowCount === 0) {
            return res.status(403).json({ error: "You are not enrolled in this quiz's classroom." });
        }

        // Step 2: Fetch quiz versions
        const versionQuery = `
            SELECT version_id, questions
            FROM quiz_versions
            WHERE quiz_id = $1
        `;
        const versionResult = await pool.query(versionQuery, [quiz_id]);

        if (versionResult.rows.length === 0) {
            return res.status(404).json({ error: "No versions found for this quiz." });
        }

        // Step 3: Pick a random version
        const randomIndex = Math.floor(Math.random() * versionResult.rows.length);
        const randomVersion = versionResult.rows[randomIndex];

        // Step 4: Return questions (without correct_answer)
        const questionsForStudent = randomVersion.questions.map(q => ({
            question: q.question,
            options: q.options
        }));

        return res.json({
            quiz_id,
            version_id: randomVersion.version_id,
            questions: questionsForStudent
        });
    } catch (error) {
        console.error('Error fetching exam questions for student:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const submitQuizAnswers = async (req, res) => {
    try {
        const student_id = req.userID;
        const { quiz_id, version_id, answers } = req.body;

        // Step 1: Check enrollment
        const enrollmentCheck = `
            SELECT 1
            FROM classroom_students cs
            JOIN quizzes q ON q.classroom_id = cs.classroom_id
            WHERE cs.student_id = $1 AND q.quiz_id = $2
        `;
        const enrollment = await pool.query(enrollmentCheck, [student_id, quiz_id]);
        if (enrollment.rowCount === 0) {
            return res.status(403).json({ error: "Not enrolled in this quiz's classroom." });
        }

        // Step 2: Fetch quiz version
        const versionQuery = `
            SELECT questions
            FROM quiz_versions
            WHERE version_id = $1 AND quiz_id = $2
        `;
        const versionResult = await pool.query(versionQuery, [version_id, quiz_id]);
        if (versionResult.rowCount === 0) {
            return res.status(404).json({ error: "Invalid quiz version." });
        }

        const quizQuestions = versionResult.rows[0].questions;

        // Step 3: Calculate score
        let score = 0;
        for (let i = 0; i < quizQuestions.length; i++) {
            const correct = quizQuestions[i].correct_answer;
            if (answers[i] && answers[i] === correct) {
                score++;
            }
        }

        // Step 4: Store attempt
        const insertAttemptQuery = `
            INSERT INTO student_quiz_attempts
            (student_id, quiz_id, version_id, completed_at, score, answers)
            VALUES ($1, $2, $3, NOW(), $4, $5)
            ON CONFLICT (student_id, quiz_id) DO UPDATE SET
                version_id = EXCLUDED.version_id,
                completed_at = EXCLUDED.completed_at,
                score = EXCLUDED.score,
                answers = EXCLUDED.answers
        `;
        await pool.query(insertAttemptQuery, [
            student_id,
            quiz_id,
            version_id,
            score/quizQuestions.length * 100,
            answers
        ]);

        // Step 5: Respond
        return res.json({
            message: "Quiz submitted successfully",
            totalQuestions: quizQuestions.length,
            correctAnswers: score,
            scorePercent: ((score / quizQuestions.length) * 100).toFixed(2)
        });

    } catch (error) {
        console.error("Error assessing quiz:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
const getClassroom = async (req, res) => {
  try {
    const { classroom_id } = req.params; 
    
    const classroomResult = await pool.query(
      'SELECT * FROM classrooms WHERE id = $1',
      [classroom_id]
    );
    const studentsResult = await pool.query(
      `SELECT s.id AS student_id, s.name, cs.joined_at , s.email as email
       FROM classroom_students cs
       JOIN students s ON cs.student_id = s.id
       WHERE cs.classroom_id = $1`,
      [classroom_id]
    );


    res.status(200).json({
      classroom: classroomResult.rows[0], 
      students: studentsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({ message: 'Error fetching classroom', error: error.message });
  }
};


module.exports = {
    getDashboard , 
    joinClassroom,
    getExamQuestionsForStudent ,
    submitQuizAnswers , 
    getClassroom
};