import React from 'react'
import { Clock3, Trash2, FolderOpen } from 'lucide-react'

export default function HistoryPanel({ history, onOpen, onDelete }) {
  if (!history?.length) {
    return (
      <section className="mb-8">
        <div className="border border-dark-border rounded-2xl bg-dark-card/60 p-5">
          <h3 className="text-lg font-semibold text-dark-text mb-2">Analysis History</h3>
          <p className="text-sm text-dark-muted">No saved analyses yet. Your completed reports will appear here automatically.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8 animate-fadeInUp">
      <div className="border border-dark-border rounded-2xl bg-dark-card/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock3 className="w-4 h-4 text-purple-glow" />
          <h3 className="text-lg font-semibold text-dark-text">Analysis History</h3>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {history.map((item) => {
            const atsScore = item?.job_match?.ats_match_score ?? 'N/A'
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 border border-dark-border rounded-xl bg-dark-bg/70 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dark-text truncate">{item.resume_filename}</p>
                  <p className="text-xs text-dark-muted truncate">{new Date(item.created_at).toLocaleString()}</p>
                  <p className="text-xs text-purple-300 mt-1">ATS: {atsScore}%</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onOpen(item)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-dark-border hover:border-purple-glow text-xs text-dark-text transition-colors"
                  >
                    <FolderOpen className="w-3 h-3" />
                    Open
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500/40 hover:border-red-400 text-xs text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
