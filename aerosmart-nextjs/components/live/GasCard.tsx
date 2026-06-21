'use client';

interface GasCardProps {
  gas: number;
}

export default function GasCard({ gas }: GasCardProps) {
  const chipClass = gas < 300 ? 'chip-green' : gas < 600 ? 'chip-amber' : 'chip-red';
  const chipLabel = gas < 300 ? 'Normal' : gas < 600 ? 'Elevated' : 'Dangerous';
  const valColor  = gas >= 600 ? 'var(--red)' : gas >= 300 ? 'var(--amber)' : 'var(--text-primary)';

  return (
    <div className="card metric-card">
      <div className="metric-header">
        <div className="metric-label">Gas / VOC Level</div>
        <div className="metric-icon" style={{ background: 'var(--red-lt)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
            <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
      </div>
      <div className="metric-value" style={{ color: valColor }}>{gas}</div>
      <div className="metric-sub">PPM · MQ135 Sensor</div>
      <div className={`metric-chip ${chipClass}`}>{chipLabel}</div>
      <hr className="metric-divider" />
      <div className="metric-footer">Critical threshold: 600 PPM</div>
    </div>
  );
}
