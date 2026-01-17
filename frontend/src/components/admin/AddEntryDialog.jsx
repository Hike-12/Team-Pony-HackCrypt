import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
];

const SESSION_TYPES = ['LECTURE', 'LAB', 'TUTORIAL', 'Online'];

const AddEntryDialog = ({ open, onOpenChange, onSuccess, selectedClass, slots }) => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const [subjects, setSubjects] = useState([]);
  
  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    day_of_week: 1,
    slot_id: '',
    room_label: '',
    session_type: 'LECTURE',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (open) {
      fetchTeachersAndSubjects();
    }
  }, [open]);

  const fetchTeachersAndSubjects = async () => {
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/timetable/teachers`),
        fetch(`${API_BASE_URL}/api/admin/timetable/subjects`)
      ]);

      const teachersData = await teachersRes.json();
      const subjectsData = await subjectsRes.json();

      if (teachersData.success) setTeachers(teachersData.data);
      if (subjectsData.success) setSubjects(subjectsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load teachers and subjects');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.teacher_id || !formData.subject_id || !formData.slot_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // First, get or create teacher-subject mapping
      const tsResponse = await fetch(`${API_BASE_URL}/api/admin/timetable/teacher-subject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: formData.teacher_id,
          subject_id: formData.subject_id,
          class_id: selectedClass
        })
      });

      const tsData = await tsResponse.json();

      if (!tsData.success) {
        toast.error('Failed to create teacher-subject mapping');
        return;
      }

      // Then create the timetable entry
      const entryResponse = await fetch(`${API_BASE_URL}/api/admin/timetable/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_subject_id: tsData.data._id,
          class_id: selectedClass,
          day_of_week: formData.day_of_week,
          slot_id: formData.slot_id,
          room_label: formData.room_label,
          session_type: formData.session_type,
          valid_from: formData.valid_from,
          valid_to: formData.valid_to
        })
      });

      const entryData = await entryResponse.json();

      if (entryData.success) {
        toast.success('Entry added successfully!');
        onSuccess();
        handleClose();
      } else {
        toast.error(entryData.message || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error('Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      teacher_id: '',
      subject_id: '',
      day_of_week: 1,
      slot_id: '',
      room_label: '',
      session_type: 'LECTURE',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Add Timetable Entry</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new entry in the timetable
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teacher */}
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <select
                id="teacher"
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.full_name} {teacher.department && `(${teacher.department})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <select
                id="subject"
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week *</Label>
              <select
                id="day"
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot */}
            <div className="space-y-2">
              <Label htmlFor="slot">Time Slot *</Label>
              <select
                id="slot"
                value={formData.slot_id}
                onChange={(e) => setFormData({ ...formData, slot_id: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select Slot</option>
                {slots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.slot_name} ({slot.start_time} - {slot.end_time})
                  </option>
                ))}
              </select>
            </div>

            {/* Room Label */}
            <div className="space-y-2">
              <Label htmlFor="room">Room/Location</Label>
              <Input
                id="room"
                value={formData.room_label}
                onChange={(e) => setFormData({ ...formData, room_label: e.target.value })}
                placeholder="e.g., C-203, Lab-1"
              />
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="session_type">Session Type *</Label>
              <select
                id="session_type"
                value={formData.session_type}
                onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {SESSION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Valid From */}
            <div className="space-y-2">
              <Label htmlFor="valid_from">Valid From</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>

            {/* Valid To */}
            <div className="space-y-2">
              <Label htmlFor="valid_to">Valid To</Label>
              <Input
                id="valid_to"
                type="date"
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddEntryDialog;
