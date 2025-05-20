const videoElement = document.getElementsByClassName('webcam')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const warningOverlay = document.createElement('div');
warningOverlay.id = 'warningOverlay';
document.body.appendChild(warningOverlay);

// Creating warning widgets 
function createWarningWidget(idSuffix = '') {
    const warningWidget = document.createElement('div');
    warningWidget.id = `warningWidget${idSuffix}`;
    warningWidget.className = 'alert alert-light warning-border shadow warning-widget';
    
    const warningContent = document.createElement('div');
    warningContent.className = 'warning-content';
    
    const warningTitle = document.createElement('h3');
    warningTitle.className = 'warning-title mb-2';
    warningTitle.id = `warningTitle${idSuffix}`;

    const warningMessage = document.createElement('p');
    warningMessage.className = 'warning-message mb-3';
    warningMessage.id = `warningMessage${idSuffix}`;

    const countdownElement = document.createElement('div');
    countdownElement.className = 'warning-countdown mb-3';
    countdownElement.id = `countdown${idSuffix}`;

    const closeButton = document.createElement('button');
    closeButton.className = 'btn warning-button align-self-end';
    closeButton.textContent = 'I Understand';
    closeButton.addEventListener('click', () => {
        warningWidget.style.display = 'none';
        warningOverlay.style.display = 'none';
    });

    warningContent.appendChild(warningTitle);
    warningContent.appendChild(warningMessage);
    warningContent.appendChild(countdownElement);
    warningContent.appendChild(closeButton);
    warningWidget.appendChild(warningContent);
    
    return warningWidget;
}

// Create three separate widgets for different cases
const noFaceWidget = createWarningWidget();
const multipleFacesWidget = createWarningWidget('Multiple');
const lookAwayWidget = createWarningWidget('LookAway');

document.body.appendChild(noFaceWidget);
document.body.appendChild(multipleFacesWidget);
document.body.appendChild(lookAwayWidget);

// Initialize MediaPipe FaceMesh
const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 2,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

let lastEyeAngle = null;
let lookAwayStartTime = null;
let lookAwayThreshold = 1000;
let lookAwayAlerted = false;
let noFaceStartTime = null;
let noFaceThreshold = 30000;
let noFaceInterval = null;

let violationCount = 0;
const maxViolations = 6;
let quizEnded = false;

const check = true;

function showWarning(widget, title, message, showCountdown = false) {
    // Hide all other widgets first
    noFaceWidget.style.display = 'none';
    multipleFacesWidget.style.display = 'none';
    lookAwayWidget.style.display = 'none';
    
    const warningTitle = widget.querySelector('.warning-title');
    const warningMessage = widget.querySelector('.warning-message');
    const countdownElement = widget.querySelector('.warning-countdown');
    
    warningTitle.textContent = title;
    warningMessage.textContent = message;
    widget.style.display = 'block';
    warningOverlay.style.display = 'block';
    
    if (showCountdown) {
        let timeLeft = 30;
        countdownElement.style.display = 'block';
        countdownElement.textContent = `Time Left: ${timeLeft}s`;
        
        const countdown = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = `Time left: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                registerViolation("No face detected for 30 seconds");
            }
        }, 1000);
    } else {
        countdownElement.style.display = 'none';
    }
}

faceMesh.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    const faceCount = results.multiFaceLandmarks.length;

    if (faceCount === 0) {
        console.warn("⚠️ No face detected");
        showWebcamStatus("No face detected", "paused");
        
        if (!noFaceStartTime) {
            noFaceStartTime = Date.now();
            showWarning(noFaceWidget, "Attention Required", "No face detected. Please position yourself in front of the camera.", true);
        } else {
            const duration = Date.now() - noFaceStartTime;
            if (duration > noFaceThreshold && !quizEnded) {
                registerViolation("No face detected for 30 seconds");
            }
        }
        
        lookAwayStartTime = null;
        return;
    } else {
        noFaceStartTime = null;
        if (noFaceWidget.style.display === 'block') {
            noFaceWidget.style.display = 'none';
            warningOverlay.style.display = 'none';
        }
    }

    if (faceCount > 1) {
        console.error("🚨 Multiple faces detected!");
        showWebcamStatus("Multiple faces detected", "paused");
        showWarning(multipleFacesWidget, "Violation Detected", `More than 1 face was detected (${faceCount} faces). One more try and your session will be ended.`);
        registerViolation("Many faces detected");
        return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    const eyeAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    const isLookingAway = (eyeAngle < -10 || eyeAngle > 10);

    if (isLookingAway) {
        if (!lookAwayStartTime) {
            lookAwayStartTime = Date.now();
        } else {
            const duration = Date.now() - lookAwayStartTime;
            if (duration > lookAwayThreshold && !lookAwayAlerted) {
                showWebcamStatus("Looking away", "paused");
                showWarning(lookAwayWidget, "Attention Required", "Please keep your focus on the screen. Looking away for too long may result in a violation.");
                registerViolation("Looked away too long");
                lookAwayAlerted = true;
            }
        }
    } else {
        lookAwayStartTime = null;
        lookAwayAlerted = false;
        if (lookAwayWidget.style.display === 'block') {
            lookAwayWidget.style.display = 'none';
            warningOverlay.style.display = 'none';
        }
        showWebcamStatus("Recording", "recording");
    }

    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
        color: '#C0C0C070',
        lineWidth: 1
    });

    canvasCtx.restore();
});

function showWebcamStatus(text, statusClass) {
    const statusEl = document.getElementById('webcamStatus');
    statusEl.textContent = text;
    statusEl.className = 'webcam-status ' + statusClass;
}

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

function registerViolation(reason) {
    if (quizEnded) return; // to stop counting if quiz already ended
    
    violationCount++;
    console.warn(`🚨 Violation #${violationCount}: ${reason}`);
    document.getElementById("violationCount").textContent = 
        `Violations: ${violationCount}/${maxViolations}`;

    if (violationCount >= maxViolations && !quizEnded && check) {
        endQuiz();
    }
}

function endQuiz() {
    quizEnded = true;
    showWebcamStatus("❌ Quiz Ended", "paused");
    
    // Stop the camera and face detection
    if (camera && camera.stop) {
        camera.stop();
    }
    
    const warningTitle = noFaceWidget.querySelector('.warning-title');
    const warningMessage = noFaceWidget.querySelector('.warning-message');
    const countdownElement = noFaceWidget.querySelector('.warning-countdown');
    const closeButton = noFaceWidget.querySelector('.warning-button');
    
    warningTitle.textContent = "Session Ended";
    warningMessage.textContent = "Your quiz session has been ended due to repeated violations.";
    countdownElement.style.display = 'none';
    closeButton.textContent = 'Close';
    closeButton.onclick = () => {
        window.location.href = '../../pages/student/studentView.html';
    };
    noFaceWidget.style.display = 'block';
    warningOverlay.style.display = 'block';
    
    document.querySelector('#quizContainer').innerHTML = `
        <div class="alert alert-danger">
            <h4>Quiz locked due to cheating violations.</h4>
            <p>You exceeded the maximum number of allowed violations.</p>
        </div>
    `;
    
    // Disable quiz interaction
    document.querySelectorAll('#quizContainer button').forEach(btn => {
        btn.disabled = true;
    });
    
    // Submit the quiz automatically
    if (typeof submitQuiz === 'function') {
        submitQuiz();
    }
}

window.addEventListener('beforeunload', (e) => {
    if (!isQuizSubmitted && !quizEnded) {
        const confirmationMessage = "You have unsaved changes. If you leave now, your quiz progress will be lost.";
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    }
});

camera.start();