import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const AdminStudentTable = forwardRef(function AdminStudentTable(props, ref) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);

  async function fetchStudents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Expose fetchStudents to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchStudents
  }));

  useEffect(() => {
    fetchStudents();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this student? This will also delete their user account.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setStudents(students.filter(s => s._id !== id));
      toast.success('Student deleted successfully');
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
      <h2 className="text-xl font-bold mb-4 text-foreground">Student List</h2>
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading students...</p>
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
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Image</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Roll No</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Full Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Gender</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Class</th>
                <th className="px-4 py-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {students.map(student => (
                <tr key={student._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    {student.image_url ? (
                      <img 
                        src={student.image_url} 
                        alt={student.full_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{student.roll_no}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{student.full_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{student.email || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{student.gender}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{student.phone || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{student.class_name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        aria-label="Edit student"
                        className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                        onClick={() => setEditId(student._id)}
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        aria-label="Delete student"
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all"
                        onClick={() => handleDelete(student._id)}
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-muted-foreground">No students found. Add a student to get started.</p>
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
