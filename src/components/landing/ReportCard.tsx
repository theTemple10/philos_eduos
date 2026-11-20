"use client";

import { motion } from "framer-motion";
import { BrandMark } from "@/components/BrandLogo";

/**
 * Hero illustration: a paper term report for a fictional student, with a
 * handwritten teacher comment and a red-pen tick. It is an illustration, not
 * a screenshot. The "Sample" stamp makes clear the data is made up.
 *
 * Grades follow the WAEC-style key (A1 75–100, B2 70–74, B3 65–69).
 */
const ROWS = [
  { subject: "Mathematics", ca: 34, exam: 48, grade: "A1" },
  { subject: "English Language", ca: 30, exam: 44, grade: "B2" },
  { subject: "Basic Science", ca: 27, exam: 42, grade: "B3" },
  { subject: "Civic Education", ca: 36, exam: 52, grade: "A1" },
];

export function ReportCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Sticky note */}
      <motion.div
        initial={{ opacity: 0, rotate: 0, y: 8 }}
        animate={{ opacity: 1, rotate: -5, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute -bottom-16 -left-2 z-20 w-36 rounded-sm bg-yellow-200 px-3 py-2 shadow-md sm:-left-10"
        aria-hidden="true"
      >
        <p className="font-hand text-xl leading-tight text-slate-800">
          PTA meeting
          <br />
          Sat · 10am
        </p>
      </motion.div>

      <motion.figure
        initial={{ opacity: 0, y: 24, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-6"
        aria-label="Illustration of a sample term report card"
      >
        <header className="flex items-center gap-3 border-b-2 border-double border-slate-200 pb-3">
          <BrandMark className="h-9 w-9" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              First Term Report · 2026/2027
            </p>
            <p className="truncate text-sm font-bold text-slate-900">
              Adaeze Okafor · JSS 2 Gold
            </p>
          </div>
          <span className="ml-auto rotate-6 rounded border border-red-300 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Sample
          </span>
        </header>

        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400">
              <th className="py-1 font-semibold">Subject</th>
              <th className="py-1 text-right font-semibold">CA</th>
              <th className="py-1 text-right font-semibold">Exam</th>
              <th className="py-1 text-right font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <motion.tr
                key={r.subject}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.35 }}
                className="border-t border-slate-100"
              >
                <td className="py-1.5 font-medium text-slate-700">{r.subject}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-500">{r.ca}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-500">{r.exam}</td>
                <td className="py-1.5 text-right font-bold tabular-nums text-blue-700">{r.grade}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>
            Attendance <strong className="text-slate-800">58 / 60 days</strong>
          </span>
          <span>
            Average <strong className="text-slate-800">78.3%</strong>
          </span>
        </div>

        <div className="relative mt-4 border-t border-dashed border-slate-200 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Class teacher&apos;s comment
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="font-hand text-2xl leading-snug text-blue-800"
          >
            A focused, hardworking term. Keep reading every evening!
          </motion.p>

          {/* Red-pen tick, drawn on load */}
          <svg
            viewBox="0 0 48 40"
            className="absolute -bottom-1 right-1 h-10 w-12"
            aria-hidden="true"
          >
            <motion.path
              d="M4 22 L17 34 L44 5"
              fill="none"
              stroke="#dc2626"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.4, duration: 0.5, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </motion.figure>
    </div>
  );
}
