import ArchivePage from "../components/ArchivePage";
import { getArchiveItemsByCategory } from "../data/archiveItems";

export default function MangaPage() {
  return (
    <ArchivePage
      category="Manga"
      title="Manga"
      items={getArchiveItemsByCategory("Manga")}
      description="A growing collection of Japanese series, unforgettable characters, and illustrated worlds worth revisiting."
    />
  );
}
