'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardState, Entity, Alert, StockQuote, IngestStatus } from '@/types';
import {
  fetchDashboard,
  acknowledgeAlertAPI,
  getWebSocketURL,
  APIDashboardSnapshot,
  APIEntity,
  APIAlert,
  APIStockQuote,
  APIIngestStatus,
} from '@/lib/api';
import { useWebSocket, WSMessage } from './useWebSocket';

// Transform API entity to frontend Entity format
function toEntity(api: APIEntity): Entity {
  return {
    id: api.id,
    callsign: api.callsign || api.source_id,
    type: (api.entity_type as Entity['type']) || 'neutral',
    category: api.category as Entity['category'],
    position: { lat: api.latitude, lng: api.longitude },
    heading: api.heading ?? 0,
    speed: api.speed ?? 0,
    altitude: api.altitude ?? 0,
    lastUpdate: new Date(api.last_seen).getTime(),
    dataSource: api.data_source as 'ais' | 'adsb' | 'celestrak',
    sourceId: api.source_id,
    track: (api.track || []).map((tp) => ({ lat: tp.latitude, lng: tp.longitude })),
  };
}

function toAlert(api: APIAlert): Alert {
  return {
    id: api.id,
    timestamp: new Date(api.created_at).getTime(),
    severity: api.severity as Alert['severity'],
    title: api.title,
    message: api.message || '',
    source: api.source || 'unknown',
    acknowledged: api.acknowledged,
  };
}

function toStockQuote(api: APIStockQuote): StockQuote {
  return {
    symbol: api.symbol,
    name: api.name,
    price: api.price,
    changePct: api.change_pct ?? 0,
    sparkline: api.sparkline || [],
  };
}

function toIngestStatus(api: APIIngestStatus): IngestStatus {
  return {
    id: api.id,
    status: api.status as IngestStatus['status'],
    lastHeartbeat: api.last_heartbeat ?? 0,
    recordsIngested: api.records_ingested,
  };
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    entities: [],
    alerts: [],
    systems: [],
    timeline: [],
    throughput: [],
    alertFrequency: [],
    stocks: [],
    ingestStatus: [],
    connectionStatus: 'disconnected',
  });

  const [loading, setLoading] = useState(true);
  const { lastMessage, connectionStatus } = useWebSocket(getWebSocketURL());

  // Update connection status from WebSocket
  useEffect(() => {
    setState((prev) => ({ ...prev, connectionStatus }));
  }, [connectionStatus]);

  // Fetch initial dashboard snapshot
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const snapshot = await fetchDashboard();
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          entities: snapshot.entities.map(toEntity),
          alerts: snapshot.alerts.map(toAlert),
          stocks: snapshot.stocks.map(toStockQuote),
          ingestStatus: snapshot.ingest_status.map(toIngestStatus),
        }));
      } catch (e) {
        console.error('Failed to fetch dashboard:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Process WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data } = lastMessage;

    setState((prev) => {
      switch (type) {
        case 'entity_update': {
          if (data.batch) {
            // Batch update means we should re-fetch, but for now just signal refresh
            return prev;
          }
          const updated: Entity = {
            id: data.id as string,
            callsign: (data.callsign as string) || (data.source_id as string),
            type: 'neutral',
            category: data.category as Entity['category'],
            position: { lat: data.latitude as number, lng: data.longitude as number },
            heading: (data.heading as number) ?? 0,
            speed: (data.speed as number) ?? 0,
            altitude: (data.altitude as number) ?? 0,
            lastUpdate: Date.now(),
            dataSource: data.data_source as 'ais' | 'adsb' | 'celestrak',
            sourceId: data.source_id as string,
            track: [],
          };
          const idx = prev.entities.findIndex((e) => e.id === updated.id);
          let entities: Entity[];
          if (idx >= 0) {
            entities = [...prev.entities];
            // Preserve existing track and append new position
            const existing = entities[idx];
            updated.track = [
              ...existing.track.slice(-19),
              existing.position,
            ];
            entities[idx] = updated;
          } else {
            entities = [...prev.entities, updated];
          }
          return { ...prev, entities };
        }

        case 'new_alert': {
          const alert: Alert = {
            id: data.id as string,
            timestamp: new Date(data.created_at as string).getTime(),
            severity: data.severity as Alert['severity'],
            title: data.title as string,
            message: (data.message as string) || '',
            source: (data.source as string) || 'unknown',
            acknowledged: false,
          };
          return {
            ...prev,
            alerts: [alert, ...prev.alerts].slice(0, 50),
          };
        }

        case 'stock_update': {
          const quotes = (data.quotes as APIStockQuote[]) || [];
          if (quotes.length === 0) return prev;
          const updatedStocks = quotes.map(toStockQuote);
          // Merge: update existing or add new
          const stockMap = new Map(prev.stocks.map((s) => [s.symbol, s]));
          for (const s of updatedStocks) {
            stockMap.set(s.symbol, s);
          }
          return { ...prev, stocks: Array.from(stockMap.values()) };
        }

        case 'ingest_status': {
          const status = data as unknown as APIIngestStatus;
          const updated = toIngestStatus(status);
          const idx = prev.ingestStatus.findIndex((s) => s.id === updated.id);
          let ingestStatus: IngestStatus[];
          if (idx >= 0) {
            ingestStatus = [...prev.ingestStatus];
            ingestStatus[idx] = updated;
          } else {
            ingestStatus = [...prev.ingestStatus, updated];
          }
          return { ...prev, ingestStatus };
        }

        default:
          return prev;
      }
    });
  }, [lastMessage]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    }));
    try {
      await acknowledgeAlertAPI(alertId);
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
      // Revert on failure
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: false } : a)),
      }));
    }
  }, []);

  return { state, loading, acknowledgeAlert };
}
