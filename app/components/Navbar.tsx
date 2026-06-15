"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const links = [
  { label: "Home", href: "/" },
  { label: "Manga", href: "/manga" },
  { label: "Manhwa", href: "/manhwa" },
  { label: "Anime", href: "/anime" },
  { label: "Web Novels", href: "/web-novels" },
  { label: "Books", href: "/books" },
];

export default function Navbar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!navRef.current) return;

    const animation = gsap.fromTo(
      navRef.current,
      { autoAlpha: 0, y: -24 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    return () => {
      animation.kill();
    };
  }, []);

  return (
    <header
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 w-full bg-transparent opacity-0"
    >
      <nav
        className="flex w-full items-center justify-between px-5 py-4 [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] sm:px-7 lg:px-8 lg:py-2.5 xl:px-10"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          scroll={true}
          className="relative z-10 shrink-0 text-sm font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:text-purple-200 sm:text-base"
          onClick={() => setIsOpen(false)}
        >
          The Archive
        </Link>

        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                scroll={true}
                className={`group relative flex min-h-10 items-center text-sm font-medium tracking-[0.015em] transition-colors duration-300 ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-100"
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-0 bottom-0 h-px origin-left bg-purple-200 transition-transform duration-300 ease-out ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
          <SearchLink isActive={pathname === "/search"} />
        </div>

        <div className="relative z-10 lg:hidden">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-white transition-colors hover:text-purple-200"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
            <span className="flex w-4 flex-col gap-1.5">
              <span
                className={`h-px w-full bg-current transition-transform duration-300 ${
                  isOpen ? "translate-y-[3.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`h-px w-full bg-current transition-transform duration-300 ${
                  isOpen ? "-translate-y-[3.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={`overflow-hidden bg-black/95 [text-shadow:0_2px_12px_rgba(0,0,0,0.95)] transition-[max-height,opacity] duration-300 lg:hidden ${
          isOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid gap-1 px-5 py-4 sm:px-7">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                scroll={true}
                className={`rounded-xl px-4 py-3.5 text-[0.95rem] font-medium tracking-[0.015em] transition-colors duration-300 ${
                  isActive
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <SearchLink
            isActive={pathname === "/search"}
            onClick={() => setIsOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}

function SearchLink({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/search"
      scroll={true}
      aria-label="Search"
      onClick={onClick}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 hover:text-white ${
        isActive ? "text-white" : "text-gray-400"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" strokeLinecap="round" />
      </svg>
      <span
        className={`absolute bottom-0 h-px w-5 bg-purple-200 transition-transform duration-300 ${
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}
