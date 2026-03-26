'use client';

import { useState } from 'react';
import { Entity } from '@/types';
import { entityColor } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Ship,
  Users,
  Satellite,
  Crosshair,
} from 'lucide-react';

interface SidebarProps {
  entities: Entity[];
  onSelectEntity?: (entity: Entity) => void;
  selectedEntityId?: string | null;
}

const categoryIcon: Record<string, React.ReactNode> = {
  aircraft: <Plane className="w-4 h-4" />,
  vessel: <Ship className="w-4 h-4" />,
  'ground-unit': <Users className="w-4 h-4" />,
  satellite: <Satellite className="w-4 h-4" />,
  drone: <Crosshair className="w-4 h-4" />,
};

export default function Sidebar({ entities, onSelectEntity, selectedEntityId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const friendly = entities.filter((e) => e.type === 'friendly');
  const others = entities.filter((e) => e.type !== 'friendly');

  return (
    <aside
      className={`${
        collapsed ? 'w-12' : 'w-64'
      } bg-c2-panel border-r border-c2-border transition-all duration-300 flex flex-col shrink-0 overflow-hidden`}
    >
      <div className="flex items-center justify-between p-3 border-b border-c2-border">
        {!collapsed && (
          <span className="text-xs font-bold tracking-wider text-c2-muted">
            ASSET TRACKER
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-c2-muted hover:text-c2-text transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          <EntityGroup label="FRIENDLY FORCES" entities={friendly} onSelect={onSelectEntity} selectedId={selectedEntityId} />
          <EntityGroup label="OTHER CONTACTS" entities={others} onSelect={onSelectEntity} selectedId={selectedEntityId} />
        </div>
      )}
    </aside>
  );
}

function EntityGroup({
  label,
  entities,
  onSelect,
  selectedId,
}: {
  label: string;
  entities: Entity[];
  onSelect?: (entity: Entity) => void;
  selectedId?: string | null;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-bold tracking-wider text-c2-muted px-2 mb-1">{label}</h3>
      <div className="space-y-0.5">
        {entities.map((entity) => (
          <button
            key={entity.id}
            onClick={() => onSelect?.(entity)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
              selectedId === entity.id
                ? 'bg-c2-accent/20 border border-c2-accent/50'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <span style={{ color: entityColor(entity.type) }}>
              {categoryIcon[entity.category]}
            </span>
            <div className="text-left flex-1 min-w-0">
              <div className="font-mono font-bold text-c2-text truncate">
                {entity.callsign}
              </div>
              <div className="text-[10px] text-c2-muted">
                {entity.category.toUpperCase()} • {entity.speed > 0 ? `${Math.round(entity.speed)} KTS` : 'STATIC'}
              </div>
            </div>
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entityColor(entity.type) }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
