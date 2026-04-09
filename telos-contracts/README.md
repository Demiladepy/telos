# TELOS Contracts

Utilities and Soroban contracts for the TELOS on-chain registry layer.

## Agent Registry Contract

Contract crate: `contracts/agent-registry`

Deployed testnet contract id:

- `CDDSHGZ3AFQT3PJY2XFBOG7STKEBDBG2XORM6TROMMMOZLMM57PZJGLE`

## Prerequisites

- `stellar` CLI installed and on `PATH`
- A funded Stellar identity alias (example: `alice`)

## Registry Helper Script

This repo includes a helper at `scripts/registry.mjs` to invoke:

- `list_ids`
- `get`
- `register`
- `update`
- `remove`

and generate deterministic `agent_id` values from names.

### Environment (optional)

Set default contract id once:

```bash
export TELOS_REGISTRY_CONTRACT_ID=CDDSHGZ3AFQT3PJY2XFBOG7STKEBDBG2XORM6TROMMMOZLMM57PZJGLE
```

### Generate agent id

```bash
node scripts/registry.mjs id --name "weather-agent"
```

### List ids

```bash
node scripts/registry.mjs list --source-account alice
```

### Get profile

```bash
node scripts/registry.mjs get --source-account alice --agent-id <hex32>
```

### Register profile

```bash
node scripts/registry.mjs register \
  --source-account alice \
  --agent-id <hex32> \
  --owner alice \
  --pay-to GDC5PIYFKTR3RBPCLZZTFGM7YE7I2Y3ZKXJA4BWINDGIRFUKJ5JQ2AQY \
  --endpoint http://localhost:3001 \
  --metadata-uri ipfs://telos/weather-agent-v1
```

### Update profile

```bash
node scripts/registry.mjs update \
  --source-account alice \
  --agent-id <hex32> \
  --pay-to GDC5PIYFKTR3RBPCLZZTFGM7YE7I2Y3ZKXJA4BWINDGIRFUKJ5JQ2AQY \
  --endpoint http://localhost:3001 \
  --metadata-uri ipfs://telos/weather-agent-v2
```

### Remove profile

```bash
node scripts/registry.mjs remove --source-account alice --agent-id <hex32>
```

## Notes

- `agent_id` is required as 32-byte hex (64 hex chars).
- For writes (`register`, `update`, `remove`), transactions are sent with `--send yes`.
- `--owner` accepts either a Stellar `G...` address or a local key alias (e.g., `alice`).

