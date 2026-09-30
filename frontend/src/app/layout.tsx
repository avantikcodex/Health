import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CareFlow — Unified Healthcare Operating & Journey Coordination Platform",
  description:
    "Unified, consent-driven healthcare journey platform coordinating discovery, appointments, smart check-in, live queue, clinical encounters, cryptographic prescriptions, and DPDP-compliant longitudinal records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
