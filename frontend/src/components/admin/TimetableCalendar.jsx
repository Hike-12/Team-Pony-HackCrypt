import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Edit, Trash2 } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import TimetableCell from './TimetableCell';
import EditEntryDialog from './EditEntryDialog';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TimetableCalendar = ({ 
  view, 
  classData, 
  slots, 
  entries, 
  loading,
  onEntryUpdate,
  onEntryDelete 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeId, setActiveId] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group entries by day and slot
  const groupedEntries = useMemo(() => {
    const grouped = {};
    entries.forEach(entry => {
      const key = `${entry.day_of_week}-${entry.slot_id?._id}`;
      grouped[key] = entry;
    });
    return grouped;
  }, [entries]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const [activeDay, activeSlot] = active.id.split('-');
      const [overDay, overSlot] = over.id.split('-');
      
      const entry = groupedEntries[active.id];
      
      if (entry) {
        onEntryUpdate(entry._id, {
          day_of_week: parseInt(overDay),
          slot_id: overSlot
        });
      }
    }
    
    setActiveId(null);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
  };

  const handleDelete = (entry) => {
    onEntryDelete(entry._id);
  };

  const renderWeekView = () => {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-200">
          {/* Header with days */}
          <div className="grid grid-cols-8 gap-px bg-border rounded-t-lg overflow-hidden">
            <div className="bg-card p-4 font-semibold text-foreground">
              Time
            </div>
            {DAYS.map((day, idx) => (
              <div key={day} className="bg-card p-4 text-center">
                <div className="font-semibold text-foreground">{DAY_SHORT[idx]}</div>
                <div className="text-sm text-muted-foreground">{day}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-8 gap-px bg-border">
              {slots.map((slot) => (
                <React.Fragment key={slot._id}>
                  {/* Time column */}
                  <div className="bg-card p-4 border-t border-border">
                    <div className="text-sm font-medium text-foreground">
                      {slot.slot_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </div>

                  {/* Day cells */}
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const cellKey = `${day}-${slot._id}`;
                    const entry = groupedEntries[cellKey];
                    
                    return (
                      <TimetableCell
                        key={cellKey}
                        id={cellKey}
                        entry={entry}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <DragOverlay>
              {activeId && groupedEntries[activeId] ? (
                <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-lg opacity-90">
                  <div className="font-medium">
                    {groupedEntries[activeId].teacher_subject_id?.subject_id?.name}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const currentDayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addDays(currentDate, -1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {format(currentDate, 'EEEE')}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(currentDate, 'MMMM d, yyyy')}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {slots.map((slot) => {
            const cellKey = `${currentDayOfWeek}-${slot._id}`;
            const entry = groupedEntries[cellKey];

            return (
              <Card key={slot._id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-24">
                    <div className="text-sm font-medium text-foreground">
                      {slot.slot_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </div>

                  <div className="flex-1">
                    {entry ? (
                      <div className="bg-accent/50 rounded-lg p-3 border border-accent">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground text-lg">
                              {entry.teacher_subject_id?.subject_id?.name}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {entry.teacher_subject_id?.subject_id?.code}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {entry.teacher_subject_id?.teacher_id?.full_name}
                              </div>
                              {entry.room_label && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {entry.room_label}
                                </div>
                              )}
                              <div className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium">
                                {entry.session_type}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4 border-2 border-dashed border-border rounded-lg">
                        No class scheduled
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-2xl font-bold text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, idx) => (
            <div key={day} className="text-center font-semibold text-sm text-foreground py-2">
              {DAY_SHORT[idx]}
            </div>
          ))}
          
          {[...Array(35)].map((_, idx) => {
            const date = addDays(weekStart, idx);
            const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
            const dayEntries = entries.filter(e => e.day_of_week === dayOfWeek);
            
            return (
              <Card key={idx} className="min-h-30 p-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {format(date, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEntries.slice(0, 3).map((entry) => (
                    <div
                      key={entry._id}
                      className="text-xs p-1 bg-accent/50 rounded truncate cursor-pointer hover:bg-accent"
                      onClick={() => handleEdit(entry)}
                    >
                      {entry.teacher_subject_id?.subject_id?.code}
                    </div>
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEntries.length - 3} more
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4 mx-auto"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'month' && renderMonthView()}
      </Card>

      <EditEntryDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        onUpdate={onEntryUpdate}
      />
    </>
  );
};

export default TimetableCalendar;
