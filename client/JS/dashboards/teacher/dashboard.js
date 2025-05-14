import { loadDashboardData , teacherData } from './data.js';
import { 
    dashboardTabs, 
    dashboardContents, 
    logoutButton, 
    initModals 
} from './dom-elements.js';
import { handleCreateClassroom, populateClassrooms, showCreateClassroomModal, showManageClassroomModal } from './classrooms.js';
import { handleGenerateQuiz, populateBookSelect, populateQuizClassroomSelect, populateUpcomingQuizzes } from './quizzes.js';
import { populateUploadedBooks, handleFileSelection, handleUploadBook } from './books.js';
import { handleLogout, showGlobalLoading, switchToTab } from '../utils.js';
// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // showGlobalLoading(true);
        showGlobalLoading(true);
        await loadDashboardData();
        showGlobalLoading(false);
        // Initialize Bootstrap modals
        initModals();
        
        // Update dashboard header with teacher name
        document.getElementById('teacherName').textContent = teacherData.name;
        document.getElementById('teacherNameHome').textContent = teacherData.name;
        document.getElementById('totalStudentsCount').textContent = teacherData.studentsNum;
        document.getElementById('classroomsCount').textContent = teacherData.classrooms.length;
        document.getElementById('uploadedBooksCount').textContent = teacherData.uploadedBooks.length;

        // Populate dashboard content
        populateClassrooms();
        populateUpcomingQuizzes();
        populateUploadedBooks();
        populateQuizClassroomSelect();
        populateBookSelect();
        // Add event listeners for tabs
        dashboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                switchToTab(tabId);
            });
        });
        
        // Add event listener for logout button
        logoutButton.addEventListener('click', handleLogout);
        
        // Add event listeners for classroom actions
        document.getElementById('newClassroomBtn').addEventListener('click', showCreateClassroomModal);
        document.getElementById('saveClassroomBtn').addEventListener('click', handleCreateClassroom);
        document.getElementById('generateQuizBtn').addEventListener('click', handleGenerateQuiz);
        document.getElementById('uploadBookBtn').addEventListener('click', handleUploadBook);
        

        // Add event listeners for file upload in upload book tab
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('border-primary');
        });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-primary'));
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
        
        
    } catch (error) {
        console.log(localStorage.getItem("token"))
        console.error('Dashboard initialization error:', error);
        // handleLogout();
        alert('Unable to load dashboard data. Please try again later.');
    }
});

