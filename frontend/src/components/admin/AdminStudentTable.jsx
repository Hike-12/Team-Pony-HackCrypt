import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaCheck, FaCamera, FaFingerprint } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import FaceEnrollment from "@/components/student/FaceEnrollment";
import { BiometricEnrollmentModal } from "@/components/admin/BiometricEnrollmentModal";

export const AdminStudentTable = forwardRef(function AdminStudentTable(props, ref) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudentId, setDeletingStudentId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [classes, setClasses] = useState([]);
  const [enrollingStudent, setEnrollingStudent] = useState(null);
  const [biometricStudent, setBiometricStudent] = useState(null);

  function handleOpenFaceEnrollment(student) {
    setEnrollingStudent(student);
  }

  function handleCloseEnrollment() {
    setEnrollingStudent(null);
  }

  function handleOpenBiometricEnrollment(student) {
    setBiometricStudent(student);
  }

  function handleCloseBiometricEnrollment() {
    setBiometricStudent(null);
  }

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

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classes`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch classes');
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        setClasses([]);
      }
    }
    fetchClasses();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchStudents
  }));

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditOpen = (student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name,
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || 'male',
      roll_no: student.roll_no,
      class_id: student.class_id || '',
    });
    setEditImage(null);
    setEditImagePreview(student.image_url || null);
    setEditOpen(true);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingStudent) return;
    setEditLoading(true);
    try {
      let res;
      if (editImage) {
        const formData = new FormData();
        formData.append('full_name', editFormData.full_name);
        formData.append('email', editFormData.email);
        formData.append('phone', editFormData.phone);
        formData.append('gender', editFormData.gender);
        formData.append('roll_no', editFormData.roll_no);
        formData.append('class_id', editFormData.class_id);
        formData.append('image', editImage);

        res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${editingStudent._id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        });
      } else {
        res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${editingStudent._id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData),
        });
      }

      if (!res.ok) throw new Error('Failed to update student');
      toast.success('Student updated successfully');
      setEditOpen(false);
      setEditImage(null);
      setEditImagePreview(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  async function handleDelete(id) {
    setDeletingStudentId(id);
    setDeleteOpen(true);
  }

  const confirmDelete = async () => {
    if (!deletingStudentId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/students/${deletingStudentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setStudents(students.filter(s => s._id !== deletingStudentId));
      toast.success('Student deleted successfully');
      setDeleteOpen(false);
      setDeletingStudentId(null);
    } catch (err) {
      toast.error(err.message);
      setDeleteOpen(false);
      setDeletingStudentId(null);
    }
  }

  return (
    <>
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
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Division</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Batch</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Camera</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Biometric</th>
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
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.division || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.batch_year || 'N/A'}</td>
                    <td className="px-4 py-3 text-center">
                      {student.face_enrolled ? (
                        <button
                          className="p-2 rounded-full bg-transparent text-white cursor-default"
                          title="Face enrolled"
                          disabled
                        >
                          <FaCheck className="w-5 h-5 text-white" />
                        </button>
                      ) : (
                        <button
                          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                          title="Enroll Face"
                          onClick={() => handleOpenFaceEnrollment(student)}
                        >
                          <FaCamera className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="p-2 rounded-full transition"
                        title={student.biometric_enrolled ? "Biometric enrolled" : "Enroll Biometric"}
                        onClick={() => !student.biometric_enrolled && handleOpenBiometricEnrollment(student)}
                        disabled={student.biometric_enrolled}
                        style={
                          student.biometric_enrolled
                            ? {
                                background: 'var(--chart-1)',
                                color: 'var(--primary-foreground)',
                                border: '2px solid var(--chart-1)',
                                opacity: 1,
                              }
                            : {
                                background: 'var(--primary)',
                                color: 'var(--primary-foreground)',
                                opacity: 0.7,
                              }
                        }
                      >
                        <FaFingerprint className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          aria-label="Edit student"
                          className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                          onClick={() => handleEditOpen(student)}
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
                    <td colSpan={12} className="px-4 py-12 text-center">
                      <p className="text-muted-foreground">No students found. Add a student to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the student's information below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Row 1: Roll No and Full Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Roll No</label>
                <input
                  type="text"
                  value={editFormData.roll_no || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, roll_no: e.target.value })}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Row 2: Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <input
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Row 3: Gender and Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <Select
                  value={editFormData.gender || 'male'}
                  onValueChange={(value) => setEditFormData({ ...editFormData, gender: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <Select
                  value={editFormData.class_id || ''}
                  onValueChange={(value) => setEditFormData({ ...editFormData, class_id: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name} ({cls.division}) - {cls.batch_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Student Image */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Student Image</label>
              <div className="flex items-start gap-4">
                {editImagePreview && (
                  <div className="shrink-0">
                    <img
                      src={editImagePreview}
                      alt="Current"
                      className="w-20 h-20 object-cover rounded-md border-2 border-border"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="px-3 py-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={editLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {editLoading ? 'Updating...' : 'Update'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action will also delete their user account and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {enrollingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-xl"
              onClick={handleCloseEnrollment}
            >
              ×
            </button>
            <FaceEnrollment
              studentId={enrollingStudent._id}
              onEnrollmentComplete={() => {
                handleCloseEnrollment();
                fetchStudents();
              }}
            />
          </div>
        </div>
      )}
      {biometricStudent && (
        <BiometricEnrollmentModal
          studentId={biometricStudent._id}
          studentName={biometricStudent.full_name}
          onClose={() => {
            handleCloseBiometricEnrollment();
            fetchStudents();
          }}
        />
      )}
    </>
  );
});