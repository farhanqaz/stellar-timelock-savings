import { stroopsToXlm } from "../stellar";
import { formatCountdown, getProgress, readLockedAt, type GoalView } from "../utils";

type GoalCardProps = {
  wallet: string;
  goalView: GoalView;
  now: number;
  loading: boolean;
  index: number;
  onWithdraw: (id: number) => void;
};

function StatusPill({ withdrawn, unlocked }: { withdrawn: boolean; unlocked: boolean }) {
  if (withdrawn) {
    return (
      <span className="rounded-md border border-white/6 bg-white/4 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        Released
      </span>
    );
  }
  if (unlocked) {
    return (
      <span className="rounded-md border border-emerald-500/15 bg-emerald-500/8 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-400/90">
        Mature
      </span>
    );
  }
  return (
    <span className="rounded-md border border-amber-500/12 bg-amber-500/6 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-200/70">
      Locked
    </span>
  );
}

export function GoalCard({ wallet, goalView, now, loading, index, onWithdraw }: GoalCardProps) {
  const { id, goal, unlocked } = goalView;
  const lockedAt = readLockedAt(wallet, id);
  const progress = goal.withdrawn ? 100 : unlocked ? 100 : getProgress(goal.unlock_at, lockedAt, now);

  return (
    <article
      className="panel-interactive card-enter rounded-xl p-5"
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-medium text-zinc-300">Vault #{id}</p>
            <StatusPill withdrawn={goal.withdrawn} unlocked={unlocked} />
          </div>
          <p className="tabular-nums mt-2 text-2xl font-medium tracking-tight text-zinc-50">
            {stroopsToXlm(goal.amount)}
            <span className="ml-1.5 text-sm font-normal text-zinc-500">XLM</span>
          </p>
        </div>
        {!goal.withdrawn && unlocked && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onWithdraw(id)}
            className="btn-primary shrink-0 rounded-lg bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50">
            Release funds
          </button>
        )}
      </div>

      {!goal.withdrawn && (
        <div className="mt-5 border-t border-white/6 pt-4 fade-in">
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-600">Time to maturity</p>
              <p className={`tabular-nums mt-1 text-sm transition-colors duration-500 ${unlocked ? "text-emerald-400/90" : "text-zinc-400"}`}>
                {unlocked ? "Available for release" : formatCountdown(goal.unlock_at, now)}
              </p>
            </div>
            <p className="tabular-nums text-sm text-zinc-500">{Math.round(progress)}%</p>
          </div>
          <div className="h-px overflow-hidden rounded-full bg-white/6">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                unlocked ? "bg-emerald-400/80" : "progress-animate"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2.5 text-xs text-zinc-600">
            Maturity date · {new Date(Number(goal.unlock_at) * 1000).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      )}
    </article>
  );
}
