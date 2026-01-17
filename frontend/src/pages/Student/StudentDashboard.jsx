import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { cn } from '@/lib/utils';
import { useStudent } from '@/context/StudentContext';
import { toast } from 'sonner';
import {
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Target,
  CalendarClock,
  Calculator,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const StudentDashboard = () => {
  const { student } = useStudent();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);

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

  const calculateWhatIfMiss = (subject) => {
    const newPresent = subject.present;
    const newTotal = subject.total + 1;
    return ((newPresent / newTotal) * 100).toFixed(1);
  };

  const getSubjectColor = (index) => {
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
    ];
    return colors[index % colors.length];
  };

  const processTimelineForChart = () => {
    if (!analytics || !analytics.subjectTimelines) return [];

    const dateMap = new Map();

    Object.entries(analytics.subjectTimelines).forEach(([subjectId, timeline]) => {
      timeline.forEach(entry => {
        const date = new Date(entry.date).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
      });
    });

    const today = new Date().toISOString().split('T')[0];
    if (!dateMap.has(today)) {
      dateMap.set(today, { date: today });
    }

    const subjectCodes = (analytics.subjectWiseAnalytics || []).map(s => s.subjectCode);
    for (const dataEntry of dateMap.values()) {
      subjectCodes.forEach(code => {
        if (!(code in dataEntry)) dataEntry[code] = null;
      });
    }

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

    // Sort by date ASCENDING (oldest to newest) so today appears at the RIGHT end
    const sortedData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    return sortedData;
  };

  const getAttendanceStatus = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 75) return {
      label: 'Excellent',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500'
    };
    if (numRate >= 60) return {
      label: 'At Risk',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500'
    };
    return {
      label: 'Critical',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500'
    };
  };

  const displayedSubject = selectedSubject
    ? analytics?.subjectWiseAnalytics?.find(s => s.subjectId === selectedSubject)
    : null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <StudentSidebar />
      <main className="flex-1 min-h-screen w-full transition-all duration-300 md:ml-64 ml-0 pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {student?.name || 'Student'}
          </p>
        </header>

        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : !analytics ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-1">No Attendance Data</h3>
              <p className="text-sm text-muted-foreground">
                Start attending classes to see your analytics here.
              </p>
            </div>
          ) : (
            <>
              {/* 3-Card Stats Grid */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                {/* Today's Classes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border bg-card p-6"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Today's Classes
                      </p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-foreground mb-1">
                        {analytics.overview.classesToday}
                      </p>
                      <p className="text-xs text-muted-foreground">Scheduled for today</p>
                    </div>
                  </div>
                </motion.div>

                {/* Total Lectures */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-lg border bg-card p-6"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total Lectures
                      </p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-foreground mb-1">
                        {analytics.overview.totalLectures}
                      </p>
                      <p className="text-xs text-muted-foreground">Attended so far</p>
                    </div>
                  </div>
                </motion.div>

                {/* Performance Score */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-lg border bg-card p-6"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Performance
                      </p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-foreground mb-1">
                        {analytics.overview.performanceScore}
                      </p>
                      <p className="text-xs text-muted-foreground">Overall score</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Attendance Trend Chart */}
              {analytics.timelineData && analytics.timelineData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-lg border bg-card p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">Attendance Trend</h2>
                      <p className="text-xs text-muted-foreground">Last 30 days performance</p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={processTimelineForChart()}>
                      <defs>
                        {analytics.subjectWiseAnalytics.map((subject, index) => (
                          <linearGradient key={subject.subjectId} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getSubjectColor(index)} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={getSubjectColor(index)} stopOpacity={0.05} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="hsl(var(--border))"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        stroke="hsl(var(--border))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [`${value}%`]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                      />
                      {analytics.subjectWiseAnalytics.map((subject, index) => (
                        <Area
                          key={subject.subjectId}
                          type="monotone"
                          dataKey={subject.subjectCode}
                          name={subject.subjectName}
                          stroke={getSubjectColor(index)}
                          strokeWidth={2.5}
                          fill={`url(#gradient${index})`}
                          connectNulls
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Subject Cards - Grid Layout */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Subject Performance</h2>
                    <p className="text-xs text-muted-foreground">Click any subject for detailed analysis</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {analytics.subjectWiseAnalytics && analytics.subjectWiseAnalytics.length > 0 ? (
                    analytics.subjectWiseAnalytics.map((subject, idx) => {
                      const subjectStatus = getAttendanceStatus(subject.rate);
                      const isSelected = selectedSubject === subject.subjectId;

                      return (
                        <motion.div
                          key={subject.subjectId}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * idx }}
                          onClick={() => setSelectedSubject(isSelected ? null : subject.subjectId)}
                          className={cn(
                            "rounded-lg border bg-card p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                            isSelected && "ring-2 ring-primary shadow-lg"
                          )}
                        >
                          {/* Subject Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getSubjectColor(idx) }}
                                />
                                <h3 className="font-bold text-sm">{subject.subjectName}</h3>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                {subject.subjectCode}
                              </span>
                            </div>
                          </div>

                          {/* Attendance Circle */}
                          <div className="flex items-center justify-center mb-4">
                            <div className="relative w-28 h-28">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="56"
                                  cy="56"
                                  r="50"
                                  stroke="hsl(var(--muted))"
                                  strokeWidth="8"
                                  fill="none"
                                />
                                <circle
                                  cx="56"
                                  cy="56"
                                  r="50"
                                  stroke={getSubjectColor(idx)}
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${(parseFloat(subject.rate) / 100) * 314} 314`}
                                  strokeLinecap="round"
                                  className="transition-all duration-700"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-foreground">
                                  {subject.rate}%
                                </span>
                                <span className={cn("text-xs font-medium", subjectStatus.color)}>
                                  {subjectStatus.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="text-center p-2 bg-muted/30 rounded-md">
                              <p className="text-xs text-muted-foreground mb-0.5">Present</p>
                              <p className="text-lg font-bold text-foreground">{subject.present}</p>
                            </div>
                            <div className="text-center p-2 bg-muted/30 rounded-md">
                              <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                              <p className="text-lg font-bold text-foreground">{subject.total}</p>
                            </div>
                          </div>

                          {/* View Details Indicator */}
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span>{isSelected ? 'Click to collapse' : 'Click for details'}</span>
                            <ChevronDown className={cn(
                              "w-3.5 h-3.5 transition-transform",
                              isSelected && "rotate-180"
                            )} />
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No subject data available</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Selected Subject Details */}
              <AnimatePresence>
                {displayedSubject && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border bg-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold mb-1">{displayedSubject.subjectName} - Detailed Analysis</h3>
                          <p className="text-sm text-muted-foreground">Comprehensive breakdown and projections</p>
                        </div>
                        <button
                          onClick={() => setSelectedSubject(null)}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Close
                        </button>
                      </div>

                      {/* Projection Cards */}
                      {displayedSubject.projection && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Projected Total</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                              {displayedSubject.projection.totalProjectedLectures}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                              +{displayedSubject.projection.estimatedRemainingLectures} remaining
                            </p>
                          </div>

                          {displayedSubject.projection.currentlyAbove75 ? (
                            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Can Miss</p>
                              </div>
                              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                                {displayedSubject.projection.canAffordToMiss}
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">lectures safely</p>
                            </div>
                          ) : (
                            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Must Attend</p>
                              </div>
                              <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                                {displayedSubject.projection.mustAttend}
                              </p>
                              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">lectures minimum</p>
                            </div>
                          )}

                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">75% Target</p>
                            </div>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                              {displayedSubject.projection.requiredForMinimum}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">lectures needed</p>
                          </div>

                          <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900/30 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <CalendarClock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">Days Left</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-300">
                              {displayedSubject.projection.daysRemaining}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">until semester end</p>
                          </div>
                        </div>
                      )}

                      {/* What-If Calculator */}
                      <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <div>
                              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">What if I miss one lecture?</p>
                              <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-0.5">
                                {parseFloat(calculateWhatIfMiss(displayedSubject)) < 75 ? (
                                  "⚠️ You would fall below the 75% threshold"
                                ) : parseFloat(calculateWhatIfMiss(displayedSubject)) < 80 ? (
                                  "Your buffer would be reduced"
                                ) : (
                                  "You'd remain in a safe zone"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-indigo-600 dark:text-indigo-500">New percentage</p>
                            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">
                              {calculateWhatIfMiss(displayedSubject)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;