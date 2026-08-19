import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  Bell,
  Search,
  Plus,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Upload,
  ClipboardCheck,
  FileText,
  Calendar,
  Sparkles,
  Trash2,
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function percentOf(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

export default function TeacherDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedClassId, setSelectedClassId] = useState<Id<"classes"> | null>(null);

  const messages = useQuery(api.messages.getMessages);
  const unreadCount = (messages ?? []).filter(
    (m) => !m.read && m.receiverId === user?._id,
  ).length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleViewStudents = (classId: Id<"classes">) => {
    setSelectedClassId(classId);
    setActiveSection("attendance");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
      {/* Teacher Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-100/50 z-50 flex flex-col">
        <div className="p-6 border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">Philos <span className="text-yellow-500">EduOS</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Teacher Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
            { id: "classes", label: "My Classes", icon: Users },
            { id: "attendance", label: "Attendance", icon: ClipboardCheck },
            { id: "grades", label: "Grade Book", icon: GraduationCap },
            { id: "comments", label: "AI Report Comments", icon: Sparkles },
            { id: "materials", label: "Study Materials", icon: FileText },
            { id: "announcements", label: "Announcements", icon: Bell },
            { id: "messages", label: "Messages", icon: MessageSquare },
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
              {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "TM"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Teacher User"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Teaching Staff</p>
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
              <Input placeholder="Search classes, students..." className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full" />
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
          {activeSection === "classes" && <ClassesSection onViewStudents={handleViewStudents} />}
          {activeSection === "attendance" && <AttendanceSection initialClassId={selectedClassId} />}
          {activeSection === "grades" && <GradesSection />}
          {activeSection === "comments" && <CommentsSection />}
          {activeSection === "materials" && <MaterialsSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "messages" && <MessagesSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const classes = useQuery(api.classes.getClasses);
  const students = useQuery(api.students.getStudents);
  const messages = useQuery(api.messages.getMessages);
  const announcements = useQuery(api.announcements.getAnnouncements);
  const today = todayIso();
  const attendance = useQuery(api.attendance.getAttendanceByDate, { date: today });

  const convex = useConvex();
  const [avgPerformance, setAvgPerformance] = useState<string>("--");
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const studentIds = (students ?? []).map((s) => s._id);
        const perStudent = await Promise.all(
          studentIds.map((id) =>
            convex.query(api.grades.getGradesByStudent, { studentId: id }),
          ),
        );
        const all = perStudent.flat();
        if (all.length === 0) return;
        const pct =
          all.reduce((acc, g) => acc + percentOf(g.score, g.maxScore), 0) / all.length;
        if (!cancelled) setAvgPerformance(`${pct.toFixed(1)}%`);
      } catch {
        if (!cancelled) setAvgPerformance("--");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [convex, students]);

  const classCount = classes?.length ?? 0;
  const studentCount = students?.length ?? 0;
  const present = (attendance ?? []).filter(
    (r) => r.status === "present" || r.status === "late",
  ).length;
  const attendanceRate =
    attendance && attendance.length > 0
      ? `${Math.round((present / attendance.length) * 100)}%`
      : "--";

  const stats = [
    { label: "My Classes", value: String(classCount), change: "This term", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Total Students", value: String(studentCount), change: "Across all classes", icon: GraduationCap, color: "bg-green-50 text-green-600" },
    { label: "Avg. Performance", value: avgPerformance, change: "Across grades", icon: BarChart3, color: "bg-yellow-50 text-yellow-600" },
    { label: "Attendance Rate", value: attendanceRate, change: "Today", icon: CheckCircle2, color: "bg-slate-50 text-slate-600" },
  ];

  const activity = useMemo(() => {
    const items = [
      ...(messages ?? []).map((m) => ({
        id: m._id,
        text: m.content,
        time: m.createdAt,
        icon: <MessageSquare className="w-3.5 h-3.5 text-yellow-500" />,
      })),
      ...(announcements ?? []).map((a) => ({
        id: a._id,
        text: a.title,
        time: a.createdAt,
        icon: <Bell className="w-3.5 h-3.5 text-blue-500" />,
      })),
    ].sort((a, b) => b.time - a.time);
    return items.slice(0, 5);
  }, [messages, announcements]);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back, Teacher</h1>
        <p className="text-slate-500 font-medium text-lg">Here's an overview of your classes and student performance.</p>
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
              <div className="text-3xl font-extrabold text-slate-800">{stat.value}</div>
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
            {(classes ?? []).length === 0 && (
              <p className="text-sm text-slate-500 font-medium p-3">No classes scheduled yet.</p>
            )}
            {(classes ?? []).map((cls) => (
              <div key={cls._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full"><Calendar className="w-3.5 h-3.5 text-slate-500" /></div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{cls.name}</span>
                    <p className="text-xs text-slate-500">{cls.gradeLevel} • {cls.room || "No room"}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">All day</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-transparent">
                <span className="text-sm font-medium text-slate-500">No recent activity yet</span>
              </div>
            )}
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full">{item.icon}</div>
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[280px]">{item.text}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{formatWhen(item.time)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClassesSection({ onViewStudents }: { onViewStudents: (classId: Id<"classes">) => void }) {
  const classes = useQuery(api.classes.getClasses);
  const students = useQuery(api.students.getStudents);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Classes</h1>
          <p className="text-slate-500 font-medium">Manage your classes, view student lists, and update schedules.</p>
        </div>
      </div>

      {!classes && <div className="animate-pulse text-slate-500 font-medium">Loading classes…</div>}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(classes ?? []).map((cls) => {
          const studentCount = (students ?? []).filter((s) => s.classId === cls._id).length;
          return (
            <Card key={cls._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{cls.gradeLevel}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Grade Level</span>
                    <span className="font-bold text-slate-800">{cls.gradeLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Students</span>
                    <span className="font-bold text-slate-800">{studentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Room</span>
                    <span className="font-bold text-slate-800">{cls.room || "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Capacity</span>
                    <span className="font-bold text-slate-800 text-xs">{cls.capacity}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all"
                    onClick={() => onViewStudents(cls._id)}
                  >
                    View Students
                  </Button>
                  <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AttendanceSection({ initialClassId }: { initialClassId: Id<"classes"> | null }) {
  const classes = useQuery(api.classes.getClasses);
  const [classId, setClassId] = useState<Id<"classes"> | null>(initialClassId ?? null);
  const [date, setDate] = useState<string>(todayIso());
  const [markingId, setMarkingId] = useState<string | null>(null);

  const effectiveClassId = classId ?? (classes && classes.length > 0 ? classes[0]._id : null);

  const students = useQuery(
    api.students.getStudentsByClass,
    effectiveClassId ? { classId: effectiveClassId } : "skip",
  );
  const attendance = useQuery(
    api.attendance.getAttendanceByDate,
    date ? { date } : "skip",
  );

  const statusByStudent = new Map<string, string>();
  for (const record of attendance ?? []) {
    if (effectiveClassId && (students ?? []).some((s) => s._id === record.studentId)) {
      statusByStudent.set(record.studentId, record.status);
    }
  }

  const markAttendance = useMutation(api.attendance.markAttendance);

  const handleMark = async (studentId: Id<"students">, status: "present" | "absent" | "late") => {
    setMarkingId(studentId);
    try {
      await markAttendance({ studentId, date, status });
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Attendance Management</h1>
          <p className="text-slate-500 font-medium">Mark and track student attendance for your classes.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-bold text-slate-700 block mb-2">Select Class</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                value={effectiveClassId ?? ""}
                onChange={(e) => setClassId(e.target.value as Id<"classes">)}
              >
                <option value="" disabled>Select a class…</option>
                {(classes ?? []).map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name} - {cls.gradeLevel}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold text-slate-700 block mb-2">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Student</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">ID</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(students ?? []).map((student) => {
                const status = statusByStudent.get(student._id);
                return (
                  <tr key={student._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                          {student.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-medium font-mono">{student.studentId}</td>
                    <td className="p-4">
                      {status ? (
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          status === "present" ? "bg-green-50 text-green-700 border border-green-100" :
                          status === "late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                          "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {status}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-100">
                          Unmarked
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex gap-2 justify-end">
                        {(["present", "late", "absent"] as const).map((s) => (
                          <Button
                            key={s}
                            variant="ghost"
                            size="sm"
                            disabled={markingId === student._id}
                            onClick={() => handleMark(student._id, s)}
                            className={`font-semibold ${
                              status === s
                                ? "bg-slate-900 text-white"
                                : s === "present"
                                  ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                  : s === "late"
                                    ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                    : "text-red-600 hover:text-red-700 hover:bg-red-50"
                            }`}
                          >
                            {markingId === student._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : s}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(students ?? []).length === 0 && classId && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-slate-500 font-medium">
                    No students in this class.
                  </td>
                </tr>
              )}
              {!classId && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-slate-500 font-medium">
                    Select a class to view students.
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

function GradesSection() {
  const classes = useQuery(api.classes.getClasses);
  const [classId, setClassId] = useState<Id<"classes"> | null>(null);
  const [studentId, setStudentId] = useState<Id<"students"> | null>(null);

  const students = useQuery(
    api.students.getStudentsByClass,
    classId ? { classId } : "skip",
  );

  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [date, setDate] = useState(todayIso());
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grades = useQuery(
    api.grades.getGradesByStudent,
    studentId ? { studentId } : "skip",
  );
  const addGrade = useMutation(api.grades.addGrade);

  const handleAddGrade = async () => {
    if (!studentId) {
      setError("Select a student first.");
      return;
    }
    const parsedScore = parseFloat(score);
    const parsedMax = parseFloat(maxScore);
    if (!subject.trim() || Number.isNaN(parsedScore) || Number.isNaN(parsedMax)) {
      setError("Enter a subject, score and maximum score.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addGrade({
        studentId,
        subject: subject.trim(),
        score: parsedScore,
        maxScore: parsedMax,
        date,
        comments: comments.trim() || undefined,
      });
      setSubject("");
      setScore("");
      setMaxScore("");
      setComments("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that grade.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Grade Book</h1>
          <p className="text-slate-500 font-medium">Enter and manage student grades and academic performance.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">Enter New Grade</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Class</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                value={classId ?? ""}
                onChange={(e) => {
                  setClassId(e.target.value as Id<"classes">);
                  setStudentId(null);
                }}
              >
                <option value="" disabled>Select a class…</option>
                {(classes ?? []).map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Student</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                value={studentId ?? ""}
                onChange={(e) => setStudentId(e.target.value as Id<"students">)}
              >
                <option value="" disabled>Select a student…</option>
                {(students ?? []).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Score</label>
              <Input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 85"
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Max Score</label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="e.g. 100"
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-bold text-slate-700 block mb-2">Comments (optional)</label>
            <Input
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Strong performance on algebra"
              className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}
          <Button
            onClick={handleAddGrade}
            disabled={submitting}
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Grade
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">
            Grades for {students?.find((s) => s._id === studentId)?.name ?? "selected student"}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Subject</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Score</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Max</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Percentage</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Comments</th>
              </tr>
            </thead>
            <tbody>
              {(grades ?? []).map((g) => (
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
                  <td className="p-4 text-center">
                    <span className={`text-sm font-extrabold px-3 py-1.5 rounded-full ${
                      percentOf(g.score, g.maxScore) >= 90 ? "bg-green-50 text-green-700 border border-green-100" :
                      percentOf(g.score, g.maxScore) >= 80 ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      percentOf(g.score, g.maxScore) >= 70 ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                      "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {percentOf(g.score, g.maxScore)}%
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">{formatDate(g.date)}</td>
                  <td className="p-4 pr-6 text-sm text-slate-500 max-w-xs truncate">{g.comments || "--"}</td>
                </tr>
              ))}
              {(grades ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-slate-500 font-medium">
                    {studentId ? "No grades recorded yet for this student." : "Select a student to see their grades."}
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

function CommentsSection() {
  const classes = useQuery(api.classes.getClasses);
  const comments = useQuery(api.reportComments.getReportComments);
  const students = useQuery(api.students.getStudents);

  const [classId, setClassId] = useState<Id<"classes"> | null>(null);
  const [studentId, setStudentId] = useState<Id<"students"> | null>(null);
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [scoresText, setScoresText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeDraftId, setActiveDraftId] = useState<Id<"reportComments"> | null>(null);
  const [draftText, setDraftText] = useState("");
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const classStudents = useQuery(
    api.students.getStudentsByClass,
    classId ? { classId } : "skip",
  );

  const draftAction = useAction(api.reportComments.draftReportComment);
  const updateDraft = useMutation(api.reportComments.updateDraft);
  const approveReportComment = useMutation(api.reportComments.approveReportComment);
  const deleteReportComment = useMutation(api.reportComments.deleteReportComment);

  const studentName = (id: string) =>
    (students ?? []).find((s) => s._id === id)?.name ?? "Unknown student";

  const handleDraft = async () => {
    if (!studentId || !subject.trim() || !term.trim() || !rawNotes.trim()) {
      setError("Select a student and fill in subject, term and notes.");
      return;
    }
    const parsedScores = scoresText
      .split(",")
      .map((part) => {
        const [subj, ratio] = part.split(":").map((p) => p.trim());
        if (!subj || !ratio) return undefined;
        const [score, max] = ratio.split("/").map((n) => parseFloat(n.trim()));
        if (Number.isNaN(score) || Number.isNaN(max)) return undefined;
        return { subject: subj, score, max };
      })
      .filter((s): s is { subject: string; score: number; max: number } => s !== undefined);
    setDrafting(true);
    setError(null);
    try {
      const result = await draftAction({
        studentId,
        subject: subject.trim(),
        term: term.trim(),
        rawNotes: rawNotes.trim(),
        scores: parsedScores.length > 0 ? parsedScores : undefined,
      });
      setActiveDraftId(result.commentId);
      setDraftText(result.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draft a comment.");
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!activeDraftId || !draftText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateDraft({ id: activeDraftId, draft: draftText });
      setActiveDraftId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!activeDraftId) return;
    if (draftText.trim().length < 20) {
      setError("The final comment must be at least 20 characters long.");
      return;
    }
    setApproving(true);
    setError(null);
    try {
      await approveReportComment({ id: activeDraftId, finalText: draftText });
      setActiveDraftId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't approve the comment.");
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async (id: Id<"reportComments">) => {
    await deleteReportComment({ id });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">AI Report Comments</h1>
        <p className="text-slate-500 font-medium">Draft report card comments with AI, then review and approve them.</p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardContent className="p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" /> Draft a New Comment
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Class</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                value={classId ?? ""}
                onChange={(e) => {
                  setClassId(e.target.value as Id<"classes">);
                  setStudentId(null);
                }}
              >
                <option value="" disabled>Select a class…</option>
                {(classes ?? []).map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Student</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                value={studentId ?? ""}
                onChange={(e) => setStudentId(e.target.value as Id<"students">)}
              >
                <option value="" disabled>Select a student…</option>
                {(classStudents ?? []).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-bold text-slate-700 block mb-2">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-bold text-slate-700 block mb-2">Term</label>
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. Term 1"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-bold text-slate-700 block mb-2">Raw Notes</label>
            <Textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Describe the student's performance, behaviour and areas for improvement…"
              className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              rows={4}
            />
          </div>
          <div className="mt-4">
            <label className="text-sm font-bold text-slate-700 block mb-2">Scores (optional)</label>
            <Input
              value={scoresText}
              onChange={(e) => setScoresText(e.target.value)}
              placeholder="e.g. Mathematics:85/100, English:90/100"
              className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}
          <Button
            onClick={handleDraft}
            disabled={drafting}
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          >
            {drafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Draft with AI
          </Button>

          {activeDraftId && (
            <div className="mt-6 p-4 rounded-xl bg-yellow-50/50 border border-yellow-100">
              <label className="text-sm font-bold text-slate-700 block mb-2">Generated Draft (edit before approving)</label>
              <Textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="border-slate-200/60 bg-white focus-visible:ring-blue-500"
                rows={5}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Draft
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md"
                >
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve
                </Button>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2">Approval requires at least 20 characters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">All Report Comments</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-6 pt-0">
          {(comments ?? []).length === 0 && (
            <p className="text-sm text-slate-500 font-medium">No report comments yet.</p>
          )}
          {(comments ?? []).map((c) => (
            <div key={c._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800">{studentName(c.studentId)}</span>
                  <span className="text-xs text-slate-500 font-medium">{c.subject} • {c.term}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    c.status === "approved"
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                  }`}>
                    {c.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    onClick={() => handleDelete(c._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {c.status === "approved" && c.finalText ? c.finalText : c.draft}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-2">{formatWhen(c.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MaterialsSection() {
  const materials = useQuery(api.materials.getStudyMaterials);
  const classes = useQuery(api.classes.getClasses);
  const deleteMaterial = useMutation(api.materials.deleteStudyMaterial);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState<Id<"classes"> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.materials.generateUploadUrl);
  const addMaterial = useMutation(api.materials.addStudyMaterial);

  const handleUpload = async () => {
    if (!file || !title.trim() || !subject.trim() || !classId) {
      setError("Fill in title, subject, class and choose a file.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!response.ok) {
        throw new Error("Upload failed. Please try again.");
      }
      const { storageId } = (await response.json()) as { storageId: string };
      const ext = file.name.split(".").pop()?.toUpperCase() || file.type || "FILE";
      await addMaterial({
        title: title.trim(),
        description: description.trim() || undefined,
        subject: subject.trim(),
        classId,
        storageId: storageId as Id<"_storage">,
        fileType: ext,
      });
      setShowUpload(false);
      setTitle("");
      setSubject("");
      setDescription("");
      setClassId(null);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that material.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Study Materials</h1>
          <p className="text-slate-500 font-medium">Upload and manage study materials for your students.</p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowUpload((v) => !v)}
        >
          <Upload className="w-4 h-4" /> Upload Material
        </Button>
      </div>

      {showUpload && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Upload New Material</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 5 Notes"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Class</label>
<select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={classId ?? ""}
                  onChange={(e) => setClassId(e.target.value as Id<"classes">)}
                >
                  <option value="" disabled>Select a class…</option>
                  {(classes ?? []).map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">File</label>
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-bold text-slate-700 block mb-2">Description (optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this material"
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </Button>
          </CardContent>
        </Card>
      )}

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
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                      {(classes ?? []).find((c) => c._id === material.classId)?.name ?? material.classId}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subject</span>
                  <span className="font-bold text-slate-800">{material.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Type</span>
                  <span className="font-bold text-slate-800">{material.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Uploaded</span>
                  <span className="font-bold text-slate-800">{formatWhen(material.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all px-4 py-2 text-sm"
                >
                  <FileText className="w-4 h-4" /> Download
                </a>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl"
                  onClick={() => deleteMaterial({ id: material._id })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  const announcements = useQuery(api.announcements.getAnnouncements);
  const addAnnouncement = useMutation(api.announcements.addAnnouncement);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"all" | "teachers" | "students" | "parents" | "staff">("all");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Announcements need a title and some content.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await addAnnouncement({ title: title.trim(), content: content.trim(), target });
      setShowCreate(false);
      setTitle("");
      setContent("");
      setTarget("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that announcement.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Announcements</h1>
          <p className="text-slate-500 font-medium">View announcements and updates from administration.</p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowCreate((v) => !v)}
        >
          <Plus className="w-4 h-4" /> Create Announcement
        </Button>
      </div>

      {showCreate && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">New Announcement</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff meeting reminder"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Audience</label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={target}
                  onChange={(e) => setTarget(e.target.value as typeof target)}
                >
                  <option value="all">Everyone</option>
                  <option value="teachers">Teachers</option>
                  <option value="students">Students</option>
                  <option value="parents">Parents</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-bold text-slate-700 block mb-2">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the announcement…"
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Publish
            </Button>
          </CardContent>
        </Card>
      )}

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

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students ?? []) if (s.userId) map.set(s.userId, s.name);
    for (const t of teachers ?? []) map.set(t.userId, t.name);
    return map;
  }, [students, teachers]);

  const senderName = (senderId: string) => {
    if (senderId === user?._id) return "You";
    return nameById.get(senderId) ?? "School Member";
  };

  const handleOpen = async (id: Id<"messages">, read: boolean) => {
    if (!read) {
      await markMessageRead({ id });
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Messages</h1>
        <p className="text-slate-500 font-medium">Communicate with students, parents, and administration.</p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">From</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Message</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Time</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Status</th>
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
                  <td className="p-4 text-sm text-slate-500 max-w-md truncate">{message.content}</td>
                  <td className="p-4 text-xs text-slate-400 font-medium">{formatWhen(message.createdAt)}</td>
                  <td className="p-4 pr-6 text-right">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      message.read
                        ? "bg-slate-50 text-slate-500 border border-slate-100"
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>
                      {message.read ? "Read" : "Unread"}
                    </span>
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
    </div>
  );
}