import React, { useState } from "react";
import { useFaceAttendance } from "@/hooks/useFaceAttendance";
import { toast } from "sonner";
import { FaCamera, FaCheck } from "react-icons/fa";

export default function FaceEnrollment({ studentId, onEnrollmentComplete }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    videoRef,
    status,
    error,
    captureDescriptor,
    startVideo,
  } = useFaceAttendance({
    storedDescriptor: null, // No comparison needed for enrollment
    onSuccess: () => {},
  });

  const handleStartCapture = async () => {
    setIsCapturing(true);
    await startVideo();
  };
  
const handleCapture = async () => {
  setLoading(true);
  try {
    const descriptor = await captureDescriptor();
    
    if (!descriptor) {
      toast.error("No face detected. Please try again.");
      setLoading(false);
      return;
    }

    // Debug: Log what will be sent
    console.log("ENROLLMENT PAYLOAD:", {
      student_id: studentId,
      face_embedding: descriptor,
    });

    // Send to backend
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/biometric/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        student_id: studentId,
        face_embedding: descriptor,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.log("ENROLLMENT ERROR RESPONSE:", data);
      throw new Error(data.error || "Enrollment failed");
    }

    toast.success("Face enrolled successfully!");
    setEnrolled(true);
    setIsCapturing(false);
    
    // Stop webcam
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }

    onEnrollmentComplete && onEnrollmentComplete();
  } catch (err) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="rounded-xl bg-card border p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-foreground">Face Enrollment</h2>
      
      {!isCapturing && !enrolled && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Enroll your face for attendance verification
          </p>
          <button
            onClick={handleStartCapture}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all mx-auto"
          >
            <FaCamera /> Start Enrollment
          </button>
        </div>
      )}

      {isCapturing && !enrolled && (
        <div className="flex flex-col items-center gap-6">
          <video
            ref={videoRef}
            width={360}
            height={270}
            autoPlay
            muted
            className="rounded-lg border shadow bg-black"
            style={{ objectFit: "cover" }}
          />
          <div className="w-full text-center space-y-4">
            {status === "loading" && <p>Loading face recognition models...</p>}
            {status === "ready" && <p>Position your face in the camera...</p>}
            {error && <p className="text-red-600">{error}</p>}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCapture}
                disabled={loading || status === "loading"}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <FaCamera /> Capture Face
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsCapturing(false);
                  if (videoRef.current && videoRef.current.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
                  }
                }}
                className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {enrolled && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
            <FaCheck className="text-green-600 text-2xl" />
          </div>
          <p className="font-semibold text-green-600">Face enrolled successfully!</p>
          <p className="text-muted-foreground">You can now use face verification for attendance.</p>
        </div>
      )}
    </div>
  );
}
