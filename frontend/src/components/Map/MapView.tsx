'use client';

import { useEffect, useRef, useState } from 'react';
import { Entity } from '@/types';
import { categoryColor } from '@/lib/utils';

interface MapViewProps {
  entities: Entity[];
  selectedEntityId?: string | null;
  onSelectEntity?: (entity: Entity) => void;
}

export default function MapView({ entities, selectedEntityId, onSelectEntity }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const tracksRef = useRef<Map<string, L.Polyline>>(new Map());
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const LRef = useRef<typeof import('leaflet') | null>(null);

  // Dynamically import Leaflet (client-side only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled) return;
      LRef.current = L;
      setLeafletLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = LRef.current!;

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  // Update entity markers
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    const currentIds = new Set(entities.map((e) => e.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });
    tracksRef.current.forEach((track, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(track);
        tracksRef.current.delete(id);
      }
    });

    entities.forEach((entity) => {
      const color = categoryColor(entity.category);
      const isSelected = entity.id === selectedEntityId;
      const pos: L.LatLngExpression = [entity.position.lat, entity.position.lng];

      // Update or create marker
      let marker = markersRef.current.get(entity.id);
      if (marker) {
        marker.setLatLng(pos);
        marker.setStyle({
          radius: isSelected ? 10 : 6,
          weight: isSelected ? 3 : 2,
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.8 : 0.5,
        });
      } else {
        marker = L.circleMarker(pos, {
          radius: isSelected ? 10 : 6,
          weight: isSelected ? 3 : 2,
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.8 : 0.5,
        });
        marker.bindTooltip(
          `<div class="font-mono text-xs">
            <div class="font-bold">${entity.callsign}</div>
            <div>${entity.category.toUpperCase()}</div>
            <div>${entity.speed > 0 ? Math.round(entity.speed) + ' KTS' : 'STATIC'} • HDG ${Math.round(entity.heading)}°</div>
            ${entity.altitude > 0 ? `<div>ALT ${entity.altitude.toLocaleString()} FT</div>` : ''}
          </div>`,
          { direction: 'top', offset: [0, -10], className: 'c2-tooltip' }
        );
        marker.on('click', () => onSelectEntity?.(entity));
        marker.addTo(map);
        markersRef.current.set(entity.id, marker);
      }

      // Update track lines
      if (entity.track.length > 1) {
        const latlngs = entity.track.map((t) => [t.lat, t.lng] as L.LatLngExpression);
        let track = tracksRef.current.get(entity.id);
        if (track) {
          track.setLatLngs(latlngs);
        } else {
          track = L.polyline(latlngs, {
            color,
            weight: 1.5,
            opacity: 0.4,
            dashArray: '4 4',
          }).addTo(map);
          tracksRef.current.set(entity.id, track);
        }
      }
    });
  }, [entities, selectedEntityId, onSelectEntity, leafletLoaded]);

  return (
    <div className="relative w-full h-full">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 z-[1000] bg-c2-panel/90 backdrop-blur-sm border border-c2-border rounded px-3 py-2">
        <div className="text-[10px] font-bold tracking-wider text-c2-muted mb-1.5">DATA SOURCES</div>
        <div className="flex flex-col gap-1">
          {[
            { color: '#3b82f6', label: 'AIS VESSELS' },
            { color: '#f59e0b', label: 'ADS-B AIRCRAFT' },
            { color: '#8b5cf6', label: 'SATELLITES' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-c2-text">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 z-[1000] text-[10px] text-c2-muted font-mono">
        ENTITIES TRACKED: {entities.length}
      </div>
    </div>
  );
}
