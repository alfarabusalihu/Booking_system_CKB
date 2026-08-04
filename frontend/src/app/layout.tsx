import type { Metadata } from "next";
import "./globals.css";
import { GlobalHeader } from "@/modules/core/components/GlobalHeader";
import { BookingStoreHydrator } from "@/modules/core/components/BookingStoreHydrator";

export const metadata: Metadata = {
  title: "LK Train Reservation System",
  description: "Official Sri Lanka Railway Train Ticket Reservation Platform with real-time seat locks and segment availability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100" suppressHydrationWarning>
        <BookingStoreHydrator />
        <GlobalHeader />
        {children}
      </body>
    </html>
  );
}
