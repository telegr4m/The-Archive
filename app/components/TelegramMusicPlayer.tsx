"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./TelegramMusicPlayer.module.css";

export type TelegramSong = {
  src: string;
};

type MusicNotification = {
  heading: string;
  title: string;
};

type TelegramMusicPlayerProps = {
  songs: TelegramSong[];
  artworkPaths: string[];
};

export default function TelegramMusicPlayer({
  songs,
  artworkPaths,
}: TelegramMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef(15);
  const hasEnteredRef = useRef(false);
  const hasPlayedRef = useRef(false);
  const resumeRequestedRef = useRef(false);
  const suppressPauseNotificationRef = useRef(false);
  const suppressPlayNotificationRef = useRef(false);
  const notificationTimersRef = useRef<number[]>([]);
  const fadeFrameRef = useRef<number | null>(null);
  const fadeResolveRef = useRef<(() => void) | null>(null);
  const transitionRef = useRef(false);
  const shouldFadeInRef = useRef(false);
  const [playlist, setPlaylist] = useState<TelegramSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(15);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isArtworkChanging, setIsArtworkChanging] = useState(false);
  const [notification, setNotification] =
    useState<MusicNotification | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const currentSong = playlist[currentIndex];
  const currentTitle = currentSong ? getSongTitle(currentSong.src) : "";

  const cancelActiveFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      window.cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
    fadeResolveRef.current?.();
    fadeResolveRef.current = null;
  }, []);

  const fadeAudio = useCallback(
    (audio: HTMLAudioElement, target: number, durationMs: number) => {
      cancelActiveFade();

      const startVolume = clampVolume(audio.volume);
      const safeTarget = clampVolume(target);
      const startedAt = performance.now();
      const safeDuration = Math.max(durationMs, 1);

      return new Promise<void>((resolve) => {
        fadeResolveRef.current = resolve;

        const tick = (now: number) => {
          const progress = Math.min(
            Math.max((now - startedAt) / safeDuration, 0),
            1
          );
          const nextVolume =
            startVolume + (safeTarget - startVolume) * progress;
          audio.volume = clampVolume(nextVolume);

          if (progress < 1) {
            fadeFrameRef.current = window.requestAnimationFrame(tick);
            return;
          }

          fadeFrameRef.current = null;
          fadeResolveRef.current = null;
          resolve();
        };

        fadeFrameRef.current = window.requestAnimationFrame(tick);
      });
    },
    [cancelActiveFade]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPlaylist(shuffleSongs(songs));
      setCurrentIndex(0);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [songs]);

  useEffect(() => {
    return () => {
      notificationTimersRef.current.forEach((timer) =>
        window.clearTimeout(timer)
      );
      if (fadeFrameRef.current !== null) {
        window.cancelAnimationFrame(fadeFrameRef.current);
      }
      fadeResolveRef.current?.();
    };
  }, []);

  useEffect(() => {
    const handleEntry = () => {
      hasEnteredRef.current = true;

      const audio = audioRef.current;
      if (!audio) return;

      setHasError(false);
      audio.volume = clampVolume(volumeRef.current / 100);
      audio.muted = volumeRef.current === 0;
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
    };

    window.addEventListener("telegram:entered", handleEntry);
    return () => window.removeEventListener("telegram:entered", handleEntry);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    audio.volume = clampVolume(
      shouldFadeInRef.current ? 0 : volumeRef.current / 100
    );
    audio.muted = volumeRef.current === 0;
    setHasError(false);
    audio.load();
    if (hasEnteredRef.current) {
      void audio
        .play()
        .then(async () => {
          if (shouldFadeInRef.current) {
            shouldFadeInRef.current = false;
            await fadeAudio(audio, volumeRef.current / 100, 550);
          }
        })
        .catch(() => setIsPlaying(false))
        .finally(() => {
          if (audio.paused && shouldFadeInRef.current) {
            shouldFadeInRef.current = false;
            audio.volume = clampVolume(volumeRef.current / 100);
          }
          transitionRef.current = false;
        });
    } else {
      transitionRef.current = false;
    }
  }, [currentSong, fadeAudio]);

  if (!currentSong) return null;

  async function changeSong(direction: -1 | 1, fromEnded = false) {
    if (playlist.length === 0 || transitionRef.current) return;

    transitionRef.current = true;
    setIsArtworkChanging(true);

    const audio = audioRef.current;
    if (!fromEnded && audio && !audio.paused) {
      await fadeAudio(audio, 0, 450);
    }

    const nextIndex =
      (currentIndex + direction + playlist.length) % playlist.length;
    const nextSong = playlist[nextIndex];

    suppressPauseNotificationRef.current = true;
    suppressPlayNotificationRef.current = true;
    resumeRequestedRef.current = false;
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    shouldFadeInRef.current = hasEnteredRef.current;
    setCurrentIndex(nextIndex);
    window.setTimeout(() => setIsArtworkChanging(false), 40);

    if (nextSong) showNotification("Now Playing", getSongTitle(nextSong.src));
  }

  function changeVolume(nextVolume: number) {
    const audio = audioRef.current;

    volumeRef.current = nextVolume;
    setVolume(nextVolume);

    if (audio) {
      cancelActiveFade();
      audio.volume = clampVolume(nextVolume / 100);
      audio.muted = nextVolume === 0;
    }
  }

  function seekTo(progress: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const seekDuration = Number.isFinite(audio.duration)
      ? audio.duration
      : duration;
    if (seekDuration <= 0) return;

    const nextTime = (Math.min(100, Math.max(0, progress)) / 100) * seekDuration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function seekFromPointer(event: React.PointerEvent<HTMLInputElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;

    seekTo(((event.clientX - bounds.left) / bounds.width) * 100);
  }

  function beginSeeking(event: React.PointerEvent<HTMLInputElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event);
  }

  function continueSeeking(event: React.PointerEvent<HTMLInputElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

    event.preventDefault();
    seekFromPointer(event);
  }

  function finishSeeking(event: React.PointerEvent<HTMLInputElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

    event.preventDefault();
    seekFromPointer(event);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      hasEnteredRef.current = true;
      resumeRequestedRef.current = true;
      setHasError(false);
      try {
        await audio.play();
      } catch {
        resumeRequestedRef.current = false;
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  }

  function showNotification(heading: string, title: string) {
    notificationTimersRef.current.forEach((timer) =>
      window.clearTimeout(timer)
    );
    notificationTimersRef.current = [];

    setNotificationVisible(false);
    setNotification({ heading, title });

    notificationTimersRef.current.push(
      window.setTimeout(() => setNotificationVisible(true), 20),
      window.setTimeout(() => setNotificationVisible(false), 2700),
      window.setTimeout(() => setNotification(null), 3100)
    );
  }

  return (
    <>
      <div
        className="relative isolate w-full max-w-xs rounded-2xl border border-red-400/20 bg-black/55 p-3 shadow-xl shadow-black/35 backdrop-blur-xl sm:w-80"
        style={
          {
            "--track-accent": getTrackAccent(currentSong.src),
          } as CSSProperties
        }
      >
      <span
        aria-hidden="true"
        className={`${styles.playerGlow} pointer-events-none absolute -inset-3 -z-10 rounded-[1.4rem]`}
      />
      <audio
        ref={audioRef}
        src={currentSong.src}
        preload="metadata"
        onPlay={() => {
          setIsPlaying(true);
          suppressPauseNotificationRef.current = false;

          if (suppressPlayNotificationRef.current) {
            suppressPlayNotificationRef.current = false;
            hasPlayedRef.current = true;
            return;
          }

          showNotification(
            resumeRequestedRef.current || hasPlayedRef.current
              ? "Music Resumed"
              : "Now Playing",
            currentTitle
          );
          resumeRequestedRef.current = false;
          hasPlayedRef.current = true;
        }}
        onPause={(event) => {
          setIsPlaying(false);

          if (suppressPauseNotificationRef.current) {
            suppressPauseNotificationRef.current = false;
            return;
          }

          if (hasPlayedRef.current && !event.currentTarget.ended) {
            showNotification("Music Paused", currentTitle);
          }
        }}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
          setCurrentTime(0);
        }}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => void changeSong(1, true)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          if (process.env.NODE_ENV === "development") {
            console.warn(`[telegram music] Failed to load: ${currentSong.src}`);
          }
        }}
      />

      <div className="flex items-center gap-3">
        <SongArtwork
          key={currentSong.src}
          songSrc={currentSong.src}
          title={currentTitle}
          artworkPaths={artworkPaths}
          isTransitioning={isArtworkChanging}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-[#963636]">
            Now playing
          </p>
          <p className="mt-1 truncate text-xs font-medium text-gray-200">
            {currentTitle}
          </p>
          {hasError && (
            <p className="mt-1 text-[0.6rem] text-red-300/70" role="alert">
              This local audio file could not be loaded.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <PlayerButton label="Previous song" onClick={() => void changeSong(-1)}>
            <path d="M6 5v14M18 6l-9 6 9 6V6Z" />
          </PlayerButton>
          <PlayerButton
            label={isPlaying ? "Pause" : "Play"}
            emphasized
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <>
                <path d="M9 7v10M15 7v10" />
              </>
            ) : (
              <path d="m9 6 9 6-9 6V6Z" />
            )}
          </PlayerButton>
          <PlayerButton label="Next song" onClick={() => void changeSong(1)}>
            <path d="M18 5v14M6 6l9 6-9 6V6Z" />
          </PlayerButton>
        </div>
      </div>

      <div className="mt-2.5 border-t border-white/10 pt-2.5">
        <div className="text-[0.6rem] tabular-nums text-gray-500">
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={duration > 0 ? (currentTime / duration) * 100 : 0}
          aria-label="Song progress"
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          onChange={(event) => seekTo(Number(event.target.value))}
          onPointerDown={beginSeeking}
          onPointerMove={continueSeeking}
          onPointerUp={finishSeeking}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          className="mt-0.5 h-11 w-full cursor-pointer touch-none appearance-none rounded-full sm:mt-1 sm:h-5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#a62a2a] sm:[&::-moz-range-thumb]:h-3 sm:[&::-moz-range-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#a62a2a] sm:[&::-webkit-slider-thumb]:h-3 sm:[&::-webkit-slider-thumb]:w-3"
          style={{
            background: `linear-gradient(to right, #8f1515 0%, #8f1515 ${
              duration > 0 ? (currentTime / duration) * 100 : 0
            }%, rgba(255,255,255,0.15) ${
              duration > 0 ? (currentTime / duration) * 100 : 0
            }%, rgba(255,255,255,0.15) 100%) center / 100% 4px no-repeat`,
          }}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center text-[#963636]"
          aria-hidden="true"
        >
          <SpeakerIcon muted={volume === 0} />
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volume}
          aria-label="Site audio volume"
          aria-valuetext={`${volume}%`}
          title="Controls site audio volume"
          onChange={(event) => changeVolume(Number(event.target.value))}
          className="h-11 min-w-0 flex-1 cursor-pointer appearance-none rounded-full sm:h-5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#a62a2a] sm:[&::-moz-range-thumb]:h-3 sm:[&::-moz-range-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#a62a2a] sm:[&::-webkit-slider-thumb]:h-3 sm:[&::-webkit-slider-thumb]:w-3"
          style={{
            background: `linear-gradient(to right, #8f1515 0%, #8f1515 ${volume}%, rgba(255,255,255,0.15) ${volume}%, rgba(255,255,255,0.15) 100%) center / 100% 4px no-repeat`,
          }}
        />
        <span className="w-7 text-right text-[0.6rem] tabular-nums text-gray-500">
          {volume}%
        </span>
      </div>

      </div>

      {notification && (
        <div
          className={`pointer-events-none fixed bottom-6 right-6 z-[90] w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-[#7f1d1d]/50 bg-black/85 px-3 py-2.5 shadow-[0_0_24px_rgba(127,29,29,0.18)] backdrop-blur-xl transition-all duration-300 ${
            notificationVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-[calc(100%+3rem)] opacity-0"
          }`}
          role="status"
          aria-live="polite"
        >
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-[#9f3636]">
            {notification.heading}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-gray-200">
            {notification.title}
          </p>
        </div>
      )}
    </>
  );
}

function shuffleSongs(songs: TelegramSong[]) {
  const shuffled = [...songs];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getSongTitle(src: string) {
  const filename = getAudioFilename(src);
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\.+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "Untitled track";
}

function getAudioFilename(src: string) {
  let filename = src.split("/").at(-1) ?? src;

  try {
    filename = decodeURIComponent(filename);
  } catch {
    // Keep the literal filename if it contains malformed URL characters.
  }

  return filename;
}

function SongArtwork({
  songSrc,
  title,
  artworkPaths,
  isTransitioning,
}: {
  songSrc: string;
  title: string;
  artworkPaths: string[];
  isTransitioning: boolean;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const filename = getAudioFilename(songSrc);
  const songBase = filename.replace(/\.[^.]+$/, "");
  const normalizedSongBase = normalizeArtworkBase(songBase);
  const candidates = useMemo(
    () =>
      artworkPaths
        .filter((path) => {
          const artworkFilename = getAudioFilename(path);
          const artworkBase = artworkFilename.replace(/\.[^.]+$/, "");
          return normalizeArtworkBase(artworkBase) === normalizedSongBase;
        })
        .sort(
          (left, right) =>
            getArtworkExtensionPriority(left) -
            getArtworkExtensionPriority(right)
        ),
    [artworkPaths, normalizedSongBase]
  );
  const artworkSrc = candidates[candidateIndex];

  return (
    <div
      className={`${styles.artwork} relative size-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-red-950/30 via-zinc-950 to-black shadow-inner shadow-black/60 ${
        isTransitioning ? styles.artworkChanging : ""
      }`}
    >
      {artworkSrc ? (
        <Image
          src={artworkSrc}
          alt={`${title} artwork`}
          fill
          unoptimized
          sizes="48px"
          className="object-cover"
          onError={() => {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `[telegram music artwork] Failed to load candidate: ${artworkSrc}`
              );
            }
            setCandidateIndex((index) => index + 1);
          }}
        />
      ) : (
        <span
          aria-label="Artwork unavailable"
          className="flex h-full w-full items-center justify-center text-lg text-red-900/70"
        >
          &#9835;
        </span>
      )}
    </div>
  );
}

function normalizeArtworkBase(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/\.+$/, "");
}

function getArtworkExtensionPriority(path: string) {
  const extension = path.split(".").at(-1)?.toLowerCase();
  return ["webp", "jpg", "jpeg", "png"].indexOf(extension ?? "");
}

function getTrackAccent(src: string) {
  const track = normalizeArtworkBase(
    getAudioFilename(src).replace(/\.[^.]+$/, "")
  );
  const accents: Record<string, string> = {
    blame: "#7f1d1d",
    cachalot: "#7c2d12",
    country: "#854d0e",
    "de-survivor": "#991b1b",
    "easter-pink": "#9d174d",
    "night,-blooming-jasmine": "#5b214d",
  };

  return accents[track] ?? "#7f1d1d";
}

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
      {muted ? (
        <path d="m16 10 4 4m0-4-4 4" />
      ) : (
        <>
          <path d="M16 9.5a4 4 0 0 1 0 5" />
          <path d="M18.5 7a7 7 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

function PlayerButton({
  children,
  emphasized = false,
  label,
  onClick,
}: {
  children: React.ReactNode;
  emphasized?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 sm:h-9 sm:w-9 ${
        emphasized
          ? "border-red-400/40 bg-red-950/45 text-red-200 hover:border-red-300/70"
          : "border-white/10 text-gray-400 hover:border-white/25 hover:text-white"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
