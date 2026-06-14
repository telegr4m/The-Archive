"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const links = [
  { label: "Home", href: "/" },
  { label: "Manga", href: "/manga" },
  { label: "Manhwa", href: "/manhwa" },
  { label: "Anime", href: "/anime" },
  { label: "Web Novels", href: "/web-novels" },
  { label: "Books", href: "/books" },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!footerRef.current) return;

    const context = gsap.context(() => {
      gsap.from(".footer-content", {
        y: 16,
        duration: 0.25,
        ease: "power2.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 95%",
          once: true,
        }
      });
    }, footerRef);

    const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, [pathname]);

  return (
    <footer
      ref={footerRef}
      className="mt-auto border-t border-white/10 bg-black px-6 py-12 text-white md:px-10 md:py-16"
    >
      <div className="footer-content mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="max-w-md">
            <Link
              href="/"
              scroll={true}
              className="text-sm font-semibold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:text-gray-300 sm:text-base"
            >
              The Archive
            </Link>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              A personal archive of media, worlds, and characters.
            </p>
          </div>

          <nav
            className="grid w-full grid-cols-1 gap-x-8 gap-y-3 text-left text-sm sm:max-w-lg sm:grid-cols-[repeat(3,minmax(0,1fr))] md:w-[30rem]"
            aria-label="Footer navigation"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                scroll={true}
                className="min-w-0 text-left text-gray-400 transition-colors duration-300 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} The Archive. All featured works remain
            with their original creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
