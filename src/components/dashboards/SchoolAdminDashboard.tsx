import { useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Settings as SettingsIcon,
  Building2,
  BadgeCheck,
  Plus,
  Trash2,
  Loader2,
  School,
  UserPlus,
  Wallet,
  Megaphone,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router";

const SECTIONS = [
  { id: "overview", label: "School Overview", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "teachers", label: "Teachers", icon: BookOpen },
  { id: "classes", label: "Classes", icon: School },
  { id: "members", label: "Members & Roles", icon: Users },
  { id: "invites", label: "Invites", icon: UserPlus },
  { id: "fees", label: "Fees & Invoices", icon: Wallet },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "settings", label: "School Settings", icon: SettingsIcon },
] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTs(ts: number): string {
  if (!ts) return "--";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWhen(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatTs(ts);
}

function naira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

const CURRICULUM_LABELS: Record<string, string> = {
  waec_neco: "WAEC/NECO",
  cambridge: "Cambridge",
  ib: "IB",
  american: "American",
};

function curriculumLabel(curriculum?: string): string {
  return curriculum ? CURRICULUM_LABELS[curriculum] ?? curriculum : "—";
}

function roleBadgeClass(role?: string): string {
  switch (role) {
    case "admin":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "teacher":
      return "bg-green-50 text-green-700 border border-green-100";
    case "student":
      return "bg-yellow-50 text-yellow-700 border border-yellow-100";
    case "parent":
      return "bg-purple-50 text-purple-700 border border-purple-100";
    case "staff":
      return "bg-slate-50 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-50 text-slate-400 border border-slate-100";
  }
}

function studentStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-50 text-green-700 border border-green-100";
    case "inactive":
      return "bg-red-50 text-red-700 border border-red-100";
    case "graduated":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    default:
      return "bg-slate-50 text-slate-500 border border-slate-100";
  }
}

function invoiceStatusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700 border border-green-100";
    case "partial":
      return "bg-yellow-50 text-yellow-700 border border-yellow-100";
    case "pending":
      return "bg-orange-50 text-orange-700 border border-orange-100";
    case "cancelled":
      return "bg-slate-50 text-slate-500 border border-slate-100";
    default:
      return "bg-slate-50 text-slate-500 border border-slate-100";
  }
}

function inviteStatusBadgeClass(status: string): string {
  switch (status) {
    case "used":
      return "bg-green-50 text-green-700 border border-green-100";
    case "expired":
      return "bg-red-50 text-red-700 border border-red-100";
    default:
      return "bg-yellow-50 text-yellow-700 border border-yellow-100";
  }
}

function targetBadgeClass(target: string): string {
  switch (target) {
    case "all":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "teachers":
      return "bg-green-50 text-green-700 border border-green-100";
    case "students":
      return "bg-yellow-50 text-yellow-700 border border-yellow-100";
    case "parents":
      return "bg-purple-50 text-purple-700 border border-purple-100";
    case "staff":
      return "bg-slate-50 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-50 text-slate-500 border border-slate-100";
  }
}

function inviteStatus(invite: Doc<"invites">): "used" | "expired" | "pending" {
  if (invite.usedAt !== undefined) return "used";
  if (invite.expiresAt < Date.now()) return "expired";
  return "pending";
}

export default function SchoolAdminDashboard() {
  const { user, signOut } = useAuth();
  const tenant = useQuery(api.users.getMyTenant);
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">
                Philos <span className="text-yellow-500">EduOS</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest truncate max-w-[10rem]">
                {tenant?.name ?? "School Administration"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {SECTIONS.map((item) => (
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
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-blue-600" /> School Admin
              </p>
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

      <main className="ml-64">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100/50 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {tenant?.name ?? "Your school"}
            </p>
          </div>
        </header>

        <div className="p-8 max-w-[1400px]">
          {activeSection === "overview" && <OverviewSection tenant={tenant} />}
          {activeSection === "students" && <StudentsSection />}
          {activeSection === "teachers" && <TeachersSection />}
          {activeSection === "classes" && <ClassesSection />}
          {activeSection === "members" && <MembersSection />}
          {activeSection === "invites" && <InvitesSection />}
          {activeSection === "fees" && <FeesSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
          {activeSection === "settings" && <SettingsSection tenant={tenant} />}
        </div>
      </main>
    </div>
  );
}

function OverviewSection({
  tenant,
}: {
  tenant: Doc<"tenants"> | null | undefined;
}) {
  const students = useQuery(api.students.getStudents);
  const teachers = useQuery(api.teachers.getTeachers);
  const classes = useQuery(api.classes.getClasses);
  const invoices = useQuery(api.payments.getInvoices);

  const outstandingKobo = (invoices ?? []).reduce((acc, inv) => {
    if (inv.status === "pending" || inv.status === "partial") {
      return acc + Math.max(0, inv.amountKobo - inv.paidAmountKobo);
    }
    return acc;
  }, 0);

  const stats = [
    {
      label: "Students",
      value: String(students?.length ?? 0),
      change: "Enrolled",
      icon: GraduationCap,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Teachers",
      value: String(teachers?.length ?? 0),
      change: "Teaching staff",
      icon: BookOpen,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Classes",
      value: String(classes?.length ?? 0),
      change: "Active classes",
      icon: School,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Outstanding Fees",
      value: naira(outstandingKobo),
      change: "Pending + partial",
      icon: Wallet,
      color: "bg-slate-50 text-slate-600",
    },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          {tenant?.name ?? "Your school"}
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          {tenant
            ? `Curriculum: ${curriculumLabel(tenant.curriculum)}`
            : "Loading school details…"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all border-slate-100"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500">
                {stat.label}
              </CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800">
                {stat.value}
              </div>
              <p className="text-xs text-slate-500 font-bold mt-2 bg-slate-50 inline-flex px-2 py-1 rounded-full">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">
            School Record
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Name</span>
            <span className="font-bold text-slate-800">
              {tenant?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Curriculum</span>
            <span className="font-bold text-slate-800">
              {curriculumLabel(tenant?.curriculum)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Created</span>
            <span className="font-bold text-slate-800">
              {tenant ? formatTs(tenant.createdAt) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Domain</span>
            <span className="font-bold text-slate-800">
              {tenant?.domain ?? "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentsSection() {
  const students = useQuery(api.students.getStudents);
  const classes = useQuery(api.classes.getClasses);
  const addStudent = useMutation(api.students.addStudent);
  const deleteStudent = useMutation(api.students.deleteStudent);
  const convex = useConvex();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<Id<"classes"> | null>(null);
  const [studentId, setStudentId] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const className = (id: Id<"classes">) =>
    (classes ?? []).find((c) => c._id === id)?.name ?? "—";

  const handleAdd = async () => {
    if (!name.trim() || !classId || !studentId.trim()) {
      setError("Enter the student's name, class and student ID.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let parentId: Id<"users"> | undefined;
      if (parentEmail.trim()) {
        const parent = await convex.query(api.users.getUserByEmail, {
          email: parentEmail.trim(),
        });
        parentId = parent._id;
      }
      await addStudent({
        name: name.trim(),
        classId,
        studentId: studentId.trim(),
        parentId,
        enrollmentDate: todayIso(),
        status: "active",
      });
      setName("");
      setStudentId("");
      setParentEmail("");
      setClassId(null);
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't add that student.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Students
          </h1>
          <p className="text-slate-500 font-medium">
            Manage student records and enrollments.
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Add New Student
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ada Obi"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Class
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={classId ?? ""}
                  onChange={(e) => setClassId(e.target.value as Id<"classes">)}
                >
                  <option value="" disabled>
                    Select a class…
                  </option>
                  {(classes ?? []).map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} - {cls.gradeLevel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Student ID
                </label>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. STU-2026-001"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Parent Email (optional)
                </label>
                <Input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
            )}
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Student
            </Button>
          </CardContent>
        </Card>
      )}

      {!students && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading students…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Student
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  ID
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Class
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Enrolled
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Status
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(students ?? []).map((student) => (
                <tr
                  key={student._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium font-mono">
                    {student.studentId}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {className(student.classId)}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {formatDate(student.enrollmentDate)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${studentStatusBadgeClass(student.status)}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => deleteStudent({ id: student._id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(students ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No students yet. Add your first student to get started.
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

function TeachersSection() {
  const teachers = useQuery(api.teachers.getTeachers);
  const users = useQuery(api.users.getUsersInTenant);
  const classes = useQuery(api.classes.getClasses);
  const addTeacher = useMutation(api.teachers.addTeacher);
  const deleteTeacher = useMutation(api.teachers.deleteTeacher);

  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<Set<Id<"classes">>>(
    new Set(),
  );
  const [hireDate, setHireDate] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedUserIds = new Set((teachers ?? []).map((t) => t.userId));
  const candidates = (users ?? []).filter(
    (u) =>
      (u.role === "teacher" || !u.role) && !linkedUserIds.has(u._id),
  );

  const toggleClass = (id: Id<"classes">) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    if (!userId || !name.trim() || selectedClasses.size === 0) {
      setError("Pick a user, enter their name and assign at least one class.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addTeacher({
        userId,
        name: name.trim(),
        subject: subject.trim() || undefined,
        classes: [...selectedClasses],
        department: department.trim() || undefined,
        hireDate,
      });
      setUserId(null);
      setName("");
      setSubject("");
      setDepartment("");
      setSelectedClasses(new Set());
      setHireDate(todayIso());
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't add that teacher.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Teachers
          </h1>
          <p className="text-slate-500 font-medium">
            Manage teaching staff and their class assignments.
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Add New Teacher
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  User Account
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={userId ?? ""}
                  onChange={(e) => setUserId(e.target.value as Id<"users">)}
                >
                  <option value="" disabled>
                    Select a user…
                  </option>
                  {candidates.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name || u.email || u._id}
                    </option>
                  ))}
                </select>
                {candidates.length === 0 && (
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    No teacher-role users available. Invite staff or assign a
                    role to a member first.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Miller"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Subject (optional)
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Department (optional)
                </label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Sciences"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Hire Date
                </label>
                <Input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Classes
                </label>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 max-h-40 overflow-y-auto space-y-2">
                  {(classes ?? []).length === 0 && (
                    <p className="text-sm text-slate-500 font-medium">
                      No classes yet.
                    </p>
                  )}
                  {(classes ?? []).map((cls) => (
                    <label
                      key={cls._id}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.has(cls._id)}
                        onChange={() => toggleClass(cls._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {cls.name} - {cls.gradeLevel}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
            )}
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Teacher
            </Button>
          </CardContent>
        </Card>
      )}

      {!teachers && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading teachers…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Teacher
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Subject
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Department
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Classes
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Hired
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(teachers ?? []).map((teacher) => (
                <tr
                  key={teacher._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {teacher.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {teacher.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {teacher.subject || "—"}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {teacher.department || "—"}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {teacher.classes.length}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {formatDate(teacher.hireDate)}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => deleteTeacher({ id: teacher._id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(teachers ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No teachers yet. Add your first teacher to get started.
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

function ClassesSection() {
  const classes = useQuery(api.classes.getClasses);
  const students = useQuery(api.students.getStudents);
  const teachers = useQuery(api.teachers.getTeachers);
  const addClass = useMutation(api.classes.addClass);
  const deleteClass = useMutation(api.classes.deleteClass);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [room, setRoom] = useState("");
  const [capacity, setCapacity] = useState("");
  const [teacherId, setTeacherId] = useState<Id<"users"> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teacherName = (userId?: Id<"users">) =>
    (teachers ?? []).find((t) => t.userId === userId)?.name ?? "—";

  const handleAdd = async () => {
    const parsedCapacity = Number(capacity);
    if (
      !name.trim() ||
      !gradeLevel.trim() ||
      !capacity.trim() ||
      Number.isNaN(parsedCapacity)
    ) {
      setError("Enter a class name, grade level and capacity.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addClass({
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        teacherId: teacherId ?? undefined,
        room: room.trim() || undefined,
        capacity: parsedCapacity,
      });
      setName("");
      setGradeLevel("");
      setRoom("");
      setCapacity("");
      setTeacherId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that class.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Classes
          </h1>
          <p className="text-slate-500 font-medium">
            Manage class groups, teachers and capacity.
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" /> Add Class
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Add New Class
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Class Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SS1 Science"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Grade Level
                </label>
                <Input
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. Year 10 / SS1"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Class Teacher (optional)
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={teacherId ?? ""}
                  onChange={(e) => setTeacherId(e.target.value as Id<"users">)}
                >
                  <option value="">No class teacher</option>
                  {(teachers ?? []).map((t) => (
                    <option key={t._id} value={t.userId}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Room (optional)
                </label>
                <Input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 12"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Capacity
                </label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 40"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
            )}
            <Button
              onClick={handleAdd}
              disabled={submitting}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Class
            </Button>
          </CardContent>
        </Card>
      )}

      {!classes && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading classes…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Class
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Grade Level
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Teacher
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Room
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Students
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(classes ?? []).map((cls) => (
                <tr
                  key={cls._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <School className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {cls.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {cls.gradeLevel || "—"}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {teacherName(cls.teacherId)}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {cls.room || "—"}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">
                    {
                      (students ?? []).filter(
                        (s) => s.classId === cls._id,
                      ).length
                    }
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => deleteClass({ id: cls._id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(classes ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No classes yet. Add your first class to get started.
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

function MembersSection() {
  const { user } = useAuth();
  const members = useQuery(api.users.getUsersInTenant);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (
    userId: Id<"users">,
    role: "admin" | "teacher" | "student" | "parent" | "staff",
  ) => {
    setError(null);
    try {
      await updateUserRole({ userId, role });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't update that role.",
      );
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Members & Roles
        </h1>
        <p className="text-slate-500 font-medium">
          Manage who belongs to your school and what each member can do.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium mb-4">{error}</p>
      )}

      {!members && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading members…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Member
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Email
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Role
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody>
              {(members ?? [])
                .filter((m) => m.role !== "super_admin")
                .map((member) => (
                  <tr
                    key={member._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                          {(member.name || "?")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">
                          {member.name || "Unnamed user"}
                          {member._id === user?._id && (
                            <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-medium">
                      {member.email || "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${roleBadgeClass(member.role)}`}
                      >
                        {member.role ?? "unassigned"}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      {member._id === user?._id ? (
                        <span className="text-xs text-slate-400 font-medium">
                          Your own role can't be changed here.
                        </span>
                      ) : (
                        <select
                          className="p-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-slate-700"
                          value={member.role ?? ""}
                          onChange={(e) =>
                            handleRoleChange(
                              member._id,
                              e.target.value as
                                | "admin"
                                | "teacher"
                                | "student"
                                | "parent"
                                | "staff",
                            )
                          }
                        >
                          <option value="" disabled>
                            Unassigned
                          </option>
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                          <option value="staff">Staff</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              {(members ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No members yet. Invite people to your school to get
                    started.
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

function InvitesSection() {
  const invites = useQuery(api.users.getInvites);
  const classes = useQuery(api.classes.getClasses);
  const createInvite = useMutation(api.users.createInvite);
  const revokeInvite = useMutation(api.users.revokeInvite);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<
    "teacher" | "student" | "parent" | "staff"
  >("teacher");
  const [inviteName, setInviteName] = useState("");
  const [classId, setClassId] = useState<Id<"classes"> | null>(null);
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{
    code: string;
    email: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const handleCreate = async () => {
    if (!email.trim().includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    const profile: {
      name?: string;
      classId?: Id<"classes">;
      studentId?: string;
      subject?: string;
      department?: string;
    } = {};
    if (role === "student") {
      if (!inviteName.trim() || !classId || !studentId.trim()) {
        setError("Student invites need a name, class and student ID.");
        return;
      }
      profile.name = inviteName.trim();
      profile.classId = classId;
      profile.studentId = studentId.trim();
    } else if (role === "teacher") {
      if (!inviteName.trim()) {
        setError("Teacher invites need a name.");
        return;
      }
      profile.name = inviteName.trim();
      if (subject.trim()) profile.subject = subject.trim();
      if (department.trim()) profile.department = department.trim();
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createInvite({
        email: email.trim(),
        role,
        profile,
      });
      setLastInvite({ code: res.code, email: email.trim(), role });
      setEmail("");
      setInviteName("");
      setStudentId("");
      setSubject("");
      setDepartment("");
      setClassId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Invites
          </h1>
          <p className="text-slate-500 font-medium">
            Invite people to join your school. Codes expire after 7 days.
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" /> Create Invite
        </Button>
      </div>

      {lastInvite && (
        <div className="mb-6 p-4 rounded-xl bg-green-50/60 border border-green-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Invite created for {lastInvite.email} ({lastInvite.role})
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-bold text-slate-800 bg-white border border-green-200 rounded-lg px-3 py-1.5 font-mono">
              {lastInvite.code}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="border-green-200 text-green-700 hover:bg-green-50 font-semibold rounded-xl"
              onClick={() => handleCopy(lastInvite.code)}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Create New Invite
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@example.com"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Role
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value as
                        | "teacher"
                        | "student"
                        | "parent"
                        | "staff",
                    )
                  }
                >
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              {(role === "student" || role === "teacher") && (
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">
                    Name
                  </label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder={
                      role === "student"
                        ? "e.g. Ada Obi"
                        : "e.g. Dr. Sarah Miller"
                    }
                    className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                  />
                </div>
              )}
              {role === "student" && (
                <>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">
                      Class
                    </label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                      value={classId ?? ""}
                      onChange={(e) =>
                        setClassId(e.target.value as Id<"classes">)
                      }
                    >
                      <option value="" disabled>
                        Select a class…
                      </option>
                      {(classes ?? []).map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} - {cls.gradeLevel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">
                      Student ID
                    </label>
                    <Input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. STU-2026-002"
                      className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                    />
                  </div>
                </>
              )}
              {role === "teacher" && (
                <>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">
                      Subject (optional)
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">
                      Department (optional)
                    </label>
                    <Input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Sciences"
                      className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
            )}
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Create Invite
            </Button>
          </CardContent>
        </Card>
      )}

      {!invites && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading invites…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Email
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Role
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Code
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Status
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Expires
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(invites ?? []).map((invite) => {
                const status = inviteStatus(invite);
                return (
                  <tr
                    key={invite._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 pl-6 text-sm font-semibold text-slate-800">
                      {invite.email}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${roleBadgeClass(invite.role)}`}
                      >
                        {invite.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-medium font-mono">
                      {invite.code}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${inviteStatusBadgeClass(status)}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-medium">
                      {formatTs(invite.expiresAt)}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {status !== "used" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => revokeInvite({ inviteId: invite._id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(invites ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No invites yet. Create one to bring someone into your
                    school.
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

function FeesSection() {
  const feeSchedules = useQuery(api.payments.getFeeSchedules);
  const invoices = useQuery(api.payments.getInvoices);
  const students = useQuery(api.students.getStudents);
  const classes = useQuery(api.classes.getClasses);
  const createFeeSchedule = useMutation(api.payments.createFeeSchedule);
  const updateFeeSchedule = useMutation(api.payments.updateFeeSchedule);
  const deleteFeeSchedule = useMutation(api.payments.deleteFeeSchedule);
  const generateInvoicesForClass = useMutation(
    api.payments.generateInvoicesForClass,
  );

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amountNaira, setAmountNaira] = useState("");
  const [term, setTerm] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [classId, setClassId] = useState<Id<"classes"> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genClass, setGenClass] = useState<Record<string, string>>({});
  const [genResult, setGenResult] = useState<{
    scheduleId: string;
    created: number;
  } | null>(null);

  const studentName = (id: Id<"students">) =>
    (students ?? []).find((s) => s._id === id)?.name ?? "Unknown student";

  const handleCreate = async () => {
    const parsed = parseFloat(amountNaira);
    if (!title.trim() || !term.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setError("Enter a title, term and a positive amount.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createFeeSchedule({
        title: title.trim(),
        amountKobo: Math.round(parsed * 100),
        term: term.trim(),
        dueDate,
        classId: classId ?? undefined,
      });
      setTitle("");
      setAmountNaira("");
      setTerm("");
      setDueDate(todayIso());
      setClassId(null);
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create fee schedule.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (schedule: Doc<"feeSchedules">) => {
    try {
      await updateFeeSchedule({
        id: schedule._id,
        active: !schedule.active,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't update that fee schedule.",
      );
    }
  };

  const handleGenerate = async (schedule: Doc<"feeSchedules">) => {
    const chosen = genClass[schedule._id];
    try {
      const res = await generateInvoicesForClass({
        feeScheduleId: schedule._id,
        classId: chosen ? (chosen as Id<"classes">) : undefined,
      });
      setGenResult({ scheduleId: schedule._id, created: res.created });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't generate invoices.",
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Fees & Invoices
          </h1>
          <p className="text-slate-500 font-medium">
            Create fee schedules, bill classes and track payments.
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" /> Create Fee Schedule
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium mb-4">{error}</p>
      )}

      {showForm && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Create Fee Schedule
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Term 1 Tuition"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Amount (₦)
                </label>
                <Input
                  type="number"
                  value={amountNaira}
                  onChange={(e) => setAmountNaira(e.target.value)}
                  placeholder="e.g. 150000"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Term
                </label>
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. Term 1"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Class (optional — all classes if empty)
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={classId ?? ""}
                  onChange={(e) => setClassId(e.target.value as Id<"classes">)}
                >
                  <option value="">All classes</option>
                  {(classes ?? []).map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} - {cls.gradeLevel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Fee Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {!feeSchedules && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading fee schedules…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">
            Fee Schedules
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Fee
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Amount
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Term
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Due
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Class
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Active
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">
                  Generate Invoices
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(feeSchedules ?? []).map((schedule) => (
                <tr
                  key={schedule._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 pl-6 text-sm font-semibold text-slate-800">
                    {schedule.title}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">
                    {naira(schedule.amountKobo)}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {schedule.term}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {formatDate(schedule.dueDate)}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {schedule.classId
                      ? (classes ?? []).find(
                          (c) => c._id === schedule.classId,
                        )?.name ?? "—"
                      : "All classes"}
                  </td>
                  <td className="p-4">
                    <Switch
                      checked={schedule.active}
                      onCheckedChange={() => handleToggleActive(schedule)}
                    />
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center gap-2">
                      <select
                        className="p-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-slate-700"
                        value={genClass[schedule._id] ?? ""}
                        onChange={(e) =>
                          setGenClass((prev) => ({
                            ...prev,
                            [schedule._id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">All students</option>
                        {(classes ?? []).map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-semibold rounded-xl"
                        onClick={() => handleGenerate(schedule)}
                      >
                        Generate
                      </Button>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() =>
                        deleteFeeSchedule({ id: schedule._id })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(feeSchedules ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No fee schedules yet. Create one to start billing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {genResult && (
          <p className="p-4 pt-0 text-sm text-green-700 font-medium">
            Generated {genResult.created} invoice
            {genResult.created === 1 ? "" : "s"} for "
            {
              (feeSchedules ?? []).find(
                (s) => s._id === genResult.scheduleId,
              )?.title
            }
            ".
          </p>
        )}
      </Card>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">
            Invoices
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Student
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Fee
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Amount
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Paid
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Status
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((invoice) => (
                <tr
                  key={invoice._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 pl-6 text-sm font-semibold text-slate-800">
                    {studentName(invoice.studentId)}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {invoice.title}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">
                    {naira(invoice.amountKobo)}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {naira(invoice.paidAmountKobo)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${invoiceStatusBadgeClass(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-sm text-slate-500 font-medium">
                    {formatDate(invoice.dueDate)}
                  </td>
                </tr>
              ))}
              {(invoices ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No invoices yet. Generate them from a fee schedule above.
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

function AnnouncementsSection() {
  const announcements = useQuery(api.announcements.getAnnouncements);
  const addAnnouncement = useMutation(api.announcements.addAnnouncement);
  const deleteAnnouncement = useMutation(api.announcements.deleteAnnouncement);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<
    "all" | "teachers" | "students" | "parents" | "staff"
  >("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Announcements need a title and some content.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        target,
      });
      setTitle("");
      setContent("");
      setTarget("all");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create announcement.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Announcements
          </h1>
          <p className="text-slate-500 font-medium">
            Share updates with the whole school or specific groups.
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" /> Create Announcement
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              New Announcement
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-term break notice"
                  className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">
                  Audience
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-blue-500 focus:border-blue-500"
                  value={target}
                  onChange={(e) =>
                    setTarget(
                      e.target.value as
                        | "all"
                        | "teachers"
                        | "students"
                        | "parents"
                        | "staff",
                    )
                  }
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
              <label className="text-sm font-bold text-slate-700 block mb-2">
                Content
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the announcement…"
                rows={4}
                className="border-slate-200/60 bg-slate-50/50 focus-visible:ring-blue-500"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
            )}
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold rounded-xl shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Megaphone className="w-4 h-4" />
              )}
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      )}

      {!announcements && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading announcements…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <CardContent className="p-6 space-y-4">
          {(announcements ?? []).length === 0 && (
            <p className="text-sm text-slate-500 font-medium">
              No announcements yet.
            </p>
          )}
          {(announcements ?? []).map((announcement) => (
            <div
              key={announcement._id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
            >
              <div className="flex items-center justify-between mb-2 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800">
                    {announcement.title}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${targetBadgeClass(announcement.target)}`}
                  >
                    {announcement.target}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {formatWhen(announcement.createdAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    onClick={() =>
                      deleteAnnouncement({ id: announcement._id })
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {announcement.content}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection({
  tenant,
}: {
  tenant: Doc<"tenants"> | null | undefined;
}) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          School Settings
        </h1>
        <p className="text-slate-500 font-medium">
          View your school's configuration.
        </p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">
            School Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Name</span>
            <span className="font-bold text-slate-800">
              {tenant?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Curriculum</span>
            <span className="font-bold text-slate-800">
              {curriculumLabel(tenant?.curriculum)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Domain</span>
            <span className="font-bold text-slate-800">
              {tenant?.domain ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Created</span>
            <span className="font-bold text-slate-800">
              {tenant ? formatTs(tenant.createdAt) : "—"}
            </span>
          </div>
          <p className="pt-3 text-sm text-slate-500 font-medium leading-relaxed">
            Editable school configuration (logo, domain, term dates) arrives
            with the settings milestone. Your school record above is live from
            Convex.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}