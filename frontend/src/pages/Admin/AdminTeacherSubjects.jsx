import React, { useRef } from 'react';
import { AdminTeacherSubjectTable } from '@/components/admin/AdminTeacherSubjectTable';
import { AdminTeacherSubjectForm } from '@/components/admin/AdminTeacherSubjectForm';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';

export default function AdminTeacherSubjects() {
  const isExpanded = useSidebarState();
  const tableRef = useRef();

  const handleAssignmentAdded = () => {
    if (tableRef.current) {
      tableRef.current.refresh();
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <main className={cn(
        "flex-1 min-h-screen bg-background transition-all duration-300",
        isExpanded ? "ml-64" : "ml-20"
      )}>
        <header className="sticky top-0 z-10 flex h-16 mt-1 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="text-lg font-semibold">Manage Teacher Subjects</h1>
        </header>
        <div className={cn(
          "mx-auto space-y-6 p-6 transition-all duration-300",
          isExpanded ? "max-w-7xl" : "max-w-full"
        )}>
          <section>
            <AdminTeacherSubjectForm onAssignmentAdded={handleAssignmentAdded} />
          </section>
          <section>
            <AdminTeacherSubjectTable ref={tableRef} />
          </section>
        </div>
      </main>
    </div>
  );
}
