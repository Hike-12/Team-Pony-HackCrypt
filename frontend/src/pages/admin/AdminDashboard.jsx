import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const AdminDashboard = () => {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex flex-1 flex-col min-h-screen bg-background transition-all duration-200 ease-in-out">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </header>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Total Users</h3>
              <p className="text-2xl font-bold mt-2">245</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Active Sessions</h3>
              <p className="text-2xl font-bold mt-2 text-chart-1">18</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">System Alerts</h3>
              <p className="text-2xl font-bold mt-2 text-destructive">3</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
              <h3 className="font-semibold text-sm text-muted-foreground">Pending Requests</h3>
              <p className="text-2xl font-bold mt-2 text-chart-2">7</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome, Admin!</h2>
            <p className="text-muted-foreground">
              This is your admin dashboard. Manage users, view reports, and control system settings.
            </p>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}

export default AdminDashboard
