import React, { useState, useEffect, useContext } from 'react';
import { StudentSidebar } from '../../components/student/StudentSidebar';
import { StudentContext } from '../../context/StudentContext';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, MapPin, User, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getColorClass = (sessionType) => {
    const colors = {
        'LECTURE': 'from-blue-500 to-blue-600 border-blue-400/20 text-white',
        'LAB': 'from-green-500 to-green-600 border-green-400/20 text-white',
        'TUTORIAL': 'from-purple-500 to-purple-600 border-purple-400/20 text-white',
        'Online': 'from-orange-500 to-orange-600 border-orange-400/20 text-white'
    };
    return colors[sessionType] || 'from-gray-500 to-gray-600 border-gray-400/20 text-white';
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

    return (
        <div className="flex min-h-screen w-full bg-background">
            <StudentSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm shadow-sm"
                >
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Calendar className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-foreground">My Timetable</h1>
                                </div>
                                <p className="text-sm text-muted-foreground ml-13">
                                    Your weekly class schedule
                                </p>
                            </div>

                            {/* Week Navigation */}
                            <div className="flex items-center gap-3 bg-card border rounded-lg p-1 shadow-sm">
                                <button
                                    onClick={() => navigateWeek(-1)}
                                    className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    aria-label="Previous week"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="px-4 py-2 min-w-45 text-center">
                                    <p className="text-sm font-medium text-foreground">{weekInfo}</p>
                                </div>
                                <button
                                    onClick={() => navigateWeek(1)}
                                    className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    aria-label="Next week"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.header>

                <div className="p-8">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center p-20"
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-muted-foreground font-medium">Loading your timetable...</p>
                            </div>
                        </motion.div>
                    ) : entries.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl border bg-card shadow-sm overflow-hidden"
                        >
                            {/* Timetable Grid */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-muted/30 border-b">
                                            <th className="px-6 py-5 text-left text-sm font-semibold text-muted-foreground w-48 border-r bg-muted/10">
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
                                                        "px-4 py-5 text-center min-w-45 border-r last:border-r-0 transition-colors",
                                                        isToday ? "bg-primary/5" : "bg-transparent"
                                                    )}>
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span className={cn(
                                                                "text-sm font-semibold",
                                                                isToday ? "text-primary" : "text-foreground"
                                                            )}>{day}</span>
                                                            <span className={cn(
                                                                "text-xs px-2 py-0.5 rounded-full",
                                                                isToday ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground bg-muted"
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
                                            <tr key={slot._id} className="hover:bg-muted/5 transition-colors group">
                                                <td className="px-6 py-4 bg-muted/5 border-r border-b-0">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                                                            {slot.slot_name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            {slot.start_time} - {slot.end_time}
                                                        </div>
                                                    </div>
                                                </td>
                                                {weekDays.map((day, dayIndex) => {
                                                    const dayEntries = getEntriesForDayAndSlot(dayIndex, slot._id);
                                                    const date = addDays(currentWeekStart, dayIndex);
                                                    const isToday = format(new Date(), 'dd/MM') === format(date, 'dd/MM');

                                                    return (
                                                        <td key={`${day}-${slot._id}`} className={cn(
                                                            "px-3 py-3 border-r last:border-r-0 align-top h-32",
                                                            isToday ? "bg-primary/2" : ""
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
                                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                transition={{ delay: (slotIndex * 0.05) + (dayIndex * 0.02) }}
                                                                                className={cn(
                                                                                    "h-full w-full rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group/card bg-linear-to-br",
                                                                                    getColorClass(sessionType)
                                                                                )}
                                                                            >
                                                                                <div className="relative z-10">
                                                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                                                        <h4 className="font-bold text-sm leading-tight line-clamp-2 drop-shadow-sm">
                                                                                            {subjectName}
                                                                                        </h4>
                                                                                    </div>
                                                                                    {subjectCode && (
                                                                                        <div className="text-[10px] font-medium opacity-90 tracking-wide mb-3">
                                                                                            {subjectCode}
                                                                                        </div>
                                                                                    )}

                                                                                    <div className="space-y-1.5 mt-auto">
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

                                                                                <div className="absolute top-2 right-2 z-10">
                                                                                    <span className="text-[9px] font-black uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10 text-white">
                                                                                        {sessionType.substring(0, 3)}
                                                                                    </span>
                                                                                </div>

                                                                                {/* Decorative Elements */}
                                                                                <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover/card:bg-white/20 transition-all duration-300" />
                                                                                <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-black/10 rounded-full blur-xl" />
                                                                            </motion.div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-muted/30 group-hover:border-muted/50 transition-colors">
                                                                    <span className="text-xs text-muted-foreground/30 font-medium">Free Slot</span>
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
                            className="flex flex-col items-center justify-center min-h-100 bg-card/50 rounded-2xl border border-dashed border-muted-foreground/20 backdrop-blur-sm"
                        >
                            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6 shadow-inner">
                                <Calendar className="w-10 h-10 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No Classes Scheduled</h3>
                            <p className="text-muted-foreground text-center max-w-md px-4">
                                Your timetable is currently empty. Check back later or contact your administrator for more information.
                            </p>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentTimetable;
