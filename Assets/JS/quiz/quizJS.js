
// Quiz Data - This would come from backend in production
const quizData = {
    id: "quiz123",
    title: "Cell Structure and Function",
    className: "Biology 101",
    timeLimit: 60, // minutes
    questions: [
        {
            id: 1,
            text: "Which of the following organelles is responsible for protein synthesis in a cell?",
            options: [
                "Mitochondria",
                "Ribosome",
                "Golgi apparatus",
                "Lysosome"
            ],
            correctAnswer: 1 // zero-based index (Ribosome)
        },
        {
            id: 2,
            text: "What is the main function of the cell membrane?",
            options: [
                "Energy production",
                "Protein synthesis",
                "Selective permeability",
                "DNA replication"
            ],
            correctAnswer: 2 // (Selective permeability)
        },
        {
            id: 3,
            text: "Which cell organelle contains enzymes for digesting cellular macromolecules?",
            options: [
                "Nucleus",
                "Endoplasmic reticulum",
                "Lysosome",
                "Mitochondria"
            ],
            correctAnswer: 2 // (Lysosome)
        },
        {
            id: 4,
            text: "The cell theory states that:",
            options: [
                "All cells arise from pre-existing cells",
                "The cell is the basic unit of life",
                "All living things are composed of cells",
                "All of the above"
            ],
            correctAnswer: 3 // (All of the above)
        },
        {
            id: 5,
            text: "Which of the following is NOT a component of the cytoskeleton?",
            options: [
                "Microfilaments",
                "Microtubules",
                "Intermediate filaments",
                "Ribosomes"
            ],
            correctAnswer: 3 // (Ribosomes)
        }
    ]
};

// Global variables
let currentQuestion = 0;
let selectedAnswers = {};
let timeLeft = quizData.timeLimit * 60; // convert to seconds
let timerInterval;
let mediaRecorder;
let recordedChunks = [];
let stream;
let isQuizSubmitted = false;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize quiz data
    document.getElementById('quizTitle').textContent = quizData.title;
    document.getElementById('quizClass').textContent = quizData.className;
    document.getElementById('totalQuestions').textContent = quizData.questions.length;
    document.getElementById('summaryTotal').textContent = quizData.questions.length;
    document.getElementById('summaryTotal2').textContent = quizData.questions.length;
    document.getElementById('summaryTimeLimit').textContent = `${quizData.timeLimit} minutes`;
    document.getElementById('modalTotal').textContent = quizData.questions.length;
    
    // Setup webcam first - this is required for the quiz
    setupWebcamModal();

    // Initialize question navigation
    createQuestionNavigation();

    // Load first question
    loadQuestion(currentQuestion);

    // Setup event listeners
    document.getElementById('prevButton').addEventListener('click', goToPrevQuestion);
    document.getElementById('nextButton').addEventListener('click', goToNextQuestion);
    document.getElementById('submitQuiz').addEventListener('click', showConfirmationModal);
    document.getElementById('confirmSubmit').addEventListener('click', submitQuiz);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// Webcam setup
function setupWebcamModal() {
    const webcamModal = new bootstrap.Modal(document.getElementById('webcamModal'), {
        keyboard: false,
        backdrop: 'static'
    });
    webcamModal.show();

    document.getElementById('enableWebcam').addEventListener('click', async () => {
        try {
            await initializeWebcam();
            webcamModal.hide();
            startTimer(); // Only start the timer once the webcam is enabled
        } catch (error) {
            console.error("Error accessing webcam:", error);
            document.getElementById('webcam').innerHTML = `
                <div class="webcam-error">
                    Camera access denied. You cannot continue with the quiz.
                </div>`;
        }
    });
}

// Initialize webcam
async function initializeWebcam() {
    try {
        // Request webcam access with both video and audio
        stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        const videoElement = document.getElementById('webcam');
        videoElement.srcObject = stream;
        
        // Start recording
        startRecording(stream);
        
        return true;
    } catch (error) {
        console.error("Error initializing webcam:", error);
        throw error;
    }
}

// Start recording from webcam
function startRecording(stream) {
    try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            // In a real implementation, here we would:
            // 1. Create a blob from the recorded chunks
            // 2. Upload this to a server or store temporarily
            console.log("Recording stopped, chunks:", recordedChunks.length);
        };
        
        // Start recording in 5-second chunks for easier handling
        mediaRecorder.start(5000);
    } catch (error) {
        console.error("Error starting recording:", error);
    }
}

// Create question navigation buttons
function createQuestionNavigation() {
    const navContainer = document.getElementById('questionNav');
    navContainer.innerHTML = '';
    
    for (let i = 0; i < quizData.questions.length; i++) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm rounded-circle question-nav-btn ${i === currentQuestion ? 'active' : 'btn-outline-secondary'}`;
        btn.textContent = i + 1;
        
        btn.addEventListener('click', () => {
            navigateToQuestion(i);
        });
        
        navContainer.appendChild(btn);
    }
}

// Update question navigation buttons
function updateQuestionNavigation() {
    const buttons = document.querySelectorAll('.question-nav-btn');
    
    buttons.forEach((btn, index) => {
        btn.classList.remove('active', 'answered', 'btn-outline-secondary');
        
        if (index === currentQuestion) {
            btn.classList.add('active');
        } else {
            if (selectedAnswers[index] !== undefined) {
                btn.classList.add('answered');
            } else {
                btn.classList.add('btn-outline-secondary');
            }
        }
    });
}

// Navigate to a specific question
function navigateToQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < quizData.questions.length) {
        currentQuestion = questionIndex;
        loadQuestion(currentQuestion);
    }
}

// Load question data
function loadQuestion(index) {
    const question = quizData.questions[index];
    
    // Update question text
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('currentQuestionNum').textContent = index + 1;
    
    // Update progress bar
    const progressPercentage = ((index + 1) / quizData.questions.length) * 100;
    document.getElementById('quizProgress').style.width = `${progressPercentage}%`;
    
    // Generate options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, optionIndex) => {
        const isSelected = selectedAnswers[index] === optionIndex;
        
        const optionDiv = document.createElement('div');
        optionDiv.className = `quiz-option ${isSelected ? 'selected' : ''}`;
        optionDiv.onclick = () => selectAnswer(index, optionIndex);
        
        optionDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-3 rounded-circle border d-flex align-items-center justify-content-center" 
                     style="width: 24px; height: 24px; ${isSelected ? 'border-color: var(--primary-purple); background-color: var(--primary-purple); color: white;' : ''}">
                    ${isSelected ? '✓' : ''}
                </div>
                <span>${option}</span>
            </div>
        `;
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prevButton').disabled = index === 0;
    document.getElementById('nextButton').textContent = index === quizData.questions.length - 1 ? 'Finish' : 'Next';
    
    // Update navigation indicators
    updateQuestionNavigation();
}

// Handle answer selection
function selectAnswer(questionIndex, optionIndex) {
    selectedAnswers[questionIndex] = optionIndex;
    loadQuestion(questionIndex);
    updateQuizSummary();
}

// Go to previous question
function goToPrevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion(currentQuestion);
    }
}

// Go to next question
function goToNextQuestion() {
    if (currentQuestion < quizData.questions.length - 1) {
        currentQuestion++;
        loadQuestion(currentQuestion);
    } else {
        showConfirmationModal();
    }
}

// Update quiz summary information
function updateQuizSummary() {
    const answeredCount = Object.keys(selectedAnswers).length;
    
    document.getElementById('summaryAnswered').textContent = answeredCount;
    document.getElementById('modalAnswered').textContent = answeredCount;
}

// Show confirmation modal before submitting
function showConfirmationModal() {
    updateQuizSummary();
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
}

// Submit quiz
function submitQuiz() {
    if (isQuizSubmitted) return; // Prevent multiple submissions
    
    isQuizSubmitted = true;
    clearInterval(timerInterval);
    
    // Stop recording
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    // Stop all media tracks
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Calculate score
    let score = 0;
    for (let i = 0; i < quizData.questions.length; i++) {
        if (selectedAnswers[i] === quizData.questions[i].correctAnswer) {
            score++;
        }
    }
    
    // Prepare data for submission
    const submissionData = {
        quizId: quizData.id,
        answers: selectedAnswers,
        timeSpent: quizData.timeLimit * 60 - timeLeft,
        score: score,
        totalQuestions: quizData.questions.length
    };
    
    console.log("Quiz submitted:", submissionData);
    
    // In a real implementation, this would be sent to the server
    // For now, simulate submission with an alert
    alert(`Quiz submitted!\nScore: ${score}/${quizData.questions.length}`);
    
    // Redirect to results page (in a real implementation)
    setTimeout(() => {
        window.location.href = '../../Pages/dashboards/student-veiw.html';
    }, 1500);
}

// Start the quiz timer
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        
        // Update timer displays
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer').textContent = formattedTime;
        document.getElementById('summaryTimer').textContent = formattedTime;
        
        // Handle timer ending
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Your quiz will be submitted automatically.");
            submitQuiz();
        }
        
        // Warning when 5 minutes remaining
        if (timeLeft === 300) {
            document.getElementById('timer').classList.add('text-danger');
            document.getElementById('summaryTimer').classList.add('text-danger');
        }
    }, 1000);
}

// Handle logout
function handleLogout() {
    // In a real application, this would clear session data, tokens, etc.
    if (confirm("Are you sure you want to log out? Your quiz progress will be lost.")) {
        // Stop recording if active
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        
        // Stop all media tracks
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Handle page unload/refresh attempts
window.addEventListener('beforeunload', (e) => {
    if (!isQuizSubmitted) {
        // Show confirmation message
        const confirmationMessage = "You have unsaved changes. If you leave now, your quiz progress will be lost.";
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    }
});

