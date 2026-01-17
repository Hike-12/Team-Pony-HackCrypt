import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TimetableCalendar from '@/components/admin/TimetableCalendar';
import FileUploadDialog from '@/components/admin/FileUploadDialog';
import AddEntryDialog from '@/components/admin/AddEntryDialog';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Calendar, Upload, Plus, Clock, ChevronLeft, ChevronRight, BookOpen, MapPin, User, GraduationCap } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';

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

const AdminTimetable = () => {
  const [view, setView] = useState('week');
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [timetableFilter, setTimetableFilter] = useState('with'); // 'with' or 'without'
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay(); // 0=Sun, 1=Mon
    return (day === 0 || day > 6) ? 0 : day - 1;
  });
  
  const isExpanded = useSidebarState();

  // Sort slots by order
  const sortedSlots = [...slots].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchEntries();
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classesRes, slotsRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/timetable/classes'),
        fetch('http://localhost:8000/api/admin/timetable/slots')
      ]); 

      const classesData = await classesRes.json();
      const slotsData = await slotsRes.json();

      if (classesData.success) {
        setClasses(classesData.data);
      }

      if (slotsData.success) {
        setSlots(slotsData.data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/admin/timetable/entries?class_id=${selectedClass}`
      );
      const data = await response.json();

      if (data.success) {
        setEntries(data.data);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to load timetable entries');
    } finally {
      setLoading(false);
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

  const handleFileUploadSuccess = () => {
    fetchEntries();
    setShowUploadDialog(false);
    toast.success('Timetable imported successfully!');
  };

  const handleEntryAdded = () => {
    fetchEntries();
    setShowAddDialog(false);
    toast.success('Entry added successfully!');
  };

  const handleEntryUpdate = async (entryId, updates) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/timetable/entries/${entryId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchEntries();
        toast.success('Entry updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    }
  };

  const handleEntryDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/timetable/entries/${entryId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        fetchEntries();
        toast.success('Entry deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  // Group classes by batch year and check timetable status
  const groupedClasses = classes.reduce((acc, cls) => {
    const year = cls.batch_year;
    if (!acc[year]) {
      acc[year] = { withTimetable: [], withoutTimetable: [] };
    }
    
    // Check if class has any timetable entries
    const hasTimetable = cls.has_timetable === true || (cls.entry_count && cls.entry_count > 0);
    
    if (hasTimetable) {
      acc[year].withTimetable.push(cls);
    } else {
      acc[year].withoutTimetable.push(cls);
    }
    
    return acc;
  }, {});

  // Sort years in descending order
  const sortedYears = Object.keys(groupedClasses).sort((a, b) => b - a);

  const selectedClassData = classes.find(c => c._id === selectedClass);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <Toaster position="top-right" richColors />
      
      <main className={cn(
        "flex-1 min-h-screen w-full transition-all duration-300 bg-background/50 pb-24 md:pb-8",
        isExpanded ? "ml-64" : "ml-20"
      )}>
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
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Manage Timetables</h1>
                </div>
                <p className="text-sm text-muted-foreground md:ml-13">
                  {selectedClass ? 'View and edit class schedule' : 'Select a class to manage timetable'}
                </p>
              </div>

              {/* Week Navigation - Show only when class selected */}
              {selectedClass && (
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
              )}
            </div>
          </div>
        </motion.header>

        <div className="p-4 md:p-8">
          {/* Action Buttons - Show only when class selected */}
          {selectedClass && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-6 justify-end"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </motion.div>
          )}

          {/* Class Selection by Batch Year */}
          {!selectedClass && (
            <div className="space-y-6">
              {/* Toggle Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={timetableFilter === 'with' ? 'default' : 'outline'}
                  onClick={() => setTimetableFilter('with')}
                  className="transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Classes with Timetables
                </Button>
                <Button
                  variant={timetableFilter === 'without' ? 'default' : 'outline'}
                  onClick={() => setTimetableFilter('without')}
                  className="transition-all duration-200"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Classes without Timetables
                </Button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map(j => (
                          <Card key={`${i}-${j}`} className="p-4 animate-pulse">
                            <div className="space-y-3">
                              <div className="h-6 bg-muted rounded" />
                              <div className="h-4 bg-muted rounded w-3/4" />
                              <div className="h-4 bg-muted rounded w-1/2" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Classes with Timetable */}
              {!loading && timetableFilter === 'with' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <h2 className="text-xl font-semibold text-foreground">Classes with Timetable</h2>
                  </div>
                  
                  {sortedYears.length > 0 ? (
                    sortedYears.map(year => {
                      const withTimetable = groupedClasses[year].withTimetable;
                      if (withTimetable.length === 0) return null;
                      
                      return (
                        <div key={`with-${year}`}>
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            Batch {year}
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {withTimetable.map(cls => (
                              <Card
                                key={cls._id}
                                onClick={() => setSelectedClass(cls._id)}
                                className="p-4 cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-200 group"
                              >
                                <div className="text-center">
                                  <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {cls.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {cls.division}
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-2">
                                    <Clock className="w-3 h-3 text-green-500" />
                                    <span className="text-xs text-green-500">Active</span>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <Card className="p-8 text-center">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No classes with timetables yet</p>
                    </Card>
                  )}
                </div>
              )}

              {/* Classes without Timetable */}
              {!loading && timetableFilter === 'without' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-semibold text-foreground">Classes without Timetable</h2>
                  </div>
                  
                  {sortedYears.length > 0 ? (
                    sortedYears.map(year => {
                      const withoutTimetable = groupedClasses[year].withoutTimetable;
                      if (withoutTimetable.length === 0) return null;
                      
                      return (
                        <div key={`without-${year}`}>
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            Batch {year}
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {withoutTimetable.map(cls => (
                              <Card
                                key={cls._id}
                                onClick={() => setSelectedClass(cls._id)}
                                className="p-4 cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-200 group"
                              >
                                <div className="text-center">
                                  <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {cls.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {cls.division}
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-2">
                                    <Clock className="w-3 h-3 text-orange-500" />
                                    <span className="text-xs text-orange-500">Pending</span>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <Card className="p-8 text-center">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No classes without timetables</p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timetable View */}
          {selectedClass && (
            <>
              {/* Back Button and Class Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClass(null)}
                      >
                        ← Back
                      </Button>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {selectedClassData?.name} - {selectedClassData?.division}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Batch {selectedClassData?.batch_year}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

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
                      
                      if (dayEntries.length === 0) return null;

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
                        <p className="font-medium">No classes scheduled for this day.</p>
                        <p className="text-sm">Use the Import or Add Entry buttons above.</p>
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
                                              "h-full w-full rounded-xl p-3 border shadow-xs transition-all duration-200 flex flex-col justify-between group/card hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                                              getColorClass(sessionType)
                                            )}
                                            onClick={() => {
                                              // Admin can click to edit
                                              const confirmEdit = confirm(`Edit this entry?\n\nSubject: ${subjectName}\nTeacher: ${teacherName}\nRoom: ${roomNo}`);
                                              if (confirmEdit) {
                                                // Could open edit dialog here, for now just show alert
                                                toast.info('Click the edit button in the calendar view or use Update/Delete actions');
                                              }
                                            }}
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
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Timetable Entries</h3>
                  <p className="text-muted-foreground max-w-sm mb-4">
                    This class doesn't have any timetable entries yet. Use the Import or Add Entry buttons to get started.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {classes.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Classes Found
              </h3>
              <p className="text-muted-foreground">
                Please add classes first to manage timetables
              </p>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <FileUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onSuccess={handleFileUploadSuccess}
          selectedClass={selectedClass}
        />

        <AddEntryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={handleEntryAdded}
          selectedClass={selectedClass}
          slots={slots}
        />
      </main>
    </div>
  );
};

export default AdminTimetable;
