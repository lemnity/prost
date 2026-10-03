import { Hero } from "@/components/home/hero";
import { PopularCategories } from "@/components/home/popular-categories";
import { NewProducts } from "@/components/home/new-products";
import { HowWeWork } from "@/components/home/how-we-work";
import { ApplicationTypes } from "@/components/home/application-types";

export default function Home() {
  return (
    <main>
      <Hero />
      <PopularCategories />
      <NewProducts />
      <HowWeWork />
      <ApplicationTypes />
    </main>
  );
}
