import React, { useContext } from 'react'
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
  const { student } = useContext(StudentContext)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (url) => location.pathname === url

  const handleLogout = () => {
    navigate('/')
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-card border-t border-border flex justify-around p-2 z-50 pb-safe">
        {menuItems.slice(0, 5).map((item) => ( // Limit to 5 items for mobile spacing
          <a
            key={item.title}
            href={item.url}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full",
              isActive(item.url)
                ? "text-primary"
                : "text-muted-foreground hover:bg-accent"
            )}
            title={item.title}
          >
            <item.icon className={cn("h-5 w-5", isActive(item.url) && "fill-current")} />
            <span className="text-[10px] uppercase font-bold mt-1 max-w-[60px] truncate">{item.title}</span>
          </a>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] uppercase font-bold mt-1">Exit</span>
        </button>
      </div>
    </div>
  )
}