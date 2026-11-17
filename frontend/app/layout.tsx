import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Multi-Vendor Marketplace",
  description: "Mini multi-vendor marketplace take-home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <div className="app-shell">
              <NavBar />
              <main className="container app-main">{children}</main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
