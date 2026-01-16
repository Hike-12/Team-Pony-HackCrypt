import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, BookOpen, Calendar, Bell, TrendingUp, Activity, Shield } from 'lucide-react'

// Stat Card Component
const StatCard = ({ title, value, description, icon: Icon, color, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        {value}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-500 font-medium">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
)

// Quick Action Card
const QuickActionCard = ({ title, description, icon: Icon, color }) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

const AdminDashboard = () => {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="w-full min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </header>
        <div className="p-4 relative">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Overview of your attendance management system
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
                  <Activity className="h-3 w-3 mr-1" />
                  System Active
                </Badge>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Students"
                value="1,245"
                description="Enrolled students"
                icon={Users}
                color="text-blue-500"
                trend="+12% from last month"
              />
              <StatCard
                title="Total Teachers"
                value="87"
                description="Active faculty"
                icon={GraduationCap}
                color="text-green-500"
                trend="+3 new this week"
              />
              <StatCard
                title="Active Sessions"
                value="18"
                description="Ongoing classes"
                icon={BookOpen}
                color="text-orange-500"
              />
              <StatCard
                title="Pending Requests"
                value="7"
                description="Need attention"
                icon={Bell}
                color="text-red-500"
              />
            </div>

            {/* Welcome Card */}
            <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Welcome Back, Admin!</CardTitle>
                <CardDescription className="text-base">
                  Here's what's happening with your attendance system today.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Today's Classes</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Attendance Rate</p>
                      <p className="text-2xl font-bold">94.2%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">System Health</p>
                      <p className="text-2xl font-bold">100%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <QuickActionCard
                  title="Manage Users"
                  description="Add, edit, or remove students and teachers"
                  icon={Users}
                  color="text-blue-500"
                />
                <QuickActionCard
                  title="View Reports"
                  description="Generate and download attendance reports"
                  icon={BookOpen}
                  color="text-green-500"
                />
                <QuickActionCard
                  title="System Settings"
                  description="Configure system policies and preferences"
                  icon={Shield}
                  color="text-orange-500"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'New attendance session created', user: 'Prof. Smith', time: '5 minutes ago', type: 'success' },
                    { action: 'Student enrollment approved', user: 'Admin Team', time: '15 minutes ago', type: 'info' },
                    { action: 'Attendance report generated', user: 'System', time: '1 hour ago', type: 'success' },
                    { action: 'Edit request pending review', user: 'John Doe', time: '2 hours ago', type: 'warning' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}

export default AdminDashboard
