import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaPlus, FaIdCard, FaVenusMars, FaEnvelope, FaLock, FaImage } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function AdminStudentForm({ onStudentAdded }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [phone, setPhone] = useState('');
  const [classId, setClassId] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch classes');
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        setClasses([]);
      }
    }
    fetchClasses();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!image) {
      toast.error('Student image is required');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('roll_no', rollNo);
      formData.append('full_name', fullName);
      formData.append('gender', gender);
      formData.append('phone', phone);
      formData.append('class_id', classId);
      formData.append('image', image);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');
      
      toast.success('Student added successfully!');
      setSuccess('Student added successfully');
      
      // Reset form
      setEmail('');
      setPassword('');
      setRollNo('');
      setFullName('');
      setGender('male');
      setPhone('');
      setClassId('');
      setImage(null);
      setImagePreview(null);
      
      // Notify parent to refresh the table
      if (onStudentAdded) onStudentAdded();
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
            <FaEnvelope className="w-4 h-4" />
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaLock className="w-4 h-4" />
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            minLength={6}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

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
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FaImage className="w-4 h-4" />
            Student Image <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            required
            accept="image/*"
            onChange={handleImageChange}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {imagePreview && (
            <div className="mt-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-lg border-2 border-border"
              />
            </div>
          )}
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
