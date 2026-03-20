import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Letterboxd",
  description: "Your personal sports diary",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
