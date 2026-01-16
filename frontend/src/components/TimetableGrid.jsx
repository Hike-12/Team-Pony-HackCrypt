import React from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper for pastel colors
const getSubjectColor = (subjectName) => {
    if (!subjectName) return 'hsl(0, 0%, 95%)'; // Gray for empty
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
        hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360; 
    // Pastel: Saturation ~70%, Lightness ~93%
    return `hsl(${h}, 70%, 93%)`;
};

const getBorderColor = (subjectName) => {
     if (!subjectName) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
        hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360; 
    // Darker border for definition
    return `hsl(${h}, 60%, 80%)`;
}

const TimetableGrid = ({ slots, entries, role }) => {
    const today = new Date();
    // Assuming week starts on Monday (1). standard JS startOfWeek defaults to Sunday (0).
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    
    // Generate days with dates
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(startOfCurrentWeek, i);
        return {
            name: format(date, 'EEEE'), // Monday
            short: format(date, 'EEE'), // Mon
            dateStr: format(date, 'dd/MM'), // 16/01
            dayIndex: i + 1 // 1=Mon, 7=Sun to match DB
        };
    });

    // Organize entries
    const schedule = {};
    entries.forEach(entry => {
        const d = entry.day_of_week; 
        // Handle both populated and unpopulated slot_id
        const s = entry.slot_id?._id || entry.slot_id;
        if (!schedule[d]) schedule[d] = {};
        schedule[d][s] = entry;
    });

    // Sort slots
    const sortedSlots = [...slots].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden select-none">
            {/* Header */}
            <div className="grid grid-cols-8 divide-x divide-border border-b bg-muted/30 text-center">
                <div className="p-4 flex items-center justify-center font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                    Time
                </div>
                {weekDays.map((day) => (
                    <div key={day.dayIndex} className={cn("p-3 flex flex-col justify-center items-center min-w-[100px]", 
                        // Highlight today
                        format(today, 'dd/MM') === day.dateStr && "bg-primary/5"
                    )}>
                        <span className="text-sm font-bold text-foreground">{day.name}</span>
                        <span className="text-xs text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded-full mt-1">
                            {day.dateStr}
                        </span>
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="divide-y divide-border">
                {sortedSlots.map((slot) => (
                    <div key={slot._id} className="grid grid-cols-8 divide-x divide-border min-h-[120px]">
                        {/* Time Column */}
                        <div className="p-3 flex flex-col justify-center items-center text-xs text-muted-foreground font-medium bg-muted/5">
                            <span className="text-sm font-bold text-foreground/80">{slot.start_time}</span>
                            <div className="h-6 w-px bg-border my-1"></div>
                            <span className="text-sm font-bold text-muted-foreground">{slot.end_time}</span>
                        </div>

                        {/* Days Columns */}
                        {weekDays.map((day) => {
                            const entry = schedule[day.dayIndex]?.[slot._id];
                            
                            // If no entry, render empty cell
                            if (!entry) return <div key={day.dayIndex} className="bg-card/20 hover:bg-muted/10 transition-colors" />;

                            const subjectName = entry.teacher_subject_id?.subject_id?.name || 'Subject';
                            const bgColor = getSubjectColor(subjectName);
                            const borderColor = getBorderColor(subjectName);

                            return (
                                <div key={day.dayIndex} className="p-1 relative group bg-card/20">
                                    <div 
                                        className="h-full w-full rounded-lg p-2.5 text-xs flex flex-col gap-1.5 border hover:shadow-md transition-all duration-200 cursor-pointer"
                                        style={{ 
                                            backgroundColor: bgColor,
                                            borderColor: borderColor
                                        }}
                                    >
                                        <div className="font-bold text-foreground text-sm leading-tight line-clamp-2" title={subjectName}>
                                            {subjectName}
                                        </div>
                                        
                                        <div className="mt-auto space-y-1">
                                            {/* Role Based Details */}
                                            {role === 'STUDENT' ? (
                                                <div className="flex items-center gap-1.5 opacity-80 text-foreground/90">
                                                    <span className="text-[10px] w-4 h-4 rounded-full bg-white/50 flex items-center justify-center">👨‍🏫</span>
                                                    <span className="truncate font-medium">
                                                        {entry.teacher_subject_id?.teacher_id?.full_name?.split(' ')[0] || 'Teacher'}
                                                    </span>
                                                </div>
                                            ) : (
                                                 <div className="flex items-center gap-1.5 opacity-80 text-foreground/90">
                                                    <span className="text-[10px] w-4 h-4 rounded-full bg-white/50 flex items-center justify-center">🎓</span>
                                                    <span className="truncate font-medium">
                                                        {entry.class_id?.name || entry.teacher_subject_id?.class_id?.name} {entry.class_id?.division || entry.teacher_subject_id?.class_id?.division}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between pt-1 border-t border-black/5 mt-1">
                                                <span className="font-semibold text-[10px] uppercase tracking-wider opacity-70 bg-white/40 px-1.5 py-0.5 rounded">{entry.room_label}</span>
                                                <span className="font-semibold text-[10px] opacity-70">{entry.session_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimetableGrid;
