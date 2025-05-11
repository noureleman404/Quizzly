import { teacherData } from './data.js';
import { createClassroomModal, manageClassroomModal } from './dom-elements.js';
import { generateClassCode, switchToTab } from './utils.js';

let currentClassroom = null;

function populateClassrooms() {
    const classroomsList = document.getElementById('classroomsList');
    const noClassrooms = document.getElementById('noClassrooms');
    const createClassroomCard = classroomsList.querySelector('.card.border-dashed').parentNode;
    
    // Clear existing classrooms
    while (classroomsList.firstChild && classroomsList.firstChild !== createClassroomCard) {
        classroomsList.removeChild(classroomsList.firstChild);
    }
    
    // Show empty state if no classrooms
    if (teacherData.classrooms.length === 0) {
        noClassrooms.classList.remove('d-none');
        return;
    }
    
    noClassrooms.classList.add('d-none');
    
    // Populate classrooms
    teacherData.classrooms.forEach(classroom => {
        const classroomCard = document.createElement('div');
        classroomCard.className = 'col-md-4 mb-4';
        
        const initials = classroom.name.split(' ').map(word => word[0]).join('');
        
        classroomCard.innerHTML = `
            <div class="card" id="classrooms-card">
                <div class="bg-gradient text-white p-4 text-center h5 mb-0">
                    ${initials}
                </div>
                <div class="card-body">
                    <h3 class="h6 mb-2">${classroom.name}</h3>
                    <div class="d-flex justify-content-between text-muted small mb-3">
                        <span>${classroom.students} Students</span>
                        <span>${classroom.quizzes || 0} Quizzes</span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary flex-grow-1 manage-classroom-btn" data-classroom-id="${classroom.id}">Manage</button>
                        <button class="btn btn-primary flex-grow-1 new-quiz-btn" data-classroom-id="${classroom.id}">New Quiz</button>
                    </div>
                </div>
            </div>
        `;
        
        classroomsList.insertBefore(classroomCard, createClassroomCard);
    });
    
    // Add event listeners
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
    
    createClassroomCard.querySelector('.card').addEventListener('click', showCreateClassroomModal);
}

function showCreateClassroomModal() {
    document.getElementById('createClassroomForm').reset();
    createClassroomModal.show();
}

function showManageClassroomModal(classroomId) {
    currentClassroom = teacherData.classrooms.find(c => c.id === classroomId);
    if (!currentClassroom) return;
    
    document.getElementById('manageClassroomTitle').textContent = currentClassroom.name;
    document.getElementById('editClassroomName').value = currentClassroom.name;
    document.getElementById('editClassroomSubject').value = currentClassroom.subject || '';
    document.getElementById('editClassroomDescription').value = currentClassroom.description || '';
    document.getElementById('classroomCode').value = currentClassroom.code;
    
    populateStudentsTable(classroomId);
    manageClassroomModal.show();
}

function populateStudentsTable(classroomId) {
    const studentsTableBody = document.getElementById('studentsTableBody');
    const noStudentsYet = document.getElementById('noStudentsYet');
    studentsTableBody.innerHTML = '';
    
    const students = teacherData.studentsInClass[classroomId] || [];
    
    if (students.length === 0) {
        noStudentsYet.classList.remove('d-none');
        return;
    }
    
    noStudentsYet.classList.add('d-none');
    
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
    
    document.querySelectorAll('.remove-student-btn').forEach(button => {
        button.addEventListener('click', () => {
            const studentId = parseInt(button.getAttribute('data-student-id'));
            removeStudent(classroomId, studentId);
        });
    });
}

function showCreateQuizForClassroom(classroomId) {
    switchToTab('create');
    document.getElementById('quizClassroom').value = classroomId;
}

async function handleCreateClassroom() {
    const name = document.getElementById('classroomName').value;
    const subject = document.getElementById('classroomSubject').value;
    const description = document.getElementById('classroomDescription').value;

    if (!name) {
        alert('Please enter a classroom name');
        return;
    }

    const code = generateClassCode();
    const newClassroom = {
        name : name,
        subject: subject ,
        description : description,
        code : code
    };
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/teacher/classrooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' , 
                'Authorization' : `Bearer ${token}`
            },
            body: JSON.stringify(newClassroom)
        });

        if (!response.ok) {
            throw new Error('Failed to create classroom');
        }

        const savedClassroom = await response.json();

        teacherData.classrooms.push(savedClassroom);

        populateClassrooms();
        createClassroomModal.hide();
    } catch (error) {
        console.error(error);
        alert('An error occurred while creating the classroom.');
    }
}

function handleSaveClassroomChanges() {
    if (!currentClassroom) return;
    
    currentClassroom.name = document.getElementById('editClassroomName').value;
    currentClassroom.subject = document.getElementById('editClassroomSubject').value;
    currentClassroom.description = document.getElementById('editClassroomDescription').value;
    
    populateClassrooms();
    manageClassroomModal.hide();
    alert('Classroom updated successfully');
}

export {
    populateClassrooms,
    showCreateClassroomModal,
    showManageClassroomModal,
    handleCreateClassroom,
    handleSaveClassroomChanges,
    currentClassroom
};