import ArchivePage from "../components/ArchivePage";
import { getEntriesByCategory } from "../lib/archiveRepository";

export default function ManhwaPage() {
  return (
    <ArchivePage
      category="Manhwa"
      title="Manhwa"
      items={getEntriesByCategory("Manhwa")}
      description="Korean series spanning action, fantasy, drama, and the works that made every weekly chapter feel essential."
    />
  );
}
