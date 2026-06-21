# Stellar Timelock Savings

A Soroban smart contract that lets users lock their own tokens until a future date — a simple on-chain savings vault with time-based withdrawal rules.

> **Suggested GitHub repo name:** `stellar-timelock-savings`

## Description

Timelock Savings is a personal savings vault on Stellar. Users deposit tokens (e.g. native XLM or any SEP-41 token) and choose an unlock timestamp. Funds cannot be withdrawn before that time, helping enforce disciplined saving goals.

Unlike the workshop's claimable-balance timelock example (where *other* accounts claim funds), this contract is built for **self-custodied savings**: only the depositor can withdraw, and only after the lock matures.

## Features

- **Lock funds** — deposit tokens with a custom unlock timestamp
- **Time-gated withdrawal** — withdraw only after the lock period ends
- **Multiple savings goals** — up to 20 separate goals per user
- **Read-only queries** — check goal details, count, and unlock status
- **On-chain events** — emits `locked` and `withdraw` events for indexing

## Smart Contract (Mainnet)

| Field | Value |
|-------|-------|
| **Contract ID** | `CBBAMKDRCAXZOLG4MWWSUN5VQVSOHDEVOBR2XYJIXKUUZT32JC5JMJ55` |
| **Network** | Stellar Mainnet |
| **Explorer** | [View on Stellar Lab](https://lab.stellar.org/r/mainnet/contract/CBBAMKDRCAXZOLG4MWWSUN5VQVSOHDEVOBR2XYJIXKUUZT32JC5JMJ55) |

## Smart Contract (Testnet)

| Field | Value |
|-------|-------|
| **Contract ID** | `CBDKF3AXX3WA4N4GKCLGACG6L7JFTG7JJWQNXEASD63SCRLF2J7KRIUA` |
| **Network** | Stellar Testnet |
| **Explorer** | [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CBDKF3AXX3WA4N4GKCLGACG6L7JFTG7JJWQNXEASD63SCRLF2J7KRIUA) |
| **Wasm Hash** | `f9bc3e243eb3d5b28bd350308cdc1c59d85f8f0048772a29b6a5304692bf6539` |

## Contract Functions

| Function | Description |
|----------|-------------|
| `lock(saver, token, amount, unlock_at)` | Lock tokens until `unlock_at` (unix timestamp). Returns goal ID. |
| `withdraw(saver, goal_id)` | Withdraw matured savings back to the saver. |
| `get_goal(saver, goal_id)` | Read a savings goal (token, amount, unlock time, withdrawn flag). |
| `get_count(saver)` | Number of savings goals created by a user. |
| `is_unlocked(saver, goal_id)` | Check if a goal has matured and is ready to withdraw. |

## How to Build & Test

```bash
# Build the contract
stellar contract build

# Run unit tests
cargo test
```

## How to Invoke (Testnet)

```bash
# Set your identity
stellar keys generate alice --network testnet
stellar keys fund alice --network testnet

# Native XLM token contract on testnet
TOKEN=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
CONTRACT=CBDKF3AXX3WA4N4GKCLGACG6L7JFTG7JJWQNXEASD63SCRLF2J7KRIUA

# Lock 1 XLM until a future timestamp (unix seconds)
stellar contract invoke \
  --id $CONTRACT \
  --source alice \
  --network testnet \
  --send=yes \
  -- lock \
  --saver $(stellar keys address alice) \
  --token $TOKEN \
  --amount 10000000 \
  --unlock_at 1782000000

# Check if unlocked
stellar contract invoke \
  --id $CONTRACT \
  --source alice \
  --network testnet \
  -- is_unlocked \
  --saver $(stellar keys address alice) \
  --goal_id 0

# Withdraw after maturity
stellar contract invoke \
  --id $CONTRACT \
  --source alice \
  --network testnet \
  --send=yes \
  -- withdraw \
  --saver $(stellar keys address alice) \
  --goal_id 0
```

## How to Invoke (Mainnet)

```bash
TOKEN=CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
CONTRACT=CBBAMKDRCAXZOLG4MWWSUN5VQVSOHDEVOBR2XYJIXKUUZT32JC5JMJ55

# Lock 0.1 XLM until a future timestamp (unix seconds)
stellar contract invoke \
  --id $CONTRACT \
  --source <your-key> \
  --network mainnet \
  --send=yes \
  -- lock \
  --saver $(stellar keys address <your-key>) \
  --token $TOKEN \
  --amount 1000000 \
  --unlock_at 1782000000
```

> Use real XLM on mainnet. Start with a small amount for testing.

## Frontend (React + Vite)

Premium web UI for locking and withdrawing savings via Freighter wallet.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the local URL (default `http://localhost:5173`), connect Freighter on **Mainnet**, then create a savings vault or withdraw matured positions.

> **Account not found?** Your wallet must be funded on the same network as `.env`. Mainnet needs real XLM; Testnet needs faucet funds. Freighter network must match `.env`.

| Feature | Description |
|---------|-------------|
| **Wallet** | Freighter connect / disconnect |
| **Lock** | Deposit XLM with preset or custom unlock duration |
| **Dashboard** | Live stats, countdown, progress per goal |
| **Withdraw** | Release matured vaults on-chain |

## Deploy to Vercel

### 1. Import from GitHub

1. Open [vercel.com/new](https://vercel.com/new)
2. Import `farhanqaz/stellar-timelock-savings`
3. Set **Root Directory** to `frontend` (required)

### 2. Build settings

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 3. Environment variables (Production)

| Variable | Mainnet value |
|----------|---------------|
| `VITE_STELLAR_NETWORK_PASSPHRASE` | `Public Global Stellar Network ; September 2015` |
| `VITE_STELLAR_RPC_URL` | `https://soroban-mainnet.stellar.org` |
| `VITE_STELLAR_CONTRACT_ID` | `CBBAMKDRCAXZOLG4MWWSUN5VQVSOHDEVOBR2XYJIXKUUZT32JC5JMJ55` |
| `VITE_STELLAR_NATIVE_TOKEN` | `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA` |

For **Testnet demo**, use the commented values in `frontend/.env.example` instead.

### 4. Deploy

Click **Deploy**. After build succeeds, open the production URL.

### 5. Verify

- Header badge shows **Stellar Mainnet** (amber) or **Testnet** (gray)
- Freighter network matches the deployed env
- Connect wallet → dashboard loads without errors

### CLI alternative

```bash
cd frontend
npx vercel login
npx vercel link
npx vercel env add VITE_STELLAR_NETWORK_PASSPHRASE production
npx vercel env add VITE_STELLAR_RPC_URL production
npx vercel env add VITE_STELLAR_CONTRACT_ID production
npx vercel env add VITE_STELLAR_NATIVE_TOKEN production
npx vercel deploy --prod
```

Deploy from the `frontend/` folder only. If Vercel shows a `frontend/frontend` path error, set **Root Directory** to `frontend` in Project Settings.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Account not found` | Fund wallet on the same network as `.env` / Vercel env vars |
| `Freighter is on Testnet but this app uses Mainnet` | Freighter Settings → switch to Mainnet |
| Build OK but contract fails | Redeploy after adding all four `VITE_*` env vars |
| Vite `export *` warning | Harmless; already removed from bindings re-exports |

## Project Structure

```text
.
├── contracts/
│   └── timelock_savings/
│       ├── src/
│       │   ├── lib.rs      # Contract logic
│       │   └── test.rs     # Unit tests
│       └── Cargo.toml
├── frontend/
│   ├── src/                # React app (Freighter + contract client)
│   ├── bindings/           # TypeScript bindings from Stellar CLI
│   └── public/
├── Cargo.toml
└── README.md
```

## Tech Stack

- Rust + Soroban SDK 26
- Stellar CLI 27
- React 19 + Vite + Tailwind CSS 4
- Freighter wallet + `@stellar/stellar-sdk`
- Developed with AI assistance (Cursor)

## Workshop Submission

This project was built for a Stellar/Soroban workshop. The contract differs from the standard Hello World and claimable-balance timelock examples by implementing a **personal multi-goal savings vault** with explicit error handling and per-user goal tracking.
