import React from 'react'

export default function MissingSkills({ missingSkills = [] }) {
  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card/80 p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-dark-muted">Missing Keywords</p>
          <h3 className="mt-2 text-xl font-semibold text-dark-text">Red flags to close</h3>
        </div>
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
          ATS gaps
        </span>
      </div>

      {missingSkills.length ? (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {missingSkills.slice(0, 6).map((skill, index) => (
            <article
              key={`${skill.skill || 'missing'}-${index}`}
              className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-red-200">{skill.skill}</h4>
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-300">
                  {skill.importance || 'medium'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{skill.impact}</p>
              <p className="mt-3 text-sm text-slate-400">{skill.recommendation}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-dark-muted">No missing keyword signal detected for this role.</p>
      )}
    </section>
  )
}