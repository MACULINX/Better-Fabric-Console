import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');

export interface FilterRule {
  id: string;
  pattern: string; // regex pattern string
  type: 'include' | 'exclude' | 'highlight';
  highlightColor?: string; // hex color or standard name
  active: boolean;
}

export interface PluginState {
  sparkEnabled: boolean;
  consoleEnabled: boolean;
  sparkInstalled: boolean;
}

export interface AppConfig {
  serverName: string;
  hostPort: number;
  plugins: PluginState;
  filters: FilterRule[];
}

export interface SessionLog {
  id: string;
  timestamp: number;
  level: string;
  message: string;
  logger: string;
}

function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureFileExists(filePath: string, defaultContent: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, 'utf-8');
  }
}

export class Storage {
  private static paths = {
    config: path.join(DATA_DIR, 'config.json'),
    logs: path.join(DATA_DIR, 'session_logs.json'),
  };

  static init() {
    ensureDirectoryExists(DATA_DIR);

    const defaultConfig: AppConfig = {
      serverName: "Minecraft Server Mod",
      hostPort: 8000,
      plugins: {
        sparkEnabled: true,
        consoleEnabled: true,
        sparkInstalled: false
      },
      filters: [
        { id: '1', pattern: 'User Authenticator', type: 'exclude', active: false },
        { id: '2', pattern: 'issued server command', type: 'highlight', highlightColor: '#00f2fe', active: true },
        { id: '3', pattern: 'warn|error|fail', type: 'highlight', highlightColor: '#f43f5e', active: true }
      ]
    };

    ensureFileExists(this.paths.config, JSON.stringify(defaultConfig, null, 2));
    ensureFileExists(this.paths.logs, JSON.stringify([], null, 2));
  }

  private static readJson<T>(filePath: string): T {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return [] as unknown as T;
    }
  }

  private static writeJson<T>(filePath: string, data: T) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing ${filePath}:`, e);
    }
  }

  static getConfig(): AppConfig {
    return this.readJson<AppConfig>(this.paths.config);
  }

  static saveConfig(config: AppConfig) {
    this.writeJson(this.paths.config, config);
  }

  static getLogs(): SessionLog[] {
    return this.readJson<SessionLog[]>(this.paths.logs);
  }

  static saveLogs(logs: SessionLog[]) {
    this.writeJson(this.paths.logs, logs);
  }

  static appendLog(log: Omit<SessionLog, 'id'>) {
    const logs = this.getLogs();
    const newLog: SessionLog = {
      ...log,
      id: crypto.randomUUID(),
    };
    logs.push(newLog);
    // Keep last 500 logs in history file
    if (logs.length > 500) {
      logs.shift();
    }
    this.writeJson(this.paths.logs, logs);
    return newLog;
  }
}
