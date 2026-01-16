import React, { useState, useEffect, useContext } from 'react';
import TimetableGrid from '../../components/TimetableGrid';
import { StudentSidebar } from '../../components/student/StudentSidebar';
import { StudentContext } from '../../context/StudentContext';
import { format, startOfWeek } from 'date-fns';

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

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekInfo = `${format(weekStart, 'dd MMM')} - ${format(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd MMM yyyy')}`;

    return (
        <div className="flex min-h-screen w-full">
            <StudentSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="px-6 py-4">
                        <h1 className="text-2xl font-bold text-foreground">My Class Timetable</h1>
                        <p className="text-sm text-muted-foreground mt-1">Week of {weekInfo}</p>
                    </div>
                </header>
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
                                <p className="text-muted-foreground text-sm">Loading timetable...</p>
                            </div>
                        </div>
                    ) : entries.length > 0 ? (
                        <TimetableGrid slots={slots} entries={entries} role="STUDENT" />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border border-dashed">
                             <div className="mb-4">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-3xl">📅</span>
                                </div>
                             </div>
                             <h3 className="text-lg font-semibold text-foreground">No Classes Scheduled</h3>
                             <p className="text-muted-foreground mt-2 text-center max-w-sm">Your timetable is currently empty. Check back later or contact your administrator.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentTimetable;
