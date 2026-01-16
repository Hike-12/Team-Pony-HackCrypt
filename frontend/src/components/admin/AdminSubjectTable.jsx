import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaBook } from 'react-icons/fa';
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

export const AdminSubjectTable = forwardRef(function AdminSubjectTable(props, ref) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  async function fetchSubjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/subjects`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Expose fetchSubjects to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchSubjects
  }));

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleEditOpen = (subject) => {
    setEditingSubject(subject);
    setEditFormData({
      code: subject.code,
      name: subject.name,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingSubject) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/subjects/${editingSubject._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) throw new Error('Failed to update subject');
      toast.success('Subject updated successfully');
      setEditOpen(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  async function handleDelete(id) {
    setDeletingSubjectId(id);
    setDeleteOpen(true);
  }

  const confirmDelete = async () => {
    if (!deletingSubjectId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/subjects/${deletingSubjectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setSubjects(subjects.filter(s => s._id !== deletingSubjectId));
      toast.success('Subject deleted successfully');
      setDeleteOpen(false);
      setDeletingSubjectId(null);
    } catch (err) {
      toast.error(err.message);
      setDeleteOpen(false);
      setDeletingSubjectId(null);
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
            <FaBook className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Subject List</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading subjects...</p>
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
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Subject Code</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Subject Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {subjects.map(subject => (
                  <tr key={subject._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{subject.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          aria-label="Edit subject"
                          className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                          onClick={() => handleEditOpen(subject)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          aria-label="Delete subject"
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all"
                          onClick={() => handleDelete(subject._id)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center">
                      <p className="text-muted-foreground">No subjects found. Add a subject to get started.</p>
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
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update the subject information below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Subject Code</label>
              <input
                type="text"
                value={editFormData.code || ''}
                onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Subject Name</label>
              <input
                type="text"
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subject? This may affect assignments and records. This action cannot be undone.
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
