import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Bell, Search, Plus, 
  BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, MessageSquare, Upload, Building2, 
  UserPlus, Settings as SettingsIcon 
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-100/50 z-50 flex flex-col">
        <div className="p-6 border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">Philos <span className="text-yellow-500">EduOS</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">System Administration</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", label: "System Overview", icon: LayoutDashboard },
            { id: "tenants", label: "Tenant Management", icon: Building2 },
            { id: "users", label: "User Administration", icon: Users },
            { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
            { id: "settings", label: "System Configuration", icon: SettingsIcon },
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
              {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "AU"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Admin User"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">System Administrator</p>
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
              <Input placeholder="Search system..." className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full" />
            </div>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">3</span>
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "tenants" && <TenantsSection />}
          {activeSection === "users" && <UsersSection />}
          {activeSection === "analytics" && <AnalyticsSection />}
          {activeSection === "settings" && <SettingsSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const stats = [
    { label: "Total Tenants", value: "12", change: "+2 this month", icon: Building2, color: "bg-blue-50 text-blue-600" },
    { label: "Active Users", value: "1,240", change: "+24 from last month", icon: Users, color: "bg-green-50 text-green-600" },
    { label: "System Uptime", value: "99.9%", change: "Last 30 days", icon: CheckCircle2, color: "bg-slate-50 text-slate-600" },
    { label: "Support Tickets", value: "8", change: "3 pending", icon: MessageSquare, color: "bg-yellow-50 text-yellow-600" },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">System Overview</h1>
        <p className="text-slate-500 font-medium text-lg">Monitor platform health, tenant activity, and system performance.</p>
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
            <CardTitle className="text-base font-bold text-slate-800">Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: "New tenant 'Oakwood Academy' registered", time: "2 mins ago", icon: <Building2 className="w-3.5 h-3.5 text-blue-500" /> },
              { text: "System backup completed successfully", time: "15 mins ago", icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
              { text: "Security update applied to server cluster", time: "1 hour ago", icon: <Settings className="w-3.5 h-3.5 text-slate-500" /> },
              { text: "New admin user created for 'Springfield Elementary'", time: "2 hours ago", icon: <UserPlus className="w-3.5 h-3.5 text-yellow-500" /> },
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
            <CardTitle className="text-base font-bold text-slate-800">Tenant Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Oakwood Academy", users: 156, growth: "+12" },
              { name: "Springfield Elementary", users: 203, growth: "+8" },
              { name: "River Valley High", users: 189, growth: "+15" },
              { name: "Lincoln Middle School", users: 167, growth: "+5" },
              { name: "Washington Academy", users: 145, growth: "+9" },
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
                  <span className="text-sm font-bold text-slate-800">{item.users} users</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-green-600 bg-green-50">
                    {item.growth}
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

function TenantsSection() {
  const tenants = [
    { id: "TNT001", name: "Oakwood Academy", domain: "oakwood.eduos.com", users: 156, status: "active", plan: "Enterprise" },
    { id: "TNT002", name: "Springfield Elementary", domain: "springfield.eduos.com", users: 203, status: "active", plan: "Professional" },
    { id: "TNT003", name: "River Valley High", domain: "rivervalley.eduos.com", users: 189, status: "active", plan: "Enterprise" },
    { id: "TNT004", name: "Lincoln Middle School", domain: "lincoln.eduos.com", users: 167, status: "active", plan: "Basic" },
    { id: "TNT005", name: "Washington Academy", domain: "washington.eduos.com", users: 145, status: "active", plan: "Professional" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Tenant Management</h1>
          <p className="text-slate-500 font-medium">Manage schools and institutions on the platform.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Add New Tenant
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Tenant</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Domain</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Users</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Plan</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {tenant.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium font-mono">{tenant.domain}</td>
                  <td className="p-4 text-sm font-medium text-slate-700">{tenant.users}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      tenant.plan === "Enterprise" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      tenant.plan === "Professional" ? "bg-green-50 text-green-700 border border-green-100" :
                      "bg-slate-50 text-slate-700 border border-slate-200"
                    }`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-semibold">Manage</Button>
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

function UsersSection() {
  const users = [
    { id: "USR001", name: "Admin User", email: "admin@philos-eduos.com", role: "System Admin", tenant: "Oakwood Academy", status: "active" },
    { id: "USR002", name: "Dr. Sarah Miller", email: "s.miller@springfield.edu", role: "Teacher", tenant: "Springfield Elementary", status: "active" },
    { id: "USR003", name: "Emma Watson", email: "emma.w@student.edu", role: "Student", tenant: "River Valley High", status: "active" },
    { id: "USR004", name: "Mark Watson", email: "mark.w@parent.edu", role: "Parent", tenant: "River Valley High", status: "active" },
    { id: "USR005", name: "James Wilson", email: "j.wilson@lincoln.edu", role: "Teacher", tenant: "Lincoln Middle School", status: "active" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">User Administration</h1>
          <p className="text-slate-500 font-medium">Manage users across all tenants and roles.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md">
          <UserPlus className="w-4 h-4" /> Add New User
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">User</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Email</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Role</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Tenant</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">{user.email}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      user.role === "System Admin" ? "bg-red-50 text-red-700 border border-red-100" :
                      user.role === "Teacher" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      user.role === "Student" ? "bg-green-50 text-green-700 border border-green-100" :
                      "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">{user.tenant}</td>
                  <td className="p-4">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                      {user.status}
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

function AnalyticsSection() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Analytics & Reports</h1>
        <p className="text-slate-500 font-medium">View system-wide analytics and generate reports.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Platform Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-slate-500 font-medium">Usage analytics chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Tenant Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-slate-500 font-medium">Growth analytics chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 font-medium">Configure platform settings and preferences.</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Platform Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Platform Name</label>
                <Input defaultValue="Philos EduOS" className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Support Email</label>
                <Input defaultValue="support@philos-eduos.com" className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500" />
              </div>
            </div>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl mt-2 shadow-md">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}