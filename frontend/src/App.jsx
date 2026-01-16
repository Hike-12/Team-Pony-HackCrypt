import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import StudentAuth from "@/pages/Student/Auth";
import TeacherAuth from "@/pages/Teacher/Auth";
import StudentDashboard from "@/pages/Student/StudentDashboard";
import TeacherDashboard from "@/pages/Teacher/TeacherDashboard";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import AdminStudents from "@/pages/Admin/AdminStudents";
import AdminTeachers from "@/pages/Admin/AdminTeachers";
import LeaveApplication from "@/pages/Student/LeaveApplication";
import LeaveHistory from "@/pages/Student/LeaveHistory";
import LeaveManagement from "@/pages/Teacher/LeaveManagement";


import { Toaster } from '@/components/ui/sonner';
import { StudentProvider } from './context/StudentContext';
import { TeacherProvider } from './context/TeacherContext';
import { StudentProtectedRoute, TeacherProtectedRoute } from './components/ProtectedRoute';
import { SidebarProvider } from './components/ui/sidebar';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <SidebarProvider>
        <StudentProvider>
          <TeacherProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />

                <Route path="/student/login" element={<StudentAuth />} />
                <Route
                //  element={<StudentProtectedRoute />}
                >
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/leave/apply" element={<LeaveApplication />} />
                  <Route path="/student/leave/history" element={<LeaveHistory />} />
                </Route>

                <Route path="/teacher/login" element={<TeacherAuth />} />
                <Route element={<TeacherProtectedRoute />}>
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                  <Route path="/teacher/leave-management" element={<LeaveManagement />} />
                </Route>

                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<AdminStudents />} />
                <Route path="/admin/teachers" element={<AdminTeachers />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TeacherProvider>
        </StudentProvider>
      </SidebarProvider>
    </>
  )
}

export default App