import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import { Storage, FilterRule, AppConfig, SessionLog } from './storage.js';
import { FilterEngine } from './filter.js';

// ES Module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Storage.init();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = 8000;

app.use(cors());
app.use(express.json());

// In-Memory cache for runtime data
let modSocket: WebSocket | null = null;
let currentMetrics: any = null;
let capabilities = {
  sparkInstalled: false,
  sparkEnabled: false,
  consoleAvailable: false,
};

// WebSocket Broadcast Helpers
const broadcastToClients = (data: any) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    // Only send to browser clients, not the mod itself
    if (client !== modSocket && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

const getStatusPayload = () => {
  const config = Storage.getConfig();
  return {
    type: 'status',
    modConnected: modSocket !== null && modSocket.readyState === WebSocket.OPEN,
    capabilities: {
      ...capabilities,
      sparkEnabled: capabilities.sparkInstalled && config.plugins.sparkEnabled,
      consoleAvailable: capabilities.consoleAvailable && config.plugins.consoleEnabled
    },
    metrics: currentMetrics,
    serverName: config.serverName,
  };
};

// REST API ROUTES

app.get('/api/status', (req, res) => {
  res.json(getStatusPayload());
});

app.get('/api/plugins', (req, res) => {
  const config = Storage.getConfig();
  res.json({
    plugins: config.plugins,
    capabilities,
  });
});

app.post('/api/plugins/toggle', (req, res) => {
  const { plugin, enabled } = req.body;
  if (plugin !== 'spark' && plugin !== 'console') {
    return res.status(400).json({ error: 'Invalid plugin name' });
  }

  const config = Storage.getConfig();
  if (plugin === 'spark') config.plugins.sparkEnabled = !!enabled;
  if (plugin === 'console') config.plugins.consoleEnabled = !!enabled;
  Storage.saveConfig(config);

  // Forward request to the Minecraft Fabric mod if connected
  if (modSocket && modSocket.readyState === WebSocket.OPEN) {
    modSocket.send(JSON.stringify({
      type: 'toggle_plugin',
      plugin,
      enabled: !!enabled
    }));
  }

  // Update capabilities state
  if (plugin === 'spark') capabilities.sparkEnabled = !!enabled;

  // Broadcast new status to all browsers
  broadcastToClients(getStatusPayload());
  res.json({ success: true, plugins: config.plugins });
});

app.get('/api/filters', (req, res) => {
  const config = Storage.getConfig();
  res.json(config.filters);
});

app.post('/api/filters', (req, res) => {
  const rules = req.body as FilterRule[];
  if (!Array.isArray(rules)) {
    return res.status(400).json({ error: 'Payload must be an array of rules' });
  }

  const config = Storage.getConfig();
  config.filters = rules;
  Storage.saveConfig(config);

  // Notify clients of rule changes
  broadcastToClients({
    type: 'filter_update',
    filters: config.filters
  });

  res.json({ success: true, filters: config.filters });
});

app.get('/api/session', (req, res) => {
  const config = Storage.getConfig();
  const rawLogs = Storage.getLogs();

  // Apply filters to history logs
  const filteredLogs = rawLogs
    .map(log => {
      const evaluation = FilterEngine.evaluate(log, config.filters);
      return {
        ...log,
        show: evaluation.show,
        highlight: evaluation.highlight,
        highlightColor: evaluation.color
      };
    })
    .filter(log => log.show);

  res.json(filteredLogs);
});

app.get('/api/config', (req, res) => {
  res.json(Storage.getConfig());
});

app.post('/api/config', (req, res) => {
  const { serverName } = req.body;
  const config = Storage.getConfig();
  if (serverName) config.serverName = serverName;
  Storage.saveConfig(config);

  broadcastToClients(getStatusPayload());
  res.json({ success: true, config });
});

// Serve frontend build static files
const clientPath = path.join(__dirname, 'public');
app.use(express.static(clientPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(clientPath, 'index.html'));
});

// WEBSOCKET HANDLE UPGRADE

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const clientType = url.searchParams.get('type'); // 'mod' or 'client'

  if (clientType === 'mod') {
    console.log('[Service] Minecraft Fabric Mod connected via WS.');
    modSocket = ws;
    broadcastToClients({ type: 'mod_connected', status: true });

    // Synchronize mod plugins state with stored configuration
    const config = Storage.getConfig();
    ws.send(JSON.stringify({
      type: 'toggle_plugin',
      plugin: 'spark',
      enabled: config.plugins.sparkEnabled
    }));
    ws.send(JSON.stringify({
      type: 'toggle_plugin',
      plugin: 'console',
      enabled: config.plugins.consoleEnabled
    }));

    ws.on('message', (messageData) => {
      try {
        const packet = JSON.parse(messageData.toString());

        if (packet.type === 'capabilities') {
          capabilities = {
            sparkInstalled: !!packet.sparkInstalled,
            sparkEnabled: !!packet.sparkEnabled,
            consoleAvailable: !!packet.consoleAvailable,
          };
          console.log('[Service] Mod Capabilities updated:', capabilities);
          broadcastToClients(getStatusPayload());
        }

        else if (packet.type === 'metrics') {
          currentMetrics = {
            tps10s: packet.tps10s,
            tps1m: packet.tps1m,
            cpuProcess: packet.cpuProcess,
            cpuSystem: packet.cpuSystem,
            usedMemory: packet.usedMemory,
            maxMemory: packet.maxMemory,
            timestamp: Date.now()
          };
          broadcastToClients({ type: 'metrics', metrics: currentMetrics });
        }

        else if (packet.type === 'log') {
          const newLog: Omit<SessionLog, 'id'> = {
            timestamp: packet.timestamp || Date.now(),
            level: packet.level || 'INFO',
            message: packet.message,
            logger: packet.logger || 'root',
          };

          // Save to local file history
          const savedLog = Storage.appendLog(newLog);

          // Apply regex rules before dispatching to browsers
          const config = Storage.getConfig();
          const evaluation = FilterEngine.evaluate(savedLog, config.filters);

          if (evaluation.show) {
            broadcastToClients({
              type: 'log',
              log: {
                ...savedLog,
                highlight: evaluation.highlight,
                highlightColor: evaluation.color
              }
            });
          }
        }
      } catch (e) {
        console.error('[Service] Failed to parse mod packet:', e);
      }
    });

    ws.on('close', () => {
      console.log('[Service] Minecraft Fabric Mod disconnected.');
      modSocket = null;
      currentMetrics = null;
      broadcastToClients(getStatusPayload());
    });
  } 
  
  else {
    // Standard Browser Client
    // Send current status, metrics, and logs immediately
    ws.send(JSON.stringify(getStatusPayload()));
    
    // Fetch logs and apply rules
    const config = Storage.getConfig();
    const filteredLogs = Storage.getLogs()
      .map(log => {
        const evaluation = FilterEngine.evaluate(log, config.filters);
        return {
          ...log,
          show: evaluation.show,
          highlight: evaluation.highlight,
          highlightColor: evaluation.color
        };
      })
      .filter(log => log.show);

    ws.send(JSON.stringify({ type: 'history', logs: filteredLogs }));

    ws.on('message', (messageData) => {
      try {
        const packet = JSON.parse(messageData.toString());

        if (packet.type === 'command') {
          if (modSocket && modSocket.readyState === WebSocket.OPEN) {
            // Forward command execute request to the Mod
            modSocket.send(JSON.stringify({
              type: 'command',
              command: packet.command
            }));
            console.log(`[Service] Forwarded command to Mod: /${packet.command}`);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Minecraft Mod bridge is offline. Cannot execute command.'
            }));
          }
        }
      } catch (e) {
        console.error('[Service] Client parsing error:', e);
      }
    });
  }
});

httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Better Fabric Console Service running on port ${PORT}`);
  console.log(`🖥️ Web UI accessible via http://localhost:${PORT}`);
  console.log(`====================================================`);
});
