"use client";

import { motion } from "framer-motion";
import {
  BellRing,
  ClipboardCheck,
  FileText,
  NotebookPen,
  PenLine,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Step = {
  icon: LucideIcon;
  when: string;
  title: string;
  desc: string;
  /** Anything not yet working in the product is labelled (issue #26). */
  soon?: string;
};

const STEPS: Step[] = [
  {
    icon: BellRing,
    when: "Resumption",
    title: "Set up the term",
    desc: "Classes, subjects and teachers in place. Staff are invited and sign in with a secure email link.",
  },
  {
    icon: ClipboardCheck,
    when: "Every morning",
    title: "Take attendance",
    desc: "Teachers mark the register in a few taps. Parents can see their child's record.",
  },
  {
    icon: NotebookPen,
    when: "Through the term",
    title: "Teach and assess",
    desc: "Record continuous-assessment scores, share learning materials and message parents.",
    soon: "Assignments and student submissions",
  },
  {
    icon: PenLine,
    when: "Exams",
    title: "Record results",
    desc: "Exam scores sit beside CA for every subject, so each student's performance is clear.",
  },
  {
    icon: FileText,
    when: "Report time",
    title: "Write report comments",
    desc: "AI drafts a comment from each student's results. The teacher edits and approves it.",
    soon: "Printable report cards with your school's branding",
  },
  {
    icon: Wallet,
    when: "Fees",
    title: "Bill parents",
    desc: "Fee schedules and invoices in Naira, per class and per term.",
    soon: "Online payment through Paystack",
  },
];

export function TermTimeline() {
  return (
    <ol className="relative grid gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
      {/* Connecting line (desktop only), drawn once on scroll */}
      <motion.span
        aria-hidden="true"
        className="absolute left-0 right-0 top-6 hidden h-0.5 origin-left bg-blue-100 lg:block"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      {STEPS.map((s, i) => (
        <motion.li
          key={s.title}
          className="relative"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.15 * i, duration: 0.4 }}
        >
          <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-100 bg-white text-blue-600">
            <s.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-yellow-600">
            {s.when}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
          {s.soon && (
            <p className="mt-3 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium leading-snug text-slate-600">
              <span className="block font-bold uppercase tracking-wider text-[10px] text-yellow-700">
                Coming soon
              </span>
              {s.soon}
            </p>
          )}
        </motion.li>
      ))}
    </ol>
  );
}
