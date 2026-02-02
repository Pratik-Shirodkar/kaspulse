import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KasPulse - Real-Time Kaspa Data Dashboard",
  description: "Experience Kaspa's millisecond block times through live data visualization, anchoring, and verification. Built for Kaspathon 2026.",
  keywords: ["Kaspa", "blockchain", "real-time", "data anchoring", "verification", "dashboard"],
  authors: [{ name: "KasPulse Team" }],
  openGraph: {
    title: "KasPulse - Real-Time Kaspa Data Dashboard",
    description: "Experience blockchain speed like never before",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-main min-h-screen`}
      >
        <Header />
        <main className="pt-24 md:pt-20 pb-8 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
