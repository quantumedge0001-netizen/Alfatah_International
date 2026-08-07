import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";
import { NotificationProvider } from "@/components/Notification";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Membrane Mart",
  description: "Import & Government Sales Management Platform",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#101c26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-body text-sm">
        <NotificationProvider>
          {children}
          <RegisterSW />
        </NotificationProvider>
      </body>
    </html>
  );
}
