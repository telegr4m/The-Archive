import ArchivePage from "../components/ArchivePage";
import { getArchiveItemsByCategory } from "../data/archiveItems";

export default function BooksPage() {
  return (
    <ArchivePage
      category="Book"
      title="Books"
      items={getArchiveItemsByCategory("Book")}
      description="Physical books and novels that shaped perspective, sparked curiosity, and earned a permanent place on the shelf."
    />
  );
}
