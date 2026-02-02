import { useState, useEffect, useRef } from 'react';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useIdle() {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    const resetTimer = () => {
      // Only reset if we were already active or to prevent idle state
      // If currently idle, we wait for explicit interaction? 
      // Actually standard idle timers reset on activity.
      // But if we show a modal "Are you there?", we might want them to click the button.
      // However, usually moving mouse is enough to wake up.
      // The requirement: "show a message... asking if we should keep listening".
      // Usually this implies a click.
      // If I move mouse, does it dismiss?
      // "If we haven't detected... for 30 mins... show message".
      // If I just move mouse, the message should probably go away if it's just a screensaver.
      // But if it's a "Netflix are you there" prompt, it usually requires a click.
      // Let's stick to the prompt: "asking if we should keep listening".
      // I'll make the hook set `isIdle=true`.
      // If `isIdle` is true, simple mouse movement *should* probably NOT reset it immediately if we want to force an answer, 
      // but for a smooth UX, moving the mouse usually wakes up a "screensaver".
      // BUT for a "limit API usage" feature (implied by context), we might want a click.
      // Let's assume explicit confirmation is better to save API calls if the cat moved the mouse.
      // So: Once idle, only `resetIdle` (manual) clears it?
      // No, standard `useIdle` resets on activity.
      // Let's implement standard. If the user moves mouse, they are there.
      // EXCEPT: The user specifically asked for a message "asking if we should keep listening".
      // If I move mouse and it vanishes, I didn't answer.
      // I'll implement it so activity resets the timer *before* it triggers. 
      // *After* it triggers, we require manual dismissal?
      // I'll add a `pauseDetection` arg or just check `isIdle`.
      
      if (isIdle) return; // If already idle, wait for manual reset (Overlay click)? 
      // Or auto-resume? 
      // Let's go with auto-resume for "screensaver" feel, but manual for "Netflix" feel.
      // Given the "100 lookups limit", saving calls is key.
      // So I will Make it so that once IDLE triggers, only the Button can reset it.
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setIsIdle(true);
      }, IDLE_TIMEOUT);
    };

    // Initial start
    resetTimer();

    // Listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => {
        if (!isIdle) resetTimer();
    };

    events.forEach(event => window.addEventListener(event, handler));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handler));
    };
  }, [isIdle]);

  return { isIdle, resetIdle: () => setIsIdle(false) };
}
