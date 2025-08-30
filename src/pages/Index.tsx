import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FeaturedStories } from "@/components/FeaturedStories";
import { Categories } from "@/components/Categories";
import { Impact } from "@/components/Impact";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <FeaturedStories />
      <Categories />
      <Impact />
      <Footer />
    </div>
  );
};

export default Index;