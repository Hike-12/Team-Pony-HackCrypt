import React, { useContext, useState, useEffect, useState } from 'react'
import { TeacherContext } from '@/context/TeacherContext'
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar'
import { Clock } from 'lucide-react'
import QRScanner from '@/components/teacher/QRScanner'
import { QrCode } from 'lucide-react'

const TeacherDashboard = () => {
  const { teacher } = useContext(TeacherContext);
  const [nextLecture, setNextLecture] = useState(null);

  useEffect(() => {
    if (teacher && (teacher.id || teacher._id)) {
        const tid = teacher._id || teacher.id;
        fetchSchedule(tid);
    }
  }, [teacher]);

  const fetchSchedule = async (tid) => {
    try {
        const [slotsRes, entriesRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/slots`),
            fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/entries?teacher_id=${tid}`)
        ]);
        
        const slotsData = await slotsRes.json();
        const entriesData = await entriesRes.json();

        if (slotsData.success && entriesData.success) {
            calculateNextLecture(slotsData.data, entriesData.data);
        }
    } catch (e) {
        console.error(e);
    }
  };

  const calculateNextLecture = (slots, entries) => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 Sun, 1 Mon...
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Filter entries for today
      const todayEntries = entries.filter(e => e.day_of_week === currentDay);
      
      let upcoming = null;
      let minDiff = Infinity;

      todayEntries.forEach(entry => {
          const slot = entry.slot_id.start_time ? entry.slot_id : slots.find(s => s._id === entry.slot_id);
          if (!slot) return;
          
          const [h, m] = slot.start_time.split(':').map(Number);
          const startMinutes = h * 60 + m;
          
          if (startMinutes > currentMinutes) {
              const diff = startMinutes - currentMinutes;
              if (diff < minDiff) {
                  minDiff = diff;
                  upcoming = { ...entry, slot, diff };
              }
          }
      });

      setNextLecture(upcoming);
  };

  const [showQRScanner, setShowQRScanner] = useState(false)
  return (
    <div className="flex min-h-screen w-full">
      <TeacherSidebar />
      <main className="flex-1 min-h-screen w-full ml-64 bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="text-lg font-semibold">Teacher Dashboard</h1>
        </header>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
             {/* Next Lecture Widget */}
             <div className="p-4 border rounded-lg shadow-sm bg-primary/5 text-card-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Clock size={48} />
                </div>
                <h3 className="font-semibold text-sm text-primary">Next Lecture</h3>
                {nextLecture ? (
                    <div className="mt-2">
                        <p className="text-xl font-bold truncate">{nextLecture.teacher_subject_id?.subject_id?.name || 'Subject'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            in {Math.floor(nextLecture.diff / 60)}h {nextLecture.diff % 60}m
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {nextLecture.slot.start_time} - {nextLecture.room_label}
                        </p>
                    </div>
                ) : (
                    <p className="text-lg font-medium mt-2 text-muted-foreground">No more lectures today</p>
                )}
            </div>

            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Today's Classes</h3>
              <p className="text-2xl font-bold mt-2">5</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Total Students</h3>
              <p className="text-2xl font-bold mt-2 text-chart-1">156</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Attendance Rate</h3>
              <p className="text-2xl font-bold mt-2 text-green-600 dark:text-green-500">92%</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border p-8">
            <h2 className="text-2xl font-bold mb-2">Welcome, {teacher?.name || 'Teacher'}!</h2>
            <div className="mb-4">
              <p className="text-muted-foreground">
                <span className="font-semibold">Department:</span> {teacher?.department || 'Not specified'}
              </p>
            </div>
            <p className="text-muted-foreground mb-6">
              This is your teacher dashboard. Manage your classes, take attendance, and track student performance.
            </p>
            
            {/* QR Scanner Button */}
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium flex items-center gap-2 shadow-md"
            >
              <QrCode className="h-5 w-5" />
              Scan QR for Attendance
            </button>
          </div>
        </div>
      </main>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner onClose={() => setShowQRScanner(false)} />
      )}
    </div>
  )
}

export default TeacherDashboard
