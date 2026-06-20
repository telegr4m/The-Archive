import ArchivePage from "../components/ArchivePage";
import { getEntriesByCategory } from "../lib/archiveRepository";

export default function AnimePage() {
  return (
    <ArchivePage
      category="Anime"
      title="Anime"
      items={getEntriesByCategory("Anime")}
      description="Animated works whose direction, sound, characters, and defining moments stayed long after the final episode."
    />
  );
}
