"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, XCircle, RefreshCw, Server, Database, Wifi, Clock, Cpu } from "lucide-react";

interface ServiceStatus {
  status: "up" | "down" | "unknown";
  responseTimeMs?: number;
  details?: Record<string, unknown>;
}

interface HealthData {
  status: string;
  timestamp: string;
  version?: string;
  services: {
    backendApi?: ServiceStatus;
    actuatorHealth?: ServiceStatus;
    webSocket?: ServiceStatus;
  };
}

interface BackendHealthData {
  status: string;
  timestamp: string;
  services?: {
    database?: ServiceStatus & { type?: string };
    redis?: ServiceStatus;
  };
  jvm?: {
    heapUsedMB?: number;
    heapMaxMB?: number;
    availableProcessors?: number;
    uptimeMs?: number;
  };
}

function StatusBadge({ status }: { status: "up" | "down" | "unknown" | "healthy" | "degraded" | "ok" }) {
  const isUp = status === "up" || status === "healthy" || status === "ok";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
      isUp
        ? "bg-green-50 text-green-700 border border-green-200"
        : status === "unknown"
        ? "bg-gray-50 text-gray-500 border border-gray-200"
        : "bg-red-50 text-red-700 border border-red-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isUp ? "bg-green-500" : status === "unknown" ? "bg-gray-400" : "bg-red-500"
      }`} />
      {isUp ? "Healthy" : status === "unknown" ? "Unknown" : "Down"}
    </span>
  );
}

function ServiceCard({ title, icon: Icon, status, responseTime, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "up" | "down" | "unknown";
  responseTime?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            status === "up" ? "bg-green-50" : status === "unknown" ? "bg-gray-50" : "bg-red-50"
          }`}>
            <Icon className={`w-5 h-5 ${
              status === "up" ? "text-green-600" : status === "unknown" ? "text-gray-400" : "text-red-600"
            }`} />
          </div>
          <div>
            <h3 className="font-medium text-sm text-gray-900">{title}</h3>
            {responseTime !== undefined && (
              <p className="text-xs text-gray-500">{responseTime}ms response</p>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      {children && <div className="text-sm text-gray-600">{children}</div>}
    </div>
  );
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

export default function HealthPage() {
  const [adminHealth, setAdminHealth] = useState<HealthData | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const [adminRes, backendRes] = await Promise.allSettled([
        fetch("/api/health/detailed").then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/admin/health`, {
          credentials: "include",
        }).then(r => r.json()).catch(() => null),
      ]);

      if (adminRes.status === "fulfilled") setAdminHealth(adminRes.value);
      if (backendRes.status === "fulfilled" && backendRes.value) setBackendHealth(backendRes.value);

      setLastChecked(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallStatus = adminHealth?.status === "ok" || adminHealth?.status === "healthy"
    ? "Operational" : adminHealth ? "Degraded" : "Checking...";

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">System Health</h1>
          </div>
          <p className="text-sm text-gray-500">Monitor the status of all services</p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-gray-400">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
        overallStatus === "Operational"
          ? "bg-green-50 border border-green-200"
          : overallStatus === "Degraded"
          ? "bg-yellow-50 border border-yellow-200"
          : "bg-gray-50 border border-gray-200"
      }`}>
        {overallStatus === "Operational" ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : overallStatus === "Degraded" ? (
          <XCircle className="w-5 h-5 text-yellow-600" />
        ) : (
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        )}
        <div>
          <p className="font-medium text-sm">
            {overallStatus === "Operational" ? "All Systems Operational" :
             overallStatus === "Degraded" ? "Some Services Degraded" :
             "Checking services..."}
          </p>
          {adminHealth?.timestamp && (
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(adminHealth.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ServiceCard
          title="Backend API"
          icon={Server}
          status={adminHealth?.services?.backendApi?.status || "unknown"}
          responseTime={adminHealth?.services?.backendApi?.responseTimeMs}
        >
          <p className="text-xs text-gray-400">Core API server</p>
        </ServiceCard>

        <ServiceCard
          title="Database (PostgreSQL)"
          icon={Database}
          status={backendHealth?.services?.database?.status || "unknown"}
          responseTime={backendHealth?.services?.database?.responseTimeMs}
        >
          <p className="text-xs text-gray-400">Primary data store</p>
        </ServiceCard>

        <ServiceCard
          title="Redis Cache"
          icon={Cpu}
          status={backendHealth?.services?.redis?.status || "unknown"}
          responseTime={backendHealth?.services?.redis?.responseTimeMs}
        >
          <p className="text-xs text-gray-400">Sessions & caching</p>
        </ServiceCard>

        <ServiceCard
          title="WebSocket"
          icon={Wifi}
          status={adminHealth?.services?.webSocket?.status || "unknown"}
          responseTime={adminHealth?.services?.webSocket?.responseTimeMs}
        >
          <p className="text-xs text-gray-400">Real-time events</p>
        </ServiceCard>
      </div>

      {/* JVM Metrics (if backend health available) */}
      {backendHealth?.jvm && (
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <h3 className="font-medium text-sm text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Backend JVM Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {backendHealth.jvm.uptimeMs !== undefined && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Uptime</p>
                <p className="text-sm font-medium">{formatUptime(backendHealth.jvm.uptimeMs)}</p>
              </div>
            )}
            {backendHealth.jvm.heapUsedMB !== undefined && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Heap Used</p>
                <p className="text-sm font-medium">{backendHealth.jvm.heapUsedMB} MB</p>
              </div>
            )}
            {backendHealth.jvm.heapMaxMB !== undefined && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Heap Max</p>
                <p className="text-sm font-medium">{backendHealth.jvm.heapMaxMB} MB</p>
              </div>
            )}
            {backendHealth.jvm.availableProcessors !== undefined && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">CPUs</p>
                <p className="text-sm font-medium">{backendHealth.jvm.availableProcessors}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
