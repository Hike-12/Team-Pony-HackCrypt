import React, { useState, useEffect, useContext } from 'react';
import { TeacherContext } from '../../context/TeacherContext';
import TimetableGrid from '../../components/TimetableGrid';
import { TeacherSidebar } from '../../components/teacher/TeacherSidebar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, List } from 'lucide-react';

const DayView = ({ slots, entries }) => {
    const today = new Date().getDay(); // 0 is Sunday
    // Adjust logic if your database uses 1=Mon, 7=Sun
    // Standard JS: 0=Sun, 1=Mon...6=Sat.
    // DB (TimetableEntry): 1=Mon...7=Sun (likely, checking entry.day_of_week)
    
    // Convert JS day to 1-based Mon-Sun
    const currentDay = today === 0 ? 7 : today;
    
    const todayEntries = entries.filter(e => e.day_of_week === currentDay);
    
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, 70%, 95%)`;
    };

    if (todayEntries.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center p-16 bg-card rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-2xl">☕</span>
                </div>
                <h3 className="text-lg font-medium text-foreground">No Classes Today</h3>
                <p className="text-muted-foreground mt-1">Enjoy your free time!</p>
            </div>
        );
    }

    // Sort by slot time
    todayEntries.sort((a, b) => {
        const slotA = a.slot_id?.sort_order || 0;
        const slotB = b.slot_id?.sort_order || 0;
        return slotA - slotB;
    });

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
             {todayEntries.map((entry) => {
                 const slot = entry.slot_id;
                 const subjectColor = stringToColor(entry.teacher_subject_id?.subject_id?.name || 'Subject');
                 
                 return (
                     <div key={entry._id} className="flex gap-4 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                         <div 
                            className="absolute left-0 top-0 bottom-0 w-1.5" 
                            style={{ backgroundColor: subjectColor.replace('95%', '60%') }}
                         />
                         
                         <div className="flex-shrink-0 w-24 flex flex-col justify-center items-center border-r pr-4">
                             <span className="text-lg font-bold">{slot.start_time}</span>
                             <span className="text-xs text-muted-foreground">to</span>
                             <span className="text-sm font-medium text-muted-foreground">{slot.end_time}</span>
                         </div>
                         
                         <div className="flex-grow pl-2">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <h3 className="text-xl font-bold text-foreground">{entry.teacher_subject_id?.subject_id?.name || 'Subject'}</h3>
                                     <p className="text-sm text-primary font-medium mt-1">
                                         {entry.teacher_subject_id?.class_id?.name} {entry.teacher_subject_id?.class_id?.division}
                                     </p>
                                 </div>
                                 <div className="text-right">
                                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                         {entry.session_type}
                                     </span>
                                     <p className="text-sm text-muted-foreground mt-2 flex items-center justify-end gap-1">
                                         📍 {entry.room_label}
                                     </p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 );
             })}
        </div>
    );
};


const TeacherSchedule = () => {
    const { teacher } = useContext(TeacherContext);
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'

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

    return (
        <div className="flex min-h-screen w-full">
            <TeacherSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="flex flex-col justify-center">
                        <h1 className="text-lg font-semibold">My Schedule</h1>
                        <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={viewMode === 'day' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setViewMode('day')}
                            className="text-xs"
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Today
                        </Button>
                        <Button 
                            variant={viewMode === 'week' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setViewMode('week')}
                            className="text-xs"
                        >
                            <List className="w-4 h-4 mr-2" />
                            Weekly
                        </Button>
                    </div>
                </header>
                <div className="p-8">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        viewMode === 'day' ? (
                            <DayView slots={slots} entries={entries} />
                        ) : (
                            <div className="bg-card rounded-xl border shadow-sm p-1 overflow-hidden">
                                <TimetableGrid slots={slots} entries={entries} role="TEACHER" />
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeacherSchedule;
