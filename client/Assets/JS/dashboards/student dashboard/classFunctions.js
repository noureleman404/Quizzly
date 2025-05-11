import { studentData } from './data.js';
import { classesList, noClasses } from './DOM-elements.js';

export function populateClasses() {
    const classesList = document.getElementById('classesList');
    const noClasses = document.getElementById('noClasses');
    const joinClassCard = classesList.querySelector('.join-class-card');
    
    // Clear previous classes (keep join class card)
    classesList.querySelectorAll('.col-md-4:not(.join-class-card)').forEach(el => el.remove());
    
    if (studentData.enrolledClasses.length === 0) {
        noClasses.classList.remove('d-none');
        return; 
    }
    
    noClasses.classList.add('d-none');
    
    studentData.enrolledClasses.forEach(classItem => {
        const classCard = document.createElement('div');
        classCard.className = 'col-md-4 mb-4';
        
        const initials = classItem.name.split(' ')
            .filter(word => word.length > 0) // to ensure we don't get undefined
            .map(word => word[0].toUpperCase())
            .join('');
        
        classCard.innerHTML = `
            <div class="card h-100">
                <div class="bg-gradient text-white p-4 text-center h5 mb-0">
                    ${initials || '?'} <!-- Fallback if no initials -->
                </div>
                <div class="card-body">
                    <h3 class="h6 mb-2">${classItem.name || 'Unnamed Class'}</h3>
                    <p class="text-muted small mb-3">Teacher: ${classItem.teacher || 'Unknown'}</p>
                    <p class="text-muted small mb-3">Students: ${classItem.studentsCount || 0}</p>
                    <button class="btn btn-outline-primary w-100">Class Details</button>
                </div>
            </div>
        `;
        
        classesList.insertBefore(classCard, joinClassCard);
    });
}