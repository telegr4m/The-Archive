import ArchivePage from "../components/ArchivePage";
import { getArchiveItemsByCategory } from "../data/archiveItems";

export default function WebNovelsPage() {
  return (
    <ArchivePage
      category="Web Novel"
      title="Web Novels"
      items={getArchiveItemsByCategory("Web Novel")}
      description="Long-form adventures filled with layered mysteries, deep lore, and worlds built one chapter at a time."
    />
  );
}
