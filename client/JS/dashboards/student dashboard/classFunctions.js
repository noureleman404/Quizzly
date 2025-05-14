import { studentData } from './data.js';
import { classesList, noClasses } from './DOM-elements.js';

document.addEventListener('click', function(e) {
    const leaveBtn = e.target.closest('.leave-class-btn');
    if (leaveBtn) {
        e.preventDefault();
        const classId = parseInt(leaveBtn.dataset.id);
        console.log(classId)
        handleLeaveClass(classId);
    }
});
export function populateClasses() {
    // Clear previous classes (keep join class card)
    classesList.querySelectorAll('.col-md-4:not(.join-class-card)').forEach(el => el.remove());
    
    // Show empty state if no classes
    if (studentData.enrolledClasses.length === 0) {
        noClasses.classList.remove('d-none');
        return; 
    }
    
    noClasses.classList.add('d-none');
    
    // Create and populate class cards
    studentData.enrolledClasses.forEach(classItem => {
        const classCard = createClassCard(classItem);
        classesList.insertBefore(classCard, classesList.querySelector('.join-class-card'));
        
        // Add event listener to the class details button
        const detailsBtn = classCard.querySelector('.class-details-btn');
        detailsBtn.addEventListener('click', () => showClassDetails(classItem.id));
    });
   
}
export async function handleLeaveClass(classId) {
    if (!confirm('Are you sure you want to leave this class? You will lose access to all class materials.')) {
        return;
    }
    

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/student/classrooms/${classId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        alert('Failed to laeve the class');
        throw new Error('Failed to leave the class');        
    }
    // Remove class from enrolled classes
    studentData.enrolledClasses = studentData.enrolledClasses.filter(c => c.id !== classId);
    
    // Remove any quizzes associated with this class
    studentData.upcomingQuizzes = studentData.upcomingQuizzes.filter(q => q.classId !== classId);
    studentData.completedQuizzes = studentData.completedQuizzes.filter(q => q.classId !== classId);
    
    // Update the UI
    populateClasses();

    
    alert('You have successfully left the class.');
}

function createClassCard(classItem) {
    const classCard = document.createElement('div');
    classCard.className = 'col-md-4 mb-4';
    
    const initials = classItem.name.split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('');
    
    classCard.innerHTML = `
        <div class="card h-100">
            <div class="card-header bg-white border-bottom-0 position-relative">
                <button class="btn btn-sm btn-outline-danger top-0 end-0 m-2 leave-class-btn" 
                            data-id="${classItem.id}" title="Leave class">
                        <i class="bi bi-box-arrow-left"></i>
                </button>
            </div>
            <div class="bg-gradient text-white p-4 text-center h5 mb-0">
                ${initials || '?'}
            </div>
            <div class="card-body">
                <h3 class="h6 mb-2">${classItem.name || 'Unnamed Class'}</h3>
                <p class="text-muted small mb-3">Teacher: ${classItem.teacher || 'Unknown'}</p>
                <p class="text-muted small mb-3">Students: ${classItem.students_count || 0}</p>
                <button class="btn btn-outline-primary w-100 class-details-btn" data-class-id="${classItem.id}">
                    Class Details
                </button>
            </div>
        </div>
    `;
    
    return classCard;
}

async function showClassDetails(classId) {
    const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/student/classrooms/${classId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Classroom data');
            
        }
    const data = await response.json();
    const { classData = {}} = data;
    if (!classData) return;
    
    const modal = document.createElement('div');
    modal.className = 'class-details-modal';
    modal.id = 'classDetailsModal';
    modal.innerHTML = generateModalContent(classData);
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.class-modal-close').addEventListener('click', closeClassModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeClassModal();
    });
    
    // Trigger animation
    setTimeout(() => modal.classList.add('show'), 10);
}

function generateModalContent(classData) {
    return `
        <div class="class-modal-content">
            <div class="class-modal-header">
                <h3>${classData.name}</h3>
                <button class="class-modal-close"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="class-modal-body">
                ${generateDetailItems(classData)}
            </div>
        </div>
    `;
}
// /new Date(quiz.date)
function generateDetailItems(classData) {
    const details = [
        { label: 'Teacher', value: `Mr. ${classData.teacher_name}` },
        { label: 'Students', value: classData.student_count },
        { label: 'Subject', value: classData.subject },
        { label: 'Created At', value: new Date(classData.created_at).toLocaleDateString() },
        { label: 'Description', value: classData.description }
    ];
    return details.map(detail => `
        <div class="class-detail-item">
            <span class="detail-label">${detail.label}:</span>
            <span class="detail-value">${detail.value}</span>
        </div>
    `).join('');
}

function closeClassModal() {
    const modal = document.getElementById('classDetailsModal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
}