import { teacherData } from './data.js';
import { populateBookSelect } from './quizzes.js';

export function populateUploadedBooks() {
    const uploadedBooksList = document.getElementById('uploadedBooksList');
    const noUploadedBooks = document.getElementById('noUploadedBooks');
    uploadedBooksList.innerHTML = '';

    if (teacherData.uploadedBooks.length === 0) {
        noUploadedBooks.classList.remove('d-none');
        return;
    }

    noUploadedBooks.classList.add('d-none');

    teacherData.uploadedBooks.forEach(book => {
        const row = document.createElement('tr');
        const uploadDate = new Date(book.created_at);
        const formattedDate = uploadDate.toLocaleDateString();

        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.subject}</td>
            <td>${book.pages}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2 view-book-btn" data-book-id="${book.id}">
                    <i class="bi bi-eye me-1"></i>View
                </button>
                <button class="btn btn-sm btn-outline-danger delete-book-btn" data-book-id="${book.id}">
                    <i class="bi bi-trash me-1"></i>Delete
                </button>
            </td>
        `;
        uploadedBooksList.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll('.view-book-btn').forEach(button => {
        button.addEventListener('click', () => {
            const bookId = parseInt(button.getAttribute('data-book-id'));
            viewBook(bookId);
        });
    });

    document.querySelectorAll('.delete-book-btn').forEach(button => {
        button.addEventListener('click', () => {
            const bookId = parseInt(button.getAttribute('data-book-id'));
            deleteBook(bookId);
        });
    });
}

export function handleFileSelection(file) {
    const allowedTypes = ['application/pdf', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, DOCX, or TXT files allowed');
        return;
    }

    if (file.size > 25 * 1024 * 1024) {
        alert('File size must be <25MB');
        return;
    }

    document.getElementById('selectedFileName').textContent = `Selected: ${file.name}`;
    document.getElementById('selectedFileName').classList.remove('d-none');
}

export function handleUploadBook() {
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const subject = document.getElementById('bookSubject').value;
    const pages = parseInt(document.getElementById('bookPages').value);
    const fileInput = document.getElementById('fileInput');

    if (!title || !fileInput.files[0]) {
        alert('Title and file are required');
        return;
    }

    const newBook = {
        id: Date.now(),
        title: title,
        author: author || 'Unknown',
        subject: subject || 'General',
        pages: pages || 0,
        created_at: new Date().toISOString().split('T')[0]
    };

    teacherData.uploadedBooks.push(newBook);
    populateUploadedBooks();
    populateBookSelect();

    // Reset form
    document.getElementById('uploadBookForm').reset();
    document.getElementById('selectedFileName').classList.add('d-none');
    alert('Book uploaded successfully!');
}

function viewBook(bookId) {
    const book = teacherData.uploadedBooks.find(b => b.id === bookId);
    if (!book) return;
    alert(`Viewing: ${book.title}\nAuthor: ${book.author}\nPages: ${book.pages}`);
}

function deleteBook(bookId) {
    if (!confirm('Permanently delete this book?')) return;
    
    teacherData.uploadedBooks = teacherData.uploadedBooks.filter(b => b.id !== bookId);
    populateUploadedBooks();
    populateBookSelect();
    alert('Book deleted successfully');
}