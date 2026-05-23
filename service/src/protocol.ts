export type PacketType =
  | 'capabilities' // Mod -> Service: reports sparkInstalled, sparkEnabled, consoleAvailable
  | 'metrics'      // Mod -> Service: sends spark readings (tps, cpu, mem)
  | 'log'          // Mod -> Service: streams console log lines
  | 'command'      // Service -> Mod: executes console command
  | 'toggle_plugin'// Service -> Mod: toggles mod plugins state
  | 'ping'         // Keep-alive checks
  | 'pong'
  | 'status'       // Service -> Client: broadcasts current state
  | 'filter_update';// Service -> Client/Mod: rule updates notifications

export interface CapabilitiesPacket {
  type: 'capabilities';
  sparkInstalled: boolean;
  sparkEnabled: boolean;
  consoleAvailable: boolean;
}

export interface MetricsPacket {
  type: 'metrics';
  tps10s: number;
  tps1m: number;
  cpuProcess: number;
  cpuSystem: number;
  usedMemory: number;
  maxMemory: number;
}

export interface LogPacket {
  type: 'log';
  timestamp: number;
  level: string;
  message: string;
  logger: string;
}

export interface TogglePluginPacket {
  type: 'toggle_plugin';
  plugin: 'spark' | 'console';
  enabled: boolean;
}

export interface CommandPacket {
  type: 'command';
  command: string;
}
