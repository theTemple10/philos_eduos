import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Bell, Search, Plus, 
  BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, MessageSquare, Upload, 
  FileText, Calendar, Download, MapPin, Bus, Phone, AlertTriangle, CheckCircle, BookMarked 
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import RoleSwitcher from "@/components/RoleSwitcher";

export default function ParentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
      {/* Parent Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-100/50 z-50 flex flex-col">
        <div className="p-6 border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">Philos <span className="text-yellow-500">EduOS</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Parent Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
            { id: "children", label: "My Children", icon: Users },
            { id: "performance", label: "Academic Performance", icon: GraduationCap },
            { id: "attendance", label: "Attendance", icon: CheckCircle2 },
            { id: "transportation", label: "Transportation", icon: Bus },
            { id: "materials", label: "Study Materials", icon: BookMarked },
            { id: "announcements", label: "Announcements", icon: Bell },
            { id: "messages", label: "Messages", icon: MessageSquare },
            { id: "payments", label: "Payments", icon: FileText },
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
          <RoleSwitcher currentRole="parent" />
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
              {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "PA"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Parent User"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Parent Account</p>
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
              <Input placeholder="Search children, grades..." className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full" />
            </div>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">4</span>
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "children" && <ChildrenSection />}
          {activeSection === "performance" && <PerformanceSection />}
          {activeSection === "attendance" && <AttendanceSection />}
          {activeSection === "transportation" && <TransportationSection />}
          {activeSection === "materials" && <MaterialsSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "messages" && <MessagesSection />}
          {activeSection === "payments" && <PaymentsSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const stats = [
    { label: "Children Enrolled", value: "2", change: "Active students", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Avg. Performance", value: "89.2%", change: "+2.5% this semester", icon: GraduationCap, color: "bg-green-50 text-green-600" },
    { label: "Attendance Rate", value: "96.8%", change: "This month", icon: CheckCircle2, color: "bg-slate-50 text-slate-600" },
    { label: "Pending Payments", value: "1", change: "Due in 5 days", icon: FileText, color: "bg-yellow-50 text-yellow-600" },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back, Parent</h1>
        <p className="text-slate-500 font-medium text-lg">Monitor your children's academic progress and school activities.</p>
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
            <CardTitle className="text-base font-bold text-slate-800">Children Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Emma Watson", class: "Grade 10-A", grade: "A", attendance: "98%", status: "Active" },
              { name: "Liam Watson", class: "Grade 8-B", grade: "B+", attendance: "95%", status: "Active" },
            ].map((child, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-200">
                    {child.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{child.name}</span>
                    <p className="text-xs text-slate-500">{child.class} • Grade: {child.grade}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-600 font-bold">{child.attendance}</span>
                  <p className="text-[10px] text-slate-500">attendance</p>
                </div>
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
              { text: "Emma scored 96% in Mathematics midterm", time: "2 hours ago", icon: <GraduationCap className="w-3.5 h-3.5 text-green-500" /> },
              { text: "Liam's attendance marked for today", time: "Today", icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> },
              { text: "Parent-teacher conference scheduled", time: "Yesterday", icon: <Calendar className="w-3.5 h-3.5 text-slate-500" /> },
              { text: "Payment due for school transportation", time: "2 days ago", icon: <FileText className="w-3.5 h-3.5 text-yellow-500" /> },
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

function ChildrenSection() {
  const children = [
    { id: "STU001", name: "Emma Watson", class: "Grade 10-A", age: 15, grade: "A", attendance: "98%", status: "active" },
    { id: "STU002", name: "Liam Watson", class: "Grade 8-B", age: 13, grade: "B+", attendance: "95%", status: "active" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Children</h1>
          <p className="text-slate-500 font-medium">View and manage information about your children.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Add Child
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {children.map((child) => (
          <Card key={child.id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold border border-slate-200">
                    {child.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{child.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{child.id} • Age: {child.age}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                  {child.status}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Class</span>
                  <span className="font-bold text-slate-800">{child.class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Grade</span>
                  <span className="font-bold text-slate-800">{child.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Attendance</span>
                  <span className="font-bold text-slate-800">{child.attendance}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">
                  View Details
                </Button>
                <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PerformanceSection() {
  const grades = [
    { child: "Emma Watson", subject: "Mathematics", midterm: 96, final: 94, avg: 95, grade: "A" },
    { child: "Emma Watson", subject: "Physics", midterm: 88, final: 90, avg: 89, grade: "B+" },
    { child: "Emma Watson", subject: "English", midterm: 92, final: 89, avg: 90.5, grade: "A-" },
    { child: "Liam Watson", subject: "Mathematics", midterm: 85, final: 88, avg: 86.5, grade: "B+" },
    { child: "Liam Watson", subject: "Science", midterm: 82, final: 85, avg: 83.5, grade: "B" },
    { child: "Liam Watson", subject: "English", midterm: 88, final: 91, avg: 89.5, grade: "B+" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Academic Performance</h1>
          <p className="text-slate-500 font-medium">View your children's academic performance and progress reports.</p>
        </div>
        <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl">
          <Download className="w-4 h-4 mr-2" /> Download Reports
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Child</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Subject</th>
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
                        {g.child.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{g.child}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{g.subject}</td>
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
    { child: "Emma Watson", date: "Aug 18, 2026", status: "present", classes: "Mathematics, Physics, English" },
    { child: "Emma Watson", date: "Aug 17, 2026", status: "present", classes: "Mathematics, Chemistry, History" },
    { child: "Liam Watson", date: "Aug 18, 2026", status: "present", classes: "Mathematics, Science, English" },
    { child: "Liam Watson", date: "Aug 17, 2026", status: "late", classes: "Mathematics, Science, English" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Attendance Records</h1>
        <p className="text-slate-500 font-medium">Track your children's attendance and participation.</p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Child</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Classes</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {r.child.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{r.child}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{r.date}</td>
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

function TransportationSection() {
  const transportData = [
    { 
      child: "Emma Watson", 
      busNumber: "BUS-101", 
      route: "North Side Route", 
      driver: "Mr. Johnson", 
      phone: "+1 (555) 123-4567", 
      status: "in_transit",
      lastUpdated: "2 mins ago",
      estimatedArrival: "7:45 AM",
      distance: "2.3 km away",
      currentLocation: "Main Street & Oak Avenue"
    },
    { 
      child: "Liam Watson", 
      busNumber: "BUS-102", 
      route: "South Side Route", 
      driver: "Ms. Williams", 
      phone: "+1 (555) 234-5678", 
      status: "at_school",
      lastUpdated: "5 mins ago",
      estimatedArrival: "Arrived",
      distance: "At School",
      currentLocation: "Philos Academy Campus"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_transit": return "bg-blue-50 text-blue-700 border border-blue-100";
      case "at_school": return "bg-green-50 text-green-700 border border-green-100";
      case "arrived": return "bg-green-50 text-green-700 border border-green-100";
      case "delayed": return "bg-yellow-50 text-yellow-700 border border-yellow-100";
      default: return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_transit": return "In Transit";
      case "at_school": return "At School";
      case "arrived": return "Arrived";
      case "delayed": return "Delayed";
      default: return status;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Transportation Tracking</h1>
          <p className="text-slate-500 font-medium">Track your children's bus transportation and receive proximity alerts.</p>
        </div>
        <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl">
          <MapPin className="w-4 h-4 mr-2" /> View Full Map
        </Button>
      </div>

      <div className="grid gap-6">
        {transportData.map((transport, i) => (
          <Card key={i} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Bus className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{transport.child}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">Bus: {transport.busNumber} • Route: {transport.route}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(transport.status)}`}>
                  {getStatusText(transport.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Driver</p>
                  <p className="text-sm font-bold text-slate-800">{transport.driver}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-sm font-bold text-slate-800">{transport.phone}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Distance</p>
                  <p className="text-sm font-bold text-slate-800">{transport.distance}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">ETA</p>
                  <p className="text-sm font-bold text-slate-800">{transport.estimatedArrival}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">Current Location</span>
                </div>
                <p className="text-sm font-medium text-blue-700">{transport.currentLocation}</p>
                <p className="text-xs text-blue-500 mt-1">Last updated: {transport.lastUpdated}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">
                  <Phone className="w-4 h-4 mr-2" /> Contact Driver
                </Button>
                <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Report Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mt-6">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Proximity Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { message: "Emma's bus is 2.3 km away from school", time: "2 mins ago", type: "info" },
            { message: "Liam's bus has arrived at school", time: "5 mins ago", type: "success" },
            { message: "Route 102 experiencing minor delay due to traffic", time: "15 mins ago", type: "warning" },
          ].map((alert, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
              alert.type === "success" ? "bg-green-50/80 border border-green-100" :
              alert.type === "warning" ? "bg-yellow-50/80 border border-yellow-100" :
              "bg-blue-50/80 border border-blue-100"
            }`}>
              <div className="flex items-center gap-3">
                {alert.type === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                {alert.type === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                {alert.type === "info" && <Bus className="w-4 h-4 text-blue-600" />}
                <span className="text-sm font-medium text-slate-700">{alert.message}</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">{alert.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MaterialsSection() {
  const materials = [
    { id: "MAT001", title: "Calculus Chapter 5 Notes", subject: "Mathematics", child: "Emma Watson", type: "PDF", date: "Aug 15, 2026" },
    { id: "MAT002", title: "Physics Lab Report Template", subject: "Physics", child: "Emma Watson", type: "DOCX", date: "Aug 12, 2026" },
    { id: "MAT003", title: "Science Project Guidelines", subject: "Science", child: "Liam Watson", type: "PDF", date: "Aug 10, 2026" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Study Materials</h1>
        <p className="text-slate-500 font-medium">Access study materials and resources for your children.</p>
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
                  <span className="text-slate-500 font-medium">Child</span>
                  <span className="font-bold text-slate-800">{material.child}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Type</span>
                  <span className="font-bold text-slate-800">{material.type}</span>
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
    { id: 1, title: "Parent-Teacher Conferences Scheduled", content: "Conferences will be held next week. Please book your preferred time slots through the system.", author: "Admin Office", date: "Aug 15, 2026", target: "Parents" },
    { id: 2, title: "School Transportation Fee Reminder", content: "Transportation fees for the upcoming semester are due by August 25th.", author: "Finance Office", date: "Aug 12, 2026", target: "Parents" },
    { id: 3, title: "Annual Day Celebration", content: "All parents are cordially invited to attend the Annual Day celebration on September 5th.", author: "Principal Johnson", date: "Aug 10, 2026", target: "Parents" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Announcements</h1>
        <p className="text-slate-500 font-medium">Stay updated with important announcements from the school.</p>
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
    { id: 1, from: "Dr. Sarah Miller", subject: "Emma's Progress Update", preview: "I wanted to share some positive feedback about Emma's performance in mathematics this semester...", time: "2 hours ago", read: false },
    { id: 2, from: "Admin Office", subject: "Fee Payment Confirmation", preview: "This is to confirm that we have received your payment for school transportation...", time: "Yesterday", read: true },
    { id: 3, from: "Mr. James Wilson", subject: "Parent-Teacher Conference Reminder", preview: "This is a reminder about the upcoming parent-teacher conference scheduled for next week...", time: "2 days ago", read: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Messages</h1>
          <p className="text-slate-500 font-medium">Communicate with teachers and school administration.</p>
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

function PaymentsSection() {
  const payments = [
    { id: "PAY001", description: "School Transportation Fee - Fall 2026", amount: "$450.00", status: "completed", date: "Aug 15, 2026", child: "Emma Watson" },
    { id: "PAY002", description: "School Transportation Fee - Fall 2026", amount: "$450.00", status: "pending", date: "Due Aug 25, 2026", child: "Liam Watson" },
    { id: "PAY003", description: "Science Lab Materials Fee", amount: "$75.00", status: "completed", date: "Aug 10, 2026", child: "Emma Watson" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Payments</h1>
          <p className="text-slate-500 font-medium">Manage payments and view transaction history.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Make Payment
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Description</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Child</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Amount</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-sm font-medium text-slate-800">{payment.description}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{payment.child}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{payment.amount}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{payment.date}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      payment.status === "completed" ? "bg-green-50 text-green-700 border border-green-100" :
                      "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-semibold">
                      {payment.status === "pending" ? "Pay Now" : "Receipt"}
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

