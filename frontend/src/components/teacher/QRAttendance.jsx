import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Square, CheckCircle2, Users, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QRAttendance = () => {
    const [isActive, setIsActive] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [lectureInfo, setLectureInfo] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);
    const [countdown, setCountdown] = useState(15);
    const [loading, setLoading] = useState(false);
    const [showStartSession, setShowStartSession] = useState(false);
    const [lecturesToday, setLecturesToday] = useState([]);
    const [selectedLectureId, setSelectedLectureId] = useState('');
    const [methodToggles, setMethodToggles] = useState({
        enable_face: true,
        enable_biometric: false,
        enable_geofencing: false,
        enable_static_qr: false,
        enable_dynamic_qr: true
    });
    const [loadingLectures, setLoadingLectures] = useState(true);

    const socketRef = useRef(null);
    const refreshTimerRef = useRef(null);
    const countdownTimerRef = useRef(null);
    const sessionIdRef = useRef(null);
    const { toast } = useToast();

    // Fetch today's lectures for dropdown
    useEffect(() => {
        async function fetchLectures() {
            setLoadingLectures(true);
            try {
                const token = localStorage.getItem('teacherToken');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/today-lectures`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setLecturesToday(data.lectures);
                    if (data.lectures.length > 0) setSelectedLectureId(data.lectures[0]._id);
                } else {
                    setLecturesToday([]);
                }
            } catch (err) {
                setLecturesToday([]);
            } finally {
                setLoadingLectures(false);
            }
        }
        fetchLectures();
    }, []);

    // Initialize Socket.IO connection
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to Socket.IO server');
            console.log('Socket ID:', socketRef.current.id);
            
            // Rejoin session if we were in one
            if (sessionIdRef.current && isActive) {
                console.log('Reconnecting - rejoining session:', sessionIdRef.current);
                socketRef.current.emit('joinSession', sessionIdRef.current);
            }
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socketRef.current.on('studentAttendance', (data) => {
            console.log('Student attendance received:', data);
            
            // Add to attendance list
            setAttendanceList(prev => [{
                ...data.student,
                timestamp: data.timestamp
            }, ...prev]);

            // Show toast notification
            toast({
                title: "Attendance Marked! ✓",
                description: `${data.student.name} (${data.student.roll_no}) - ${data.student.class}`,
                duration: 4000,
            });
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [toast]);

    // Start QR attendance session
    const startAttendance = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('teacherToken');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/qr/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setQrCode(data.data.qrCode);
                setSessionId(data.data.sessionId);
                sessionIdRef.current = data.data.sessionId; // Store in ref for reconnections
                setLectureInfo(data.data.lecture);
                setIsActive(true);
                setAttendanceList([]);
                setCountdown(120);

                // Join socket room for this session
                console.log('Joining session room:', data.data.sessionId);
                console.log('Socket connected?', socketRef.current?.connected);
                socketRef.current.emit('joinSession', data.data.sessionId);
                console.log('Joined session room');

                // Start refresh timer
                startRefreshTimer(data.data.sessionId);

                toast({
                    title: "QR Attendance Started",
                    description: `Session started for ${data.data.lecture.subject}`,
                });
            } else {
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Start attendance error:', error);
            toast({
                title: "Error",
                description: "Failed to start attendance session",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Refresh QR code every 2 minutes for testing
    const startRefreshTimer = (sid) => {
        // Clear existing timers
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        // Countdown timer
        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    return 120;
                }
                return prev - 1;
            });
        }, 1000);

        // Refresh QR timer (120 seconds for testing)
        refreshTimerRef.current = setInterval(async () => {
            await refreshQR(sid);
        }, 120000);
    };

    // Refresh QR code
    const refreshQR = async (sid) => {
        try {
            const token = localStorage.getItem('teacherToken');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/qr/refresh/${sid}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setQrCode(data.data.qrCode);
                setCountdown(120);
            }
        } catch (error) {
            console.error('Refresh QR error:', error);
        }
    };

    // Stop attendance session
    const stopAttendance = async () => {
        try {
            const token = localStorage.getItem('teacherToken');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/qr/stop/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Leave socket room
                socketRef.current.emit('leaveSession', sessionId);

                // Clear timers
                if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

                setIsActive(false);
                setQrCode(null);
                setSessionId(null);
                sessionIdRef.current = null; // Clear ref
                setCountdown(120);

                toast({
                    title: "Session Ended",
                    description: `Total present: ${attendanceList.length} students`,
                });
            }
        } catch (error) {
            console.error('Stop attendance error:', error);
            toast({
                title: "Error",
                description: "Failed to stop attendance session",
                variant: "destructive"
            });
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, []);

    const handleToggle = (key) => {
        setMethodToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleStartSession = async () => {
        if (!selectedLectureId) {
            toast({
                title: "Error",
                description: "Please select a lecture",
                variant: "destructive"
            });
            return;
        }
        const token = localStorage.getItem('teacherToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/start-session`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...methodToggles,
                timetableEntryId: selectedLectureId
            })
        });
        const data = await res.json();
        if (data.success) {
            toast({
                title: "Success",
                description: "Attendance session started!"
            });
            setShowStartSession(false);
        } else {
            toast({
                title: "Error",
                description: data.message || 'Failed to start session',
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-6 w-6" />
                        QR Code Attendance
                    </CardTitle>
                    <CardDescription>
                        {isActive 
                            ? 'Students can scan the QR code to mark their attendance' 
                            : 'Start a QR attendance session for your current lecture'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isActive ? (
                        <div className="flex flex-wrap gap-3">
                            <Button 
                                onClick={startAttendance} 
                                disabled={loading}
                                className="w-full sm:w-auto"
                            >
                                <QrCode className="mr-2 h-4 w-4" />
                                {loading ? 'Starting...' : 'Start QR Attendance'}
                            </Button>
                            <Button 
                                onClick={() => setShowStartSession(true)}
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                Start Attendance Session
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            onClick={stopAttendance} 
                            variant="destructive"
                            className="w-full sm:w-auto"
                        >
                            <Square className="mr-2 h-4 w-4" />
                            Stop Attendance
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Active Session */}
            {isActive && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* QR Code Display */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Scan QR Code</span>
                                <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Refreshes in {countdown}s
                                </div>
                            </CardTitle>
                            {lectureInfo && (
                                <CardDescription>
                                    {lectureInfo.subject} - {lectureInfo.class}
                                    <br />
                                    {lectureInfo.slot.name} ({lectureInfo.slot.start_time} - {lectureInfo.slot.end_time})
                                    {lectureInfo.room && ` • ${lectureInfo.room}`}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center space-y-4">
                                {qrCode && (
                                    <div className="relative">
                                        <img 
                                            src={qrCode} 
                                            alt="QR Code" 
                                            className="w-64 h-64 border-4 border-primary rounded-lg shadow-lg"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-white p-2 rounded-full shadow-md">
                                                <QrCode className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground text-center">
                                    Students should scan this code to mark attendance
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Present Students ({attendanceList.length})
                            </CardTitle>
                            <CardDescription>
                                Real-time attendance updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {attendanceList.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p>No students marked present yet</p>
                                    </div>
                                ) : (
                                    attendanceList.map((student, index) => (
                                        <div 
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200 animate-in slide-in-from-top-2"
                                        >
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-sm">{student.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {student.roll_no} • {student.class}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(student.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Start Attendance Session Modal */}
            {showStartSession && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowStartSession(false)}>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4">Start Attendance Session</h2>
                        <div className="mb-4">
                            <label className="block mb-2 font-medium">Select Lecture</label>
                            {loadingLectures ? (
                                <div className="text-muted-foreground">Loading lectures...</div>
                            ) : (
                                <select
                                    value={selectedLectureId}
                                    onChange={e => setSelectedLectureId(e.target.value)}
                                    className="w-full mb-4 p-2 border rounded bg-background"
                                >
                                    <option value="">Select Lecture</option>
                                    {lecturesToday.map(lec => (
                                        <option key={lec._id} value={lec._id}>
                                            {lec.teacher_subject_id.subject_id.name} - {lec.class_id.name} ({lec.slot_id.start_time}-{lec.slot_id.end_time})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="space-y-3 mb-6">
                            {Object.keys(methodToggles).map(key => (
                                <label key={key} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={methodToggles[key]}
                                        onChange={() => handleToggle(key)}
                                        className="rounded"
                                    />
                                    <span className="capitalize text-sm">{key.replace('enable_', '').replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleStartSession}
                            >
                                Start
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowStartSession(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}        </div>
    );
};

export default QRAttendance;
