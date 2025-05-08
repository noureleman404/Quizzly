const dashboardTabs = document.querySelectorAll('.dashboard-tab');
const dashboardContents = document.querySelectorAll('.dashboard-content');
const logoutButton = document.getElementById('logoutButton');

// Bootstrap modals
let createClassroomModal;
let manageClassroomModal;

// Initialize modals
function initModals() {
    createClassroomModal = new bootstrap.Modal(document.getElementById('createClassroomModal'));
    manageClassroomModal = new bootstrap.Modal(document.getElementById('manageClassroomModal'));
}

export {
    dashboardTabs,
    dashboardContents,
    logoutButton,
    createClassroomModal,
    manageClassroomModal,
    initModals
};