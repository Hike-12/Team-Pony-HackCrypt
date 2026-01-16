import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const AdminTeacherTable = forwardRef(function AdminTeacherTable(props, ref) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);

  async function fetchTeachers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch teachers');
      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Expose fetchTeachers to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchTeachers
  }));

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this teacher? This will also delete their user account.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setTeachers(teachers.filter(t => t._id !== id));
      toast.success('Teacher deleted successfully');
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
      <h2 className="text-xl font-bold mb-4 text-foreground">Teacher List</h2>
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading teachers...</p>
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
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Full Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {teachers.map(teacher => (
                <tr key={teacher._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{teacher.full_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{teacher.email || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{teacher.department || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        aria-label="Edit teacher"
                        className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                        onClick={() => setEditId(teacher._id)}
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        aria-label="Delete teacher"
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all"
                        onClick={() => handleDelete(teacher._id)}
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-muted-foreground">No teachers found. Add a teacher to get started.</p>
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
