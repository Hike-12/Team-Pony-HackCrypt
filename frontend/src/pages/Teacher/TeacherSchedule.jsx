import React, { useState, useEffect, useContext } from 'react';
import { TeacherContext } from '../../context/TeacherContext';
import TimetableGrid from '../../components/TimetableGrid';
import { TeacherSidebar } from '../../components/teacher/TeacherSidebar';
import { format, startOfWeek } from 'date-fns';

const TeacherSchedule = () => {
    const { teacher } = useContext(TeacherContext);
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            if (teacher?.teacher_id) {
                 await fetchTimetable(teacher.teacher_id);
            } else if (teacher?.email) {
                 await fetchTeacherProfile(teacher);
            } else {
                 // Fallback to localStorage if context not yet ready or persisted
                 const userStr = localStorage.getItem('teacherUser');
                 if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user.teacher_id) {
                        await fetchTimetable(user.teacher_id);
                    } else {
                        await fetchTeacherProfile(user);
                    }
                 } else {
                     setLoading(false);
                 }
            }
        };
        init();
    }, [teacher]);

    const fetchTeacherProfile = async (user) => {
        try {
             const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers`);
             const teachers = await res.json();
             const me = teachers.find(t => t.email === user.email);
             if (me) {
                 fetchTimetable(me._id);
             }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const fetchTimetable = async (tid) => {
        try {
            const [slotsRes, entriesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/slots`),
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/entries?teacher_id=${tid}`)
            ]);
            
            const slotsData = await slotsRes.json();
            const entriesData = await entriesRes.json();

            if (slotsData.success) setSlots(slotsData.data);
            if (entriesData.success) setEntries(entriesData.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load schedule", error);
            setLoading(false);
        }
    };

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekInfo = `${format(weekStart, 'dd MMM')} - ${format(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'dd MMM yyyy')}`;

    return (
        <div className="flex min-h-screen w-full">
            <TeacherSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="px-6 py-4">
                        <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
                        <p className="text-sm text-muted-foreground mt-1">Week of {weekInfo}</p>
                    </div>
                </header>
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
                                <p className="text-muted-foreground text-sm">Loading schedule...</p>
                            </div>
                        </div>
                    ) : (
                        <TimetableGrid slots={slots} entries={entries} role="TEACHER" />
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeacherSchedule;
