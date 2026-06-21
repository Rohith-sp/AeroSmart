'use client';
import { useState } from 'react';
import { TabId, TimeFilter } from '@/lib/types';
import { useLiveTelemetry } from '@/hooks/useLiveTelemetry';
import { useClock } from '@/hooks/useClock';

import Sidebar      from '@/components/layout/Sidebar';
import Topbar       from '@/components/layout/Topbar';
import StatusBanner from '@/components/live/StatusBanner';
import HazardScoreCard  from '@/components/live/HazardScoreCard';
import TempCard         from '@/components/live/TempCard';
import GasCard          from '@/components/live/GasCard';
import OccupancyCard    from '@/components/live/OccupancyCard';
import MotorPowerCard   from '@/components/live/MotorPowerCard';
import MotorHealthCard  from '@/components/live/MotorHealthCard';
import EnergyCard       from '@/components/live/EnergyCard';
import LiveChart        from '@/components/live/LiveChart';
import FanOverride      from '@/components/live/FanOverride';

import FilterRow        from '@/components/analytics/FilterRow';
import CorrelationChart from '@/components/analytics/CorrelationChart';
import MotorPowerChart  from '@/components/analytics/MotorPowerChart';

import XaiTable         from '@/components/xai/XaiTable';
import MaintenanceHub   from '@/components/xai/MaintenanceHub';
import InsightsTab      from '@/components/insights/InsightsTab';
import ReportsTab       from '@/components/reports/ReportsTab';

const TAB_TITLES: Record<TabId, string> = {
  live:      'Live Monitoring',
  analytics: 'Analytics & Trends',
  xai:       'Diagnostics & XAI',
  insights:  'AI Pattern Insights',
  reports:   'Compliance Reports',
};

const USE_REAL = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true';

export default function DashboardPage() {
  const [activeTab,  setActiveTab]  = useState<TabId>('live');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1h');

  useClock(); // keep clock running globally (Topbar/Sidebar pull their own instances)

  const { latest, history, isConnected, fanTriggerCount, totalFanOnSeconds } = useLiveTelemetry();

  const evalTime = latest
    ? new Date(latest.created_at).toLocaleTimeString('en-GB', { hour12: false })
    : '—';

  // Show waiting state only in real-data mode before first Supabase row arrives
  const waitingForData = USE_REAL && !latest;

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fanTriggerCount={fanTriggerCount}
      />

      <main className="main-content">
        <Topbar title={TAB_TITLES[activeTab]} isConnected={isConnected} />

        {/* ── WAITING FOR FIRST SUPABASE FLUSH ── */}
        {waitingForData && (
          <div className="page-body">
            <div className="banner warning" style={{ marginBottom: 24 }}>
              <svg className="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <div>
                <strong>Waiting for first telemetry flush…</strong>
                {' '}brain.py buffers readings and writes to Supabase every ~2 min.
                Data will appear here automatically once it arrives.
              </div>
            </div>

            {/* Skeleton cards */}
            <div className="cards-row" style={{ marginBottom: 14 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card metric-card" style={{ opacity: 0.4 }}>
                  <div style={{ marginBottom: 14 }}>
                    <span className="skeleton" style={{ width: 110, height: 11, display: 'block' }}>&nbsp;</span>
                  </div>
                  <span className="skeleton" style={{ width: 68, height: 30, display: 'block', marginBottom: 8 }}>&nbsp;</span>
                  <span className="skeleton" style={{ width: 50, height: 11, display: 'block' }}>&nbsp;</span>
                </div>
              ))}
            </div>
            <div className="cards-row-bottom" style={{ marginBottom: 14 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card metric-card" style={{ opacity: 0.4 }}>
                  <div style={{ marginBottom: 14 }}>
                    <span className="skeleton" style={{ width: 110, height: 11, display: 'block' }}>&nbsp;</span>
                  </div>
                  <span className="skeleton" style={{ width: 68, height: 30, display: 'block', marginBottom: 8 }}>&nbsp;</span>
                  <span className="skeleton" style={{ width: 50, height: 11, display: 'block' }}>&nbsp;</span>
                </div>
              ))}
            </div>

            {/* Placeholder chart */}
            <div className="card chart-card">
              <div className="chart-title" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Live Telemetry chart — waiting for data
              </div>
              <div style={{
                height: 210, background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, color: 'var(--text-faint)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ animation: 'spin 2s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span style={{ fontSize: 12 }}>mock_esp32 → brain.py → Supabase → here</span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: LIVE MONITORING ── */}
        {!waitingForData && activeTab === 'live' && (
          <div className="page-body">
            <StatusBanner hazardScore={latest?.hazard_score ?? 0} evalTime={evalTime} />

            <div className="cards-row">
              <HazardScoreCard score={latest?.hazard_score ?? 0} />
              <TempCard        temperature={latest?.temperature ?? 0} />
              <GasCard         gas={latest?.gas ?? 0} />
              <OccupancyCard   light={latest?.light ?? 0} />
            </div>

            <div className="cards-row-bottom">
              <MotorPowerCard
                voltage={latest?.voltage ?? 0}
                current={latest?.current ?? 0}
                power={latest?.power ?? 0}
              />
              <MotorHealthCard power={latest?.power ?? 0} />
              <EnergyCard power={latest?.power ?? 0} totalFanOnSeconds={totalFanOnSeconds} />
            </div>

            <LiveChart history={history} />
            <FanOverride />
          </div>
        )}

        {/* ── TAB: ANALYTICS ── */}
        {!waitingForData && activeTab === 'analytics' && (
          <div className="page-body">
            <FilterRow active={timeFilter} onChange={setTimeFilter} />
            <CorrelationChart history={history} filter={timeFilter} />
            <MotorPowerChart  history={history} filter={timeFilter} />
          </div>
        )}

        {/* ── TAB: DIAGNOSTICS & XAI ── */}
        {!waitingForData && activeTab === 'xai' && (
          <div className="page-body">
            <div className="xai-grid">
              <XaiTable history={history} />
              <MaintenanceHub history={history} />
            </div>
          </div>
        )}

        {/* ── TAB: AI PATTERN INSIGHTS ── */}
        {!waitingForData && activeTab === 'insights' && (
          <div className="page-body">
            <InsightsTab history={history} />
          </div>
        )}

        {/* ── TAB: COMPLIANCE REPORTS ── */}
        {!waitingForData && activeTab === 'reports' && (
          <div className="page-body">
            <ReportsTab history={history} />
          </div>
        )}

        {/* Analytics & XAI tabs show a waiting notice too */}
        {waitingForData && activeTab !== 'live' && (
          <div className="page-body">
            <div className="banner warning">
              <svg className="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <div>
                <strong>No data yet.</strong> Switch to Live Monitoring to see the countdown.
                First Supabase flush expected in ~2 minutes from brain.py startup.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
