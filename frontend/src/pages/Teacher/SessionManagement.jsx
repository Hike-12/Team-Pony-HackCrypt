import React, { useState, useEffect } from 'react';
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Clock, 
  Users, 
  StopCircle, 
  CheckCircle, 
  QrCode,
  Calendar,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SessionManagement = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('teacherToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teacher/attendance/active-sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPresentStudents = async (sessionId) => {
    try {
      const token = localStorage.getItem('teacherToken');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/teacher/attendance/qr/session/${sessionId}/attendance`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.success) {
        console.log("BACHA", data);
        setPresentStudents(data.data.records);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    console.log("SESSION", session);
    await fetchPresentStudents(session._id);
  };

  const handleEndSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('teacherToken');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/teacher/attendance/qr/stop/${sessionId}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success('Session ended successfully');
        setActiveSessions(prev => prev.filter(s => s._id !== sessionId));
        if (selectedSession?._id === sessionId) {
          setSelectedSession(null);
          setPresentStudents([]);
        }
      } else {
        toast.error(data.message || 'Failed to end session');
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <TeacherSidebar />
      <main className="flex-1 w-full ml-64 bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur">
          <h1 className="text-lg font-semibold">Active Sessions</h1>
          <Badge variant="outline" className="ml-auto">
            {activeSessions.length} Active
          </Badge>
        </header>

        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sessions List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Active Attendance Sessions
                  </CardTitle>
                  <CardDescription>
                    Click on a session to view attendance details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading sessions...
                    </div>
                  ) : activeSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No active sessions</p>
                      <p className="text-sm mt-2">Start a session from the dashboard</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSessions.map(session => (
                        <Card
                          key={session._id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedSession?._id === session._id && "ring-2 ring-primary"
                          )}
                          onClick={() => handleViewSession(session)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">
                                  {session.teacher_subject_id?.subject_id?.name || 'Subject'}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{session.teacher_subject_id?.class_id?.name || 'Class'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span>{session.room_label || 'Room'}</span>
                                </div>
                              </div>
                              <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                                Active
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm pt-3 border-t">
                              <span className="text-muted-foreground">
                                Started: {formatTime(session.starts_at)}
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEndSession(session._id);
                                }}
                              >
                                <StopCircle className="h-4 w-4 mr-1" />
                                End
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Present Students List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students Present
                  </CardTitle>
                  <CardDescription>
                    {selectedSession
                      ? `Viewing attendance for ${selectedSession.teacher_subject_id?.subject_id?.name || 'session'}`
                      : 'Select a session to view attendance'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedSession ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>Select a session to view present students</p>
                    </div>
                  ) : presentStudents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>No students marked present yet</p>
                      <p className="text-sm mt-2">Waiting for students to mark attendance...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
                        <span className="font-semibold">Total Present:</span>
                        <Badge className="bg-primary/10 text-primary">
                          {presentStudents.length} Students
                        </Badge>
                      </div>
<div className="space-y-2 max-h-[600px] overflow-y-auto">
  {presentStudents.map((record, index) => (
    <Card key={record.student?.id || index} className="bg-card/50">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{record.student?.name || 'Unknown'}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Roll: {record.student?.roll_no || 'N/A'}</span>
                <span>•</span>
                <span>{record.student?.class || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-600">
              {formatTime(record.markedAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {record.status || 'Verified'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionManagement;
