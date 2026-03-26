import { Entity, SystemHealth, ThroughputData, AlertFrequencyData } from '@/types';

// Move entities along their headings with some randomness
export function updateEntityPositions(entities: Entity[]): Entity[] {
  return entities.map((entity) => {
    const speedFactor = entity.category === 'vessel' ? 0.0001 : entity.category === 'ground-unit' ? 0 : 0.002;
    const headingRad = ((entity.heading + (Math.random() - 0.5) * 5) * Math.PI) / 180;
    const distance = speedFactor * (0.5 + Math.random());

    const newLat = entity.position.lat + Math.cos(headingRad) * distance;
    const newLng = entity.position.lng + Math.sin(headingRad) * distance;

    const newTrack = [...entity.track, entity.position].slice(-20);

    return {
      ...entity,
      position: { lat: newLat, lng: newLng },
      heading: (entity.heading + (Math.random() - 0.5) * 10 + 360) % 360,
      speed: Math.max(0, entity.speed + (Math.random() - 0.5) * 10),
      lastUpdate: Date.now(),
      track: newTrack,
    };
  });
}

export function updateSystemHealth(systems: SystemHealth[]): SystemHealth[] {
  return systems.map((sys) => {
    const cpuDelta = (Math.random() - 0.5) * 8;
    const memDelta = (Math.random() - 0.5) * 4;
    const netDelta = (Math.random() - 0.5) * 200;

    const cpu = Math.min(100, Math.max(5, sys.cpu + cpuDelta));
    const memory = Math.min(100, Math.max(10, sys.memory + memDelta));
    const network = Math.max(10, sys.network + netDelta);

    let status = sys.status;
    if (cpu > 90 || memory > 95) status = 'degraded';
    else if (cpu < 80 && memory < 85) status = 'operational';

    return {
      ...sys,
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      network: Math.round(network),
      uptime: sys.uptime + 2,
      lastHeartbeat: Date.now(),
      status,
    };
  });
}

export function generateThroughputPoint(): ThroughputData {
  return {
    timestamp: Date.now(),
    inbound: Math.round(200 + Math.random() * 800),
    outbound: Math.round(150 + Math.random() * 600),
  };
}

export function generateAlertFrequencyPoint(): AlertFrequencyData {
  return {
    timestamp: Date.now(),
    critical: Math.floor(Math.random() * 3),
    high: Math.floor(Math.random() * 5),
    medium: Math.floor(Math.random() * 8),
    low: Math.floor(Math.random() * 12),
  };
}

export function generateInitialThroughput(count: number): ThroughputData[] {
  const data: ThroughputData[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    data.push({
      ...generateThroughputPoint(),
      timestamp: now - (count - i) * 2000,
    });
  }
  return data;
}

export function generateInitialAlertFrequency(count: number): AlertFrequencyData[] {
  const data: AlertFrequencyData[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    data.push({
      ...generateAlertFrequencyPoint(),
      timestamp: now - (count - i) * 5000,
    });
  }
  return data;
}
