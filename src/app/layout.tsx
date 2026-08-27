import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Atelier — Reference to 3D",
  description: "Upload a floor plan, blueprint, image, or design reference and reconstruct it as an immersive 3D environment.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
