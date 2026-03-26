export type EntityType = 'friendly' | 'hostile' | 'neutral' | 'unknown';
export type EntityCategory = 'aircraft' | 'vessel' | 'ground-unit' | 'satellite' | 'drone';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SystemStatus = 'operational' | 'degraded' | 'offline';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Entity {
  id: string;
  callsign: string;
  type: EntityType;
  category: EntityCategory;
  position: Coordinates;
  heading: number;
  speed: number; // knots
  altitude: number; // feet
  lastUpdate: number; // timestamp
  track: Coordinates[];
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  acknowledged: boolean;
}

export interface SystemHealth {
  id: string;
  name: string;
  status: SystemStatus;
  cpu: number;
  memory: number;
  network: number; // Mbps
  uptime: number; // seconds
  lastHeartbeat: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'movement' | 'alert' | 'comms' | 'system' | 'intel';
  title: string;
  description: string;
  entityId?: string;
}

export interface ThroughputData {
  timestamp: number;
  inbound: number;
  outbound: number;
}

export interface AlertFrequencyData {
  timestamp: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardState {
  entities: Entity[];
  alerts: Alert[];
  systems: SystemHealth[];
  timeline: TimelineEvent[];
  throughput: ThroughputData[];
  alertFrequency: AlertFrequencyData[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}
