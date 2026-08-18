import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import AdminDashboard from "./dashboards/AdminDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";
import StaffDashboard from "./dashboards/StaffDashboard";

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

  // Route to appropriate dashboard based on role
  switch (role) {
    case "super_admin":
    case "admin":
      return <AdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    case "parent":
      return <ParentDashboard />;
    case "staff":
      return <StaffDashboard />;
    default:
      // Default to student dashboard for new users or those without a role
      return <StudentDashboard />;
  }
}