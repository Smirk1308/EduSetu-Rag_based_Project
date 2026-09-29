import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "J&K EduSetu | AI Career, Scholarship & College Advisor",
  description:
    "Official Autonomous AI Higher Education Advisor for Jammu, Kashmir & Ladakh. AICTE PMSSS, BOPEE Seat Matrices, and S.O. 176 (2024) Reservation Policies.",
  icons: {
    icon: "/jk_emblem.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen flex flex-col antialiased selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
