import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils"; // This import is no longer used based on the new body className

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crediscout | AI Credit Readiness",
  description: "Democratizing financial credibility using behavioral data.",
};

export default function RootLayout({
  children,
}: { // Removed Readonly
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
