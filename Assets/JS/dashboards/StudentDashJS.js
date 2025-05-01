// Storing data for the dashboard
let studentData = {
    name: 'Alex',
    upcomingQuizzes: [
        {
            id: 1,
            title: 'Cell Structure and Function',
            className: 'Biology 101',
            date: '2025-05-05',
            timeLeft: '2 days',
            duration: 60,
            locked: false
        },
        {
            id: 2,
            title: 'Periodic Table Elements',
            className: 'Chemistry Advanced',
            date: '2025-05-08',
            timeLeft: '5 days',
            duration: 45,
            locked: true
        },
        {
            id: 3,
            title: 'Newton\'s Laws of Motion',
            className: 'Physics 202',
            date: '2025-05-12',
            timeLeft: '9 days',
            duration: 50,
            locked: true
        }
    ],
    completedQuizzes: [
        {
            id: 101,
            title: 'Introduction to Biology',
            className: 'Biology 101',
            date: '2025-04-10',
            score: '85%',
            grade: 'B+'
        },
        {
            id: 102,
            title: 'Atomic Structure',
            className: 'Chemistry Advanced',
            date: '2025-04-15',
            score: '92%',
            grade: 'A-'
        }
    ],
    enrolledClasses: [
        { id: 1, name: 'Biology 101', teacher: 'Dr. Johnson', studentsCount: 32 },
        { id: 2, name: 'Chemistry Advanced', teacher: 'Prof. Williams', studentsCount: 28 },
        { id: 3, name: 'Physics 202', teacher: 'Dr. Rodriguez', studentsCount: 24 }
    ]
};

// DOM elements
const dashboardTabs = document.querySelectorAll('.dashboard-tab');
const dashboardContents = document.querySelectorAll('.dashboard-content');
const logoutButton = document.getElementById('logoutButton');
const joinClassBtn = document.getElementById('joinClassBtn');



// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Update dashboard header with student name
    document.getElementById('studentName').textContent = studentData.name;
    
    // Update stats counts
    updateDashboardStats();
    
    // Populate dashboard content
    populateUpcomingQuizzes();
    populateCompletedQuizzes();
    populateClasses();
    
    // Add event listeners for tabs
    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });
    
    // Add event listener for logout button
    logoutButton.addEventListener('click', handleLogout);
    
    // Add event listener for join class button
    joinClassBtn.addEventListener('click', handleJoinClass);
    

});


// Update dashboard statistics
function updateDashboardStats() {
    document.getElementById('upcomingQuizzesCount').textContent = studentData.upcomingQuizzes.length;
    document.getElementById('enrolledClassesCount').textContent = studentData.enrolledClasses.length;
    document.getElementById('completedQuizzesCount').textContent = studentData.completedQuizzes.length;
}

// Switch between dashboard tabs
function switchTab() {
    const tabId = this.getAttribute('data-tab');
    
    // Update active tab
    dashboardTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    this.classList.add('active');
    
    // Show corresponding content
    dashboardContents.forEach(content => {
        if (content.getAttribute('data-content') === tabId) {
            content.classList.remove('d-none');
        } else {
            content.classList.add('d-none');
        }
    });
}

// Populate upcoming quizzes
function populateUpcomingQuizzes() {
    const upcomingQuizzesList = document.getElementById('upcomingQuizzesList');
    
    // Clear existing quizzes
    while (upcomingQuizzesList.firstChild) {
        upcomingQuizzesList.removeChild(upcomingQuizzesList.firstChild);
    }
    
    // Show empty state if no quizzes
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

// Populate completed quizzes
function populateCompletedQuizzes() {
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
                <button class="btn btn-sm btn-outline-primary">Review</button>
            </td>
        `;
        
        completedQuizzesList.appendChild(row);
    });
}

// Populate classes
function populateClasses() {
    const classesList = document.getElementById('classesList');
    const noClasses = document.getElementById('noClasses');
    const joinClassCard = classesList.querySelector('.card.border-dashed').parentNode;
    
    // Remove all children except the join class card
    while (classesList.firstChild) {
        if (classesList.firstChild !== joinClassCard) {
            classesList.removeChild(classesList.firstChild);
        } else {
            break;
        }
    }
    
    // Show empty state if no classes
    if (studentData.enrolledClasses.length === 0) {
        noClasses.classList.remove('d-none');
        return;
    }
    
    // Hide empty state
    noClasses.classList.add('d-none');
    
    // Populate classes
    studentData.enrolledClasses.forEach(classItem => {
        const classCard = document.createElement('div');
        classCard.className = 'col-md-4 mb-4';
        
        // Get class initials
        const initials = classItem.name.split(' ')
            .map(word => word[0])
            .join('');
        
        classCard.innerHTML = `
            <div class="card">
                <div class="bg-gradient text-white p-4 text-center h5 mb-0">
                    ${initials}
                </div>
                <div class="card-body">
                    <h3 class="h6 mb-2">${classItem.name}</h3>
                    <p class="text-muted small mb-3">Teacher: ${classItem.teacher}</p>
                    <p class="text-muted small mb-3">${classItem.studentsCount} Students</p>
                    <button class="btn btn-outline-primary w-100">Class Details</button>
                </div>
            </div>
        `;
        
        // Insert before join class card
        classesList.insertBefore(classCard, joinClassCard);
    });
}

// Handle join class button click
function handleJoinClass() {
    const classCode = document.getElementById('classCode').value;
    
    if (!classCode.trim()) {
        alert('Please enter a class code');
        return;
    }
    
    // Simulate joining class (In a real app, this would call an API)
    // For demo purpose, we'll add a fake class
    const newClass = {
        id: Date.now(),
        name: 'New Joined Class',
        teacher: 'Dr. New Teacher',
        studentsCount: 15
    };
    
    // Add the new class to the student's enrolled classes
    studentData.enrolledClasses.push(newClass);
    
    // Update dashboard stats and classes list
    updateDashboardStats();
    populateClasses();
    
    // Clear the input field
    document.getElementById('classCode').value = '';
    
    alert('Successfully joined the class!');
}

// Handle logout button click
function handleLogout() {
    // In a real app, this would clear session/tokens
    // For demo purpose, redirect to index page
    window.location.href = 'index.html';
}