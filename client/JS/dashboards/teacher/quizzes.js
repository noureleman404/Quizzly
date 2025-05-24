import { loadDashboardData, teacherData } from './data.js';
import { showGlobalLoading, switchToTab } from '../utils.js';
import { populateClassrooms } from './classrooms.js';

export function populateUpcomingQuizzes() {
    const upcomingQuizzesList = document.getElementById('upcomingQuizzesList');
    const noUpcomingQuizzes = document.getElementById('noUpcomingQuizzes');

    upcomingQuizzesList.innerHTML = '';

    if (teacherData.upcomingQuizzes.length === 0) {
        noUpcomingQuizzes.classList.remove('d-none');
        return;
    }

    noUpcomingQuizzes.classList.add('d-none');

    teacherData.upcomingQuizzes.forEach(quiz => {
        const row = document.createElement('tr');
        const quizDate = new Date(quiz.deadline_date);
        const formattedDate = quizDate.toLocaleDateString();

        row.innerHTML = `
            <td>${quiz.title}</td>
            <td>${quiz.classroom_name}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2 edit-quiz-btn" data-quiz-id="${quiz.quiz_id}">Edit</button>
                <button class="btn btn-sm btn-primary view-quiz-btn" data-quiz-id="${quiz.quiz_id}">View</button>
            </td>
        `;
        upcomingQuizzesList.appendChild(row);
    });

    // Add event listeners for quiz buttons
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

export function populateQuizClassroomSelect() {
    const quizClassroomSelect = document.getElementById('quizClassroom');
    while (quizClassroomSelect.options.length > 1) {
        quizClassroomSelect.remove(1);
    }
    
    teacherData.classrooms.forEach(classroom => {
        const option = document.createElement('option');
        option.value = classroom.id;
        option.textContent = classroom.name;
        quizClassroomSelect.appendChild(option);
    });
}

export function populateBookSelect() {
    const quizBookSelect = document.getElementById('quizBook');
    while (quizBookSelect.options.length > 1) {
        quizBookSelect.remove(1);
    }
    
    teacherData.uploadedBooks.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id;
        option.textContent = book.title;
        quizBookSelect.appendChild(option);
    });
}

export async function handleGenerateQuiz() {
    const title = document.getElementById('quizTitle').value;
    const classroomId = parseInt(document.getElementById('quizClassroom').value);
    const bookId = parseInt(document.getElementById('quizBook').value);
    const pageFrom = parseInt(document.getElementById('pageRangeFrom').value);
    const pageTo = parseInt(document.getElementById('pageRangeTo').value);
    const date = document.getElementById('quizDate').value;
    const timeLimit = document.getElementById('quizTimeLimit').value;
    const checkbox = document.getElementById('personalizedQuiz');
    const isChecked = checkbox.checked;
    // Validation
    if (!title || isNaN(classroomId) || isNaN(bookId) || isNaN(pageFrom) || 
        isNaN(pageTo) || !date || !timeLimit) {
        alert('Please fill all required fields');
        return;
    }

    const classroom = teacherData.classrooms.find(c => c.id === classroomId);
    const book = teacherData.uploadedBooks.find(b => b.id === bookId);

    if (!classroom || !book) {
        alert('Invalid classroom or book selection');
        return;
    }

    if (pageFrom > pageTo) {
        alert('Invalid page range - "From" must be less than "To"');
        return;
    }

    if (pageTo > book.pages) {
        alert(`Selected book only has ${book.pages} pages`);
        return;
    }

    // Create new quiz
    const newQuiz = {
        title: title,
        classroom_id: classroom.id,
        book_id: book.id,
        startPage:pageFrom,
        endPage:pageTo,
        difficulty:"easy",
        number_of_questions:5,
        deadline_date: date , 
        personalized: isChecked ,
        duration : timeLimit
    };
    const token = localStorage.getItem('token');
    try {
        showGlobalLoading(true)
        const response = await fetch('http://localhost:8000/GenerateQuiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' , 
                'Authorization' : `Bearer ${token}`
            },
            body: JSON.stringify(newQuiz)
        });
        teacherData.upcomingQuizzes.push(newQuiz);
        classroom.quizzes++;
        if (!response.ok) {
            throw new Error('Failed to create classroom');
        }
        switchToTab('quizzes')
    } catch (error) {
        console.error(error);
        alert('An error occurred while creating the quiz.');
    }finally{
        showGlobalLoading(false)

    }

    // Update UI
    await loadDashboardData();
    populateUpcomingQuizzes();
    populateClassrooms();
  
}

function editQuiz(quizId) {
    const quiz = teacherData.upcomingQuizzes.find(q => q.quiz_id === quizId);
    // if (!quiz) return;

    const row = document.querySelector(`button.edit-quiz-btn[data-quiz-id="${quizId}"]`).closest('tr');
    
    // Make title editable
    const titleCell = row.cells[0];
    titleCell.innerHTML = `<input type="text" class="form-control form-control-sm" value="${quiz.title}" id="editQuizTitle">`;
    
    // Make classroom a dropdown
    const classroomCell = row.cells[1];
    let classroomOptions = teacherData.classrooms.map(c => 
        `<option value="${c.id}" ${c.id === quiz.classroomId ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    classroomCell.innerHTML = `
        <select class="form-select form-select-sm" id="editQuizClassroom">
            ${classroomOptions}
        </select>
    `;
    
    // Make date editable
    const dateCell = row.cells[2];
    dateCell.innerHTML = `<input type="date" class="form-control form-control-sm" value="${quiz.date}" id="editQuizDate">`;
    
    // Change Edit button to Save
    const actionCell = row.cells[3];
    actionCell.innerHTML = `
        <button class="btn btn-sm btn-outline-primary me-2 cancel-btn" data-id="${quizId}">Cancel</button>
        <button class="btn btn-sm btn-primary save-btn" data-id="${quizId}">Save</button>
    `;
    
    // Add event listeners
    document.querySelector('.cancel-btn').addEventListener('click', () => populateUpcomingQuizzes());
    document.querySelector('.save-btn').addEventListener('click', () => saveQuizChanges(quizId));
}

async function saveQuizChanges(quizId) {
    const quiz = teacherData.upcomingQuizzes.find(q => q.quiz_id === quizId);
    if (!quiz) return;
    const row = document.querySelector(`button.save-btn[data-id="${quizId}"]`).closest('tr');
    
    // Get updated values
    const newTitle = document.getElementById('editQuizTitle').value;
    const newClassroomId = parseInt(document.getElementById('editQuizClassroom').value);
    const newDate = document.getElementById('editQuizDate').value;
    
    // Find classroom name
    const classroom = teacherData.classrooms.find(c => c.id === newClassroomId);
    if (!classroom) {
        alert('Invalid classroom selected');
        return;
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/teacher/quiz/${quizId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } , 
            body: JSON.stringify({
                title : newTitle , 
                classroom : newClassroomId || classroom.id, 
                date: newDate || quiz.deadline_date , 
            })
    });

    if (!response.ok) {
        throw new Error('Failed to update quiz data');
    }

    // Rerender the table
    await loadDashboardData();
    populateUpcomingQuizzes();
    
    alert('Quiz updated successfully!');
}

async function viewQuiz(quizId) {
    const quiz = teacherData.upcomingQuizzes.find(q => q.quiz_id === parseInt(quizId));
    if (!quiz) return;
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:3000/teacher/quiz/${quizId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        } 
    });

    if (!response.ok) {
        throw new Error('Failed to get quiz data .');
    }
    
    const data = await response.json();
    const results = data.results
    console.log(data.results)

    const totalStudents = results.length;
    const passedStudents = results.filter(r => r.grade && ['A', 'B', 'C', 'D'].includes(r.grade[0])).length;
    const failedStudents = totalStudents - passedStudents;
    const averageScore = results.length ? 
        (results.reduce((sum, r) => sum + parseInt(r.score), 0) / results.length).toFixed(1) + '%' : 
        'N/A';

    // Update modal content
    document.getElementById('quizViewModalTitle').textContent = quiz.title;
    document.getElementById('averageGrade').textContent = averageScore;
    document.getElementById('passedStudents').textContent = passedStudents;
    document.getElementById('failedStudents').textContent = failedStudents;
    
    // Populate results table
    document.getElementById('quizResultsTable').innerHTML = results.map(student => `
        <tr>
            <td>${student.name}</td>
            <td>${student.score}</td>
            <td><span class="badge ${getGradeColorClass(student.grade)}">${student.grade}</span></td>
            <td>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar ${student.grade[0] <= 'D' ? 'bg-success' : 'bg-danger'}" 
                         style="width: ${student.score.replace('%', '')}%"></div>
                </div>
            </td>
        </tr>
    `).join('');
    const chartCanvas = document.getElementById('performanceChart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        
        // remove previous chart if exists
        if (chartCanvas.chart) {
            chartCanvas.chart.destroy();
        }
        
        // Create new chart
        chartCanvas.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [passedStudents, failedStudents],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }


    // Show modal
    new bootstrap.Modal('#quizViewModal').show();
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
