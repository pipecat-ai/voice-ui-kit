import type { Metadata } from "next";
import { Lexend } from "next/font/google";

import "@pipecat-ai/voice-ui-kit/styles.css";

import "./globals.css";

const lexendSans = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice UI Kit - App Helper Example",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lexendSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
