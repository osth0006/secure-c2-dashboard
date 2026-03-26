'use client';

import { TimelineEvent } from '@/types';
import { formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  AlertTriangle,
  Radio,
  Server,
  Eye,
  Clock,
} from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

const eventIcons: Record<TimelineEvent['type'], React.ReactNode> = {
  movement: <Navigation className="w-3 h-3" />,
  alert: <AlertTriangle className="w-3 h-3" />,
  comms: <Radio className="w-3 h-3" />,
  system: <Server className="w-3 h-3" />,
  intel: <Eye className="w-3 h-3" />,
};

const eventColors: Record<TimelineEvent['type'], string> = {
  movement: 'text-blue-400 border-blue-400/30',
  alert: 'text-red-400 border-red-400/30',
  comms: 'text-green-400 border-green-400/30',
  system: 'text-yellow-400 border-yellow-400/30',
  intel: 'text-purple-400 border-purple-400/30',
};

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-c2-border">
        <Clock className="w-3.5 h-3.5 text-c2-accent" />
        <span className="text-xs font-bold tracking-wider text-c2-muted">ACTIVITY LOG</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2 mb-2"
            >
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${eventColors[event.type]}`}>
                  {eventIcons[event.type]}
                </div>
                <div className="w-px flex-1 bg-c2-border" />
              </div>
              <div className="pb-3 min-w-0">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-c2-muted font-mono">{formatTime(event.timestamp)}</span>
                  <span className={`font-bold uppercase ${eventColors[event.type].split(' ')[0]}`}>
                    {event.type}
                  </span>
                </div>
                <div className="text-xs font-bold text-c2-text mt-0.5">{event.title}</div>
                <div className="text-[11px] text-c2-muted mt-0.5 leading-relaxed">
                  {event.description}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
