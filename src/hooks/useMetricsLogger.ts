import { useState, useCallback, useEffect, useRef } from 'react';

export type LogEntry = { id: string; time: string; message: string };

const STORAGE_KEY_LOGS = 'qms_logs';
const STORAGE_KEY_HEARTBEAT = 'qms_heartbeat';

export function useMetricsLogger() {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });
  
  const initialized = useRef(false);

  const addLog = useCallback((message: string) => {
    setLogs(prev => {
      const newLog = { 
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, 
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        message 
      };
      // Keep up to 200 logs to prevent memory/storage overflow over 16+ hours
      const nextLogs = [newLog, ...prev].slice(0, 200);
      try {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(nextLogs));
      } catch {
        // ignore storage errors
      }
      return nextLogs;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const lastHeartbeat = localStorage.getItem(STORAGE_KEY_HEARTBEAT);
      if (lastHeartbeat) {
        const lastTime = parseInt(lastHeartbeat, 10);
        const timeDiff = Date.now() - lastTime;
        // If diff > 15 seconds, we assume it crashed or rebooted unexpectedly
        if (timeDiff > 15000) {
          addLog(`[SYSTEM_RECOVERY] App restarted after unexpected close. Last heartbeat: ${Math.floor(timeDiff / 1000)}s ago.`);
        } else {
          addLog(`[SYSTEM_RESTART] App refreshed normally.`);
        }
      } else {
        addLog('System Logs Initialized for the first time.');
      }
    } catch {
      addLog('System Logs Initialized.');
    }

    const hbInterval = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY_HEARTBEAT, Date.now().toString());
      } catch {
        // ignore
      }
    }, 5000);

    return () => clearInterval(hbInterval);
  }, [addLog]);

  const runDiagnostics = useCallback(async () => {
    try {
      const ua = navigator.userAgent;
      const androidMatch = ua.match(/Android\s([0-9\.]+)/);
      const chromeMatch = ua.match(/(Chrome|CriOS|CrMo)\/([0-9\.]+)/);
      
      const os = androidMatch ? `Android ${androidMatch[1]}` : 'Unknown OS';
      const browser = chromeMatch ? `Chrome/WebView ${chromeMatch[2]}` : 'Unknown Browser';
      
      const cores = navigator.hardwareConcurrency || '?';
      const ram = (navigator as any).deviceMemory || '?';
      const conn = (navigator as any).connection;
      const network = conn ? `${conn.effectiveType || 'unknown'} (Downlink: ${conn.downlink || '?'}Mbps)` : 'Unknown';

      let storageStr = 'Unknown';
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          const quotaMB = Math.round((estimate.quota || 0) / 1024 / 1024);
          storageStr = `${quotaMB} MB (Browser Quota)`;
        } catch(e) {
           storageStr = 'Access Denied';
        }
      }

      addLog(`=== [ SYSTEM INFO ] ===`);
      addLog(`OS & Core: ${os} | ${browser}`);
      addLog(`Hardware: ${cores} Cores | ${ram} GB RAM (Est.)`);
      addLog(`Display: ${window.screen.width}x${window.screen.height} (Ratio: ${window.devicePixelRatio})`);
      addLog(`Network: ${network}`);
      addLog(`Storage: ${storageStr}`);
      addLog(`User-Agent: ${ua}`);
      addLog(`=====================`);
    } catch (err) {
      addLog(`Error fetching system info: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addLog]);

  return { logs, addLog, clearLogs, runDiagnostics };
}
