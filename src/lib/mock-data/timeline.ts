import { TimelineEvent } from '@/types';

const eventTemplates: Array<Omit<TimelineEvent, 'id' | 'timestamp'>> = [
  { type: 'movement', title: 'EAGLE-1 on station', description: 'EAGLE-1 arrived at assigned CAP station. Maintaining orbit at FL350.', entityId: 'e-001' },
  { type: 'alert', title: 'Contact classified', description: 'UNKNOWN-ALPHA reclassified as civilian Boeing 777. Squawk updated.', entityId: 'e-006' },
  { type: 'comms', title: 'SATCOM check complete', description: 'All SATCOM channels verified operational. Signal strength nominal across all bands.' },
  { type: 'system', title: 'ISR sensor recalibrated', description: 'Sector 4 IR sensors recalibrated successfully. Normal operations resumed.' },
  { type: 'intel', title: 'Threat assessment update', description: 'Maritime threat level downgraded from ELEVATED to NORMAL for sector ALPHA.' },
  { type: 'movement', title: 'TITAN-12 underway', description: 'TITAN-12 departed port. Heading 180 at 22 kts for patrol area BRAVO.', entityId: 'e-004' },
  { type: 'comms', title: 'Encrypted traffic spike', description: 'Notable increase in encrypted transmissions on monitored frequencies. Analysis pending.' },
  { type: 'system', title: 'Backup systems tested', description: 'Failover test completed successfully. Secondary C2 node operational in 4.2 seconds.' },
  { type: 'movement', title: 'SPECTRE-2 launched', description: 'UAS SPECTRE-2 airborne from FOB DELTA. Proceeding to surveillance orbit.', entityId: 'e-010' },
  { type: 'intel', title: 'Pattern of life update', description: 'Updated commercial shipping patterns ingested. 47 new vessel tracks catalogued.' },
  { type: 'alert', title: 'EW activity detected', description: 'Electronic warfare emissions detected bearing 290. Characterization in progress.' },
  { type: 'comms', title: 'Link-16 reset', description: 'Link-16 network time reset performed. All participants resynchronized.' },
];

let eventCounter = 0;

export function generateTimelineEvent(): TimelineEvent {
  const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
  eventCounter++;
  return {
    ...template,
    id: `evt-${Date.now()}-${eventCounter}`,
    timestamp: Date.now(),
  };
}

export function generateInitialTimeline(count: number): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const event = generateTimelineEvent();
    event.timestamp = now - (count - i) * 45000;
    events.push(event);
  }
  return events;
}
