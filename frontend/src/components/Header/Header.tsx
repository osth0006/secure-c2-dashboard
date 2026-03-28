'use client';

import { formatTime } from '@/lib/utils';
import { IngestStatus } from '@/types';
import { useEffect, useState } from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  Radio,
  Ship,
  Plane,
  Satellite,
  BarChart3,
} from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  ingestStatus: IngestStatus[];
}

const INGEST_ICONS: Record<string, React.ElementType> = {
  ais: Ship,
  adsb: Plane,
  celestrak: Satellite,
  stocks: BarChart3,
};

const INGEST_LABELS: Record<string, string> = {
  ais: 'AIS',
  adsb: 'ADS-B',
  celestrak: 'SAT',
  stocks: 'MKT',
};

function statusColor(status: string): string {
  switch (status) {
    case 'operational': return 'text-green-500';
    case 'degraded': return 'text-yellow-500';
    default: return 'text-red-500';
  }
}

export default function Header({ connectionStatus, ingestStatus }: HeaderProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-c2-panel border-b border-c2-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-c2-accent" />
        <div>
          <h1 className="text-sm font-bold tracking-wider text-c2-text">
            SECURE C2 DASHBOARD
          </h1>
          <p className="text-[10px] text-c2-muted tracking-widest">
            GLOBAL MONITORING PLATFORM // LIVE
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Ingest status indicators */}
        <div className="flex items-center gap-3">
          {ingestStatus.map((s) => {
            const Icon = INGEST_ICONS[s.id] || Radio;
            const label = INGEST_LABELS[s.id] || s.id.toUpperCase();
            return (
              <div key={s.id} className="flex items-center gap-1" title={`${label}: ${s.status} (${s.recordsIngested} records)`}>
                <Icon className={`w-3.5 h-3.5 ${statusColor(s.status)}`} />
                <span className={`text-[10px] font-mono ${statusColor(s.status)}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Radio className="w-3.5 h-3.5 text-c2-accent animate-pulse" />
          <span className="text-c2-muted">ZULU</span>
          <span className="text-c2-text font-mono font-bold">
            {formatTime(now)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-xs font-mono ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
