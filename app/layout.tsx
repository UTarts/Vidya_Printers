import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import Navigation from "../components/Navigation";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Vidya Printers | ERP",
  description: "Enterprise Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Import Google Material Symbols exactly as Stitch did */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} bg-bg-main text-text-main w-full h-full md:min-h-screen overflow-x-hidden antialiased`}>
        <ThemeProvider>
          <div className="flex flex-col md:flex-row h-screen md:min-h-screen">
            <Navigation />
            
            {/* Main Content Area - Padding adjusted for mobile bottom nav */}
            <main className="flex-1 w-full max-w-7xl mx-auto h-full overflow-y-auto bg-bg-main">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}