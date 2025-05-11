import { studentData } from './data.js';
import { 
    dashboardTabs, 
    logoutButton, 
    joinClassBtn 
} from './DOM-elements.js';
import { switchTab, updateDashboardStats } from './core-function.js';
import { handleLogout, handleJoinClass} from './eventHandlers.js';

import { populateClasses} from './classFunctions.js';

import {
    populateUpcomingQuizzes, 
    populateCompletedQuizzes 
} from './quiz.js';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('studentName').textContent = studentData.name;

    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });
    logoutButton.addEventListener('click', handleLogout);
    joinClassBtn.addEventListener('click', handleJoinClass);
    
    // populate data
    updateDashboardStats();
    populateUpcomingQuizzes();
    populateCompletedQuizzes();
    populateClasses();
    
    // activate default tab
    document.querySelector('.dashboard-tab.active').click();
});