import React, { useEffect, useState } from 'react';
import { BellRing, Utensils, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';

export default function App() {
  const [time, setTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Queue state for demonstration
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  type QueueItem = {
    id: string;
    num: string;
    isNew?: boolean;
    orderType?: string;
    status?: string;
    uiState?: 'active' | 'inactive';
    timestamp?: number;
  };
  const [queue, setQueue] = useState<{ current: QueueItem | null; history: QueueItem[] }>({
    current: null,
    history: []
  });

  // Temporary Logger state for debugging (e.g. Barcode Scanning)
  type LogEntry = { id: string; time: string; message: string };
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => {
      const newLog = { 
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, 
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        message 
      };
      return [newLog, ...prev].slice(0, 100); // Keep last 100 logs
    });
  };

  // Run hardware diagnostics on mount
  useEffect(() => {
    addLog('System Logs Initialized. Waiting for events...');
  }, []);

  const runDiagnostics = async () => {
    try {
      const ua = navigator.userAgent;
      const androidMatch = ua.match(/Android\s([0-9\.]+)/);
      const chromeMatch = ua.match(/(Chrome|CriOS|CrMo)\/([0-9\.]+)/);
      
      const os = androidMatch ? `Android ${androidMatch[1]}` : 'Unknown OS';
      const browser = chromeMatch ? `Chrome/WebView ${chromeMatch[2]}` : 'Unknown Browser';
      
      // Extended Hardware Info (Using 'any' cast for non-standard APIs)
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
  };

  const handleScan = (scannedData: string) => {
    addLog(`[SCANNER] SUCCESS: ${scannedData}`);
    
    // Parse the input: Pickup_Number, Order_Type, Status
    const parts = scannedData.split(',');
    const num = parts[0]?.trim();
    const orderType = parts[1]?.trim() || '';
    const status = parts[2]?.trim() || '';

    if (!num) return;
    
    setQueue(prevQueue => {
      let newCurrent = prevQueue.current;
      let newHistory = [...prevQueue.history];

      const isCurrent = newCurrent?.num === num;
      const historyIndex = newHistory.findIndex(o => o.num === num);
      const existingHistory = historyIndex >= 0 ? newHistory[historyIndex] : null;

      const newItem: QueueItem = {
        id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        num,
        orderType,
        status,
        isNew: true,
      };

      if (status === '0') {
        // 狀態為0：徹底結單，直接從畫面移除
        if (isCurrent) newCurrent = null;
        if (existingHistory) newHistory.splice(historyIndex, 1);
      } else {
        if (!isCurrent && !existingHistory) {
          // 第一次掃描：進入「請取餐」(Current)
          if (newCurrent) {
            newHistory = [{ ...newCurrent, uiState: 'active', isNew: false }, ...newHistory].slice(0, 100);
          }
          newItem.timestamp = Date.now();
          newItem.uiState = 'active';
          newCurrent = newItem;
        } else {
          // 第二次掃描：不管是否在 Current 或 History，都直接從畫面完全移除結案
          if (isCurrent) newCurrent = null;
          if (existingHistory) newHistory.splice(historyIndex, 1);
        }
      }

      return {
        current: newCurrent,
        history: newHistory.map(item => ({ ...item, isNew: false }))
      };
    });
  };

  // 狀態維持與超時機制 (20秒與120秒規則)
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(prev => {
        const now = Date.now();
        let currentChanged = false;
        let historyChanged = false;

        let newCurrent = prev.current;
        let newHistory = [...prev.history];

        // 規則 1：請取餐區（Current）最久停留 20 秒，自動移至下方清單
        if (newCurrent && newCurrent.timestamp && (now - newCurrent.timestamp >= 20000)) {
          const finishedItem = { ...newCurrent, isNew: true };
          newHistory = [finishedItem, ...newHistory.map(item => ({...item, isNew: false}))].slice(0, 100);
          newCurrent = null;
          currentChanged = true;
          historyChanged = true;
        }

        // 規則 2：120 秒超時轉淡 (出現在請取餐與下方清單合計)
        const updatedHistory = newHistory.map(item => {
          if (item.uiState !== 'inactive' && item.timestamp && (now - item.timestamp >= 120000)) {
            historyChanged = true;
            return { ...item, uiState: 'inactive' as const };
          }
          return item;
        });

        if (currentChanged || historyChanged) {
          return { current: newCurrent, history: updatedHistory };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useBarcodeScanner({ onScan: handleScan });

  // History Pagination Logic
  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(queue.history.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (totalPages <= 1) {
      if (currentPage !== 0) setCurrentPage(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 3000);
    return () => clearInterval(interval);
  }, [totalPages, currentPage]);

  const displayedHistory = queue.history.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Simulate continuous random orders to demonstrate the live animation flow
  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    const prefixes = ['A', 'B', 'C'];
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const triggerNextOrder = () => {
      if (!isMounted) return;

      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomNum = Math.floor(Math.random() * 900) + 100; // 100 to 999
      const nextNum = `${randomPrefix}${randomNum}`;
      
      const nextItem: QueueItem = {
        id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Fallback generic random unique ID
        num: nextNum,
        timestamp: Date.now(),
        uiState: 'active'
      };
      
      setQueue(prevQueue => {
        let newHistory = [...prevQueue.history];
        if (prevQueue.current) {
           // Mark the item demoted to history as 'isNew: true', ensure old items are 'isNew: false'
           const finishedItem = { ...prevQueue.current, isNew: true };
           const olderHistory = newHistory.map(item => ({ ...item, isNew: false }));
           newHistory = [finishedItem, ...olderHistory].slice(0, 100);
        }
        return {
          current: nextItem,
          history: newHistory
        };
      });

      // Next delay randomly picked between 2000ms and 5000ms
      const nextDelay = Math.floor(Math.random() * 3000) + 2000;
      timerId = setTimeout(triggerNextOrder, nextDelay);
    };

    // Trigger the first one after a quick delay when turned on
    const initialDelay = Math.floor(Math.random() * 1000) + 500;
    timerId = setTimeout(triggerNextOrder, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [isDemoMode]);

  // Images for the ad section
  const adImage = "https://images.unsplash.com/photo-1544025162-8111140994d2?q=80&w=1280&h=720&auto=format&fit=crop";

  return (
    <div 
      className="h-screen w-screen flex flex-col p-6 gap-6 font-sans text-[#1A1A1A] bg-[#F8F7F2] overflow-hidden box-border"
      tabIndex={0}
    >
      
      {/* Upper Section: Main Visual and Queue Panel */}
      <div className="flex-1 flex flex-row gap-6 min-h-0">
        
        {/* Left Side: Temporary System Logs Viewer for Debugging */}
        <div className="w-[65%] h-full relative rounded-[32px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-[8px] border-white flex flex-col bg-[#1E1E1E] text-[#D4D4D4] p-6 font-mono">
          <div className="flex border-b border-[#333] pb-4 mb-4 items-center justify-between shrink-0">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               System Logs (Scanner Debugging)
             </h2>
             <div className="flex gap-2">
               {/* Button to run hardware diagnostics */}
               <button 
                 onClick={runDiagnostics} 
                 className="text-[13px] bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30 px-3 py-1.5 rounded-lg transition-colors font-bold"
               >
                 SYSTEM INFO
               </button>
               {/* A button to test the logger */}
               <button 
                 onClick={() => addLog('Test event triggered manually!')} 
                 className="text-[13px] bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 px-3 py-1.5 rounded-lg transition-colors font-bold"
               >
                 Test
               </button>
               <button 
                 onClick={() => setLogs([])} 
                 className="text-[13px] bg-[#333] text-white hover:bg-[#444] px-3 py-1.5 rounded-lg transition-colors"
               >
                 Clear Logs
               </button>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
             {logs.length === 0 ? (
               <div className="h-full flex items-center justify-center">
                 <p className="opacity-40 italic text-[16px]">Ready to receive barcode scanner input...</p>
               </div>
             ) : (
               logs.map(log => (
                 <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2">
                   <span className="text-[#888] shrink-0">[{log.time}]</span>
                   <span className="break-all text-white font-[500]">{log.message}</span>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Right Side: Vertical Panel for Queue Status */}
        <div className="w-[35%] h-full flex flex-col gap-[20px]">
          
          {/* Top Section: Pickup Now */}
          <div className="h-[40%] bg-white rounded-[28px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#22C55E]/10 p-[10px] rounded-full">
                <BellRing size={24} className="text-[#22C55E]" strokeWidth={3} />
              </div>
              <h2 className="text-[24px] font-[700] text-[#1A1A1A] m-0 flex items-baseline">
                請取餐 <span className="text-[16px] opacity-50 font-[500] ml-2 tracking-wide">PICKUP</span>
              </h2>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col justify-center items-center relative">
              <AnimatePresence>
                {queue.current && (
                  <motion.span
                    key={queue.current.id}
                    initial={{ opacity: 0, scale: 0.5, y: -40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1, transition: { duration: 0 } }}
                    transition={{ type: "spring", bounce: 0.75, duration: 1.2 }}
                    className="text-[120px] font-[800] text-[#22C55E] tracking-[-4px] leading-none absolute"
                  >
                    {queue.current.num}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Section: Completed History (No Header) */}
          <div className="flex-1 bg-[#E8E6E1] rounded-[28px] px-8 py-4 flex flex-col min-h-0 overflow-hidden shrink-0">
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pb-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${i === currentPage ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/20'}`} />
                ))}
              </div>
            )}
            <div className="flex-1 overflow-hidden flex flex-col justify-center">
               <div className="grid grid-cols-3 gap-y-[12px] gap-x-[12px] content-center text-left pl-2 h-full">
                  {displayedHistory.map((item, idx) => (
                    <motion.div 
                      layout
                      key={item.id}
                      initial={{ opacity: 0, x: -20, scale: 0.8 }}
                      animate={{ opacity: item.uiState === 'inactive' ? 0.2 : 0.8, x: 0, scale: 1 }}
                      transition={{ 
                        default: { type: "spring", bounce: 0.2, duration: 1.0 }
                      }}
                      className="flex items-center"
                    >
                      {/* Conditional rendering for color animation. The layout shifting won't trigger re-rendering of this specific inner element */}
                      <span 
                        className={`text-[36px] font-[800] tracking-[-1px] ${
                          item.isNew 
                            ? 'animate-[fadeToBlack_2s_ease-out_forwards] text-[#22C55E]' 
                            : 'text-[#1A1A1A]'
                        }`}
                      >
                        {item.num}
                      </span>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Bar: Information Strip */}
      <div className="h-[80px] bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 flex flex-row items-center px-[32px] relative shrink-0">
        
        {/* System Name / Logo */}
        <div className="flex items-center gap-4 pr-[24px] border-r border-[#EFEBE4] shrink-0 z-10 bg-white">
          <div className="w-[36px] h-[36px] bg-[#3D2B1F] rounded-[8px] flex items-center justify-center text-white font-[900] text-[18px]">
            Q
          </div>
          <span className="font-[800] text-[18px] tracking-[-0.5px] text-[#1A1A1A]">QMS v1.1.11</span>
        </div>

        {/* Demo Switch */}
        <div className="flex items-center pl-[24px]">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isDemoMode}
                onChange={() => setIsDemoMode(!isDemoMode)}
              />
              <div className={`w-12 h-6 rounded-full transition-colors duration-300 ease-in-out ${isDemoMode ? 'bg-[#22C55E]' : 'bg-[#E8E6E1]'}`}></div>
              <div className={`absolute w-5 h-5 rounded-full bg-white transition-transform duration-300 ease-in-out shadow-sm top-[2px] ${isDemoMode ? 'translate-x-[26px]' : 'translate-x-[2px]'}`}></div>
            </div>
            <span className={`ml-3 font-[700] text-[13px] tracking-widest uppercase transition-colors duration-300 ${isDemoMode ? 'text-[#22C55E]' : 'text-[#999]'}`}>
              Demo
            </span>
          </label>
        </div>

        {/* Empty space filling the center */}
        <div className="flex-1"></div>

        {/* Local Weather & Temperature */}
        <div className="flex items-center gap-[12px] pr-[24px] border-r border-[#EFEBE4]">
          <div className="bg-[#EE7623]/10 p-[10px] rounded-[12px]">
            <CloudSun size={24} className="text-[#EE7623]" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center min-w-[80px]">
            <div className="text-[22px] font-[700] text-[#1A1A1A] leading-none mb-[4px]">
              26°C
            </div>
            <div className="text-[12px] font-[600] text-[#999] tracking-wider leading-none">
              台北市 · 晴時多雲
            </div>
          </div>
        </div>

        {/* Clock & Date */}
        <div className="flex flex-row items-center gap-[24px] ml-[24px] shrink-0 z-10 bg-white">
          <div className="text-right flex flex-col justify-center min-w-[70px]">
            <div className="text-[24px] font-[700] text-[#1A1A1A] leading-none mb-[2px]">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div className="text-[12px] font-[600] text-[#999] uppercase tracking-wider leading-none">
              {time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
