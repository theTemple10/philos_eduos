import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import AdminDashboard from "./dashboards/AdminDashboard";
import SchoolAdminDashboard from "./dashboards/SchoolAdminDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";
import StaffDashboard from "./dashboards/StaffDashboard";
import Onboarding from "./RoleSelection";

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth?returnTo=/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/80">
        <div className="animate-pulse text-slate-500 font-medium">Loading dashboard...</div>
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