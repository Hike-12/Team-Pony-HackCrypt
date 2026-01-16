import React, { useState, useEffect } from 'react';
import TimetableGrid from '../../components/TimetableGrid';
import { StudentSidebar } from '../../components/student/StudentSidebar';

const StudentTimetable = () => {
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                // Get student info from storage
                const userStr = localStorage.getItem('user');
                const studentProfileStr = localStorage.getItem('studentProfile'); 
                
                let classId = null;

                if (studentProfileStr) {
                    const profile = JSON.parse(studentProfileStr);
                    classId = profile.class_id || profile.class_id?._id;
                } else if (userStr) {
                   // Fallback: Fetch student full profile
                   const user = JSON.parse(userStr);
                   const res = await fetch(`http://localhost:8000/api/admin/students`); // Inefficient but hacky
                   const students = await res.json();
                   const me = students.find(s => s.email === user.email);
                   if (me) classId = me.class_id; 
                }

                if (classId) {
                    await fetchTimetable(classId);
                } else {
                    setLoading(false); // No class found
                }
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, []);

    const fetchTimetable = async (cid) => {
        try {
            const [slotsRes, entriesRes] = await Promise.all([
                fetch('http://localhost:8000/api/admin/timetable/slots'),
                fetch(`http://localhost:8000/api/admin/timetable/entries?class_id=${cid}`)
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
                    <h1 className="text-lg font-semibold">Class Timetable</h1>
                </header>
                <div className="p-8">
                    {loading ? (
                        <div>Loading timetable...</div>
                    ) : entries.length > 0 ? (
                        <TimetableGrid slots={slots} entries={entries} role="STUDENT" />
                    ) : (
                        <div className="text-center p-12 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                             <p className="text-lg text-gray-500 dark:text-gray-400">No timetable found for your class.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentTimetable;
