import Image from "next/image";
import Link from "next/link";
import AboutSection from "./AboutSection";
import ArchiveTree from "./ArchiveTree";
import RandomStoryButton from "./RandomStoryButton";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90svh] overflow-hidden bg-black px-5 py-20 text-white sm:min-h-screen sm:px-8 sm:py-28 md:py-32 lg:py-20">
      <ArchiveTree />

      <div className="relative z-10 mx-auto max-w-[1320px] text-left">
        <div className="max-w-3xl lg:w-[50%] lg:-translate-x-3 lg:px-8 xl:-translate-x-5 xl:px-8">
          <p className="mb-5 text-sm uppercase tracking-[0.4em] text-pink-200">
            Welcome to
          </p>

          <h1 className="mb-6 text-5xl font-bold leading-none sm:text-6xl md:text-7xl lg:text-6xl">
            The Archive
          </h1>

          <p className="mb-7 max-w-2xl text-base text-gray-300 sm:mb-10 sm:text-lg md:text-xl lg:text-lg">
            A personal archive of the manga, manhwa, anime, web novels, and
            books that shaped my imagination.
          </p>

          <div className="mb-7 flex flex-wrap items-center gap-2.5 sm:mb-10 sm:gap-3">
            <RandomStoryButton
              showIcon
              className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/20 bg-black/30 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            />
            <Link
              href="/telegram"
              scroll={true}
              className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-red-400/60 bg-red-950/35 px-5 py-2.5 text-sm font-semibold lowercase text-red-100 shadow-[0_0_24px_rgba(220,38,38,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-950/55 hover:shadow-[0_0_28px_rgba(239,68,68,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200/70"
            >
              <Image
                src="/images/icons/berserk-sacrifice-icon.png"
                alt=""
                width={18}
                height={18}
                className="h-[1.125rem] w-[1.125rem] object-contain transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              />
              telegram
            </Link>
          </div>

          <div className="grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4 lg:gap-3">
            {[
              ["100+", "Entries"],
              ["5", "Categories"],
              ["10+", "Years"],
              ["\u221e", "Worlds"],
            ].map(([number, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur sm:p-5 lg:p-3.5"
              >
                <h2 className="text-3xl font-bold lg:text-2xl">{number}</h2>
                <p className="text-gray-400 lg:text-sm">{label}</p>
              </div>
            ))}
          </div>
          <AboutSection />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[5] h-40 bg-gradient-to-b from-transparent via-black/70 to-black" />
    </section>
  );
}
