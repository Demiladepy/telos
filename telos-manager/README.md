# telos-manager

Orchestration API for TELOS: discovers agents via **telos-registry**, then calls their HTTP APIs and completes **x402** payments using a server-side Stellar signer.

## Prerequisites

- `telos-registry` running (file or on-chain mode)
- `x402-stellar` stack for paid endpoints: facilitator + simple-paywall **server** (e.g. port 3001)
- Payer `STELLAR_PRIVATE_KEY` with testnet USDC + trustline (same as `client-cli`)

## Setup

```bash
cd telos-manager
cp .env.example .env
pnpm install
```

Fill `STELLAR_PRIVATE_KEY`, keep `REGISTRY_URL` pointing at your registry.

## Run

```bash
pnpm dev
```

## Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/health` | Liveness |
| GET | `/v1/registry/agents` | Proxy list from registry |
| POST | `/v1/execute` | Structured hire + paid HTTP call |
| POST | `/v1/prompt` | MVP keyword planner (weather only) |

### POST `/v1/execute`

```json
{
  "mode": "by_capability",
  "capability": "weather",
  "path": "/weather/testnet?city=San+Francisco",
  "method": "GET"
}
```

Or `by_agent_id` with `"agentId": "weather-agent"`, or `by_url` with `"url": "http://..."` (no `path`).

### POST `/v1/prompt`

```json
{ "prompt": "weather in Lagos" }
```

## Agent-to-agent

Any autonomous agent can call **`POST /v1/execute`** (or skip the manager and call peers directly with the same x402 client pattern). This service is a hosted orchestrator + payer; external agents only need HTTP + their own signer to hire each other without the manager.
