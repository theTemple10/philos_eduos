import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import AdminDashboard from "./dashboards/AdminDashboard";
import SchoolAdminDashboard from "./dashboards/SchoolAdminDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";
import StaffDashboard from "./dashboards/StaffDashboard";
import Onboarding from "./RoleSelection";

export default function DashboardRouter() {
  const { user, isLoading, isAuthenticated, error, refetch, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only send people to sign in when there is no session at all. If the
    // session is valid but the profile failed to load, /auth would bounce
    // straight back here, so we show an error instead (see below).
    if (!isLoading && !isAuthenticated) {
      router.push("/auth?returnTo=/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/80">
        <div className="animate-pulse text-slate-500 font-medium">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/80 px-4">
        <div role="alert" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">We couldn&apos;t load your account</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => refetch()}>Try again</Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                router.push("/auth");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role as string;

  // No role (or not part of a school yet): onboarding.
  if (!role) {
    return <Onboarding />;
  }

  switch (role) {
    case "super_admin":
      return <AdminDashboard />;
    case "admin":
      return <SchoolAdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    case "parent":
      return <ParentDashboard />;
    case "staff":
      return <StaffDashboard />;
    default:
      return <Onboarding />;
  }
}
