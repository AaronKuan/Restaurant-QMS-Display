import { useCallback, useEffect, useRef } from 'react';

/**
 * Android WebView / kiosk: hardware keyboard (barcode wand) often is not delivered to JS
 * until the WebView content has a focused editable target. A near-invisible readOnly input
 * receives focus on load (retries) and after lifecycle events so `keydown` listeners work
 * without requiring an initial tap when the OS allows programmatic focus.
 */
export function useWebViewKioskFocus() {
  const trapRef = useRef<HTMLInputElement>(null);

  const focusTrap = useCallback(() => {
    const el = trapRef.current;
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch {
      try {
        el.focus();
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    const schedules: number[] = [0, 50, 150, 400, 1000, 2000];
    const timers = schedules.map((ms) => window.setTimeout(focusTrap, ms));

    const onResume = () => focusTrap();
    window.addEventListener('focus', onResume);
    window.addEventListener('pageshow', onResume);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') focusTrap();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onPointer = () => focusTrap();
    document.addEventListener('touchstart', onPointer, { capture: true, passive: true });
    document.addEventListener('mousedown', onPointer, { capture: true, passive: true });

    const onTrapBlur = () => {
      window.setTimeout(() => {
        const a = document.activeElement;
        if (a === trapRef.current) return;
        if (a instanceof HTMLButtonElement) return;
        if (a instanceof HTMLAnchorElement && a.href) return;
        if (a instanceof HTMLSelectElement || a instanceof HTMLTextAreaElement) return;
        if (a instanceof HTMLInputElement) {
          if (a.type === 'checkbox' || a.type === 'radio') return;
        }
        focusTrap();
      }, 300);
    };

    const el = trapRef.current;
    el?.addEventListener('blur', onTrapBlur);

    return () => {
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener('focus', onResume);
      window.removeEventListener('pageshow', onResume);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('touchstart', onPointer, { capture: true });
      document.removeEventListener('mousedown', onPointer, { capture: true });
      trapRef.current?.removeEventListener('blur', onTrapBlur);
    };
  }, [focusTrap]);

  return { trapRef };
}
