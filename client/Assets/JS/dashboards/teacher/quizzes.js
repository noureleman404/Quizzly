import { teacherData } from './data.js';
import { switchToTab } from './utils.js';
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
        const quizDate = new Date(quiz.created_at);
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
            console.log(quizId)
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
    // console.log(title , classroomId , bookId , pageFrom , pageTo , date , timeLimit)
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
        deadline_date: date
    };
    const token = localStorage.getItem('token');
    try {
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
        console.log('created')
        switchToTab('quizzes')
    } catch (error) {
        console.error(error);
        alert('An error occurred while creating the quiz.');
    }

    // Update UI
    populateUpcomingQuizzes();
    populateClassrooms();
  
}

function editQuiz(quizId) {
    const quiz = teacherData.upcomingQuizzes.find(q => q.id === quizId);
    if (!quiz) return;

    switchToTab('create');
    document.getElementById('quizTitle').value = quiz.title;
    document.getElementById('quizClassroom').value = quiz.classroomId;
    document.getElementById('quizBook').value = quiz.bookId;
    document.getElementById('pageRangeFrom').value = quiz.pageRange.split('-')[0];
    document.getElementById('pageRangeTo').value = quiz.pageRange.split('-')[1];
    document.getElementById('quizDate').value = quiz.date;

    alert('Editing quiz - make changes and click "Generate Test" to update');
}

function viewQuiz(quizId) {
    const quiz = teacherData.upcomingQuizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    alert(`Quiz Details:\n
        Title: ${quiz.title}\n
        Classroom: ${quiz.classroom}\n
        Book: ${quiz.book}\n
        Pages: ${quiz.pageRange}\n
        Date: ${new Date(quiz.date).toLocaleDateString()}`);
}