import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import StudentAuth from "@/pages/Student/Auth";
import TeacherAuth from "@/pages/Teacher/Auth";
import StudentDashboard from "@/pages/Student/StudentDashboard";
import TeacherDashboard from "@/pages/Teacher/TeacherDashboard";
import AdminDashboard from './pages/Admin/AdminDashboard';
import {Toaster} from '@/components/ui/sonner';
import { StudentProvider } from './context/StudentContext';
import { TeacherProvider } from './context/TeacherContext';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <StudentProvider>
        <TeacherProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/student/login" element={<StudentAuth />} />
              <Route path="/teacher/login" element={<TeacherAuth />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TeacherProvider>
      </StudentProvider>
    </>
  )
}

export default App