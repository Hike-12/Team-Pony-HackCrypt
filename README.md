<div align="center">

# 🔐 NoMoreProxies — Smart Attendance & Leave Management System

[![Platform](https://img.shields.io/badge/Education%20Platform-Live-00d4ff?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Team-Pony-HackCrypt)
[![Hackathon](https://img.shields.io/badge/HackCrypt%202026-Winner-ff6b6b?style=for-the-badge&logo=trophy&logoColor=white)]()
[![Security](https://img.shields.io/badge/Security-WebAuthn%20%2B%20Biometric-4ecdc4?style=for-the-badge&logo=shield&logoColor=white)]()

**Next-Generation Attendance Tracking with AI-Powered Leave Verification**

---

## 🚀 Live Demo

<div align="center">

### **[🌐 Visit NoMoreProxies Live →](https://nomoreproxies-hackcrypt.vercel.app)**

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nomoreproxies-hackcrypt.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)]()

**Frontend:** Deployed on Vercel | **Backend:** Deployed on Render

</div>

</div>

---

## 🌟 Technology Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Rolldown-646cff?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### AI & Security
![Google AI](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![WebAuthn](https://img.shields.io/badge/WebAuthn-Passkeys-FF6B00?style=for-the-badge&logo=webauthn&logoColor=white)
![Tesseract](https://img.shields.io/badge/Tesseract-OCR-3776AB?style=for-the-badge&logo=tesseract&logoColor=white)

### Browser Extension
![Chrome](https://img.shields.io/badge/Chrome-Extension%20V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

</div>

---

## 📖 Overview

**NoMoreProxies** is an intelligent, multi-role attendance and leave management ecosystem designed for modern educational institutions. Built for the HackCrypt 2026 hackathon, it seamlessly integrates **QR-based attendance**, **biometric verification**, **Google Meet tracking**, **AI-powered document verification**, and **real-time analytics** into a unified platform.

The system serves three distinct user roles — **Students**, **Teachers**, and **Admins** — each with tailored dashboards and workflows. Whether marking attendance via QR codes, tracking online class participation through a Chrome extension, or verifying leave applications with AI, NoMoreProxies delivers a frictionless, secure, and scalable solution.

```
Team-Pony-HackCrypt/
├── backend/          # Node.js + Express API with MongoDB, Socket.io, AI services
├── frontend/         # React + Vite SPA with Tailwind CSS, Three.js, Framer Motion
└── meet-extension/   # Chrome Extension (Manifest V3) for Google Meet attendance
```

---

## ✨ Key Features

### 🎓 For Students
- **🔐 Passwordless Authentication** — WebAuthn passkey support with biometric login (fingerprint, face recognition)
- **📱 QR Code Attendance** — Scan session QR codes to mark attendance instantly
- **🌍 Geofencing Validation** — Location-based attendance verification to prevent proxy attendance
- **📊 Real-Time Dashboard** — View attendance trends, upcoming classes, and leave status
- **📝 Leave Application System** — Submit leave requests with document uploads (medical certificates, etc.)
- **📅 Interactive Timetable** — Drag-and-drop schedule management with visual calendar
- **📈 Attendance Analytics** — Track attendance percentage, subject-wise breakdown, and historical trends

### 👨‍🏫 For Teachers
- **🎯 Session Management** — Create attendance sessions with unique QR codes and time limits
- **📡 Real-Time Monitoring** — Live attendance updates via Socket.io as students mark attendance
- **🤖 AI Leave Verification** — Automated document authenticity checks using Google Gemini AI + Tesseract OCR
- **✅ Leave Approval Workflow** — Review, approve, or reject student leave applications
- **📊 Class Analytics** — View attendance statistics, defaulter lists, and session reports
- **📅 Schedule Overview** — Manage teaching timetable and upcoming sessions
- **🔔 Instant Notifications** — Real-time alerts for attendance and leave activities

### 👔 For Admins
- **👥 User Management** — CRUD operations for students, teachers, classes, and subjects
- **📊 CSV Bulk Upload** — Import student/teacher data via CSV with validation
- **🗓️ Timetable Administration** — Create and manage institution-wide schedules
- **🌐 Geofencing Configuration** — Set campus boundaries for location-based attendance
- **📈 System Analytics** — Institution-wide attendance reports and insights
- **🔧 Policy Management** — Configure attendance rules, session timeouts, and system policies

### 🌐 Google Meet Integration (Chrome Extension)
- **🎥 Automated Attendance Tracking** — Scrapes participant lists from Google Meet in real-time
- **⏱️ Join/Leave Timestamps** — Tracks exact join time, leave time, and session duration
- **🔄 Rejoin Detection** — Monitors participant rejoins and calculates total active time
- **📤 Backend Sync** — Pushes attendance data to the backend API automatically
- **🛡️ Privacy-First Design** — Filters out UI elements, URLs, and non-name text with strict validation

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** 18.x or higher
- **MongoDB Atlas** account (or local MongoDB instance)
- **Git**
- **Chrome Browser** (for extension testing)

---

### 🔧 Backend Setup

1. **Navigate to backend directory:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create `.env` file** in `backend/` with the following configuration:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hackcrypt?retryWrites=true&w=majority

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI (for document verification)
GROQ_API_KEY=your_groq_api_key
```

4. **Start the development server:**

```bash
npm run dev
```

The backend will start on **`http://localhost:8000`** with hot-reload enabled via Nodemon.

**Entry Point:** `backend/server.js`

---

### 🎨 Frontend Setup

1. **Navigate to frontend directory:**

```bash
cd frontend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create `.env` file** in `frontend/` with:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Application Metadata
VITE_APP_NAME=NoMpreProxies
VITE_APP_DESCRIPTION=Smart Attendance & Leave Management System
```

> **Note:** Vite requires the `VITE_` prefix for environment variables to be exposed to the client.

4. **Start the development server:**

```bash
npm run dev
```

The frontend will launch on **`http://localhost:5173`** (default Vite port).

**Entry Point:** `frontend/src/main.jsx`

---

### 🔌 Chrome Extension Setup

1. **Navigate to extension directory:**

```bash
cd meet-extension
```

2. **Load the extension in Chrome:**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `meet-extension/` folder

3. **Usage:**

   - Join a Google Meet session
   - Click the extension icon to start tracking
   - Enter a session code (matches backend session)
   - Extension will automatically track participants and sync to backend

**Key Files:**
- `manifest.json` — Extension configuration (Manifest V3)
- `content.js` — DOM scraping and participant detection
- `background.js` — Backend API communication
- `popup/popup.html` — Extension UI

---

## 📂 Project Structure

### Backend Architecture

```
backend/
├── server.js                        # Express app entry point, Socket.io setup
├── config/
│   └── db.js                       # MongoDB connection with Mongoose
├── models/                         # Mongoose schemas
│   ├── User.js                     # Base user model
│   ├── Student.js                  # Student profile
│   ├── Teacher.js                  # Teacher profile
│   ├── Class.js                    # Class/section model
│   ├── Subject.js                  # Subject model
│   ├── AttendanceSession.js        # QR session metadata
│   ├── AttendanceRecord.js         # Individual attendance entries
│   ├── AttendanceAttempt.js        # Failed/flagged attempts
│   ├── AttendanceFlag.js           # Anomaly detection flags
│   ├── LeaveApplication.js         # Leave request model
│   ├── TimetableEntry.js           # Schedule entries
│   ├── SessionQRToken.js           # QR token validation
│   ├── StudentBiometric.js         # Biometric data
│   ├── WebAuthnCredential.js       # Passkey credentials
│   ├── SystemPolicy.js             # System configuration
│   └── AuditLog.js                 # Activity logging
├── controllers/                    # Business logic
│   ├── Admin/
│   │   ├── classController.js      # Class CRUD
│   │   ├── studentController.js    # Student management
│   │   ├── teacherController.js    # Teacher management
│   │   ├── subjectController.js    # Subject management
│   │   ├── timetableController.js  # Schedule management
│   │   └── geofencingController.js # Location policies
│   ├── Student/
│   │   ├── authController.js       # Student authentication
│   │   ├── attendanceController.js # Attendance marking
│   │   ├── leaveController.js      # Leave submission
│   │   ├── biometricController.js  # Face recognition
│   │   ├── webauthnController.js   # Passkey registration
│   │   └── analyticsController.js  # Student analytics
│   ├── Teacher/
│   │   ├── authController.js       # Teacher authentication
│   │   ├── sessionController.js    # Session creation
│   │   └── leaveReviewController.js # Leave approval
│   ├── csvUploadController.js      # Bulk data import
│   ├── documentVerification.js     # AI document analysis
│   └── leaveController.js          # Shared leave logic
├── routes/                         # API endpoints
│   ├── Student/
│   │   ├── authRoutes.js           # POST /api/student/auth/login
│   │   ├── attendanceMarkingRoutes.js # POST /api/student/attendance/mark
│   │   ├── attendanceAnalyticsRoutes.js # GET /api/student/attendance-analytics
│   │   ├── leaveRoutes.js          # POST /api/student/leave
│   │   ├── biometricRoutes.js      # POST /api/student/biometric/verify
│   │   ├── webauthnRoutes.js       # POST /api/student/webauthn/register
│   │   └── geofencingRoutes.js     # GET /api/student/geofencing/validate
│   ├── Teacher/
│   │   ├── authRoutes.js           # POST /api/teacher/auth/login
│   │   ├── attendanceRoutes.js     # POST /api/teacher/attendance/session
│   │   └── leaveRoutes.js          # GET /api/teacher/leave/pending
│   ├── Admin/
│   │   ├── timetableRoutes.js      # CRUD /api/admin/timetable
│   │   ├── geofencingRoutes.js     # CRUD /api/admin/geofencing
│   │   └── csvUploadRoutes.js      # POST /api/admin/csv/upload
│   ├── adminStudentRoutes.js       # CRUD /api/admin/students
│   ├── adminTeacherRoutes.js       # CRUD /api/admin/teachers
│   ├── adminClassRoutes.js         # CRUD /api/admin/classes
│   ├── adminSubjectRoutes.js       # CRUD /api/admin/subjects
│   └── adminTeacherSubjectRoutes.js # Teacher-subject mapping
├── middleware/
│   └── auth.js                     # JWT verification middleware
├── services/
│   └── qrService.js                # QR code generation
└── uploads/                        # Temporary file storage
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── main.jsx                    # React app entry point
│   ├── App.jsx                     # Root component with routing
│   ├── index.css                   # Global Tailwind styles
│   ├── pages/
│   │   ├── Landing.jsx             # Public homepage
│   │   ├── NotFound.jsx            # 404 page
│   │   ├── Student/
│   │   │   ├── Auth.jsx            # Student login/register
│   │   │   ├── StudentDashboard.jsx # Main student dashboard
│   │   │   ├── QRAttendance.jsx    # QR scanner interface
│   │   │   ├── StudentQRScanner.jsx # Camera-based QR scanning
│   │   │   ├── LeaveApplication.jsx # Leave request form
│   │   │   ├── LeaveHistory.jsx    # Leave status tracking
│   │   │   ├── StudentTimetable.jsx # Interactive schedule
│   │   │   ├── Profile.jsx         # Student profile management
│   │   │   └── AttendanceVerification.jsx # Biometric verification
│   │   ├── Teacher/
│   │   │   ├── Auth.jsx            # Teacher login
│   │   │   ├── TeacherDashboard.jsx # Teacher overview
│   │   │   ├── SessionManagement.jsx # Create attendance sessions
│   │   │   ├── LeaveManagement.jsx # Review leave requests
│   │   │   ├── TeacherSchedule.jsx # Teacher timetable
│   │   │   └── QRAttendance.jsx    # Session QR display
│   │   └── Admin/
│   │       ├── AdminDashboard.jsx  # Admin overview
│   │       ├── ManageStudents.jsx  # Student CRUD
│   │       ├── ManageTeachers.jsx  # Teacher CRUD
│   │       ├── ManageClasses.jsx   # Class CRUD
│   │       ├── ManageSubjects.jsx  # Subject CRUD
│   │       ├── TimetableManagement.jsx # Schedule builder
│   │       └── CSVUpload.jsx       # Bulk import interface
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # Radix UI primitives (shadcn/ui)
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── select.jsx
│   │   │   ├── tooltip.jsx
│   │   │   └── ... (40+ components)
│   │   ├── Layout.jsx              # Main layout wrapper
│   │   ├── Navbar.jsx              # Top navigation
│   │   ├── Sidebar.jsx             # Side navigation
│   │   ├── ThemeToggle.jsx         # Dark/light mode switch
│   │   ├── ProtectedRoute.jsx      # Route authentication guard
│   │   └── AnimatedBackground.jsx  # Three.js background effects
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state
│   │   ├── ThemeContext.jsx        # Theme management
│   │   └── SocketContext.jsx       # Socket.io connection
│   ├── hooks/
│   │   ├── useAuth.js              # Authentication hook
│   │   ├── useSocket.js            # Socket.io hook
│   │   ├── useTheme.js             # Theme hook
│   │   └── useToast.js             # Toast notifications
│   ├── services/
│   │   ├── api.js                  # Axios instance configuration
│   │   └── socket.js               # Socket.io client setup
│   └── lib/
│       └── utils.js                # Utility functions (cn, etc.)
├── public/
│   ├── vite.svg
│   └── ... (static assets)
├── index.html
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── components.json                 # shadcn/ui configuration
└── package.json
```

### Meet Extension Architecture

```
meet-extension/
├── manifest.json                   # Extension manifest (V3)
├── content.js                      # Participant scraping logic
├── background.js                   # Background service worker
├── popup/
│   ├── popup.html                  # Extension popup UI
│   ├── popup.js                    # Popup logic
│   └── popup.css                   # Popup styles
├── icons/
│   └── icon128.png                 # Extension icon
├── debug-viewer.html               # Debug interface
└── README.md                       # Extension documentation
```

---

## 🔌 API Reference

### Authentication Endpoints

#### Student Authentication
```http
POST   /api/student/auth/register    # Register new student
POST   /api/student/auth/login       # Login student
POST   /api/student/auth/logout      # Logout student
GET    /api/student/auth/me          # Get current student profile
```

#### Teacher Authentication
```http
POST   /api/teacher/auth/register    # Register new teacher
POST   /api/teacher/auth/login       # Login teacher
GET    /api/teacher/auth/me          # Get current teacher profile
```

### Attendance Endpoints

#### Student Attendance
```http
POST   /api/student/attendance/mark           # Mark attendance via QR
GET    /api/student/attendance-analytics      # Get attendance statistics
GET    /api/student/attendance-analytics/trends # Get attendance trends
```

#### Teacher Session Management
```http
POST   /api/teacher/attendance/session        # Create attendance session
GET    /api/teacher/attendance/session/:id    # Get session details
PUT    /api/teacher/attendance/session/:id    # Update session
DELETE /api/teacher/attendance/session/:id    # Delete session
GET    /api/teacher/attendance/sessions       # Get all sessions
```

### Leave Management Endpoints

#### Student Leave
```http
POST   /api/student/leave                     # Submit leave application
GET    /api/student/leave                     # Get student's leave history
GET    /api/student/leave/:id                 # Get specific leave details
PUT    /api/student/leave/:id                 # Update leave application
DELETE /api/student/leave/:id                 # Cancel leave application
```

#### Teacher Leave Review
```http
GET    /api/teacher/leave/pending             # Get pending leave requests
GET    /api/teacher/leave/all                 # Get all leave requests
PUT    /api/teacher/leave/:id/approve         # Approve leave
PUT    /api/teacher/leave/:id/reject          # Reject leave
POST   /api/teacher/leave/:id/verify-document # AI document verification
GET    /api/teacher/leave/stats               # Leave statistics
```

### Admin Endpoints

#### User Management
```http
# Students
GET    /api/admin/students                    # Get all students
POST   /api/admin/students                    # Create student
PUT    /api/admin/students/:id                # Update student
DELETE /api/admin/students/:id                # Delete student

# Teachers
GET    /api/admin/teachers                    # Get all teachers
POST   /api/admin/teachers                    # Create teacher
PUT    /api/admin/teachers/:id                # Update teacher
DELETE /api/admin/teachers/:id                # Delete teacher
```

#### Academic Management
```http
# Classes
GET    /api/admin/classes                     # Get all classes
POST   /api/admin/classes                     # Create class
PUT    /api/admin/classes/:id                 # Update class
DELETE /api/admin/classes/:id                 # Delete class

# Subjects
GET    /api/admin/subjects                    # Get all subjects
POST   /api/admin/subjects                    # Create subject
PUT    /api/admin/subjects/:id                # Update subject
DELETE /api/admin/subjects/:id                # Delete subject

# Timetable
GET    /api/admin/timetable                   # Get timetable
POST   /api/admin/timetable                   # Create timetable entry
PUT    /api/admin/timetable/:id               # Update entry
DELETE /api/admin/timetable/:id               # Delete entry
```

#### System Configuration
```http
POST   /api/admin/csv/upload                  # Bulk CSV upload
GET    /api/admin/geofencing                  # Get geofencing config
PUT    /api/admin/geofencing                  # Update geofencing
```

### Biometric & Security Endpoints

```http
# WebAuthn (Passkeys)
POST   /api/student/webauthn/register-options # Get registration options
POST   /api/student/webauthn/register         # Register passkey
POST   /api/student/webauthn/login-options    # Get login options
POST   /api/student/webauthn/login            # Login with passkey

# Biometric
POST   /api/student/biometric/register        # Register face data
POST   /api/student/biometric/verify          # Verify face

# Geofencing
GET    /api/student/geofencing/validate       # Validate location
```

---

## 🎯 Feature Breakdown

### 🔐 Multi-Factor Attendance Validation

NoMoreProxies employs a **defense-in-depth** approach to prevent proxy attendance:

1. **QR Code Validation** — Time-limited, session-specific tokens
2. **Geofencing** — GPS-based campus boundary verification
3. **Biometric Verification** — Face recognition using Face-API.js
4. **WebAuthn Passkeys** — Device-bound cryptographic authentication
5. **Anomaly Detection** — Flags suspicious patterns (multiple logins, impossible travel times)

### 🤖 AI-Powered Document Verification

When students submit leave applications with medical certificates or other documents:

1. **OCR Extraction** — Tesseract.js extracts text from images/PDFs
2. **AI Analysis** — Google Gemini AI analyzes document authenticity, consistency, and validity
3. **Confidence Scoring** — Returns verification confidence percentage
4. **Teacher Review** — AI results assist teachers in approval decisions

**Supported Formats:** PDF, JPG, PNG, JPEG

### 📊 Real-Time Analytics

- **Attendance Trends** — Line charts showing attendance over time (Recharts)
- **Subject-Wise Breakdown** — Pie charts for attendance distribution
- **Defaulter Identification** — Auto-flagging students below threshold
- **Session Reports** — Detailed logs with timestamps and geolocation data

### 🌐 Google Meet Integration

The Chrome extension provides **zero-touch attendance** for online classes:

1. Teacher starts a Google Meet session
2. Extension activates and scrapes participant list
3. Tracks join/leave timestamps with millisecond precision
4. Calculates total active duration (handles rejoins)
5. Syncs data to backend via REST API
6. Backend correlates participant names with student records

**Privacy:** Extension filters out UI text, URLs, and meeting codes using strict regex validation.

---

## 🛠️ Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev  # Nodemon with hot-reload
```

**Frontend:**
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production

**Frontend (Vercel):**
```bash
cd frontend
npm run build       # Outputs to dist/
npm run preview     # Preview production build
```

**Backend (Render):**
```bash
cd backend
npm start           # Production mode (no hot-reload)
```

### Deployment

**Frontend:** Deployed on [Vercel](https://vercel.com) with automatic deployments from Git  
**Backend:** Deployed on [Render](https://render.com) with continuous deployment  
**Live URL:** [https://nomoreproxies-hackcrypt.vercel.app](https://nomoreproxies-hackcrypt.vercel.app)

### Environment-Specific Configuration

**Production Checklist:**
- [ ] Set `NODE_ENV=production` in backend `.env`
- [ ] Update `VITE_API_URL` to production domain
- [ ] Use strong MongoDB credentials with IP whitelisting
- [ ] Enable MongoDB connection pooling
- [ ] Configure CORS to allow only production frontend origin
- [ ] Use HTTPS for all endpoints
- [ ] Rotate JWT secrets regularly
- [ ] Enable Cloudinary signed uploads
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure rate limiting on API routes

### Code Quality

**Linting:**
```bash
cd frontend
npm run lint        # ESLint with React hooks plugin
```

**Testing:**
```bash
# Add your test commands here
npm test
```

---

## 🔒 Security Features

- **JWT Authentication** — Stateless token-based auth with HTTP-only cookies
- **WebAuthn (FIDO2)** — Passwordless authentication with biometric devices
- **Bcrypt Hashing** — Password encryption with salt rounds
- **CORS Protection** — Strict origin whitelisting
- **Input Validation** — Mongoose schema validation + sanitization
- **Rate Limiting** — (Recommended: Add express-rate-limit)
- **Geofencing** — Location-based access control
- **Audit Logging** — All critical actions logged to `AuditLog` collection

---

## 📱 Responsive Design

NoMoreProxies is fully responsive across devices:

- **Desktop** — Full-featured dashboards with multi-column layouts
- **Tablet** — Optimized grid layouts with touch-friendly controls
- **Mobile** — Single-column layouts with bottom navigation
- **PWA-Ready** — (Add service worker for offline support)

Built with **Tailwind CSS 4** and **Framer Motion** for smooth animations.

---

## 🎨 UI/UX Highlights

- **Dark/Light Mode** — Persistent theme with `next-themes`
- **3D Backgrounds** — Three.js particle effects and animated gradients
- **Micro-Interactions** — Framer Motion animations on hover, click, and page transitions
- **Glassmorphism** — Modern frosted-glass UI elements
- **Accessibility** — Radix UI primitives with ARIA support
- **Toast Notifications** — Real-time feedback with Sonner
- **Drag-and-Drop** — Timetable management with `@dnd-kit`

---

## 🚧 Roadmap

- [ ] **Mobile App** — React Native version for iOS/Android
- [ ] **Offline Mode** — Service worker for offline attendance marking
- [ ] **Blockchain Verification** — Immutable attendance records on blockchain
- [ ] **Advanced Analytics** — Predictive models for attendance forecasting
- [ ] **Multi-Language Support** — i18n for regional languages
- [ ] **Parent Portal** — Real-time attendance notifications for parents
- [ ] **Integration APIs** — Webhooks for third-party LMS platforms
- [ ] **Video Proctoring** — AI-based exam monitoring

---

## 👥 Contributors

**Team Pony** — HackCrypt 2026

- **Aliqyaan** — Full-Stack Developer & Team Lead
- **Gavin** — Full-Stack Developer 
- **Reniyas** — Full-Stack Developer 
- **Romeiro** — Full-Stack Developer 
- **Russel** — Full-Stack Developer 



---

## 📄 License

This project was created for **HackCrypt 2026** and is intended for educational and portfolio purposes.

---

## 🙏 Acknowledgments

- **Google Gemini AI** — Document verification
- **Tesseract.js** — OCR capabilities
- **Radix UI** — Accessible component primitives
- **shadcn/ui** — Beautiful component library
- **Cloudinary** — Media storage and optimization
- **MongoDB Atlas** — Cloud database hosting

---

<div align="center">

**Built with ❤️ for the future of education**

[![GitHub](https://img.shields.io/badge/GitHub-Team--Pony--HackCrypt-181717?style=for-the-badge&logo=github)](https://github.com/Team-Pony-HackCrypt)
[![Live Demo](https://img.shields.io/badge/Live-Demo-00d4ff?style=for-the-badge&logo=vercel)](https://nomoreproxies-hackcrypt.vercel.app)

**🔐 Secure • 🚀 Fast • 🎨 Beautiful • 🤖 Intelligent**

</div>