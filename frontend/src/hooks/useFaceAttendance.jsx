import { useRef, useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";

// Helper: Euclidean distance between two Float32Arrays
function euclideanDistance(arr1, arr2) {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const diff = arr1[i] - arr2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Helper: Randomly pick a liveness challenge
function getRandomChallenge() {
  return Math.random() < 0.5 ? "blink" : "smile";
}

export function useFaceAttendance({
  storedDescriptor,
  matchThreshold = 0.45,
  onSuccess,
  onError,
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [challengePassed, setChallengePassed] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);

  // 1. Load face-api.js models
  useEffect(() => {
    setStatus("loading");
    console.log("[FaceAttendance] Loading face-api.js models...");
    Promise.all([
      faceapi.nets.tinyFaceDetector.load("/models"),
      faceapi.nets.faceLandmark68Net.load("/models"),
      faceapi.nets.faceRecognitionNet.load("/models"),
      faceapi.nets.faceExpressionNet.load("/models"),
    ])
      .then(() => {
        setStatus("ready");
        console.log("[FaceAttendance] Models loaded, ready for webcam.");
      })
      .catch((e) => {
        setStatus("error");
        setError("Failed to load face-api models");
        console.error("[FaceAttendance] Model load error:", e);
      });
  }, []);

  // 2. Start webcam when models are ready
  const startVideo = useCallback(async () => {
    if (!videoRef.current) {
      setError("Video element not found");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setError(null);
      console.log("[FaceAttendance] Webcam started.");
    } catch (e) {
      setStatus("error");
      setError("Could not access webcam. Please check browser permissions and ensure no other app is using the camera.");
      console.error("[FaceAttendance] Webcam error:", e);
    }
  }, []);

  useEffect(() => {
    if (status === "ready" && videoRef.current) {
      console.log("[FaceAttendance] Models ready. Initializing video...");
      startVideo().then(() => {
        setStatus("matching");
      });
    }
  }, [status, startVideo]);

  // 3. Detection loop when status is 'matching'
  useEffect(() => {
    let interval;
    if (status === "matching" && videoRef.current) {
      console.log("[FaceAttendance] Video active. Starting detection loop...");
      interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
        try {
          const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });
          const detections = await faceapi
            .detectAllFaces(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceDescriptors()
            .withFaceExpressions();

          console.log("[FaceAttendance] Detections:", detections);

          if (!detections || detections.length === 0) {
            setError(null);
            return;
          }
          if (detections.length > 1) {
            setError("Multiple faces detected!");
            setMultipleFaces(true);
            return;
          }
          setMultipleFaces(false);
          setError(null);

          const descriptor = detections[0].descriptor;
          const distance = euclideanDistance(descriptor, storedDescriptor);

          console.log(`[FaceAttendance] Distance: ${distance.toFixed(4)} (Threshold: ${matchThreshold})`);

          if (distance < matchThreshold) {
            console.log("✅ Match found! Switching to Liveness check.");
            setStatus("liveness");
            setChallenge(getRandomChallenge());
          }
        } catch (err) {
          console.error("[FaceAttendance] Loop error:", err);
        }
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, storedDescriptor, matchThreshold]);

  // Enrollment: Capture a descriptor from current frame
  const captureDescriptor = useCallback(async () => {
    if (!videoRef.current) return null;
    console.log("[FaceAttendance] Capturing face descriptor...");
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (detection && detection.descriptor) {
      console.log("[FaceAttendance] Descriptor captured:", detection.descriptor);
      return Array.from(detection.descriptor);
    }
    console.warn("[FaceAttendance] No face detected for enrollment.");
    return null;
  }, []);

  // Liveness detection
  useEffect(() => {
    let interval;
    if (status === "liveness" && challenge && videoRef.current) {
      console.log("[FaceAttendance] Liveness challenge active:", challenge);
      interval = setInterval(async () => {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
        if (!detection) {
          console.warn("[FaceAttendance] No face detected during liveness challenge.");
          return;
        }

        if (challenge === "blink") {
          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          const getEAR = (eye) => {
            const a = Math.hypot(eye[1]._x - eye[5]._x, eye[1]._y - eye[5]._y);
            const b = Math.hypot(eye[2]._x - eye[4]._x, eye[2]._y - eye[4]._y);
            const c = Math.hypot(eye[0]._x - eye[3]._x, eye[0]._y - eye[3]._y);
            return (a + b) / (2.0 * c);
          };
          const leftEAR = getEAR(leftEye);
          const rightEAR = getEAR(rightEye);
          console.log(`[FaceAttendance] Blink EAR: left=${leftEAR}, right=${rightEAR}`);
          if (leftEAR < 0.25 && rightEAR < 0.25) {
            setChallengePassed(true);
            setStatus("success");
            console.log("[FaceAttendance] Blink detected, liveness passed!");
            onSuccess && onSuccess();
          }
        } else if (challenge === "smile") {
          const expressions = detection.expressions;
          console.log(`[FaceAttendance] Smile expression score: ${expressions.happy}`);
          if (expressions.happy > 0.7) {
            setChallengePassed(true);
            setStatus("success");
            console.log("[FaceAttendance] Smile detected, liveness passed!");
            onSuccess && onSuccess();
          }
        }
      }, 300);
    }
    return () => clearInterval(interval);
  }, [status, challenge, onSuccess]);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        console.log("[FaceAttendance] Webcam stopped on unmount.");
      }
    };
  }, []);

  return {
    videoRef,
    status,
    error,
    challenge,
    challengePassed,
    multipleFaces,
    captureDescriptor,
    startVideo,
  };
}