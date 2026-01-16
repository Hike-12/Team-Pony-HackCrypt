import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TimetableCalendar from '@/components/admin/TimetableCalendar';
import FileUploadDialog from '@/components/admin/FileUploadDialog';
import AddEntryDialog from '@/components/admin/AddEntryDialog';
import { Calendar, Upload, Plus, Settings } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const AdminDashboard = () => {
  const [view, setView] = useState('week'); // week, month, day
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

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
        if (classesData.data.length > 0) {
          setSelectedClass(classesData.data[0]._id);
        }
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

  const selectedClassData = classes.find(c => c._id === selectedClass);

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster position="top-right" richColors />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timetable Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage class schedules, slots, and entries
            </p>
          </div>
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
        </div>

        {/* Class Selector & View Controls */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="text-sm font-medium text-foreground">
                Select Class:
              </label>
              <select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} - {cls.division} (Batch {cls.batch_year})
                  </option>
                ))}
              </select>
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
        {selectedClass && (
          <TimetableCalendar
            view={view}
            classData={selectedClassData}
            slots={slots}
            entries={entries}
            loading={loading}
            onEntryUpdate={handleEntryUpdate}
            onEntryDelete={handleEntryDelete}
          />
        )}

        {!selectedClass && (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Class Selected
            </h3>
            <p className="text-muted-foreground">
              Please select a class to view its timetable
            </p>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <FileUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={handleFileUploadSuccess}
        selectedClass={selectedClass}
      />

      <AddEntryDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleEntryAdded}
        selectedClass={selectedClass}
        slots={slots}
      />
    </div>
  );
};

export default AdminDashboard;
