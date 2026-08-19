import { useAuth } from "@/hooks/use-auth";
import { useAction, useMutation, useQueries, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  LayoutDashboard,
  Users,
  GraduationCap,
  Bell,
  Search,
  MessageSquare,
  FileText,
  Bus,
  Clock,
  CheckCircle2,
  XCircle,
  BookMarked,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

export default function ParentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

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
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
              {user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "PA"}
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
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection onSelectChild={setSelectedChildId} />}
          {activeSection === "children" && <ChildrenSection onSelectChild={setSelectedChildId} />}
          {activeSection === "performance" && (
            <PerformanceSection selectedChildId={selectedChildId} onSelectChild={setSelectedChildId} />
          )}
          {activeSection === "attendance" && (
            <AttendanceSection selectedChildId={selectedChildId} onSelectChild={setSelectedChildId} />
          )}
          {activeSection === "transportation" && <TransportationSection />}
          {activeSection === "materials" && <MaterialsSection selectedChildId={selectedChildId} onSelectChild={setSelectedChildId} />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "messages" && <MessagesSection />}
          {activeSection === "payments" && <PaymentsSection />}
        </div>
      </div>
    </div>
  );
}

function useMyChildren() {
  const { user } = useAuth();
  const students = useQuery(api.students.getStudents);
  const classes = useQuery(api.classes.getClasses);
  if (students === undefined || classes === undefined) return undefined;
  const mine = students.filter((s) => s.parentId === user?._id);
  return mine.map((s) => ({
    ...s,
    className: classes.find((c) => c._id === s.classId)?.name ?? "Class",
  }));
}

function ChildSelector({
  children,
  selected,
  onSelect,
}: {
  children: { _id: string; name: string; className: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {children.map((child) => (
        <button
          key={child._id}
          onClick={() => onSelect(child._id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            selected === child._id
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  );
}

function OverviewSection({ onSelectChild }: { onSelectChild: (id: string) => void }) {
  const myChildren = useMyChildren();
  const messages = useQuery(api.messages.getMessages);
  const invoices = useQuery(api.payments.getInvoices);
  const attendanceQueries = useQueries(
    Object.fromEntries(
      (myChildren ?? []).map((child, i) => [
        `child${i}`,
        { query: api.attendance.getAttendanceForStudent, args: { studentId: child._id as Id<"students"> } },
      ]),
    ),
  );

  const attendanceRate = (() => {
    const all = Object.values(attendanceQueries)
      .map((q) => (q as { _id: Id<"attendance">; status: string; date: string }[] | undefined) ?? [])
      .flat();
    if (all.length === 0) return null;
    const present = all.filter((r) => r.status !== "absent").length;
    return Math.round((present / all.length) * 100);
  })();

  if (myChildren === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  const outstandingKobo = (invoices ?? [])
    .filter((i) => i.status === "pending" || i.status === "partial")
    .reduce((sum, i) => sum + (i.amountKobo - i.paidAmountKobo), 0);

  const stats = [
    { label: "Children Enrolled", value: String(myChildren.length), change: "Active students", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Attendance Rate", value: attendanceRate === null ? "--" : `${attendanceRate}%`, change: "Across all children", icon: CheckCircle2, color: "bg-slate-50 text-slate-600" },
    { label: "Unread Messages", value: String((messages ?? []).filter((m) => m.receiverId === undefined || !m.read).length), change: "Inbox", icon: MessageSquare, color: "bg-green-50 text-green-600" },
    { label: "Outstanding Fees", value: `₦${(outstandingKobo / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "Due soon", icon: FileText, color: "bg-yellow-50 text-yellow-600" },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back, Parent</h1>
        <p className="text-slate-500 font-medium text-lg">Monitor your children&apos;s academic progress and school activities.</p>
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
            {myChildren.length === 0 && (
              <p className="text-sm text-slate-500 font-medium">
                No children are linked to your account yet. Ask your school admin to link you as a parent.
              </p>
            )}
            {myChildren.map((child) => (
              <div key={child._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-200">
                    {child.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{child.name}</span>
                    <p className="text-xs text-slate-500">{child.className} • ID: {child.studentId}</p>
                  </div>
                </div>
                <button
                  onClick={() => onSelectChild(child._id)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  View
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(messages ?? []).length === 0 && (
              <p className="text-sm text-slate-500 font-medium">No recent activity yet.</p>
            )}
            {(messages ?? []).slice(0, 5).map((m) => (
              <div key={m._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-1.5 rounded-full">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 truncate">{m.content}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{new Date(m._creationTime).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChildrenSection({ onSelectChild }: { onSelectChild: (id: string) => void }) {
  const myChildren = useMyChildren();

  if (myChildren === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">My Children</h1>
        <p className="text-slate-500 font-medium">View information about your children and their enrolment.</p>
      </div>

      {myChildren.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">
              No children are linked to your account yet. Ask your school admin to link you as a parent.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {myChildren.map((child) => (
          <Card key={child._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold border border-slate-200">
                    {child.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{child.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{child.studentId}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                  {child.status}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Class</span>
                  <span className="font-bold text-slate-800">{child.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Enrolled</span>
                  <span className="font-bold text-slate-800">{child.enrollmentDate}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all"
                  onClick={() => onSelectChild(child._id)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PerformanceSection({
  selectedChildId,
  onSelectChild,
}: {
  selectedChildId: string | null;
  onSelectChild: (id: string) => void;
}) {
  const myChildren = useMyChildren();
  const selectedChild = myChildren?.find((c) => c._id === selectedChildId) ?? myChildren?.[0];
  const grades = useQuery(
    api.grades.getGradesByStudent,
    selectedChild ? { studentId: selectedChild._id } : "skip",
  );

  if (myChildren === undefined || grades === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  const average = (() => {
    const scores = (grades ?? []).map((g) => (g.score / g.maxScore) * 100);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  })();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Academic Performance</h1>
        <p className="text-slate-500 font-medium">View your children&apos;s academic performance and progress reports.</p>
      </div>

      <ChildSelector children={myChildren} selected={selectedChild?._id ?? null} onSelect={onSelectChild} />

      {grades.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">No grades have been published yet.</p>
          </CardContent>
        </Card>
      )}

      {grades.length > 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">
              {selectedChild?.name} {average !== null && <span className="text-sm text-slate-500 font-semibold">• Average {average}%</span>}
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Subject</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Score</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">Out of</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 text-center">%</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => {
                  const pct = Math.round((g.score / g.maxScore) * 100);
                  return (
                    <tr key={g._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 text-sm font-semibold text-slate-800">{g.subject}</td>
                      <td className="p-4 text-center text-sm font-bold text-slate-700">{g.score}</td>
                      <td className="p-4 text-center text-sm text-slate-500">{g.maxScore}</td>
                      <td className="p-4 text-center">
                        <span className={`text-sm font-extrabold px-3 py-1.5 rounded-full ${
                          pct >= 70 ? "bg-green-50 text-green-700 border border-green-100" : pct >= 50 ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "bg-red-50 text-red-700 border border-red-100"
                        }`}>{pct}%</span>
                      </td>
                      <td className="p-4 pr-6 text-sm text-slate-500">{g.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function AttendanceSection({
  selectedChildId,
  onSelectChild,
}: {
  selectedChildId: string | null;
  onSelectChild: (id: string) => void;
}) {
  const myChildren = useMyChildren();
  const selectedChild = myChildren?.find((c) => c._id === selectedChildId) ?? myChildren?.[0];
  const records = useQuery(
    api.attendance.getAttendanceForStudent,
    selectedChild ? { studentId: selectedChild._id } : "skip",
  );

  if (myChildren === undefined || records === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Attendance Records</h1>
        <p className="text-slate-500 font-medium">Track your children&apos;s attendance and participation.</p>
      </div>

      <ChildSelector children={myChildren} selected={selectedChild?._id ?? null} onSelect={onSelectChild} />

      {records.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">No attendance records yet.</p>
          </CardContent>
        </Card>
      )}

      {records.length > 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Date</th>
                  <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 text-sm font-medium text-slate-700">{r.date}</td>
                    <td className="p-4 pr-6">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        r.status === "present" ? "bg-green-50 text-green-700 border border-green-100" : r.status === "late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "bg-red-50 text-red-700 border border-red-100"
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
      )}
    </div>
  );
}

function TransportationSection() {
  const records = useQuery(api.transportation.getMyTransportation);

  if (records === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Transportation Tracking</h1>
        <p className="text-slate-500 font-medium">Track your children&apos;s bus transportation.</p>
      </div>

      {records.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">No transport records yet. Ask your school admin to add your child&apos;s transport details.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {records.map((r) => (
          <Card key={r._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Bus className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{r.busNumber} · {r.route}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">Driver: {r.driverName} · {r.driverPhone}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(r.status)}`}>
                  {getStatusText(r.status)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Last updated</p>
                <p className="text-sm font-bold text-slate-800">{new Date(r.lastUpdated).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MaterialsSection({
  selectedChildId,
  onSelectChild,
}: {
  selectedChildId: string | null;
  onSelectChild: (id: string) => void;
}) {
  const myChildren = useMyChildren();
  const selectedChild = myChildren?.find((c) => c._id === selectedChildId) ?? myChildren?.[0];
  const materials = useQuery(
    api.materials.getStudyMaterialsForStudent,
    selectedChild ? { studentId: selectedChild._id } : "skip",
  );

  if (myChildren === undefined || materials === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Study Materials</h1>
        <p className="text-slate-500 font-medium">Access study materials and resources for your children.</p>
      </div>

      <ChildSelector children={myChildren} selected={selectedChild?._id ?? null} onSelect={onSelectChild} />

      {materials.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 font-medium">No study materials published yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => (
          <Card key={m._id} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{m.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">{m.subject} • {m.fileType}</p>
                  </div>
                </div>
              </div>
              {m.description && <p className="text-sm text-slate-500 mb-4">{m.description}</p>}
              <a href={m.fileUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full mt-2 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl transition-all">
                  Download
                </Button>
              </a>
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
        <p className="text-slate-500 font-medium">Stay updated with important announcements from the school.</p>
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
        <p className="text-slate-500 font-medium">Communicate with teachers and school administration.</p>
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

function PaymentsSection() {
  const invoices = useQuery(api.payments.getInvoices);
  const payments = useQuery(api.payments.getMyPayments);
  const initializePayment = useAction(api.payments.initializePayment);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (invoices === undefined || payments === undefined) {
    return <div className="animate-pulse text-slate-500 font-medium">Loading…</div>;
  }

  const handlePay = async (invoiceId: Id<"invoices">) => {
    setPayingInvoice(invoiceId);
    setStatusMessage(null);
    try {
      const result = await initializePayment({ invoiceId });
      window.open(result.authorizationUrl, "_blank");
      setStatusMessage("Payment page opened in a new tab. After you complete payment, refresh this page to confirm.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Couldn't start payment.");
    } finally {
      setPayingInvoice(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Payments</h1>
        <p className="text-slate-500 font-medium">Manage payments and view transaction history.</p>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">{statusMessage}</div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Invoices</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">Description</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Amount</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Due</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const outstanding = (inv.amountKobo - inv.paidAmountKobo) / 100;
                return (
                  <tr key={inv._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 text-sm font-medium text-slate-800">{inv.title}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">₦{outstanding.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{inv.dueDate}</td>
                    <td className="p-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        inv.status === "paid" ? "bg-green-50 text-green-700 border border-green-100" : inv.status === "partial" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-900 hover:text-white hover:bg-slate-900 font-semibold bg-slate-100"
                          onClick={() => handlePay(inv._id)}
                          disabled={payingInvoice === inv._id}
                        >
                          {payingInvoice === inv._id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay Now"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {payments.length > 0 && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.description}</p>
                  <p className="text-xs text-slate-400 font-medium font-mono">{p.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">₦{(p.amountKobo / 100).toLocaleString()}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    p.status === "completed" ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}