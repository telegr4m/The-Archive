export default function AboutSection() {
  return (
    <section
      className="mt-9 max-w-3xl border-t border-white/10 pt-8 text-left text-white sm:mt-12 sm:pt-10 md:mt-14 md:pt-12 lg:mt-8 lg:pt-7"
      aria-labelledby="about-archive-title"
    >
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gray-400">
        About the Archive
      </p>

      <h2
        id="about-archive-title"
        className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-2xl"
      >
        A collection of worlds, characters, and unforgettable works.
      </h2>

      <div className="mt-5 space-y-3 text-sm leading-relaxed text-gray-300 sm:mt-6 sm:space-y-4 sm:text-base md:text-lg lg:mt-4 lg:space-y-2.5 lg:text-sm">
        <p>
          The Archive is a personal digital library of the manga, manhwa,
          anime, web novels, and physical books that have shaped my imagination
          over the years.
        </p>

        <p>
          Instead of being just a list, this archive highlights the entries
          that stayed with me, the characters I connected with, and the worlds I
          kept coming back to.
        </p>
      </div>
    </section>
  );
}
