'use client';

interface OccupancyCardProps {
  light: number; // raw LDR ADC value; >400 = occupied (matches brain.py logic)
}

export default function OccupancyCard({ light }: OccupancyCardProps) {
  const occupied = light > 400;

  return (
    <div className="card metric-card">
      <div className="metric-header">
        <div className="metric-label">Occupancy Status</div>
        <div className="metric-icon" style={{ background: occupied ? 'var(--green-lt)' : 'var(--border-lt)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={occupied ? 'var(--green)' : 'var(--text-muted)'} strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>
      <div className="occ-row">
        <div
          className="occ-dot"
          style={{
            background: occupied ? 'var(--green)' : 'var(--text-muted)',
            boxShadow: occupied ? '0 0 0 3px var(--green-lt)' : 'none',
          }}
        />
        <div className="occ-label">{occupied ? 'Occupied' : 'Vacant'}</div>
      </div>
      <div className="metric-sub">LDR Sensor · Digital Input · Raw: {light}</div>
      <div className={`metric-chip ${occupied ? 'chip-green' : 'chip-blue'}`}>
        {occupied ? 'Detected' : 'No occupancy'}
      </div>
      <hr className="metric-divider" />
      <div className="metric-footer">
        {occupied ? 'Occupancy penalty: +15 pts active' : 'Penalty: 0 pts (vacant)'}
      </div>
    </div>
  );
}
