import { BannerSlider } from "@/components/home/banner-slider";
import { PopularCategories } from "@/components/home/popular-categories";
import { NewProducts } from "@/components/home/new-products";
import { HowWeWork } from "@/components/home/how-we-work";
import { ApplicationTypes } from "@/components/home/application-types";
import { OurWorks } from "@/components/home/our-works";
import { Reviews } from "@/components/home/reviews";
import { Clients } from "@/components/home/clients";
import { ConsultationCta } from "@/components/home/consultation-cta";

export default function Home() {
  return (
    <main>
      <BannerSlider />
      <PopularCategories />
      <NewProducts />
      <HowWeWork />
      <ApplicationTypes />
      <OurWorks />
      <Reviews />
      <Clients />
      <ConsultationCta />
    </main>
  );
}
