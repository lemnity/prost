import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Корпоративные подарки и сувениры с логотипом в Тюмени — ProStyle",
  description: "Онлайн-заказ подарков, бизнес-сувениров с нанесением и без.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen font-sans"><SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
