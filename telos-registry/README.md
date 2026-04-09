# telos-registry

HTTP discovery API for TELOS agents. Supports **file-backed** storage (dev) or **Soroban on-chain** storage when configured.

## Setup

```bash
cp .env.example .env
pnpm install
```

Edit `.env`:

| Variable | Purpose |
| -------- | ------- |
| `PORT` | Listen port (default `4010`) |
| `TELOS_REGISTRY_CONTRACT_ID` | Deployed registry contract `C...` (enables on-chain mode) |
| `TELOS_REGISTRY_SOURCE_ACCOUNT` | Stellar CLI identity name used to sign invokes (e.g. `alice`) |
| `TELOS_REGISTRY_NETWORK` | Passed to `stellar contract invoke` (e.g. `testnet`) |
| `TELOS_REGISTRY_SIGNER_SECRET` | Optional `S...` secret; on startup imports into CLI as `TELOS_REGISTRY_SOURCE_ACCOUNT` (for production without copying `alice.toml`) |

On-chain mode is active when **both** `TELOS_REGISTRY_CONTRACT_ID` and `TELOS_REGISTRY_SOURCE_ACCOUNT` are set.

If `TELOS_REGISTRY_SIGNER_SECRET` is set, the server runs `stellar keys add <alias> --secret-key --overwrite` before serving (requires `stellar` on `PATH`).

## Run

```bash
pnpm dev
```

Health: `GET /health` includes `storage: "onchain" | "file"`.

## API

- `GET /v1/agents`
- `GET /v1/agents/:id`
- `PUT /v1/agents/:id`
- `DELETE /v1/agents/:id`
- `GET /v1/agents/search/capability/:q`
