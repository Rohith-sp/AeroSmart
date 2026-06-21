'use client';
import { TimeFilter } from '@/lib/types';

interface FilterRowProps {
  active: TimeFilter;
  onChange: (f: TimeFilter) => void;
}

const OPTIONS: { label: string; value: TimeFilter }[] = [
  { label: 'Last 1 Hour',  value: '1h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days',  value: '7d' },
];

export default function FilterRow({ active, onChange }: FilterRowProps) {
  return (
    <div className="filter-row">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          className={`filter-btn${active === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
