import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  LayoutDashboard,
  Bell,
  Search,
  MessageSquare,
  ClipboardCheck,
  Wrench,
  Package,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

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
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
              {user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "SF"}
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
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "tasks" && <TasksSection />}
          {activeSection === "inventory" && <PlaceholderSection title="Inventory" message="Inventory tracking isn't part of this milestone yet. Ask your school admin for details." />}
          {activeSection === "maintenance" && <PlaceholderSection title="Maintenance" message="Maintenance requests aren't part of this milestone yet. Ask your school admin for details." />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "messages" && <MessagesSection />}
        </div>
      </div>
    </div>
  );
}

function PlaceholderSection({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{title}</h1>
      </div>
      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardContent className="p-10 text-center">
          <p className="text-slate-500 font-medium max-w-md mx-auto">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewSection() {
  const tasks = useQuery(api.tasks.getMyTasks);
  const announcements = useQuery(api.announcements.getAnnouncements);
  const messages = useQuery(api.messages.getMessages);

  if (tasks === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  const pending = tasks.filter((t) => t.status !== "completed").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const unread = (messages ?? []).filter((m) => !m.read).length;

  const stats = [
    { label: "Pending Tasks", value: String(pending), change: "Assigned to me", icon: ClipboardCheck, color: "bg-yellow-50 text-yellow-600" },
    { label: "Completed Tasks", value: String(completed), change: "All time", icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "Announcements", value: String(announcements?.length ?? 0), change: "From the school", icon: Bell, color: "bg-blue-50 text-blue-600" },
    { label: "Unread Messages", value: String(unread), change: "Inbox", icon: MessageSquare, color: "bg-slate-50 text-slate-600" },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back, Staff</h1>
        <p className="text-slate-500 font-medium text-lg">Here&apos;s an overview of your tasks and school updates.</p>
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

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 && <p className="text-sm text-slate-500 font-medium">No tasks assigned yet.</p>}
          {tasks.slice(0, 5).map((t) => (
            <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{t.title}</p>
                {t.dueDate && <p className="text-xs text-slate-400 font-medium">Due {t.dueDate}</p>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                t.status === "completed" ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
              }`}>{t.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TasksSection() {
  const tasks = useQuery(api.tasks.getMyTasks);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (tasks === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  const priorityColor = (p: string) =>
    p === "high" ? "bg-red-50 text-red-700 border border-red-100" : p === "medium" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "bg-slate-50 text-slate-700 border border-slate-200";

  const handleComplete = async (id: Id<"tasks">) => {
    setBusyId(id);
    try {
      await updateTask({ id, status: "completed" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: Id<"tasks">) => {
    setBusyId(id);
    try {
      await deleteTask({ id });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Tasks</h1>
        <p className="text-slate-500 font-medium">Tasks assigned to you by the school administration.</p>
      </div>

      {tasks.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">No tasks assigned to you yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tasks.map((t) => (
          <Card key={t._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-800">{t.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityColor(t.priority)}`}>{t.priority}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      t.status === "completed" ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                    }`}>{t.status}</span>
                  </div>
                  {t.description && <p className="text-sm text-slate-600 font-medium">{t.description}</p>}
                  {t.dueDate && <p className="text-xs text-slate-400 font-medium mt-1">Due {t.dueDate}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {t.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-green-600 hover:bg-green-50 font-semibold rounded-xl"
                      onClick={() => handleComplete(t._id)}
                      disabled={busyId === t._id}
                    >
                      {busyId === t._id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Mark Complete"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold"
                    onClick={() => handleDelete(t._id)}
                    disabled={busyId === t._id}
                  >
                    Delete
                  </Button>
                </div>
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

  if (announcements === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Announcements</h1>
        <p className="text-slate-500 font-medium">View announcements and updates from administration.</p>
      </div>

      {announcements.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">No announcements yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{a.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
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
  const { user } = useAuth();
  const messages = useQuery(api.messages.getMessages);
  const markMessageRead = useMutation(api.messages.markMessageRead);
  const sendMessage = useMutation(api.messages.sendMessage);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  if (messages === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  const incoming = messages.filter((m) => m.receiverId === user?._id).sort((a, b) => b._creationTime - a._creationTime);
  const sent = messages.filter((m) => m.senderId === user?._id).sort((a, b) => b._creationTime - a._creationTime);

  const handleSend = async () => {
    if (!replyTo || !content.trim()) return;
    try {
      await sendMessage({ receiverId: replyTo as Id<"users">, content });
      setContent("");
      setReplyTo(null);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Messages</h1>
        <p className="text-slate-500 font-medium">Communicate with teachers, parents and administration.</p>
      </div>

      {incoming.length === 0 && sent.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">No messages yet.</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Inbox</CardTitle>
        </CardHeader>
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
              {incoming.map((m) => (
                <tr key={m._id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${!m.read ? "bg-blue-50/30" : ""}`}>
                  <td className="p-4 pl-6 text-sm font-semibold text-slate-800">School Member</td>
                  <td className="p-4 text-sm text-slate-600 max-w-md truncate">{m.content}</td>
                  <td className="p-4 text-xs text-slate-400 font-medium">{new Date(m._creationTime).toLocaleString()}</td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex gap-2 justify-end">
                      {!m.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-slate-900 font-semibold"
                          onClick={() => markMessageRead({ id: m._id })}
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                        onClick={() => setReplyTo(replyTo === m._id ? null : m._id)}
                      >
                        {replyTo === m._id ? "Cancel" : "Reply"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {replyTo && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-6">
            <p className="text-sm font-bold text-slate-800 mb-3">Reply to sender</p>
            <div className="flex gap-3">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your reply..."
                className="border-slate-200 bg-slate-50/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />
              <Button
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
                onClick={handleSend}
                disabled={!content.trim()}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sent.length > 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Sent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sent.slice(0, 5).map((m) => (
              <div key={m._id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <p className="text-sm text-slate-700">{m.content}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(m._creationTime).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}