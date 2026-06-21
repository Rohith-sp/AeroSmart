'use client';
import { useState } from 'react';
import { TelemetryRow } from '@/lib/types';

interface InsightsTabProps {
  history: TelemetryRow[];
}

export default function InsightsTab({ history }: InsightsTabProps) {
  const [insights, setInsights] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
      });
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      setInsights(data.insights);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ marginBottom: 10, color: 'var(--text)' }}>AI Pattern Recognition</h2>
        <p style={{ color: 'var(--text)', marginBottom: 20, fontSize: '1.05rem', lineHeight: 1.6 }}>
          Use Llama-3.1 to analyze your historical telemetry data and discover hidden temporal correlations between temperature, gas, occupancy, and motor degradation.
        </p>

        <button 
          onClick={generateInsights} 
          disabled={loading || history.length === 0}
          style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 2s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Analyzing Data...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              Generate Insights
            </>
          )}
        </button>

        {error && (
          <div style={{ marginTop: 20, padding: 15, background: 'var(--red-mid)', color: 'var(--red)', borderRadius: 'var(--radius-sm)' }}>
            Error: {error}
          </div>
        )}
      </div>

      {insights && insights.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: 15, color: 'var(--text)' }}>Discovered Patterns</h3>
          <ul style={{ paddingLeft: 20, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 15, fontSize: '1.05rem' }}>
            {insights.map((insight, i) => (
              <li key={i} style={{ lineHeight: 1.5 }}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
