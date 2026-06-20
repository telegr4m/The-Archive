"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import ProfileGameCover from "./ProfileGameCover";
import TelegramFavoriteImage from "./TelegramFavoriteImage";
import styles from "./TelegramFloatingCards.module.css";

export type TelegramFavoriteWork = {
  title: string;
  quote: string;
  author: string;
  imagePath: string;
  imagePosition?: string;
};

type TelegramGame = {
  title: string;
  imagePath: string;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
};

export default function TelegramFloatingCards({
  favorites,
  games,
}: {
  favorites: TelegramFavoriteWork[];
  games: TelegramGame[];
}) {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const handleEntry = () => setHasEntered(true);
    window.addEventListener("telegram:entered", handleEntry);
    return () => window.removeEventListener("telegram:entered", handleEntry);
  }, []);

  return (
    <>
      <div className="mt-4 grid gap-3 lg:hidden">
        {favorites.map((work, index) => (
          <div
            key={work.title}
            className={`${styles.mobileEntrance} ${hasEntered ? styles.entered : ""}`}
            style={
              {
                "--entrance-delay": `${400 + index * 90}ms`,
              } as CSSProperties
            }
          >
            <FavoriteCard work={work} mobile />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {games.map((game, index) => (
            <div
              key={game.title}
              className={`${styles.mobileEntrance} ${hasEntered ? styles.entered : ""}`}
              style={
                {
                  "--entrance-delay": `${670 + index * 70}ms`,
                } as CSSProperties
              }
            >
              <GameCard game={game} mobile />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-3 hidden h-[34rem] w-full lg:block">
        {favorites.map((work, index) => (
          <FloatingCard
            key={work.title}
            side="left"
            top={index * 184}
            entered={hasEntered}
            index={index}
          >
            <FavoriteCard work={work} />
          </FloatingCard>
        ))}

        {games.map((game, index) => (
          <FloatingCard
            key={game.title}
            side="right"
            top={index * 72}
            entered={hasEntered}
            index={index + favorites.length}
          >
            <GameCard game={game} />
          </FloatingCard>
        ))}
      </div>
    </>
  );
}

function FloatingCard({
  side,
  top,
  entered,
  index,
  children,
}: {
  side: "left" | "right";
  top: number;
  entered: boolean;
  index: number;
  children: React.ReactNode;
}) {
  const entranceStyle = {
    "--entrance-x":
      side === "left"
        ? "calc((100vw - 36rem) / 2)"
        : "calc((100vw - 18rem) / -2)",
    "--entrance-y": `${-72 - top}px`,
    "--entrance-delay": `${450 + index * 85}ms`,
  } as CSSProperties;

  return (
    <article
      className={`${styles.entrance} ${entered ? styles.entered : ""} absolute`}
      style={{
        top,
        left: side === "left" ? 0 : undefined,
        right: side === "right" ? 0 : undefined,
        ...entranceStyle,
      }}
    >
      {children}
    </article>
  );
}

function FavoriteCard({
  work,
  mobile = false,
}: {
  work: TelegramFavoriteWork;
  mobile?: boolean;
}) {
  return (
    <div
      className={`grid max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-xl shadow-black/35 backdrop-blur-xl transition-colors duration-300 hover:border-red-300/25 ${
        mobile
          ? "min-h-52 w-full grid-cols-[minmax(0,1fr)_7rem]"
          : "h-44 w-[36rem] grid-cols-[minmax(0,1fr)_8.5rem]"
      }`}
    >
      <div className="flex min-w-0 flex-col p-3.5">
        <h3 className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text pb-0.5 text-lg font-semibold leading-7 text-transparent [text-shadow:0_1px_8px_rgba(255,255,255,0.06)]">
          {work.title}
        </h3>
        <blockquote className="mt-2 text-xs leading-[1.1rem] text-[#b52323]">
          <span className="text-[#8f1515]">&ldquo;</span>
          {work.quote}
          <span className="text-[#8f1515]">&rdquo;</span>
        </blockquote>
        <p className="mt-auto pt-2 text-[0.56rem] font-medium uppercase tracking-[0.13em] text-gray-500">
          - {work.author}
        </p>
      </div>
      <div className="relative min-h-full overflow-hidden border-l border-white/10 bg-gradient-to-b from-red-950/40 to-black/70">
        <TelegramFavoriteImage
          title={work.title}
          imagePath={work.imagePath}
          imagePosition={work.imagePosition}
        />
      </div>
    </div>
  );
}

function GameCard({ game, mobile = false }: { game: TelegramGame; mobile?: boolean }) {
  return (
    <div
      className={`group overflow-hidden rounded-xl border border-white/10 bg-black/45 shadow-lg shadow-black/25 backdrop-blur-xl transition-colors duration-300 hover:border-red-400/30 ${
        mobile
          ? "grid min-h-24 grid-rows-[4.5rem_auto]"
          : "grid h-[4.15rem] w-72 grid-cols-[6rem_minmax(0,1fr)]"
      }`}
    >
      <div className="relative min-h-full overflow-hidden border-white/10 max-lg:border-b lg:border-r">
        <ProfileGameCover
          title={game.title}
          imagePath={game.imagePath}
          imageFit={game.imageFit}
          imagePosition={game.imagePosition}
        />
      </div>
      <h3 className="flex min-w-0 items-center truncate px-3 py-2 text-sm font-medium leading-4 text-gray-300">
        {game.title}
      </h3>
    </div>
  );
}
