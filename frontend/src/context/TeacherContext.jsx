import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const TeacherContext = createContext();

export const TeacherProvider = ({ children }) => {
    const [teacher, setTeacher] = useState(() => {
        const storedUser = localStorage.getItem('teacherUser');
        const storedToken = Cookies.get('teacherToken');
        return (storedUser && storedToken) ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        // Keeps state in sync if needed
    }, []);

    const loginTeacher = (userData, token) => {
        setTeacher(userData);
        localStorage.setItem('teacherUser', JSON.stringify(userData));
        localStorage.setItem('teacherToken', token);
        Cookies.set('teacherToken', token, { expires: 1 });
        Cookies.set('teacherId', userData.id, { expires: 1 });
        console.log('Teacher logged in:', { id: userData?.id || null, name: userData?.name || null, email: userData?.email || null });
    };

    const logoutTeacher = () => {
        setTeacher(null);
        localStorage.removeItem('teacherUser');
        localStorage.removeItem('teacherToken');
        Cookies.remove('teacherToken');
        Cookies.remove('teacherId');
        console.log('Teacher logged out');
    };

    return (
        <TeacherContext.Provider value={{ teacher, loginTeacher, logoutTeacher }}>
            {children}
        </TeacherContext.Provider>
    );
};
