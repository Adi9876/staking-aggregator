# Staking Protocol Routing Aggregator

A backend service that aggregates multiple staking protocols, computes the best available deal using a composite scoring model, and (optionally) executes the staking transaction on-chain.

## Core Goals

- Aggregate quotes from multiple ETH staking protocols
- Rank by expected net outcome (APY, fees, lock flexibility)
- Expose a simple REST API for quote discovery and execution

---

## High-Level Architecture

- `routes/staking.ts`: HTTP endpoints for quote retrieval and execution
- `services/aggregator.ts`: Orchestrates querying, ranking, and execution
- `services/protocolQuerier.ts`: Builds quotes using APY and protocol constraints
- `services/apyFetcher.ts`: Fetches APY from protocol APIs and DeFiLlama with caching
- `services/bestDealFinder.ts`: Scores and picks the optimal quote
- `services/transactionExecutor.ts`: Sends transactions for Lido, Rocket Pool, StakeWise
- `protocols/protocolRegistry.ts`: Registry of supported protocols with addresses
- `types.ts`: Shared types for requests, quotes, and results

---

## Detailed Component Behavior

### 1) Protocol Discovery and Quote Building

- Source: `services/protocolQuerier.ts` + `protocols/protocolRegistry.ts`
- Steps per protocol:
  - Validate request amount vs protocol min/max (including on-chain checks where available, e.g., Rocket Pool deposit limits)
  - Fetch current APY via `ApyFetcher`:
    - Primary: protocol official APIs (Lido, Rocket Pool)
    - Secondary: DeFiLlama Pools API
    - Fallback: conservative static estimates (sanity bounds 0–20%)
  - Compute expected rewards over lock period and fees
  - Return a `StakingQuote` containing net expected return and metadata
- Parallelization: protocols are queried concurrently, errors isolated per protocol

### 2) Scoring and Best Deal Selection

- Source: `services/bestDealFinder.ts`
- Scoring model (composite score):
  - APY weight: 40%
  - Net return weight: 30% (expectedReturn - fees, normalized)
  - Fee efficiency: 20% (lower fee relative to principal)
  - Lock flexibility: 10% (prefers shorter lock)
- Returns the top quote or top-N list for `/quotes`

### 3) Transaction Execution

- Source: `services/transactionExecutor.ts`
- Protocol-specific execution flows:
  - Lido: `submit(referral?)` on the stETH contract
  - Rocket Pool: `deposit()` on the deposit pool
  - StakeWise: `deposit()` on the pool
- Includes:
  - Pre-flight wallet balance check
  - Gas estimation + buffer
  - Wait for receipt and success verification
- Requires `RPC_URL` and a private key in the request body for `/execute` (see Security)

---

## API Endpoints

### Health Check

```bash
GET /health
```

### Get Best Quote

```bash
POST /api/staking/quote
Content-Type: application/json
{
  "amount": "1.0",
  "tokenAddress": "0x...",   // currently unused for ERC20 flows; ETH assumed
  "chainId": 1,               // only mainnet supported in registry
  "lockPeriod": 365,          // days; optional
  "minApy": 4.0               // optional filter
}
```

Response: `{ success: true, quote: StakingQuote }` or 404 if none

### Get All Quotes

```bash
POST /api/staking/quotes
Content-Type: application/json
{
  "amount": "1.0",
  "tokenAddress": "0x...",
  "chainId": 1,
  "lockPeriod": 365
}
```

Response: `{ success: true, quotes: StakingQuote[], count: number }`

### Execute Best Deal

```bash
POST /api/staking/execute
Content-Type: application/json
{
  "amount": "1.0",
  "tokenAddress": "0x...",
  "chainId": 1,
  "lockPeriod": 365,
  "privateKey": "0xYOUR_PRIVATE_KEY"
}
```

Response: `ExecutionResult` with `transactionHash` on success

---

## Data Model (Essentials)

- `StakingRequest`: amount, tokenAddress, chainId, lockPeriod?, minApy?
- `StakingQuote`: protocol, amount, expectedReturn, apy, fees, lockPeriod?, estimatedRewards
- `ExecutionResult`: success, transactionHash?, protocol, amount, error?

---

## APY Strategy and Validation

- Multiple upstream sources with short-lived cache (5 minutes)
- Sanity range enforced (0–20%) to discard erroneous feeds
- Fallback APYs (e.g., Lido 4.5%, Rocket Pool 4.2%, StakeWise 4.0%)

---

## Environment and Configuration

- Required:
  - `RPC_URL`: Ethereum RPC endpoint (e.g., Infura/Alchemy mainnet)
- Optional:
  - `PORT`: HTTP port (default 3000)

---

## Running the Project

Install dependencies:

```bash
npm install
```

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Diagnostics:

```bash
npm run test:apy   # test APY sources and fee fetcher
npm run test:apis  # probe Lido/Rocket Pool/DeFiLlama endpoints
```

---

## Security Considerations

- The `/execute` endpoint accepts a raw private key in the request body. This is NOT recommended for production.
- Recommendations:
  - Remove private key handling from the backend API
  - Use client-side wallets (e.g., WalletConnect) or server-side custody with an HSM/secure vault
  - Add authentication, authorization, and rate-limiting to the API

---

## Known Limitations and Next Steps

- ETH-native staking flows only; `tokenAddress` is not yet used for ERC20 approvals
- Scoring does not incorporate gas costs or LSD exchange rates (e.g., stETH/rETH premiums/discounts)
- Fee data is simplified; on-chain fee reads could be expanded per protocol
- Registry supports mainnet only and just three protocols
- Missing transaction status polling endpoint for clients

---

## Project Structure

```bash
src/
├── index.ts                   # Main entry point (Express app)
├── types.ts                   # Shared interfaces and types
├── protocols/
│   ├── contractABIs.ts        # Minimal ABIs for protocol interactions
│   └── protocolRegistry.ts    # Supported protocols and addresses
├── routes/
│   └── staking.ts             # REST routes
└── services/
    ├── aggregator.ts          # Orchestrates querying, scoring, execution
    ├── apyFetcher.ts          # APY fetching with multi-source strategy
    ├── bestDealFinder.ts      # Composite scoring model
    ├── protocolQuerier.ts     # Builds quotes from registry + APY + limits
    └── transactionExecutor.ts # On-chain execution for Lido/RP/StakeWise
```
