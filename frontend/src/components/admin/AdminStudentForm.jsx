import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaPlus, FaIdCard, FaVenusMars } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function AdminStudentForm() {
  const [rollNo, setRollNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [phone, setPhone] = useState('');
  const [classId, setClassId] = useState('');
  const [deviceIdHash, setDeviceIdHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/classes`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch classes');
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        setClasses([]);
      }
    }
    fetchClasses();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roll_no: rollNo,
          full_name: fullName,
          gender,
          phone,
          class_id: classId,
          device_id_hash: deviceIdHash,
        }),
      });
      if (!res.ok) throw new Error('Failed to add student');
      toast.success('Student added successfully!');
      setSuccess('Student added successfully');
      setRollNo('');
      setFullName('');
      setGender('male');
      setPhone('');
      setClassId('');
      setDeviceIdHash('');
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
      <h2 className="text-xl font-bold mb-2 text-foreground">Add Student</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaIdCard className="w-4 h-4" />
            Roll Number
          </label>
          <input
            type="text"
            required
            value={rollNo}
            onChange={e => setRollNo(e.target.value)}
            placeholder="Enter roll number"
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

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
            <FaVenusMars className="w-4 h-4" />
            Gender
          </label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaPhone className="w-4 h-4" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Class
          </label>
          <select
            required
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.name} ({cls.division}) - {cls.batch_year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Device ID Hash (Optional)
          </label>
          <input
            type="text"
            value={deviceIdHash}
            onChange={e => setDeviceIdHash(e.target.value)}
            placeholder="Enter device ID hash"
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
            <FaPlus /> Add Student
          </>
        )}
      </button>
    </motion.form>
  );
}
