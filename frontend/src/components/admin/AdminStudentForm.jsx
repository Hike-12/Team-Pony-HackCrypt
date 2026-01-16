import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaPlus, FaIdCard, FaVenusMars, FaEnvelope, FaLock, FaImage, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function AdminStudentForm({ onStudentAdded }) {
  const [currentStep, setCurrentStep] = useState(1);
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

  const validateStep1 = () => {
    if (!email || !password || !rollNo || !fullName) {
      toast.error('Please fill all required fields in Step 1');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!image) {
      toast.error('Student image is required');
      return;
    }

    if (!classId) {
      toast.error('Please select a class');
      return;
    }

    setLoading(true);

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
      setCurrentStep(1);

      if (onStudentAdded) onStudentAdded();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg bg-card border p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Student</h2>
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-1 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Step {currentStep} of 2: {currentStep === 1 ? 'Basic Information' : 'Additional Details'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Email - Full Width */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FaEnvelope className="w-4 h-4" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Password - Full Width */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FaLock className="w-4 h-4" />
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  minLength={6}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Roll Number and Full Name - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FaIdCard className="w-4 h-4" />
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    placeholder="Enter roll number"
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FaUser className="w-4 h-4" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Next <FaArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Gender and Phone - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FaVenusMars className="w-4 h-4" />
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
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
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Class - Full Width */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Class *
                </label>
                <select
                  required
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.division}) - {cls.batch_year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload - Full Width */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FaImage className="w-4 h-4" />
                  Student Image *
                </label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleImageChange}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-md border-2 border-border"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md border text-muted-foreground hover:bg-muted/20 transition-colors"
                >
                  <FaArrowLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus className="w-4 h-4" /> Add Student
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
