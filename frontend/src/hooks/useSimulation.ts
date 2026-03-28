'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardState } from '@/types';
import { initialEntities } from '@/lib/mock-data/entities';
import { generateAlert, generateInitialAlerts } from '@/lib/mock-data/alerts';
import { initialSystems } from '@/lib/mock-data/systems';
import { generateTimelineEvent, generateInitialTimeline } from '@/lib/mock-data/timeline';
import {
  updateEntityPositions,
  updateSystemHealth,
  generateThroughputPoint,
  generateAlertFrequencyPoint,
  generateInitialThroughput,
  generateInitialAlertFrequency,
} from '@/lib/mock-data/simulation';

const MAX_ALERTS = 50;
const MAX_TIMELINE = 100;
const MAX_CHART_POINTS = 30;

export function useSimulation() {
  const [state, setState] = useState<DashboardState>({
    entities: initialEntities,
    alerts: generateInitialAlerts(8),
    systems: initialSystems,
    timeline: generateInitialTimeline(12),
    throughput: generateInitialThroughput(MAX_CHART_POINTS),
    alertFrequency: generateInitialAlertFrequency(MAX_CHART_POINTS),
    stocks: [],
    ingestStatus: [],
    connectionStatus: 'connected',
  });

  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const tick = useCallback(() => {
    setState((prev) => {
      const entities = updateEntityPositions(prev.entities);
      const systems = updateSystemHealth(prev.systems);

      // Occasionally add new alert (30% chance per tick)
      const newAlerts = Math.random() < 0.3 ? [generateAlert(), ...prev.alerts] : prev.alerts;

      // Occasionally add timeline event (25% chance per tick)
      const newTimeline = Math.random() < 0.25 ? [generateTimelineEvent(), ...prev.timeline] : prev.timeline;

      const throughput = [...prev.throughput, generateThroughputPoint()].slice(-MAX_CHART_POINTS);
      const alertFrequency = [...prev.alertFrequency, generateAlertFrequencyPoint()].slice(-MAX_CHART_POINTS);

      return {
        entities,
        alerts: newAlerts.slice(0, MAX_ALERTS),
        systems,
        timeline: newTimeline.slice(0, MAX_TIMELINE),
        throughput,
        alertFrequency,
        stocks: prev.stocks,
        ingestStatus: prev.ingestStatus,
        connectionStatus: 'connected' as const,
      };
    });
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    }));
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  return { state, isRunning, toggleSimulation, acknowledgeAlert };
}
