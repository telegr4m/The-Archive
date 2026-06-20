import type { Metadata } from "next";
import FavoritesBrowser from "../components/FavoritesBrowser";
import { getFavoriteEntries } from "../lib/archiveRepository";

export const metadata: Metadata = {
  title: "Favorites | The Archive",
  description: "Browse every archive entry marked as a favorite.",
};

export default function FavoritesPage() {
  return <FavoritesBrowser items={getFavoriteEntries()} />;
}
