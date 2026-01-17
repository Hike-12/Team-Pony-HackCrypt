const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true
    }
});

connectDB();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://nomoreproxies-hackcrypt.vercel.app','https://nomoreproxies-hackcrypt.vercel.app/','nomoreproxies-hackcrypt.vercel.app'],
    credentials: true
}));

app.use(express.json());

// Make io instance available to routes (BEFORE routes are loaded)
app.set('io', io);

// Routes
app.use('/api/student/auth', require('./routes/Student/authRoutes'));
app.use('/api/student', require('./routes/Student/authRoutes'));
app.use('/api/student/leave', require('./routes/Student/leaveRoutes'));
app.use('/api/student/biometric', require('./routes/Student/biometricRoutes'));
app.use('/api/student/webauthn', require('./routes/Student/webauthnRoutes')); 
app.use('/api/student/geofencing', require('./routes/Student/geofencingRoutes')); 
app.use('/api/teacher/auth', require('./routes/Teacher/authRoutes'));
app.use('/api/teacher/attendance', require('./routes/Teacher/attendanceRoutes'));
app.use('/api/teacher/leave', require('./routes/Teacher/leaveRoutes'));
app.use('/api/teacher/attentiveness', require('./routes/Teacher/attentivenessRoutes'));
app.use('/api/admin/students', require('./routes/adminStudentRoutes'));
app.use('/api/admin/teachers', require('./routes/adminTeacherRoutes'));
app.use('/api/admin/timetable', require('./routes/Admin/timetableRoutes'));
app.use('/api/admin/classes', require('./routes/adminClassRoutes'));
app.use('/api/admin/subjects', require('./routes/adminSubjectRoutes'));
app.use('/api/admin/teacher-subjects', require('./routes/adminTeacherSubjectRoutes'));
app.use('/api/admin/geofencing', require('./routes/Admin/geofencingRoutes'));
app.use('/api/student/attendance', require('./routes/Student/attendanceMarkingRoutes'));
app.use('/api/student/attendance-analytics', require('./routes/Student/attendanceAnalyticsRoutes'));
app.use('/api/admin/csv', require('./routes/Admin/csvUploadRoutes'));

const PORT = process.env.PORT || 8000;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Teacher joins a session room to receive real-time attendance updates
    socket.on('joinSession', (sessionId) => {
        socket.join(`session-${sessionId}`);
        console.log(`Teacher joined session room: session-${sessionId}`);
    });

    // Teacher leaves session room
    socket.on('leaveSession', (sessionId) => {
        socket.leave(`session-${sessionId}`);
        console.log(`Teacher left session room: session-${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
