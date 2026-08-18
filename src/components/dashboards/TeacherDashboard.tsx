import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Bell, Search, Plus, 
  BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, MessageSquare, Upload, 
  ClipboardCheck, FileText, Calendar, UserPlus 
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import RoleSwitcher from "@/components/RoleSwitcher";

export default function TeacherDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
          <RoleSwitcher currentRole="teacher" />
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
              {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "TM"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Teacher User"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Mathematics Dept.</p>
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
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">5</span>
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "classes" && <ClassesSection />}
          {activeSection === "attendance" && <AttendanceSection />}
          {activeSection === "grades" && <GradesSection />}
          {activeSection === "materials" && <MaterialsSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "messages" && <MessagesSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const stats = [
    { label: "My Classes", value: "3", change: "2 sections", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Total Students", value: "87", change: "Across all classes", icon: GraduationCap, color: "bg-green-50 text-green-600" },
    { label: "Avg. Performance", value: "82.5%", change: "+3.2% this semester", icon: BarChart3, color: "bg-yellow-50 text-yellow-600" },
    { label: "Attendance Rate", value: "94.1%", change: "Today", icon: CheckCircle2, color: "bg-slate-50 text-slate-600" },
  ];

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
            {[
              { time: "08:00 AM", class: "Grade 10-A", subject: "Mathematics", room: "Room 201" },
              { time: "10:00 AM", class: "Grade 11-B", subject: "Calculus", room: "Room 301" },
              { time: "02:00 PM", class: "Grade 12-A", subject: "Advanced Math", room: "Room 401" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full"><Calendar className="w-3.5 h-3.5 text-slate-500" /></div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{item.class}</span>
                    <p className="text-xs text-slate-500">{item.subject} • {item.room}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: "Grades submitted for Grade 10-A midterm", time: "2 hours ago", icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
              { text: "New study material uploaded for Calculus", time: "Yesterday", icon: <FileText className="w-3.5 h-3.5 text-blue-500" /> },
              { text: "Attendance marked for all classes", time: "Yesterday", icon: <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" /> },
              { text: "Parent message received about Emma Watson", time: "2 days ago", icon: <MessageSquare className="w-3.5 h-3.5 text-yellow-500" /> },
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
      </div>
    </div>
  );
}

function ClassesSection() {
  const classes = [
    { id: "CLS001", name: "Grade 10-A", subject: "Mathematics", students: 32, room: "Room 201", schedule: "Mon, Wed, Fri 8:00 AM" },
    { id: "CLS002", name: "Grade 11-B", subject: "Calculus", students: 28, room: "Room 301", schedule: "Tue, Thu 10:00 AM" },
    { id: "CLS003", name: "Grade 12-A", subject: "Advanced Math", students: 27, room: "Room 401", schedule: "Mon, Wed 2:00 PM" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Classes</h1>
          <p className="text-slate-500 font-medium">Manage your classes, view student lists, and update schedules.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Request New Class
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium tracking-wide">{cls.id}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subject</span>
                  <span className="font-bold text-slate-800">{cls.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Students</span>
                  <span className="font-bold text-slate-800">{cls.students}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Room</span>
                  <span className="font-bold text-slate-800">{cls.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Schedule</span>
                  <span className="font-bold text-slate-800 text-xs">{cls.schedule}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">
                  View Students
                </Button>
                <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AttendanceSection() {
  const students = [
    { id: "STU001", name: "Emma Watson", class: "Grade 10-A", status: "present" as const },
    { id: "STU002", name: "Liam Chen", class: "Grade 10-A", status: "present" as const },
    { id: "STU003", name: "Olivia Davis", class: "Grade 10-A", status: "late" as const },
    { id: "STU004", name: "Noah Martinez", class: "Grade 10-A", status: "absent" as const },
    { id: "STU005", name: "Sophia Brown", class: "Grade 10-A", status: "present" as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Attendance Management</h1>
          <p className="text-slate-500 font-medium">Mark and track student attendance for your classes.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl">
            <Calendar className="w-4 h-4 mr-2" /> View History
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
            <CheckCircle2 className="w-4 h-4" /> Save Attendance
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-bold text-slate-700 block mb-2">Select Class</label>
              <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500">
                <option>Grade 10-A - Mathematics</option>
                <option>Grade 11-B - Calculus</option>
                <option>Grade 12-A - Advanced Math</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold text-slate-700 block mb-2">Date</label>
              <Input type="date" defaultValue="2026-08-18" className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
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
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      student.status === "present" ? "bg-green-50 text-green-700 border border-green-100" :
                      student.status === "late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                      "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 font-semibold">Present</Button>
                      <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-semibold">Late</Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold">Absent</Button>
                    </div>
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

function GradesSection() {
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Grade Book</h1>
          <p className="text-slate-500 font-medium">Enter and manage student grades and academic performance.</p>
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

function MaterialsSection() {
  const materials = [
    { id: "MAT001", title: "Calculus Chapter 5 Notes", subject: "Mathematics", type: "PDF", size: "2.4 MB", date: "Aug 15, 2026" },
    { id: "MAT002", title: "Algebra Practice Problems", subject: "Mathematics", type: "DOCX", size: "1.8 MB", date: "Aug 12, 2026" },
    { id: "MAT003", title: "Geometry Video Tutorial", subject: "Mathematics", type: "MP4", size: "124 MB", date: "Aug 10, 2026" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Study Materials</h1>
          <p className="text-slate-500 font-medium">Upload and manage study materials for your students.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Upload className="w-4 h-4" /> Upload Material
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <Card key={material.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{material.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{material.id}</p>
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
                  <span className="font-bold text-slate-800">{material.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Size</span>
                  <span className="font-bold text-slate-800">{material.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Uploaded</span>
                  <span className="font-bold text-slate-800">{material.date}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">
                  Download
                </Button>
                <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl">
                  <Settings className="w-4 h-4" />
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
  const announcements = [
    { id: 1, title: "Parent-Teacher Conferences Next Week", content: "Please prepare student progress reports for the upcoming conferences scheduled for next week.", date: "Aug 15, 2026", target: "Teachers" },
    { id: 2, title: "New Grading System Implementation", content: "The new grading system will be implemented starting next semester. Please review the attached documentation.", date: "Aug 12, 2026", target: "Teachers" },
    { id: 3, title: "Professional Development Workshop", content: "Mandatory attendance for all teaching staff on August 25th. Topics include modern teaching methodologies.", date: "Aug 10, 2026", target: "Teachers" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Announcements</h1>
          <p className="text-slate-500 font-medium">View announcements and updates from administration.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Create Announcement
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
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{a.date}</p>
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
  const messages = [
    { id: 1, from: "Mark Watson", subject: "Question about Emma's progress", preview: "Hi, I wanted to ask about Emma's recent performance in mathematics...", time: "2 hours ago", read: false },
    { id: 2, from: "Admin Office", subject: "Staff meeting reminder", preview: "This is a reminder about the upcoming staff meeting tomorrow at 3 PM...", time: "Yesterday", read: true },
    { id: 3, from: "Wei Chen", subject: "Liam's absence notification", preview: "Please be informed that Liam will be absent tomorrow due to a medical appointment...", time: "2 days ago", read: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Messages</h1>
          <p className="text-slate-500 font-medium">Communicate with students, parents, and administration.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <MessageSquare className="w-4 h-4" /> New Message
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">From</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Subject</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Preview</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Time</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${!message.read ? "bg-blue-50/30" : ""}`}>
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {message.from.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{message.from}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{message.subject}</td>
                  <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{message.preview}</td>
                  <td className="p-4 text-xs text-slate-400 font-medium">{message.time}</td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-semibold">
                      {message.read ? "Reply" : "Read"}
                    </Button>
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