import React from 'react';
import { AdminTeacherTable } from '@/components/admin/AdminTeacherTable';
import { AdminTeacherForm } from '@/components/admin/AdminTeacherForm';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminTeachers() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-lg font-semibold">Manage Teachers</h1>
        </header>
        <div className="flex-1 space-y-6 p-6">
          <section>
            <AdminTeacherForm />
          </section>
          <section>
            <AdminTeacherTable />
          </section>
        </div>
      </main>
    </div>
  );
}
