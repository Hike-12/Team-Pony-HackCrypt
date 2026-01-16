import React, { useRef } from 'react';
import { AdminSubjectTable } from '@/components/admin/AdminSubjectTable';
import { AdminSubjectForm } from '@/components/admin/AdminSubjectForm';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';

export default function AdminSubjects() {
  const isExpanded = useSidebarState();
  const tableRef = useRef();

  const handleSubjectAdded = () => {
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
          <h1 className="text-lg font-semibold">Manage Subjects</h1>
        </header>
        <div className={cn(
          "mx-auto space-y-6 p-6 transition-all duration-300",
          isExpanded ? "max-w-7xl" : "max-w-full"
        )}>
          <section>
            <AdminSubjectForm onSubjectAdded={handleSubjectAdded} />
          </section>
          <section>
            <AdminSubjectTable ref={tableRef} />
          </section>
        </div>
      </main>
    </div>
  );
}
