import type { Metadata } from "next";
import FavoritesBrowser from "../components/FavoritesBrowser";
import { archiveItems } from "../data/archiveItems";
import { getFavoriteArchiveItems } from "../data/favorites";

export const metadata: Metadata = {
  title: "Favorites | The Archive",
  description: "Browse every archive entry marked as a favorite.",
};

export default function FavoritesPage() {
  return <FavoritesBrowser items={getFavoriteArchiveItems(archiveItems)} />;
}
