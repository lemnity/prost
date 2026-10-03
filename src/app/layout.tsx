import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
