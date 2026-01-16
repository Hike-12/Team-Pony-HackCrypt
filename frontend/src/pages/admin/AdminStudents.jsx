import React from 'react';
import { AdminStudentTable } from '@/components/admin/AdminStudentTable';
import { AdminStudentForm } from '@/components/admin/AdminStudentForm';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminStudents() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex flex-1 flex-col min-h-screen bg-background transition-all duration-200 ease-in-out">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">Manage Students</h1>
        </header>
        <div className="flex-1 space-y-6 p-6">
          <section>
            <AdminStudentForm />
          </section>
          <section>
            <AdminStudentTable />
          </section>
        </div>
      </main>
    </SidebarProvider>
  );
}
