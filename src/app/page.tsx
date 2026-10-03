import { BannerSlider } from "@/components/home/banner-slider";
import { PopularCategories } from "@/components/home/popular-categories";
import { NewProducts } from "@/components/home/new-products";
import { WeeklySale } from "@/components/home/weekly-sale";
import { HowWeWork } from "@/components/home/how-we-work";
import { ApplicationTypes } from "@/components/home/application-types";
import { OurWorks } from "@/components/home/our-works";
import { Reviews } from "@/components/home/reviews";
import { Clients } from "@/components/home/clients";
import { ConsultationCta } from "@/components/home/consultation-cta";

export const revalidate = 3600;

export default function Home() {
  return (
    <main id="main">
      <h1 className="sr-only">
        Корпоративные подарки и сувениры с логотипом в Тюмени
      </h1>
      <BannerSlider />
      <PopularCategories />
      <NewProducts />
      <WeeklySale />
      <HowWeWork />
      <ApplicationTypes />
      <OurWorks />
      <Reviews />
      <Clients />
      <ConsultationCta />
    </main>
  );
}
