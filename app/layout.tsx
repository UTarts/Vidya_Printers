import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vidya Printers ERP",
  description: "Enterprise management system for Vidya Printers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* This line loads all the beautiful Material icons you used in your Navigation */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="antialiased overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {/* Main Layout Wrapper */}
          <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
            
            {/* The beautiful Sidebar / Mobile Bottom Nav you built */}
            <Navigation />
            
            {/* The Main Content Area where your pages will load */}
            <main className="flex-1 h-full overflow-y-auto relative pb-20 md:pb-0 scrollbar-hide">
              {children}
            </main>
            
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}