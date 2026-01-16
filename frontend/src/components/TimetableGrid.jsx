import React from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Pastel colors are better for backgrounds
const getPastelColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 90%)`;
};

const TimetableGrid = ({ slots, entries, role }) => {
    // Organize entries by Day -> SlotId
    const schedule = {};
    entries.forEach(entry => {
        if (!schedule[entry.day_of_week]) schedule[entry.day_of_week] = {};
        const slotId = entry.slot_id._id || entry.slot_id; // Handle populated/unpopulated
        schedule[entry.day_of_week][slotId] = entry;
    });

    const sortedSlots = [...slots].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Time / Day
                        </th>
                        {DAYS.map((day, index) => (
                            <th key={day} className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
                    {sortedSlots.map((slot) => (
                        <tr key={slot._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white border-r dark:border-gray-800 bg-gray-50/30">
                                <div className="flex flex-col">
                                    <span className="font-bold">{slot.slot_name}</span>
                                    <span className="text-gray-500 text-xs dark:text-gray-500">{slot.start_time} - {slot.end_time}</span>
                                </div>
                            </td>
                            {DAYS.map((day, dayIndex) => {
                                const entry = schedule[dayIndex + 1]?.[slot._id];
                                return (
                                    <td key={`${day}-${slot._id}`} className="px-2 py-2 h-24 align-top w-40">
                                        {entry ? (
                                            <div 
                                                className="h-full w-full rounded-lg p-3 shadow-sm border border-black/5 hover:shadow-md transition-shadow relative overflow-hidden group"
                                                style={{ 
                                                    backgroundColor: getPastelColor(entry.teacher_subject_id?.subject_id?.name || 'Subject'),
                                                    borderLeft: `4px solid ${stringToColor(entry.teacher_subject_id?.subject_id?.name || 'Subject')}`
                                                }}
                                            >
                                                <div className="font-bold text-gray-900 text-sm truncate" title={entry.teacher_subject_id?.subject_id?.name}>
                                                    {entry.teacher_subject_id?.subject_id?.name || 'Unknown Subject'}
                                                </div>
                                                <div className="text-xs text-gray-700 mt-1 font-medium">
                                                    {entry.session_type} • {entry.room_label}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-2 truncate">
                                                    {role === 'STUDENT' ? (
                                                        <>👨‍🏫 {entry.teacher_subject_id?.teacher_id?.full_name}</>
                                                    ) : (
                                                        <>🎓 {entry.teacher_subject_id?.class_id?.name} {entry.teacher_subject_id?.class_id?.division}</>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full w-full rounded-lg border-2 border-dashed border-gray-100 dark:border-gray-800"></div>
                                        )}
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
