"use client";

import { MotionConfig, motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  GraduationCap,
  HeartHandshake,
  Lock,
  Palette,
  School,
  Smartphone,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ReportCard } from "@/components/landing/ReportCard";
import { Reveal } from "@/components/landing/Reveal";
import { TermTimeline } from "@/components/landing/TermTimeline";

/*
 * Public landing page (issue #26).
 *
 * Copy rules:
 * - Lead with what changes for the school, not with the technology.
 * - Only describe what works today. Anything else carries "Coming soon".
 * - No invented customers, numbers or testimonials.
 */

type Outcome = { icon: LucideIcon; who: string; title: string; desc: string };

const OUTCOMES: Outcome[] = [
  {
    icon: Eye,
    who: "Proprietors & principals",
    title: "See the whole school without chasing anyone",
    desc: "Attendance, results and fees in one view, class by class, updated as your teachers work. Spot problems in week three, not at the end of term.",
  },
  {
    icon: Timer,
    who: "Teachers",
    title: "Evenings for lessons, not paperwork",
    desc: "Mark the register in a few taps, enter scores once, and start every report comment from a thoughtful first draft.",
  },
  {
    icon: HeartHandshake,
    who: "Parents",
    title: "No surprises on report day",
    desc: "Parents see attendance and results as they are recorded, and hear from the school directly. Engaged parents make for better-supported children.",
  },
  {
    icon: GraduationCap,
    who: "Students",
    title: "Feedback while there's time to improve",
    desc: "Results and teacher comments through the term, plus the materials their teachers share, so progress isn't left to the last week.",
  },
];

type Reason = { icon: LucideIcon; title: string; desc: string; soon?: boolean };

const REASONS: Reason[] = [
  {
    icon: School,
    title: "Made for Nigerian schools",
    desc: "Built around the three-term session, continuous assessment, exams and Naira billing. Works for WAEC/NECO, Cambridge, IB and American curricula.",
  },
  {
    icon: Lock,
    title: "Everyone sees only what they should",
    desc: "Each school's records are kept apart from every other school's. Inside a school, access follows each person's role.",
  },
  {
    icon: Sparkles,
    title: "AI that assists. Teachers decide.",
    desc: "AI will draft report comments from a student's results. Nothing reaches a parent until a teacher has read and approved it.",
    soon: true,
  },
  {
    icon: Smartphone,
    title: "Works on the phones people already have",
    desc: "Nothing to install. Staff and parents sign in from any browser with a secure link sent to their email.",
  },
  {
    icon: Palette,
    title: "Your school, your identity",
    desc: "Your logo, colours and contact details on dashboards, report cards and receipts, and a web address of your own.",
    soon: true,
  },
];

/** Faint exercise-book ruling with a red margin, for the hero background. */
const RULED_PAPER = {
  backgroundImage:
    "linear-gradient(to right, transparent 0 63px, rgb(248 113 113 / 0.35) 63px 65px, transparent 65px), repeating-linear-gradient(to bottom, transparent 0 35px, rgb(191 219 254 / 0.55) 35px 36px)",
} as const;

export default function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {/* Navigation */}
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" aria-label="Philos EduOS home">
              <BrandLogo size="md" />
            </Link>
            <div className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
              <a href="#outcomes" className="transition-colors hover:text-blue-600">Why it matters</a>
              <a href="#term" className="transition-colors hover:text-blue-600">How a term works</a>
              <a href="#why-philos" className="transition-colors hover:text-blue-600">Why Philos</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:block">
                Sign in
              </Link>
              <a href="#get-started" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700">
                Get started
              </a>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <header className="relative overflow-hidden pb-20 pt-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
            style={RULED_PAPER}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            {/* Hero copy is not animated, so it is readable before JavaScript
                loads on slow connections. Only the decoration moves. */}
            <div className="max-w-xl">
              <p className="mb-5 text-sm font-semibold text-blue-700">
                For proprietors, principals and the people who make schools work
              </p>
              <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl">
                Less paperwork.{" "}
                <span className="relative whitespace-nowrap text-blue-600">
                  More learning.
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 300 16"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full"
                  >
                    <motion.path
                      d="M3 11 C 70 3, 150 3, 297 8"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.6, duration: 0.7, ease: "easeInOut" }}
                    />
                  </svg>
                </span>
              </h1>
              <p className="mb-8 text-lg font-medium leading-relaxed text-slate-600">
                Philos EduOS brings attendance, results, report comments, fees and
                parent communication into one calm place. Leaders see the whole
                school at a glance, teachers get back to teaching, and parents
                always know how their child is doing.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  href="#get-started"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Bring Philos to your school
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="#term"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  See how a term works
                </a>
              </div>
              <p className="mt-8 text-sm text-slate-500">
                WAEC/NECO · Cambridge · IB · American curricula · Billing in Naira
              </p>
            </div>

            <ReportCard />
          </div>
        </header>

        {/* Outcomes */}
        <section id="outcomes" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                A better-run school, for everyone in it
              </h2>
              <p className="text-lg font-medium text-slate-600">
                When the records keep themselves, people spend their time on
                what matters: teaching, learning and looking after children.
              </p>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              {OUTCOMES.map((o, i) => (
                <Reveal key={o.who} delay={0.08 * i}>
                  <article className="h-full rounded-2xl border border-slate-200 bg-white p-8">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <o.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        {o.who}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-slate-900">{o.title}</h3>
                    <p className="font-medium leading-relaxed text-slate-600">{o.desc}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* A term with Philos */}
        <section id="term" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-16 max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                One term, start to finish
              </h2>
              <p className="text-lg font-medium text-slate-600">
                Philos follows the rhythm your school already runs on: resumption,
                daily registers, continuous assessment, exams, report cards and fees.
              </p>
            </Reveal>
            <TermTimeline />
          </div>
        </section>

        {/* Why Philos */}
        <section id="why-philos" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                What sets Philos apart
              </h2>
              <p className="text-lg font-medium text-slate-600">
                Not a foreign tool adapted for Nigeria. Built here, for how schools
                here actually work.
              </p>
            </Reveal>
            <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {REASONS.map((r, i) => (
                <Reveal key={r.title} delay={0.06 * i}>
                  <div className="flex gap-4">
                    <r.icon className="mt-1 h-6 w-6 shrink-0 text-blue-600" aria-hidden="true" />
                    <div>
                      <h3 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900">
                        {r.title}
                        {r.soon && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                            Coming soon
                          </span>
                        )}
                      </h3>
                      <p className="leading-relaxed text-slate-600">{r.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Get started: a chalkboard */}
        <section id="get-started" className="scroll-mt-16 bg-white px-4 py-24 sm:px-6 lg:px-8">
          <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border-[10px] border-amber-900/80 bg-slate-800 px-6 py-16 text-center text-white shadow-2xl sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 20% 30%, rgb(255 255 255 / 0.08), transparent 45%), radial-gradient(ellipse at 80% 70%, rgb(255 255 255 / 0.06), transparent 40%)",
              }}
            />
            <div className="relative">
              <p className="font-hand mb-2 text-3xl text-yellow-300">Ready for a calmer term?</p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
                Bring Philos to your school
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-slate-300">
                We set your school up with you: classes, subjects and your first
                staff. Then your team signs in with a secure link sent to their
                email. Already set up? Sign in below.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 font-bold text-slate-900 shadow-2xl transition-all hover:-translate-y-1 hover:bg-slate-50"
              >
                Get started
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-12 text-sm text-slate-400">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
            <BrandLogo size="sm" tone="dark" />
            <p>&copy; {new Date().getFullYear()} Philos EduOS. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
