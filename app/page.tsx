import HeroSection from "./components/HeroSection";
import ArchiveStats from "./components/ArchiveStats";
import ArchiveHeatmap from "./components/ArchiveHeatmap";
import ArchiveTimeline from "./components/ArchiveTimeline";
import FeaturedStory from "./components/FeaturedStory";
import FavoritesVault from "./components/FavoritesVault";
import RecentlyAdded from "./components/RecentlyAdded";

export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />

      <ArchiveStats showAverageRating={false} />

      <ArchiveHeatmap />

      <FeaturedStory />

      <ArchiveTimeline />

      <RecentlyAdded />

      <FavoritesVault />
    </main>
  );
}
