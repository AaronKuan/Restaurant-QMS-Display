import { useState, useEffect, useCallback } from 'react';

export type QueueItem = {
  id: string;
  num: string;
  isNew?: boolean;
  orderType?: string;
  status?: string;
  uiState?: 'active' | 'inactive';
  timestamp?: number;
};

export function useQueue() {
  const STORAGE_KEY_QUEUE = 'qms_queue_state';

  const [queue, setQueue] = useState<{
    current: QueueItem | null;
    history: QueueItem[];
    pending: QueueItem[];
  }>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      current: null,
      history: [],
      pending: []
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    } catch {
      // ignore
    }
  }, [queue]);

  const processScan = useCallback((scannedData: string) => {
    const safeData = scannedData.slice(0, 100);
    const parts = safeData.split(',');
    const orderNumber = (parts[0]?.trim() || '').substring(0, 10).replace(/[^a-zA-Z0-9-]/g, '');
    const orderType = (parts[1]?.trim() || '').substring(0, 5);
    const orderStatus = (parts[2]?.trim() || '').substring(0, 5);

    if (!orderNumber) return { safeData, success: false };

    setQueue(prevQueue => {
      let nextCurrent = prevQueue.current;
      let nextHistory = [...prevQueue.history];
      let nextPending = [...(prevQueue.pending || [])];

      const isCurrentlyDisplayed = nextCurrent?.num === orderNumber;
      const historyIndex = nextHistory.findIndex(item => item.num === orderNumber);
      const isIndisplayedHistory = historyIndex >= 0;

      const newOrder: QueueItem = {
        id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        num: orderNumber,
        orderType,
        status: orderStatus,
        isNew: true,
      };

      let itemToDelayAnimation: QueueItem | null = null;
      const ACTION_COMPLETED = '0';

      if (orderStatus === ACTION_COMPLETED) {
        if (isCurrentlyDisplayed) {
          itemToDelayAnimation = { ...nextCurrent!, timestamp: Date.now(), uiState: 'active', isNew: true };
          nextHistory = [itemToDelayAnimation, ...nextHistory].slice(0, 100);
          nextCurrent = null;
        } else if (isIndisplayedHistory) {
          nextHistory.splice(historyIndex, 1);
        } else {
          const pendingIndex = nextPending.findIndex(item => item.num === orderNumber);
          if (pendingIndex >= 0) {
            nextPending.splice(pendingIndex, 1);
          }
        }
      } else {
        if (!isCurrentlyDisplayed && !isIndisplayedHistory) {
          if (nextCurrent) {
            nextHistory = [
              { ...nextCurrent, uiState: 'active', isNew: true, timestamp: Date.now() },
              ...nextHistory.map(item => ({ ...item, isNew: false }))
            ].slice(0, 100);
          }
          newOrder.timestamp = Date.now();
          newOrder.uiState = 'active';
          nextCurrent = newOrder;
        } else {
          if (isCurrentlyDisplayed) nextCurrent = null;
          if (isIndisplayedHistory) nextHistory.splice(historyIndex, 1);
          const pendingIndex = nextPending.findIndex(item => item.num === orderNumber);
          if (pendingIndex >= 0) nextPending.splice(pendingIndex, 1);
        }
      }

      return {
        current: nextCurrent,
        history: nextHistory.map(item => item.id === itemToDelayAnimation?.id ? item : { ...item, isNew: false }),
        pending: nextPending
      };
    });

    return { safeData, success: true };
  }, []);

  useEffect(() => {
    const STALE_CHECK_INTERVAL_MS = 1000;
    const MAX_CURRENT_DISPLAY_TIME_MS = 20000;
    const MAX_HISTORY_HIGHLIGHT_TIME_MS = 120000;

    const interval = setInterval(() => {
      setQueue(prev => {
        const now = Date.now();
        let changed = false;

        let newCurrent = prev.current;
        let newHistory = [...prev.history];

        if (newCurrent?.timestamp && (now - newCurrent.timestamp >= MAX_CURRENT_DISPLAY_TIME_MS)) {
          const timeoutItem = { ...newCurrent, isNew: true };
          newHistory = [timeoutItem, ...newHistory.map(item => ({...item, isNew: false}))].slice(0, 100);
          newCurrent = null;
          changed = true;
        }

        const updatedHistory = newHistory.map(item => {
          if (item.uiState !== 'inactive' && item.timestamp && (now - item.timestamp >= MAX_HISTORY_HIGHLIGHT_TIME_MS)) {
            changed = true;
            return { ...item, uiState: 'inactive' as const };
          }
          return item;
        });

        if (changed) {
          return { current: newCurrent, history: updatedHistory, pending: prev.pending };
        }
        return prev;
      });
    }, STALE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue({
      current: null,
      history: [],
      pending: []
    });
    try {
      localStorage.removeItem(STORAGE_KEY_QUEUE);
    } catch {
      // ignore
    }
  }, []);

  return { queue, processScan, clearQueue };
}
