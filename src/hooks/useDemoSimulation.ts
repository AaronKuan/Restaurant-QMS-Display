import { useEffect } from 'react';

type ProcessScanFn = (scannedData: string) => void;

export function useDemoSimulation(isDemoMode: boolean, processScan: ProcessScanFn) {
  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    let isMounted = true;
    let mainTimerId: NodeJS.Timeout;
    const pickupTimers = new Set<NodeJS.Timeout>();
    
    let nextAvailableOrder = 1;
    let pendingOrders: { id: number, type: string }[] = [];
    let generatedOrderCount = 0;

    const simulateNextOrder = () => {
      if (!isMounted) return;

      while (pendingOrders.length < 5) {
        const orderTypes = ['1', '1', '2', '2', '4', '5'];
        const randomType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
        pendingOrders.push({ id: nextAvailableOrder++, type: randomType });
      }

      const maxReorderIndex = Math.min(3, pendingOrders.length);
      const chosenIndex = Math.floor(Math.random() * maxReorderIndex);
      const simulatedOrder = pendingOrders.splice(chosenIndex, 1)[0];
      
      const orderNumber = String(simulatedOrder.id).padStart(3, '0');
      const orderType = simulatedOrder.type;
      generatedOrderCount++;

      const MSG_TYPE_READY = '1';
      const MSG_TYPE_PICKED_UP = '0';

      processScan(`${orderNumber},${orderType},${MSG_TYPE_READY}`);
      
      const NORMAL_DELAY_MS = Math.floor(Math.random() * 290000) + 10000;
      const LONG_DELAY_MS = 600000; // 10 minutes for slow pickup logic validation
      let simulatedPickupDelay = (generatedOrderCount % 20 === 0) ? LONG_DELAY_MS : NORMAL_DELAY_MS;
      
      const preparePhaseTimer = setTimeout(() => {
        if (!isMounted) return;
        pickupTimers.delete(preparePhaseTimer);
        
        processScan(`${orderNumber},${orderType},${MSG_TYPE_PICKED_UP}`); 
        
        const cleanupPhaseTimer = setTimeout(() => {
           if (isMounted) {
            processScan(`${orderNumber},${orderType},${MSG_TYPE_PICKED_UP}`); 
           }
           pickupTimers.delete(cleanupPhaseTimer);
        }, 1500); 
        pickupTimers.add(cleanupPhaseTimer);
      }, simulatedPickupDelay);
      
      pickupTimers.add(preparePhaseTimer);

      const nextOrderDelay = Math.floor(Math.random() * 4000) + 4000; 
      mainTimerId = setTimeout(simulateNextOrder, nextOrderDelay);
    };

    const initialBootstrapDelayMs = Math.floor(Math.random() * 1000) + 500;
    mainTimerId = setTimeout(simulateNextOrder, initialBootstrapDelayMs);

    return () => {
      isMounted = false;
      clearTimeout(mainTimerId);
      pickupTimers.forEach(t => clearTimeout(t));
      pickupTimers.clear();
    };
  }, [isDemoMode, processScan]);
}
