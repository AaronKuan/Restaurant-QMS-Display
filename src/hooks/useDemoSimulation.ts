import { useEffect, useRef } from 'react';

type ProcessScanFn = (scannedData: string) => void;

export function useDemoSimulation(isDemoMode: boolean, processScan: ProcessScanFn) {
  const nextAvailableOrderRef = useRef(1);
  const pendingOrdersRef = useRef<{ id: number, type: string }[]>([]);
  const generatedOrderCountRef = useRef(0);

  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    let isMounted = true;
    let mainTimerId: NodeJS.Timeout;
    const pickupTimers = new Set<NodeJS.Timeout>();
    const MAX_DEMO_ORDER_NUMBER = 999;

    const getNextOrderId = () => {
      const currentId = nextAvailableOrderRef.current;
      nextAvailableOrderRef.current = currentId >= MAX_DEMO_ORDER_NUMBER ? 1 : currentId + 1;
      return currentId;
    };

    const simulateNextOrder = () => {
      if (!isMounted) return;

      while (pendingOrdersRef.current.length < 5) {
        const orderTypes = ['1', '1', '2', '2', '4', '5'];
        const randomType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
        pendingOrdersRef.current.push({ id: getNextOrderId(), type: randomType });
      }

      const maxReorderIndex = Math.min(3, pendingOrdersRef.current.length);
      const chosenIndex = Math.floor(Math.random() * maxReorderIndex);
      const simulatedOrder = pendingOrdersRef.current.splice(chosenIndex, 1)[0];
      
      const orderNumber = String(simulatedOrder.id).padStart(3, '0');
      const orderType = simulatedOrder.type;
      generatedOrderCountRef.current++;

      const MSG_TYPE_READY = '1';
      const MSG_TYPE_PICKED_UP = '0';

      processScan(`${orderNumber},${orderType},${MSG_TYPE_READY}`);
      
      const NORMAL_DELAY_MS = Math.floor(Math.random() * 70000) + 20000; // 20s ~ 90s
      const LONG_DELAY_MS = 150000; // 150s edge case every 20 orders
      let simulatedPickupDelay = (generatedOrderCountRef.current % 20 === 0) ? LONG_DELAY_MS : NORMAL_DELAY_MS;
      
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
