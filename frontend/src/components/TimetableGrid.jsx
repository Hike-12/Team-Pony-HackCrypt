import React from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { MapPin, User, GraduationCap } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getColorClass = (sessionType) => {
  const colors = {
    'LECTURE': 'from-blue-500 to-blue-600',
    'LAB': 'from-green-500 to-green-600',
    'TUTORIAL': 'from-purple-500 to-purple-600',
    'Online': 'from-orange-500 to-orange-600'
  };
  return colors[sessionType] || 'from-gray-500 to-gray-600';
};

const TimetableGrid = ({ slots, entries, role }) => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    
    // Organize entries
    const schedule = {};
    entries.forEach(entry => {
        const d = entry.day_of_week;
        const s = entry.slot_id?._id || entry.slot_id;
        if (!schedule[d]) schedule[d] = {};
        schedule[d][s] = entry;
    });

    const sortedSlots = [...slots].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full divide-y divide-border">
                <thead className="bg-muted/40 divide-x divide-border">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground w-40">
                            Time / Day
                        </th>
                        {DAYS.map((day, idx) => {
                            const date = addDays(startOfCurrentWeek, idx);
                            const dateStr = format(date, 'dd/MM');
                            const isToday = format(today, 'dd/MM') === dateStr;
                            
                            return (
                                <th 
                                    key={day} 
                                    className={cn(
                                        "px-4 py-4 text-center text-sm font-semibold divide-x divide-border",
                                        "border-l border-border",
                                        isToday && "bg-primary/10"
                                    )}
                                >
                                    <div className="text-foreground">{DAY_SHORT[idx]}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{day}</div>
                                    <div className="text-xs font-bold text-primary mt-1">{dateStr}</div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {sortedSlots.map((slot) => (
                        <tr key={slot._id} className="divide-x divide-border hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 bg-muted/5 text-sm font-semibold text-foreground whitespace-nowrap min-w-40">
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold">{slot.slot_name}</span>
                                    <span className="text-xs text-muted-foreground">{slot.start_time} - {slot.end_time}</span>
                                </div>
                            </td>
                            {DAYS.map((day, idx) => {
                                const dayNum = idx + 1; // 1=Mon, 7=Sun
                                const entry = schedule[dayNum]?.[slot._id];
                                const date = addDays(startOfCurrentWeek, idx);
                                const dateStr = format(date, 'dd/MM');
                                const isToday = format(today, 'dd/MM') === dateStr;

                                if (!entry) {
                                    return (
                                        <td 
                                            key={`${day}-empty`} 
                                            className={cn(
                                                "px-2 py-3 h-32 align-top border-l border-border",
                                                isToday && "bg-primary/5"
                                            )}
                                        />
                                    );
                                }

                                const subjectName = entry.teacher_subject_id?.subject_id?.name || 
                                    (role === 'TEACHER' ? entry.teacher_subject_id?.subject_id?.name : 'Subject');
                                const subjectCode = entry.teacher_subject_id?.subject_id?.code || '';
                                
                                const teacherName = entry.teacher_subject_id?.teacher_id?.full_name || 'Teacher';
                                const className = entry.teacher_subject_id?.class_id?.name || entry.class_id?.name || 'Class';
                                const division = entry.teacher_subject_id?.class_id?.division || entry.class_id?.division || '';
                                
                                const bgClass = getColorClass(entry.session_type);

                                return (
                                    <td 
                                        key={`${day}-${slot._id}`} 
                                        className={cn(
                                            "px-2 py-3 h-32 align-top border-l border-border",
                                            isToday && "bg-primary/5"
                                        )}
                                    >
                                        <div 
                                            className={cn(
                                                "h-full w-full rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 border border-white/20 relative overflow-hidden flex flex-col justify-between group bg-linear-to-br text-white",
                                                bgClass
                                            )}
                                        >
                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-bold text-sm leading-tight line-clamp-2" title={subjectName}>
                                                        {subjectName}
                                                    </h3>
                                                </div>
                                                {subjectCode && (
                                                    <div className="text-[10px] text-white/80 font-medium mt-0.5 tracking-wide">
                                                        {subjectCode}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative z-10 mt-auto space-y-1.5 pt-2">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                                                    {role === 'STUDENT' ? (
                                                        <>
                                                            <User className="h-3 w-3 opacity-75 shrink-0" />
                                                            <span className="truncate">{teacherName.split(' ')[0]}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <GraduationCap className="h-3 w-3 opacity-75 shrink-0" />
                                                            <span className="truncate">{className} {division}</span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                                                    <MapPin className="h-3 w-3 opacity-75 shrink-0" />
                                                    <span className="truncate">{entry.room_label}</span>
                                                </div>
                                            </div>

                                            <div className="absolute bottom-2 right-2 z-10">
                                                <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-sm backdrop-blur-sm border border-white/10 text-white/90">
                                                    {entry.session_type?.substring(0, 3)}
                                                </span>
                                            </div>

                                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-300" />
                                            <div className="absolute -left-4 -bottom-4 w-12 h-12 bg-black/5 rounded-full blur-xl" />
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimetableGrid;
