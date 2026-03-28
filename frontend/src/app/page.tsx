'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Entity } from '@/types';
import { useDashboard } from '@/hooks/useDashboard';
import Header from '@/components/Header/Header';
import Sidebar from '@/components/Sidebar/Sidebar';
import DataFeed from '@/components/DataFeed/DataFeed';
import StatusCards from '@/components/StatusCards/StatusCards';
import ThroughputChart from '@/components/Charts/ThroughputChart';
import AlertChart from '@/components/Charts/AlertChart';
import Timeline from '@/components/Timeline/Timeline';
import StockTicker from '@/components/StockTicker/StockTicker';

// Dynamically import map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-c2-bg">
      <div className="text-c2-muted text-xs font-mono animate-pulse">LOADING MAP...</div>
    </div>
  ),
});

export default function Dashboard() {
  const { state, loading, acknowledgeAlert } = useDashboard();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const handleSelectEntity = useCallback((entity: Entity) => {
    setSelectedEntityId((prev) => (prev === entity.id ? null : entity.id));
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-c2-bg">
        <div className="text-c2-accent text-sm font-mono animate-pulse">
          INITIALIZING SECURE C2 DASHBOARD...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-c2-bg">
      <Header
        connectionStatus={state.connectionStatus}
        ingestStatus={state.ingestStatus}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          entities={state.entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
        />

        <main className="flex-1 flex flex-col min-w-0">
          {/* Top row: Map + Alert Feed */}
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 border-r border-c2-border">
              <MapView
                entities={state.entities}
                selectedEntityId={selectedEntityId}
                onSelectEntity={handleSelectEntity}
              />
            </div>
            <div className="w-80 shrink-0 border-r border-c2-border">
              <DataFeed
                alerts={state.alerts}
                onAcknowledge={acknowledgeAlert}
              />
            </div>
            <div className="w-64 shrink-0">
              <Timeline events={state.timeline} />
            </div>
          </div>

          {/* Bottom row: Charts + System Health */}
          <div className="h-52 shrink-0 border-t border-c2-border flex">
            <div className="flex-1 border-r border-c2-border">
              <ThroughputChart data={state.throughput} />
            </div>
            <div className="flex-1 border-r border-c2-border">
              <AlertChart data={state.alertFrequency} />
            </div>
            <div className="w-96 shrink-0">
              <StatusCards systems={state.systems} />
            </div>
          </div>
        </main>
      </div>

      {/* Stock Ticker Footer */}
      <StockTicker stocks={state.stocks} />
    </div>
  );
}
