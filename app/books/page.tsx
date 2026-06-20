import ArchivePage from "../components/ArchivePage";
import { getEntriesByCategory } from "../lib/archiveRepository";

export default function BooksPage() {
  return (
    <ArchivePage
      category="Book"
      title="Books"
      items={getEntriesByCategory("Book")}
      description="Physical books and novels that shaped perspective, sparked curiosity, and earned a permanent place on the shelf."
    />
  );
}
