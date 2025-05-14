import { loadDashboardData, teacherData } from './data.js';
import { createClassroomModal, manageClassroomModal } from './dom-elements.js';
import { generateClassCode, switchToTab } from '../utils.js';

let currentClassroom = null;

function populateClassrooms() {
    const classroomsList = document.getElementById('classroomsList');
    const noClassrooms = document.getElementById('noClassrooms');
    const createClassroomCard = classroomsList.querySelector('.card.border-dashed').parentNode;
    document.getElementById('saveClassroomChangesBtn').addEventListener('click' , handleSaveClassroomChanges);
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
    
    
    document.querySelectorAll('.new-quiz-btn').forEach(button => {
        button.addEventListener('click', () => {
            const classroomId = parseInt(button.getAttribute('data-classroom-id'));
            showCreateQuizForClassroom(classroomId);
        });
    });

    document.querySelectorAll('.manage-classroom-btn').forEach(button => {
        button.addEventListener('click', () => {
            const classroomId = parseInt(button.getAttribute('data-classroom-id'));
            showManageClassroomModal(classroomId);
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

    // Set modal title and input values
    document.getElementById('manageClassroomTitle').textContent = currentClassroom.name;
    document.getElementById('editClassroomName').value = currentClassroom.name;
    document.getElementById('editClassroomSubject').value = currentClassroom.subject || '';
    document.getElementById('editClassroomDescription').value = currentClassroom.description || '';

    // Set the initial classroom code
    const classroomCodeInput = document.getElementById('classroomCode');
    classroomCodeInput.value = currentClassroom.code || generateClassCode(); // Default or generated code
    
    // Handle "Regenerate Code" button
    document.getElementById('regenerateCodeBtn').addEventListener('click', () => {
        const newCode = generateClassCode();
        classroomCodeInput.value = newCode; // Update input with new code

    });
    document.getElementById('deleteClassroomBtn').addEventListener('click', handleDeleteClassroom);

    document.getElementById('copyCodeBtn').addEventListener('click', () => {
        const classroomCodeInput = document.getElementById('classroomCode'); // Get the classroom code input element
        const copyButton = document.getElementById('copyCodeBtn'); // Get the copy button element
        if (document.activeElement !== classroomCodeInput) {
            classroomCodeInput.focus();
        }
        
        if (classroomCodeInput.value) {
            navigator.clipboard.writeText(classroomCodeInput.value)
                .then(() => {
                    // Change the button text to 'Copied!'
                    copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copied';
                    
                    // Reset the button text back to 'Copy' after 1 second (1000ms)
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
                    }, 1000);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
        } else {
            alert('No classroom code available to copy.');
        }
    });

    // Populate the student list
    populateStudentsTable(classroomId);

    // Show the modal
    manageClassroomModal.show();
}

async function populateStudentsTable(classroomId) {
    const studentsTableBody = document.getElementById('studentsTableBody');
    const noStudentsYet = document.getElementById('noStudentsYet');
    studentsTableBody.innerHTML = '';

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/teacher/classrooms/${classroomId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    const data = await response.json();
    const {classroom , students = []} = data;

    // const students = [
    //                 { id: 101, name: 'John Smith', email: 'john@example.com' },
    //                 { id: 102, name: 'Emily Brown', email: 'emily@example.com' },
    //                 { id: 103, name: 'Michael Jones', email: 'michael@example.com' }
    //             ];
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
                <button class="btn btn-sm btn-outline-danger remove-student-btn" data-student-id="${student.student_id}">
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
async function removeStudent(classroomId, studentId) {
    
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/teacher/classrooms/${classroomId}/kick`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } ,
            body: JSON.stringify({
                student_id : studentId
            })
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    // Update students table
    populateStudentsTable(classroomId);
    // Update classroom list
    populateClassrooms();
    await loadDashboardData();

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

async function handleSaveClassroomChanges() {
    if (!currentClassroom) return;
    currentClassroom.name = document.getElementById('editClassroomName').value;
    currentClassroom.subject = document.getElementById('editClassroomSubject').value;
    currentClassroom.description = document.getElementById('editClassroomDescription').value;
    currentClassroom.code = document.getElementById('classroomCode').value;

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/teacher/classrooms/${currentClassroom.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } , 
            body: JSON.stringify({
                name : currentClassroom.name , 
                subject : currentClassroom.subject , 
                description: currentClassroom.description , 
                joinCode: currentClassroom.code
            })
    });

    if (!response.ok) {
        throw new Error('Failed to update classroom data');
    }
    populateClassrooms();
    manageClassroomModal.hide();
    alert('Classroom updated successfully');
}
async function handleDeleteClassroom() {
    if (!currentClassroom) return;
    if (!confirm(`Are you sure you want to delete the classroom "${currentClassroom.name}"? This will also remove all associated students and quizzes.`)) {
        return;
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/teacher/classrooms/${currentClassroom.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } ,
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    // Remove classroom from classrooms array
    teacherData.classrooms = teacherData.classrooms.filter(c => c.id !== currentClassroom.id);
        
    // Remove quizzes
    teacherData.upcomingQuizzes = teacherData.upcomingQuizzes.filter(q => q.classroomId !== currentClassroom.id);
    
    manageClassroomModal.hide();
    
    // Update the UI
    populateClassrooms();
    alert(`Classroom "${currentClassroom.name}" has been deleted successfully.`);
}

export {
    populateClassrooms,
    showCreateClassroomModal,
    showManageClassroomModal,
    handleCreateClassroom,
    handleSaveClassroomChanges,
    currentClassroom
};