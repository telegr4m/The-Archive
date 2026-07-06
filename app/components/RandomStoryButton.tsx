"use client";

import { useRouter } from "next/navigation";
import { getArchiveItemHref } from "../lib/archiveRoutes";
import { getAllEntries } from "../lib/archiveRepository";

type RandomStoryButtonProps = {
  className?: string;
  currentItemId?: string;
  label?: string;
  showIcon?: boolean;
};

export default function RandomStoryButton({
  className = "",
  currentItemId,
  label = "Random Entry",
  showIcon = false,
}: RandomStoryButtonProps) {
  const router = useRouter();

  function openRandomStory() {
    const archiveItems = getAllEntries();
    const randomPool =
      archiveItems.length > 1 && currentItemId
        ? archiveItems.filter((item) => item.id !== currentItemId)
        : archiveItems;
    const randomItem =
      randomPool[Math.floor(Math.random() * randomPool.length)];

    if (randomItem) {
      router.push(`${getArchiveItemHref(randomItem)}?from=random`, {
        scroll: true,
      });
    }
  }

  return (
    <button type="button" className={className} onClick={openRandomStory}>
      {showIcon && <ShuffleIcon />}
      {label}
    </button>
  );
}

function ShuffleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12"
      aria-hidden="true"
    >
      <path d="M17 3h4v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m21 3-6.5 6.5a3 3 0 0 1-4.25 0L3 3" strokeLinecap="round" />
      <path d="M17 17h4v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m21 21-6.5-6.5a3 3 0 0 0-4.25 0L3 21" strokeLinecap="round" />
    </svg>
  );
}
