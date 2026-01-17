import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { cn } from '@/lib/utils';
import { useStudent } from '@/context/StudentContext';
import { toast } from 'sonner';
import {
  TrendingUp,
  Calendar,
  Award,
  Activity,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Target,
  CalendarClock,
  Calculator
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StudentDashboard = () => {
  const { student } = useStudent();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWhatIf, setShowWhatIf] = useState({});

  useEffect(() => {
    const targetId = student?.student_id || student?.id || student?._id;

    if (targetId) {
      fetchAttendanceAnalytics(targetId);
    } else {
      setLoading(false);
    }
  }, [student]);

  const fetchAttendanceAnalytics = async (studentId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/student/attendance-analytics/analytics/${studentId}`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Could not load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate what-if percentage
  const calculateWhatIfMiss = (subject) => {
    const newPresent = subject.present;
    const newTotal = subject.total + 1;
    return ((newPresent / newTotal) * 100).toFixed(1);
  };

  // Helper function to get subject colors
  const getSubjectColor = (index) => {
    const colors = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899'
    ];
    return colors[index % colors.length];
  };

  // Helper function to get accent color based on trend
  const getStatColor = (trend) => {
    if (trend === 'positive') return 'bg-emerald-50 border-emerald-200';
    if (trend === 'negative') return 'bg-orange-50 border-orange-200';
    return 'bg-slate-50 border-slate-200';
  };

  const getStatIconColor = (trend) => {
    if (trend === 'positive') return 'bg-emerald-100 text-emerald-600';
    if (trend === 'negative') return 'bg-orange-100 text-orange-600';
    return 'bg-slate-100 text-slate-600';
  };

  // Helper function to get subtle encouragement message
  const getEncouragementMessage = (subject) => {
    const rate = parseFloat(subject.rate);
    
    if (rate >= 85) {
      return "Excellent consistency! Your dedication is truly commendable.";
    } else if (rate >= 75) {
      return "You're doing well. Maintaining this pace will keep you comfortably above the threshold.";
    } else if (rate >= 65) {
      return "A few more attended lectures will put you in a much safer position.";
    } else if (rate >= 55) {
      return "Every lecture counts now. Each attendance significantly improves your standing.";
    } else {
      return "This is the perfect time to turn things around. Every lecture you attend makes a real difference.";
    }
  };

  // Process timeline data for multi-line chart
  const processTimelineForChart = () => {
    if (!analytics || !analytics.subjectTimelines) return [];
    
    const dateMap = new Map();
    
    // Collect all dates and initialize
    Object.entries(analytics.subjectTimelines).forEach(([subjectId, timeline]) => {
      timeline.forEach(entry => {
        const date = new Date(entry.date).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
      });
    });

    // Ensure today's date exists so the rightmost point is always today
    const today = new Date().toISOString().split('T')[0];
    if (!dateMap.has(today)) {
      dateMap.set(today, { date: today });
    }

    // Initialize every date entry with all subject keys set to null for consistent series
    const subjectCodes = (analytics.subjectWiseAnalytics || []).map(s => s.subjectCode);
    for (const dataEntry of dateMap.values()) {
      subjectCodes.forEach(code => {
        if (!(code in dataEntry)) dataEntry[code] = null;
      });
    }

    // Add subject data to each date (overwrite nulls where data exists)
    analytics.subjectWiseAnalytics.forEach((subject) => {
      const timeline = analytics.subjectTimelines[subject.subjectId];
      if (timeline) {
        timeline.forEach(entry => {
          const date = new Date(entry.date).toISOString().split('T')[0];
          const dataPoint = dateMap.get(date);
          if (dataPoint) {
            dataPoint[subject.subjectCode] = parseFloat(entry.rate);
          }
        });
      }
    });

    // Convert to array and sort by date ascending, then take the last 30 days (including today)
    const sortedData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days

    return sortedData;
  };

  // Stats cards using actual data
  const stats = analytics ? [
    {
      title: 'Attendance Rate',
      value: `${analytics.overview.overallAttendanceRate}%`,
      icon: TrendingUp,
      trend: analytics.overview.overallAttendanceRate >= 75 ? 'positive' : 'negative'
    },
    {
      title: 'Classes Today',
      value: analytics.overview.classesToday,
      icon: Calendar
    },
    {
      title: 'Performance Score',
      value: analytics.overview.performanceScore,
      icon: Award
    },
    {
      title: 'Total Lectures',
      value: analytics.overview.totalLectures,
      icon: BookOpen
    }
  ] : [];

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      <main className="flex-1 min-h-screen w-full transition-all duration-300 md:ml-64 ml-0 bg-background pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 mt-1 items-center justify-between border-b bg-background px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
              <Activity className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Welcome back, {student?.name?.split(' ')[0] || 'Student'}</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Loading analytics...</p>
              </div>
            </div>
          ) : !analytics ? (
            <div className="rounded-lg border border-muted bg-muted/5 p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Attendance Data</h3>
              <p className="text-sm text-muted-foreground">
                Start attending classes to see your analytics here.
              </p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative group"
                  >
                    <div className={`h-full p-6 rounded-lg border bg-card transition-all hover:shadow-md ${getStatColor(stat.trend)}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${getStatIconColor(stat.trend)}`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        {stat.trend === 'positive' && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        )}
                        {stat.trend === 'negative' && (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        {stat.title}
                      </h3>
                      <p className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Attendance Trend Line Chart */}
              {analytics.timelineData && analytics.timelineData.length > 0 && (
                <div className="rounded-lg border bg-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">Attendance Trend</h2>
                      <p className="text-xs text-muted-foreground">Last 30 days by subject</p>
                    </div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={processTimelineForChart()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [`${value}%`]}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                      {analytics.subjectWiseAnalytics.map((subject, index) => (
                        <Line
                          key={subject.subjectId}
                          type="monotone"
                          dataKey={subject.subjectCode}
                          name={subject.subjectName}
                          stroke={getSubjectColor(index)}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: getSubjectColor(index) }}
                          activeDot={{ r: 6, fill: getSubjectColor(index) }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Subject-wise Analytics */}
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Subject-wise Analysis</h2>
                    <p className="text-xs text-muted-foreground">75% minimum · Semester ends April 30, 2026</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {analytics.subjectWiseAnalytics && analytics.subjectWiseAnalytics.length > 0 ? (
                    analytics.subjectWiseAnalytics.map((subject) => (
                      <div
                        key={subject.subjectId}
                        className="p-5 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base">{subject.subjectName}</h3>
                              <span className="text-xs px-2 py-0.5 rounded bg-foreground/5 text-foreground font-medium">
                                {subject.subjectCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{subject.present} / {subject.total} lectures</span>
                              {subject.projection && (
                                <span className="flex items-center gap-1">
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  {subject.projection.daysRemaining} days remaining
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-foreground">
                              {subject.rate}%
                            </div>
                            {parseFloat(subject.rate) >= 75 ? (
                              <CheckCircle2 className="w-6 h-6 text-foreground" />
                            ) : (
                              <AlertCircle className="w-6 h-6 text-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                            style={{ width: `${Math.min(100, subject.rate)}%` }}
                          />
                        </div>

                        {/* Projection Info */}
                        {subject.projection && (
                          <div className="grid md:grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Target className="w-3.5 h-3.5 text-blue-600" />
                                <p className="text-xs font-medium text-blue-700">Projected Total</p>
                              </div>
                              <p className="text-xl font-bold text-blue-900">{subject.projection.totalProjectedLectures}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                +{subject.projection.estimatedRemainingLectures} remaining
                              </p>
                            </div>

                            {subject.projection.currentlyAbove75 ? (
                              <div className="text-center p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <p className="text-xs font-medium text-emerald-700">Can Miss</p>
                                </div>
                                <p className="text-xl font-bold text-emerald-900">{subject.projection.canAffordToMiss}</p>
                                <p className="text-xs text-emerald-600 mt-1">lectures safely</p>
                              </div>
                            ) : (
                              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                                  <p className="text-xs font-medium text-orange-700">Must Attend</p>
                                </div>
                                <p className="text-xl font-bold text-orange-900">{subject.projection.mustAttend}</p>
                                <p className="text-xs text-orange-600 mt-1">lectures minimum</p>
                              </div>
                            )}

                            <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-md">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                                <p className="text-xs font-medium text-purple-700">75% Target</p>
                              </div>
                              <p className="text-xl font-bold text-purple-900">{subject.projection.requiredForMinimum}</p>
                              <p className="text-xs text-purple-600 mt-1">lectures needed</p>
                            </div>
                          </div>
                        )}

                        {/* Status Message */}
                        <div className="p-3 rounded-md text-sm border mb-3" style={{
                          backgroundColor: subject.projection?.currentlyAbove75 ? '#f0fdf4' : '#fef3c7',
                          borderColor: subject.projection?.currentlyAbove75 ? '#bbf7d0' : '#fde68a'
                        }}>
                          <div className="flex items-start gap-2">
                            {subject.projection?.currentlyAbove75 ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                                <span className="text-emerald-800">You're on track. Keep it up to maintain above 75%.</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-700" />
                                <span className="text-amber-800">Action needed. Attend at least {subject.projection?.mustAttend} more lectures to reach 75%.</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* What-If Calculator and Encouragement */}
                        <div className="space-y-3">
                          <button
                            onClick={() => setShowWhatIf(prev => ({ ...prev, [subject.subjectId]: !prev[subject.subjectId] }))}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border rounded-md bg-card hover:bg-foreground/5 transition-colors"
                          >
                            <Calculator className="w-4 h-4" />
                            <span>What if I miss one lecture?</span>
                          </button>

                          {showWhatIf[subject.subjectId] && (
                            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-blue-700 font-medium">New percentage:</span>
                                <span className="font-bold text-lg text-blue-900">{calculateWhatIfMiss(subject)}%</span>
                              </div>
                              <div className="text-xs text-blue-600">
                                {parseFloat(calculateWhatIfMiss(subject)) < 75 ? (
                                  <span>Missing one more lecture would put you below the 75% threshold.</span>
                                ) : parseFloat(calculateWhatIfMiss(subject)) < 80 ? (
                                  <span>You'd still be above the minimum, but your buffer would be reduced.</span>
                                ) : (
                                  <span>You'd remain in a safe zone, but consistency is key.</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Subtle Encouragement */}
                          <div className="p-3 rounded-md bg-gradient-to-r from-slate-50 to-slate-100 text-xs text-slate-600 italic border border-slate-200">
                            {getEncouragementMessage(subject)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No subject data available yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Welcome Section */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Welcome, {student?.name || student?.full_name || 'Student'}!
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track your attendance, monitor your progress, and stay on top of your academic goals. 
                  The dashboard provides real-time insights into your attendance patterns and helps you plan ahead.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
              