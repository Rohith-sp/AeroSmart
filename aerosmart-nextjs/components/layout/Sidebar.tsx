'use client';
import { TabId } from '@/lib/types';
import { useClock } from '@/hooks/useClock';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  fanTriggerCount: number;
}

export default function Sidebar({ activeTab, onTabChange, fanTriggerCount }: SidebarProps) {
  const { uptime } = useClock();

  const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'live',
      label: 'Live Monitoring',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      id: 'analytics',
      label: 'Analytics & Trends',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>,
    },
    {
      id: 'xai',
      label: 'Diagnostics & XAI',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
    },
    {
      id: 'insights',
      label: 'AI Pattern Insights',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    },
    {
      id: 'reports',
      label: 'Compliance Reports',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    },
  ];

  return (
    <nav className="sidebar">
      {/* Brand */}
      <div className="nav-brand">
        <div className="nav-brand-mark">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11.4.48 1.13.48 1.53 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
            </svg>
          </div>
          <span className="brand-name">AeroSmart XAI</span>
        </div>
        <div className="brand-sub">Environmental Intelligence</div>
      </div>

      {/* Monitoring nav */}
      <div className="nav-section">
        <div className="nav-label">Monitoring</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-link${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>



      {/* Footer stats */}
      <div className="nav-footer">

        <div className="status-pill">
          <div className="status-dot-nav" />
          <span>ESP32 <strong>Connected</strong></span>
        </div>
      </div>
    </nav>
  );
}
