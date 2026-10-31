import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MenoMorph AI",
  description:
    "Menopause-aware skin intelligence, product safety, and beauty discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}