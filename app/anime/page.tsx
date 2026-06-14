import ArchivePage from "../components/ArchivePage";
import { getArchiveItemsByCategory } from "../data/archiveItems";

export default function AnimePage() {
  return (
    <ArchivePage
      category="Anime"
      title="Anime"
      items={getArchiveItemsByCategory("Anime")}
      description="Animated works whose direction, sound, characters, and defining moments stayed long after the final episode."
    />
  );
}
