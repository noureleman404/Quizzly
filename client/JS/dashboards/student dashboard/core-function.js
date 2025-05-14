import { studentData } from './data.js';
import { 
    dashboardTabs, 
    dashboardContents 
} from './DOM-elements.js';

// Update dashboard statistics
export function updateDashboardStats() {
    document.getElementById('upcomingQuizzesCount').textContent = studentData.upcomingQuizzes.length;
    document.getElementById('enrolledClassesCount').textContent = studentData.enrolledClasses.length;
    document.getElementById('completedQuizzesCount').textContent = studentData.completedQuizzes.length;
}

// Switch between dashboard tabs
export function switchTab() {
    const tabId = this.getAttribute('data-tab');
    
    // Update active tab
    dashboardTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    this.classList.add('active');
    
    // Show (corresponding) content
    dashboardContents.forEach(content => {
        content.classList.toggle('d-none', content.getAttribute('data-content') !== tabId);
    });
}