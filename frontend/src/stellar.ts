import {
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import { rpc } from "@stellar/stellar-sdk";
import type { ClientOptions } from "@stellar/stellar-sdk/contract";
import { Client } from "../bindings/index.ts";
import { assertEnvConfigured, IS_MAINNET, NETWORK_NAME, NETWORK_PASSPHRASE } from "./network";

export const NATIVE_TOKEN =
  import.meta.env.VITE_STELLAR_NATIVE_TOKEN ??
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";

const STROOPS_PER_XLM = 10_000_000;
const BASE_RESERVE_STROOPS = 5_000_000n;
const TX_FEE_BUFFER_STROOPS = 200_000n;

export type WalletFunds = {
  balanceStroops: bigint;
  minimumStroops: bigint;
  availableStroops: bigint;
};

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * STROOPS_PER_XLM));
}

export function stroopsToXlm(stroops: bigint | number | string): string {
  const value = Number(stroops) / STROOPS_PER_XLM;
  return value.toLocaleString(undefined, { maximumFractionDigits: 7 });
}

export async function getWalletFunds(address: string): Promise<WalletFunds> {
  assertEnvConfigured();
  const server = new rpc.Server(import.meta.env.VITE_STELLAR_RPC_URL);
  const entry = await server.getAccountEntry(address);
  const balanceStroops = BigInt(entry.balance().toString());
  const minimumStroops = BigInt(2 + entry.numSubEntries()) * BASE_RESERVE_STROOPS;
  const reserved = minimumStroops + TX_FEE_BUFFER_STROOPS;
  const availableStroops =
    balanceStroops > reserved ? balanceStroops - reserved : 0n;

  return { balanceStroops, minimumStroops, availableStroops };
}

export function formatStellarError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/account not found/i.test(message)) {
    if (IS_MAINNET) {
      return `Account not found on Mainnet. Fund this wallet with XLM on Mainnet first, or switch Freighter and .env to Testnet for demo.`;
    }
    return `Account not found on Testnet. Fund the wallet via the Stellar testnet faucet, then reconnect.`;
  }

  if (/network/i.test(message) && /mismatch|passphrase/i.test(message)) {
    return `Network mismatch. Set Freighter to ${NETWORK_NAME} and restart the app.`;
  }

  if (/resulting balance is not within the allowed range|contract call failed.*transfer/i.test(message)) {
    return `Insufficient spendable XLM. Stellar requires ~1 XLM minimum reserve per account; only the balance above that can be locked. Top up your wallet or lock a smaller amount.`;
  }

  if (/simulation failed/i.test(message) && /transfer/i.test(message)) {
    return `Transfer failed during simulation. You may not have enough spendable XLM after the network minimum reserve (~1 XLM on Mainnet).`;
  }

  return message || "Something went wrong";
}

async function assertFreighterNetwork() {
  const network = await getNetwork();
  if (network.error) {
    throw new Error(network.error.message);
  }

  if (network.networkPassphrase !== NETWORK_PASSPHRASE) {
    const freighterNetwork = network.networkPassphrase.includes("Test") ? "Testnet" : "Mainnet";
    throw new Error(
      `Freighter is on ${freighterNetwork} but this app uses ${NETWORK_NAME}. Change Freighter network in Settings.`,
    );
  }
}

export async function connectFreighter() {
  assertEnvConfigured();

  const check = await isConnected();
  if (!check.isConnected) {
    throw new Error("Freighter is not installed. Install it at https://www.freighter.app");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message);
  }

  await assertFreighterNetwork();

  return access.address;
}

export function createContractClient(walletAddress: string) {
  assertEnvConfigured();

  const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE;
  const rpcUrl = import.meta.env.VITE_STELLAR_RPC_URL;
  const contractId = import.meta.env.VITE_STELLAR_CONTRACT_ID;

  return new Client({
    contractId,
    networkPassphrase,
    rpcUrl,
    publicKey: walletAddress,
    signTransaction: async (xdr: string, opts?: Parameters<NonNullable<ClientOptions["signTransaction"]>>[1]) => {
      const result = await freighterSignTransaction(xdr, {
        networkPassphrase,
        address: walletAddress,
        ...opts,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result;
    },
  });
}
