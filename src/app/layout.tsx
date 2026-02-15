import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClientProviders } from "@/components/ClientProviders";
import { LiveTickerWrapper } from "@/components/LiveTickerWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KasPulse - AI-Powered Kaspa Ecosystem",
  description: "Experience Kaspa's millisecond block times through AI-powered insights, live data visualization, payments, and gaming. Built for Kaspathon 2026.",
  keywords: ["Kaspa", "blockchain", "AI", "real-time", "data anchoring", "payments", "gaming"],
  authors: [{ name: "KasPulse Team" }],
  openGraph: {
    title: "KasPulse - AI-Powered Kaspa Ecosystem",
    description: "The Super App for Kaspa with AI-powered blockchain insights",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
        <LiveTickerWrapper />
        <Header />
        <main className="pt-32 md:pt-28 pb-8 relative z-10">
          <ClientProviders>
            {children}
          </ClientProviders>
        </main>
        <Footer />
      </body>
    </html>
  );
}

