import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaGraduationCap } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
  const [editingClass, setEditingClass] = useState(null);
  const [deletingClassId, setDeletingClassId] = useState(null);
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
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingClass) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes/${editingClass._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
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
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
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
                    <td colSpan={5} className="px-4 py-12 text-center">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update the class information below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Class Name</label>
              <input
                type="text"
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Division</label>
              <input
                type="text"
                value={editFormData.division || ''}
                onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g., A, B, C"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Batch Year</label>
              <input
                type="number"
                value={editFormData.batch_year || new Date().getFullYear()}
                onChange={(e) => setEditFormData({ ...editFormData, batch_year: parseInt(e.target.value) })}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
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
    </>
  );
});
