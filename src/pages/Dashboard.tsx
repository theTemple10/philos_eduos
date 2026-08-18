import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Bell, Search, Plus, BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, MessageSquare, Upload } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
      <Sidebar role={role} currentView={currentView} onNavigate={setCurrentView} />
      <div className="pl-64 transition-all duration-300">
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight capitalize">{currentView}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search..." className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full" />
            </div>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || "Admin User"}</p>
                <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border-2 border-white shadow-sm">
                {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "AU"}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
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
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back, Admin</h1>
        <p className="text-slate-500 font-medium text-lg">Here&apos;s an overview of your institution&apos;s activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Total Students</CardTitle>
            <div className="bg-blue-50 p-2 rounded-lg"><GraduationCap className="h-4 w-4 text-blue-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800">1,240</div>
            <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-2 bg-green-50 inline-flex px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3" /> +24 from last month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Active Teachers</CardTitle>
            <div className="bg-slate-50 p-2 rounded-lg"><Users className="h-4 w-4 text-slate-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800">64</div>
            <p className="text-xs text-slate-500 font-bold mt-2 bg-slate-50 inline-flex px-2 py-1 rounded-full">Across 12 departments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Attendance Rate</CardTitle>
            <div className="bg-green-50 p-2 rounded-lg"><LayoutDashboard className="h-4 w-4 text-green-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800">94.2%</div>
            <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-2 bg-green-50 inline-flex px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3" /> +1.3% today</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Avg. Performance</CardTitle>
            <div className="bg-yellow-50 p-2 rounded-lg"><BarChart3 className="h-4 w-4 text-yellow-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-800">78.5%</div>
            <p className="text-xs text-slate-500 font-bold mt-2 bg-slate-50 inline-flex px-2 py-1 rounded-full">Across all classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm mb-10 border-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-semibold hover:bg-slate-900 hover:text-white transition-all">
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </Button>
          <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-semibold hover:bg-slate-900 hover:text-white transition-all">
            <Upload className="w-4 h-4 mr-2" /> Upload Content
          </Button>
          <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-semibold hover:bg-slate-900 hover:text-white transition-all">
            <MessageSquare className="w-4 h-4 mr-2" /> Send Message
          </Button>
          <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-semibold hover:bg-slate-900 hover:text-white transition-all">
            <BarChart3 className="w-4 h-4 mr-2" /> View Reports
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: "Emma Watson checked in for class", time: "2 mins ago", icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
              { text: "New content uploaded by Dr. Miller", time: "15 mins ago", icon: <Upload className="w-3.5 h-3.5 text-blue-500" /> },
              { text: "System update completed successfully", time: "1 hour ago", icon: <Settings className="w-3.5 h-3.5 text-slate-500" /> },
              { text: "Parent message received from Sarah Davis", time: "2 hours ago", icon: <MessageSquare className="w-3.5 h-3.5 text-yellow-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full">{item.icon}</div>
                  <span className="text-sm font-medium text-slate-700">{item.text}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Emma Watson", score: 96, trend: "+4" },
              { name: "Liam Chen", score: 93, trend: "+2" },
              { name: "Olivia Davis", score: 91, trend: "-1" },
              { name: "Noah Martinez", score: 89, trend: "+7" },
              { name: "Sophia Brown", score: 88, trend: "+3" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-5">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                    {item.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{item.score}%</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${item.trend.startsWith("+") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                    {item.trend}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Student Directory</h1>
          <p className="text-slate-500 font-medium">Manage and review student records across all classes.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Add New Student
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm mb-6 border-slate-100">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by name, class, or student ID..." className="pl-9 border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
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
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Class</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Parent / Guardian</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium font-mono">{student.id}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{student.class}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{student.parent}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      student.status === "active" ? "bg-green-50 text-green-700 border border-green-100" : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-semibold">View</Button>
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Teaching Staff</h1>
          <p className="text-slate-500 font-medium">Manage educators, assignments, and departmental allocations.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Add New Teacher
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-200">
                    {teacher.name.split(" ").filter((_, i, arr) => i === 0 || i === arr.length - 1).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{teacher.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{teacher.id}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subject</span>
                  <span className="font-bold text-slate-800">{teacher.subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Classes</span>
                  <span className="font-bold text-slate-800">{teacher.classes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Students</span>
                  <span className="font-bold text-slate-800">{teacher.students}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">View Profile</Button>
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Academic Classes</h1>
          <p className="text-slate-500 font-medium">Organize classes, rooms, and teacher assignments.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Create New Class
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium tracking-wide">{cls.id}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Lead Teacher</span>
                  <span className="font-bold text-slate-800">{cls.teacher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Students</span>
                  <span className="font-bold text-slate-800">{cls.students}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Location</span>
                  <span className="font-bold text-slate-800">{cls.room}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">Manage Class</Button>
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Academic Performance</h1>
          <p className="text-slate-500 font-medium">Review and manage student grade records and analytics.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Enter New Grades
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Student</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Mathematics</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Science</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">English</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">History</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center pr-6">Average</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {g.student.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{g.student}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-sm font-bold text-slate-700">{g.math}</td>
                  <td className="p-4 text-center text-sm font-bold text-slate-700">{g.science}</td>
                  <td className="p-4 text-center text-sm font-bold text-slate-700">{g.english}</td>
                  <td className="p-4 text-center text-sm font-bold text-slate-700">{g.history}</td>
                  <td className="p-4 pr-6 text-center">
                    <span className={`text-sm font-extrabold px-3 py-1.5 rounded-full ${
                      g.avg >= 90 ? "bg-green-50 text-green-700 border border-green-100" :
                      g.avg >= 80 ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      g.avg >= 70 ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                      "bg-red-50 text-red-700 border border-red-100"
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Daily Attendance</h1>
          <p className="text-slate-500 font-medium">Track and manage student attendance across all sessions.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Mark Attendance
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-4 mb-8">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-slate-800">{stats.total}</div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Total Enrolled</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50/50 border-green-100/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-green-700">{stats.present}</div>
            <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider mt-1">Present Today</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50/50 border-yellow-100/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-yellow-700">{stats.late}</div>
            <p className="text-[11px] text-yellow-600 font-bold uppercase tracking-wider mt-1">Arrived Late</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50/50 border-red-100/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-extrabold text-red-700">{stats.absent}</div>
            <p className="text-[11px] text-red-600 font-bold uppercase tracking-wider mt-1">Absent Today</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Attendance Records — August 18, 2026</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Student</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Class</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {r.student.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{r.student}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{r.class}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{r.date}</td>
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
    { id: 1, title: "Fall Semester Officially Begins", content: "We look forward to welcoming all students back on September 4th. Please ensure all required documentation is submitted prior to arrival.", author: "Principal Johnson", date: "Aug 15, 2026", target: "All" },
    { id: 2, title: "Parent-Teacher Conferences Scheduled", content: "Scheduled for August 22nd. Parents can book their preferred time slots directly through the system.", author: "Admin Office", date: "Aug 12, 2026", target: "Parents" },
    { id: 3, title: "Annual Science Fair Submissions Now Open", content: "Students interested in presenting research are encouraged to submit their proposals by August 28th.", author: "Dr. Maria Garcia", date: "Aug 10, 2026", target: "Students" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Institutional Announcements</h1>
          <p className="text-slate-500 font-medium">Share important updates and information with the school community.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Create New Post
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{a.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Posted by {a.author} · {a.date}</p>
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

// ─── Settings View ───────────────────────────────────────────────
function SettingsView() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 font-medium">Manage institutional details and system preferences.</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Institutional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Institution Name</label>
                <Input defaultValue="Philos Academy" className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Academic Year</label>
                <Input defaultValue="2026 - 2027" className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">System Email</label>
                <Input defaultValue="admin@philos-eduos.com" className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Support Contact</label>
                <Input defaultValue="support@philos-eduos.com" className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
              </div>
            </div>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl mt-2 shadow-md">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Email alerts for attendance and performance anomalies", enabled: true },
              { label: "Weekly performance summaries for parents and guardians", enabled: true },
              { label: "System maintenance and security updates", enabled: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner ${item.enabled ? "bg-slate-900" : "bg-slate-200"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.enabled ? "translate-x-6" : "translate-x-1"}`}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}