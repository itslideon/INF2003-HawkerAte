// Plain message card for loading / error / empty states on the dashboard pages.
export default function StatusNotice({ title, text, tone = 'plain' }) {
  return (
    <div
      role={tone === 'warn' ? 'status' : undefined}
      className={`flex w-full flex-col items-start gap-1 rounded-2xl p-5 ${tone === 'warn' ? 'bg-amber/20' : 'bg-surface'}`}
    >
      <p className="text-sm font-bold text-ink">{title}</p>
      {text && <p className="text-xs leading-[1.5] text-muted">{text}</p>}
    </div>
  )
}
