const STROOPS_PER_XLM = 10_000_000;

export type GoalView = {
  id: number;
  goal: {
    amount: bigint | number | string;
    unlock_at: bigint | number;
    withdrawn: boolean;
  };
  unlocked: boolean;
};

export function stroopsToNumber(stroops: bigint | number | string): number {
  return Number(stroops) / STROOPS_PER_XLM;
}

export function getStats(goals: GoalView[]) {
  const active = goals.filter((g) => !g.goal.withdrawn);
  const totalLocked = active.reduce((sum, g) => sum + stroopsToNumber(g.goal.amount), 0);
  const ready = active.filter((g) => g.unlocked).length;
  return { totalLocked, active: active.length, ready };
}

export function formatCountdown(unlockAt: bigint | number, nowMs: number): string {
  const remaining = Number(unlockAt) - Math.floor(nowMs / 1000);
  if (remaining <= 0) return "Ready to withdraw";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function getProgress(
  unlockAt: bigint | number,
  lockedAtMs: number | null,
  nowMs: number,
): number {
  if (!lockedAtMs) return 0;

  const unlockMs = Number(unlockAt) * 1000;
  const total = unlockMs - lockedAtMs;
  if (total <= 0) return 100;

  const elapsed = nowMs - lockedAtMs;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function lockedAtKey(wallet: string, goalId: number) {
  return `timelock-${wallet}-${goalId}`;
}

export function readLockedAt(wallet: string, goalId: number): number | null {
  const raw = localStorage.getItem(lockedAtKey(wallet, goalId));
  return raw ? Number(raw) : null;
}

export function writeLockedAt(wallet: string, goalId: number) {
  localStorage.setItem(lockedAtKey(wallet, goalId), String(Date.now()));
}

export function truncateAddress(address: string, chars = 4) {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export const DURATION_PRESETS = [
  { label: "2 min", minutes: 2 },
  { label: "1 day", minutes: 1440 },
  { label: "1 week", minutes: 10080 },
  { label: "1 month", minutes: 43200 },
] as const;

export const CONTRACT_ID = import.meta.env.VITE_STELLAR_CONTRACT_ID ?? "";
export const LAB_URL = `https://lab.stellar.org/r/testnet/contract/${CONTRACT_ID}`;
