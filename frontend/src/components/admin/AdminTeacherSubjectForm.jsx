import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaBook, FaPlus, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function AdminTeacherSubjectForm({ onAssignmentAdded }) {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      try {
        const [teachersRes, subjectsRes, classesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/teachers`, { credentials: 'include' }),
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/subjects`, { credentials: 'include' }),
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes`, { credentials: 'include' })
        ]);

        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setTeachers(teachersData);
        }
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjects(subjectsData);
        }
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClasses(classesData);
        }
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/teacher-subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacher_id: selectedTeacher,
          subject_id: selectedSubject,
          class_id: selectedClass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign subject');

      toast.success('Subject assigned to teacher successfully!');

      // Reset form
      setSelectedTeacher('');
      setSelectedSubject('');
      setSelectedClass('');

      // Notify parent to refresh the table
      if (onAssignmentAdded) onAssignmentAdded();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl bg-card border p-6 shadow-sm flex items-center justify-center h-32"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </motion.div>
    );
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
        <h2 className="text-xl font-bold text-foreground">Assign Subject to Teacher</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaUser className="w-4 h-4" />
            Select Teacher
          </label>
          <select
            required
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Choose Teacher...</option>
            {teachers.map(teacher => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaBook className="w-4 h-4" />
            Select Subject
          </label>
          <select
            required
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Choose Subject...</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaGraduationCap className="w-4 h-4" />
            Select Class
          </label>
          <select
            required
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Choose Class...</option>
            {classes.map(classItem => (
              <option key={classItem._id} value={classItem._id}>
                {classItem.name} {classItem.division} ({classItem.batch_year})
              </option>
            ))}
          </select>
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
            Assigning...
          </>
        ) : (
          <>
            <FaPlus /> Assign Subject
          </>
        )}
      </button>
    </motion.form>
  );
}
