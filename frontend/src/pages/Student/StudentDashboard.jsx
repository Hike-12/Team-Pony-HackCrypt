import React, { useState, useEffect } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import FaceEnrollment from '@/components/student/FaceEnrollment';
import AttendanceScanner from '@/components/student/AttendanceScanner';
import { useStudent } from '@/context/StudentContext';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { student } = useStudent();
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check enrollment status on mount
  useEffect(() => {
    // IMPORTANT: Check for student_id (the specific student profile ID), fall back to id if needed
    // But biometric endpoints MUST use the student profile ID
    const targetId = student?.student_id || student?.id;
    
    if (targetId) {
      checkEnrollmentStatus(targetId);
    } else {
      setLoading(false);
    }
  }, [student]);

  const checkEnrollmentStatus = async (id) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/student/biometric/${id}/status`,
        { credentials: 'include' }
      );
      
      if (!res.ok) {
        throw new Error('Failed to check status');
      }

      const data = await res.json();
      setEnrollmentStatus(data);
      
      if (data.enrolled) {
        await fetchFaceEmbedding(id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking enrollment:', err);
      // Don't show toast on 404/initial load errors to avoid spamming
      setLoading(false);
    }
  };

  const fetchFaceEmbedding = async (id) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/student/biometric/${id}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to fetch embedding');
      const data = await res.json();
      setFaceEmbedding(data.face_embedding);
    } catch (err) {
      console.error('Error fetching embedding:', err);
      toast.error('Could not load face data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentComplete = () => {
    const targetId = student?.student_id || student?.id;
    if (targetId) checkEnrollmentStatus(targetId);
  };

  const handleAttendanceSuccess = async () => {
    toast.success('Attendance marked successfully!');
    setShowAttendance(false);
    // TODO: Call backend to mark attendance
  };

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      <main className="flex-1 min-h-screen w-full ml-64 bg-background">
        <header className="sticky top-0 z-10 flex h-16 mt-1 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Attendance Rate</h3>
              <p className="text-2xl font-bold mt-2 text-chart-1">89%</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Classes Today</h3>
              <p className="text-2xl font-bold mt-2">4</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Performance Score</h3>
              <p className="text-2xl font-bold mt-2 text-green-600 dark:text-green-500">A+</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Assignments Due</h3>
              <p className="text-2xl font-bold mt-2 text-chart-2">3</p>
            </div>
          </div>

          {/* Face Enrollment/Attendance Section */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            {loading ? (
              <div className="rounded-xl bg-card border p-6 shadow-sm min-h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading biometric data...</p>
                </div>
              </div>
            ) : !enrollmentStatus?.enrolled ? (
              <FaceEnrollment
                studentId={student?.student_id || student?.id}
                onEnrollmentComplete={handleEnrollmentComplete}
              />
            ) : (
              <div className="rounded-xl bg-card border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-foreground">Mark Attendance</h2>
                {!showAttendance ? (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📸</span>
                    </div>
                    <p className="text-muted-foreground">
                      Ready to mark attendance with face verification
                    </p>
                    <button
                      onClick={() => setShowAttendance(true)}
                      className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all shadow-lg hover:shadow-primary/20"
                    >
                      Start Attendance Scan
                    </button>
                  </div>
                ) : (
                  <AttendanceScanner
                    storedDescriptor={faceEmbedding}
                    onSuccess={handleAttendanceSuccess}
                  />
                )}
              </div>
            )}

            <div className="rounded-xl bg-card border p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all text-left flex items-center gap-3">
                  <span>📅</span> View Attendance History
                </button>
                <button className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all text-left flex items-center gap-3">
                  <span>🕰️</span> Check Timetable
                </button>
                <button className="w-full px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all text-left flex items-center gap-3">
                  <span>📝</span> View Assignments
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card border p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome, {student?.name || student?.full_name || 'Student'}!</h2>
            <p className="text-muted-foreground">
              This is your student dashboard. Track your attendance, view classes, and monitor your academic progress.
            </p>
            {enrollmentStatus?.enrolled && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                <span>✓</span> Face verification enabled
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;