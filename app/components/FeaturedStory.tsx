"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  archiveItems,
  getArchiveItemHref,
} from "../data/archiveItems";
import { getArchiveCardDescription } from "../data/archivePresentation";

const ROTATION_INTERVAL = 5000;

export default function FeaturedStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const featuredItems = useMemo(
    () => archiveItems.filter((item) => item.featured),
    []
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [missingImage, setMissingImage] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const activeItem = featuredItems[activeIndex];

  useEffect(() => {
    if (featuredItems.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % featuredItems.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(interval);
  }, [featuredItems.length]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current || !imageRef.current || !contentRef.current) return;

    const context = gsap.context(() => {
      gsap.from(imageRef.current, {
        scale: 0.98,
        duration: 0.25,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 95%",
          once: true,
        }
      });
      gsap.from(contentRef.current?.children ?? [], {
        y: 12,
        duration: 0.25,
        stagger: 0.03,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 95%",
          once: true,
        }
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!imageRef.current || !contentRef.current) return;

    gsap.fromTo(
      [imageRef.current, ...Array.from(contentRef.current.children)],
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.04, ease: "power2.out" }
    );
  }, [activeIndex]);

  if (!activeItem) return null;

  return (
    <section ref={sectionRef} className="bg-black px-5 py-20 text-white sm:px-6 md:px-8 md:py-28 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
        <div
          ref={imageRef}
          className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.04] sm:aspect-[3/4]"
        >
          {missingImage === activeItem.image ? (
            <div className="flex h-full items-center justify-center bg-black px-8 text-center text-sm uppercase tracking-[0.25em] text-gray-500">
              Cover missing: {activeItem.image.split("/").at(-1)}
            </div>
          ) : (
            <>
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-neutral-950 transition-opacity duration-500 ${
                  loadedImage === activeItem.image
                    ? "opacity-0"
                    : "animate-pulse opacity-100"
                }`}
              />
              <Image
                fill
                loading="lazy"
                src={activeItem.image}
                alt={`${activeItem.title} cover`}
                sizes="(min-width: 1024px) 38vw, 100vw"
                className={`object-cover object-top transition-[opacity,transform] duration-[1200ms] hover:scale-[1.015] ${
                  loadedImage === activeItem.image ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  objectPosition:
                    activeItem.featuredImagePosition ?? "center top",
                }}
                onLoad={() => setLoadedImage(activeItem.image)}
                onError={() => setMissingImage(activeItem.image)}
              />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/35" />
        </div>

        <div
          ref={contentRef}
          className="flex flex-col justify-center p-6 sm:p-12 lg:p-10"
        >
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
            Featured Entry | {activeItem.category}
          </p>
          <h2 className="mt-5 break-words text-4xl font-bold tracking-tight sm:text-6xl lg:text-5xl">
            {activeItem.title}
          </h2>
          <p className="mt-6 line-clamp-2 overflow-hidden text-ellipsis text-base leading-8 text-gray-300 sm:text-lg">
            {getArchiveCardDescription(activeItem)}
          </p>
          <div className="mt-6 flex max-h-16 flex-wrap gap-2 overflow-hidden sm:mt-8 sm:max-h-none">
            {activeItem.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-gray-400"
              >
                {genre}
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-5 sm:mt-10">
            <Link
              href={getArchiveItemHref(activeItem)}
              scroll={true}
              className="group inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-sm font-medium transition-all duration-300 hover:border-white/50 hover:bg-white hover:text-black"
            >
              Explore Entry
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                -&gt;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
