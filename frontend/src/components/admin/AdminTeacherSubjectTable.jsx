import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaLink } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
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

export const AdminTeacherSubjectTable = forwardRef(function AdminTeacherSubjectTable(props, ref) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  async function fetchAssignments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teacher-subjects`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Expose fetchAssignments to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchAssignments
  }));

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleEditOpen = async (assignment) => {
    setEditingAssignment(assignment);
    setEditFormData({
      teacher_id: assignment.teacher_id,
      subject_id: assignment.subject_id,
      class_id: assignment.class_id,
    });

    // Load dropdowns if not already loaded
    if (teachers.length === 0 || subjects.length === 0 || classes.length === 0) {
      setDropdownLoading(true);
      try {
        const [teachersRes, subjectsRes, classesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers`, { credentials: 'include' }),
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/subjects`, { credentials: 'include' }),
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes`, { credentials: 'include' })
        ]);

        if (teachersRes.ok) setTeachers(await teachersRes.json());
        if (subjectsRes.ok) setSubjects(await subjectsRes.json());
        if (classesRes.ok) setClasses(await classesRes.json());
      } catch (err) {
        toast.error('Failed to load dropdown data');
      } finally {
        setDropdownLoading(false);
      }
    }

    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingAssignment) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teacher-subjects/${editingAssignment._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update assignment');
      }
      toast.success('Assignment updated successfully');
      setEditOpen(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  async function handleDelete(id) {
    setDeletingAssignmentId(id);
    setDeleteOpen(true);
  }

  const confirmDelete = async () => {
    if (!deletingAssignmentId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teacher-subjects/${deletingAssignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setAssignments(assignments.filter(a => a._id !== deletingAssignmentId));
      toast.success('Assignment deleted successfully');
      setDeleteOpen(false);
      setDeletingAssignmentId(null);
    } catch (err) {
      toast.error(err.message);
      setDeleteOpen(false);
      setDeletingAssignmentId(null);
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
            <FaLink className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Teacher-Subject Assignments</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading assignments...</p>
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
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Teacher Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Subject Code</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Subject Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Class</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {assignments.map(assignment => (
                  <tr key={assignment._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{assignment.teacher_name}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                        {assignment.subject_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{assignment.subject_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{assignment.class_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          aria-label="Edit assignment"
                          className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                          onClick={() => handleEditOpen(assignment)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          aria-label="Delete assignment"
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all"
                          onClick={() => handleDelete(assignment._id)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <p className="text-muted-foreground">No assignments found. Assign a subject to a teacher to get started.</p>
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
            <DialogTitle>Edit Teacher-Subject Assignment</DialogTitle>
          </DialogHeader>
          {dropdownLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Teacher</label>
                <select
                  value={editFormData.teacher_id || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, teacher_id: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select Teacher...</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <select
                  value={editFormData.subject_id || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, subject_id: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <select
                  value={editFormData.class_id || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, class_id: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select Class...</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name} {c.division} ({c.batch_year})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={editLoading || dropdownLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this teacher-subject assignment? This action cannot be undone.
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
