import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HealthBar from "@/components/HealthBar";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dead Letter Office — Bounce Autopsy Lab",
  description: "Forensic hygiene engine for outbound email — Next.js TS + Tailwind + Prisma MySQL",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0b0b0c] text-[#ece9e4]">
        <div className="min-h-screen flex">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <TopBar />
            <HealthBar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/10 py-4 text-center">
              <p className="label">Go + Postgres + Redis + Kafka • Next TS + Tailwind + MySQL Prisma + REST • HMAC + SKIP LOCKED</p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
