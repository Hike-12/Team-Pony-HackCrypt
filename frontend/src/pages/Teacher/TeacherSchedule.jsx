import React, { useState, useEffect, useContext } from 'react';
import { TeacherContext } from '../../context/TeacherContext';
import TimetableGrid from '../../components/TimetableGrid';
import { TeacherSidebar } from '../../components/teacher/TeacherSidebar';

const TeacherSchedule = () => {
    const { teacher } = useContext(TeacherContext);
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            if (teacher && teacher.id) {
                await fetchTimetable(teacher.id);
            } else if (teacher && teacher._id) {
                await fetchTimetable(teacher._id);
            } else {
                 // Fallback
                 const userStr = localStorage.getItem('user'); // Maybe 'teacherUser'?
                 if (userStr) {
                    const user = JSON.parse(userStr);
                    await fetchTeacherProfile(user);
                 } else {
                     setLoading(false);
                 }
            }
        };
        init();
    }, [teacher]);

    const fetchTeacherProfile = async (user) => {
        try {
            // Find teacher by user_id or email
            // Currently assuming we have teacherId stored or we fetch it
            // Let's rely on an endpoint /api/teacher/auth/me if exists
            // Or just hardcode logic if needed. 
            // Better: User logs in -> gets token -> /me returns teacher profile.
            
            // Temporary: fetch all teachers and find me by email
             const res = await fetch('http://localhost:8000/api/admin/teachers');
             const teachers = await res.json();
             const me = teachers.find(t => t.email === user.email);
             if (me) {
                 fetchTimetable(me._id);
             }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTimetable = async (tid) => {
        try {
            const [slotsRes, entriesRes] = await Promise.all([
                fetch('http://localhost:8000/api/admin/timetable/slots'),
                fetch(`http://localhost:8000/api/admin/timetable/entries?teacher_id=${tid}`)
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

    return (
        <div className="flex min-h-screen w-full">
            <TeacherSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <h1 className="text-lg font-semibold">My Schedule</h1>
                </header>
                <div className="p-8">
                    {loading ? (
                        <div>Loading schedule...</div>
                    ) : (
                        <TimetableGrid slots={slots} entries={entries} role="TEACHER" />
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeacherSchedule;
