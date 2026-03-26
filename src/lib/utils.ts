import { AlertSeverity, EntityType, SystemStatus } from '@/types';

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

export function severityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-blue-400';
    case 'info': return 'text-gray-400';
  }
}

export function severityBg(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 border-red-500/50';
    case 'high': return 'bg-orange-500/20 border-orange-500/50';
    case 'medium': return 'bg-yellow-500/20 border-yellow-500/50';
    case 'low': return 'bg-blue-500/20 border-blue-500/50';
    case 'info': return 'bg-gray-500/20 border-gray-500/50';
  }
}

export function entityColor(type: EntityType): string {
  switch (type) {
    case 'friendly': return '#3b82f6';
    case 'hostile': return '#ef4444';
    case 'neutral': return '#22c55e';
    case 'unknown': return '#f59e0b';
  }
}

export function statusColor(status: SystemStatus): string {
  switch (status) {
    case 'operational': return 'text-green-500';
    case 'degraded': return 'text-yellow-500';
    case 'offline': return 'text-red-500';
  }
}

export function statusDot(status: SystemStatus): string {
  switch (status) {
    case 'operational': return 'bg-green-500';
    case 'degraded': return 'bg-yellow-500';
    case 'offline': return 'bg-red-500';
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
