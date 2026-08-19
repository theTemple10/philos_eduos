import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Settings as SettingsIcon,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

const SECTIONS = [
  { id: "overview", label: "School Overview", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "teachers", label: "Teachers", icon: BookOpen },
  { id: "members", label: "Members & Roles", icon: Users },
  { id: "settings", label: "School Settings", icon: SettingsIcon },
] as const;

export default function SchoolAdminDashboard() {
  const { user, signOut } = useAuth();
  const tenant = useQuery(api.users.getMyTenant);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-100/50 z-50 flex flex-col">
        <div className="p-6 border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">
                Philos <span className="text-yellow-500">EduOS</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest truncate max-w-[10rem]">
                {tenant?.name ?? "School Administration"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSection === item.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100/50 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-blue-600" /> School Admin
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 rounded-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="ml-64">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100/50 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {tenant?.name ?? "Your school"}
            </p>
          </div>
        </header>

        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School administration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                This dashboard is being wired to live school data (students,
                teachers, classes, attendance, fees and invites). Your school
                &quot;{tenant?.name ?? "…"}&quot; is set up and ready.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}