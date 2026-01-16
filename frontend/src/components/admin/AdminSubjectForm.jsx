import React, { useState } from 'react';
import { FaBook, FaCode, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function AdminSubjectForm({ onSubjectAdded }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code,
          name,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add subject');
      
      toast.success('Subject added successfully!');
      
      // Reset form
      setCode('');
      setName('');
      
      // Notify parent to refresh the table
      if (onSubjectAdded) onSubjectAdded();
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
          <FaBook className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Add New Subject</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaCode className="w-4 h-4" />
            Subject Code
          </label>
          <input
            type="text"
            required
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g., CS101, MATH201"
            maxLength={20}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaBook className="w-4 h-4" />
            Subject Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Data Structures, Calculus"
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
            <FaPlus /> Add Subject
          </>
        )}
      </button>
    </motion.form>
  );
}
