import { NETWORK_BADGE_CLASS, NETWORK_NAME } from "../network";
import { Logo } from "./Logo.tsx";

type HeaderProps = {
  wallet: string;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function Header({ wallet, onConnect, onDisconnect }: HeaderProps) {
  return (
    <header className="header-enter sticky top-0 z-50 border-b border-white/6 bg-canvas/75 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Logo size={34} />

        <div className="flex items-center gap-3">
          <span className={`hidden rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide sm:inline ${NETWORK_BADGE_CLASS}`}>
            Stellar {NETWORK_NAME}
          </span>
          {wallet ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="btn-ghost rounded-lg border border-white/8 bg-white/4 px-4 py-2 text-sm text-zinc-300 hover:border-white/12 hover:bg-white/6 hover:text-white">
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className="btn-primary rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white">
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
