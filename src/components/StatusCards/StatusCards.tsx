'use client';

import { SystemHealth } from '@/types';
import { statusDot, formatUptime } from '@/lib/utils';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

interface StatusCardsProps {
  systems: SystemHealth[];
}

export default function StatusCards({ systems }: StatusCardsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-c2-border">
        <Activity className="w-3.5 h-3.5 text-c2-accent" />
        <span className="text-xs font-bold tracking-wider text-c2-muted">SYSTEM HEALTH</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 auto-rows-min">
        {systems.map((sys) => (
          <SystemCard key={sys.id} system={sys} />
        ))}
      </div>
    </div>
  );
}

function SystemCard({ system }: { system: SystemHealth }) {
  return (
    <div className="bg-black/30 border border-c2-border rounded p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold tracking-wider text-c2-text">
          {system.name}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusDot(system.status)} ${system.status === 'operational' ? '' : 'animate-pulse'}`} />
          <span className="text-[10px] text-c2-muted">{system.status.toUpperCase()}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <MetricBar icon={<Cpu className="w-3 h-3" />} label="CPU" value={system.cpu} />
        <MetricBar icon={<HardDrive className="w-3 h-3" />} label="MEM" value={system.memory} />
        <div className="flex items-center gap-1.5 text-[10px]">
          <Wifi className="w-3 h-3 text-c2-muted" />
          <span className="text-c2-muted w-7">NET</span>
          <span className="text-c2-text font-mono">{system.network} Mbps</span>
        </div>
        <div className="text-[10px] text-c2-muted font-mono">
          UP: {formatUptime(system.uptime)}
        </div>
      </div>
    </div>
  );
}

function MetricBar({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const color = value > 90 ? 'bg-red-500' : value > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="text-c2-muted">{icon}</span>
      <span className="text-c2-muted w-7">{label}</span>
      <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-c2-text font-mono w-8 text-right">{value}%</span>
    </div>
  );
}
