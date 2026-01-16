import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save, Loader2 } from 'lucide-react';
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

const EditEntryDialog = ({ open, onClose, entry, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  
  const [formData, setFormData] = useState({
    day_of_week: 1,
    slot_id: '',
    room_label: '',
    session_type: 'LECTURE'
  });

  useEffect(() => {
    if (open && entry) {
      setFormData({
        day_of_week: entry.day_of_week,
        slot_id: entry.slot_id?._id || '',
        room_label: entry.room_label || '',
        session_type: entry.session_type
      });
      fetchSlots();
    }
  }, [open, entry]);

  const fetchSlots = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/timetable/slots');
      const data = await response.json();
      if (data.success) {
        setSlots(data.data);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.slot_id) {
      toast.error('Please select a time slot');
      return;
    }

    setLoading(true);

    try {
      await onUpdate(entry._id, formData);
      handleClose();
    } catch (error) {
      console.error('Error updating entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!open || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Edit Timetable Entry</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {entry.teacher_subject_id?.subject_id?.name} - {entry.teacher_subject_id?.teacher_id?.full_name}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day */}
            <div className="space-y-2">
              <Label htmlFor="edit-day">Day of Week</Label>
              <select
                id="edit-day"
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
              <Label htmlFor="edit-slot">Time Slot</Label>
              <select
                id="edit-slot"
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
              <Label htmlFor="edit-room">Room/Location</Label>
              <Input
                id="edit-room"
                value={formData.room_label}
                onChange={(e) => setFormData({ ...formData, room_label: e.target.value })}
                placeholder="e.g., C-203, Lab-1"
              />
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-session-type">Session Type</Label>
              <select
                id="edit-session-type"
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditEntryDialog;
