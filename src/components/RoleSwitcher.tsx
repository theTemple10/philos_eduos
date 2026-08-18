import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BookOpen, GraduationCap, Users, Wrench, ArrowLeftRight, Loader2 } from "lucide-react";

const ROLE_OPTIONS = [
  { id: "admin", label: "Admin", icon: ShieldCheck, color: "text-red-600" },
  { id: "teacher", label: "Teacher", icon: BookOpen, color: "text-blue-600" },
  { id: "student", label: "Student", icon: GraduationCap, color: "text-green-600" },
  { id: "parent", label: "Parent", icon: Users, color: "text-yellow-600" },
  { id: "staff", label: "Staff", icon: Wrench, color: "text-slate-600" },
] as const;

interface RoleSwitcherProps {
  currentRole: string;
}

export default function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const { user } = useAuth();
  const updateUserRole = useMutation(api.users.updateUserRole);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSwitchRole = async (newRole: string) => {
    if (!user?._id || newRole === currentRole) return;
    setIsSwitching(true);
    try {
      await updateUserRole({
        userId: user._id,
        role: newRole as "admin" | "teacher" | "student" | "parent" | "staff",
      });
      // Reload to pick up the new role
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch role:", err);
      setIsSwitching(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl font-medium"
        onClick={() => setIsOpen(true)}
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
        Switch Role
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-4 mb-2">
        Switch to
      </p>
      {ROLE_OPTIONS.filter((r) => r.id !== currentRole).map((role) => (
        <button
          key={role.id}
          onClick={() => handleSwitchRole(role.id)}
          disabled={isSwitching}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all disabled:opacity-50"
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <role.icon className={`w-4 h-4 ${role.color}`} />
          )}
          {role.label}
        </button>
      ))}
      <button
        onClick={() => setIsOpen(false)}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
      >
        Cancel
      </button>
    </div>
  );
}
