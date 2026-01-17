import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSidebarState } from '@/hooks/useSidebarState';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const isExpanded = useSidebarState();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/analytics/overview`,
        { credentials: 'include' }
      );

      if (!res.ok) throw new Error('Failed to fetch analytics');

      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Could not load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'departments', label: 'Departments', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'trends', label: 'Time Trends', icon: TrendingUp },
    { id: 'verification', label: 'Verification Methods', icon: Award },
  ];

  const renderDepartmentsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Best and Worst Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Departments */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">Best Performing Departments</h3>
              <p className="text-xs text-muted-foreground">Highest attendance rates</p>
            </div>
          </div>
          <div className="space-y-3">
            {analytics?.bestDepartments?.map((dept, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{dept.className}</p>
                  <p className="text-xs text-muted-foreground">{dept.teacherCount} teachers</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{dept.attendanceRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{dept.totalStudents} students</p>
                </div>
              </div>
            )) || <p className="text-muted-foreground text-sm">No data</p>}
          </div>
        </Card>

        {/* Worst Departments */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold">Lowest Performing Departments</h3>
              <p className="text-xs text-muted-foreground">Lowest attendance rates</p>
            </div>
          </div>
          <div className="space-y-3">
            {analytics?.worstDepartments?.map((dept, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{dept.className}</p>
                  <p className="text-xs text-muted-foreground">{dept.teacherCount} teachers</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{dept.attendanceRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{dept.totalStudents} students</p>
                </div>
              </div>
            )) || <p className="text-muted-foreground text-sm">No data</p>}
          </div>
        </Card>
      </div>

      {/* Department Attendance Chart */}
      {analytics?.departmentAttendance && analytics.departmentAttendance.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Department-wise Attendance</h2>
              <p className="text-xs text-muted-foreground">Overall attendance by department</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.departmentAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="rate" fill="#3b82f6" name="Attendance %" />
              <Bar dataKey="students" fill="#10b981" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Teacher Performance within Classes */}
      {analytics?.teacherByDepartment && analytics.teacherByDepartment.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-semibold">Teacher Performance by Department</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-semibold">Department</th>
                  <th className="text-left p-2 font-semibold">Teacher</th>
                  <th className="text-right p-2 font-semibold">Students</th>
                  <th className="text-right p-2 font-semibold">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {analytics.teacherByDepartment.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{item.className}</td>
                    <td className="p-2">{item.teacherName}</td>
                    <td className="text-right p-2">{item.studentCount}</td>
                    <td className="text-right p-2">
                      <span className={cn(
                        'font-semibold',
                        item.attendanceRate >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.attendanceRate >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      )}>
                        {item.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );

  const renderStudentsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* High and Low Performers Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                High Performers
              </p>
              <p className="text-xs text-muted-foreground">Students with 90%+ attendance</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground">
            {analytics?.highPerformers?.count || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {analytics?.highPerformers?.percentage?.toFixed(1)}% of total students
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Low Performers
              </p>
              <p className="text-xs text-muted-foreground">Students with &lt;20% attendance</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground">
            {analytics?.lowPerformers?.count || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {analytics?.lowPerformers?.percentage?.toFixed(1)}% of total students
          </p>
        </Card>
      </div>

      {/* Student Distribution Pie Chart */}
      {analytics?.studentDistribution && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Student Attendance Distribution</h2>
              <p className="text-xs text-muted-foreground">Breakdown by performance bands</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.studentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#f87171" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* High Performers List */}
      {analytics?.highPerformersList && analytics.highPerformersList.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top Performers (90%+ Attendance)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-semibold">Student</th>
                  <th className="text-left p-2 font-semibold">Department</th>
                  <th className="text-right p-2 font-semibold">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {analytics.highPerformersList.slice(0, 10).map((student, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{student.name}</td>
                    <td className="p-2">{student.className}</td>
                    <td className="text-right p-2 font-semibold text-emerald-600">
                      {student.attendance.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Low Performers List */}
      {analytics?.lowPerformersList && analytics.lowPerformersList.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">At-Risk Students (&lt;20% Attendance)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-semibold">Student</th>
                  <th className="text-left p-2 font-semibold">Department</th>
                  <th className="text-right p-2 font-semibold">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {analytics.lowPerformersList.slice(0, 10).map((student, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{student.name}</td>
                    <td className="p-2">{student.className}</td>
                    <td className="text-right p-2 font-semibold text-red-600">
                      {student.attendance.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );

  const renderTrendsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 30-day Trends */}
      {analytics?.trendData && analytics.trendData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">30-Day Attendance Trends</h2>
              <p className="text-xs text-muted-foreground">Department-wise performance over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={analytics.trendData}>
              <defs>
                <linearGradient id="colorDept1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorDept2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorDept3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="overall"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorDept1)"
                name="Overall Attendance %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Weekly Summary */}
      {analytics?.weeklySummary && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analytics.weeklySummary.map((week, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{week.week}</p>
                <p className="text-2xl font-bold">{week.rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {week.present} / {week.total} attended
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );

  const renderVerificationTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Verification Methods Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics?.verificationMethods?.map((method, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">{method.name}</h3>
                <p className="text-xs text-muted-foreground">Verification success rate</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-semibold">{method.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Used</span>
                <span className="text-sm font-semibold">{method.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="text-sm font-semibold text-red-600">{method.failed}</span>
              </div>
            </div>
          </Card>
        )) || <p className="text-muted-foreground">No verification data</p>}
      </div>

      {/* Verification Reliability by Department */}
      {analytics?.verificationByDepartment && analytics.verificationByDepartment.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Verification Reliability by Department</h2>
              <p className="text-xs text-muted-foreground">Success rates by verification method</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.verificationByDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="geofencing" fill="#3b82f6" name="Geofencing %" />
              <Bar dataKey="face" fill="#10b981" name="Face Recognition %" />
              <Bar dataKey="biometric" fill="#f59e0b" name="Biometric %" />
              <Bar dataKey="qr" fill="#8b5cf6" name="QR Code %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar />

      <main className={cn(
        'flex-1 min-h-screen bg-background transition-all duration-300',
        isExpanded ? 'ml-64' : 'ml-20'
      )}>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-foreground" />
            </div>
            <h1 className="text-lg font-semibold">Analytics</h1>
          </div>
        </header>

        <div className="p-6 max-w-[1400px] mx-auto">
          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card border text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : !analytics ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-1">No Data Available</h3>
              <p className="text-sm text-muted-foreground">
                Unable to load analytics data. Please try again later.
              </p>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'departments' && renderDepartmentsTab()}
              {activeTab === 'students' && renderStudentsTab()}
              {activeTab === 'trends' && renderTrendsTab()}
              {activeTab === 'verification' && renderVerificationTab()}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
