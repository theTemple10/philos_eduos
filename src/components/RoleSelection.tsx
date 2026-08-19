import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Ticket,
  Loader2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const CURRICULUM_OPTIONS = [
  { id: "waec_neco", label: "WAEC / NECO (Nigeria)" },
  { id: "cambridge", label: "Cambridge" },
  { id: "ib", label: "International Baccalaureate (IB)" },
  { id: "american", label: "American" },
] as const;

export default function Onboarding() {
  const user = useQuery(api.users.currentUser);
  const createTenant = useMutation(api.users.createTenant);
  const redeemInvite = useMutation(api.users.redeemInvite);

  const [mode, setMode] = useState<"create" | "join">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateSchool = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await createTenant({
        name: String(formData.get("name") ?? ""),
        curriculum: String(
          formData.get("curriculum") ?? "waec_neco",
        ) as "waec_neco" | "cambridge" | "ib" | "american",
      });
      setSuccess("Your school was created. Setting up your dashboard…");
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create your school. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const handleRedeemInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await redeemInvite({ code: String(formData.get("code") ?? "") });
      setSuccess("Invite accepted. Setting up your dashboard…");
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't redeem that invite. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/80">
        <div className="animate-pulse text-slate-500 font-medium">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
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
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
            You&apos;re signed in but not part of a school yet. Create your
            school, or join one with an invite code from the school admin.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setError(null);
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              mode === "create"
                ? "border-blue-500 bg-blue-50/40 shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <Building2
              className={`w-5 h-5 mb-2 ${
                mode === "create" ? "text-blue-600" : "text-slate-400"
              }`}
            />
            <p className="text-sm font-bold text-slate-800">Create my school</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Founder of a new school. You&apos;ll be its administrator.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("join");
              setError(null);
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              mode === "join"
                ? "border-blue-500 bg-blue-50/40 shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <Ticket
              className={`w-5 h-5 mb-2 ${
                mode === "join" ? "text-blue-600" : "text-slate-400"
              }`}
            />
            <p className="text-sm font-bold text-slate-800">Join a school</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Teacher, student, parent or staff with an invite code.
            </p>
          </button>
        </div>

        {mode === "create" ? (
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <form onSubmit={handleCreateSchool} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="school-name">School name</Label>
                  <Input
                    id="school-name"
                    name="name"
                    placeholder="e.g. Lagos Heights College"
                    className="border-slate-200 bg-slate-50/50"
                    disabled={isSubmitting}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-curriculum">Curriculum</Label>
                  <Select
                    name="curriculum"
                    defaultValue="waec_neco"
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="school-curriculum"
                      className="border-slate-200 bg-slate-50/50"
                    >
                      <SelectValue placeholder="Select a curriculum" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRICULUM_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      Create my school <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-xl">
            <CardContent className="p-6">
              <form onSubmit={handleRedeemInvite} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite code</Label>
                  <Input
                    id="invite-code"
                    name="code"
                    placeholder="e.g. A7K2M9QX"
                    className="border-slate-200 bg-slate-50/50 uppercase tracking-widest"
                    disabled={isSubmitting}
                    required
                    maxLength={12}
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    The code is tied to your email address — sign in with the
                    email your school admin invited.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redeeming…
                    </>
                  ) : (
                    <>
                      Join my school <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-slate-400 font-medium mt-6">
          One account, one school. Invites are issued by your school&apos;s
          administrator.
        </p>
      </div>
    </div>
  );
}