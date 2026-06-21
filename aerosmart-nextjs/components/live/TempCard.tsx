'use client';

interface TempCardProps {
  temperature: number;
}

export default function TempCard({ temperature }: TempCardProps) {
  const inComfort = temperature >= 18 && temperature <= 28;
  const chipClass = inComfort ? 'chip-green' : temperature > 28 ? 'chip-red' : 'chip-blue';
  const chipLabel = inComfort ? 'Comfortable' : temperature > 28 ? 'Too Hot' : 'Cool';

  return (
    <div className="card metric-card">
      <div className="metric-header">
        <div className="metric-label">Temperature</div>
        <div className="metric-icon" style={{ background: 'var(--amber-lt)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
          </svg>
        </div>
      </div>
      <div className="metric-value">{temperature.toFixed(1)}°</div>
      <div className="metric-sub">DHT11 Sensor · Workspace Bay A</div>
      <div className={`metric-chip ${chipClass}`}>{chipLabel}</div>
      <hr className="metric-divider" />
      <div className="metric-footer">Comfort band: 18–28°C</div>
    </div>
  );
}
