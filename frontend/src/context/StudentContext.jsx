import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
    const [student, setStudent] = useState(null);

    useEffect(() => {
        // Load from LocalStorage or Cookie on mount
        const storedUser = localStorage.getItem('studentUser');
        const storedToken = Cookies.get('studentToken');

        if (storedUser && storedToken) {
           setStudent(JSON.parse(storedUser));
        }
    }, []);

    const loginStudent = (userData, token) => {
        setStudent(userData);
        // Store in Context (already done by setState)
        
        // Store in LocalStorage
        localStorage.setItem('studentUser', JSON.stringify(userData));
        localStorage.setItem('studentToken', token); // Also keeping token in LS for consistency if needed, but cookie is primary for auth usually

        // Store in Cookie
        Cookies.set('studentToken', token, { expires: 1 }); // Expires in 1 day
        Cookies.set('studentId', userData.id, { expires: 1 });
    };

    const logoutStudent = () => {
        setStudent(null);
        localStorage.removeItem('studentUser');
        localStorage.removeItem('studentToken');
        Cookies.remove('studentToken');
        Cookies.remove('studentId');
    };

    return (
        <StudentContext.Provider value={{ student, loginStudent, logoutStudent }}>
            {children}
        </StudentContext.Provider>
    );
};
