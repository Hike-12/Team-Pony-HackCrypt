import React, { useRef, useState } from 'react';
import { AdminStudentTable } from '@/components/admin/AdminStudentTable';
import { AdminStudentForm } from '@/components/admin/AdminStudentForm';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { CSVUploadDialog } from '@/components/admin/CSVUploadDialog';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function AdminStudents() {
  const isExpanded = useSidebarState();
  const tableRef = useRef();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleStudentAdded = () => {
    // Refresh the table when a new student is added
    if (tableRef.current) {
      tableRef.current.refresh();
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    handleStudentAdded();
  };

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <main className={cn(
        "flex-1 min-h-screen bg-background transition-all duration-300",
        isExpanded ? "ml-64" : "ml-20"
      )}>
        <header className="sticky top-0 z-10 flex h-16 mt-1 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="text-lg font-semibold">Manage Students</h1>
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
            <AdminStudentForm onStudentAdded={handleStudentAdded} />
          </section>
          <section>
            <AdminStudentTable ref={tableRef} />
          </section>
        </div>

        <CSVUploadDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUploadSuccess={handleUploadSuccess}
          uploadEndpoint="/api/admin/csv/students/upload-csv"
          title="Import Students from CSV"
          description="Upload a CSV file with email, password, rollno, fullname, gender, phone, class columns"
        />
      </main>
    </div>
  );
}
