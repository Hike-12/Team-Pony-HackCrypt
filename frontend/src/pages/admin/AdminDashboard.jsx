import React from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Separator } from '@/components/ui/separator'

const AdminDashboard = () => {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Stats Widget 1</p>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Stats Widget 2</p>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground">Stats Widget 3</p>
            </div>
          </div>
          <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome, Admin!</h2>
            <p className="text-muted-foreground">
              This is your admin dashboard. Manage users, view reports, and control system settings.
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminDashboard
