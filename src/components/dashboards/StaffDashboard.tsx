import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Bell, Search, Plus, 
  BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, MessageSquare, Upload, 
  FileText, Calendar, Download, ClipboardCheck, Wrench, Package 
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import RoleSwitcher from "@/components/RoleSwitcher";

export default function StaffDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
      {/* Staff Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-100/50 z-50 flex flex-col">
        <div className="p-6 border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">Philos <span className="text-yellow-500">EduOS</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Staff Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
            { id: "tasks", label: "My Tasks", icon: ClipboardCheck },
            { id: "inventory", label: "Inventory", icon: Package },
            { id: "maintenance", label: "Maintenance", icon: Wrench },
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
          <RoleSwitcher currentRole="staff" />
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
              {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "SF"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Staff User"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Non-Teaching Staff</p>
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
              <Input placeholder="Search tasks, inventory..." className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full" />
            </div>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">2</span>
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "tasks" && <TasksSection />}
          {activeSection === "inventory" && <InventorySection />}
          {activeSection === "maintenance" && <MaintenanceSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "messages" && <MessagesSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const stats = [
    { label: "Pending Tasks", value: "5", change: "Due this week", icon: ClipboardCheck, color: "bg-yellow-50 text-yellow-600" },
    { label: "Completed Today", value: "3", change: "Tasks completed", icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "Inventory Items", value: "124", change: "In stock", icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Maintenance Requests", value: "2", change: "Pending", icon: Wrench, color: "bg-slate-50 text-slate-600" },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back, Staff</h1>
        <p className="text-slate-500 font-medium text-lg">Manage your daily tasks and school operations.</p>
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
            <CardTitle className="text-base font-bold text-slate-800">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { task: "Restock library supplies", priority: "High", time: "10:00 AM" },
              { task: "Clean science laboratory", priority: "Medium", time: "11:30 AM" },
              { task: "Prepare cafeteria for lunch service", priority: "High", time: "12:00 PM" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.priority === "High" ? "bg-red-500" : 
                    item.priority === "Medium" ? "bg-yellow-500" : "bg-green-500"
                  }`}></div>
                  <span className="text-sm font-medium text-slate-700">{item.task}</span>
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
              { text: "Completed library inventory check", time: "2 hours ago", icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
              { text: "Submitted maintenance request for AC unit", time: "Yesterday", icon: <Wrench className="w-3.5 h-3.5 text-slate-500" /> },
              { text: "Restocked first aid supplies", time: "2 days ago", icon: <Package className="w-3.5 h-3.5 text-blue-500" /> },
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

function TasksSection() {
  const tasks = [
    { id: "TSK001", title: "Restock library supplies", description: "Check inventory and restock stationery and books", priority: "High", status: "pending", dueDate: "Aug 20, 2026" },
    { id: "TSK002", title: "Clean science laboratory", description: "Deep clean and sanitize all lab equipment", priority: "Medium", status: "in_progress", dueDate: "Aug 19, 2026" },
    { id: "TSK003", title: "Prepare cafeteria for lunch", description: "Set up tables and assist with food service", priority: "High", status: "completed", dueDate: "Aug 18, 2026" },
    { id: "TSK004", title: "File student records", description: "Organize and file new student enrollment documents", priority: "Low", status: "pending", dueDate: "Aug 22, 2026" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Tasks</h1>
          <p className="text-slate-500 font-medium">Manage your daily tasks and assignments.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Add New Task
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Task</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Priority</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Due Date</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{task.title}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      task.priority === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                      task.priority === "Medium" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                      "bg-green-50 text-green-700 border border-green-100"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      task.status === "completed" ? "bg-green-50 text-green-700 border border-green-100" :
                      task.status === "in_progress" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      "bg-slate-50 text-slate-700 border border-slate-200"
                    }`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{task.dueDate}</td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-semibold">
                      {task.status === "completed" ? "View" : "Update"}
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

function InventorySection() {
  const items = [
    { id: "INV001", name: "Printer Paper (A4)", category: "Stationery", quantity: 50, unit: "reams", status: "in_stock" },
    { id: "INV002", name: "First Aid Kit", category: "Medical", quantity: 12, unit: "kits", status: "in_stock" },
    { id: "INV003", name: "Cleaning Supplies", category: "Cleaning", quantity: 25, unit: "sets", status: "low_stock" },
    { id: "INV004", name: "Lab Equipment", category: "Science", quantity: 8, unit: "sets", status: "in_stock" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Inventory Management</h1>
          <p className="text-slate-500 font-medium">Track and manage school supplies and equipment.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Add New Item
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Item</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Category</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Quantity</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {item.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{item.category}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{item.quantity} {item.unit}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      item.status === "in_stock" ? "bg-green-50 text-green-700 border border-green-100" :
                      "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    }`}>
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-semibold">Edit</Button>
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

function MaintenanceSection() {
  const requests = [
    { id: "MNT001", title: "AC Unit Not Working", location: "Room 201", priority: "High", status: "pending", submittedBy: "Dr. Sarah Miller", date: "Aug 15, 2026" },
    { id: "MNT002", title: "Leaky Faucet", location: "Boys Restroom - 2nd Floor", priority: "Medium", status: "in_progress", submittedBy: "Admin Office", date: "Aug 12, 2026" },
    { id: "MNT003", title: "Broken Window", location: "Room 102", priority: "Low", status: "completed", submittedBy: "Ms. Emily Taylor", date: "Aug 10, 2026" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Maintenance Requests</h1>
          <p className="text-slate-500 font-medium">Track and manage maintenance and repair requests.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Request</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Location</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Priority</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Date</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{request.title}</span>
                      <p className="text-xs text-slate-500 mt-0.5">Submitted by {request.submittedBy}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{request.location}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      request.priority === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                      request.priority === "Medium" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                      "bg-green-50 text-green-700 border border-green-100"
                    }`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      request.status === "completed" ? "bg-green-50 text-green-700 border border-green-100" :
                      request.status === "in_progress" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      "bg-slate-50 text-slate-700 border border-slate-200"
                    }`}>
                      {request.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{request.date}</td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-semibold">
                      {request.status === "completed" ? "View" : "Update"}
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

function AnnouncementsSection() {
  const announcements = [
    { id: 1, title: "Staff Meeting Reminder", content: "All staff members are required to attend the monthly meeting tomorrow at 3 PM in the conference room.", author: "Admin Office", date: "Aug 15, 2026", target: "Staff" },
    { id: 2, title: "New Safety Protocols", content: "Updated safety protocols have been implemented. Please review the attached document and acknowledge receipt.", author: "Safety Officer", date: "Aug 12, 2026", target: "Staff" },
    { id: 3, title: "Holiday Schedule", content: "The school will remain closed on August 25th for the national holiday. Please plan your tasks accordingly.", author: "HR Department", date: "Aug 10, 2026", target: "Staff" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Announcements</h1>
        <p className="text-slate-500 font-medium">Stay updated with important announcements for staff members.</p>
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
    { id: 1, from: "Admin Office", subject: "Task Assignment Update", preview: "Please note that your task assignments have been updated for this week...", time: "2 hours ago", read: false },
    { id: 2, from: "HR Department", subject: "Leave Request Approved", preview: "Your leave request for August 25th has been approved. Please ensure all tasks are completed before...", time: "Yesterday", read: true },
    { id: 3, from: "Safety Officer", subject: "Safety Training Schedule", preview: "Mandatory safety training will be conducted next week. Please confirm your availability...", time: "2 days ago", read: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Messages</h1>
          <p className="text-slate-500 font-medium">Communicate with administration and other staff members.</p>
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