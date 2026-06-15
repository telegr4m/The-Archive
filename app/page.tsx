import HeroSection from "./components/HeroSection";
import ArchiveStats from "./components/ArchiveStats";
import ArchiveHeatmap from "./components/ArchiveHeatmap";
import ArchiveTimeline from "./components/ArchiveTimeline";
import FeaturedStory from "./components/FeaturedStory";
import FavoritesVault from "./components/FavoritesVault";
import RecentlyAdded from "./components/RecentlyAdded";
import { archiveItems } from "./data/archiveItems";

export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />

      <ArchiveStats showAverageRating={false} />

      <ArchiveHeatmap />

      <FeaturedStory
        featuredItems={archiveItems.filter((item) => item.featured)}
      />

      <ArchiveTimeline />

      <RecentlyAdded />

      <FavoritesVault />
    </main>
  );
}
