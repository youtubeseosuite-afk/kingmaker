// Path: app/layout.tsx | Type: NEW
import type { Metadata } from "next";
import { Cinzel, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "Kronens Grænse",
  description: "Et asymmetrisk, persistent tekst-strategispil.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className={`${cinzel.variable} ${plexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
