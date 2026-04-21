import { useEffect, useState } from 'react';
import { BellRing, Utensils, Info } from 'lucide-react';

export default function App() {
  const [time, setTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dummy queue numbers for demonstration
  const pickupNumbers = ['A123', 'A124', 'B089'];
  const preparationNumbers = [
    'A125', 'A126', 'A127', 'B090', 'C045', 
    'C046', 'A128', 'B091', 'B092', 'C047', 
    'A129', 'A130', 'B093', 'C048', 'A131'
  ];

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
          <div className="flex-[0.6] bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-[#22C55E]/10 p-2 rounded-full">
                <BellRing size={20} className="text-[#22C55E]" strokeWidth={3} />
              </div>
              <h2 className="text-[20px] font-[700] text-[#1A1A1A] m-0 flex items-baseline">
                請取餐 <span className="text-[14px] opacity-50 font-[400] ml-2 tracking-wide">PICKUP</span>
              </h2>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col justify-center items-center gap-3">
              {pickupNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center justify-center">
                  <span className={`text-[72px] font-[800] text-[#22C55E] tracking-[-2px] leading-none ${idx === 0 ? '' : idx === 1 ? 'opacity-60' : 'opacity-30'}`}>
                    {num}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle/Bottom Section: In Preparation */}
          <div className="flex-[0.4] bg-[#E8E6E1] rounded-[28px] p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#EE7623]/10 p-2 rounded-full">
                <Utensils size={18} className="text-[#EE7623]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-[700] text-[#1A1A1A] m-0 flex items-baseline">
                準備中 <span className="text-[12px] opacity-50 font-[400] ml-2 tracking-wide">PREPARING</span>
              </h2>
            </div>

            <div className="flex-1 overflow-hidden">
               <div className="grid grid-cols-3 gap-[10px] h-full content-start text-left">
                {preparationNumbers.map((num, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className={`text-[24px] font-[700] text-[#1A1A1A] ${idx < 6 ? 'opacity-70' : 'opacity-40'}`}>
                      {num}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Bar: Information Strip */}
      <div className="h-[80px] bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 flex flex-row items-center px-[32px] relative shrink-0">
        
        {/* System Name / Logo */}
        <div className="flex items-center gap-4 pr-[24px] border-r border-[#EFEBE4] mr-[24px] shrink-0 z-10 bg-white">
          <div className="w-[36px] h-[36px] bg-[#3D2B1F] rounded-[8px] flex items-center justify-center text-white font-[900] text-[18px]">
            Q
          </div>
          <span className="font-[800] text-[18px] tracking-[-0.5px] text-[#1A1A1A]">SIGNAGE QMS</span>
        </div>

        {/* Scrolling Message Area */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full mask-edges">
           {/* Gradients to fade edges cleanly */}
           <div className="absolute left-0 w-8 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
           <div className="absolute right-0 w-8 h-full bg-gradient-to-l from-white to-transparent z-10"></div>
           
           <div className="flex whitespace-nowrap animate-marquee items-center gap-2 text-[18px] font-[500] text-[#666] tracking-tight">
             <Info size={20} className="text-[#999] inline-block shrink-0" />
             <span>溫馨提示：請核對您的號碼，保持社交距離，感謝您的配合。 Enjoy your meal! Please check your order number at the counter...</span>
           </div>
        </div>

        {/* Clock & Date */}
        <div className="flex flex-row items-center gap-[24px] ml-[24px] pl-[24px] border-l border-[#EFEBE4] shrink-0 z-10 bg-white">
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
