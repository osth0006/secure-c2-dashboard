'use client';

import { formatTime } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  isRunning: boolean;
  onToggleSimulation: () => void;
}

export default function Header({ connectionStatus, isRunning, onToggleSimulation }: HeaderProps) {
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
            JOINT OPERATIONS CENTER // UNCLASSIFIED // DEMO
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <Radio className="w-3.5 h-3.5 text-c2-accent animate-pulse" />
          <span className="text-c2-muted">ZULU</span>
          <span className="text-c2-text font-mono font-bold">
            {formatTime(now)}
          </span>
        </div>

        <button
          onClick={onToggleSimulation}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border border-c2-border hover:border-c2-accent/50 transition-colors"
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-c2-text">PAUSE SIM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-green-500" />
              <span className="text-c2-text">RESUME SIM</span>
            </>
          )}
        </button>

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
