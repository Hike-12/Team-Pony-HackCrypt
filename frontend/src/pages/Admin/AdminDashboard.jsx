import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0
  });
  const [loading, setLoading] = useState(false);
  
  const isExpanded = useSidebarState();

  useEffect(() => {
    fetchStats();
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch counts from different endpoints
      const [studentsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/students`),
        fetch(`${API_BASE_URL}/api/admin/teachers`),
        fetch(`${API_BASE_URL}/api/admin/timetable/classes`),
        fetch(`${API_BASE_URL}/api/admin/timetable/subjects`)
      ]);

      const [studentsData, teachersData, classesData, subjectsData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        classesRes.json(),
        subjectsRes.json()
      ]);

      setStats({
        totalStudents: studentsData.success ? studentsData.data.length : 0,
        totalTeachers: teachersData.success ? teachersData.data.length : 0,
        totalClasses: classesData.success ? classesData.data.length : 0,
        totalSubjects: subjectsData.success ? subjectsData.data.length : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };


  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: BookOpen,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: GraduationCap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Total Subjects',
      value: stats.totalSubjects,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar />
      <Toaster position="top-right" richColors />
      
      <main className={cn(
        "flex-1 min-h-screen bg-background transition-all duration-300",
        isExpanded ? "ml-64" : "ml-20"
      )}>
        <header className="sticky top-0 z-10 flex h-16 mt-1 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className={cn(
          "mx-auto space-y-8 p-6 transition-all duration-300",
          isExpanded ? "max-w-7xl" : "max-w-full"
        )}>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        {stat.title}
                      </p>
                      <h3 className="text-3xl font-bold text-foreground">
                        {loading ? '...' : stat.value}
                      </h3>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg",
                      stat.bgColor
                    )}>
                      <Icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => window.location.href = '/admin/students'}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary transition-all duration-200 text-left group"
              >
                <Users className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-foreground">Manage Students</h3>
                <p className="text-xs text-muted-foreground mt-1">Add or edit student records</p>
              </button>
              
              <button
                onClick={() => window.location.href = '/admin/teachers'}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary transition-all duration-200 text-left group"
              >
                <BookOpen className="w-5 h-5 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-foreground">Manage Teachers</h3>
                <p className="text-xs text-muted-foreground mt-1">Add or edit teacher records</p>
              </button>
              
              <button
                onClick={() => window.location.href = '/admin/classes'}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary transition-all duration-200 text-left group"
              >
                <GraduationCap className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-foreground">Manage Classes</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure class structures</p>
              </button>
              
              <button
                onClick={() => window.location.href = '/admin/timetable'}
                className="p-4 border border-border rounded-lg hover:bg-accent hover:border-primary transition-all duration-200 text-left group"
              >
                <Calendar className="w-5 h-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-foreground">Manage Timetables</h3>
                <p className="text-xs text-muted-foreground mt-1">Create and update schedules</p>
              </button>
            </div>
          </Card>

          {/* System Overview */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">System Overview</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <span className="text-sm text-muted-foreground">System Status</span>
                <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Connected
                </span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;