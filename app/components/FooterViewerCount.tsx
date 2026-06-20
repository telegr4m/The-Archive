"use client";

import { useEffect, useState } from "react";

export default function FooterViewerCount() {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/site-views", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("View count unavailable");
        return (await response.json()) as { total?: number };
      })
      .then((result) => {
        if (Number.isSafeInteger(result.total)) setViews(result.total ?? null);
      })
      .catch(() => {
        // The footer remains usable when persistent storage is not configured.
      });

    return () => controller.abort();
  }, []);

  return (
    <div
      className="inline-flex items-center gap-1.5 text-[0.65rem] text-gray-600"
      title="Total site views"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" aria-hidden="true" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
      <span className="sr-only">Total site views:</span>
      <span className="min-w-3 tabular-nums">
        {views === null ? "-" : views.toLocaleString()}
      </span>
    </div>
  );
}
