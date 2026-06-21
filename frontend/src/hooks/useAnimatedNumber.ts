import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    prev.current = target;
    if (from === to) return;

    const start = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
