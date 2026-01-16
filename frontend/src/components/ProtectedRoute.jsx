import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { StudentContext } from '../context/StudentContext';
import { TeacherContext } from '../context/TeacherContext';

export const StudentProtectedRoute = () => {
    const { student } = useContext(StudentContext);
    
    // Check if student is authenticated, if not redirect to login
    return student ? <Outlet /> : <Navigate to="/student/login" replace />;
};

export const TeacherProtectedRoute = () => {
    const { teacher } = useContext(TeacherContext);

    // Check if teacher is authenticated, if not redirect to login
    return teacher ? <Outlet /> : <Navigate to="/teacher/login" replace />;
};
