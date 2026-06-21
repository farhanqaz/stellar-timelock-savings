const PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE ?? "";

export const NETWORK_PASSPHRASE = PASSPHRASE;

export const IS_MAINNET = PASSPHRASE.includes("Public Global");

export const NETWORK_NAME = IS_MAINNET ? "Mainnet" : "Testnet";

export const NETWORK_SLUG = IS_MAINNET ? "mainnet" : "testnet";

export const NETWORK_BADGE_CLASS = IS_MAINNET
  ? "border-amber-500/20 bg-amber-500/8 text-amber-200/90"
  : "border-white/6 bg-white/3 text-zinc-500";

const REQUIRED_ENV = [
  "VITE_STELLAR_NETWORK_PASSPHRASE",
  "VITE_STELLAR_RPC_URL",
  "VITE_STELLAR_CONTRACT_ID",
  "VITE_STELLAR_NATIVE_TOKEN",
] as const;

export function validateEnv(): string[] {
  return REQUIRED_ENV.filter((key) => !import.meta.env[key]);
}

export function assertEnvConfigured() {
  const missing = validateEnv();
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}
