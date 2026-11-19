import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

export const dynamic = "force-dynamic";

// Brand typeface (SIL OFL). next/font self-hosts it at build time: no request
// to Google from the browser, and no layout shift. Variable font, all weights.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const description =
  "Multi-tenant school management platform for Nigerian educational institutions";

export const metadata: Metadata = {
  title: "Philos EduOS",
  description,
  // Brand icons from public/ (see public/brand/README.md).
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon-180.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Philos EduOS",
    description,
    // TODO(#22 follow-up): add a 1200x630 social card from the marketing repo.
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
