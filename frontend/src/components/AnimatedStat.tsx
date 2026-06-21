import { useAnimatedNumber } from "../hooks/useAnimatedNumber.ts";

type AnimatedStatProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

export function AnimatedStat({ value, decimals = 4, suffix, className = "" }: AnimatedStatProps) {
  const animated = useAnimatedNumber(value);

  return (
    <span className={className}>
      {animated.toLocaleString(undefined, { maximumFractionDigits: decimals })}
      {suffix && <span className="ml-2 text-sm font-normal text-zinc-500">{suffix}</span>}
    </span>
  );
}

type AnimatedCountProps = {
  value: number;
  suffix?: string;
  className?: string;
};

export function AnimatedCount({ value, suffix, className = "" }: AnimatedCountProps) {
  const animated = useAnimatedNumber(value);
  const display = Math.round(animated);

  return (
    <span className={className}>
      {display}
      {suffix && <span className="ml-2 text-sm font-normal text-zinc-500">{suffix}</span>}
    </span>
  );
}
