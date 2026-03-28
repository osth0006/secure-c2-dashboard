'use client';

import { Alert } from '@/types';
import { formatTime, severityColor, severityBg } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Bell } from 'lucide-react';

interface DataFeedProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
}

export default function DataFeed({ alerts, onAcknowledge }: DataFeedProps) {
  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-c2-border">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-c2-accent" />
          <span className="text-xs font-bold tracking-wider text-c2-muted">ALERT FEED</span>
        </div>
        {unacknowledged > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
            {unacknowledged} PENDING
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`p-2 rounded border text-xs ${severityBg(alert.severity)} ${
                  alert.acknowledged ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`w-3 h-3 shrink-0 ${severityColor(alert.severity)}`} />
                    <span className={`font-bold ${severityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-c2-muted">•</span>
                    <span className="text-c2-muted font-mono">{formatTime(alert.timestamp)}</span>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="shrink-0 text-c2-muted hover:text-green-500 transition-colors"
                      title="Acknowledge"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-1 font-bold text-c2-text">{alert.title}</div>
                <div className="mt-0.5 text-c2-muted leading-relaxed">{alert.message}</div>
                <div className="mt-1 text-[10px] text-c2-muted font-mono">SRC: {alert.source}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
