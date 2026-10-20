export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="Luma home">
      <span className="brand-mark"><span /></span>
      {!compact && <span className="brand-name">luma</span>}
    </div>
  )
}
