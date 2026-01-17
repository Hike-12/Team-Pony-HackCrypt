import React, { useContext } from 'react'
import { motion } from 'framer-motion'
import { Home, Calendar, BookOpen, BarChart3, User, LogOut, Sun, Moon, FileText, ClipboardList, MapPin, QrCode } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { StudentContext } from '@/context/StudentContext'
import { cn } from '@/lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

const menuItems = [
  { title: 'Dashboard', icon: Home, url: '/student/dashboard' },
  { title: 'Time Table', icon: Calendar, url: '/student/timetable' },
  { title: 'Attendance', icon: MapPin, url: '/student/attendance' },
  { title: 'QR Attendance', icon: QrCode, url: '/student/qr-attendance' },
  { title: 'Leave', icon: FileText, url: '/student/leave/apply' },
  { title: 'Leave History', icon: ClipboardList, url: '/student/leave/history' },
  { title: 'Profile', icon: User, url: '/student/profile' },
]

export function StudentSidebar() {
  const { theme, setTheme } = useTheme()
  const { student, logoutStudent } = useContext(StudentContext)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (url) => location.pathname === url

  const handleLogout = () => {
    logoutStudent()
    navigate('/student/login')
  }

  return (
    <div className="z-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">{student?.name ? student.name.charAt(0).toUpperCase() : 'S'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{student?.name || 'Student'}</span>
              <span className="text-xs text-muted-foreground">{student?.roll_no || 'Roll No'}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <a
              key={item.title}
              href={item.url}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive(item.url)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Premium Mobile Floating Dock */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 pointer-events-auto flex items-center gap-1 sm:gap-2 supports-[backdrop-filter]:bg-background/60 dark:bg-zinc-900/80 overflow-x-auto max-w-full scrollbar-hide">
          {menuItems.map((item) => {
            const active = isActive(item.url);
            return (
              <a
                key={item.title}
                href={item.url}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-[3rem] w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-300",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <item.icon className={cn("h-5 w-5 transition-transform duration-300", active && "scale-110 fill-current")} strokeWidth={active ? 2.5 : 2} />
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className="w-1 h-1 rounded-full bg-primary mt-1"
                    />
                  )}
                </div>
              </a>
            );
          })}

          <div className="w-[1px] h-8 bg-border/50 mx-1" />

          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}