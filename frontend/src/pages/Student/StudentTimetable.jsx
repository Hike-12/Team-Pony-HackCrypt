import React, { useState, useEffect, useContext } from 'react';
import { StudentSidebar } from '../../components/student/StudentSidebar';
import { StudentContext } from '../../context/StudentContext';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, MapPin, User, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getColorClass = (sessionType) => {
    const styles = {
        'LECTURE': 'bg-sky-50/80 border-sky-200 text-sky-900 hover:bg-sky-100 hover:border-sky-300',
        'LAB': 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300',
        'TUTORIAL': 'bg-violet-50/80 border-violet-200 text-violet-900 hover:bg-violet-100 hover:border-violet-300',
        'Online': 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
    };
    return styles[sessionType] || 'bg-slate-50/80 border-slate-200 text-slate-900 hover:bg-slate-100 hover:border-slate-300';
};

const getSessionBadgeStyle = (sessionType) => {
    const styles = {
        'LECTURE': 'bg-sky-200/50 text-sky-800 border-sky-200',
        'LAB': 'bg-emerald-200/50 text-emerald-800 border-emerald-200',
        'TUTORIAL': 'bg-violet-200/50 text-violet-800 border-violet-200',
        'Online': 'bg-amber-200/50 text-amber-800 border-amber-200'
    };
    return styles[sessionType] || 'bg-slate-200/50 text-slate-800 border-slate-200';
};

const StudentTimetable = () => {
    const { student } = useContext(StudentContext);
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    // Sort slots by order
    const sortedSlots = [...slots].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!student) return;

            try {
                const studentId = student.student_id || student._id || student.id;

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${studentId}`, {
                    credentials: 'include'
                });

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
                toast.error("Failed to load student profile");
            }
        };

        fetchStudentData();
    }, [student]);

    const fetchTimetable = async (cid) => {
        try {
            const [slotsRes, entriesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/slots`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/timetable/entries?class_id=${cid}`, { credentials: 'include' })
            ]);

            const slotsData = await slotsRes.json();
            const entriesData = await entriesRes.json();

            if (slotsData.success) setSlots(slotsData.data);
            if (entriesData.success) setEntries(entriesData.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load timetable", error);
            setLoading(false);
            toast.error("Failed to load timetable data");
        }
    };

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekEnd = addDays(currentWeekStart, 5); // Display mon-sat
    const weekInfo = `${format(currentWeekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy')}`;

    const getEntriesForDayAndSlot = (dayIndex, slotId) => {
        // Day index in map is 0-5, but in DB day_of_week is likely 1-7 (Mon=1)
        const dbDay = dayIndex + 1;

        return entries.filter(entry => {
            const entrySlotId = entry.slot_id?._id || entry.slot_id;
            return entry.day_of_week === dbDay && entrySlotId === slotId;
        });
    };

    const navigateWeek = (direction) => {
        setCurrentWeekStart(prev => addDays(prev, direction * 7));
    };

    const [selectedDay, setSelectedDay] = useState(() => {
        const day = new Date().getDay(); // 0=Sun, 1=Mon
        return (day === 0 || day > 6) ? 0 : day - 1;
    });

    useEffect(() => {
        // Sync selected day with day tabs if needed, or keep persistent
    }, []);

    return (
        <div className="flex min-h-screen w-full bg-background">
            <StudentSidebar />
            <main className="flex-1 min-h-screen w-full transition-all duration-300 md:ml-64 ml-0 bg-background/50 pb-24 md:pb-8">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/60"
                >
                    <div className="px-4 md:px-8 py-4 md:py-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My Timetable</h1>
                                </div>
                                <p className="text-sm text-muted-foreground md:ml-13">
                                    Your weekly class schedule
                                </p>
                            </div>

                            {/* Week Navigation */}
                            <div className="flex items-center gap-2 bg-secondary/50 border rounded-lg p-1 shadow-sm self-start md:self-auto">
                                <button
                                    onClick={() => navigateWeek(-1)}
                                    className="p-2 rounded-md hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
                                    aria-label="Previous week"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="px-4 py-1 min-w-[140px] text-center font-medium text-sm tabular-nums">
                                    {weekInfo}
                                </div>
                                <button
                                    onClick={() => navigateWeek(1)}
                                    className="p-2 rounded-md hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
                                    aria-label="Next week"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.header>

                <div className="p-4 md:p-8">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center p-20"
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <p className="text-muted-foreground font-medium text-sm">Loading schedule...</p>
                            </div>
                        </motion.div>
                    ) : entries.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Mobile Day Tabs */}
                            <div className="md:hidden mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                                <div className="flex gap-2 min-w-max">
                                    {weekDays.map((day, index) => {
                                        const isSelected = selectedDay === index;
                                        const date = addDays(currentWeekStart, index);
                                        const isToday = format(new Date(), 'dd/MM') === format(date, 'dd/MM');
                                        
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDay(index)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center min-w-[4.5rem] py-3 rounded-2xl border transition-all duration-300",
                                                    isSelected 
                                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105" 
                                                        : "bg-card border-border text-muted-foreground hover:bg-secondary/50"
                                                )}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{day.slice(0, 3)}</span>
                                                <span className={cn("text-lg font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                                                    {format(date, 'dd')}
                                                </span>
                                                {isToday && (
                                                     <span className="w-1 h-1 rounded-full bg-current mt-1 opacity-60" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mobile View: Vertical Cards */}
                            <div className="md:hidden space-y-4">
                                {sortedSlots.map((slot) => {
                                    const dayEntries = getEntriesForDayAndSlot(selectedDay, slot._id);
                                    
                                    if (dayEntries.length === 0) return null; // Hide empty slots on mobile for cleaner look

                                    return (
                                        <div key={slot._id} className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    {slot.start_time} - {slot.end_time}
                                                </span>
                                            </div>

                                            {dayEntries.map(entry => {
                                                 const subjectName = entry.teacher_subject_id?.subject_id?.name || 'Subject';
                                                 const subjectCode = entry.teacher_subject_id?.subject_id?.code;
                                                 const teacherName = entry.teacher_subject_id?.teacher_id?.full_name || 'Teacher';
                                                 const roomNo = entry.room_label || entry.room || 'TBA';
                                                 const sessionType = entry.session_type || 'LECTURE';

                                                return (
                                                    <motion.div
                                                        key={entry._id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={cn(
                                                            "p-4 rounded-2xl border shadow-sm flex flex-col gap-3",
                                                            getColorClass(sessionType)
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-bold text-lg leading-tight">{subjectName}</h3>
                                                                {subjectCode && <p className="text-xs opacity-80 font-medium mt-1">{subjectCode}</p>}
                                                            </div>
                                                            <span className={cn(
                                                                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border",
                                                                getSessionBadgeStyle(sessionType)
                                                            )}>
                                                                {sessionType}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm font-medium opacity-90 pt-2 border-t border-black/5 dark:border-white/5 mt-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <User className="w-4 h-4" />
                                                                <span>{teacherName}</span>
                                                            </div>
                                                            {roomNo && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <MapPin className="w-4 h-4" />
                                                                    <span>Room {roomNo}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}

                                {sortedSlots.every(slot => getEntriesForDayAndSlot(selectedDay, slot._id).length === 0) && (
                                     <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                                        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                        <p className="font-medium">No classes scheduled for today.</p>
                                        <p className="text-sm">Enjoy your free time!</p>
                                     </div>
                                )}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
                                <table className="w-full min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-secondary/30 border-b">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground w-40 border-r border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Time Slot
                                                </div>
                                            </th>
                                            {weekDays.map((day, index) => {
                                                const date = addDays(currentWeekStart, index);
                                                const isToday = format(new Date(), 'dd/MM') === format(date, 'dd/MM');

                                                return (
                                                    <th key={day} className={cn(
                                                        "px-4 py-4 text-center min-w-[180px] border-r border-border/50 last:border-r-0 transition-colors",
                                                        isToday ? "bg-primary/5" : "bg-transparent"
                                                    )}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={cn(
                                                                "text-sm font-semibold",
                                                                isToday ? "text-primary" : "text-foreground"
                                                            )}>{day}</span>
                                                            <span className={cn(
                                                                "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold",
                                                                isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground bg-secondary"
                                                            )}>
                                                                {format(date, 'dd MMM')}
                                                            </span>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {sortedSlots.map((slot, slotIndex) => (
                                            <tr key={slot._id} className="hover:bg-secondary/20 transition-colors group">
                                                <td className="px-6 py-4 bg-secondary/10 border-r border-border/50 border-b-0 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                                                            {slot.slot_name}
                                                        </span>
                                                        <div className="text-xs text-muted-foreground font-mono bg-background/50 px-1.5 py-0.5 rounded w-fit">
                                                            {slot.start_time} - {slot.end_time}
                                                        </div>
                                                    </div>
                                                </td>
                                                {weekDays.map((day, dayIndex) => {
                                                    const dayEntries = getEntriesForDayAndSlot(dayIndex, slot._id);
                                                    const date = addDays(currentWeekStart, dayIndex);
                                                    const isToday = format(new Date(), 'dd/MM') === format(date, 'dd/MM');
                                                    /* ...existing desktop cell rendering... */
                                                    return (
                                                        <td key={`${day}-${slot._id}`} className={cn(
                                                            "px-3 py-3 border-r border-border/50 last:border-r-0 align-top h-36 md:h-32 transition-colors",
                                                            isToday ? "bg-primary/[0.02]" : ""
                                                        )}>
                                                            {dayEntries.length > 0 ? (
                                                                <div className="space-y-2 h-full">
                                                                    {dayEntries.map((entry, idx) => {
                                                                        const subjectName = entry.teacher_subject_id?.subject_id?.name || 'Subject';
                                                                        const subjectCode = entry.teacher_subject_id?.subject_id?.code;
                                                                        const teacherName = entry.teacher_subject_id?.teacher_id?.full_name || 'Teacher';
                                                                        const roomNo = entry.room_label || entry.room || 'TBA';
                                                                        const sessionType = entry.session_type || 'LECTURE';

                                                                        return (
                                                                            <motion.div
                                                                                key={entry._id}
                                                                                initial={{ opacity: 0, scale: 0.98 }}
                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                transition={{ delay: (slotIndex * 0.05) + (dayIndex * 0.02) }}
                                                                                className={cn(
                                                                                    "h-full w-full rounded-xl p-3 border shadow-xs transition-all duration-200 flex flex-col justify-between group/card hover:shadow-md hover:-translate-y-0.5",
                                                                                    getColorClass(sessionType)
                                                                                )}
                                                                            >
                                                                                <div className="space-y-2">
                                                                                    <div className="flex items-start justify-between gap-2">
                                                                                        <h4 className="font-bold text-sm leading-tight line-clamp-2">
                                                                                            {subjectName}
                                                                                        </h4>
                                                                                        <span className={cn(
                                                                                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                                                                            getSessionBadgeStyle(sessionType)
                                                                                        )}>
                                                                                            {sessionType.slice(0, 3)}
                                                                                        </span>
                                                                                    </div>

                                                                                    <div className="flex flex-col gap-1">
                                                                                        {subjectCode && (
                                                                                            <div className="text-[10px] font-medium opacity-80 flex items-center gap-1.5">
                                                                                                <BookOpen className="w-3 h-3" />
                                                                                                {subjectCode}
                                                                                            </div>
                                                                                        )}

                                                                                        <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                                                                                            <User className="w-3 h-3 shrink-0" />
                                                                                            <span className="truncate">{teacherName}</span>
                                                                                        </div>

                                                                                        {roomNo && (
                                                                                            <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                                                                                                <MapPin className="w-3 h-3 shrink-0" />
                                                                                                <span>Room {roomNo}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-border/40 group-hover:border-border/60 transition-colors bg-secondary/5">
                                                                    <span className="text-[10px] text-muted-foreground/30 font-medium uppercase tracking-widest">Free</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center min-h-[400px] bg-card rounded-2xl border border-dashed text-center p-8"
                        >
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No Classes Scheduled</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Your timetable for this week is empty. Enjoy your free time!
                            </p>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentTimetable;
