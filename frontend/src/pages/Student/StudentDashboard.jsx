import React from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Separator } from '@/components/ui/separator'

const StudentDashboard = () => {
  return (
    <SidebarProvider>
      <StudentSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Student Dashboard</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Attendance</p>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Classes Today</p>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Performance</p>
            </div>
          </div>
          <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome, Student!</h2>
            <p className="text-muted-foreground">
              This is your student dashboard. Track your attendance, view classes, and monitor your academic progress.
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default StudentDashboard
