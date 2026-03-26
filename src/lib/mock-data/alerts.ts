import { Alert, AlertSeverity } from '@/types';

const alertTemplates: Array<{ severity: AlertSeverity; title: string; message: string; source: string }> = [
  { severity: 'critical', title: 'UNIDENTIFIED CONTACT', message: 'New unidentified air contact detected at bearing 045, range 120nm. Squawk not recognized.', source: 'RADAR-NET' },
  { severity: 'critical', title: 'COMMS BREACH ATTEMPT', message: 'Unauthorized access attempt detected on encrypted channel DELTA-7. Source triangulated.', source: 'SIGINT-OPS' },
  { severity: 'high', title: 'ASSET DEVIATION', message: 'EAGLE-1 has deviated from assigned flight corridor by 15nm. Awaiting pilot response.', source: 'ATC-MIL' },
  { severity: 'high', title: 'SENSOR ANOMALY', message: 'Infrared sensor array sector 4 reporting intermittent false returns. Calibration required.', source: 'ISR-NET' },
  { severity: 'medium', title: 'WEATHER ADVISORY', message: 'Severe weather front approaching AO. Expected impact on ISR operations in 2 hours.', source: 'METOC' },
  { severity: 'medium', title: 'FUEL STATUS', message: 'VIPER-6 fuel state below planned threshold. Recommend divert to alternate.', source: 'LOGISTICS' },
  { severity: 'low', title: 'MAINTENANCE DUE', message: 'Scheduled maintenance window for SATCOM relay NODE-3 in 6 hours.', source: 'MAINTENANCE' },
  { severity: 'low', title: 'SHIFT CHANGE', message: 'Watch rotation in progress. Sector 7 transitioning to BRAVO watch.', source: 'OPS-CENTER' },
  { severity: 'info', title: 'LINK STATUS', message: 'Link-16 network operating nominally. All participants reporting green.', source: 'DATALINK' },
  { severity: 'info', title: 'INTEL UPDATE', message: 'Updated threat assessment published for AO PACIFIC. No change in force posture.', source: 'J2-INTEL' },
  { severity: 'critical', title: 'HOSTILE TRACK', message: 'Hostile surface contact BRAVO classified as combatant. Heading 315 at 28 kts.', source: 'MARITIME-OPS' },
  { severity: 'high', title: 'CYBER INTRUSION', message: 'Anomalous network traffic detected on C2 backbone. Isolating affected segment.', source: 'CYBER-OPS' },
  { severity: 'medium', title: 'DRONE BATTERY', message: 'SHADOW-3 battery at 35%. RTB recommended within 45 minutes.', source: 'UAS-OPS' },
  { severity: 'high', title: 'JAMMING DETECTED', message: 'GPS jamming detected in sector 12. Switching to INS backup navigation.', source: 'EW-OPS' },
  { severity: 'info', title: 'CHECKPOINT', message: 'All units report status green. Next mandatory check-in at 0400Z.', source: 'BATTLE-CAPTAIN' },
];

let alertCounter = 0;

export function generateAlert(): Alert {
  const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
  alertCounter++;
  return {
    id: `alert-${Date.now()}-${alertCounter}`,
    timestamp: Date.now(),
    severity: template.severity,
    title: template.title,
    message: template.message,
    source: template.source,
    acknowledged: false,
  };
}

export function generateInitialAlerts(count: number): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const alert = generateAlert();
    alert.timestamp = now - (count - i) * 30000; // 30s apart
    alert.acknowledged = Math.random() > 0.5;
    alerts.push(alert);
  }
  return alerts;
}
