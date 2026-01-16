const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/student/auth', require('./routes/Student/authRoutes'));
app.use('/api/teacher/auth', require('./routes/Teacher/authRoutes'));
app.use('/api/admin/students', require('./routes/adminStudentRoutes'));
app.use('/api/admin/teachers', require('./routes/adminTeacherRoutes'));

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
