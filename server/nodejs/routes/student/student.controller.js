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
                    c.name AS classroom_name ,
                    CASE 
                        WHEN q.deadline_date >= CURRENT_DATE 
                            AND q.deadline_date < CURRENT_DATE + INTERVAL '1 day' AND sqa.attempt_id IS NULL
                        THEN FALSE
                        ELSE TRUE
                    END AS locked
                    FROM classroom_students cs
                    JOIN quizzes q ON q.classroom_id = cs.classroom_id
                    JOIN classrooms c ON q.classroom_id = c.id
                    LEFT JOIN student_quiz_attempts sqa 
                    ON sqa.quiz_id = q.quiz_id AND sqa.student_id = cs.student_id
                    WHERE cs.student_id = $1
                    AND q.deadline_date >= CURRENT_DATE
                    ORDER BY q.deadline_date ASC;`, [student_id]),

        pool.query(`SELECT 
                    c.id,
                    c.name,
                    c.description,
                    c.subject,
                    t.name AS teacher,
                    (
                        SELECT COUNT(*) 
                        FROM classroom_students cs2 
                        WHERE cs2.classroom_id = c.id
                    ) AS students_count
                    FROM classroom_students cs
                    JOIN classrooms c ON cs.classroom_id = c.id
                    JOIN teachers t ON c.teacher_id = t.id
                    WHERE cs.student_id = $1 ;`, [student_id]) , 

        pool.query(`SELECT 
                    q.quiz_id as id,
                    q.title,
                    c.name AS className,
                    sqa.score,
                    sqa.completed_at as date,
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
              id: q.quiz_id,
              date: deadline,
              title: q.title,
              className: q.classroom_name ,
              created_at: q.created_at,
              timeLeft: `${daysLeft} days`,
              duration: q.duration,
              locked : q.locked ,
              
            };
          });

      res.status(200).json({
        upcomingQuizzes: quizzes , 
        enrolledClasses : classroomsResult.rows , 
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
  
      // 1. Validate classroom enrollment
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
      
      // Validate any attemps
      const attemptCheckQuery = `
        SELECT attempt_id FROM student_quiz_attempts
        WHERE quiz_id = $1 AND student_id = $2
      `;
      const attemptResult = await pool.query(attemptCheckQuery, [quiz_id, student_id]);
      if (attemptResult.rowCount > 0) {
        return res.status(403).json({ error: "You have already entered this quiz." });
      }

      // 2. Get quiz metadata
      const metadataQuery = `
        SELECT q.title, q.duration, c.name 
        FROM quizzes q
        JOIN classrooms c ON q.classroom_id = c.id
        WHERE q.quiz_id = $1
      `;
      const metadataResult = await pool.query(metadataQuery, [quiz_id]);
      console.log(metadataResult.rows)

      if (metadataResult.rows.length === 0) {
        return res.status(404).json({ error: "Quiz not found." });
      }
  
      const { title, duration, name } = metadataResult.rows[0];
  
      // 3. Get versions
      const versionQuery = `
        SELECT version_id, questions
        FROM quiz_versions
        WHERE quiz_id = $1
      `;
      const versionResult = await pool.query(versionQuery, [quiz_id]);
      
      if (versionResult.rows.length === 0) {
        return res.status(404).json({ error: "No versions found for this quiz." });
      }
  
      // 4. Random version
      const randomIndex = Math.floor(Math.random() * versionResult.rows.length);
      const randomVersion = versionResult.rows[randomIndex];
  
      // 5. Transform questions
      const questionsForStudent = randomVersion.questions.map((q, index) => {
        const optionsArray = Object.values(q.options);
        const correctAnswerIndex = Object.keys(q.options).indexOf(q.correct_answer);
        
        return {
          id: index + 1,
          text: q.question,
          options: optionsArray,
          correctAnswer: correctAnswerIndex
        };
      });

      const insertAttemptQuery = `
        INSERT INTO student_quiz_attempts (student_id, quiz_id, version_id, started_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING attempt_id
      `;
      await pool.query(insertAttemptQuery, [student_id, quiz_id, randomVersion.version_id]);
      // 6. Final response
      return res.json({
        id: quiz_id,
        title,
        className: name,
        timeLimit: duration,
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
        const mapping = ['A', 'B', 'C', 'D'];
        
        for (let i = 0; i < quizQuestions.length; i++) {
            const correct = quizQuestions[i].correct_answer;
            const studentAnswer = answers[i];
        
            console.log(mapping[studentAnswer], correct, studentAnswer !== undefined && mapping[studentAnswer] === correct);
        
            if (studentAnswer !== undefined && mapping[studentAnswer] === correct) {
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
    const userId = req.userID;

    // Check if the classroom exists and get its data with teacher info
    const classroomResult = await pool.query(
      `SELECT c.*, t.name AS teacher_name
       FROM classrooms c
       JOIN teachers t ON c.teacher_id = t.id
       WHERE c.id = $1`,
      [classroom_id]
    );

    if (classroomResult.rowCount === 0) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const classroom = classroomResult.rows[0];

    // Check if the user is a student in the classroom
    const membershipResult = await pool.query(
      'SELECT 1 FROM classroom_students WHERE student_id = $1 AND classroom_id = $2',
      [userId, classroom_id]
    );

    if (membershipResult.rowCount === 0) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this classroom' });
    }

    // Count the number of students
    const countResult = await pool.query(
      'SELECT COUNT(*) AS student_count FROM classroom_students WHERE classroom_id = $1',
      [classroom_id]
    );

    const studentCount = parseInt(countResult.rows[0].student_count, 10);

    // Return the required data
    return res.status(200).json({
      classData: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        description: classroom.description,
        teacher_name: classroom.teacher_name,
        student_count: studentCount,
        created_at: classroom.created_at,
        // Add more if needed
      }
    });

  } catch (error) {
    console.error('Error fetching classroom:', error);
    return res.status(500).json({
      message: 'Internal server error while fetching classroom',
      error: error.message
    });
  }
};

const reviewQuiz = async (req, res) => {
  try {
    const { quiz_id } = req.body;
    const student_id = req.userID;

    // Step 1: Fetch quiz, student attempt, and version data
    const result = await pool.query(
      `SELECT 
         q.title, 
         sqa.score, 
         sqa.answers AS student_answers, 
         sqa.version_id,
         qv.questions, 
         u.name AS student_name
       FROM student_quiz_attempts sqa
       JOIN quizzes q ON q.quiz_id = sqa.quiz_id
       JOIN quiz_versions qv ON qv.quiz_id = sqa.quiz_id AND qv.version_id = sqa.version_id
       JOIN students u ON u.id = sqa.student_id
       WHERE sqa.quiz_id = $1 AND sqa.student_id = $2
       AND sqa.completed_at IS NOT NULL `,
      [quiz_id, student_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Attempt not found or not completed for this student/quiz' });
    }

    const {
      title,
      score,
      student_name,
      questions,
      student_answers
    } = result.rows[0];

    const parsedQuestions = [];
    const answersObj = student_answers;
    const questionList = questions;

    questionList.forEach((q, index) => {
      const optionsArray = Object.values(q.options);
      const correctIndex = Object.keys(q.options).indexOf(q.correct_answer);
      const studentOption = answersObj[index.toString()];
      const studentIndex = studentOption

      parsedQuestions.push({
        id: index + 1,
        text: q.question,
        options: optionsArray,
        correctAnswer: correctIndex,
        studentAnswer: studentIndex,
      });
    });

    const response = {
      id: quiz_id,
      title: title,
      studentName: student_name,
      score: `${score}%`,
      grade: calculateGrade(score),
      questions: parsedQuestions
    };

    return res.json(response);
  } catch (error) {
    console.error('Error in reviewQuiz:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

function calculateGrade(score) {
  score = parseFloat(score);
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

const leaveClass = async (req, res) => {
  try {
    const student_id = req.userID; // assuming middleware sets this
    const { classroom_id } = req.params;

    // Check if the student is enrolled in the classroom
    const check = await pool.query(
      'SELECT * FROM classroom_students WHERE student_id = $1 AND classroom_id = $2',
      [student_id, classroom_id]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'You are not enrolled in this classroom.' });
    }

    // Delete the student from the classroom
    await pool.query(
      'DELETE FROM classroom_students WHERE student_id = $1 AND classroom_id = $2',
      [student_id, classroom_id]
    );

    return res.status(200).json({ message: 'Successfully left the classroom.' });

  } catch (error) {
    console.error('Error leaving classroom:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
    getDashboard , 
    joinClassroom,
    getExamQuestionsForStudent ,
    submitQuizAnswers , 
    getClassroom , 
    reviewQuiz , 
    leaveClass
};