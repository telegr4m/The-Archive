import type { Metadata } from "next";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import TelegramEntryGate from "../components/TelegramEntryGate";
import TelegramFloatingCards, {
  type TelegramFavoriteWork,
} from "../components/TelegramFloatingCards";
import TelegramMusicPlayer, {
  type TelegramSong,
} from "../components/TelegramMusicPlayer";
import TelegramProfileImage from "../components/TelegramProfileImage";
import { profileGames } from "../data/profileGames";

export const metadata: Metadata = {
  title: "telegram | The Archive",
  description: "A cinematic personal profile for telegram.",
};

const favoriteWorks: TelegramFavoriteWork[] = [
  {
    title: "Attack on Titan",
    quote: "Our lives have meaning because we give them meaning.",
    author: "Erwin Smith",
    imagePath: "/images/favorites/attack-on-titan.jpg",
    imagePosition: "center",
  },
  {
    title: "Berserk",
    quote:
      "If you're always worried about crushing the ants beneath you, you won't be able to walk.",
    author: "Guts",
    imagePath: "/images/favorites/berserk.jpg",
    imagePosition: "center 48%",
  },
  {
    title: "A Regressor's Tale of Cultivation",
    quote:
      "Immortal Cultivation is repentant enlightenment. Like tiny grains of salt gathering to form the sea. Build mountains through repentant enlightenment. Building a mountain of salt is perhaps the fastest way to reach the heavens.",
    author: "Salt Sea Supreme Deity",
    imagePath: "/images/favorites/regressors-tale-of-cultivation.jpg",
    imagePosition: "center 38%",
  },
];

// Add or reorder local tracks here. Audio files live in public/audio/telegram.
const telegramSongs: TelegramSong[] = [
  { src: "/audio/telegram/blame.mp3" },
  { src: "/audio/telegram/cachalot.mp3" },
  { src: "/audio/telegram/country.mp3" },
  { src: "/audio/telegram/de_survivor.mp3" },
  { src: "/audio/telegram/Easter Pink.mp3" },
  { src: "/audio/telegram/Night, Blooming Jasmine..mp3" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/linuxluv3r" },
  { label: "Discord", href: "https://discord.com/users/1025596438144626738" },
  { label: "GitHub", href: "https://github.com/telegr4m" },
];

export default function TelegramProfilePage() {
  const artworkPaths = getTelegramArtworkPaths();

  return (
    <main className="relative h-[100svh] overflow-y-auto bg-black text-white">
      <video
        className="fixed inset-0 h-full w-full object-cover object-[center_65%]"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/telegram-profile-bg.mp4" type="video/mp4" />
      </video>

      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div
        className="fixed inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(127,29,29,0.16),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,0.16),rgba(0,0,0,0.78))]"
        aria-hidden="true"
      />
      <TelegramEntryGate />

      <div className="relative z-10 min-h-full w-full px-5 pb-6 pt-20 sm:px-8 sm:pb-8 lg:px-10 lg:pb-5 lg:pt-16 xl:px-12">
        <header className="flex max-w-2xl items-center gap-5 sm:gap-6">
          <div className="w-28 shrink-0 sm:w-36">
            <TelegramProfileImage />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.32em] text-[#963636]">
              Personal Profile
            </p>
            <h1 className="mt-1 bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text pb-1 text-4xl font-bold leading-[1.18] tracking-tight text-transparent [text-shadow:0_1px_12px_rgba(255,255,255,0.08)] sm:text-5xl">
              telegram
            </h1>
            <div className="mt-2 min-h-5 max-w-md" data-profile-copy-slot />
            <div className="mt-2 flex items-center gap-2" aria-label="Social links">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="group inline-flex size-10 items-center justify-center rounded-full border border-red-900/45 bg-black/35 text-gray-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/45 hover:bg-red-950/20 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60 sm:size-8"
                >
                  <TelegramSocialIcon label={link.label} />
                </a>
              ))}
            </div>
            <Link
              href="/"
              scroll={true}
              className="mt-2 inline-flex min-h-10 w-fit items-center rounded-full border border-white/15 bg-black/30 px-3.5 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-red-300/45 hover:text-red-200 sm:min-h-9"
            >
              Return to The Archive
            </Link>
          </div>
        </header>

        <div className="mt-4 flex justify-center lg:fixed lg:right-10 lg:top-14 lg:z-20 lg:mt-0 lg:justify-end xl:right-12">
          <TelegramMusicPlayer
            songs={telegramSongs}
            artworkPaths={artworkPaths}
          />
        </div>

        <TelegramFloatingCards favorites={favoriteWorks} games={profileGames} />
      </div>
    </main>
  );
}

function getTelegramArtworkPaths() {
  const artworkDirectory = join(process.cwd(), "public", "images", "music");

  try {
    return readdirSync(artworkDirectory, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() && /\.(?:jpe?g|png|webp)$/i.test(entry.name)
      )
      .map((entry) => `/images/music/${encodeURIComponent(entry.name)}`);
  } catch {
    return [];
  }
}

function TelegramSocialIcon({ label }: { label: string }) {
  const className =
    "size-4 stroke-[1.7] transition-transform duration-300 group-hover:scale-105";

  if (label === "GitHub") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.5A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1 0S17.9-.4 15 1.5a13.4 13.4 0 0 0-6 0C6.1-.4 4.9 0 4.9 0a5.4 5.4 0 0 0-.2 3A5.8 5.8 0 0 0 3.2 7c0 5.9 3.5 7.1 6.8 7.5A4.8 4.8 0 0 0 9 18v4m0-3c-3 .9-3-1.5-4.2-2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (label === "Instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.7 5.3A18.4 18.4 0 0 0 15.2 4l-.6 1.2a16.7 16.7 0 0 0-5.2 0L8.8 4a18.5 18.5 0 0 0-4.5 1.3C1.5 9.5.7 13.5 1.1 17.4a18.2 18.2 0 0 0 5.5 2.8l1.3-1.8a11.7 11.7 0 0 1-2.1-1l.5-.4c4 1.8 8.4 1.8 12.3 0l.6.4c-.7.4-1.4.7-2.1 1l1.3 1.8a18.2 18.2 0 0 0 5.5-2.8c.5-4.5-.8-8.4-4.2-12.1ZM8.4 15.1c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7.2 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
    </svg>
  );
}
