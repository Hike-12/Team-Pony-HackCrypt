import { Home, Users, Calendar, FileText, Settings, LogOut, User, Moon, Sun, BookOpen, BarChart3, Shield } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Classes",
    url: "/admin/classes",
    icon: BookOpen,
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url) => {
    return location.pathname === url;
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    // Add logout logic here
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary py-4 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Admin Panel</span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className={cn(
                      state === "expanded" && isActive(item.url) && "bg-accent/50 border-l-4 border-primary pl-2"
                    )}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/profile")} className="w-full">
              <a href="/admin/profile" className="flex items-center w-full">
                <User className={cn(state === "expanded" && "ml-2")} />
                {state === "expanded" && <span>Profile</span>}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full">
              <button 
                onClick={toggleTheme}
                className="flex items-center w-full cursor-pointer"
              >
                {theme === "dark" ? (
                  <Moon className={cn("h-[1.2rem] w-[1.2rem]", state === "expanded" && "ml-2")} />
                ) : (
                  <Sun className={cn("h-[1.2rem] w-[1.2rem]", state === "expanded" && "ml-2")} />
                )}
                {state === "expanded" && <span>Theme</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full mb-4 cursor-pointer text-destructive hover:text-destructive/90"
              >
                <LogOut className={cn(state === "expanded" && "ml-2")} />
                {state === "expanded" && <span>Logout</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
