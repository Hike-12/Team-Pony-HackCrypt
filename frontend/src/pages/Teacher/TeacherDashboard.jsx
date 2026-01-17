import React, { useContext, useState, useEffect } from 'react'
import { TeacherContext } from '@/context/TeacherContext'
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar'
import { Clock, QrCode } from 'lucide-react'
import QRScanner from '@/components/teacher/QRScanner'
import { toast } from 'sonner'

const TeacherDashboard = () => {
  const { teacher } = useContext(TeacherContext)
  const [nextLecture, setNextLecture] = useState(null)
  const [lecturesToday, setLecturesToday] = useState([])
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [loadingLectures, setLoadingLectures] = useState(true)

  // Fetch today's lectures for dropdown
  useEffect(() => {
    async function fetchLectures() {
      setLoadingLectures(true)
      try {
        const token = localStorage.getItem('teacherToken')
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/today-lectures`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) {
          setLecturesToday(data.lectures)
          // Set next lecture as default
          if (data.lectures.length > 0) setSelectedLectureId(data.lectures[0]._id)
        } else {
          setLecturesToday([])
        }
      } catch (err) {
        setLecturesToday([])
      } finally {
        setLoadingLectures(false)
      }
    }
    fetchLectures()
  }, [teacher])

  // Next lecture widget logic
  useEffect(() => {
    if (lecturesToday.length === 0) {
      setNextLecture(null)
      return
    }
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    let upcoming = null
    let minDiff = Infinity
    lecturesToday.forEach(entry => {
      const slot = entry.slot_id
      const [h, m] = slot.start_time.split(':').map(Number)
      const startMinutes = h * 60 + m
      if (startMinutes > currentMinutes) {
        const diff = startMinutes - currentMinutes
        if (diff < minDiff) {
          minDiff = diff
          upcoming = { ...entry, slot, diff }
        }
      }
    })
    setNextLecture(upcoming)
  }, [lecturesToday])

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
              <p className="text-2xl font-bold mt-2">{lecturesToday.length}</p>
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
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner onClose={() => setShowQRScanner(false)} />
        )}
      </main>
    </div>
  )
}

export default TeacherDashboard