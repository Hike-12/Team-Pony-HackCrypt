import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TimetableCalendar from '@/components/admin/TimetableCalendar';
import FileUploadDialog from '@/components/admin/FileUploadDialog';
import AddEntryDialog from '@/components/admin/AddEntryDialog';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Calendar, Upload, Plus, Clock } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';

const AdminTimetable = () => {
  const [view, setView] = useState('week');
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const isExpanded = useSidebarState();

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
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar />
      <Toaster position="top-right" richColors />
      
      <main className={cn(
        "flex-1 p-6 transition-all duration-300",
        isExpanded ? "ml-64" : "ml-20"
      )}>
        <div className={cn(
          "mx-auto space-y-6 transition-all duration-300",
          isExpanded ? "max-w-7xl" : "max-w-full"
        )}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Timetable Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage class schedules and timetable entries
              </p>
            </div>
            {selectedClass && (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>

          {/* Class Selection by Batch Year */}
          {!selectedClass && (
            <div className="space-y-8">
              {/* Classes with Timetable */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-foreground">Classes with Timetable</h2>
                </div>
                
                {sortedYears.map(year => {
                  const withTimetable = groupedClasses[year].withTimetable;
                  if (withTimetable.length === 0) return null;
                  
                  return (
                    <div key={`with-${year}`} className="mb-6">
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
                })}

                {classes.length > 0 && sortedYears.every(year => groupedClasses[year].withTimetable.length === 0) && (
                  <Card className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No classes with timetables yet</p>
                  </Card>
                )}
              </div>

              {/* Classes without Timetable */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-semibold text-foreground">Classes without Timetable</h2>
                </div>
                
                {sortedYears.map(year => {
                  const withoutTimetable = groupedClasses[year].withoutTimetable;
                  if (withoutTimetable.length === 0) return null;
                  
                  return (
                    <div key={`without-${year}`} className="mb-6">
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
                })}
              </div>
            </div>
          )}

          {/* Timetable View */}
          {selectedClass && (
            <>
              {/* Back Button and Class Info */}
              <Card className="p-4">
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant={view === 'day' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('day')}
                    >
                      Day
                    </Button>
                    <Button
                      variant={view === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('week')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={view === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('month')}
                    >
                      Month
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Timetable Calendar */}
              <TimetableCalendar
                view={view}
                classData={selectedClassData}
                slots={slots}
                entries={entries}
                loading={loading}
                onEntryUpdate={handleEntryUpdate}
                onEntryDelete={handleEntryDelete}
              />
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
