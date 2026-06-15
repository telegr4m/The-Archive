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

const contactLinks = [
  { label: "Instagram", href: "https://www.instagram.com/linuxluv3r" },
  { label: "Discord", href: "https://discord.com/users/1025596438144626738" },
  { label: "GitHub", href: "https://github.com/telegr4m" },
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
      className="mt-auto border-t border-white/10 bg-black px-5 py-10 text-white sm:px-6 sm:py-12 md:px-10 md:py-16 lg:py-10"
    >
      <div className="footer-content mx-auto max-w-5xl">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-start">
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
            className="grid w-full grid-cols-1 gap-x-8 gap-y-3 text-left text-sm sm:max-w-lg sm:grid-cols-[repeat(3,minmax(0,1fr))] lg:w-[27rem]"
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

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
              Connect
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {contactLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="group inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-gray-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <SocialIcon label={link.label} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 sm:mt-12">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} The Archive. All featured works remain
            with their original creators.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ label }: { label: string }) {
  const className =
    "size-5 stroke-[1.7] transition-transform duration-300 group-hover:scale-105";

  if (label === "GitHub") {
    return <GitHubIcon className={className} />;
  }

  if (label === "Instagram") {
    return <InstagramIcon className={className} />;
  }

  return <DiscordIcon className={className} />;
}

function GitHubIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.5A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1 0S17.9-.4 15 1.5a13.4 13.4 0 0 0-6 0C6.1-.4 4.9 0 4.9 0a5.4 5.4 0 0 0-.2 3A5.8 5.8 0 0 0 3.2 7c0 5.9 3.5 7.1 6.8 7.5A4.8 4.8 0 0 0 9 18v4m0-3c-3 .9-3-1.5-4.2-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DiscordIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M8.6 7.6a8.3 8.3 0 0 1 6.8 0m-8.9 8.7c3.7 1.7 7.3 1.7 11 0m-9.3-1.8h.01m7.58 0h.01M8 5.9 6.5 6.5C4.8 9 4.2 11.6 4.4 14.2c1.1 1.7 2.6 3 4.4 3.8l1.1-1.5m6.1-10.6 1.5.6c1.7 2.5 2.3 5.1 2.1 7.7a10 10 0 0 1-4.4 3.8l-1.1-1.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="14.5" r=".85" fill="currentColor" />
      <circle cx="15.8" cy="14.5" r=".85" fill="currentColor" />
    </svg>
  );
}
