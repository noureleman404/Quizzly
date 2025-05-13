// Student data
export const studentData = {
    name: 'Alex',
    upcomingQuizzes: [
        {
            id: 1,
            title: 'Cell Structure and Function',
            className: 'Biology 101',
            date: '2025-05-05',
            timeLeft: '2 days',
            duration: 60,
            locked: false
        },
        {
            id: 2,
            title: 'Periodic Table Elements',
            className: 'Chemistry Advanced',
            date: '2025-05-08',
            timeLeft: '5 days',
            duration: 45,
            locked: true
        },
        {
            id: 3,
            title: 'Newton\'s Laws of Motion',
            className: 'Physics 202',
            date: '2025-05-12',
            timeLeft: '9 days',
            duration: 50,
            locked: true
        }
    ],
    completedQuizzes: [
        {
            id: 101,
            title: 'Introduction to Biology',
            className: 'Biology 101',
            date: '2025-04-10',
            score: '85%',
            grade: 'C+'
        },
        {
            id: 102,
            title: 'Atomic Structure',
            className: 'Chemistry Advanced',
            date: '2025-04-15',
            score: '92%',
            grade: 'A-'
        }
    ],
    enrolledClasses: [
        { id: 1, name: 'Biology 101', teacher: 'Dr. Johnson', studentsCount: 32 },
        { id: 2, name: 'Chemistry Advanced', teacher: 'Prof. Williams', studentsCount: 28 },
        { id: 3, name: 'Physics 202', teacher: 'Dr. Rodriguez', studentsCount: 24 }
    ]
};