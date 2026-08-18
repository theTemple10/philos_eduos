import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Bell, Search, Plus, BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { Sidebar, type DashboardView } from "@/components/ui/sidebar";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const role = (user?.role as string) || "admin";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar role={role} currentView={currentView} onNavigate={setCurrentView} />
      <div className="pl-64 transition-all duration-300">
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
          <h2 className="text-lg font-bold text-slate-800 capitalize">{currentView}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name || "Admin User"}</p>
              <p className="text-xs text-slate-500 capitalize font-medium">{role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-8">
          {currentView === "overview" && <OverviewView />}
          {currentView === "students" && <StudentsView />}
          {currentView === "teachers" && <TeachersView />}
          {currentView === "classes" && <ClassesView />}
          {currentView === "grades" && <GradesView />}
          {currentView === "attendance" && <AttendanceView />}
          {currentView === "announcements" && <AnnouncementsView />}
          {currentView === "settings" && <SettingsView />}
        </div>
      </div>
    </div>
  );
}

// ─── Overview View ───────────────────────────────────────────────
function OverviewView() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 font-medium">Here&apos;s what&apos;s happening at Philos EduOS today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +24 from last month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Teachers</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64</div>
            <p className="text-xs text-slate-500 mt-1">Across 12 departments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Attendance Rate</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +1.3% today</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Avg. Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5%</div>
            <p className="text-xs text-slate-500 mt-1">Across all classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Emma Watson", class: "Grade 10-A", status: "present", time: "8:02 AM" },
              { name: "Liam Chen", class: "Grade 11-B", status: "late", time: "8:15 AM" },
              { name: "Olivia Davis", class: "Grade 9-C", status: "present", time: "7:58 AM" },
              { name: "Noah Martinez", class: "Grade 10-A", status: "absent", time: "—" },
              { name: "Sophia Brown", class: "Grade 12-A", status: "present", time: "8:01 AM" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                    {item.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{item.time}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    item.status === "present" ? "bg-green-100 text-green-700" :
                    item.status === "late" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {item.status === "present" && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {item.status === "late" && <Clock className="w-3 h-3 inline mr-1" />}
                    {item.status === "absent" && <XCircle className="w-3 h-3 inline mr-1" />}
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Top Performers This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Emma Watson", score: 96, trend: "+4" },
              { name: "Liam Chen", score: 93, trend: "+2" },
              { name: "Olivia Davis", score: 91, trend: "-1" },
              { name: "Noah Martinez", score: 89, trend: "+7" },
              { name: "Sophia Brown", score: 88, trend: "+3" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-5">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-bold">
                    {item.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{item.score}%</span>
                  <span className={`text-xs font-medium ${item.trend.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {item.trend}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Chart */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Weekly Attendance Trend</CardTitle>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Absent</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-3 px-2">
            {[
              { day: "Mon", present: 92, absent: 8 },
              { day: "Tue", present: 88, absent: 12 },
              { day: "Wed", present: 95, absent: 5 },
              { day: "Thu", present: 91, absent: 9 },
              { day: "Fri", present: 94, absent: 6 },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: "100%" }}>
                  <div className="flex-1 flex flex-col justify-end gap-0.5">
                    <div className="w-full bg-red-400 rounded-t-sm" style={{ height: `${item.absent}%` }}></div>
                    <div className="w-full bg-blue-500 rounded-b-sm" style={{ height: `${item.present}%` }}></div>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium mt-2">{item.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Students View ───────────────────────────────────────────────
function StudentsView() {
  const students = [
    { id: "STU001", name: "Emma Watson", class: "Grade 10-A", parent: "Mark Watson", status: "active" },
    { id: "STU002", name: "Liam Chen", class: "Grade 11-B", parent: "Wei Chen", status: "active" },
    { id: "STU003", name: "Olivia Davis", class: "Grade 9-C", parent: "Sarah Davis", status: "active" },
    { id: "STU004", name: "Noah Martinez", class: "Grade 10-A", parent: "Carlos Martinez", status: "inactive" },
    { id: "STU005", name: "Sophia Brown", class: "Grade 12-A", parent: "James Brown", status: "active" },
    { id: "STU006", name: "Isabella Wilson", class: "Grade 9-B", parent: "David Wilson", status: "active" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Students</h1>
          <p className="text-slate-500 font-medium">Manage student records and information.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Search students by name, class, or ID..." className="pl-9 border-slate-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4 pl-6">Student</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">ID</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">Class</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">Parent/Guardian</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider p-4 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-mono">{student.id}</td>
                  <td className="p-4 text-sm text-slate-600">{student.class}</td>
                  <td className="p-4 text-sm text-slate-600">{student.parent}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      student.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Teachers View ───────────────────────────────────────────────
function TeachersView() {
  const teachers = [
    { id: "TCH001", name: "Dr. Sarah Miller", subject: "Mathematics", classes: "10-A, 11-B", students: 58 },
    { id: "TCH002", name: "Mr. James Wilson", subject: "Physics", classes: "11-B, 12-A", students: 45 },
    { id: "TCH003", name: "Ms. Emily Taylor", subject: "English", classes: "9-B, 9-C", students: 52 },
    { id: "TCH004", name: "Mr. Robert Lee", subject: "Chemistry", classes: "10-A, 12-A", students: 48 },
    { id: "TCH005", name: "Dr. Maria Garcia", subject: "Biology", classes: "9-C, 10-A", students: 61 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Teachers</h1>
          <p className="text-slate-500 font-medium">Manage teaching staff and assignments.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Teacher
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center text-lg font-bold">
                    {teacher.name.split(" ").filter((_, i, arr) => i === 0 || i === arr.length - 1).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{teacher.name}</h3>
                    <p className="text-xs text-slate-500">{teacher.id}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subject</span>
                  <span className="font-medium text-slate-800">{teacher.subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Classes</span>
                  <span className="font-medium text-slate-800">{teacher.classes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Students</span>
                  <span className="font-medium text-slate-800">{teacher.students}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 border-slate-200 text-slate-700 hover:bg-slate-50">View Profile</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Classes View ────────────────────────────────────────────────
function ClassesView() {
  const classes = [
    { id: "CLS001", name: "Grade 9-A", teacher: "Ms. Emily Taylor", students: 28, room: "Room 101" },
    { id: "CLS002", name: "Grade 9-B", teacher: "Ms. Emily Taylor", students: 26, room: "Room 102" },
    { id: "CLS003", name: "Grade 10-A", teacher: "Dr. Sarah Miller", students: 30, room: "Room 201" },
    { id: "CLS004", name: "Grade 11-B", teacher: "Mr. James Wilson", students: 25, room: "Room 301" },
    { id: "CLS005", name: "Grade 12-A", teacher: "Mr. Robert Lee", students: 22, room: "Room 401" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Classes</h1>
          <p className="text-slate-500 font-medium">Manage classes, rooms, and schedules.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> New Class
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{cls.name}</h3>
                  <p className="text-xs text-slate-500">{cls.id}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Teacher</span>
                  <span className="font-medium text-slate-800">{cls.teacher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Students</span>
                  <span className="font-medium text-slate-800">{cls.students}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="font-medium text-slate-800">{cls.room}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 border-slate-200 text-slate-700 hover:bg-slate-50">Manage</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Grades View ─────────────────────────────────────────────────
function GradesView() {
  const grades = [
    { student: "Emma Watson", math: 96, science: 92, english: 94, history: 90, avg: 93 },
    { student: "Liam Chen", math: 88, science: 91, english: 85, history: 82, avg: 86.5 },
    { student: "Olivia Davis", math: 92, science: 88, english: 95, history: 91, avg: 91.5 },
    { student: "Noah Martinez", math: 78, science: 82, english: 80, history: 75, avg: 78.75 },
    { student: "Sophia Brown", math: 95, science: 93, english: 91, history: 96, avg: 93.75 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Grades</h1>
          <p className="text-slate-500 font-medium">View and manage student grade records.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Enter Grades
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4 pl-6">Student</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">Math</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">Science</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">English</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">History</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider p-4 pr-6">Average</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {g.student.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{g.student}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-slate-800">{g.math}</td>
                  <td className="p-4 text-center text-sm font-medium text-slate-800">{g.science}</td>
                  <td className="p-4 text-center text-sm font-medium text-slate-800">{g.english}</td>
                  <td className="p-4 text-center text-sm font-medium text-slate-800">{g.history}</td>
                  <td className="p-4 pr-6 text-center">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      g.avg >= 90 ? "bg-green-100 text-green-700" :
                      g.avg >= 80 ? "bg-blue-100 text-blue-700" :
                      g.avg >= 70 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {g.avg}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Attendance View ─────────────────────────────────────────────
function AttendanceView() {
  const records = [
    { student: "Emma Watson", class: "Grade 10-A", date: "2026-08-18", status: "present" as const },
    { student: "Liam Chen", class: "Grade 11-B", date: "2026-08-18", status: "late" as const },
    { student: "Olivia Davis", class: "Grade 9-C", date: "2026-08-18", status: "present" as const },
    { student: "Noah Martinez", class: "Grade 10-A", date: "2026-08-18", status: "absent" as const },
    { student: "Sophia Brown", class: "Grade 12-A", date: "2026-08-18", status: "present" as const },
    { student: "Isabella Wilson", class: "Grade 9-B", date: "2026-08-18", status: "present" as const },
  ];

  const stats = {
    present: records.filter(r => r.status === "present").length,
    late: records.filter(r => r.status === "late").length,
    absent: records.filter(r => r.status === "absent").length,
    total: records.length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Attendance</h1>
          <p className="text-slate-500 font-medium">Track daily attendance across all classes.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Mark Attendance
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <p className="text-xs text-slate-500">Total Students</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50 border-green-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.present}</div>
            <p className="text-xs text-green-600">Present</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50 border-yellow-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
            <p className="text-xs text-yellow-600">Late</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50 border-red-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
            <p className="text-xs text-red-600">Absent</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold">Today&apos;s Attendance — August 18, 2026</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4 pl-6">Student</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">Class</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {r.student.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{r.student}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{r.class}</td>
                  <td className="p-4 text-sm text-slate-600">{r.date}</td>
                  <td className="p-4 pr-6">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      r.status === "present" ? "bg-green-100 text-green-700" :
                      r.status === "late" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {r.status === "present" && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {r.status === "late" && <Clock className="w-3 h-3 inline mr-1" />}
                      {r.status === "absent" && <XCircle className="w-3 h-3 inline mr-1" />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Announcements View ──────────────────────────────────────────
function AnnouncementsView() {
  const announcements = [
    { id: 1, title: "School Reopens September 4th", content: "We hope you had a wonderful summer break. Classes resume on September 4th with a welcome assembly at 8:30 AM.", author: "Principal Johnson", date: "Aug 15, 2026", target: "All" },
    { id: 2, title: "Parent-Teacher Conference", content: "Scheduled for August 22nd. Please book your slot through the parent portal.", author: "Admin Office", date: "Aug 12, 2026", target: "Parents" },
    { id: 3, title: "Science Fair Submissions Open", content: "Students interested in participating in the annual science fair can submit proposals by August 28th.", author: "Dr. Maria Garcia", date: "Aug 10, 2026", target: "Students" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Announcements</h1>
          <p className="text-slate-500 font-medium">Post and view school-wide announcements.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{a.title}</h3>
                    <p className="text-xs text-slate-500">By {a.author} · {a.date}</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">{a.target}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed ml-13">{a.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Settings View ───────────────────────────────────────────────
function SettingsView() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium">Manage system preferences and configuration.</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">School Name</label>
                <Input defaultValue="Philos Academy" className="border-slate-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Academic Year</label>
                <Input defaultValue="2026-2027" className="border-slate-200" />
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Email notifications for attendance alerts", enabled: true },
              { label: "Weekly performance reports to parents", enabled: true },
              { label: "System maintenance announcements", enabled: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-700">{item.label}</span>
                <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${item.enabled ? "bg-blue-600" : "bg-slate-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.enabled ? "translate-x-5" : "translate-x-1"}`}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
