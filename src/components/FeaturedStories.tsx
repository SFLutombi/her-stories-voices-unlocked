import { StoryCard } from "./StoryCard";
import storyCover1 from "@/assets/story-cover-1.jpg";
import storyCover2 from "@/assets/story-cover-2.jpg";
import storyCover3 from "@/assets/story-cover-3.jpg";

const featuredStories = [
  {
    id: "1",
    title: "Surviving the Storm",
    author: "Nomsa Mthembu",
    description: "A powerful testimony of overcoming domestic violence and finding strength in community. This story follows a woman's journey from fear to empowerment, one chapter at a time.",
    coverImage: storyCover1,
    pricePerChapter: 5,
    totalChapters: 12,
    category: "Survivor Stories",
    impact: "50% goes to women's shelters"
  },
  {
    id: "2", 
    title: "Letters to My Daughter",
    author: "Amahle Zulu",
    description: "Heartfelt wisdom passed down through generations. A mother's love letters filled with life lessons, cultural heritage, and dreams for the future.",
    coverImage: storyCover2,
    pricePerChapter: 3,
    totalChapters: 8,
    category: "Life Lessons"
  },
  {
    id: "3",
    title: "Rising from Ashes",
    author: "Anonymous",
    description: "An anonymous tale of healing and hope after trauma. Raw, honest, and ultimately uplifting - a testament to the human spirit's resilience.",
    coverImage: storyCover3,
    pricePerChapter: 4,
    totalChapters: 15,
    category: "Healing Journeys",
    isAnonymous: true,
    impact: "Supports GBV survivors"
  }
];

export const FeaturedStories = () => {
  return (
    <section id="discover" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Featured <span className="gradient-primary bg-clip-text text-transparent">Stories</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover powerful narratives from South African women. 
            Every purchase directly supports the author - no middlemen, no exploitation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredStories.map((story) => (
            <StoryCard key={story.id} {...story} />
          ))}
        </div>
      </div>
    </section>
  );
};