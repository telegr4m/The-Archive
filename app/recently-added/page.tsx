import type { Metadata } from "next";
import RecentlyAddedBrowser from "../components/RecentlyAddedBrowser";
import { getAllEntries } from "../lib/archiveRepository";

export const metadata: Metadata = {
  title: "Recent Archive Changes | The Archive",
  description: "Recent status changes, additions, and updates across the archive.",
};

export default function RecentlyAddedPage() {
  return <RecentlyAddedBrowser items={getAllEntries()} />;
}
