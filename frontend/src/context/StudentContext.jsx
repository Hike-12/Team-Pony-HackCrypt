import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
    const [student, setStudent] = useState(() => {
        const storedUser = localStorage.getItem('studentUser');
        const storedToken = Cookies.get('studentToken');
        if (storedUser && storedToken) {
            const userData = JSON.parse(storedUser);
            // Ensure _id and id are always set
            return {
                ...userData,
                _id: userData.student_id || userData._id,
                id: userData.student_id || userData._id,
            };
        }
        return null;
    });

    useEffect(() => {
        // Keeps state in sync if needed
    }, []);

    const loginStudent = (userData, token) => {
        console.log('===== LOGIN STUDENT =====');
        console.log('Received userData:', userData);
        
        // Ensure _id is always set correctly
        const studentData = {
            ...userData,
            _id: userData.student_id || userData._id,
            id: userData.student_id || userData._id,
        };
        
        console.log('Processed studentData:', studentData);
        console.log('Student _id:', studentData._id);
        console.log('Student id:', studentData.id);
        
        setStudent(studentData);
        localStorage.setItem('studentUser', JSON.stringify(studentData));
        localStorage.setItem('studentToken', token);
        Cookies.set('studentToken', token, { expires: 1 });
        Cookies.set('studentId', studentData._id, { expires: 1 });
        console.log('Student logged in:', { 
          _id: studentData._id, 
          id: studentData.id, 
          name: studentData.name, 
          roll_no: studentData.roll_no 
        });
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
