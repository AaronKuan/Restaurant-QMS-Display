import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { useWebViewKioskFocus } from './hooks/useWebViewKioskFocus';
import { useQueue } from './hooks/useQueue';
import { useMetricsLogger } from './hooks/useMetricsLogger';
import { useDemoSimulation } from './hooks/useDemoSimulation';
import { OrderTypeBadge, ClockWidget } from './components/Widgets';

export default function App() {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const { queue, processScan, clearQueue } = useQueue();
  const { logs, addLog, clearLogs, runDiagnostics } = useMetricsLogger();

  const testStartTime = React.useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, []);

  const handleClearData = useCallback(() => {
    clearLogs();
    clearQueue();
  }, [clearLogs, clearQueue]);

  const handleScan = useCallback((scannedData: string) => {
    const { safeData, success } = processScan(scannedData);
    if (success) {
      addLog(`[SCANNER] SUCCESS: ${safeData}`);
    } else {
      addLog(`[SCANNER] IGNORED: Invalid format`);
    }
  }, [processScan, addLog]);

  const { trapRef } = useWebViewKioskFocus();

  useBarcodeScanner({ onScan: handleScan });
  useDemoSimulation(isDemoMode, handleScan);

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

  return (
    <div 
      className="h-screen w-screen flex flex-col p-6 gap-6 font-sans text-[#1A1A1A] bg-[#F8F7F2] overflow-hidden box-border"
      tabIndex={0}
    >
      <input
        ref={trapRef}
        type="text"
        readOnly
        tabIndex={0}
        aria-hidden
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="none"
        className="sr-only"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />

      {/* Upper Section: Main Visual and Queue Panel */}
      <div className="flex-1 flex flex-row gap-6 min-h-0">
        
        {/* Left Side: Temporary System Logs Viewer for Debugging */}
        <div className="w-[65%] h-full relative rounded-[32px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-[8px] border-white flex flex-col bg-[#1E1E1E] text-[#D4D4D4] p-6 font-mono">
          <div className="flex border-b border-[#333] pb-4 mb-4 items-center justify-between shrink-0">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               System Monitor & Recovery Logs
             </h2>
             <div className="flex gap-2">
               <button 
                 onClick={() => window.location.reload()} 
                 className="text-[13px] bg-red-500/20 text-red-500 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold border border-red-500/30"
               >
                 Simulate OS Crash
               </button>
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
                 Test Event
               </button>
               <button 
                 onClick={handleClearData} 
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
                  <motion.div
                    key={queue.current.id}
                    initial={{ opacity: 0, scale: 0.5, y: -40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1, transition: { duration: 0 } }}
                    transition={{ type: "spring", bounce: 0.75, duration: 1.2 }}
                    className="absolute flex items-center justify-center gap-6 text-[#22C55E]"
                  >
                    <OrderTypeBadge type={queue.current.orderType} size="large" />
                    <span className="text-[120px] font-[800] tracking-[-4px] leading-none">
                      {queue.current.num}
                    </span>
                  </motion.div>
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
               <div className="grid grid-rows-5 grid-flow-col gap-y-[12px] gap-x-[12px] content-center text-left pl-2 h-full">
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
                      <div 
                        className={`flex items-center gap-3 ${
                          item.isNew 
                            ? 'animate-number-fade text-[#22C55E]' 
                            : 'text-[#1A1A1A]'
                        } ${item.uiState === 'inactive' ? 'opacity-30' : ''}`}
                      >
                        <OrderTypeBadge type={item.orderType} size="small" />
                        <span className="text-[36px] font-[800] tracking-[-1px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.num}
                        </span>
                      </div>
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
          <span className="font-[800] text-[18px] tracking-[-0.5px] text-[#1A1A1A]">QMS v1.1.25</span>
        </div>

        {/* Demo Switch and Test Start Time */}
        <div className="flex items-center pl-[24px]">
          <label className="flex items-center cursor-pointer group pr-[16px] border-r border-[#EFEBE4]">
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
          <div className="pl-[16px] flex flex-col justify-center">
            <span className="text-[11px] font-[600] text-[#999] tracking-wider uppercase">測試開始時間</span>
            <span className="text-[13px] font-[700] text-[#1A1A1A] tabular-nums tracking-wide">{testStartTime}</span>
          </div>
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
        <ClockWidget />

      </div>

    </div>
  );
}
