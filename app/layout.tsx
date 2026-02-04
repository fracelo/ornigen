import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./app.css";
import { AuthProvider } from "./context/authContext";
import { EmpresaProvider } from "./context/empresaContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrniGen",
  description: "Plataforma de Genealogia Ornitológica",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <EmpresaProvider>
            {children}
          </EmpresaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}