"use client";

export default function ArchiveTree() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-80 [object-position:65%_center] sm:object-center"
      >
        <source src="/videos/bg-hero.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent sm:from-black/70 sm:via-black/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
    </div>
  );
}
