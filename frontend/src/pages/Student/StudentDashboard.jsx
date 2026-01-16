import React from 'react'
import { StudentSidebar } from '@/components/student/StudentSidebar'

const StudentDashboard = () => {
  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <main className="flex-1 ml-64 min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-lg font-semibold">Student Dashboard</h1>
        </header>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
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
          <div className="rounded-xl bg-card border p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome, Student!</h2>
            <p className="text-muted-foreground">
              This is your student dashboard. Track your attendance, view classes, and monitor your academic progress.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard
