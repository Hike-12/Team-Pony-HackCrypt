import React from 'react';
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';
import QRAttendance from '@/components/teacher/QRAttendance';

const TeacherQRAttendance = () => {
    return (
        <div className="flex min-h-screen w-full">
            <TeacherSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <h1 className="text-lg font-semibold">QR Code Attendance</h1>
                </header>
                <div className="p-6">
                    <QRAttendance />
                </div>
            </main>
        </div>
    );
};

export default TeacherQRAttendance;
