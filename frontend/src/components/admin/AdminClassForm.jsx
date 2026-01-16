import React, { useState } from 'react';
import { FaGraduationCap, FaCalendar, FaTags, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function AdminClassForm({ onClassAdded }) {
  const [name, setName] = useState('');
  const [batchYear, setBatchYear] = useState(new Date().getFullYear());
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          batch_year: parseInt(batchYear),
          division,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add class');
      
      toast.success('Class added successfully!');
      
      // Reset form
      setName('');
      setBatchYear(new Date().getFullYear());
      setDivision('');
      
      // Notify parent to refresh the table
      if (onClassAdded) onClassAdded();
    } catch (err) {
      toast.error(err.message);
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
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/10 rounded-lg">
          <FaGraduationCap className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Add New Class</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaGraduationCap className="w-4 h-4" />
            Class Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., FE, SE, TE, BE"
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaCalendar className="w-4 h-4" />
            Batch Year
          </label>
          <input
            type="number"
            required
            value={batchYear}
            onChange={e => setBatchYear(e.target.value)}
            min="2000"
            max="2100"
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaTags className="w-4 h-4" />
            Division
          </label>
          <input
            type="text"
            required
            value={division}
            onChange={e => setDivision(e.target.value)}
            placeholder="e.g., A, B, C"
            maxLength={5}
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
            <FaPlus /> Add Class
          </>
        )}
      </button>
    </motion.form>
  );
}
