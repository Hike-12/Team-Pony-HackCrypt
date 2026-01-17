import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  CameraOff, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  EyeOff,
  Activity,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import * as faceapi from 'face-api.js';

// TensorFlow and MoveNet will be loaded dynamically
let tf = null;
let poseDetection = null;
let detector = null;

export default function AttentivenessMonitor() {
  // State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [detectionResults, setDetectionResults] = useState([]);
  const [classSummary, setClassSummary] = useState(null);
  const [error, setError] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  
  // Track students across frames
  const studentTrackingRef = useRef(new Map()); // studentId -> { frames: [], attentionScores: [], lastSeen: timestamp }
  
  // Track detected faces (bounding boxes) to match across frames
  const faceTrackingRef = useRef(new Map()); // boxId -> { student_id, full_name, box, lastSeen, frames }

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const processingRef = useRef(false);
  const isMonitoringRef = useRef(false);

  // Load models on mount
  useEffect(() => {
    loadModels();
    fetchEnrolledStudents();
    
    return () => {
      stopMonitoring();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Load Face-API and MoveNet models
  const loadModels = async () => {
    try {
      setLoadingModels(true);
      setError(null);

      console.log('Loading Face-API models...');
      // Load Face-API models
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      console.log('Face-API models loaded');

      // Load TensorFlow.js and MoveNet dynamically
      console.log('Loading TensorFlow.js...');
      tf = await import('@tensorflow/tfjs');
      
      console.log('Loading MoveNet...');
      poseDetection = await import('@tensorflow-models/pose-detection');

      // Create MoveNet detector
      console.log('Creating MoveNet detector...');
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
          enableSmoothing: true,
          multiPoseMaxDimension: 256,
          enableTracking: true
        }
      );

      setModelsLoaded(true);
      console.log('All models loaded successfully');
      toast.success('AI models loaded successfully');
    } catch (err) {
      console.error('Error loading models:', err);
      setError(`Failed to load AI models: ${err.message}`);
      toast.error('Failed to load AI models');
    } finally {
      setLoadingModels(false);
    }
  };

  // Fetch enrolled students with embeddings
  const fetchEnrolledStudents = async () => {
    try {
      console.log('Fetching enrolled students...');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attentiveness/embeddings`);
      const data = await res.json();
      console.log('Enrolled students response:', data);
      if (data.success) {
        setEnrolledStudents(data.data);
        console.log(`Loaded ${data.data.length} enrolled students with embeddings`);
        toast.success(`${data.data.length} students loaded`);
      } else {
        console.warn('Failed to fetch enrolled students:', data);
        toast.error('Failed to load students');
      }
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
      toast.error(`Error loading students: ${err.message}`);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' 
        }
      });
      
      console.log('Camera access granted, stream:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            videoRef.current.play();
            resolve();
          };
        });
        
        console.log('Video is playing, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        setCameraActive(true);
        toast.success('Camera activated');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error(`Failed to access camera: ${err.message}`);
      throw err;
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Calculate Euclidean distance between embeddings
  const euclideanDistance = (emb1, emb2) => {
    if (!emb1 || !emb2) return Infinity;
    const arr1 = Array.isArray(emb1) ? emb1 : emb1.descriptor || [];
    const arr2 = Array.isArray(emb2) ? emb2 : emb2.descriptor || [];
    if (arr1.length !== arr2.length || arr1.length === 0) return Infinity;
    
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
      sum += Math.pow(arr1[i] - arr2[i], 2);
    }
    return Math.sqrt(sum);
  };

  // Match face embedding to enrolled students
  const matchFace = (embedding) => {
    let bestMatch = null;
    let bestDistance = 0.6; // Threshold

    for (const student of enrolledStudents) {
      const distance = euclideanDistance(embedding, student.embedding);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = {
          student_id: student.student_id,
          full_name: student.full_name,
          roll_no: student.roll_no,
          image_url: student.image_url,
          confidence: Math.round((1 - distance) * 100)
        };
      }
    }

    return bestMatch;
  };

  // Helper: Get box ID for stable tracking
  const getBoxId = (box) => {
    return `box_${Math.round(box.x)}_${Math.round(box.y)}_${Math.round(box.width)}_${Math.round(box.height)}`;
  };

  // Helper: Check if two boxes are close (same person)
  const boxesOverlap = (box1, box2, threshold = 0.5) => {
    const left = Math.max(box1.x, box2.x);
    const right = Math.min(box1.x + box1.width, box2.x + box2.width);
    const top = Math.max(box1.y, box2.y);
    const bottom = Math.min(box1.y + box1.height, box2.y + box2.height);
    
    if (left >= right || top >= bottom) return false;
    
    const intersection = (right - left) * (bottom - top);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;
    const iou = intersection / union;
    
    return iou > threshold;
  };

  // Analyze attention based only on face position (fallback when poses unavailable)
  const analyzeFaceAttention = (box, landmarks) => {
    let score = 100;
    const reasons = [];

    // If we have landmarks, check if person is looking down
    if (landmarks && landmarks.length > 0) {
      try {
        // Landmarks: 0-16 are key facial points
        const nose = landmarks[30]; // nose point
        const leftEye = landmarks[36]; // left eye
        const rightEye = landmarks[45]; // right eye
        
        if (nose && leftEye && rightEye) {
          const eyeY = (leftEye.y + rightEye.y) / 2;
          const headTilt = nose.y - eyeY;
          
          // Head down detection
          if (headTilt > 25) {
            score -= 40;
            reasons.push('head down');
          }
          
          // Check if looking sideways (eye positions)
          const eyeDistance = Math.abs(rightEye.x - leftEye.x);
          const noseToLeft = Math.abs(nose.x - leftEye.x);
          const noseToRight = Math.abs(nose.x - rightEye.x);
          
          if (noseToLeft > eyeDistance * 0.6 || noseToRight > eyeDistance * 0.6) {
            score -= 35;
            reasons.push('looking away');
          }
        }
      } catch (e) {
        console.log('Landmark analysis error:', e);
      }
    }

    score = Math.max(0, Math.min(100, score));

    let status = 'attentive';
    if (score < 75) status = 'distracted';
    if (score < 50) status = 'very_distracted';
    if (score <= 20) status = 'away';

    return { score, status, reasons: reasons.length > 0 ? reasons : ['active'] };
  };

  // Analyze head position from pose keypoints
  const analyzeHeadPosition = (keypoints) => {
    const nose = keypoints.find(kp => kp.name === 'nose');
    const leftEye = keypoints.find(kp => kp.name === 'left_eye');
    const rightEye = keypoints.find(kp => kp.name === 'right_eye');
    const leftEar = keypoints.find(kp => kp.name === 'left_ear');
    const rightEar = keypoints.find(kp => kp.name === 'right_ear');
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');

    let isHeadDown = false;
    let isLookingAway = false;
    let noseVisible = nose && nose.score > 0.2;
    let eyesVisible = (leftEye && leftEye.score > 0.2) || (rightEye && rightEye.score > 0.2);
    let earsVisible = (leftEar && leftEar.score > 0.2) && (rightEar && rightEar.score > 0.2);

    // Check if head is down - nose significantly below eyes
    if (noseVisible && eyesVisible) {
      const eyeY = leftEye && rightEye 
        ? (leftEye.y + rightEye.y) / 2 
        : (leftEye?.y || rightEye?.y);
      
      // Head is down if nose is >15px below eyes
      isHeadDown = (nose.y - eyeY) > 15;
      
      if (isHeadDown) {
        console.log('Head down detected: nose.y =', nose.y, 'eyeY =', eyeY, 'diff =', nose.y - eyeY);
      }
    }

    // Check if looking away (head rotation) - using nose angle relative to shoulders
    if (leftShoulder && rightShoulder && leftShoulder.score > 0.2 && rightShoulder.score > 0.2 && noseVisible) {
      const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
      
      // If nose is significantly to the left or right of shoulder midpoint, head is rotated
      const noseOffset = Math.abs(nose.x - shoulderMidX);
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
      
      // If nose offset is >30% of shoulder width, person is looking away
      if (noseOffset > shoulderWidth * 0.3) {
        isLookingAway = true;
        console.log('Looking away detected: noseOffset =', noseOffset, 'shoulderWidth*0.3 =', shoulderWidth * 0.3);
      }
      
      // Also check if nose is way below shoulders
      if (noseVisible && nose.y > shoulderMidY + 80) {
        isHeadDown = true;
        console.log('Head down (below shoulders): nose.y =', nose.y, 'shoulderMidY =', shoulderMidY);
      }
    }

    // If neither eyes nor nose very visible, person definitely not looking at camera
    if (!noseVisible && !eyesVisible) {
      isLookingAway = true;
      console.log('Looking away: nose and eyes not visible');
    }

    return { 
      isHeadDown, 
      isLookingAway, 
      noseVisible, 
      eyesVisible, 
      earsVisible 
    };
  };

  // Analyze shoulder posture
  const analyzeShoulderPosture = (keypoints) => {
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
    const nose = keypoints.find(kp => kp.name === 'nose');
    const leftHip = keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = keypoints.find(kp => kp.name === 'right_hip');
    const leftKnee = keypoints.find(kp => kp.name === 'left_knee');
    const rightKnee = keypoints.find(kp => kp.name === 'right_knee');

    let isSlouching = false;
    let isLeaning = false;
    const shouldersVisible = leftShoulder?.score > 0.2 && rightShoulder?.score > 0.2;

    if (shouldersVisible) {
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
      const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
      
      // Slouching - if nose is very close to shoulders (less than 60px vertically)
      if (nose?.score > 0.2) {
        const distToNose = shoulderMidY - nose.y;
        if (distToNose < 60) {
          isSlouching = true;
          console.log('Slouching detected: shoulderToNose =', distToNose);
        }
      }

      // Leaning - shoulders not level (one significantly higher than other)
      const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
      if (shoulderTilt > 20) {
        isLeaning = true;
        console.log('Leaning detected: shoulder tilt =', shoulderTilt);
      }

      // Check torso angle - if shoulders and hips don't align, person is bent
      if (leftHip?.score > 0.2 && rightHip?.score > 0.2) {
        const hipMidY = (leftHip.y + rightHip.y) / 2;
        const hipMidX = (leftHip.x + rightHip.x) / 2;
        const torsoLength = hipMidY - shoulderMidY;
        const torsoAngle = Math.abs(hipMidX - shoulderMidX);
        
        // Very short torso (bent over) or large horizontal offset
        if (torsoLength < 60 || torsoAngle > 30) {
          isSlouching = true;
          console.log('Bent posture detected: torsoLength =', torsoLength, 'torsoAngle =', torsoAngle);
        }
      }
    }

    return { isSlouching, isLeaning, shouldersVisible };
  };

  // Calculate attention score
  const calculateAttentionScore = (headAnalysis, shoulderAnalysis, faceDetected) => {
    let score = 100;
    const reasons = [];

    // Major penalties
    if (headAnalysis.isHeadDown) {
      score -= 40;
      reasons.push('head down');
    }

    if (headAnalysis.isLookingAway) {
      score -= 35;
      reasons.push('looking away');
    }

    if (!headAnalysis.noseVisible && !headAnalysis.eyesVisible) {
      score -= 30;
      reasons.push('face not visible');
    }

    if (!faceDetected) {
      score -= 25;
      reasons.push('no face detected');
    }

    // Medium penalties
    if (shoulderAnalysis.isSlouching) {
      score -= 20;
      reasons.push('slouching');
    }

    if (shoulderAnalysis.isLeaning) {
      score -= 15;
      reasons.push('leaning');
    }

    // Minor penalties
    if (!headAnalysis.eyesVisible) {
      score -= 15;
      reasons.push('eyes not visible');
    }

    if (!headAnalysis.earsVisible) {
      score -= 10;
      reasons.push('profile view');
    }

    score = Math.max(0, Math.min(100, score));

    let status = 'attentive';
    if (score < 75) status = 'distracted';
    if (score < 50) status = 'very_distracted';
    if (score <= 20) status = 'away';

    return { score, status, reasons: reasons.length > 0 ? reasons : ['engaged'] };
  };

  // Process video frame
  const processFrame = useCallback(() => {
    const runFrame = async () => {
      console.log('processFrame called, isMonitoringRef:', isMonitoringRef.current);
      
      if (!videoRef.current || !canvasRef.current || !isMonitoringRef.current) {
        console.log('Early return - video:', !!videoRef.current, 'canvas:', !!canvasRef.current, 'monitoring:', isMonitoringRef.current);
        if (isMonitoringRef.current) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
        return;
      }

      if (processingRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      processingRef.current = true;

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        console.log('Processing frame... Video ready:', video.readyState, 'Video size:', video.videoWidth, 'x', video.videoHeight);

        // Check if video is ready
        if (!video.videoWidth || !video.videoHeight) {
          console.log('Video not ready yet');
          processingRef.current = false;
          animationFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const ctx = canvas.getContext('2d');

        // Ensure canvas matches video dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
        }

        // Clear and draw video frame to canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('Drew video frame to canvas');

        // Detect faces and get embeddings
        let faceDetections = [];
        try {
          if (faceapi.nets.tinyFaceDetector.isLoaded) {
            faceDetections = await faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ 
                inputSize: 416,
                scoreThreshold: 0.5 
              }))
              .withFaceLandmarks()
              .withFaceDescriptors();
            
            if (faceDetections.length > 0) {
              console.log(`Detected ${faceDetections.length} faces`);
            }
          }
        } catch (err) {
          console.warn('Face detection error:', err);
        }

        // Detect poses with MoveNet - use canvas for better detection
        let poses = [];
        try {
          if (detector) {
            console.log('Attempting pose detection on canvas...');
            poses = await detector.estimatePoses(canvas, {
              maxPoses: 5,
              flipHorizontal: false
            });
            
            console.log(`Pose detection result: ${poses.length} poses detected`);
            if (poses.length > 0) {
              console.log(`Detected ${poses.length} poses with keypoints:`, poses.map(p => p.keypoints.length));
            }
          } else {
            console.warn('MoveNet detector not initialized');
          }
        } catch (err) {
          console.warn('Pose detection error:', err);
        }

        // Match faces to students and analyze attention
        const results = [];
        const detectedStudentsThisFrame = new Set(); // Track which students we saw this frame
        
        // First pass: match faces to tracked students (stable tracking)
        for (const face of faceDetections) {
          const box = face.detection.box;
          
          // Try to match with existing tracked face
          let trackedFace = null;
          let bestOverlapId = null;
          let bestOverlap = 0;
          
          for (const [boxId, tracked] of faceTrackingRef.current) {
            if (boxesOverlap(box, tracked.box, 0.3)) {
              const overlap = Math.min(box.width, tracked.box.width) * Math.min(box.height, tracked.box.height);
              if (overlap > bestOverlap) {
                bestOverlap = overlap;
                bestOverlapId = boxId;
              }
            }
          }
          
          if (bestOverlapId) {
            // Update existing tracked face
            trackedFace = faceTrackingRef.current.get(bestOverlapId);
            trackedFace.box = box;
            trackedFace.framesPresent = (trackedFace.framesPresent || 0) + 1;
            trackedFace.lastSeen = Date.now();
            detectedStudentsThisFrame.add(trackedFace.student_id);
            console.log(`Updated tracking for ${trackedFace.full_name} (present frame ${trackedFace.framesPresent})`);
          } else {
            // New face detected - identify it
            const student = matchFace(Array.from(face.descriptor));
            if (student) {
              const newBoxId = getBoxId(box);
              trackedFace = {
                box,
                student_id: student.student_id,
                full_name: student.full_name,
                roll_no: student.roll_no,
                image_url: student.image_url,
                confidence: student.confidence,
                framesPresent: 1,
                framesAbsent: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now()
              };
              faceTrackingRef.current.set(newBoxId, trackedFace);
              detectedStudentsThisFrame.add(student.student_id);
              console.log(`New student detected: ${student.full_name} - Starting continuous tracking`);
            } else {
              console.log('Face detected but no student match');
              continue;
            }
          }
          
          // Analyze attention for this tracked student
          let attention = analyzeFaceAttention(box, face.landmarks);
          
          // Try to enhance with pose data if available
          if (poses.length > 0) {
            let matchedPose = null;
            let minDistance = Infinity;

            for (const pose of poses) {
              if (!pose.keypoints || pose.keypoints.length === 0) continue;
              
              const nose = pose.keypoints.find(kp => kp.name === 'nose');
              const visibleKeypoints = pose.keypoints.filter(kp => kp.score > 0.15);
              if (visibleKeypoints.length < 5) continue;
              
              const poseBox = pose.keypoints.reduce((acc, kp) => {
                if (kp.score > 0.15) {
                  acc.minX = Math.min(acc.minX, kp.x);
                  acc.maxX = Math.max(acc.maxX, kp.x);
                  acc.minY = Math.min(acc.minY, kp.y);
                  acc.maxY = Math.max(acc.maxY, kp.y);
                }
                return acc;
              }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

              if (!isFinite(poseBox.minX)) continue;

              const poseCenterX = (nose && nose.score > 0.2) ? nose.x : (poseBox.minX + poseBox.maxX) / 2;
              const poseCenterY = (nose && nose.score > 0.2) ? nose.y : (poseBox.minY + poseBox.maxY) / 2;
              const faceCenterX = box.x + box.width / 2;
              const faceCenterY = box.y + box.height / 2;

              const distance = Math.sqrt(
                Math.pow(poseCenterX - faceCenterX, 2) +
                Math.pow(poseCenterY - faceCenterY, 2)
              );

              if (distance < minDistance && distance < 300) {
                minDistance = distance;
                matchedPose = pose;
              }
            }
            
            // If we found a matching pose, use its detailed analysis
            if (matchedPose && matchedPose.keypoints) {
              console.log(`Pose data available for ${trackedFace.full_name}, enhancing attention score`);
              const headAnalysis = analyzeHeadPosition(matchedPose.keypoints);
              const shoulderAnalysis = analyzeShoulderPosture(matchedPose.keypoints);
              attention = calculateAttentionScore(headAnalysis, shoulderAnalysis, true);
            }
          }

          // Draw bounding box
          ctx.strokeStyle = attention.score >= 75 ? '#22c55e' : 
                            attention.score >= 50 ? '#eab308' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw label with tracking info
          const label = `${trackedFace.full_name} (${attention.score}%)`;
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = 'bold 16px Arial';
          const textMetrics = ctx.measureText(label);
          const labelHeight = 30;
          ctx.fillRect(box.x, Math.max(0, box.y - labelHeight), textMetrics.width + 16, labelHeight);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, box.x + 8, Math.max(labelHeight - 10, box.y - 8));

          results.push({
            student_id: trackedFace.student_id,
            full_name: trackedFace.full_name,
            roll_no: trackedFace.roll_no,
            image_url: trackedFace.image_url,
            identified: true,
            attention_score: attention.score,
            status: attention.status,
            reasons: attention.reasons,
            boundingBox: box,
            frames_present: trackedFace.framesPresent
          });
        }
        
        // Second pass: Check for tracked students who are NOT in this frame (absent)
        for (const [boxId, tracked] of faceTrackingRef.current) {
          if (!detectedStudentsThisFrame.has(tracked.student_id)) {
            // Student was tracked before but is missing in this frame
            tracked.framesAbsent = (tracked.framesAbsent || 0) + 1;
            console.log(`${tracked.full_name} is ABSENT from frame (absent count: ${tracked.framesAbsent})`);
            
            // Still add to results but mark as away
            results.push({
              student_id: tracked.student_id,
              full_name: tracked.full_name,
              roll_no: tracked.roll_no,
              image_url: tracked.image_url,
              identified: true,
              attention_score: 0,
              status: 'away',
              reasons: ['not in frame'],
              boundingBox: null,
              frames_present: tracked.framesPresent,
              frames_absent: tracked.framesAbsent
            });
          }
        }

        // Draw poses (keypoints) for visualization
        for (const pose of poses) {
          if (!pose.keypoints) continue;
          
          for (const keypoint of pose.keypoints) {
            if (keypoint.score > 0.3) {
              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = '#3b82f6';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }
        
        // Clean up old tracked faces (not seen for 30 seconds - keep tracking longer)
        const now = Date.now();
        for (const [boxId, tracked] of faceTrackingRef.current) {
          if (now - tracked.lastSeen > 30000) {
            console.log(`Removing tracked face: ${tracked.full_name} (not seen for 30s)`);
            faceTrackingRef.current.delete(boxId);
          }
        }

        setDetectionResults(results);

        // Update tracking data for identified students
        for (const result of results) {
          if (result.identified && result.student_id) {
            const tracking = studentTrackingRef.current.get(result.student_id) || {
              student_id: result.student_id,
              full_name: result.full_name,
              roll_no: result.roll_no,
              image_url: result.image_url,
              frames: 0,
              attentionScores: [],
              statusCounts: { attentive: 0, distracted: 0, very_distracted: 0, away: 0 },
              lastSeen: now,
              firstSeen: now
            };

            tracking.frames += 1;
            tracking.attentionScores.push(result.attention_score);
            tracking.statusCounts[result.status] += 1;
            tracking.lastSeen = now;

            // Keep only last 100 scores to save memory
            if (tracking.attentionScores.length > 100) {
              tracking.attentionScores.shift();
            }

            studentTrackingRef.current.set(result.student_id, tracking);
          }
        }

        // Calculate summary
        const identified = results.filter(r => r.identified);
        if (identified.length > 0) {
          const avgScore = Math.round(
            identified.reduce((sum, r) => sum + r.attention_score, 0) / identified.length
          );
          setClassSummary({
            total_detected: results.length,
            identified_count: identified.length,
            average_attention: avgScore,
            attentive_count: identified.filter(r => r.status === 'attentive').length,
            distracted_count: identified.filter(r => r.status !== 'attentive' && r.status !== 'away').length,
            away_count: identified.filter(r => r.status === 'away').length
          });
        } else if (results.length === 0) {
          setClassSummary(null);
        }

      } catch (err) {
        console.error('Frame processing error:', err);
      } finally {
        processingRef.current = false;
      }

      // Continue processing
      if (isMonitoringRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    runFrame();
  }, [enrolledStudents]);

  // Start monitoring
  const startMonitoring = async () => {
    if (!modelsLoaded) {
      toast.error('Please wait for models to load');
      return;
    }

    try {
      console.log('Starting monitoring...');
      
      // Start camera
      console.log('Starting camera...');
      await startCamera();
      
      // Start session on backend
      console.log('Starting backend session...');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attentiveness/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      
      if (data.success) {
        console.log('Backend session started:', data.data.session_id);
        setSessionId(data.data.session_id);
      } else {
        console.warn('Backend session start returned non-success:', data);
      }

      console.log('Setting monitoring state to true');
      setIsMonitoring(true);
      isMonitoringRef.current = true;
      toast.success('Monitoring started');

      // Start processing loop after a short delay
      setTimeout(() => {
        console.log('Starting frame processing loop');
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }, 500);

    } catch (err) {
      console.error('Error starting monitoring:', err);
      setIsMonitoring(false);
      setCameraActive(false);
      toast.error(`Failed to start monitoring: ${err.message}`);
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    setIsMonitoring(false);
    isMonitoringRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Generate final session summary
    const trackingData = Array.from(studentTrackingRef.current.values());
    const trackedFaces = Array.from(faceTrackingRef.current.values());
    
    if (trackingData.length > 0 || trackedFaces.length > 0) {
      const summary = trackedFaces.map(tracked => {
        const studentTracking = studentTrackingRef.current.get(tracked.student_id);
        
        // Calculate total frames since first detection
        const totalFramesSinceDetection = (tracked.framesPresent || 0) + (tracked.framesAbsent || 0);
        
        if (totalFramesSinceDetection === 0) {
          return null; // Skip if no frames
        }
        
        // Get frame counts from studentTracking (actual analyzed frames)
        let attentiveFrames = studentTracking?.statusCounts?.attentive || 0;
        let distractedFrames = studentTracking?.statusCounts?.distracted || 0;
        let veryDistractedFrames = studentTracking?.statusCounts?.very_distracted || 0;
        const totalAbsentFrames = tracked.framesAbsent || 0;
        
        // Distribute absent frames into different distraction categories
        // 40% of away frames → very distracted
        // 35% of away frames → distracted  
        // 25% of away frames → pure away
        const awayToVeryDistracted = Math.round(totalAbsentFrames * 0.40);
        const awayToDistracted = Math.round(totalAbsentFrames * 0.35);
        const purAwayFrames = Math.round(totalAbsentFrames * 0.25);
        
        // Add distributed away frames to their respective categories
        veryDistractedFrames += awayToVeryDistracted;
        distractedFrames += awayToDistracted;
        
        // Total frames = all frames analyzed (present frames) + absent frames
        // Note: statusCounts only counts frames when student WAS present and face was detected
        // framesAbsent counts frames when student was NOT detected
        const presentFramesAnalyzed = attentiveFrames + distractedFrames + veryDistractedFrames + purAwayFrames;
        const totalFramesForCalc = presentFramesAnalyzed + purAwayFrames;
        const finalTotal = Math.max(totalFramesForCalc, totalFramesSinceDetection);
        
        // Calculate raw percentages based on actual frame counts
        let attentivePercent = finalTotal > 0 ? Math.round((attentiveFrames / finalTotal) * 100) : 0;
        let distractedPercent = finalTotal > 0 ? Math.round((distractedFrames / finalTotal) * 100) : 0;
        let veryDistractedPercent = finalTotal > 0 ? Math.round((veryDistractedFrames / finalTotal) * 100) : 0;
        let awayPercent = finalTotal > 0 ? Math.round((purAwayFrames / finalTotal) * 100) : 0;
        
        // Ensure they sum to exactly 100% - distribute rounding error
        let totalPercent = attentivePercent + distractedPercent + veryDistractedPercent + awayPercent;
        if (totalPercent !== 100) {
          const diff = 100 - totalPercent;
          // Distribute difference prioritizing the largest category
          if (attentivePercent >= distractedPercent && attentivePercent >= veryDistractedPercent && attentivePercent >= awayPercent) {
            attentivePercent += diff;
          } else if (distractedPercent >= veryDistractedPercent && distractedPercent >= awayPercent) {
            distractedPercent += diff;
          } else if (veryDistractedPercent >= awayPercent) {
            veryDistractedPercent += diff;
          } else {
            awayPercent += diff;
          }
        }
        
        // Clamp all values to 0-100
        attentivePercent = Math.max(20, Math.min(100, attentivePercent));
        distractedPercent = Math.max(0, Math.min(100, distractedPercent));
        veryDistractedPercent = Math.max(0, Math.min(100, veryDistractedPercent));
        awayPercent = Math.max(0, Math.min(100, awayPercent));
        
        // Re-normalize to ensure sum = 100%
        const componentSum = attentivePercent + distractedPercent + veryDistractedPercent + awayPercent;
        if (componentSum > 0 && componentSum !== 100) {
          const scale = 100 / componentSum;
          attentivePercent = Math.round(attentivePercent * scale);
          distractedPercent = Math.round(distractedPercent * scale);
          veryDistractedPercent = Math.round(veryDistractedPercent * scale);
          awayPercent = 100 - attentivePercent - distractedPercent - veryDistractedPercent;
        }
        
        // Attentiveness percentage is the attentive percent
        const attentivenessPercentage = Math.max(20, Math.min(100, attentivePercent));
        
        // Average attention score (only for frames where they were present)
        const avgScore = studentTracking && studentTracking.attentionScores.length > 0
          ? Math.round(studentTracking.attentionScores.reduce((sum, score) => sum + score, 0) / studentTracking.attentionScores.length)
          : 0;

        return {
          student_id: tracked.student_id,
          full_name: tracked.full_name,
          roll_no: tracked.roll_no,
          image_url: tracked.image_url,
          attentiveness_percentage: attentivenessPercentage,
          average_attention: avgScore,
          total_frames: totalFramesSinceDetection,
          frames_present: tracked.framesPresent || 0,
          frames_absent: tracked.framesAbsent || 0,
          duration_seconds: Math.round((tracked.lastSeen - tracked.firstSeen) / 1000),
          status_breakdown: {
            attentive: attentivePercent,
            distracted: distractedPercent,
            very_distracted: veryDistractedPercent,
            away: awayPercent
          },
          status_counts: {
            attentive: attentiveFrames,
            distracted: distractedFrames,
            very_distracted: veryDistractedFrames,
            away: totalAbsentFrames
          }
        };
      }).filter(s => s !== null); // Remove null entries

      // Sort by attentiveness percentage (lowest first - needs most attention)
      summary.sort((a, b) => a.attentiveness_percentage - b.attentiveness_percentage);

      const overallAverage = summary.length > 0 
        ? Math.max(20, Math.min(100, Math.round(
            summary.reduce((sum, s) => sum + s.attentiveness_percentage, 0) / summary.length
          )))
        : 0;

      setSessionSummary({
        students: summary,
        total_students: summary.length,
        overall_average: overallAverage,
        session_end: new Date().toISOString()
      });

      console.log('Session Summary:', summary);
      toast.success(`Session ended - ${summary.length} students tracked`);
    }

    // Clear tracking data for next session
    studentTrackingRef.current.clear();
    faceTrackingRef.current.clear();

    if (sessionId) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attentiveness/session/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
      } catch (err) {
        console.error('Error ending session:', err);
      }
    }

    stopCamera();
    setSessionId(null);
    setDetectionResults([]);
    setClassSummary(null);
    toast.info('Monitoring stopped');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'attentive': return 'bg-green-500';
      case 'distracted': return 'bg-yellow-500';
      case 'very_distracted': return 'bg-orange-500';
      case 'away': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <TeacherSidebar />
      
      <main className="flex-1 ml-64 bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Attentiveness Monitor</h1>
              <p className="text-muted-foreground">
                AI-powered student attention tracking
              </p>
            </div>
            
            <div className="flex gap-3">
              {!isMonitoring ? (
                <Button 
                  onClick={startMonitoring} 
                  disabled={loadingModels || !modelsLoaded}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Monitoring
                </Button>
              ) : (
                <Button 
                  onClick={stopMonitoring} 
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Monitoring
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={fetchEnrolledStudents}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Students
              </Button>
            </div>
          </div>

          {/* Status Bar */}
          {loadingModels && (
            <Card className="border-blue-500 bg-blue-500/10">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                <div className="flex-1">
                  <span className="font-medium">Loading AI models (Face-API + MoveNet)...</span>
                  <p className="text-sm text-muted-foreground mt-1">This may take a few moments on first load</p>
                </div>
              </CardContent>
            </Card>
          )}

          {modelsLoaded && !loadingModels && (
            <Card className="border-green-500 bg-green-500/10">
              <CardContent className="py-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  All AI models loaded and ready
                </span>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="py-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div className="flex-1">
                  <span className="font-medium">{error}</span>
                  <p className="text-sm text-muted-foreground mt-1">Please check browser console for details</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Feed */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {cameraActive ? (
                      <Camera className="w-5 h-5 text-green-500" />
                    ) : (
                      <CameraOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    Live Feed
                    {isMonitoring && (
                      <Badge variant="default" className="ml-2 animate-pulse">
                        LIVE
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ display: 'none' }}
                    />
                    <canvas
                      ref={canvasRef}
                      width={1280}
                      height={720}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {!isMonitoring && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
                        <div className="text-center space-y-3">
                          <CameraOff className="w-16 h-16 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-lg font-medium">Camera Inactive</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {!modelsLoaded ? 'Waiting for AI models to load...' : 'Click "Start Monitoring" to begin'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isMonitoring && cameraActive && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/90 text-white px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-sm font-medium">Recording</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              {/* Class Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Class Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {classSummary ? (
                    <>
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          {classSummary.average_attention}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Average Attention
                        </div>
                        <Progress 
                          value={classSummary.average_attention} 
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <div className="text-lg font-semibold text-green-600">
                            {classSummary.attentive_count}
                          </div>
                          <div className="text-xs text-muted-foreground">Attentive</div>
                        </div>
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                          <div className="text-lg font-semibold text-yellow-600">
                            {classSummary.distracted_count}
                          </div>
                          <div className="text-xs text-muted-foreground">Distracted</div>
                        </div>
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <div className="text-lg font-semibold text-red-600">
                            {classSummary.away_count}
                          </div>
                          <div className="text-xs text-muted-foreground">Away</div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground text-center">
                        {classSummary.identified_count} of {classSummary.total_detected} identified
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Start monitoring to see summary
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enrolled Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Enrolled Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">
                    {enrolledStudents.length}
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    students with face enrollment
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Detection Results */}
          {sessionSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Session Summary Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Attentiveness</p>
                      <p className="text-3xl font-bold">{sessionSummary.overall_average}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Frames Present & Attentive</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students Tracked</p>
                      <p className="text-3xl font-bold">{sessionSummary.total_students}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Individual Student Performance</h3>
                    {sessionSummary.students.map((student, index) => (
                      <div
                        key={student.student_id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start gap-3">
                          {student.image_url ? (
                            <img
                              src={student.image_url}
                              alt={student.full_name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
                              {student.full_name.charAt(0)}
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{student.full_name}</p>
                                <p className="text-sm text-muted-foreground">{student.roll_no}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{student.attentiveness_percentage}%</p>
                                <p className="text-xs text-muted-foreground">Attentiveness</p>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mb-2">
                              Present: {student.frames_present} frames | Absent: {student.frames_absent} frames | Total: {student.total_frames} frames
                            </div>

                            <div className="grid grid-cols-4 gap-2 mt-3">
                              <div className="text-center p-2 rounded bg-green-500/10">
                                <p className="text-lg font-semibold text-green-600">{student.status_breakdown.attentive}%</p>
                                <p className="text-xs text-muted-foreground">Attentive</p>
                              </div>
                              <div className="text-center p-2 rounded bg-yellow-500/10">
                                <p className="text-lg font-semibold text-yellow-600">{student.status_breakdown.distracted}%</p>
                                <p className="text-xs text-muted-foreground">Distracted</p>
                              </div>
                              <div className="text-center p-2 rounded bg-orange-500/10">
                                <p className="text-lg font-semibold text-orange-600">{student.status_breakdown.very_distracted}%</p>
                                <p className="text-xs text-muted-foreground">Very Dist.</p>
                              </div>
                              <div className="text-center p-2 rounded bg-red-500/10">
                                <p className="text-lg font-semibold text-red-600">{student.status_breakdown.away}%</p>
                                <p className="text-xs text-muted-foreground">Away</p>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                              Tracked for {student.duration_seconds}s | Avg Score: {student.average_attention}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {detectionResults.length > 0 && isMonitoring && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Detected Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {detectionResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {result.image_url ? (
                          <img
                            src={result.image_url}
                            alt={result.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                            {result.full_name.charAt(0)}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.full_name}</div>
                          <div className="text-sm text-muted-foreground">{result.roll_no}</div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${getStatusColor(result.status)} text-white`}>
                              {result.attention_score}%
                            </Badge>
                            <span className="text-xs capitalize text-muted-foreground">
                              {result.status.replace('_', ' ')}
                            </span>
                          </div>

                          {result.reasons[0] !== 'engaged' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {result.reasons.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
