import { cn } from "@/lib/utils";

/**
 * Philos EduOS brand mark ("Bookmarked P") and wordmark.
 *
 * The mark is drawn inline from the same paths as `public/brand/mark.svg`
 * (source: the marketing repo's brand kit), so it costs no request and stays
 * crisp at any size. Brand rules: don't recolour the tile, and "EduOS" is
 * always yellow-500. Yellow is decorative only, never body text on white.
 */

const SIZES = {
  sm: { mark: "h-7 w-7", text: "text-lg" },
  md: { mark: "h-8 w-8", text: "text-xl" },
  lg: { mark: "h-10 w-10", text: "text-2xl" },
} as const;

type BrandLogoProps = {
  size?: keyof typeof SIZES;
  /** `dark` sets the wordmark in white for slate-900 or blue backgrounds. */
  tone?: "light" | "dark";
  /** Hide the wordmark to show the mark alone (e.g. a collapsed sidebar). */
  markOnly?: boolean;
  className?: string;
};

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#2563eb" />
      <path
        d="M19 12 H35 C44.4 12 51 18.4 51 27 C51 35.6 44.4 42 35 42 H28 V52 H19 Z M28 20 V34 H35 C39.4 34 42 31 42 27 C42 23 39.4 20 35 20 Z"
        fill="#ffffff"
        fillRule="evenodd"
      />
      <path d="M31.5 12 H38.5 V31 L35 27.8 L31.5 31 Z" fill="#eab308" />
    </svg>
  );
}

export function BrandLogo({
  size = "md",
  tone = "light",
  markOnly = false,
  className,
}: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      role="img"
      aria-label="Philos EduOS"
    >
      <BrandMark className={s.mark} />
      {!markOnly && (
        <span
          aria-hidden="true"
          className={cn(
            "font-extrabold tracking-[-0.02em]",
            s.text,
            tone === "dark" ? "text-white" : "text-slate-900",
          )}
        >
          Philos <span className="text-yellow-500">EduOS</span>
        </span>
      )}
    </span>
  );
}
