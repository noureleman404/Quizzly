const videoElement = document.getElementsByClassName('webcam')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
document.addEventListener('visibilitychange', () => {
    if (document.hidden && !quizEnded) {
      registerViolation("Switched tab or minimized window");
    }
  });
// Initialize MediaPipe FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 2, // To detect multiple faces
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
let lastEyeAngle = null;
let lookAwayStartTime = null;
let lookAwayThreshold = 1000; // ms
let lookAwayAlerted = false;


let violationCount = 0;
const maxViolations = 6;
let quizEnded = false;

const check = true
// Core logic: process results
faceMesh.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
    const faceCount = results.multiFaceLandmarks.length;
  
    if (faceCount === 0) {
      console.warn("⚠️ No face detected");
      showWebcamStatus("No face", "paused");
      lookAwayStartTime = null;
      return;
    }
  
    if (faceCount > 1) {
      console.error("🚨 Multiple faces detected!");
      showWebcamStatus("Multiple faces!", "paused");
      registerViolation("Many faces detected ");
      return;
    }
  
    const landmarks = results.multiFaceLandmarks[0];
  
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const noseTip = landmarks[1];
  
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    const eyeAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    // console.log(eyeAngle)
  
    // Evaluate head tilt
    const isLookingAway = (eyeAngle < -10 || eyeAngle > 10);
  
    if (isLookingAway) {
      if (!lookAwayStartTime) {
        lookAwayStartTime = Date.now();
      } else {
        const duration = Date.now() - lookAwayStartTime;
        if (duration > lookAwayThreshold && !lookAwayAlerted) {
            showWebcamStatus("Looking away", "paused");
            registerViolation("Looked away too long");
            lookAwayAlerted = true;
          }
      }
    } else {
      lookAwayStartTime = null;
      lookAwayAlerted = false;
      showWebcamStatus("Recording", "recording");
      console.log("✅ Face centered");
    }
  
    // Optional: draw mesh
    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
      color: '#C0C0C070',
      lineWidth: 1
    });
  
    canvasCtx.restore();
  });
  function showWebcamStatus(text, statusClass) {
    const statusEl = document.getElementById('webcamStatus');
    statusEl.textContent = text;
    statusEl.className = 'webcam-status'; // reset classes
    statusEl.classList.add(statusClass);
  }
// Setup webcam
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
function registerViolation(reason) {
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
    alert("Quiz ended due to repeated violations.");
    window.location.href = "/pages/student/studentView.html";
    document.querySelector('#quizContainer').innerHTML = "<h3>Quiz locked due to cheating.</h3>";
  }

  window.addEventListener('beforeunload', (e) => {
    if (!isQuizSubmitted && !quizEnded ) {
        // Show confirmation message
        const confirmationMessage = "You have unsaved changes. If you leave now, your quiz progress will be lost.";
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    }
});
camera.start();