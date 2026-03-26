'use client';

import { ThroughputData } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatTime } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface ThroughputChartProps {
  data: ThroughputData[];
}

export default function ThroughputChart({ data }: ThroughputChartProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-c2-border">
        <BarChart3 className="w-3.5 h-3.5 text-c2-accent" />
        <span className="text-xs font-bold tracking-wider text-c2-muted">
          NETWORK THROUGHPUT
        </span>
      </div>
      <div className="flex-1 p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatTime(ts)}
              stroke="#64748b"
              fontSize={10}
              tick={{ fontFamily: 'monospace' }}
            />
            <YAxis stroke="#64748b" fontSize={10} tick={{ fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #1e293b',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              labelFormatter={(ts) => formatTime(ts as number)}
            />
            <Area
              type="monotone"
              dataKey="inbound"
              stroke="#3b82f6"
              fill="url(#inboundGrad)"
              strokeWidth={2}
              name="Inbound (Mbps)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="outbound"
              stroke="#22c55e"
              fill="url(#outboundGrad)"
              strokeWidth={2}
              name="Outbound (Mbps)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
