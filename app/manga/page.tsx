import ArchivePage from "../components/ArchivePage";
import { getEntriesByCategory } from "../lib/archiveRepository";

export default function MangaPage() {
  return (
    <ArchivePage
      category="Manga"
      title="Manga"
      items={getEntriesByCategory("Manga")}
      description="A growing collection of Japanese series, unforgettable characters, and illustrated worlds worth revisiting."
    />
  );
}
