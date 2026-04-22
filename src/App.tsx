import { useEffect, useState } from 'react';
import { BellRing, Utensils, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [time, setTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Queue state for demonstration
  const [currentPickup, setCurrentPickup] = useState('A125');
  const [completedNumbers, setCompletedNumbers] = useState([
    'A124', 'A123', 'B089', 'B088', 'C045', 
    'A122', 'C044', 'A121', 'B087'
  ]);

  // Simulate continuous random orders to demonstrate the live animation flow
  useEffect(() => {
    const prefixes = ['A', 'B', 'C'];
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const triggerNextOrder = () => {
      if (!isMounted) return;

      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomNum = Math.floor(Math.random() * 900) + 100; // 100 to 999
      const nextNum = `${randomPrefix}${randomNum}`;
      
      setCurrentPickup(prev => {
        // Move current active to history, safely tracking keys to prevent duplicate react keys 
        // in random generation scenarios
        setCompletedNumbers(comp => [prev, ...comp.filter(n => n !== prev)].slice(0, 12));
        return nextNum;
      });

      // Next delay randomly picked between 2000ms and 5000ms
      const nextDelay = Math.floor(Math.random() * 3000) + 2000;
      timerId = setTimeout(triggerNextOrder, nextDelay);
    };

    // Trigger the first one after a random delay
    const initialDelay = Math.floor(Math.random() * 3000) + 2000;
    timerId = setTimeout(triggerNextOrder, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []);

  // Images for the ad section
  const adImage = "https://images.unsplash.com/photo-1544025162-8111140994d2?q=80&w=1280&h=720&auto=format&fit=crop";

  return (
    <div className="h-screen w-screen flex flex-col p-6 gap-6 font-sans text-[#1A1A1A] bg-[#F8F7F2] overflow-hidden box-border">
      
      {/* Upper Section: Main Visual and Queue Panel */}
      <div className="flex-1 flex flex-row gap-6 min-h-0">
        
        {/* Left Side: Main Visual / Ad Module */}
        <div className="w-[65%] h-full relative rounded-[32px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-[8px] border-white flex flex-col">
          <img 
            src={adImage} 
            alt="Delicious Restaurant Dish" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Light gradient overlay for text readability matching the bento vibe */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent pointer-events-none"></div>
          
          {/* Branding / minimal overlay */}
          <div className="absolute inset-0 p-[60px] flex flex-col justify-center pointer-events-none">
            <span className="uppercase tracking-[0.2em] text-[14px] font-[700] text-[#5B3E31] mb-3">
              Fresh & Seasonal
            </span>
            <h1 className="text-[56px] font-[800] leading-[1.1] text-[#3D2B1F] m-0">
              Premium<br />Quality
            </h1>
            <p className="text-[18px] text-[#5B3E31] mt-5 font-[500] opacity-80">
              Locally sourced organic ingredients,<br />prepared fresh for you every day.
            </p>
            <div className="mt-10 w-[120px] h-[4px] bg-[#3D2B1F] rounded-[2px]"></div>
          </div>
        </div>

        {/* Right Side: Vertical Panel for Queue Status */}
        <div className="w-[35%] h-full flex flex-col gap-[20px]">
          
          {/* Top Section: Pickup Now */}
          <div className="flex-[0.55] bg-white rounded-[28px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#22C55E]/10 p-[10px] rounded-full">
                <BellRing size={24} className="text-[#22C55E]" strokeWidth={3} />
              </div>
              <h2 className="text-[24px] font-[700] text-[#1A1A1A] m-0 flex items-baseline">
                請取餐 <span className="text-[16px] opacity-50 font-[500] ml-2 tracking-wide">PICKUP</span>
              </h2>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col justify-center items-center relative">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={currentPickup}
                  initial={{ opacity: 0, scale: 0.5, y: -40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                  transition={{ type: "spring", bounce: 0.75, duration: 1.2 }}
                  className="text-[120px] font-[800] text-[#22C55E] tracking-[-4px] leading-none absolute"
                >
                  {currentPickup}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Section: Completed History (No Header) */}
          <div className="flex-[0.45] bg-[#E8E6E1] rounded-[28px] p-8 flex flex-col">
            <div className="flex-1 overflow-hidden flex flex-col justify-center">
               <div className="grid grid-cols-3 gap-y-[28px] gap-x-[12px] content-start text-left pl-2">
                <AnimatePresence mode="popLayout">
                  {completedNumbers.map((num, idx) => (
                    <motion.div 
                      layout
                      key={num}
                      initial={{ opacity: 0, x: -30, scale: 0.8, color: "#22C55E" }}
                      animate={{ opacity: idx < 3 ? 0.8 : 0.3, x: 0, scale: 1, color: "#1A1A1A" }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ 
                        default: { type: "spring", bounce: 0.2, duration: 1.4 },
                        color: { duration: 3.5, delay: 0.8, ease: "easeOut" }
                      }}
                      className="flex items-center"
                    >
                      <span className="text-[36px] font-[800] tracking-[-1px]">
                        {num}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
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
          <span className="font-[800] text-[18px] tracking-[-0.5px] text-[#1A1A1A]">SIGNAGE QMS</span>
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
