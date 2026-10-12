import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manajemen Keuangan Blower Sanur",
  description: "Sistem Operasional & Manajemen Sewa Blower Sanur",
  manifest: "/manifest.json", // <--- Tambahkan baris ini
  themeColor: "#0d1322",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}