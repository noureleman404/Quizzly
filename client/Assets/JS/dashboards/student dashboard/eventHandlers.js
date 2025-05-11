import { studentData } from './data.js';
import { updateDashboardStats } from './core-function.js';
import { populateClasses } from './classFunctions.js';

// Handling join class button click
export function handleJoinClass() {
    const classCode = document.getElementById('classCode').value;
    
    if (!classCode.trim()) {
        alert('Please enter a class code');
        return;
    }
    
    // Simulate joining class 
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
export function handleLogout() {
    // For demo purpose, redirect to index page
    window.location.href = '../../../index.html';
}