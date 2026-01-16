import React from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import StudentQRScanner from '@/components/student/StudentQRScanner';

const StudentQRAttendance = () => {
    return (
        <div className="flex min-h-screen w-full bg-background">
            <StudentSidebar />
            <main className="flex-1 ml-64 p-6">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold">QR Attendance</h1>
                    <p className="text-muted-foreground">Scan QR code to mark your attendance</p>
                </header>
                <StudentQRScanner />
            </main>
        </div>
    );
};

export default StudentQRAttendance;
