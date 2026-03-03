export default function Home() {
  return (
    <main>
      {/* Hero — dark background, Stardos headings */}
      <section className="bg-charcoal px-6 py-24 text-center">
        <h1 className="font-stardos text-h1 font-bold leading-h1 tracking-tight text-brand-red">
          Holiday River Expeditions
        </h1>
        <h2 className="mt-4 font-stardos text-h1 font-bold leading-h1 tracking-tight text-brand-red">
          Since 1966
        </h2>
        <h3 className="mt-6 text-h3 font-extrabold leading-h3 text-white">
          Guided Whitewater Rafting &amp; Nature Experiences
        </h3>
      </section>

      {/* Body text — taupe on white */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-paragraph font-bold leading-paragraph text-taupe">
          For over 60 years, Holiday River Expeditions has been guiding
          adventurers through the breathtaking rivers and canyons of Colorado
          and Utah.
        </p>
        <p className="mt-4 text-body leading-body text-taupe">
          From multi-day rafting trips on the Colorado River to scenic canyon
          hikes, every expedition is crafted for unforgettable experiences in
          the heart of the American West.
        </p>
        <p className="mt-4 text-link font-semibold uppercase text-taupe">
          Learn more about our trips
        </p>
      </section>

      {/* CTA — blue button */}
      <section className="bg-off-white px-6 py-16 text-center">
        <h3 className="text-h3 font-extrabold leading-h3 text-charcoal">
          Ready for Your Next Adventure?
        </h3>
        <button
          type="button"
          className="mt-6 rounded-lg bg-blue px-8 py-3 text-body font-semibold text-white transition-colors hover:bg-blue/90"
        >
          Book a Trip
        </button>
      </section>

      {/* Color swatches */}
      <section className="px-6 py-16">
        <h3 className="mb-8 text-center text-h3 font-extrabold leading-h3 text-charcoal">
          Brand Palette
        </h3>
        <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-lg bg-brand-red" />
            <span className="text-link font-semibold text-taupe">Red</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-lg bg-taupe" />
            <span className="text-link font-semibold text-taupe">Taupe</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-lg bg-charcoal" />
            <span className="text-link font-semibold text-taupe">Charcoal</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-lg border border-light-gray bg-off-white" />
            <span className="text-link font-semibold text-taupe">
              Off-White
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-lg bg-light-gray" />
            <span className="text-link font-semibold text-taupe">Gray</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-lg bg-blue" />
            <span className="text-link font-semibold text-taupe">Blue</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-lg bg-teal" />
            <span className="text-link font-semibold text-taupe">Teal</span>
          </div>
        </div>
      </section>
    </main>
  );
}
