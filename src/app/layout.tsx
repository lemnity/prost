import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "./globals.css";
import { MuiProvider } from "@/components/mui/mui-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
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
        className="min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] font-sans md:pb-0"
        suppressHydrationWarning
      >
        {/* Material UI: стили в @layer mui — классы Tailwind (utilities) их перекрывают. */}
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <MuiProvider>
            <PageLoader />
            <NavigationLoader />
            <SiteHeader />
            {children}
            <SiteFooter />
            <MobileTabBar />
          </MuiProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
