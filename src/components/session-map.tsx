"use client";

import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { SecuritySession } from "@/lib/api";

// World map TopoJSON - using a CDN-hosted file
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface SessionMapProps {
  sessions: SecuritySession[];
  className?: string;
}

export function SessionMap({ sessions, className = "" }: SessionMapProps) {
  // Get sessions with valid coordinates
  const validSessions = useMemo(() => {
    return sessions.filter((s) => s.latitude != null && s.longitude != null);
  }, [sessions]);

  // Group sessions by approximate location to show counts
  const groupedLocations = useMemo(() => {
    const groups = new Map<
      string,
      { lat: number; lng: number; count: number; sessions: SecuritySession[]; hasFlagged: boolean }
    >();

    validSessions.forEach((session) => {
      // Round to group nearby sessions (within ~100km)
      const key = `${Math.round(session.latitude! * 10) / 10}-${Math.round(session.longitude! * 10) / 10}`;
      const existing = groups.get(key);
      const isFlagged = session.flaggedVpn || session.flaggedProxy;

      if (existing) {
        existing.count++;
        existing.sessions.push(session);
        if (isFlagged) existing.hasFlagged = true;
      } else {
        groups.set(key, {
          lat: session.latitude!,
          lng: session.longitude!,
          count: 1,
          sessions: [session],
          hasFlagged: isFlagged,
        });
      }
    });

    return Array.from(groups.values());
  }, [validSessions]);

  return (
    <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 30],
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#334155" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Session markers */}
          {groupedLocations.map((loc, i) => (
            <Marker key={i} coordinates={[loc.lng, loc.lat]}>
              {/* Pulse ring animation */}
              <circle
                r={8}
                fill="none"
                stroke={loc.hasFlagged ? "#ef4444" : "#22c55e"}
                strokeWidth={1}
                opacity={0.5}
              >
                <animate
                  attributeName="r"
                  from="4"
                  to="12"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Main dot */}
              <circle
                r={loc.count > 1 ? 6 : 4}
                fill={loc.hasFlagged ? "#ef4444" : "#22c55e"}
                stroke="#fff"
                strokeWidth={1}
              />

              {/* Count badge for multiple sessions */}
              {loc.count > 1 && (
                <>
                  <circle cx={8} cy={-6} r={7} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
                  <text
                    x={8}
                    y={-3}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="bold"
                    fill="#fff"
                  >
                    {loc.count}
                  </text>
                </>
              )}
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 bg-slate-800/80 backdrop-blur-sm rounded px-3 py-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Flagged</span>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-3 right-3 bg-slate-800/80 backdrop-blur-sm rounded px-3 py-1.5 text-xs text-slate-300">
        {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
      </div>

      {/* No data messages */}
      {validSessions.length === 0 && sessions.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-slate-400 text-sm">
          Location data unavailable for current sessions
        </div>
      )}
      {sessions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-slate-400 text-sm">
          No active sessions
        </div>
      )}
    </div>
  );
}
