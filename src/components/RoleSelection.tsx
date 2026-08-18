import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BookOpen, GraduationCap, Users, Wrench, Loader2, ArrowRight } from "lucide-react";

const ROLES = [
  {
    id: "admin" as const,
    label: "System Administrator",
    description: "Full platform oversight, tenant management, and system configuration",
    icon: ShieldCheck,
    color: "bg-red-50 text-red-600 border-red-100",
    hoverColor: "hover:border-red-300 hover:bg-red-50/50",
  },
  {
    id: "teacher" as const,
    label: "Teacher",
    description: "Manage classes, mark attendance, enter grades, and share study materials",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    hoverColor: "hover:border-blue-300 hover:bg-blue-50/50",
  },
  {
    id: "student" as const,
    label: "Student",
    description: "View grades, attendance, study materials, and class schedule",
    icon: GraduationCap,
    color: "bg-green-50 text-green-600 border-green-100",
    hoverColor: "hover:border-green-300 hover:bg-green-50/50",
  },
  {
    id: "parent" as const,
    label: "Parent / Guardian",
    description: "Track children's performance, attendance, and transportation status",
    icon: Users,
    color: "bg-yellow-50 text-yellow-600 border-yellow-100",
    hoverColor: "hover:border-yellow-300 hover:bg-yellow-50/50",
  },
  {
    id: "staff" as const,
    label: "Non-Teaching Staff",
    description: "Manage tasks, inventory, and maintenance requests",
    icon: Wrench,
    color: "bg-slate-100 text-slate-600 border-slate-200",
    hoverColor: "hover:border-slate-400 hover:bg-slate-50",
  },
] as const;

export default function RoleSelection() {
  const { user } = useAuth();
  const updateUserRole = useMutation(api.users.updateUserRole);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = async (roleId: string) => {
    if (!user?._id) return;
    setSelectedRole(roleId);
    setIsSaving(true);
    setError(null);

    try {
      await updateUserRole({
        userId: user._id,
        role: roleId as "admin" | "teacher" | "student" | "parent" | "staff",
      });
      // Force a page reload to pick up the new role
      window.location.reload();
    } catch (err) {
      console.error("Failed to set role:", err);
      setError("Failed to save your role. Please try again.");
      setIsSaving(false);
      setSelectedRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">
              Philos <span className="text-yellow-500">EduOS</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Welcome to Philos EduOS
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
            Select your role to access the appropriate dashboard and features.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Role cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            const isDisabled = isSaving && !isSelected;

            return (
              <Card
                key={role.id}
                className={`border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/30 shadow-lg shadow-blue-500/10"
                    : isDisabled
                    ? "border-slate-100 opacity-50 cursor-not-allowed"
                    : `border-slate-200 hover:shadow-md ${role.hoverColor}`
                }`}
                onClick={() => !isSaving && handleSelectRole(role.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${role.color}`}
                    >
                      {isSaving && isSelected ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <role.icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        {role.label}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-blue-600"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                      disabled={isSaving}
                    >
                      {isSelected ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          Select <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-400 font-medium mt-8">
          You can change your role later from the dashboard settings.
        </p>
      </div>
    </div>
  );
}
