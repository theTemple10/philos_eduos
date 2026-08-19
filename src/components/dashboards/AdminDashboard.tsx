import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  Bell,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";

const NAV_ITEMS = [
  { id: "overview", label: "System Overview", icon: LayoutDashboard },
  { id: "tenants", label: "Tenant Management", icon: Building2 },
  { id: "users", label: "User Administration", icon: Users },
  { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
  { id: "settings", label: "System Configuration", icon: SettingsIcon },
] as const;

function formatTs(ts: number): string {
  if (!ts) return "--";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    case "super_admin":
      return "bg-red-50 text-red-700 border border-red-100";
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
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                System Administration
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
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
                : "AU"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                System Administrator
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

      <div className="pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100/50 px-8 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight capitalize">
              {activeSection.replace("_", " ")}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search system..."
                className="pl-9 w-64 bg-slate-50/80 border-slate-200/50 focus-visible:ring-blue-500 h-10 text-sm rounded-full"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full relative"
            >
              <Bell className="w-5 h-5" />
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
  const tenants = useQuery(api.users.getTenants);
  const users = useQuery(api.users.getAllUsers);

  const stats = [
    {
      label: "Total Tenants",
      value: String(tenants?.length ?? 0),
      change: "Schools on the platform",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Users",
      value: String(users?.length ?? 0),
      change: "Across all tenants",
      icon: Users,
      color: "bg-green-50 text-green-600",
    },
  ];

  const withTenant = (users ?? []).filter((u) => u.tenantId).length;
  const superAdmins = (users ?? []).filter(
    (u) => u.role === "super_admin",
  ).length;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          System Overview
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          Live platform counts from Convex.
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
            Platform Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Tenants</span>
            <span className="font-bold text-slate-800">
              {tenants?.length ?? "…"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Users</span>
            <span className="font-bold text-slate-800">
              {users?.length ?? "…"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">
              Users in a tenant
            </span>
            <span className="font-bold text-slate-800">{withTenant}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Super admins</span>
            <span className="font-bold text-slate-800">{superAdmins}</span>
          </div>
          <p className="pt-3 text-sm text-slate-500 font-medium leading-relaxed">
            Charts for tenant activity and platform health arrive with the
            analytics milestone; these are the raw numbers behind them.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TenantsSection() {
  const tenants = useQuery(api.users.getTenants);
  const users = useQuery(api.users.getAllUsers);

  const userCount = (tenantId: Id<"tenants">) =>
    (users ?? []).filter((u) => u.tenantId === tenantId).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Tenant Management
        </h1>
        <p className="text-slate-500 font-medium">
          Manage schools and institutions on the platform.
        </p>
      </div>

      {!tenants && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading tenants…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  Tenant
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Curriculum
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Created
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">
                  Users
                </th>
              </tr>
            </thead>
            <tbody>
              {(tenants ?? []).map((tenant) => (
                <tr
                  key={tenant._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {tenant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {tenant.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      {curriculumLabel(tenant.curriculum)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {formatTs(tenant.createdAt)}
                  </td>
                  <td className="p-4 pr-6 text-right text-sm font-bold text-slate-700">
                    {userCount(tenant._id)}
                  </td>
                </tr>
              ))}
              {(tenants ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No tenants on the platform yet.
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

function UsersSection() {
  const users = useQuery(api.users.getAllUsers);
  const tenants = useQuery(api.users.getTenants);
  const grantSuperAdmin = useMutation(api.users.grantSuperAdmin);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tenantName = (tenantId?: Id<"tenants">) =>
    (tenants ?? []).find((t) => t._id === tenantId)?.name ?? "—";

  const handleGrant = async (userId: Id<"users">) => {
    setGrantingId(userId);
    setError(null);
    try {
      await grantSuperAdmin({ userId });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't grant super admin.",
      );
    } finally {
      setGrantingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          User Administration
        </h1>
        <p className="text-slate-500 font-medium">
          Manage users across all tenants and roles.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium mb-4">{error}</p>
      )}

      {!users && (
        <div className="animate-pulse text-slate-500 font-medium">
          Loading users…
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pl-6">
                  User
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Email
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Role
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4">
                  Tenant
                </th>
                <th className="text-[11px] font-bold text-slate-500 uppercase tracking-wider p-4 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold border border-slate-200">
                        {(user.name || "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {user.name || "Unnamed user"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-medium">
                    {user.email || "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${roleBadgeClass(user.role)}`}
                    >
                      {user.role ?? "unassigned"}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {tenantName(user.tenantId)}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {user.role !== "super_admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={grantingId === user._id}
                        onClick={() => handleGrant(user._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                      >
                        {grantingId === user._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        Grant Super Admin
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {(users ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-sm text-slate-500 font-medium"
                  >
                    No users on the platform yet.
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

function AnalyticsSection() {
  const tenants = useQuery(api.users.getTenants);
  const users = useQuery(api.users.getAllUsers);

  const superAdmins = (users ?? []).filter(
    (u) => u.role === "super_admin",
  ).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Analytics & Reports
        </h1>
        <p className="text-slate-500 font-medium">
          View system-wide analytics and generate reports.
        </p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">
            Analytics milestone pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Detailed analytics require the analytics milestone; here are the
            raw counts:
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Tenants</span>
              <span className="font-bold text-slate-800">
                {tenants?.length ?? "…"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Users</span>
              <span className="font-bold text-slate-800">
                {users?.length ?? "…"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Super admins</span>
              <span className="font-bold text-slate-800">{superAdmins}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          System Configuration
        </h1>
        <p className="text-slate-500 font-medium">
          Configure platform settings and preferences.
        </p>
      </div>

      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-slate-100 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">
            Platform Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Platform-wide configuration (branding, support contacts, feature
            toggles) requires the settings milestone. There are no
            configuration endpoints in the backend yet, so no settings can be
            saved honestly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}