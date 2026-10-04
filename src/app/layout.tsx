import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageLoader } from "@/components/layout/page-loader";
import { NavigationLoader } from "@/components/layout/navigation-loader";

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
      <body
        className="min-h-screen font-sans"
        aria-busy="true"
        suppressHydrationWarning
      >
        <PageLoader />
        <NavigationLoader />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
