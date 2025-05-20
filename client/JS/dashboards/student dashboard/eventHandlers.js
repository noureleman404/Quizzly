import { loadDashboardData, studentData } from './data.js';
import { updateDashboardStats } from './core-function.js';
import { populateClasses } from './classFunctions.js';

// Handling join class button click
export async function handleJoinClass() {
    const classCode = document.getElementById('classCode').value;
    
    if (!classCode.trim()) {
        alert('Please enter a class code');
        return;
    }
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/student/classroom/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }, body : JSON.stringify({
            classroom_code: classCode
        })
    });

    if (!response.ok) {
        alert('Failed to join the class');
        throw new Error('Failed to join classroom');        
    }
    // Update dashboard stats and classes list
    await loadDashboardData ();
    updateDashboardStats();
    populateClasses();
    
    // Clear the input field
    document.getElementById('classCode').value = '';
    
    alert('Successfully joined the class!');
}


