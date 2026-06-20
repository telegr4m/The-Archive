import ArchivePage from "../components/ArchivePage";
import { getEntriesByCategory } from "../lib/archiveRepository";

export default function WebNovelsPage() {
  return (
    <ArchivePage
      category="Web Novel"
      title="Web Novels"
      items={getEntriesByCategory("Web Novel")}
      description="Long-form adventures filled with layered mysteries, deep lore, and worlds built one chapter at a time."
    />
  );
}
