/**
 * Report-comment bank (issue #40): ready-made comments by performance band.
 *
 * Free, works without any AI service, and sends no student data anywhere.
 * The teacher picks a suggestion, edits it and approves it.
 *
 * Pure module (no "@/" imports) so it is unit-tested under `node --test`.
 */

export type Band = "excellent" | "very-good" | "good" | "fair" | "needs-support";

export const BANDS: { id: Band; label: string; range: string }[] = [
  { id: "excellent", label: "Excellent", range: "75% and above" },
  { id: "very-good", label: "Very good", range: "65–74%" },
  { id: "good", label: "Good", range: "50–64%" },
  { id: "fair", label: "Fair", range: "40–49%" },
  { id: "needs-support", label: "Needs support", range: "below 40%" },
];

/**
 * Band for a percentage. The boundaries follow the WAEC-style key schools
 * already use: A1 from 75, B2/B3 from 65, C4–C6 from 50, D7/E8 from 40,
 * F9 below 40.
 */
export function bandFor(percent: number): Band {
  if (percent >= 75) return "excellent";
  if (percent >= 65) return "very-good";
  if (percent >= 50) return "good";
  if (percent >= 40) return "fair";
  return "needs-support";
}

/** Average percentage across scores, or null if none are usable. */
export function averagePercent(scores: { score: number; max: number }[]): number | null {
  const usable = scores.filter((s) => Number.isFinite(s.score) && Number.isFinite(s.max) && s.max > 0);
  if (usable.length === 0) return null;
  const total = usable.reduce((sum, s) => sum + Math.min(Math.max(s.score / s.max, 0), 1), 0);
  return Math.round((total / usable.length) * 1000) / 10;
}

/**
 * "Mathematics:85/100, English:72/100" → parsed scores. Entries that
 * don't parse are skipped.
 */
export function parseScores(text: string): { subject: string; score: number; max: number }[] {
  return text
    .split(",")
    .map((part) => {
      const [subject, ratio] = part.split(":").map((p) => p.trim());
      if (!subject || !ratio) return undefined;
      const [score, max] = ratio.split("/").map((n) => parseFloat(n.trim()));
      if (Number.isNaN(score) || Number.isNaN(max)) return undefined;
      return { subject, score, max };
    })
    .filter((s): s is { subject: string; score: number; max: number } => s !== undefined);
}

/** {name} = student's first name, {subject} = subject. */
const BANK: Record<Band, string[]> = {
  excellent: [
    "{name} has had an outstanding term in {subject}. {name}'s work is consistently accurate and thoughtful. Keep aiming high!",
    "An excellent performance from {name} in {subject}. {name} grasps new topics quickly and helps classmates too. Well done.",
    "{name} shows real mastery of {subject} and approaches every task with care. A superb result. Keep up the hard work.",
    "Brilliant work this term, {name}. Your understanding of {subject} is strong and your effort shows. Continue to challenge yourself.",
  ],
  "very-good": [
    "{name} has done very well in {subject} this term and shows a good understanding of the topics covered. With a little more attention to detail, {name} can reach the top.",
    "A very good term for {name} in {subject}. {name} works steadily and participates well in class. Keep it up.",
    "{name} is a capable {subject} student who produces good work. More practice on the harder questions will lift {name} even higher.",
    "Very good effort in {subject}, {name}. You are making solid progress; keep revising regularly to build on it.",
  ],
  good: [
    "{name} has made good progress in {subject} this term. Regular practice and asking questions in class will help {name} improve further.",
    "A good result for {name} in {subject}. {name} understands the main ideas and should now work on accuracy and completing work on time.",
    "{name} is steadily improving in {subject}. With more focus during lessons and consistent revision, {name} can do even better next term.",
    "Good effort in {subject}, {name}. Keep working at the topics you find difficult and don't hesitate to ask for help.",
  ],
  fair: [
    "{name} has shown some understanding of {subject} this term but needs to put in more consistent effort. Daily revision will make a real difference.",
    "A fair performance from {name} in {subject}. {name} should pay closer attention in class and complete all assignments to improve.",
    "{name} can do better in {subject}. More practice at home and asking for help early will help {name} catch up.",
    "{name} is trying in {subject}, but needs more practice to build confidence. We will support {name} closely next term.",
  ],
  "needs-support": [
    "{name} found {subject} challenging this term. With extra support at school and regular practice at home, {name} can improve. We will work closely with {name}.",
    "{name} needs more help to understand the key topics in {subject}. We encourage extra lessons and daily revision, and we will keep parents informed of progress.",
    "{name} has struggled in {subject} this term but can improve with steady effort. Please encourage {name} to practise a little every day.",
    "{subject} has been difficult for {name} this term. We will give {name} extra support next term and ask for regular practice at home.",
  ],
};

/** Suggestions for one student, with name and subject filled in. */
export function suggestComments(input: { name: string; subject: string; band: Band }): string[] {
  const first = input.name.trim().split(/\s+/)[0] || "This student";
  const subject = input.subject.trim() || "this subject";
  return BANK[input.band].map((t) =>
    t.replaceAll("{name}", first).replaceAll("{subject}", subject),
  );
}
