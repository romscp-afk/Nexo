import { SCHOOL_LOGOS } from '@/features/gathering/lib/schoolLogos'

export function SchoolCrestGallery() {
  return (
    <div className="legacy-intro__schools legacy-intro__phase legacy-intro__phase--3 w-full">
      <p className="legacy-intro__schools-label font-[DM_Mono,monospace] text-[10px] uppercase tracking-[0.45em]">
        Nine schools · One batch
      </p>

      <div className="legacy-intro__schools-orbit" aria-hidden>
        {SCHOOL_LOGOS.map((school, index) => (
          <div
            key={school.name}
            className="legacy-intro__school-orbit-item"
            style={{ '--crest-i': index } as React.CSSProperties}
          >
            <img src={school.src} alt="" className="legacy-intro__school-orbit-img" />
          </div>
        ))}
      </div>

      <div className="legacy-intro__schools-grid">
        {SCHOOL_LOGOS.map((school) => (
          <figure key={school.name} className="legacy-intro__school-card" title={school.name}>
            <div className="legacy-intro__school-card-frame">
              <img src={school.src} alt={school.name} className="legacy-intro__school-card-img" />
            </div>
            <figcaption className="legacy-intro__school-card-name">{school.shortName}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
