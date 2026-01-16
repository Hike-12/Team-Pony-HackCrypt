import React, { useContext } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { StudentContext } from '@/context/StudentContext';
import { BiometricEnrollment } from '@/components/student/BiometricEnrollment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


const StudentDashboard = () => {
  const isExpanded = useSidebarState();
  const { student } = useContext(StudentContext); 
  
  // Debug log
  console.log('StudentDashboard - student object:', student);
  console.log('StudentDashboard - student._id:', student?._id);

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      <main className={cn(
        "flex-1 min-h-screen bg-background transition-all duration-300",
        isExpanded ? "ml-64" : "ml-20"
      )}>
        <header className="sticky top-0 z-10 flex h-16 mt-1 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        
        <div className={cn(
          "mx-auto space-y-6 p-6 transition-all duration-300",
          isExpanded ? "max-w-7xl" : "max-w-full"
        )}>
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {student?.name || 'Student'}!</CardTitle>
              <CardDescription>Roll No: {student?.roll_no}</CardDescription>
            </CardHeader>
          </Card>

          <Separator />

          {/* Biometric Enrollment Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Biometric Setup</h2>
            <BiometricEnrollment studentId={student?._id} />
          </section>

          {/* Other dashboard content... */}
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard
