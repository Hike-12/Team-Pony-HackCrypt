import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import TimetableCalendar from '@/components/admin/TimetableCalendar';
import FileUploadDialog from '@/components/admin/FileUploadDialog';
import AddEntryDialog from '@/components/admin/AddEntryDialog';
import { Calendar, Upload, Plus, Settings, Users, GraduationCap, BookOpen, Bell, TrendingUp, Activity, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// Stat Card Component
const StatCard = ({ title, value, description, icon: Icon, color, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        {value}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-500 font-medium">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
)

// Quick Action Card
const QuickActionCard = ({ title, description, icon: Icon, color }) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

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
            {/* Recent Activity */}
            <div className="w-full sm:w-1/2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system events and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'New attendance session created', user: 'Prof. Smith', time: '5 minutes ago', type: 'success' },
                      { action: 'Student enrollment approved', user: 'Admin Team', time: '15 minutes ago', type: 'info' },
                      { action: 'Attendance report generated', user: 'System', time: '1 hour ago', type: 'success' },
                      { action: 'Edit request pending review', user: 'John Doe', time: '2 hours ago', type: 'warning' },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                        <div className={`h-2 w-2 rounded-full mt-2 ${
                          activity.type === 'success' ? 'bg-green-500' :
                          activity.type === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
