// const quizData = {
//     id: "quiz123",
//     title: "Cell Structure and Function",
//     className: "Biology 101",
//     version_id : 12,
//     timeLimit: 60, // minutes
//     questions: [
//         {
//             id: 1,
//             text: "Which of the following organelles is responsible for protein synthesis in a cell?",
//             options: [
//                 "Mitochondria",
//                 "Ribosome",
//                 "Golgi apparatus",
//                 "Lysosome"
//             ],
//             correctAnswer: 1 // zero-based index (Ribosome)
//         },
//         {
//             id: 2,
//             text: "What is the main function of the cell membrane?",
//             options: [
//                 "Energy production",
//                 "Protein synthesis",
//                 "Selective permeability",
//                 "DNA replication"
//             ],
//             correctAnswer: 2 // (Selective permeability)
//         },
//         {
//             id: 3,
//             text: "Which cell organelle contains enzymes for digesting cellular macromolecules?",
//             options: [
//                 "Nucleus",
//                 "Endoplasmic reticulum",
//                 "Lysosome",
//                 "Mitochondria"
//             ],
//             correctAnswer: 2 // (Lysosome)
//         },
//         {
//             id: 4,
//             text: "The cell theory states that:", //short answer question
//         },
//         {
//             id: 5,
//             text: "Which of the following is NOT a component of the cytoskeleton?",
//             options: [
//                 "Microfilaments",
//                 "Microtubules",
//                 "Intermediate filaments",
//                 "Ribosomes"
//             ],
//             correctAnswer: 3 // (Ribosomes)
//         }
//     ]
// };


// let quizData = null;
let timeLeft = null;
// Global variables
let currentQuestion = 0;
let selectedAnswers = {};
let timerInterval;
let mediaRecorder;
let recordedChunks = [];
let stream;
let isQuizSubmitted = false;

// DOM Elements
document.addEventListener('DOMContentLoaded',async function() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');
    if (quizId) {
        // Call API with quizId
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/student/start-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } , body: JSON.stringify({
                quiz_id : quizId
            })
        });
        quizData = await response.json();

        if (!response.ok) {
            alert(quizData.error);
            window.location.href = '/pages/student/studentView.html';
        }

        timeLeft = quizData.timeLimit * 60; // convert to seconds

      } else {
        console.error('Quiz ID not provided');
      }
    console.log(quizData)
    // Initialize quiz data
    document.getElementById('quizTitle').textContent = quizData.title;
    document.getElementById('quizClass').textContent = quizData.className;
    document.getElementById('totalQuestions').textContent = quizData.questions.length;
    document.getElementById('summaryTotal').textContent = quizData.questions.length;
    document.getElementById('summaryTotal2').textContent = quizData.questions.length;
    document.getElementById('summaryTimeLimit').textContent = `${quizData.timeLimit} minutes`;
    document.getElementById('modalTotal').textContent = quizData.questions.length;
    
    // Setup webcam first 
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
    // document.getElementById('logoutBtn').addEventListener('click', handleLogout);
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
        
        const videoElement = document.getElementsByClassName('webcam')[0];
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
            const question = quizData.questions[index];
            if (selectedAnswers[index] !== undefined) {
                // For short answer questions, check if answer is not empty
                if (!question.options || question.options.length === 0) {
                    if (selectedAnswers[index] && selectedAnswers[index].trim() !== '') {
                        btn.classList.add('answered');
                    } else {
                        btn.classList.add('btn-outline-secondary');
                    }
                } else {
                    btn.classList.add('answered');
                }
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

    // Check if this is a short answer question 
    if (!question.options || question.options.length === 0) {
        // Create textarea for short answer
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control short-answer-input mt-3';
        textarea.rows = 4;
        textarea.placeholder = 'Type your answer here...';
        textarea.value = selectedAnswers[index] || '';
        textarea.addEventListener('input', (e) => {
            selectedAnswers[index] = e.target.value;
            updateQuizSummary();
        });
        optionsContainer.appendChild(textarea);
    } else {
        // Regular MCQ question
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
    }
    
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
    let answeredCount = 0;
    
    quizData.questions.forEach((question, index) => {
        if (selectedAnswers[index] !== undefined) {
            // For short answer questions, only count if answer is not empty
            if (!question.options || question.options.length === 0) {
                if (selectedAnswers[index] && selectedAnswers[index].trim() !== '') {
                    answeredCount++;
                }
            } else {
                answeredCount++;
            }
        }
    });
    
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
async function submitQuiz() {
    if (isQuizSubmitted) return; // Prevent multiple submissions
    const numberToLetter = ['A', 'B', 'C', 'D'];
    Object.keys(selectedAnswers).forEach((key) => {
        const value = selectedAnswers[key];
        if (typeof value === 'number' && value >= 0 && value <= 3) {
          selectedAnswers[key] = numberToLetter[value];
        }
      });
    isQuizSubmitted = true;
    const token = localStorage.getItem('token');
    console.log(quizData)
    console.log(selectedAnswers);

    const response = await fetch('http://localhost:8000/student/quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        } , body: JSON.stringify({
            quiz_id : quizData.id ,
            version_id : quizData.version_id , 
            answers: selectedAnswers
        })
    });
    data = await response.json();

    if (!response.ok) {
        alert(data.error);
        window.location.href = '/pages/student/studentView.html';
    }

    clearInterval(timerInterval);
    
    // Stop recording
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    // Stop all media tracks
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
        

    setTimeout(() => {
        window.location.href = '/pages/student/studentView.html';
    }, 1500);
}

// Start the quiz timer
function startTimer() {
    // Clear any existing timer first
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Add validation check
    if (timeLeft <= 0) {
        console.error("Cannot start timer with zero or negative time");
        timeLeft = quizData.timeLimit * 60; // reset to default
    }
    
    // Update display immediately
    updateTimerDisplay();
    
    // Then start the interval
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
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

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timer').textContent = formattedTime;
    document.getElementById('summaryTimer').textContent = formattedTime;
}

// Handle logout
function handleLogout() {
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