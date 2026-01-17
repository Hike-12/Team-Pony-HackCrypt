import React, { useContext, useState, useEffect } from 'react'
import { TeacherContext } from '@/context/TeacherContext'
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar'
import { Clock, QrCode } from 'lucide-react'
import QRScanner from '@/components/teacher/QRScanner'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const TeacherDashboard = () => {
  const { teacher } = useContext(TeacherContext)
  const [nextLecture, setNextLecture] = useState(null)
  const [lecturesToday, setLecturesToday] = useState([])
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
  })

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

  // Fetch stats (students, attendance rate)
  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem('teacherToken')
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) setStats(data.stats)
      } catch {}
    }
    fetchStats()
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
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <TeacherSidebar />
      <main className="flex-1 min-h-screen w-full ml-64 bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="text-lg font-semibold">Teacher Dashboard</h1>
        </header>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {/* Next Lecture Widget */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle>Next Lecture</CardTitle>
                <CardDescription>Upcoming scheduled class</CardDescription>
              </CardHeader>
              <CardContent>
                {nextLecture ? (
                  <>
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Clock size={48} />
                    </div>
                    <p className="text-xl font-bold truncate">{nextLecture.teacher_subject_id?.subject_id?.name || 'Subject'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      in {Math.floor(nextLecture.diff / 60)}h {nextLecture.diff % 60}m
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {nextLecture.slot.start_time} - {nextLecture.room_label}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-medium mt-2 text-muted-foreground">No more lectures today</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today's Classes</CardTitle>
                <CardDescription>Lectures scheduled for today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mt-2">{lecturesToday.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Students</CardTitle>
                <CardDescription>In your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--chart-1)' }}>{stats.totalStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate</CardTitle>
                <CardDescription>Average for this month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--green-600, #22c55e)' }}>{stats.attendanceRate}%</p>
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-xl border p-8 mb-8">
            <CardHeader>
              <CardTitle>Welcome, {teacher?.name || 'Teacher'}!</CardTitle>
              <CardDescription>
                <span className="font-semibold">Department:</span> {teacher?.department || 'Not specified'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                This is your teacher dashboard. Manage your classes, take attendance, and track student performance.
              </p>
              <Button
                onClick={() => setShowQRScanner(true)}
                className="flex items-center gap-2"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                <QrCode className="h-5 w-5" />
                Scan QR for Attendance
              </Button>
            </CardContent>
          </Card>
          <Button
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)'
            }}
            className="px-4 py-2 rounded"
            onClick={() => setShowStartSession(true)}
          >
            Start Attendance Session
          </Button>
        </div>

        {/* Start Attendance Modal */}
        {showStartSession && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-8">
              <CardHeader>
                <CardTitle>Start Attendance Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block mb-2 font-medium">Select Lecture</label>
                  {loadingLectures ? (
                    <div className="text-muted-foreground">Loading lectures...</div>
                  ) : (
                    <Select
                      value={selectedLectureId}
                      onValueChange={setSelectedLectureId}
                    >
                      <SelectTrigger className="w-full mb-4" style={{
                        background: 'var(--input)',
                        color: 'var(--foreground)',
                        borderColor: 'var(--border)'
                      }}>
                        <SelectValue placeholder="Select Lecture" />
                      </SelectTrigger>
                      <SelectContent>
                        {lecturesToday.map(lec => (
                          <SelectItem key={lec._id} value={lec._id}>
                            {lec.teacher_subject_id.subject_id.name} - {lec.class_id.name} ({lec.slot_id.start_time}-{lec.slot_id.end_time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-3 mb-6">
                  {Object.keys(methodToggles).map(key => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={methodToggles[key]}
                        onChange={() => handleToggle(key)}
                        style={{
                          accentColor: 'var(--primary)'
                        }}
                      />
                      <span className="capitalize">{key.replace('enable_', '').replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button
                  onClick={handleStartSession}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  Start
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowStartSession(false)}
                  style={{
                    background: 'var(--secondary)',
                    color: 'var(--secondary-foreground)'
                  }}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner onClose={() => setShowQRScanner(false)} />
        )}
      </main>
    </div>
  )
}

export default TeacherDashboard