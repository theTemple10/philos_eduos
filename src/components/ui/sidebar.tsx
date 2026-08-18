import { LayoutDashboard, Users, BookOpen, Settings, ShieldCheck, GraduationCap, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type DashboardView = "overview" | "students" | "teachers" | "classes" | "grades" | "attendance" | "announcements" | "settings";

interface SidebarProps {
  role: string;
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

export function Sidebar({ role, currentView, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems: { view: DashboardView; icon: React.ElementType; label: string; roles: string[] }[] = [
    { view: "overview", icon: LayoutDashboard, label: "Overview", roles: ["admin", "teacher", "student", "parent", "user"] },
    { view: "students", icon: GraduationCap, label: "Students", roles: ["admin", "teacher"] },
    { view: "teachers", icon: Users, label: "Teachers", roles: ["admin"] },
    { view: "classes", icon: BookOpen, label: "Classes", roles: ["admin", "teacher", "student"] },
    { view: "grades", icon: BookOpen, label: "Grades", roles: ["student", "parent", "admin"] },
    { view: "attendance", icon: LayoutDashboard, label: "Attendance", roles: ["teacher", "admin", "student", "parent"] },
    { view: "announcements", icon: Bell, label: "Announcements", roles: ["admin", "teacher", "student", "parent", "user"] },
    { view: "settings", icon: Settings, label: "Settings", roles: ["admin", "user"] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 border-r border-slate-800",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-lg tracking-tight">Philos <span className="text-yellow-500">EduOS</span></span>}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
              currentView === item.view ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="h-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border-t border-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
