import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MGFinance - Gestor Financeiro",
  description: "Gerencie suas finanças pessoais com inteligência artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-[#050a14] text-slate-100 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
