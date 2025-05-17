let studentData = null;

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/student/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
            
        }

        const data = await response.json();
        const { upcomingQuizzes = [], enrolledClasses = [], completedQuizzes = []} = data;
        studentData = {
            name: JSON.parse(localStorage.getItem('currentUser')).name,
            upcomingQuizzes: upcomingQuizzes,
            enrolledClasses: enrolledClasses,
            completedQuizzes: completedQuizzes,
        };
        return studentData;
    } catch (error) {
        window.location.href = '../../index.html';
        console.error('Dashboard load error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        throw error;
    }
}

export { studentData, loadDashboardData };