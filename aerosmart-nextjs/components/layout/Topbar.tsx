'use client';
import { useClock } from '@/hooks/useClock';

interface TopbarProps {
  title: string;
  isConnected: boolean;
}

export default function Topbar({ title, isConnected }: TopbarProps) {
  const { time } = useClock();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-breadcrumb">AeroSmart XAI</span>
        <span className="topbar-sep">›</span>
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-right">
        <div className={`topbar-badge${isConnected ? '' : ' no-data'}`}>
          <div className="live-dot" />
          {isConnected ? 'MQTT stream active' : 'Waiting for data…'}
        </div>
        <div className="topbar-time">{time}</div>
      </div>
    </div>
  );
}
