import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { useWebViewKioskFocus } from './hooks/useWebViewKioskFocus';
import { useQueue } from './hooks/useQueue';
import { useDemoSimulation } from './hooks/useDemoSimulation';
import { OrderTypeBadge, ClockWidget } from './components/Widgets';

const HERO_SLIDES = [
  {
    src: 'https://i.pinimg.com/1200x/a2/26/07/a226076c1498919907ff9596acfb0874.jpg',
    alt: 'Creamy carbonara pasta',
    title: 'Creamy Carbonara',
  },
  {
    src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
    alt: 'Fresh salad plate',
    title: 'Fresh Garden Bowl',
  },
  {
    src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=1400&q=80',
    alt: 'Cheese pizza',
    title: 'Cheese Pizza',
  },
  {
    src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80',
    alt: 'Healthy food platter',
    title: 'Chef Special',
  },
];

export default function App() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { queue, processScan } = useQueue();

  const testStartTime = React.useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, []);

  const handleScan = useCallback((scannedData: string) => {
    processScan(scannedData);
  }, [processScan]);

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

  useEffect(() => {
    const setAppVh = () => {
      const safeVh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-vh', `${safeVh}px`);
    };
    setAppVh();
    window.addEventListener('resize', setAppVh);
    window.addEventListener('orientationchange', setAppVh);
    return () => {
      window.removeEventListener('resize', setAppVh);
      window.removeEventListener('orientationchange', setAppVh);
    };
  }, []);

  useEffect(() => {
    if (HERO_SLIDES.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className="w-screen flex flex-col p-[clamp(12px,1.2vw,24px)] gap-[clamp(12px,1.2vw,24px)] font-sans text-[#1A1A1A] bg-[#F8F7F2] overflow-hidden box-border"
      style={{ height: 'calc(var(--app-vh, 1vh) * 100)' }}
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
        
        {/* Left Side: Food Image Carousel */}
        <div className="w-[65%] h-full relative rounded-[32px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-[8px] border-white bg-black min-w-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={HERO_SLIDES[currentSlide].src}
              src={HERO_SLIDES[currentSlide].src}
              alt={HERO_SLIDES[currentSlide].alt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-[clamp(12px,1.2vw,24px)] flex items-end justify-between gap-4">
            <h2 className="text-[clamp(18px,1.8vw,30px)] font-[800] text-white tracking-[-0.02em] drop-shadow-md truncate">
              {HERO_SLIDES[currentSlide].title}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              {HERO_SLIDES.map((slide, index) => (
                <button
                  type="button"
                  key={slide.src}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Vertical Panel for Queue Status */}
        <div className="w-[35%] h-full flex flex-col gap-[clamp(12px,1vw,20px)] min-w-0">
          
          {/* Top Section: Pickup Now */}
          <div className="h-[40%] bg-white rounded-[28px] p-[clamp(12px,1.5vw,32px)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden shrink-0 min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#22C55E]/10 p-[10px] rounded-full">
                <BellRing size={24} className="text-[#22C55E]" strokeWidth={3} />
              </div>
              <h2 className="text-[clamp(18px,1.5vw,24px)] font-[700] text-[#1A1A1A] m-0 flex items-baseline min-w-0">
                請取餐 <span className="text-[clamp(12px,1vw,16px)] opacity-50 font-[500] ml-2 tracking-wide">PICKUP</span>
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
                    className="absolute flex items-center justify-center gap-6 text-[#22C55E] max-w-full min-w-0 px-2"
                  >
                    <OrderTypeBadge type={queue.current.orderType} size="large" />
                    <span className="text-[clamp(64px,6vw,120px)] font-[800] tracking-[-0.03em] leading-none max-w-[18rem] truncate">
                      {queue.current.num}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Section: Completed History (No Header) */}
          <div className="flex-1 bg-[#E8E6E1] rounded-[28px] px-[clamp(12px,1.5vw,32px)] py-[clamp(10px,1vw,16px)] flex flex-col min-h-0 overflow-hidden shrink-0">
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pb-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${i === currentPage ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/20'}`} />
                ))}
              </div>
            )}
            <div className="flex-1 overflow-hidden flex flex-col justify-center min-h-0">
               <div className="grid grid-cols-3 grid-rows-5 grid-flow-col gap-y-[clamp(8px,0.7vw,12px)] gap-x-[clamp(8px,0.7vw,12px)] content-start text-left pl-2 h-full min-h-0">
                  {displayedHistory.map((item, idx) => (
                    <motion.div 
                      layout
                      key={item.id}
                      initial={{ opacity: 0, x: -20, scale: 0.8 }}
                      animate={{ opacity: item.uiState === 'inactive' ? 0.2 : 0.8, x: 0, scale: 1 }}
                      transition={{ 
                        default: { type: "spring", bounce: 0.2, duration: 1.0 }
                      }}
                      className="flex items-center min-w-0"
                    >
                      <div 
                        className={`flex items-center gap-3 ${
                          item.isNew 
                            ? 'animate-number-fade text-[#22C55E]' 
                            : 'text-[#1A1A1A]'
                        } ${item.uiState === 'inactive' ? 'opacity-30' : ''}`}
                      >
                        <OrderTypeBadge type={item.orderType} size="small" />
                        <span className="text-[clamp(24px,2vw,36px)] font-[800] tracking-[-0.02em] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
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
      <div className="h-[clamp(68px,7vh,84px)] bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 flex flex-row items-center px-[clamp(12px,1.5vw,32px)] relative shrink-0 min-w-0">
        
        {/* System Name / Logo */}
        <div className="flex items-center gap-4 pr-[clamp(10px,1.2vw,24px)] border-r border-[#EFEBE4] shrink-0 z-10 bg-white min-w-0">
          <div className="w-[36px] h-[36px] bg-[#3D2B1F] rounded-[8px] flex items-center justify-center text-white font-[900] text-[18px]">
            Q
          </div>
          <span className="font-[800] text-[clamp(14px,1vw,18px)] tracking-[-0.5px] text-[#1A1A1A] truncate">QMS v20260508A</span>
        </div>

        {/* Demo Switch and Test Start Time */}
        <div className="flex items-center pl-[clamp(10px,1.2vw,24px)] min-w-0">
          <label className="flex items-center cursor-pointer group pr-[clamp(8px,1vw,16px)] border-r border-[#EFEBE4]">
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
          <div className="pl-[clamp(8px,1vw,16px)] flex flex-col justify-center min-w-0">
            <span className="text-[11px] font-[600] text-[#999] tracking-wider uppercase truncate">測試開始時間</span>
            <span className="text-[clamp(11px,0.8vw,13px)] font-[700] text-[#1A1A1A] tabular-nums tracking-wide truncate">{testStartTime}</span>
          </div>
        </div>

        {/* Empty space filling the center */}
        <div className="flex-1"></div>

        {/* Local Weather & Temperature */}
        <div className="flex items-center gap-[12px] pr-[clamp(10px,1.2vw,24px)] border-r border-[#EFEBE4] min-w-0">
          <div className="bg-[#EE7623]/10 p-[10px] rounded-[12px]">
            <CloudSun size={24} className="text-[#EE7623]" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center min-w-[60px]">
            <div className="text-[clamp(16px,1.5vw,22px)] font-[700] text-[#1A1A1A] leading-none mb-[4px]">
              26°C
            </div>
            <div className="text-[clamp(10px,0.8vw,12px)] font-[600] text-[#999] tracking-wider leading-none truncate">
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
