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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState(null);

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
