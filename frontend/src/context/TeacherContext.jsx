import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const TeacherContext = createContext();

export const TeacherProvider = ({ children }) => {
    const [teacher, setTeacher] = useState(null);

    useEffect(() => {
        // Load from LocalStorage or Cookie on mount
        const storedUser = localStorage.getItem('teacherUser');
        const storedToken = Cookies.get('teacherToken');

        if (storedUser && storedToken) {
           setTeacher(JSON.parse(storedUser));
        }
    }, []);

    const loginTeacher = (userData, token) => {
        setTeacher(userData);
        
        // Store in LocalStorage
        localStorage.setItem('teacherUser', JSON.stringify(userData));
        localStorage.setItem('teacherToken', token);

        // Store in Cookie
        Cookies.set('teacherToken', token, { expires: 1 }); // Expires in 1 day
        Cookies.set('teacherId', userData.id, { expires: 1 });
    };

    const logoutTeacher = () => {
        setTeacher(null);
        localStorage.removeItem('teacherUser');
        localStorage.removeItem('teacherToken');
        Cookies.remove('teacherToken');
        Cookies.remove('teacherId');
    };

    return (
        <TeacherContext.Provider value={{ teacher, loginTeacher, logoutTeacher }}>
            {children}
        </TeacherContext.Provider>
    );
};
