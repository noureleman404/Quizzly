const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

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

// Core logic: process results
faceMesh.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  const faceCount = results.multiFaceLandmarks.length;

  if (faceCount === 0) {
    console.warn("⚠️ No face detected");
  } else if (faceCount > 1) {
    console.error("🚨 Multiple faces detected!");
  } else {
    const landmarks = results.multiFaceLandmarks[0];

    // Eyes/nose tip indices
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const noseTip = landmarks[1];

    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;

    const eyeAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (eyeAngle < -15 || eyeAngle > 15) {
      console.warn("⚠️ Possibly looking away");
    } else {
      console.log("✅ Face detected, looking forward");
    }

    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
  }

  canvasCtx.restore();
});

// Setup webcam
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();
