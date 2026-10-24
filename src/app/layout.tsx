import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eliza Hair Store",
  description:
    "Shop wigs, extensions, oils and hair care. Order online and track your order.",
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
