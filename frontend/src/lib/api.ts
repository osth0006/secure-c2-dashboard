const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function patchJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface APIDashboardSnapshot {
  entities: APIEntity[];
  alerts: APIAlert[];
  stocks: APIStockQuote[];
  ingest_status: APIIngestStatus[];
}

export interface APIEntity {
  id: string;
  source_id: string;
  data_source: string;
  callsign: string | null;
  entity_type: string;
  category: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  altitude: number | null;
  metadata_: Record<string, unknown> | null;
  first_seen: string;
  last_seen: string;
  track: APITrackPoint[];
}

export interface APITrackPoint {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  altitude: number | null;
  recorded_at: string;
}

export interface APIAlert {
  id: string;
  severity: string;
  title: string;
  message: string | null;
  source: string | null;
  entity_id: string | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export interface APIStockQuote {
  symbol: string;
  name: string;
  price: number;
  change_pct: number | null;
  volume: number | null;
  sparkline: number[];
  recorded_at: string;
}

export interface APIIngestStatus {
  id: string;
  status: string;
  last_heartbeat: number | null;
  records_ingested: number;
  error_message: string | null;
}

export async function fetchDashboard(): Promise<APIDashboardSnapshot> {
  return fetchJSON('/api/dashboard');
}

export async function fetchEntities(params?: { source?: string; category?: string }): Promise<APIEntity[]> {
  const q = new URLSearchParams();
  if (params?.source) q.set('source', params.source);
  if (params?.category) q.set('category', params.category);
  const qs = q.toString();
  return fetchJSON(`/api/entities${qs ? `?${qs}` : ''}`);
}

export async function fetchEntityTrack(id: string, limit = 50): Promise<APITrackPoint[]> {
  return fetchJSON(`/api/entities/${id}/track?limit=${limit}`);
}

export async function fetchAlerts(params?: { severity?: string; ack?: boolean; limit?: number }): Promise<APIAlert[]> {
  const q = new URLSearchParams();
  if (params?.severity) q.set('severity', params.severity);
  if (params?.ack !== undefined) q.set('ack', String(params.ack));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return fetchJSON(`/api/alerts${qs ? `?${qs}` : ''}`);
}

export async function acknowledgeAlertAPI(id: string): Promise<APIAlert> {
  return patchJSON(`/api/alerts/${id}/ack`, { acknowledged: true });
}

export async function fetchStocks(): Promise<APIStockQuote[]> {
  return fetchJSON('/api/stocks');
}

export async function fetchStockHistory(symbol: string, limit = 30): Promise<{ price: number; recorded_at: string }[]> {
  return fetchJSON(`/api/stocks/${symbol}/history?limit=${limit}`);
}

export function getWebSocketURL(): string {
  const wsBase = API_URL.replace(/^http/, 'ws');
  return `${wsBase}/ws`;
}
