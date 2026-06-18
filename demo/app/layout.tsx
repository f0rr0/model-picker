import type { Metadata } from "next";
import type { ReactNode } from "react";
// oxlint-disable-next-line import/no-unassigned-import
import "./globals.css";

export const metadata: Metadata = {
  description: "Focused dark theme demo for the animated model picker.",
  title: "Model Picker Demo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
