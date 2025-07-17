import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geometric",
});

export const metadata: Metadata = {
  title: "Scamvisor",
  description: "To help you avoid scams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full`}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
