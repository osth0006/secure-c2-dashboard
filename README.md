# Secure C2 Dashboard

A real-time command and control (C2) dashboard simulating a Joint Operations Center display. Built as a portfolio demonstration of full-stack development skills for defense and national security applications.

> **UNCLASSIFIED // DEMONSTRATION ONLY** — All data is simulated. No real operational data is used.

## Overview

This dashboard provides a comprehensive operational picture with real-time entity tracking, alert management, system health monitoring, and data visualization — the core capabilities expected in modern C2 systems.

### Features

- **Interactive Tactical Map** — Leaflet-based map with dark tiles displaying entity positions, tracks, headings, and classifications (friendly/hostile/neutral/unknown) with MIL-STD-inspired color coding
- **Real-Time Alert Feed** — Severity-classified alerts (critical/high/medium/low/info) with acknowledge workflows, sourced from realistic operational scenarios
- **System Health Monitoring** — Six subsystem status cards showing CPU, memory, network throughput, and uptime with operational/degraded/offline indicators
- **Network Throughput Chart** — Live area chart tracking inbound/outbound data rates across the C2 backbone
- **Alert Frequency Chart** — Stacked bar chart visualizing alert distribution by severity over time
- **Activity Timeline** — Chronological log of movements, alerts, communications, system events, and intelligence updates
- **Asset Tracker Sidebar** — Collapsible entity list organized by classification with real-time speed/heading data
- **Simulation Engine** — Client-side data generation with pause/resume controls for demonstration

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HEADER BAR                              │
│  Shield Icon │ Title │ Zulu Clock │ Sim Control │ Status    │
├──────┬──────────────────────┬──────────┬───────────────────┤
│      │                      │  ALERT   │    ACTIVITY       │
│ SIDE │    TACTICAL MAP      │  FEED    │    TIMELINE       │
│ BAR  │    (Leaflet)         │          │                   │
│      │                      │          │                   │
│      │                      │          │                   │
├──────┴──────────┬───────────┴──────────┴───────────────────┤
│  THROUGHPUT     │  ALERT FREQUENCY    │  SYSTEM HEALTH     │
│  CHART          │  CHART              │  CARDS             │
└─────────────────┴─────────────────────┴────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, Static Export) |
| Language | TypeScript |
| UI | React 18, Tailwind CSS |
| Mapping | Leaflet + react-leaflet |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |
| Deployment | GitHub Pages via GitHub Actions |

## Quick Start with Docker

```bash
# Clone and start
git clone https://github.com/osth0006/secure-c2-dashboard.git
cd secure-c2-dashboard
docker-compose up

# Access the dashboard at http://localhost:3000
```

The Docker build uses a multi-stage process (Node 20 Alpine) to produce a lightweight production image serving the static export via `serve`.

To rebuild after changes:

```bash
docker-compose up --build
```

## Getting Started (Local)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (static export)
npm run build

# Output is in ./out — deploy anywhere
```

## Static Demo Mode

This project is designed for static deployment (GitHub Pages). The simulation engine runs entirely client-side:

- Entity positions update every 2 seconds with realistic movement modeling
- Alerts generate stochastically with military-authentic templates
- System health metrics fluctuate within realistic bounds
- All data is deterministic from initial seed — no server required

Use the **PAUSE SIM / RESUME SIM** button in the header to control the simulation.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with dark theme
│   ├── page.tsx            # Main dashboard composition
│   └── globals.css         # Global styles + Leaflet overrides
├── components/
│   ├── Map/                # Leaflet tactical map with entity rendering
│   ├── DataFeed/           # Alert feed with severity filtering
│   ├── Charts/             # Recharts throughput + alert frequency
│   ├── StatusCards/        # System health metric cards
│   ├── Timeline/           # Chronological activity log
│   ├── Header/             # Top bar with clock + controls
│   └── Sidebar/            # Collapsible asset tracker
├── hooks/
│   └── useSimulation.ts    # Core simulation engine hook
├── lib/
│   ├── mock-data/          # Entity, alert, system, timeline generators
│   │   ├── entities.ts     # 10 initial entities with realistic callsigns
│   │   ├── alerts.ts       # 15 alert templates across all severities
│   │   ├── systems.ts      # 6 subsystem definitions
│   │   ├── timeline.ts     # 12 event templates across 5 categories
│   │   └── simulation.ts   # Position update + health mutation logic
│   └── utils.ts            # Formatting + color mapping utilities
└── types/
    └── index.ts            # Full TypeScript type definitions
```

## Design Decisions

- **Client-side simulation** over WebSocket server to enable GitHub Pages deployment without a backend
- **Leaflet over deck.gl** for broader compatibility and simpler integration with track rendering
- **Recharts over D3** for React-native chart components with built-in responsiveness
- **Dark CARTO tiles** for the tactical map to match the military aesthetic without custom tile hosting
- **Framer Motion** for smooth alert/timeline entry animations that enhance situational awareness

## Author

**osth0006** — Full-stack engineer focused on defense and national security applications.

## License

MIT
