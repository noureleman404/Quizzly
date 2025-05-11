import { studentData } from './data.js';
import { 
    upcomingQuizzesList,
    completedQuizzesList,
    noCompletedQuizzes
} from './DOM-elements.js';

export function populateUpcomingQuizzes() {
    const upcomingQuizzesList = document.getElementById('upcomingQuizzesList');
    
    // Clear existing quizzes
    while (upcomingQuizzesList.firstChild) {
        upcomingQuizzesList.removeChild(upcomingQuizzesList.firstChild);
    }
    
    // Show empty state if no quizzes exist
    if (studentData.upcomingQuizzes.length === 0) {
        const emptyStateDiv = document.createElement('div');
        emptyStateDiv.className = 'col-12 text-center py-5';
        emptyStateDiv.innerHTML = `
            <div class="rounded-circle bg-light p-4 d-inline-block mb-3">
                <i class="bi bi-calendar text-primary fs-2"></i>
            </div>
            <h4>No upcoming quizzes</h4>
            <p class="text-muted">You don't have any scheduled quizzes at the moment.</p>
        `;
        upcomingQuizzesList.appendChild(emptyStateDiv);
        return;
    }
    
    // Populate quizzes
    studentData.upcomingQuizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.className = 'col-md-4 mb-4';
        
        // Format date
        const quizDate = new Date(quiz.date);
        const formattedDate = quizDate.toLocaleDateString();
        
        quizCard.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h3 class="h6">${quiz.title}</h3>
                        <span class="badge bg-primary">${quiz.timeLeft}</span>
                    </div>
                    <p class="text-muted small mb-3">${quiz.className}</p>
                    <div class="d-flex justify-content-between text-muted small mb-3">
                        <span><i class="bi bi-calendar me-2"></i>${formattedDate}</span>
                        <span><i class="bi bi-clock me-2"></i>${quiz.duration} min</span>
                    </div>
                    <button class="gradient-button w-100" ${quiz.locked ? 'disabled' : ''}>
                        ${quiz.locked ? 'Locked' : 'Start Quiz'}
                    </button>
                </div>
            </div>
        `;
        
        upcomingQuizzesList.appendChild(quizCard);
    });
}

export function populateCompletedQuizzes() {
    const completedQuizzesList = document.getElementById('completedQuizzesList');
    const noCompletedQuizzes = document.getElementById('noCompletedQuizzes');
    
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
        
        // Format date
        const quizDate = new Date(quiz.date);
        const formattedDate = quizDate.toLocaleDateString();
        
        row.innerHTML = `
            <td>${quiz.title}</td>
            <td>${quiz.className}</td>
            <td>${formattedDate}</td>
            <td>${quiz.score}</td>
            <td><span class="badge bg-success">${quiz.grade}</span></td>
            <td>
                <button class="gradient-button-small">Review</button>
            </td>
        `;
        
        completedQuizzesList.appendChild(row);
    });
}

