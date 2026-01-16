import React from 'react'
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar'

const TeacherDashboard = () => {
  return (
    <div className="flex min-h-screen">
      <TeacherSidebar />
      <main className="flex-1 ml-64 min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-lg font-semibold">Teacher Dashboard</h1>
        </header>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Today's Classes</h3>
              <p className="text-2xl font-bold mt-2">5</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Total Students</h3>
              <p className="text-2xl font-bold mt-2 text-chart-1">156</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Pending Tasks</h3>
              <p className="text-2xl font-bold mt-2 text-chart-2">8</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Attendance Rate</h3>
              <p className="text-2xl font-bold mt-2 text-green-600 dark:text-green-500">92%</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome, Teacher!</h2>
            <p className="text-muted-foreground">
              This is your teacher dashboard. Manage your classes, take attendance, and track student performance.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TeacherDashboard
