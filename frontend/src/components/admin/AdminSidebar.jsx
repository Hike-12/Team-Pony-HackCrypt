import { Home, Users, Calendar, FileText, Settings, LogOut, User, Moon, Sun, BookOpen, BarChart3, Shield, Menu, GraduationCap, Book } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Students",
    url: "/admin/students",
    icon: Users,
  },
  {
    title: "Teachers",
    url: "/admin/teachers",
    icon: BookOpen,
  },
  {
    title: "Classes",
    url: "/admin/classes",
    icon: GraduationCap,
  },
  {
    title: "Subjects",
    url: "/admin/subjects",
    icon: Book,
  }
]

export function AdminSidebar() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem('sidebar-expanded');
    return stored !== null ? stored === 'true' : true;
  });

  // Persist to localStorage and dispatch event when state changes
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', isExpanded.toString());
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { 
      detail: { isExpanded } 
    }));
  }, [isExpanded]);

  const isActive = (url) => {
    return location.pathname === url;
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminData');
    navigate("/");
  };

  const handleNavigation = (url) => {
    navigate(url);
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-50",
      "bg-card border-r border-border flex flex-col",
      isExpanded ? "w-64" : "w-20"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className={cn(
          "flex items-center gap-2 text-primary transition-opacity duration-200",
          isExpanded ? "opacity-100" : "opacity-0 w-0"
        )}>
          <Shield className="h-6 w-6 shrink-0" />
          <span className="text-lg font-bold whitespace-nowrap">Admin</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.title}
            onClick={() => handleNavigation(item.url)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full",
              isActive(item.url)
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            title={!isExpanded ? item.title : ""}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className={cn(
              "font-medium transition-opacity duration-200",
              isExpanded ? "opacity-100" : "opacity-0 w-0"
            )}>
              {item.title}
            </span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          )}
          title={!isExpanded ? "Toggle Theme" : ""}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          <span className={cn(
            "font-medium transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0 w-0"
          )}>
            {theme === "dark" ? "Light" : "Dark"}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200"
          )}
          title={!isExpanded ? "Logout" : ""}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(
            "font-medium transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0 w-0"
          )}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}