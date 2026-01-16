import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
    const [student, setStudent] = useState(() => {
        const storedUser = localStorage.getItem('studentUser');
        const storedToken = Cookies.get('studentToken');
        return (storedUser && storedToken) ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        // Keeps state in sync if needed, mostly for future proofing or if cookies change externally
    }, []);

    const loginStudent = (userData, token) => {
        setStudent(userData);
        localStorage.setItem('studentUser', JSON.stringify(userData));
        localStorage.setItem('studentToken', token);
        Cookies.set('studentToken', token, { expires: 1 });
        Cookies.set('studentId', userData.id, { expires: 1 });
        console.log('Student logged in:', { id: userData?.id || null, name: userData?.name || null, roll_no: userData?.roll_no || null });
    };

    const logoutStudent = () => {
        setStudent(null);
        localStorage.removeItem('studentUser');
        localStorage.removeItem('studentToken');
        Cookies.remove('studentToken');
        Cookies.remove('studentId');
        console.log('Student logged out');
    };

    return (
        <StudentContext.Provider value={{ student, loginStudent, logoutStudent }}>
            {children}
        </StudentContext.Provider>
    );
};
