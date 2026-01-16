import React, { useState, useEffect, useContext } from 'react';
import TimetableGrid from '../../components/TimetableGrid';
import { StudentSidebar } from '../../components/student/StudentSidebar';
import { StudentContext } from '../../context/StudentContext';

const StudentTimetable = () => {
    const { student } = useContext(StudentContext);
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!student) return;

            try {
                // Get the student ID from context
                const studentId = student.student_id || student._id || student.id;
                
                // Fetch student details to get class_id
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${studentId}`);
                if (!res.ok) {
                     setLoading(false);
                     return;
                }
                
                const profile = await res.json();
                const classId = profile.class_id?._id || profile.class_id;

                if (classId) {
                    await fetchTimetable(classId);
                } else {
                    setLoading(false); 
                }
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [student]);

    const fetchTimetable = async (cid) => {
        try {
            const [slotsRes, entriesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/slots`),
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/entries?class_id=${cid}`)
            ]);
            
            const slotsData = await slotsRes.json();
            const entriesData = await entriesRes.json();

            if (slotsData.success) setSlots(slotsData.data);
            if (entriesData.success) setEntries(entriesData.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load timetable", error);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full">
            <StudentSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="flex flex-col justify-center">
                        <h1 className="text-lg font-semibold">Class Timetable</h1>
                        <p className="text-xs text-muted-foreground">Week of {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</p>
                    </div>
                </header>
                <div className="p-8">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : entries.length > 0 ? (
                        <div className="bg-card rounded-xl border shadow-sm p-1 overflow-hidden">
                             <TimetableGrid slots={slots} entries={entries} role="STUDENT" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                             <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <span className="text-2xl">📅</span>
                             </div>
                             <h3 className="text-lg font-medium text-foreground">No Classes Scheduled</h3>
                             <p className="text-muted-foreground mt-1">Your timetable is currently empty.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentTimetable;
