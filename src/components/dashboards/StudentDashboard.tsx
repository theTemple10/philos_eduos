import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Bell, Search, Plus, 
  BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, MessageSquare, Upload, 
  FileText, Calendar, Download, BookMarked, ClipboardCheck 
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

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

        <div className="p-4 border-t border-slate-100/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
              {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "ST"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Student User"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Grade 10-A</p>
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
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">2</span>
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
  const stats = [
    { label: "Overall Grade", value: "87.5%", change: "+3.2% this semester", icon: GraduationCap, color: "bg-green-50 text-green-600" },
    { label: "Attendance Rate", value: "94.1%", change: "This month", icon: ClipboardCheck, color: "bg-blue-50 text-blue-600" },
    { label: "Assignments Due", value: "3", change: "Due this week", icon: FileText, color: "bg-yellow-50 text-yellow-600" },
    { label: "Rank in Class", value: "#5", change: "Out of 32 students", icon: BarChart3, color: "bg-slate-50 text-slate-600" },
  ];

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
              { time: "08:00 AM", class: "Mathematics", teacher: "Dr. Sarah Miller", room: "Room 201" },
              { time: "10:00 AM", class: "Physics", teacher: "Mr. James Wilson", room: "Room 301" },
              { time: "02:00 PM", class: "English", teacher: "Ms. Emily Taylor", room: "Room 102" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full"><Calendar className="w-3.5 h-3.5 text-slate-500" /></div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{item.class}</span>
                    <p className="text-xs text-slate-500">{item.teacher} • {item.room}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Recent Grades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { subject: "Mathematics", grade: "A", score: "96%", date: "Aug 15, 2026" },
              { subject: "Physics", grade: "B+", score: "88%", date: "Aug 12, 2026" },
              { subject: "English", grade: "A-", score: "92%", date: "Aug 10, 2026" },
              { subject: "History", grade: "B", score: "85%", date: "Aug 8, 2026" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full"><GraduationCap className="w-3.5 h-3.5 text-slate-500" /></div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{item.subject}</span>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{item.score}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    item.grade.startsWith("A") ? "text-green-600 bg-green-50" :
                    item.grade.startsWith("B") ? "text-blue-600 bg-blue-50" :
                    "text-yellow-600 bg-yellow-50"
                  }`}>
                    {item.grade}
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

function GradesSection() {
  const grades = [
    { subject: "Mathematics", teacher: "Dr. Sarah Miller", midterm: 96, final: 94, avg: 95, grade: "A" },
    { subject: "Physics", teacher: "Mr. James Wilson", midterm: 88, final: 90, avg: 89, grade: "B+" },
    { subject: "English", teacher: "Ms. Emily Taylor", midterm: 92, final: 89, avg: 90.5, grade: "A-" },
    { subject: "History", teacher: "Mr. Robert Lee", midterm: 85, final: 88, avg: 86.5, grade: "B+" },
    { subject: "Chemistry", teacher: "Dr. Maria Garcia", midterm: 91, final: 93, avg: 92, grade: "A-" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Grades</h1>
          <p className="text-slate-500 font-medium">View your academic performance and grade reports.</p>
        </div>
        <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl">
          <Download className="w-4 h-4 mr-2" /> Download Report Card
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Overall Performance</h3>
              <p className="text-slate-500 font-medium">Current semester average across all subjects</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extrabold text-slate-800">90.6%</div>
              <p className="text-sm text-green-600 font-bold">+3.2% from last semester</p>
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
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Teacher</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Midterm</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Final</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Average</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center pr-6">Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {g.subject.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{g.subject}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{g.teacher}</td>
                  <td className="p-4 text-center text-sm font-bold text-slate-700">{g.midterm}</td>
                  <td className="p-4 text-center text-sm font-bold text-slate-700">{g.final}</td>
                  <td className="p-4 text-center text-sm font-bold text-slate-700">{g.avg}%</td>
                  <td className="p-4 pr-6 text-center">
                    <span className={`text-sm font-extrabold px-3 py-1.5 rounded-full ${
                      g.grade.startsWith("A") ? "bg-green-50 text-green-700 border border-green-100" :
                      g.grade.startsWith("B") ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    }`}>
                      {g.grade}
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

function AttendanceSection() {
  const records = [
    { date: "Aug 18, 2026", status: "present", classes: "Mathematics, Physics, English" },
    { date: "Aug 17, 2026", status: "present", classes: "Mathematics, Chemistry, History" },
    { date: "Aug 16, 2026", status: "late", classes: "Mathematics, Physics, English" },
    { date: "Aug 15, 2026", status: "present", classes: "Mathematics, Chemistry, History" },
    { date: "Aug 14, 2026", status: "absent", classes: "Mathematics, Physics, English" },
  ];

  const stats = {
    present: 45,
    late: 3,
    absent: 2,
    total: 50,
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
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Classes</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-sm font-medium text-slate-700">{r.date}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{r.classes}</td>
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

function MaterialsSection() {
  const materials = [
    { id: "MAT001", title: "Calculus Chapter 5 Notes", subject: "Mathematics", type: "PDF", size: "2.4 MB", date: "Aug 15, 2026", teacher: "Dr. Sarah Miller" },
    { id: "MAT002", title: "Physics Lab Report Template", subject: "Physics", type: "DOCX", size: "1.8 MB", date: "Aug 12, 2026", teacher: "Mr. James Wilson" },
    { id: "MAT003", title: "English Literature Analysis", subject: "English", type: "PDF", size: "3.1 MB", date: "Aug 10, 2026", teacher: "Ms. Emily Taylor" },
    { id: "MAT004", title: "Chemistry Periodic Table", subject: "Chemistry", type: "PDF", size: "1.2 MB", date: "Aug 8, 2026", teacher: "Dr. Maria Garcia" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Study Materials</h1>
          <p className="text-slate-500 font-medium">Access study materials, notes, and resources from your teachers.</p>
        </div>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search materials..." className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full" />
        </div>
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
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{material.subject}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Teacher</span>
                  <span className="font-bold text-slate-800">{material.teacher}</span>
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
              <Button variant="outline" className="w-full mt-6 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  const announcements = [
    { id: 1, title: "Fall Semester Exam Schedule", content: "The examination schedule for the fall semester has been published. Please review the dates and prepare accordingly.", author: "Principal Johnson", date: "Aug 15, 2026", target: "Students" },
    { id: 2, title: "Science Fair Submissions Open", content: "Students interested in participating in the annual science fair can submit their proposals until August 28th.", author: "Dr. Maria Garcia", date: "Aug 12, 2026", target: "Students" },
    { id: 3, title: "Library Extended Hours", content: "The school library will remain open until 6 PM during the examination period to accommodate study sessions.", author: "Admin Office", date: "Aug 10, 2026", target: "Students" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Announcements</h1>
        <p className="text-slate-500 font-medium">Stay updated with the latest news and announcements from school.</p>
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

function MessagesSection() {
  const messages = [
    { id: 1, from: "Dr. Sarah Miller", subject: "Mathematics Assignment Feedback", preview: "Great work on your recent assignment, Emma! I've attached some comments for improvement...", time: "2 hours ago", read: false },
    { id: 2, from: "Admin Office", subject: "Parent-Teacher Conference Schedule", preview: "Please inform your parents about the upcoming conference scheduled for next week...", time: "Yesterday", read: true },
    { id: 3, from: "Mr. James Wilson", subject: "Physics Lab Report Reminder", preview: "This is a reminder that your physics lab report is due by end of this week...", time: "2 days ago", read: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Messages</h1>
          <p className="text-slate-500 font-medium">Communicate with teachers and administration.</p>
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

function ScheduleSection() {
  const schedule = [
    { time: "08:00 - 09:30", class: "Mathematics", teacher: "Dr. Sarah Miller", room: "Room 201", days: "Mon, Wed, Fri" },
    { time: "09:45 - 11:15", class: "Physics", teacher: "Mr. James Wilson", room: "Room 301", days: "Mon, Tue, Thu" },
    { time: "11:30 - 13:00", class: "English", teacher: "Ms. Emily Taylor", room: "Room 102", days: "Mon, Wed, Fri" },
    { time: "14:00 - 15:30", class: "Chemistry", teacher: "Dr. Maria Garcia", room: "Room 401", days: "Tue, Thu" },
    { time: "15:45 - 17:15", class: "History", teacher: "Mr. Robert Lee", room: "Room 203", days: "Mon, Wed" },
  ];

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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}