import ArchivePage from "../components/ArchivePage";
import { getArchiveItemsByCategory } from "../data/archiveItems";

export default function ManhwaPage() {
  return (
    <ArchivePage
      category="Manhwa"
      title="Manhwa"
      items={getArchiveItemsByCategory("Manhwa")}
      description="Korean series spanning action, fantasy, drama, and the works that made every weekly chapter feel essential."
    />
  );
}
