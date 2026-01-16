import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaBook } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const AdminSubjectTable = forwardRef(function AdminSubjectTable(props, ref) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  async function handleDelete(id) {
    if (!window.confirm('Delete this subject? This may affect assignments and records.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/subjects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setSubjects(subjects.filter(s => s._id !== id));
      toast.success('Subject deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
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
  );
});
