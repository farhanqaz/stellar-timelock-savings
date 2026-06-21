import { isConnected, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import type { ClientOptions } from "@stellar/stellar-sdk/contract";
import { Client } from "../bindings/index.ts";

export const NATIVE_TOKEN =
  import.meta.env.VITE_STELLAR_NATIVE_TOKEN ??
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";

const STROOPS_PER_XLM = 10_000_000;

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * STROOPS_PER_XLM));
}

export function stroopsToXlm(stroops: bigint | number | string): string {
  const value = Number(stroops) / STROOPS_PER_XLM;
  return value.toLocaleString(undefined, { maximumFractionDigits: 7 });
}

export async function connectFreighter() {
  const check = await isConnected();
  if (!check.isConnected) {
    throw new Error("Freighter is not installed. Install it at https://www.freighter.app");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message);
  }

  return access.address;
}

export function createContractClient(walletAddress: string) {
  const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE;
  const rpcUrl = import.meta.env.VITE_STELLAR_RPC_URL;

  return new Client({
    contractId: import.meta.env.VITE_STELLAR_CONTRACT_ID,
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
