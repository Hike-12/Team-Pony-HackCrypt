import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { User, MapPin, Edit, Trash2, GripVertical } from 'lucide-react';

const TimetableCell = ({ id, entry, onEdit, onDelete }) => {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });
  const { 
    attributes, 
    listeners, 
    setNodeRef: setDraggableRef, 
    transform, 
    isDragging 
  } = useDraggable({ 
    id,
    disabled: !entry 
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  if (!entry) {
    return (
      <div
        ref={setDroppableRef}
        className={`min-h-[100px] bg-card p-2 border-t border-border transition-colors ${
          isOver ? 'bg-accent/20 border-accent' : ''
        }`}
      >
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          {isOver ? 'Drop here' : ''}
        </div>
      </div>
    );
  }

  return (
    <div ref={setDroppableRef} className="min-h-[100px] bg-card p-2 border-t border-border">
      <div
        ref={setDraggableRef}
        style={style}
        className={`h-full bg-gradient-to-br ${getColorClass(entry.session_type)} rounded-lg p-3 shadow-sm transition-all hover:shadow-md cursor-move group relative ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div
          {...listeners}
          {...attributes}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-white/70" />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="font-semibold text-white text-sm line-clamp-2">
            {entry.teacher_subject_id?.subject_id?.name}
          </div>
          <div className="text-xs text-white/90">
            {entry.teacher_subject_id?.subject_id?.code}
          </div>
          
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-white/80">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {entry.teacher_subject_id?.teacher_id?.full_name}
              </span>
            </div>
            
            {entry.room_label && (
              <div className="flex items-center gap-1 text-xs text-white/80">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{entry.room_label}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
              {entry.session_type}
            </span>
          </div>

          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getColorClass = (sessionType) => {
  const colors = {
    'LECTURE': 'from-blue-500 to-blue-600',
    'LAB': 'from-green-500 to-green-600',
    'TUTORIAL': 'from-purple-500 to-purple-600',
    'Online': 'from-orange-500 to-orange-600'
  };
  return colors[sessionType] || 'from-gray-500 to-gray-600';
};

export default TimetableCell;
