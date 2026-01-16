import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import AttendanceScanner from '@/components/student/AttendanceScanner';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { useStudent } from '@/context/StudentContext';
import { toast } from 'sonner';
import {
  TrendingUp,
  Calendar,
  Award,
  FileText,
  Camera,
  Clock,
  FileCheck,
  CheckCircle2,
  Activity,
  BookOpen,
  Users,
  Bell
} from 'lucide-react';

const StudentDashboard = () => {
  const { student } = useStudent();
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  };

  const isExpanded = useSidebarState();

  const stats = [
    {
      title: 'Attendance Rate',
      value: '89%',
      icon: TrendingUp,
      color: 'text-chart-1'
    },
    {
      title: 'Classes Today',
      value: '4',
      icon: Calendar,
      color: 'text-chart-2'
    },
    {
      title: 'Performance Score',
      value: 'A+',
      icon: Award,
      color: 'text-chart-3'
    },
    {
      title: 'Assignments Due',
      value: '3',
      icon: FileText,
      color: 'text-chart-4'
    }
  ];

  const quickActions = [
    { icon: Calendar, label: 'View Attendance History' },
    { icon: Clock, label: 'Check Timetable' }
  ];

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      <main className="flex-1 min-h-screen w-full ml-64 bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 mt-1 items-center justify-between border-b bg-background/95 px-8 backdrop-blur-sm supports-backdrop-filter:bg-background/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Welcome back, {student?.name?.split(' ')[0] || 'Student'}</p>
            </div>
          </div>
          {enrollmentStatus?.enrolled && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Verified
            </div>
          )}
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {/* Stats Cards - All Same Height */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <div className="h-full p-5 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-md bg-muted flex items-center justify-center", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </h3>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Attendance Section */}
          <div>
            {loading ? (
              <div className="rounded-lg border bg-card p-8 shadow-sm h-full flex items-center justify-center min-h-105">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground font-medium">Loading biometric data...</p>
                </div>
              </div>
            ) : !enrollmentStatus?.enrolled ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 shadow-sm h-full flex items-center justify-center min-h-105">
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold">Face Enrollment Pending</h3>
                  <p className="text-sm text-muted-foreground">
                    Please contact your admin to enroll your face for attendance verification.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-6 shadow-sm h-full min-h-105">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold">Mark Attendance</h2>
                </div>

                {!showAttendance ? (
                  <div className="text-center space-y-6 py-16">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium mb-2">Ready to Scan</h3>
                      <p className="text-sm text-muted-foreground">
                        Mark your attendance with face verification
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAttendance(true)}
                      className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
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
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-lg border bg-card hover:bg-accent transition-all text-left shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <action.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <span className="font-medium">{action.label}</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Welcome Section */}
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold mb-3">
                  Welcome, {student?.name || student?.full_name || 'Student'}!
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This is your student dashboard. Track your attendance, view classes, and monitor your academic progress all in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;