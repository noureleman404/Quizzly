let teacherData = null;

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        console.log(token)
        const response = await fetch('http://localhost:3000/teacher/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(response)
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
            
        }

        const data = await response.json();
        const { books = [], quizzes = [], past_quizzes = [], classrooms = [], completions = [], students_num } = data;
        teacherData = {
            name: JSON.parse(localStorage.getItem('currentUser')).name,
            classrooms: classrooms,
            upcomingQuizzes: quizzes,
            pastQuizzes: past_quizzes || [],
            uploadedBooks: books,
            studentsNum: students_num
        };
        return teacherData;
    } catch (error) {
        window.location.href = '../../index.html';
        console.error('Dashboard load error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        throw error;
    }
}

export { teacherData, loadDashboardData };