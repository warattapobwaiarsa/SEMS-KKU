import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-thai",
  display: "swap",
});

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
    <html lang="th" className={`h-full antialiased ${ibmPlexSansThai.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FFFFFF] text-[#374151]">
        {children}
      </body>
    </html>
  );
}
