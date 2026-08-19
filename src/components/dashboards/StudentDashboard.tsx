import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  FileText,
  Calendar,
  Download,
  BookMarked,
  ClipboardCheck,
  Send,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";

function formatWhen(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatDate(iso: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function percentOf(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

function letterFor(pct: number): string {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const messages = useQuery(api.messages.getMessages);
  const unreadCount = (messages ?? []).filter(
    (m) => !m.read && m.receiverId === user?._id,
  ).length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
      {/* Student Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-100/50 z-50 flex flex-col">
        <div className="p-6 border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">Philos <span className="text-yellow-500">EduOS</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Student Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
            { id: "grades", label: "My Grades", icon: GraduationCap },
            { id: "attendance", label: "Attendance", icon: ClipboardCheck },
            { id: "materials", label: "Study Materials", icon: BookMarked },
            { id: "announcements", label: "Announcements", icon: Bell },
            { id: "messages", label: "Messages", icon: MessageSquare },
            { id: "schedule", label: "Class Schedule", icon: Calendar },
          ].map((item) => (
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
              {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "ST"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Student User"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Student</p>
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

      {/* Main Content */}
      <div className="pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100/50 px-8 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight capitalize">{activeSection.replace("_", " ")}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search materials, grades..." className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full" />
            </div>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "grades" && <GradesSection />}
          {activeSection === "attendance" && <AttendanceSection />}
          {activeSection === "materials" && <MaterialsSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "messages" && <MessagesSection />}
          {activeSection === "schedule" && <ScheduleSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const student = useQuery(api.students.getStudentByUser);
  const myGrades = useQuery(api.grades.getMyGrades);
  const classes = useQuery(api.classes.getClasses);
  const materials = useQuery(
    api.materials.getStudyMaterialsForStudent,
    student ? { studentId: student._id } : "skip",
  );
  const attendance = useQuery(
    api.attendance.getAttendanceForStudent,
    student ? { studentId: student._id } : "skip",
  );

  const myClass = (classes ?? []).find((c) => c._id === student?.classId);

  const avgPct =
    myGrades && myGrades.length > 0
      ? myGrades.reduce((acc, g) => acc + percentOf(g.score, g.maxScore), 0) / myGrades.length
      : null;
  const present = (attendance ?? []).filter(
    (r) => r.status === "present" || r.status === "late",
  ).length;
  const attendanceRate =
    attendance && attendance.length > 0
      ? `${Math.round((present / attendance.length) * 100)}%`
      : "--";

  const stats = [
    { label: "Overall Grade", value: avgPct === null ? "--" : `${avgPct.toFixed(1)}%`, change: "This term", icon: GraduationCap, color: "bg-green-50 text-green-600" },
    { label: "Attendance Rate", value: attendanceRate, change: "All time", icon: ClipboardCheck, color: "bg-blue-50 text-blue-600" },
    { label: "Study Materials", value: String(materials?.length ?? 0), change: "Available to you", icon: FileText, color: "bg-yellow-50 text-yellow-600" },
    { label: "My Class", value: myClass?.name ?? "--", change: myClass?.gradeLevel ?? "", icon: BookOpen, color: "bg-slate-50 text-slate-600" },
  ];

  const recentGrades = (myGrades ?? []).slice(0, 5);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back, Student</h1>
        <p className="text-slate-500 font-medium text-lg">Here's an overview of your academic progress and upcoming activities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500">{stat.label}</CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800 truncate">{stat.value}</div>
              <p className="text-xs text-slate-500 font-bold mt-2 bg-slate-50 inline-flex px-2 py-1 rounded-full">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myClass ? (
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full"><Calendar className="w-3.5 h-3.5 text-slate-500" /></div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{myClass.name}</span>
                    <p className="text-xs text-slate-500">{myClass.gradeLevel} • {myClass.room || "No room"}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">All day</span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 font-medium p-3">No class assigned yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Recent Grades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentGrades.length === 0 && (
              <p className="text-sm text-slate-500 font-medium p-3">No grades recorded yet.</p>
            )}
            {recentGrades.map((g) => {
              const pct = percentOf(g.score, g.maxScore);
              return (
                <div key={g._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-1.5 rounded-full"><GraduationCap className="w-3.5 h-3.5 text-slate-500" /></div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{g.subject}</span>
                      <p className="text-xs text-slate-500">{formatDate(g.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{pct}%</span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      letterFor(pct).startsWith("A") ? "text-green-600 bg-green-50" :
                      letterFor(pct).startsWith("B") ? "text-blue-600 bg-blue-50" :
                      "text-yellow-600 bg-yellow-50"
                    }`}>
                      {letterFor(pct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GradesSection() {
  const myGrades = useQuery(api.grades.getMyGrades);

  const avgPct =
    myGrades && myGrades.length > 0
      ? myGrades.reduce((acc, g) => acc + percentOf(g.score, g.maxScore), 0) / myGrades.length
      : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Grades</h1>
        <p className="text-slate-500 font-medium">View your academic performance and grade reports.</p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Overall Performance</h3>
              <p className="text-slate-500 font-medium">Current average across all subjects</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extrabold text-slate-800">{avgPct === null ? "--" : `${avgPct.toFixed(1)}%`}</div>
              <p className="text-sm text-slate-500 font-bold">{myGrades?.length ?? 0} grades recorded</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Subject</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Score</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Max</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Percentage</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center pr-6">Grade</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Date</th>
              </tr>
            </thead>
            <tbody>
              {(myGrades ?? []).map((g) => {
                const pct = percentOf(g.score, g.maxScore);
                return (
                  <tr key={g._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                          {g.subject.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{g.subject}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm font-bold text-slate-700">{g.score}</td>
                    <td className="p-4 text-center text-sm font-medium text-slate-500">{g.maxScore}</td>
                    <td className="p-4 text-center text-sm font-bold text-slate-700">{pct}%</td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-extrabold px-3 py-1.5 rounded-full ${
                        letterFor(pct).startsWith("A") ? "bg-green-50 text-green-700 border border-green-100" :
                        letterFor(pct).startsWith("B") ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        letterFor(pct).startsWith("C") ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                        "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {letterFor(pct)}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-sm text-slate-500 font-medium">{formatDate(g.date)}</td>
                  </tr>
                );
              })}
              {(myGrades ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-slate-500 font-medium">
                    No grades recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AttendanceSection() {
  const student = useQuery(api.students.getStudentByUser);
  const records = useQuery(
    api.attendance.getAttendanceForStudent,
    student ? { studentId: student._id } : "skip",
  );

  const stats = {
    total: (records ?? []).length,
    present: (records ?? []).filter((r) => r.status === "present").length,
    late: (records ?? []).filter((r) => r.status === "late").length,
    absent: (records ?? []).filter((r) => r.status === "absent").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Attendance</h1>
          <p className="text-slate-500 font-medium">Track your attendance record and participation.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-4 mb-8">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-slate-800">{stats.total}</div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Total Classes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50/50 border-green-100/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-green-700">{stats.present}</div>
            <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider mt-1">Present</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50/50 border-yellow-100/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-yellow-700">{stats.late}</div>
            <p className="text-[11px] text-yellow-600 font-bold uppercase tracking-wider mt-1">Late</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50/50 border-red-100/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-red-700">{stats.absent}</div>
            <p className="text-[11px] text-red-600 font-bold uppercase tracking-wider mt-1">Absent</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Recent Attendance</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Date</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {(records ?? []).map((r) => (
                <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-sm font-medium text-slate-700">{formatDate(r.date)}</td>
                  <td className="p-4 pr-6">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      r.status === "present" ? "bg-green-50 text-green-700 border border-green-100" :
                      r.status === "late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                      "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {r.status === "present" && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {r.status === "late" && <Clock className="w-3 h-3 inline mr-1" />}
                      {r.status === "absent" && <XCircle className="w-3 h-3 inline mr-1" />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(records ?? []).length === 0 && (
                <tr>
                  <td colSpan={2} className="p-6 text-center text-sm text-slate-500 font-medium">
                    No attendance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MaterialsSection() {
  const student = useQuery(api.students.getStudentByUser);
  const materials = useQuery(
    api.materials.getStudyMaterialsForStudent,
    student ? { studentId: student._id } : "skip",
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Study Materials</h1>
          <p className="text-slate-500 font-medium">Access study materials, notes, and resources from your teachers.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(materials ?? []).map((material) => (
          <Card key={material._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{material.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{material.subject}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Type</span>
                  <span className="font-bold text-slate-800">{material.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Uploaded</span>
                  <span className="font-bold text-slate-800">{formatWhen(material.createdAt)}</span>
                </div>
              </div>
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full mt-6 inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all px-4 py-2 text-sm"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </CardContent>
          </Card>
        ))}
        {(materials ?? []).length === 0 && (
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 font-medium">No study materials available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  const announcements = useQuery(api.announcements.getAnnouncements);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Announcements</h1>
        <p className="text-slate-500 font-medium">Stay updated with the latest news and announcements from school.</p>
      </div>

      <div className="space-y-4">
        {(announcements ?? []).length === 0 && (
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 font-medium">No announcements yet.</p>
            </CardContent>
          </Card>
        )}
        {(announcements ?? []).map((a) => (
          <Card key={a._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{a.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{formatWhen(a.createdAt)}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">{a.target}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed ml-14 font-medium">{a.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MessagesSection() {
  const messages = useQuery(api.messages.getMessages);
  const students = useQuery(api.students.getStudents);
  const teachers = useQuery(api.teachers.getTeachers);
  const { user } = useAuth();
  const markMessageRead = useMutation(api.messages.markMessageRead);
  const sendMessage = useMutation(api.messages.sendMessage);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameById = new Map<string, string>();
  for (const s of students ?? []) if (s.userId) nameById.set(s.userId, s.name);
  for (const t of teachers ?? []) nameById.set(t.userId, t.name);

  const senderName = (senderId: string) => {
    if (senderId === user?._id) return "You";
    return nameById.get(senderId) ?? "School Member";
  };

  const replyTarget = (messages ?? []).find((m) => m._id === replyingTo);

  const handleOpen = async (id: Id<"messages">, read: boolean) => {
    if (!read) {
      await markMessageRead({ id });
    }
  };

  const handleReply = async () => {
    if (!replyTarget || !replyContent.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage({ receiverId: replyTarget.senderId, content: replyContent.trim() });
      setReplyContent("");
      setReplyingTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Messages</h1>
        <p className="text-slate-500 font-medium">Communicate with teachers and administration.</p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">From</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Message</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Time</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(messages ?? []).map((message) => (
                <tr
                  key={message._id}
                  onClick={() => handleOpen(message._id, message.read)}
                  className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${!message.read ? "bg-blue-50/30" : ""}`}
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {senderName(message.senderId).split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{senderName(message.senderId)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{message.content}</td>
                  <td className="p-4 text-xs text-slate-400 font-medium">{formatWhen(message.createdAt)}</td>
                  <td className="p-4 pr-6 text-right">
                    {message.senderId !== user?._id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-slate-900 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingTo(replyingTo === message._id ? null : message._id);
                        }}
                      >
                        {replyingTo === message._id ? "Cancel" : "Reply"}
                      </Button>
                    ) : (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        message.read
                          ? "bg-slate-50 text-slate-500 border border-slate-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}>
                        {message.read ? "Read" : "Unread"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(messages ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-slate-500 font-medium">
                    No messages yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {replyTarget && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mt-4">
          <CardContent className="p-4">
            <p className="text-sm font-bold text-slate-700 mb-2">
              Reply to {senderName(replyTarget.senderId)}
            </p>
            <div className="flex gap-3">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply…"
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <Button
                onClick={handleReply}
                disabled={sending}
                className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 font-medium mt-2">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScheduleSection() {
  const student = useQuery(api.students.getStudentByUser);
  const classes = useQuery(api.classes.getClasses);
  const myClass = (classes ?? []).find((c) => c._id === student?.classId);

  const schedule = myClass
    ? [{ time: "--", class: myClass.name, teacher: "--", room: myClass.room || "--", days: "--" }]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Class Schedule</h1>
        <p className="text-slate-500 font-medium">View your weekly class schedule and timetable.</p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Time</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Subject</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Teacher</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Room</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Days</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-sm font-medium text-slate-700">{item.time}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {item.class.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{item.class}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{item.teacher}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{item.room}</td>
                  <td className="p-4 pr-6 text-sm font-medium text-slate-700">{item.days}</td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-slate-500 font-medium">
                    {student ? "Your class schedule isn't set up yet." : "You don't have a class assigned yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}