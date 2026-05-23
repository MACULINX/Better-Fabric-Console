import React from 'react';
import { CpuIcon, TerminalIcon, ShieldAlertIcon, CheckIcon } from './Icons';

interface Capabilities {
  sparkInstalled: boolean;
  sparkEnabled: boolean;
  consoleAvailable: boolean;
}

interface PluginsState {
  sparkEnabled: boolean;
  consoleEnabled: boolean;
}

interface PluginsProps {
  plugins: PluginsState;
  capabilities: Capabilities;
  onTogglePlugin: (pluginName: 'spark' | 'console', enabled: boolean) => void;
}

export const Plugins: React.FC<PluginsProps> = ({
  plugins,
  capabilities,
  onTogglePlugin,
}) => {
  return (
    <div className="plugins-view animate-fade-in">
      <div className="view-header">
        <h2>Plugin Integrations</h2>
        <p className="subtitle">Enable or disable server-side runtime monitoring and diagnostic features.</p>
      </div>

      <div className="plugins-list-grid">
        {/* Spark Integration Card */}
        <div className={`glass-card plugin-card ${!capabilities.sparkInstalled ? 'disabled-card' : ''}`}>
          <div className="plugin-card-header">
            <div className="plugin-meta">
              <div className="plugin-icon-wrapper bg-cyan-muted">
                <CpuIcon size={24} className="text-cyan" />
              </div>
              <div>
                <h3>Spark Metrics</h3>
                <span className="subtitle font-mono">space.lucko.spark</span>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={plugins.sparkEnabled}
                disabled={!capabilities.sparkInstalled}
                onChange={(e) => onTogglePlugin('spark', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="plugin-card-body">
            <p>Provides real-time JVM metrics, memory allocation details, process and host CPU percentages, and Ticks Per Second (TPS) diagnostics.</p>
            
            <div className="status-indicator-box">
              {capabilities.sparkInstalled ? (
                <div className="indicator-row text-green">
                  <CheckIcon size={16} />
                  <span>Spark API detected on Minecraft classpath.</span>
                </div>
              ) : (
                <div className="indicator-row text-red">
                  <ShieldAlertIcon size={16} />
                  <span>Spark API not found. Please install the Spark mod (.jar) on your Fabric server.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Console Log Capture Card */}
        <div className="glass-card plugin-card">
          <div className="plugin-card-header">
            <div className="plugin-meta">
              <div className="plugin-icon-wrapper bg-purple-muted">
                <TerminalIcon size={24} className="text-purple" />
              </div>
              <div>
                <h3>Log4j2 Console Capture</h3>
                <span className="subtitle font-mono">com.mbucci.console</span>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={plugins.consoleEnabled}
                onChange={(e) => onTogglePlugin('console', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="plugin-card-body">
            <p>Intercepts the Minecraft server root Log4j2 output stream and pipes log events dynamically to the Web UI console view via WebSockets.</p>
            
            <div className="status-indicator-box">
              {capabilities.consoleAvailable ? (
                <div className="indicator-row text-green">
                  <CheckIcon size={16} />
                  <span>Console capture engine is active and recording.</span>
                </div>
              ) : (
                <div className="indicator-row text-yellow">
                  <ShieldAlertIcon size={16} />
                  <span>Log4j2 Console Capture is currently suspended by the mod.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
