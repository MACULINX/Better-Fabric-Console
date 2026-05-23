import { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { Console } from './components/Console';
import { Filters } from './components/Filters';
import type { FilterRule } from './components/Filters';
import { Plugins } from './components/Plugins';
import type { QuickAction } from './components/QuickActions';
import {
  ActivityIcon,
  TerminalIcon,
  SlidersIcon,
  CpuIcon,
  ServerIcon,
  LockIcon,
  KeyIcon,
  ShieldAlertIcon,
  PowerIcon
} from './components/Icons';

type TabType = 'dashboard' | 'console' | 'filters' | 'plugins';

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

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [modConnected, setModConnected] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities>({
    sparkInstalled: false,
    sparkEnabled: false,
    consoleAvailable: false,
  });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [serverName, setServerName] = useState('Minecraft Server Mod');

  // Auth States
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('better_console_token'));
  const [authError, setAuthError] = useState<string | null>(null);

  // Setup Form States
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');

  // Login Form States
  const [loginPassword, setLoginPassword] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Custom fetch helper that appends Authorization header
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('better_console_token');
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      setAuthToken(null);
      localStorage.removeItem('better_console_token');
      throw new Error('Unauthorized');
    }
    return res;
  };

  // Check setup initialization on mount
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const res = await fetch('/api/setup-status');
        if (res.ok) {
          const status = await res.json();
          setSetupRequired(!status.initialized);
        }
      } catch (err) {
        console.error('Error checking setup status:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSetupStatus();
  }, []);

  // Fetch initial REST data when auth token is available
  useEffect(() => {
    if (!authToken || setupRequired) return;

    const fetchInitialData = async () => {
      try {
        const statusRes = await fetchWithAuth('/api/status');
        if (statusRes.ok) {
          const status = await statusRes.json();
          setModConnected(status.modConnected);
          setCapabilities(status.capabilities);
          setMetrics(status.metrics);
          setServerName(status.serverName);
        }

        const filtersRes = await fetchWithAuth('/api/filters');
        if (filtersRes.ok) {
          const filterData = await filtersRes.json();
          setFilters(filterData);
        }

        const actionsRes = await fetchWithAuth('/api/quick-actions');
        if (actionsRes.ok) {
          const actionsData = await actionsRes.json();
          setQuickActions(actionsData);
        }
      } catch (err) {
        console.error('Error fetching initial REST state:', err);
      }
    };

    fetchInitialData();
  }, [authToken, setupRequired]);

  // Connect WebSockets when authenticated
  useEffect(() => {
    if (!authToken || setupRequired) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [authToken, setupRequired]);

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws?type=client`;

    console.log(`Connecting Web WebSocket to: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established. Authenticating...');
      const token = localStorage.getItem('better_console_token') || '';
      ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        
        if (packet.type === 'auth_success') {
          console.log('WebSocket authenticated successfully.');
          setModConnected(true);
        }
        
        else if (packet.type === 'auth_failed') {
          console.error('WebSocket auth failed:', packet.error);
          setAuthToken(null);
          localStorage.removeItem('better_console_token');
          ws.close();
        }
        
        else if (packet.type === 'status') {
          setModConnected(packet.modConnected);
          setCapabilities(packet.capabilities);
          setMetrics(packet.metrics);
          setServerName(packet.serverName);
        } 
        
        else if (packet.type === 'mod_connected') {
          setModConnected(packet.status);
        } 
        
        else if (packet.type === 'metrics') {
          setMetrics(packet.metrics);
        } 
        
        else if (packet.type === 'history') {
          setLogs(packet.logs);
        } 
        
        else if (packet.type === 'log') {
          setLogs((prev) => {
            const next = [...prev, packet.log];
            if (next.length > 500) {
              next.shift();
            }
            return next;
          });
        } 
        
        else if (packet.type === 'filter_update') {
          setFilters(packet.filters);
        }
      } catch (err) {
        console.error('Error parsing WebSocket packet:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed. Retrying...');
      setModConnected(false);
      setMetrics(null);
      // Only retry if we are still authenticated
      if (localStorage.getItem('better_console_token')) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  };

  // Setup Handler
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (setupPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    if (setupPassword !== setupConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: setupPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSetupRequired(false);
        setSetupPassword('');
        setSetupConfirm('');
      } else {
        setAuthError(data.error || 'Setup failed.');
      }
    } catch (err) {
      setAuthError('Failed to connect to the server.');
    }
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('better_console_token', data.token);
        setAuthToken(data.token);
        setLoginPassword('');
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Failed to connect to the server.');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('better_console_token');
    setAuthToken(null);
    setModConnected(false);
    setMetrics(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Commands dispatching
  const handleSendCommand = (command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        command: command.startsWith('/') ? command.slice(1) : command
      }));
    }
  };

  // Toggles plugin states
  const handleTogglePlugin = async (plugin: 'spark' | 'console', enabled: boolean) => {
    try {
      const res = await fetchWithAuth('/api/plugins/toggle', {
        method: 'POST',
        body: JSON.stringify({ plugin, enabled })
      });
      if (res.ok) {
        // Update local capabilities
        setCapabilities((prev) => ({
          ...prev,
          sparkEnabled: plugin === 'spark' ? enabled : prev.sparkEnabled,
          consoleAvailable: plugin === 'console' ? enabled : prev.consoleAvailable
        }));
      }
    } catch (err) {
      console.error('Failed to toggle plugin state:', err);
    }
  };

  // Saves regex rules
  const handleSaveFilters = async (newFilters: FilterRule[]) => {
    try {
      const res = await fetchWithAuth('/api/filters', {
        method: 'POST',
        body: JSON.stringify(newFilters)
      });
      if (res.ok) {
        setFilters(newFilters);
      }
    } catch (err) {
      console.error('Failed to save filters:', err);
    }
  };

  // Quick Action Handlers
  const handleAddQuickAction = async (action: Omit<QuickAction, 'id'>) => {
    try {
      const res = await fetchWithAuth('/api/quick-actions', {
        method: 'POST',
        body: JSON.stringify(action)
      });
      if (res.ok) {
        // Reload list
        const actionsRes = await fetchWithAuth('/api/quick-actions');
        if (actionsRes.ok) {
          const data = await actionsRes.json();
          setQuickActions(data);
        }
      }
    } catch (err) {
      console.error('Failed to add quick action:', err);
    }
  };

  const handleDeleteQuickAction = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/quick-actions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Reload list
        const actionsRes = await fetchWithAuth('/api/quick-actions');
        if (actionsRes.ok) {
          const data = await actionsRes.json();
          setQuickActions(data);
        }
      }
    } catch (err) {
      console.error('Failed to delete quick action:', err);
    }
  };

  // Conditional screens before rendering Main dashboard
  if (checkingAuth) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-logo">
            <ServerIcon size={40} className="text-cyan animate-pulse" />
            <span className="auth-logo-text">Better Console</span>
          </div>
          <div className="loading-placeholder">
            <div className="spinner" style={{ margin: '20px auto' }}></div>
            <p>Verifying server settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (setupRequired) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-logo">
            <ServerIcon size={40} className="text-cyan" />
            <span className="auth-logo-text">Better Console</span>
          </div>
          <h2 className="auth-title">Setup Administrator</h2>
          <p className="auth-subtitle">Choose a master admin password to restrict access to this Minecraft server's console interface.</p>

          {authError && (
            <div className="auth-error">
              <ShieldAlertIcon size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSetup}>
            <div className="form-group">
              <label htmlFor="setup-password">Master Password</label>
              <div className="auth-input-icon-wrapper">
                <LockIcon className="auth-input-icon" size={18} />
                <input
                  id="setup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="setup-confirm">Confirm Password</label>
              <div className="auth-input-icon-wrapper">
                <KeyIcon className="auth-input-icon" size={18} />
                <input
                  id="setup-confirm"
                  type="password"
                  placeholder="Repeat master password"
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn">
              Create Admin Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-logo">
            <ServerIcon size={40} className="text-cyan" />
            <span className="auth-logo-text">Better Console</span>
          </div>
          <h2 className="auth-title">Dashboard Login</h2>
          <p className="auth-subtitle">Provide your administrator password to unlock console streaming and commands dispatching.</p>

          {authError && (
            <div className="auth-error">
              <ShieldAlertIcon size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-password">Admin Password</label>
              <div className="auth-input-icon-wrapper">
                <LockIcon className="auth-input-icon" size={18} />
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter master password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <ServerIcon size={24} className="text-cyan animate-pulse" />
          <span className="logo-text">Better Console</span>
        </div>

        <ul className="nav-links">
          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <ActivityIcon size={18} />
              <span>Dashboard</span>
            </button>
          </li>
          
          {capabilities.consoleAvailable && (
            <li>
              <button
                type="button"
                className={`nav-btn ${activeTab === 'console' ? 'active' : ''}`}
                onClick={() => setActiveTab('console')}
              >
                <TerminalIcon size={18} />
                <span>Console</span>
              </button>
            </li>
          )}

          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'filters' ? 'active' : ''}`}
              onClick={() => setActiveTab('filters')}
            >
              <SlidersIcon size={18} />
              <span>Filters</span>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={`nav-btn ${activeTab === 'plugins' ? 'active' : ''}`}
              onClick={() => setActiveTab('plugins')}
            >
              <CpuIcon size={18} />
              <span>Plugins</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="connection-status-panel">
            <span className="status-label">Minecraft Mod Link</span>
            <span className={`status-badge ${modConnected ? 'online' : 'offline'}`}>
              <span className="pulse-dot"></span>
              {modConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <button
            type="button"
            className="nav-btn btn-logout"
            onClick={handleLogout}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              color: 'var(--red)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            <PowerIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-server-name">
            <ServerIcon size={18} className="text-cyan" />
            <span>{serverName}</span>
          </div>
          <div className="header-meta">
            <span className="header-badge">MC 1.26.2</span>
          </div>
        </header>

        <section className="view-container">
          {activeTab === 'dashboard' && (
            <Dashboard
              modConnected={modConnected}
              capabilities={capabilities}
              metrics={metrics}
              serverName={serverName}
              quickActions={quickActions}
              onSendCommand={handleSendCommand}
              onAddQuickAction={handleAddQuickAction}
              onDeleteQuickAction={handleDeleteQuickAction}
            />
          )}

          {activeTab === 'console' && capabilities.consoleAvailable && (
            <Console
              logs={logs}
              onSendCommand={handleSendCommand}
              modConnected={modConnected}
            />
          )}

          {activeTab === 'filters' && (
            <Filters
              filters={filters}
              onSaveFilters={handleSaveFilters}
            />
          )}

          {activeTab === 'plugins' && (
            <Plugins
              plugins={{
                sparkEnabled: capabilities.sparkEnabled,
                consoleEnabled: capabilities.consoleAvailable,
              }}
              capabilities={capabilities}
              onTogglePlugin={handleTogglePlugin}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
