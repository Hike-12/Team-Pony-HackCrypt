import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaGraduationCap } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const AdminClassTable = forwardRef(function AdminClassTable(props, ref) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  async function handleDelete(id) {
    if (!window.confirm('Delete this class? Students assigned to this class may be affected.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setClasses(classes.filter(c => c._id !== id));
      toast.success('Class deleted successfully');
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
  );
});
