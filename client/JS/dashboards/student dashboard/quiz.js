import { studentData } from './data.js';
import { 
    upcomingQuizzesList,
    completedQuizzesList,
    noCompletedQuizzes
} from './DOM-elements.js';

export function populateUpcomingQuizzes() {
    // Clear existing quizzes
    upcomingQuizzesList.innerHTML = '';
    
    // Show empty state if no quizzes exist
    if (studentData.upcomingQuizzes.length === 0) {
        upcomingQuizzesList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="rounded-circle bg-light p-4 d-inline-block mb-3">
                    <i class="bi bi-calendar text-primary fs-2"></i>
                </div>
                <h4>No upcoming quizzes</h4>
                <p class="text-muted">You don't have any scheduled quizzes at the moment.</p>
            </div>
        `;
        return;
    }
    
    // Populate quizzes
    studentData.upcomingQuizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.className = 'col-md-4 mb-4';
        quizCard.innerHTML = createUpcomingQuizCard(quiz);
        upcomingQuizzesList.appendChild(quizCard);
    });

    document.querySelectorAll('.gradient-button').forEach(button => {
        const quizId = button.getAttribute('data-quiz-id');
        if (quizId) {
            button.addEventListener('click', () => {
                window.location.href = `quiz?id=${quizId}`;
            });
        }
    });

}

function createUpcomingQuizCard(quiz) {
    const formattedDate = new Date(quiz.date).toLocaleDateString();
    
    return `
        <div class="card quiz-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h3 class="h6">${quiz.title}</h3>
                    <span class="badge bg-primary">${(quiz.timeLeft === "0 days") ? "today" : quiz.timeLeft}</span>
                </div>
                <p class="text-muted small mb-3">${quiz.className}</p>
                <div class="d-flex justify-content-between text-muted small mb-3">
                    <span><i class="bi bi-calendar me-2"></i>${formattedDate}</span>
                    <span><i class="bi bi-clock me-2"></i>${quiz.duration} min</span>
                </div>
                <button class="gradient-button w-100" 
        ${quiz.locked ? 'disabled' : ''} 
        data-quiz-id="${quiz.id}">
    ${quiz.locked ? '<i class="bi bi-lock-fill me-2"></i>Locked' : 'Start Quiz'}
</button>
            </div>
        </div>
    `;
}


export function populateCompletedQuizzes() {
    // Clear existing quizzes
    completedQuizzesList.innerHTML = '';
    
    // Show empty state if no quizzes
    if (studentData.completedQuizzes.length === 0) {
        noCompletedQuizzes.classList.remove('d-none');
        return;
    }
    
    // Hide empty state
    noCompletedQuizzes.classList.add('d-none');
    
    // Populate quizzes
    studentData.completedQuizzes.forEach(quiz => {
        const row = document.createElement('tr');
        row.innerHTML = createCompletedQuizRow(quiz);
        
        // Add event listener to review button
        const reviewBtn = row.querySelector('.review-btn');
        reviewBtn.addEventListener('click', () => {
            showQuizReview(quiz.id)
        });
        
        completedQuizzesList.appendChild(row);
    });
}

function createCompletedQuizRow(quiz) {
    const formattedDate = quiz.date ? new Date(quiz.date).toLocaleDateString() : "Not Completed";

    const gradeColor = getGradeColorClass(quiz.grade);
    
    return `
        <td>${quiz.title}</td>
        <td>${quiz.classname}</td>
        <td>${formattedDate}</td>
        <td>${quiz.score ? `${quiz.score} %`: "Not Completed"}</td>
        <td><span class="badge ${gradeColor}">${quiz.grade}</span></td>
        <td>
            <button class="btn btn-outline-primary btn-sm review-btn">
                <i class="bi bi-eye-fill me-1"></i>Review
            </button>
        </td>
    `;
}

function getGradeColorClass(grade) {
    if (!grade) return 'bg-secondary';
    const firstChar = grade.charAt(0).toUpperCase();
    
    switch(firstChar) {
        case 'A': return 'bg-success';
        case 'B': return 'bg-primary';
        case 'C': return 'bg-info';
        case 'D': return 'bg-warning';
        case 'F': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

async function showQuizReview(quizId) {
    // get the quiz answers 
    let quiz = null
    const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/student/quiz/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }, body:
            JSON.stringify({
                quiz_id: quizId
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                window.location.href = 'studentView.html';
              }else{
                quiz = data;
              }
        })
        
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'quiz-review-modal';
    modal.innerHTML = createQuizReviewModal(quiz);
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => closeQuizReview());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeQuizReview();
    });
    
    // Show modal
    setTimeout(() => modal.classList.add('show'), 10);
}

function createQuizReviewModal(quiz) {
    return `
        <div class="quiz-review-content">
            <div class="quiz-review-header bg-white text-white shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <h3 class="h5 mb-0">${quiz.title} - Review</h3>
                    <button class="btn btn-sm btn-light close-btn">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="student-info mt-2">
                    <span class="badge bg-white text-dark me-2">Student: ${quiz.studentName}</span>
                    <span class="badge bg-white text-dark me-2">Score: ${quiz.score}</span>
                    <span class="badge ${getGradeColorClass(quiz.grade)}">Grade: ${quiz.grade}</span>
                </div>
            </div>
            <div class="quiz-review-body">
                ${quiz.questions.map(createQuestionElement).join('')}
            </div>
        </div>
    `;
}

function createQuestionElement(question, index) {
    const isCorrect = question.studentAnswer === question.correctAnswer;
    return `
        <div class="question-card ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <h4 class="h6">Question ${index + 1}</h4>
                <span class="badge ${isCorrect ? 'bg-success' : 'bg-danger'}">
                    ${isCorrect ? 'Correct' : 'Incorrect'}
                </span>
            </div>
            <p class="question-text">${question.text}</p>
            <div class="options-list">
                ${question.options.map((option, i) => `
                    <div class="option ${i === question.correctAnswer ? 'correct-answer' : ''} 
                                 ${i === question.studentAnswer && !isCorrect ? 'incorrect-answer' : ''}">
                        <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                        <span class="option-text">${option}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function closeQuizReview() {
    const modal = document.querySelector('.quiz-review-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
}