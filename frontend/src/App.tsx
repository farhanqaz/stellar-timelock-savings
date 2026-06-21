import { useCallback, useEffect, useState, type FormEvent } from "react";
import { type SavingsGoal } from "../bindings/index.ts";
import { AnimatedCount, AnimatedStat } from "./components/AnimatedStat.tsx";
import { BackgroundScene } from "./components/BackgroundScene.tsx";
import { GoalCard } from "./components/GoalCard.tsx";
import { Header } from "./components/Header.tsx";
import { Logo } from "./components/Logo.tsx";
import { Stagger, StaggerLines, ViewTransition } from "./components/Motion.tsx";
import { connectFreighter, createContractClient, formatStellarError, getWalletFunds, NATIVE_TOKEN, stroopsToXlm, type WalletFunds, xlmToStroops } from "./stellar";
import { IS_MAINNET, NETWORK_NAME, NETWORK_SLUG, validateEnv } from "./network";
import {
  CONTRACT_ID,
  DURATION_PRESETS,
  getLabUrl,
  getStats,
  truncateAddress,
  type GoalView,
  writeLockedAt,
} from "./utils";

const inputClass =
  "input-focus-ring w-full rounded-lg border border-white/8 bg-canvas px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-white/16 focus:bg-panel";

export default function App() {
  const [wallet, setWallet] = useState("");
  const [goals, setGoals] = useState<GoalView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [lockMinutes, setLockMinutes] = useState(1440);
  const [customMinutes, setCustomMinutes] = useState(false);
  const [walletFunds, setWalletFunds] = useState<WalletFunds | null>(null);

  const labUrl = getLabUrl(CONTRACT_ID, NETWORK_SLUG);
  const fail = (err: unknown) => setError(formatStellarError(err));
  const stats = getStats(goals);
  const missingEnv = validateEnv();

  const refreshWalletFunds = useCallback(async (address: string) => {
    try {
      setWalletFunds(await getWalletFunds(address));
    } catch {
      setWalletFunds(null);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      setError("");
      const client = createContractClient(wallet);
      const countTx = await client.get_count({ saver: wallet });
      const count = Number(countTx.result ?? 0);

      const loaded: GoalView[] = [];
      for (let id = 0; id < count; id++) {
        const [goalTx, unlockTx] = await Promise.all([
          client.get_goal({ saver: wallet, goal_id: id }),
          client.is_unlocked({ saver: wallet, goal_id: id }),
        ]);

        if (goalTx.result?.isOk()) {
          loaded.push({
            id,
            goal: goalTx.result.unwrap() as SavingsGoal,
            unlocked: unlockTx.result?.isOk() ? unlockTx.result.unwrap() : false,
          });
        }
      }

      setGoals(loaded);
      await refreshWalletFunds(wallet);
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }, [wallet, refreshWalletFunds]);

  useEffect(() => {
    if (wallet) loadGoals();
  }, [wallet, loadGoals]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleConnect() {
    try {
      setError("");
      setWallet(await connectFreighter());
    } catch (err) {
      fail(err);
    }
  }

  async function handleLock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const amountXlm = Number(new FormData(formEl).get("amount"));

    if (!Number.isFinite(amountXlm) || amountXlm <= 0) {
      setError("Enter a valid XLM amount.");
      return;
    }
    if (!Number.isInteger(lockMinutes) || lockMinutes < 1) {
      setError("Duration must be at least 1 minute.");
      return;
    }

    const lockStroops = xlmToStroops(amountXlm);
    if (walletFunds && lockStroops > walletFunds.availableStroops) {
      setError(
        `Amount exceeds spendable balance (${stroopsToXlm(walletFunds.availableStroops)} XLM available after ~${stroopsToXlm(walletFunds.minimumStroops)} XLM minimum reserve).`,
      );
      return;
    }

    try {
      setError("");
      setLoading(true);

      const unlockAt = BigInt(Math.floor(Date.now() / 1000) + lockMinutes * 60);
      const client = createContractClient(wallet);
      const tx = await client.lock({
        saver: wallet,
        token: NATIVE_TOKEN,
        amount: xlmToStroops(amountXlm),
        unlock_at: unlockAt,
      });

      const result = await tx.signAndSend();
      const goalId = result.result?.isOk() ? result.result.unwrap() : goals.length;
      writeLockedAt(wallet, Number(goalId));

      formEl.reset();
      await loadGoals();
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(goalId: number) {
    try {
      setError("");
      setLoading(true);
      const client = createContractClient(wallet);
      const tx = await client.withdraw({ saver: wallet, goal_id: goalId });
      await tx.signAndSend();
      await loadGoals();
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-svh text-zinc-100">
      <BackgroundScene />
      <Header wallet={wallet} onConnect={handleConnect} onDisconnect={() => { setWallet(""); setGoals([]); setWalletFunds(null); }} />

      {missingEnv.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pt-6 lg:px-8">
          <p className="error-enter rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100/90">
            Missing env vars: {missingEnv.join(", ")}. Copy <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env</code> and restart the dev server.
          </p>
        </div>
      )}

      {!wallet ? (
        <ViewTransition viewKey="landing">
          <Landing onConnect={handleConnect} labUrl={labUrl} />
        </ViewTransition>
      ) : (
        <ViewTransition viewKey="dashboard">
          <Dashboard
          wallet={wallet}
          goals={goals}
          stats={stats}
          loading={loading}
          now={now}
          lockMinutes={lockMinutes}
          customMinutes={customMinutes}
          error={error}
          walletFunds={walletFunds}
          onLockMinutesChange={setLockMinutes}
          onCustomMinutesChange={setCustomMinutes}
          onLock={handleLock}
          onWithdraw={handleWithdraw}
          onRefresh={loadGoals}
        />
        </ViewTransition>
      )}

      <SiteFooter />
    </div>
  );
}

function Landing({ onConnect, labUrl }: { onConnect: () => void; labUrl: string }) {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-20 lg:px-8 lg:pt-28">
      <section className="mx-auto max-w-3xl text-center">
        <Stagger delay={0}>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">Stellar Soroban Protocol</p>
        </Stagger>

        <div className="logo-float mx-auto mt-10 flex justify-center md:mt-12">
          <Logo size={72} showWordmark={false} />
        </div>

        <h1 className="font-display mt-10 text-[2.75rem] leading-[1.08] tracking-[-0.02em] text-zinc-50 sm:text-6xl lg:text-[4.25rem]">
          <StaggerLines
            lines={[
              "Time-locked savings,",
              <span key="sub" className="text-zinc-400">enforced on-chain.</span>,
            ]}
          />
        </h1>

        <Stagger delay={280} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500">
          Allocate XLM into programmatic vaults with deterministic unlock schedules.
          Non-custodial. Immutable. Built for disciplined capital allocation.
        </Stagger>

        <Stagger delay={380} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onConnect}
            className="btn-primary rounded-lg bg-zinc-50 px-6 py-3 text-sm font-medium text-zinc-950 hover:bg-white">
            Open application
          </button>
          <a
            href={labUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost rounded-lg border border-white/8 px-6 py-3 text-sm text-zinc-400 hover:border-white/14 hover:text-zinc-200">
            Contract explorer
          </a>
        </Stagger>
      </section>

      <section className="reveal reveal-delay-2 mt-24 grid gap-px overflow-hidden rounded-2xl border border-white/6 bg-white/6 md:grid-cols-3">
        {[
          {
            title: "Programmatic locks",
            body: "Unlock timestamps are immutably encoded at deposit. No overrides, no early access.",
          },
          {
            title: "Self-custodied",
            body: "Funds remain in your vault positions. Only the depositor can initiate release after maturity.",
          },
          {
            title: "Multi-vault architecture",
            body: "Run parallel savings positions with independent schedules, amounts, and maturity dates.",
          },
        ].map((item, i) => (
          <div key={item.title} className="feature-cell p-8" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
            <h3 className="text-sm font-medium text-zinc-200">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="reveal reveal-delay-3 mt-16 panel rounded-2xl p-8 md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Network metrics</p>
            <p className="font-display mt-3 text-3xl text-zinc-100">Stellar {NETWORK_NAME}</p>
          </div>
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {[
              { label: "Settlement", value: "~5s" },
              { label: "Asset", value: "Native XLM" },
              { label: "Runtime", value: "Soroban" },
            ].map((m) => (
              <div key={m.label}>
                <dt className="text-[11px] uppercase tracking-wider text-zinc-600">{m.label}</dt>
                <dd className="tabular-nums mt-1 text-lg font-medium text-zinc-200">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}

type DashboardProps = {
  wallet: string;
  goals: GoalView[];
  stats: ReturnType<typeof getStats>;
  loading: boolean;
  now: number;
  lockMinutes: number;
  customMinutes: boolean;
  error: string;
  walletFunds: WalletFunds | null;
  onLockMinutesChange: (v: number) => void;
  onCustomMinutesChange: (v: boolean) => void;
  onLock: (e: FormEvent<HTMLFormElement>) => void;
  onWithdraw: (id: number) => void;
  onRefresh: () => void;
};

function Dashboard({
  wallet,
  goals,
  stats,
  loading,
  now,
  lockMinutes,
  customMinutes,
  error,
  walletFunds,
  onLockMinutesChange,
  onCustomMinutesChange,
  onLock,
  onWithdraw,
  onRefresh,
}: DashboardProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-12">
      <div className="reveal mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Portfolio</p>
          <h2 className="font-display mt-2 text-3xl text-zinc-50">Vault overview</h2>
        </div>
        <div className="panel status-live inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 font-mono text-xs text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          {truncateAddress(wallet, 6)}
        </div>
      </div>

      <section className="reveal reveal-delay-1 panel mb-8 overflow-hidden rounded-2xl">
        <div className="grid divide-y divide-white/6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            { label: "Total locked", unit: "XLM" },
            { label: "Active vaults", unit: "positions" },
            { label: "Ready to release", unit: "mature" },
          ].map((s, i) => (
            <div key={s.label} className="stagger-in px-6 py-5 lg:px-8 lg:py-6" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              <p className="text-[11px] uppercase tracking-wider text-zinc-600">{s.label}</p>
              <p className="tabular-nums mt-2 text-3xl font-medium tracking-tight text-zinc-50">
                {s.label === "Total locked" ? (
                  <AnimatedStat value={stats.totalLocked} suffix={s.unit} />
                ) : s.label === "Active vaults" ? (
                  <AnimatedCount value={stats.active} suffix={s.unit} />
                ) : (
                  <AnimatedCount value={stats.ready} suffix={s.unit} />
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="reveal reveal-delay-2 grid gap-8 xl:grid-cols-[380px_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">New vault</h3>
          </div>
          <form className="panel rounded-2xl p-6" onSubmit={onLock}>
            {walletFunds && (
              <div className="mb-5 rounded-lg border border-white/6 bg-white/2 px-3 py-2.5 text-xs text-zinc-500">
                <p>
                  Wallet balance:{" "}
                  <span className="tabular-nums text-zinc-300">{stroopsToXlm(walletFunds.balanceStroops)} XLM</span>
                </p>
                <p className="mt-1">
                  Available to lock:{" "}
                  <span className="tabular-nums text-zinc-300">{stroopsToXlm(walletFunds.availableStroops)} XLM</span>
                  {IS_MAINNET && walletFunds.availableStroops < 1_000_000n && (
                    <span className="mt-1 block text-amber-200/80">
                      Mainnet keeps ~1 XLM minimum reserve. Top up to lock more.
                    </span>
                  )}
                </p>
              </div>
            )}
            <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-600">Allocation</label>
            <div className="relative mb-6">
              <input
                name="amount"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                className={inputClass}
                required
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
                XLM
              </span>
            </div>

            <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-600">Lock period</label>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onLockMinutesChange(preset.minutes);
                    onCustomMinutesChange(false);
                  }}
                  className={`preset-btn rounded-lg border px-3 py-2.5 text-xs ${
                    !customMinutes && lockMinutes === preset.minutes
                      ? "border-white/16 bg-white/8 text-zinc-100"
                      : "border-white/6 text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                  }`}>
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onCustomMinutesChange(true)}
              className={`preset-btn mb-4 w-full rounded-lg border px-3 py-2.5 text-xs ${
                customMinutes
                  ? "border-white/16 bg-white/8 text-zinc-100"
                  : "border-white/6 text-zinc-500 hover:border-white/10 hover:text-zinc-300"
              }`}>
              Custom duration
            </button>

            {customMinutes && (
              <input
                type="number"
                min="1"
                step="1"
                value={lockMinutes}
                onChange={(e) => onLockMinutesChange(Number(e.target.value))}
                placeholder="Minutes"
                className={`${inputClass} mb-6`}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg bg-zinc-50 py-3 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spin-slow h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                  Confirming transaction…
                </span>
              ) : (
                "Deploy vault"
              )}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Open positions</h3>
            <button
              type="button"
              disabled={loading}
              onClick={onRefresh}
              className="text-xs text-zinc-500 transition hover:text-zinc-300 disabled:opacity-50">
              {loading ? "Syncing…" : "Refresh"}
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="panel logo-float flex flex-col items-center justify-center rounded-2xl px-8 py-20 text-center">
              <Logo size={40} variant="mark-only" className="opacity-40" />
              <p className="mt-6 text-sm text-zinc-400">No open vaults</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-600">
                Deploy your first time-locked position to begin tracking maturity schedules.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {goals.map((g, i) => (
                <GoalCard
                  key={g.id}
                  wallet={wallet}
                  goalView={g}
                  now={now}
                  loading={loading}
                  index={i}
                  onWithdraw={onWithdraw}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {error && (
        <p className="error-enter mt-8 rounded-lg border border-red-500/12 bg-red-500/6 px-4 py-3 text-sm text-red-300/90">
          {error}
        </p>
      )}
    </main>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center sm:flex-row sm:text-left lg:px-8">
        <Logo size={28} />
        <div>
          <p className="text-xs text-zinc-600">Timelock Savings · Soroban smart contract · Stellar {NETWORK_NAME}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-700">{CONTRACT_ID}</p>
        </div>
      </div>
    </footer>
  );
}
