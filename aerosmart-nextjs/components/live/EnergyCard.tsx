'use client';

interface EnergyCardProps {
  power: number;
  totalFanOnSeconds: number;
}

export default function EnergyCard({ power, totalFanOnSeconds }: EnergyCardProps) {
  const energyWh = parseFloat((power * (totalFanOnSeconds / 3600)).toFixed(4));
  const chipClass = energyWh < 0.1 ? 'chip-green' : energyWh < 0.5 ? 'chip-amber' : 'chip-red';
  const chipLabel = energyWh < 0.1 ? 'Low Draw' : energyWh < 0.5 ? 'Moderate' : 'High';
  const mins = Math.floor(totalFanOnSeconds / 60);

  return (
    <div className="card metric-card">
      <div className="metric-header">
        <div className="metric-label">Energy Used Today</div>
        <div className="metric-icon" style={{ background: 'var(--amber-lt)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
      </div>
      <div className="metric-value" style={{ color: 'var(--amber)' }}>{energyWh}</div>
      <div className="metric-sub">Wh · Fan run-time accumulation</div>
      <div className={`metric-chip ${chipClass}`}>{chipLabel}</div>
      <hr className="metric-divider" />
      <div className="metric-footer">
        Fan ON {mins} min today @ {power.toFixed(2)} W avg
      </div>
    </div>
  );
}
