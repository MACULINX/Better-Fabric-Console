import React from 'react';
import { ActivityIcon, CpuIcon, ServerIcon, ShieldAlertIcon } from './Icons';
import { QuickActions } from './QuickActions';
import type { QuickAction } from './QuickActions';

interface Capabilities {
  sparkInstalled: boolean;
  sparkEnabled: boolean;
  consoleAvailable: boolean;
}

interface Metrics {
  tps10s: number;
  tps1m: number;
  cpuProcess: number;
  cpuSystem: number;
  usedMemory: number;
  maxMemory: number;
  timestamp: number;
}

interface DashboardProps {
  modConnected: boolean;
  capabilities: Capabilities;
  metrics: Metrics | null;
  serverName: string;
  quickActions: QuickAction[];
  onSendCommand: (command: string) => void;
  onAddQuickAction: (action: Omit<QuickAction, 'id'>) => void;
  onDeleteQuickAction: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  modConnected,
  capabilities,
  metrics,
  serverName,
  quickActions,
  onSendCommand,
  onAddQuickAction,
  onDeleteQuickAction,
}) => {
  const getTpsColor = (tps: number) => {
    if (tps >= 19.5) return 'text-cyan';
    if (tps >= 18.0) return 'text-green';
    if (tps >= 15.0) return 'text-yellow';
    return 'text-red';
  };

  const getMemoryPercentage = () => {
    if (!metrics) return 0;
    return Math.min(100, Math.round((metrics.usedMemory / metrics.maxMemory) * 100));
  };

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="view-header">
        <h2>Dashboard Overview</h2>
        <span className={`status-badge ${modConnected ? 'online' : 'offline'}`}>
          <span className="pulse-dot"></span>
          {modConnected ? 'Mod Connected' : 'Mod Offline'}
        </span>
      </div>

      {/* Hero Server Details */}
      <div className="glass-card server-info-hero">
        <ServerIcon size={40} className="text-cyan animate-pulse" />
        <div className="hero-text">
          <h3>{serverName}</h3>
          <p className="subtitle">Fabric Server 1.26.2 • Active Companion Web Service</p>
        </div>
      </div>

      {/* If Mod is disconnected, display warning */}
      {!modConnected && (
        <div className="warning-banner glass-card border-red">
          <ShieldAlertIcon size={24} className="text-red" />
          <div>
            <h4>Mod Connection Offline</h4>
            <p>The companion Fabric mod on the Minecraft server is not connected. Metrics and console log updates are currently paused. Make sure the server is running and the mod can resolve ws://127.0.0.1:8000/ws.</p>
          </div>
        </div>
      )}

      {/* Spark Metrics Grid - Dynamic Visibility */}
      {capabilities.sparkEnabled ? (
        <div className="metrics-grid">
          {/* TPS Card */}
          <div className="glass-card metric-card">
            <div className="metric-header">
              <span>Ticks Per Second (TPS)</span>
              <ActivityIcon className="text-cyan" />
            </div>
            {metrics ? (
              <div className="metric-body">
                <div className="tps-display">
                  <span className={`tps-val ${getTpsColor(metrics.tps10s)}`}>
                    {metrics.tps10s.toFixed(2)}
                  </span>
                  <span className="tps-label">10s avg</span>
                </div>
                <div className="tps-sub">
                  <span>1m average:</span>
                  <strong className={getTpsColor(metrics.tps1m)}>
                    {metrics.tps1m.toFixed(2)}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="loading-placeholder">
                <div className="spinner"></div>
                <p>Waiting for Spark metrics...</p>
              </div>
            )}
          </div>

          {/* CPU Card */}
          <div className="glass-card metric-card">
            <div className="metric-header">
              <span>CPU Usage</span>
              <CpuIcon className="text-cyan" />
            </div>
            {metrics ? (
              <div className="metric-body">
                <div className="cpu-bars">
                  <div className="cpu-row">
                    <span className="label">Minecraft Process</span>
                    <div className="bar-wrapper">
                      <div 
                        className="bar fill-cyan" 
                        style={{ width: `${Math.min(100, metrics.cpuProcess)}%` }}
                      ></div>
                    </div>
                    <span className="value">{metrics.cpuProcess.toFixed(1)}%</span>
                  </div>
                  <div className="cpu-row">
                    <span className="label">Host System</span>
                    <div className="bar-wrapper">
                      <div 
                        className="bar fill-purple" 
                        style={{ width: `${Math.min(100, metrics.cpuSystem)}%` }}
                      ></div>
                    </div>
                    <span className="value">{metrics.cpuSystem.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-placeholder">
                <div className="spinner"></div>
                <p>Waiting for CPU load...</p>
              </div>
            )}
          </div>

          {/* Memory Card */}
          <div className="glass-card metric-card">
            <div className="metric-header">
              <span>JVM Memory Allocation</span>
              <ServerIcon className="text-cyan" />
            </div>
            {metrics ? (
              <div className="metric-body">
                <div className="mem-display">
                  <span className="mem-val text-cyan">
                    {metrics.usedMemory.toFixed(0)} <small>MB</small>
                  </span>
                  <span className="mem-slash">/</span>
                  <span className="mem-max">
                    {metrics.maxMemory.toFixed(0)} MB
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${getMemoryPercentage()}%` }}
                  ></div>
                </div>
                <span className="mem-percent subtitle">{getMemoryPercentage()}% allocated memory in use</span>
              </div>
            ) : (
              <div className="loading-placeholder">
                <div className="spinner"></div>
                <p>Waiting for memory usage...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* If Spark plugin is disabled, show graceful explanation instead of crashing */
        <div className="glass-card spark-disabled-notice">
          <ActivityIcon size={32} className="text-purple-muted" />
          <h3>Performance Metrics Unavailable</h3>
          <p>
            {!capabilities.sparkInstalled 
              ? "The Spark mod is not installed on this Minecraft server. Install Spark to enable real-time CPU, memory, and TPS monitoring."
              : "The Spark metrics plugin is disabled. You can enable it in the Plugins management view to stream real-time CPU, memory, and TPS stats."
            }
          </p>
        </div>
      )}

      {/* Quick Actions Panel */}
      <QuickActions
        quickActions={quickActions}
        onSendCommand={onSendCommand}
        onAddQuickAction={onAddQuickAction}
        onDeleteQuickAction={onDeleteQuickAction}
      />
    </div>
  );
};
