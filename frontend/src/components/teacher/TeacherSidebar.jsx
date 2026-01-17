import React, { useContext } from 'react'
import { Home, Users, Calendar, ClipboardCheck, BookOpen, LogOut, Sun, Moon, FileText, QrCode, Eye } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { TeacherContext } from '@/context/TeacherContext'
import { cn } from '@/lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

const menuItems = [
  { title: 'Dashboard', icon: Home, url: '/teacher/dashboard' },
  { title: 'Schedule', icon: Calendar, url: '/teacher/schedule' },
  { title: 'QR Attendance', icon: QrCode, url: '/teacher/qr-attendance' },
  { title: 'Attentiveness', icon: Eye, url: '/teacher/attentiveness' },
  { title: 'Leave Management', icon: FileText, url: '/teacher/leave-management' },
]

export function TeacherSidebar() {
  const { theme, setTheme } = useTheme()
  const { teacher } = useContext(TeacherContext)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (url) => location.pathname === url

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">T</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{teacher?.name || 'Teacher'}</span>
            <span className="text-xs text-muted-foreground">{teacher?.department || 'Department'}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
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
  )
}