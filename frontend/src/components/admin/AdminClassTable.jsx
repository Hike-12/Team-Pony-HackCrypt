import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaGraduationCap } from 'react-icons/fa';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ClassLocationSetup } from '@/components/admin/ClassLocationSetup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const AdminClassTable = forwardRef(function AdminClassTable(props, ref) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deletingClassId, setDeletingClassId] = useState(null);
  const [locationClass, setLocationClass] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  async function fetchClasses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Expose fetchClasses to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchClasses
  }));

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEditOpen = (classItem) => {
    setEditingClass(classItem);
    setEditFormData({
      name: classItem.name,
      division: classItem.division || '',
      batch_year: classItem.batch_year || new Date().getFullYear(),
      latitude: classItem.location?.latitude || '',
      longitude: classItem.location?.longitude || '',
      allowed_radius: classItem.location?.allowed_radius || 50,
      room_label: classItem.location?.room_label || '',
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingClass) return;
    setEditLoading(true);
    try {
      const updateData = {
        name: editFormData.name,
        division: editFormData.division,
        batch_year: editFormData.batch_year,
        location: {
          latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : undefined,
          longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : undefined,
          allowed_radius: editFormData.allowed_radius ? parseInt(editFormData.allowed_radius) : 50,
          room_label: editFormData.room_label || '',
        }
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes/${editingClass._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error('Failed to update class');
      toast.success('Class updated successfully');
      setEditOpen(false);
      fetchClasses();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  async function handleDelete(id) {
    setDeletingClassId(id);
    setDeleteOpen(true);
  }

  const handleLocationOpen = (classItem) => {
    setLocationClass(classItem);
    setLocationOpen(true);
  };

  const handleLocationUpdated = (updatedClass) => {
    setLocationOpen(false);
    fetchClasses();
  };

  const confirmDelete = async () => {
    if (!deletingClassId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes/${deletingClassId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setClasses(classes.filter(c => c._id !== deletingClassId));
      toast.success('Class deleted successfully');
      setDeleteOpen(false);
      setDeletingClassId(null);
    } catch (err) {
      toast.error(err.message);
      setDeleteOpen(false);
      setDeletingClassId(null);
    }
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl bg-card border p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FaGraduationCap className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Class List</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading classes...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Class Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Division</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Batch Year</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Full Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {classes.map(classItem => (
                  <tr key={classItem._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{classItem.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                        {classItem.division}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{classItem.batch_year}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">
                      {classItem.name} {classItem.division} ({classItem.batch_year})
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {classItem.location?.room_label ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-medium">
                          <MapPin className="w-3 h-3" />
                          {classItem.location.room_label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          aria-label="Set location"
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                          onClick={() => handleLocationOpen(classItem)}
                          title="Set geofencing location"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                        <button
                          aria-label="Edit class"
                          className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                          onClick={() => handleEditOpen(classItem)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          aria-label="Delete class"
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all"
                          onClick={() => handleDelete(classItem._id)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {classes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-muted-foreground">No classes found. Add a class to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update the class information and location below</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Class Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Division</label>
                  <input
                    type="text"
                    value={editFormData.division || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value })}
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g., A, B, C"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Batch Year</label>
                <input
                  type="number"
                  value={editFormData.batch_year || new Date().getFullYear()}
                  onChange={(e) => setEditFormData({ ...editFormData, batch_year: parseInt(e.target.value) })}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground">Location Setup</h3>
              <p className="text-xs text-muted-foreground">Set geofencing coordinates for attendance verification</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.latitude || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                    placeholder="e.g., 19.25559914"
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.longitude || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                    placeholder="e.g., 72.86701151"
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Allowed Radius (m)</label>
                  <input
                    type="number"
                    value={editFormData.allowed_radius || 50}
                    onChange={(e) => setEditFormData({ ...editFormData, allowed_radius: e.target.value })}
                    placeholder="50"
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 50-150m for indoor GPS drift</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Room Label</label>
                  <input
                    type="text"
                    value={editFormData.room_label || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, room_label: e.target.value })}
                    placeholder="e.g., 502"
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/50 border">
                <p className="text-xs font-medium text-foreground mb-2">Tips:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>GPS works best outdoors or near windows</li>
                  <li>Indoor GPS can drift 50-100m - adjust radius accordingly</li>
                  <li>Test after setting to verify accuracy</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={editLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {editLoading ? 'Updating...' : 'Update'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? Students assigned to this class may be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Location Setup Dialog */}
      <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Setup Class Location</DialogTitle>
            <DialogDescription>
              Configure geofencing for {locationClass?.name} {locationClass?.division}
            </DialogDescription>
          </DialogHeader>
          {locationClass && (
            <ClassLocationSetup
              classData={locationClass}
              onLocationUpdated={handleLocationUpdated}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});
