export default function AboutSection() {
  return (
    <section
      className="mt-12 max-w-3xl border-t border-white/10 pt-10 text-left text-white md:mt-14 md:pt-12"
      aria-labelledby="about-archive-title"
    >
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gray-400">
        About the Archive
      </p>

      <h2
        id="about-archive-title"
        className="text-3xl font-bold tracking-tight md:text-4xl"
      >
        A collection of worlds, characters, and unforgettable works.
      </h2>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-300 md:text-lg">
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
