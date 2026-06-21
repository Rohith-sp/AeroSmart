'use client';

interface StatusBannerProps {
  hazardScore: number;
  evalTime: string;
}

export default function StatusBanner({ hazardScore, evalTime }: StatusBannerProps) {
  const isCritical = hazardScore >= 75;
  const isWarning  = hazardScore >= 40 && hazardScore < 75;

  const variant = isCritical ? 'critical' : isWarning ? 'warning' : 'normal';

  const messages = {
    normal:   <><strong>System Status: Normal</strong> — All parameters within safe limits.</>,
    warning:  <><strong>System Status: Warning</strong> — Hazard score elevated. Monitor closely.</>,
    critical: <><strong>⚠ CRITICAL ALERT</strong> — Hazard score {hazardScore}/100. Exhaust fan triggered!</>,
  };

  const icons = {
    normal: (
      <svg className="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    warning: (
      <svg className="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    critical: (
      <svg className="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  };

  return (
    <div className={`banner ${variant}`}>
      {icons[variant]}
      <div>{messages[variant]}</div>
      <span className="banner-detail">Last evaluated: {evalTime}</span>
    </div>
  );
}
