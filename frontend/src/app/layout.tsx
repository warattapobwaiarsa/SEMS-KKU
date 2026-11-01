import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEMS - ระบบบริหารจัดการการประเมินทุนการศึกษา มหาวิทยาลัยขอนแก่น",
  description: "Scholarship Evaluation Management System (SEMS-KKU) คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FFFFFF] text-[#374151]">
        {children}
      </body>
    </html>
  );
}
