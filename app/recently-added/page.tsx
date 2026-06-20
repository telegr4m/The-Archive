import type { Metadata } from "next";
import RecentlyAddedBrowser from "../components/RecentlyAddedBrowser";
import { getAllEntries } from "../lib/archiveRepository";

export const metadata: Metadata = {
  title: "Recently Added | The Archive",
  description: "Browse every archive entry in the order it was added.",
};

export default function RecentlyAddedPage() {
  return <RecentlyAddedBrowser items={getAllEntries()} />;
}
