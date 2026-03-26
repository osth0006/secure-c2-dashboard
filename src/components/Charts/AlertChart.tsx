'use client';

import { AlertFrequencyData } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatTime } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface AlertChartProps {
  data: AlertFrequencyData[];
}

export default function AlertChart({ data }: AlertChartProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-c2-border">
        <AlertTriangle className="w-3.5 h-3.5 text-c2-accent" />
        <span className="text-xs font-bold tracking-wider text-c2-muted">
          ALERT FREQUENCY
        </span>
      </div>
      <div className="flex-1 p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
            <Bar dataKey="critical" fill="#ef4444" stackId="a" name="Critical" isAnimationActive={false} />
            <Bar dataKey="high" fill="#f97316" stackId="a" name="High" isAnimationActive={false} />
            <Bar dataKey="medium" fill="#eab308" stackId="a" name="Medium" isAnimationActive={false} />
            <Bar dataKey="low" fill="#3b82f6" stackId="a" name="Low" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
