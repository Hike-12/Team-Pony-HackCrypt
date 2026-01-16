import React, { useState } from 'react';
import { FaUser, FaBuilding, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function AdminTeacherForm() {
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: fullName,
          department,
        }),
      });
      if (!res.ok) throw new Error('Failed to add teacher');
      toast.success('Teacher added successfully!');
      setSuccess('Teacher added successfully');
      setFullName('');
      setDepartment('');
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit} 
      className="rounded-xl bg-card border p-6 shadow-sm flex flex-col gap-4"
    >
      <h2 className="text-xl font-bold mb-2 text-foreground">Add Teacher</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaUser className="w-4 h-4" />
            Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Enter full name"
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaBuilding className="w-4 h-4" />
            Department
          </label>
          <input
            type="text"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            placeholder="Enter department"
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <FaPlus /> Add Teacher
          </>
        )}
      </button>
    </motion.form>
  );
}
