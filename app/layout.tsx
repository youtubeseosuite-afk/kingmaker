// Path: app/layout.tsx | Type: UPDATE
import type { Metadata } from "next";
import { Cinzel, Crimson_Text } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-crimson",
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
    <html lang="da" className={`${cinzel.variable} ${crimsonText.variable}`}>
      <body>{children}</body>
    </html>
  );
}
