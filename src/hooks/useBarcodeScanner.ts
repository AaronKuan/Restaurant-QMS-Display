import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (data: string) => void;
  timeout?: number; 
}

export function useBarcodeScanner({ onScan, timeout = 500 }: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  // Keep the latest onScan callback in a ref to avoid effect re-runs
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    window.focus();

    const handleMouseDown = () => {
      window.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();

      // Reset buffer if time between keystrokes exceeds timeout
      if (currentTime - lastKeyTimeRef.current > timeout) {
        bufferRef.current = '';
      }
      
      lastKeyTimeRef.current = currentTime;

      // When Enter is pressed, trigger callback if buffer has data
      if (e.key === 'Enter') {
        e.preventDefault();
        if (bufferRef.current.length > 0) {
          onScanRef.current(bufferRef.current);
          bufferRef.current = ''; // Clear buffer immediately after scan
        }
        return;
      }

      // Collect normal characters (length === 1 ignores Shift, Control, etc.)
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [timeout]);
}
