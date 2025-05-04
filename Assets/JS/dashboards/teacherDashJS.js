// Storing data for the dashboard
let teacherData = {
    name: 'Dr. Johnson',
    classrooms: [
        { id: 1, name: 'Biology 101', students: 32, quizzes: 5, code: 'BIO101', subject: 'Biology', description: 'Introduction to Biology concepts' },
        { id: 2, name: 'Chemistry Advanced', students: 28, quizzes: 3, code: 'CHEM202', subject: 'Chemistry', description: 'Advanced Chemistry course' },
        { id: 3, name: 'Physics 202', students: 24, quizzes: 7, code: 'PHY202', subject: 'Physics', description: 'Classical Mechanics' }
    ],
    upcomingQuizzes: [
        { id: 1, title: 'Cell Structure and Function', classroom: 'Biology 101', classroomId: 1, date: '2025-05-05' },
        { id: 2, title: 'Periodic Table Elements', classroom: 'Chemistry Advanced', classroomId: 2, date: '2025-05-08' },
        { id: 3, title: 'Newton\'s Laws of Motion', classroom: 'Physics 202', classroomId: 3, date: '2025-05-12' },
        { id: 4, title: 'Photosynthesis Process', classroom: 'Biology 101', classroomId: 1, date: '2025-05-20' },
        { id: 5, title: 'Thermodynamics', classroom: 'Physics 202', classroomId: 3, date: '2025-05-25' }
    ],
    studentsInClass: {
        // classId: [students array]
        1: [
            { id: 101, name: 'John Smith', email: 'john@example.com' },
            { id: 102, name: 'Emily Brown', email: 'emily@example.com' },
            { id: 103, name: 'Michael Jones', email: 'michael@example.com' }
        ],
        2: [
            { id: 104, name: 'Sarah Adams', email: 'sarah@example.com' },
            { id: 105, name: 'Daniel Wilson', email: 'daniel@example.com' }
        ],
        3: [
            { id: 106, name: 'Jessica Taylor', email: 'jessica@example.com' }
        ]
    }
};

// DOM elements
const dashboardTabs = document.querySelectorAll('.dashboard-tab');
const dashboardContents = document.querySelectorAll('.dashboard-content');
const logoutButton = document.getElementById('logoutButton');

// Bootstrap modals
let createClassroomModal;
let manageClassroomModal;

let currentClassroom = null;

// dashboard initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap modals
    createClassroomModal = new bootstrap.Modal(document.getElementById('createClassroomModal'));
    manageClassroomModal = new bootstrap.Modal(document.getElementById('manageClassroomModal'));
    
    // Update dashboard header with teacher name
    document.getElementById('teacherName').textContent = teacherData.name;
    
    // Update stats counts
    updateDashboardStats();
    
    // Populate dashboard content
    populateClassrooms();
    populateUpcomingQuizzes();
    populateQuizClassroomSelect();
    
    // Add event listeners for tabs
    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });
    
    // Add event listener for logout button
    logoutButton.addEventListener('click', handleLogout);
    
    // Add event listeners for classroom actions
    document.getElementById('newClassroomBtn').addEventListener('click', showCreateClassroomModal);
    document.getElementById('saveClassroomBtn').addEventListener('click', handleCreateClassroom);
    document.getElementById('saveClassroomChangesBtn').addEventListener('click', handleSaveClassroomChanges);
    
    // Add event listeners for file upload
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-primary');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-primary');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-primary');
        
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // Add event listeners for quiz generation
    document.getElementById('generateQuizBtn').addEventListener('click', handleGenerateQuiz);
    
    // Add event listener for copy class code button
    document.getElementById('copyCodeBtn').addEventListener('click', handleCopyClassCode);
    
    // Add event listener for regenerate class code button
    document.getElementById('regenerateCodeBtn').addEventListener('click', handleRegenerateClassCode);
    
    // Add event listener for scheduling quiz button
    document.getElementById('scheduleQuizBtn').addEventListener('click', () => {
        // Switch to create test tab
        switchToTab('create');
    });
    
    // Add event listener for adding a student
    document.getElementById('addStudentBtn').addEventListener('click', handleAddStudent);
});

// Update dashboard statistics
function updateDashboardStats() {
    // Calculate total students
    const totalStudents = Object.values(teacherData.studentsInClass)
        .reduce((total, students) => total + students.length, 0);
    
    document.getElementById('totalStudentsCount').textContent = totalStudents;
    document.getElementById('classroomsCount').textContent = teacherData.classrooms.length;
    document.getElementById('upcomingQuizzesCount').textContent = teacherData.upcomingQuizzes.length;
}

// Switching between dashboard tabs
function switchTab() {
    const tabId = this.getAttribute('data-tab');
    switchToTab(tabId);
}

// Switch to a specific tab
function switchToTab(tabId) {
    // Update active tab
    dashboardTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show corresponding content
    dashboardContents.forEach(content => {
        if (content.getAttribute('data-content') === tabId) {
            content.classList.remove('d-none');
        } else {
            content.classList.add('d-none');
        }
    });
}

// Populate classrooms list
function populateClassrooms() {
    const classroomsList = document.getElementById('classroomsList');
    const noClassrooms = document.getElementById('noClassrooms');
    const createClassroomCard = classroomsList.querySelector('.card.border-dashed').parentNode;
    
    // Remove all children except (create classroom) card
    while (classroomsList.firstChild) {
        if (classroomsList.firstChild !== createClassroomCard) {
            classroomsList.removeChild(classroomsList.firstChild);
        } else {
            break;
        }
    }
    
    // Show empty state if no classrooms
    if (teacherData.classrooms.length === 0) {
        noClassrooms.classList.remove('d-none');
        return;
    }
    
    // Hide empty state
    noClassrooms.classList.add('d-none');
    
    // Populate classrooms
    teacherData.classrooms.forEach(classroom => {
        const classroomCard = document.createElement('div');
        classroomCard.className = 'col-md-4 mb-4';
        
        // Get class initials
        const initials = classroom.name.split(' ')
            .map(word => word[0])
            .join('');
        
        classroomCard.innerHTML = `
            <div class="card">
                <div class="bg-gradient text-white p-4 text-center h5 mb-0">
                    ${initials}
                </div>
                <div class="card-body">
                    <h3 class="h6 mb-2">${classroom.name}</h3>
                    <div class="d-flex justify-content-between text-muted small mb-3">
                        <span>${classroom.students} Students</span>
                        <span>${classroom.quizzes} Quizzes</span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary flex-grow-1 manage-classroom-btn" data-classroom-id="${classroom.id}">Manage</button>
                        <button class="btn btn-primary flex-grow-1 new-quiz-btn" data-classroom-id="${classroom.id}">New Quiz</button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert before create classroom card
        classroomsList.insertBefore(classroomCard, createClassroomCard);
    });
    
    // Add event listeners to new buttons
    document.querySelectorAll('.manage-classroom-btn').forEach(button => {
        button.addEventListener('click', () => {
            const classroomId = parseInt(button.getAttribute('data-classroom-id'));
            showManageClassroomModal(classroomId);
        });
    });
    
    document.querySelectorAll('.new-quiz-btn').forEach(button => {
        button.addEventListener('click', () => {
            const classroomId = parseInt(button.getAttribute('data-classroom-id'));
            showCreateQuizForClassroom(classroomId);
        });
    });
    
    // Make the create classroom card clickable
    createClassroomCard.querySelector('.card').addEventListener('click', showCreateClassroomModal);
}

// Populate upcoming quizzes
function populateUpcomingQuizzes() {
    const upcomingQuizzesList = document.getElementById('upcomingQuizzesList');
    const noUpcomingQuizzes = document.getElementById('noUpcomingQuizzes');
    
    // Clear existing quizzes
    upcomingQuizzesList.innerHTML = '';
    
    // Show empty state if no quizzes
    if (teacherData.upcomingQuizzes.length === 0) {
        noUpcomingQuizzes.classList.remove('d-none');
        return;
    }
    
    // Hide empty state
    noUpcomingQuizzes.classList.add('d-none');
    
    // Populate quizzes
    teacherData.upcomingQuizzes.forEach(quiz => {
        const row = document.createElement('tr');
        
        // Format date
        const quizDate = new Date(quiz.date);
        const formattedDate = quizDate.toLocaleDateString();
        
        row.innerHTML = `
            <td>${quiz.title}</td>
            <td>${quiz.classroom}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2 edit-quiz-btn" data-quiz-id="${quiz.id}">Edit</button>
                <button class="btn btn-sm btn-primary view-quiz-btn" data-quiz-id="${quiz.id}">View</button>
            </td>
        `;
        
        upcomingQuizzesList.appendChild(row);
    });
    
    // Add event listeners to new buttons
    document.querySelectorAll('.edit-quiz-btn').forEach(button => {
        button.addEventListener('click', () => {
            const quizId = parseInt(button.getAttribute('data-quiz-id'));
            editQuiz(quizId);
        });
    });
    
    document.querySelectorAll('.view-quiz-btn').forEach(button => {
        button.addEventListener('click', () => {
            const quizId = parseInt(button.getAttribute('data-quiz-id'));
            viewQuiz(quizId);
        });
    });
}

// Populate classroom select in create quiz form
function populateQuizClassroomSelect() {
    const quizClassroomSelect = document.getElementById('quizClassroom');
    
    // Clear existing options except the default
    while (quizClassroomSelect.options.length > 1) {
        quizClassroomSelect.remove(1);
    }
    
    // Add options for each classroom
    teacherData.classrooms.forEach(classroom => {
        const option = document.createElement('option');
        option.value = classroom.id;
        option.textContent = classroom.name;
        quizClassroomSelect.appendChild(option);
    });
}

// Show create classroom modal
function showCreateClassroomModal() {
    // Reset form
    document.getElementById('createClassroomForm').reset();
    createClassroomModal.show();
}

// Show manage classroom modal
function showManageClassroomModal(classroomId) {
    // Find the classroom
    currentClassroom = teacherData.classrooms.find(c => c.id === classroomId);
    if (!currentClassroom) return;
    
    // Set classroom title
    document.getElementById('manageClassroomTitle').textContent = currentClassroom.name;
    
    // Populate classroom details
    document.getElementById('editClassroomName').value = currentClassroom.name;
    document.getElementById('editClassroomSubject').value = currentClassroom.subject || '';
    document.getElementById('editClassroomDescription').value = currentClassroom.description || '';
    document.getElementById('classroomCode').value = currentClassroom.code;
    
    // Populate students
    populateStudentsTable(classroomId);
    
    // Show the modal
    manageClassroomModal.show();
}

// Populate students table in manage classroom modal
function populateStudentsTable(classroomId) {
    const studentsTableBody = document.getElementById('studentsTableBody');
    const noStudentsYet = document.getElementById('noStudentsYet');
    
    // Clear existing students
    studentsTableBody.innerHTML = '';
    
    // Get students for this classroom
    const students = teacherData.studentsInClass[classroomId] || [];
    
    // Show empty state if no students
    if (students.length === 0) {
        noStudentsYet.classList.remove('d-none');
        return;
    }
    
    // Hide empty state
    noStudentsYet.classList.add('d-none');
    
    // Populate students
    students.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-student-btn" data-student-id="${student.id}">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </td>
        `;
        
        studentsTableBody.appendChild(row);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-student-btn').forEach(button => {
        button.addEventListener('click', () => {
            const studentId = parseInt(button.getAttribute('data-student-id'));
            removeStudent(classroomId, studentId);
        });
    });
}

// Show create quiz for specific classroom
function showCreateQuizForClassroom(classroomId) {
    // Switch to create tab
    switchToTab('create');
    
    // Set classroom in select
    document.getElementById('quizClassroom').value = classroomId;
}

// Handle create classroom
function handleCreateClassroom() {
    const name = document.getElementById('classroomName').value;
    const subject = document.getElementById('classroomSubject').value;
    const description = document.getElementById('classroomDescription').value;
    
    if (!name) {
        alert('Please enter a classroom name');
        return;
    }
    
    // Generate a random code
    const code = generateClassCode();
    
    // Create new classroom
    const newClassroom = {
        id: Date.now(),
        name: name,
        subject: subject,
        description: description,
        code: code,
        students: 0,
        quizzes: 0
    };
    
    // Add the new classroom
    teacherData.classrooms.push(newClassroom);
    
    // Initialize empty students array for this classroom
    teacherData.studentsInClass[newClassroom.id] = [];
    
    // Update dashboard stats and classrooms list
    updateDashboardStats();
    populateClassrooms();
    populateQuizClassroomSelect();
    
    // Close the modal
    createClassroomModal.hide();
}

// Handle save classroom changes
function handleSaveClassroomChanges() {
    if (!currentClassroom) return;
    
    // Update classroom data
    currentClassroom.name = document.getElementById('editClassroomName').value;
    currentClassroom.subject = document.getElementById('editClassroomSubject').value;
    currentClassroom.description = document.getElementById('editClassroomDescription').value;
    
    // Update dashboard content
    populateClassrooms();
    populateUpcomingQuizzes();
    populateQuizClassroomSelect();
    
    // Close the modal
    manageClassroomModal.hide();
    
    // Show success message
    alert('Classroom updated successfully');
}

// Handle file selection for quiz creation
function handleFileSelection(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF, DOCX, or TXT file');
        return;
    }
    
    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
        alert('File size must be less than 25MB');
        return;
    }
    
    // Display file name
    const selectedFileName = document.getElementById('selectedFileName');
    selectedFileName.textContent = `Selected file: ${file.name}`;
    selectedFileName.classList.remove('d-none');
}

// Handle generate quiz
function handleGenerateQuiz() {
    const title = document.getElementById('quizTitle').value;
    const classroomId = document.getElementById('quizClassroom').value;
    const date = document.getElementById('quizDate').value;
    const timeLimit = document.getElementById('quizTimeLimit').value;
    const sections = document.getElementById('quizSections').value;
    
    // Validate form
    if (!title || !classroomId || !date || !timeLimit) {
        alert('Please fill all required fields');
        return;
    }
    
    // Get selected file
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    // Find classroom
    const classroom = teacherData.classrooms.find(c => c.id === parseInt(classroomId));
    
    if (!classroom) {
        alert('Invalid classroom');
        return;
    }
    
    // Create new quiz
    const newQuiz = {
        id: Date.now(),
        title: title,
        classroom: classroom.name,
        classroomId: classroom.id,
        date: date
    };
    
    // Add the new quiz
    teacherData.upcomingQuizzes.push(newQuiz);
    
    // Increment quiz count for classroom
    classroom.quizzes++;
    
    // Update dashboard stats and quizzes list
    updateDashboardStats();
    populateUpcomingQuizzes();
    populateClassrooms();
    
    // Reset form
    document.getElementById('createQuizForm').reset();
    document.getElementById('quizSections').value = '';
    document.getElementById('fileInput').value = '';
    const selectedFileName = document.getElementById('selectedFileName');
    selectedFileName.textContent = '';
    selectedFileName.classList.add('d-none');
    
    // Show success message
    alert('Quiz created successfully!');
}

// Handle copy class code
function handleCopyClassCode() {
    const codeInput = document.getElementById('classroomCode');
    codeInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const copyBtn = document.getElementById('copyCodeBtn');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
    }, 2000);
}

// Handle regenerate class code
function handleRegenerateClassCode() {
    if (!currentClassroom) return;
    
    // Generate new code
    const newCode = generateClassCode();
    
    // Update classroom code
    currentClassroom.code = newCode;
    
    // Update input field
    document.getElementById('classroomCode').value = newCode;
    
    // Show feedback
    alert('Classroom code regenerated. Make sure to share the new code with your students.');
}

// Handle add student
function handleAddStudent() {
    if (!currentClassroom) return;
    
    // For demo purpose, we'll add a fake student
    const newStudent = {
        id: Date.now(),
        name: 'New Student',
        email: `student${Date.now()}@example.com`
    };
    
    // Add student to classroom
    if (!teacherData.studentsInClass[currentClassroom.id]) {
        teacherData.studentsInClass[currentClassroom.id] = [];
    }
    
    teacherData.studentsInClass[currentClassroom.id].push(newStudent);
    
    // Update student count for classroom
    currentClassroom.students = teacherData.studentsInClass[currentClassroom.id].length;
    
    // Update students table
    populateStudentsTable(currentClassroom.id);
    
    // Update classroom list
    populateClassrooms();
    
    // Update dashboard stats
    updateDashboardStats();
}

// Remove student from classroom
function removeStudent(classroomId, studentId) {
    // Find the classroom
    const classroom = teacherData.classrooms.find(c => c.id === classroomId);
    if (!classroom) return;
    
    // Remove student
    teacherData.studentsInClass[classroomId] = (teacherData.studentsInClass[classroomId] || [])
        .filter(student => student.id !== studentId);
    
    // Update student count for classroom
    classroom.students = teacherData.studentsInClass[classroomId].length;
    
    // Update students table
    populateStudentsTable(classroomId);
    
    // Update classroom list
    populateClassrooms();
    
    // Update dashboard stats
    updateDashboardStats();
}
 
// Edit quiz
function editQuiz(quizId) {
    // Find the quiz
    const quiz = teacherData.upcomingQuizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    // Switch to create tab
    switchToTab('create');
    
    // Populate form with quiz data
    document.getElementById('quizTitle').value = quiz.title;
    document.getElementById('quizClassroom').value = quiz.classroomId;
    document.getElementById('quizDate').value = quiz.date;
    
    // Focus on the title field
    document.getElementById('quizTitle').focus();
    
    alert('You are now editing the quiz. Make changes and click "Generate Test" to update.');
}

// View quiz
function viewQuiz(quizId) {
    // Find the quiz
    const quiz = teacherData.upcomingQuizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    // this would navigate to a quiz details page (but for now it is an alert)
    alert(`Viewing quiz: ${quiz.title}\n\n`);
}

// Generate random class code
function generateClassCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return code;
}

// Handle logout button click
function handleLogout() {
    // In a real app, this would clear session/tokens
    // For demo purpose, redirect to index page
    window.location.href = '../../../index.html';
}