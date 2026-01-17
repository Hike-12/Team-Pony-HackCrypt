import React, { useRef } from 'react';
import { AdminSubjectTable } from '@/components/admin/AdminSubjectTable';
import { AdminSubjectForm } from '@/components/admin/AdminSubjectForm';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { CSVUploadDialog } from '@/components/admin/CSVUploadDialog';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useState } from 'react';

export default function AdminSubjects() {
  const isExpanded = useSidebarState();
  const tableRef = useRef();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleSubjectAdded = () => {
    if (tableRef.current) {
      tableRef.current.refresh();
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    handleSubjectAdded();
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
          <div className="ml-auto">
            <Button onClick={() => setIsUploadOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>
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

        <CSVUploadDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUploadSuccess={handleUploadSuccess}
          uploadEndpoint="/api/admin/csv/subjects/upload-csv"
          title="Import Subjects from CSV"
          description="Upload a CSV file with subject_name and subject_code columns"
        />
      </main>
    </div>
  );
}
