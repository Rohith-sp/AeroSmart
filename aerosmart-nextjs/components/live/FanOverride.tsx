'use client';
import { useState } from 'react';

export default function FanOverride() {
  const [manual, setManual] = useState(false);

  const toggleOverride = async (checked: boolean) => {
    setManual(checked);
    try {
      await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: checked }),
      });
    } catch (e) {
      console.error('Override failed', e);
    }
  };

  return (
    <div className="card override-row">
      <div>
        <div className="override-label">
          <svg style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 5 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          Exhaust Fan Override
        </div>
        <div className="override-sub">Toggle to force manual activation regardless of AI score</div>
      </div>
      <div className="toggle-wrap">
        <span className={`toggle-mode${manual ? ' manual' : ''}`}>
          {manual ? 'MANUAL ON' : 'AUTO'}
        </span>
        <label className="toggle" aria-label="Toggle fan override">
          <input
            type="checkbox"
            checked={manual}
            onChange={e => toggleOverride(e.target.checked)}
          />
          <div className="toggle-track">
            <div className="toggle-thumb" />
          </div>
        </label>
      </div>
    </div>
  );
}
