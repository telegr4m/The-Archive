import type { Metadata } from "next";
import RecentlyAddedBrowser from "../components/RecentlyAddedBrowser";
import { archiveItems } from "../data/archiveItems";

export const metadata: Metadata = {
  title: "Recently Added | The Archive",
  description: "Browse every archive entry in the order it was added.",
};

export default function RecentlyAddedPage() {
  return <RecentlyAddedBrowser items={archiveItems} />;
}
