"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const timelineEntries = [
  { year: "2015", title: "First Anime" },
  { year: "2017", title: "First Book" },
  { year: "2022", title: "Started Reading Manga" },
  { year: "2023", title: "Discovered Manhwa" },
  { year: "2026", title: "Built The Archive" },
];

export default function ArchiveTimeline() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        ".timeline-line",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".timeline-track",
            start: "top 75%",
            end: "bottom 70%",
            scrub: 0.7,
          },
        }
      );

      gsap.utils.toArray<HTMLElement>(".timeline-entry").forEach((entry) => {
        const direction = entry.dataset.side === "left" ? -36 : 36;

        gsap.from(entry, {
          x: direction,
          y: 16,
          duration: 0.25,
          ease: "power2.out",
          scrollTrigger: {
            trigger: entry,
            start: "top 95%",
            once: true,
          }
        });
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-black px-5 py-24 text-white sm:px-6 md:px-8 md:py-32 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.4em] text-gray-400">
          Archive Timeline
        </p>
        <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl lg:text-6xl">
          The journey through media.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 lg:text-base">
          The moments that expanded the archive, one new kind of media at a
          time.
        </p>

        <div className="timeline-track relative mt-12 sm:mt-20">
          <div className="absolute bottom-0 left-3 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2">
            <div className="timeline-line h-full w-full origin-top bg-white/60" />
          </div>

          <div className="space-y-10 md:space-y-6">
            {timelineEntries.map((entry, index) => {
              const isLeft = index % 2 === 0;

              return (
                <article
                  key={entry.year}
                  data-side={isLeft ? "left" : "right"}
                  className={`timeline-entry relative grid pl-12 md:min-h-40 md:grid-cols-2 md:pl-0 ${
                    isLeft ? "" : "md:text-left"
                  }`}
                >
                  <span className="absolute left-3 top-8 h-3 w-3 -translate-x-1/2 rounded-full border border-white/50 bg-black md:left-1/2" />

                  <div
                    className={`${
                      isLeft
                        ? "md:col-start-1 md:mr-12 md:text-right"
                        : "md:col-start-2 md:ml-12"
                    }`}
                  >
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.05] sm:p-7 lg:p-5">
                      <p className="text-sm font-medium tracking-[0.24em] text-gray-400">
                        {entry.year}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl lg:text-2xl">
                        {entry.title}
                      </h3>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
