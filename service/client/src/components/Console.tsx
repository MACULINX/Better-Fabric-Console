import React, { useState, useEffect, useRef } from 'react';
import { TerminalIcon, CopyIcon, PlayIcon } from './Icons';

interface LogLine {
  id: string;
  timestamp: number;
  level: string;
  message: string;
  logger: string;
  highlight?: boolean;
  highlightColor?: string;
}

interface ConsoleProps {
  logs: LogLine[];
  onSendCommand: (command: string) => void;
  modConnected: boolean;
}

export const Console: React.FC<ConsoleProps> = ({
  logs,
  onSendCommand,
  modConnected,
}) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const consoleBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when logs change if enabled
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    onSendCommand(command);
    
    // Add to history
    const updatedHistory = [command, ...commandHistory.filter(c => c !== command)].slice(0, 50);
    setCommandHistory(updatedHistory);
    setHistoryIndex(-1);
    setCommand('');
  };

  // Keyboard navigation for command history (Up/Down Arrow)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setCommand(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setCommand(commandHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const copyLogs = () => {
    const rawText = logs.map(l => `[${formatTime(l.timestamp)}] [${l.level}] [${l.logger}]: ${l.message}`).join('\n');
    navigator.clipboard.writeText(rawText);
    alert('Console logs copied to clipboard!');
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour12: false });
  };

  const getLogLevelClass = (level: string) => {
    const lvl = level.toUpperCase();
    if (lvl.includes('WARN')) return 'level-warn';
    if (lvl.includes('ERROR') || lvl.includes('FATAL')) return 'level-error';
    if (lvl.includes('DEBUG')) return 'level-debug';
    return 'level-info';
  };

  // Minecraft section sign color parser (§)
  const renderMessage = (text: string) => {
    if (!text.includes('§')) return text;
    
    const parts = text.split('§');
    return (
      <>
        {parts[0]}
        {parts.slice(1).map((part, idx) => {
          if (part.length === 0) return null;
          const code = part[0].toLowerCase();
          const rest = part.slice(1);
          
          let className = '';
          switch (code) {
            case '0': className = 'mc-black'; break;
            case '1': className = 'mc-dark-blue'; break;
            case '2': className = 'mc-dark-green'; break;
            case '3': className = 'mc-dark-aqua'; break;
            case '4': className = 'mc-dark-red'; break;
            case '5': className = 'mc-dark-purple'; break;
            case '6': className = 'mc-gold'; break;
            case '7': className = 'mc-gray'; break;
            case '8': className = 'mc-dark-gray'; break;
            case '9': className = 'mc-blue'; break;
            case 'a': className = 'mc-green'; break;
            case 'b': className = 'mc-aqua'; break;
            case 'c': className = 'mc-red'; break;
            case 'd': className = 'mc-light-purple'; break;
            case 'e': className = 'mc-yellow'; break;
            case 'f': className = 'mc-white'; break;
            case 'l': className = 'mc-bold'; break;
            case 'o': className = 'mc-italic'; break;
            case 'r': className = 'mc-reset'; break;
            default: return '§' + part;
          }
          return <span key={idx} className={className}>{rest}</span>;
        })}
      </>
    );
  };

  return (
    <div className="console-view animate-fade-in">
      <div className="view-header">
        <h2>Live Server Console</h2>
        <div className="console-controls">
          <label className="checkbox-control">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)} 
            />
            <span>Auto-Scroll</span>
          </label>
          <button type="button" className="btn btn-secondary btn-small" onClick={copyLogs}>
            <CopyIcon size={14} />
            Copy Logs
          </button>
        </div>
      </div>

      <div className="console-box" ref={consoleBodyRef}>
        <div className="console-content">
          {logs.length === 0 ? (
            <div className="console-empty">
              <TerminalIcon size={40} className="text-purple-muted" />
              <p>Console buffer is empty. Waiting for logs...</p>
            </div>
          ) : (
            logs.map((log) => {
              const highlightStyle = log.highlight && log.highlightColor 
                ? { backgroundColor: `${log.highlightColor}1A`, borderLeft: `3px solid ${log.highlightColor}` } 
                : {};
              
              return (
                <div 
                  key={log.id} 
                  className={`console-line ${log.highlight ? 'highlighted-line' : ''}`}
                  style={highlightStyle}
                >
                  <span className="log-time">[{formatTime(log.timestamp)}]</span>
                  <span className={`log-level ${getLogLevelClass(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="log-logger">[{log.logger}]</span>
                  <span className="log-msg">{renderMessage(log.message)}</span>
                </div>
              );
            })
          )}
          <div ref={consoleEndRef}></div>
        </div>
      </div>

      <form className="console-input-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <span className="prompt-symbol">&gt;</span>
          <input
            type="text"
            className="form-control console-input"
            placeholder={
              !modConnected 
                ? "Server bridge is offline..." 
                : "Type a command (e.g. op name, help) and press Enter..."
            }
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!modConnected}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={!modConnected || !command.trim()}
          >
            <PlayIcon size={16} />
            Run
          </button>
        </div>
      </form>
    </div>
  );
};
