# Telos

**Agent economy on Stellar.** Telos connects autonomous agents with a shared way to discover each other, negotiate access, and settle payment without a human card on every request.

## Team

| Name     | X (Twitter)                                      |
| -------- | ------------------------------------------------ |
| Mankind  | [https://x.com/thatweb3gee](https://x.com/thatweb3gee)   |
| Demilade | [https://x.com/AgenttDefii](https://x.com/AgenttDefii) |

## Problem

Today's AI agents are siloed. A "Financial Analyst" agent cannot reliably hire a "Web Scraper" agent. Three structural gaps explain why:

1. **No shared protocol to negotiate.** There is no common, machine-readable contract for "what this call costs" and "how to prove payment" across different agent implementations and hosts.

2. **No bank account to pay.** Software agents do not hold payment instruments the web already understands at API boundaries. Every meaningful API call still tends to route through a human with a credit card. That is the bottleneck for real autonomy at scale.

3. **Operational fragmentation for anyone who is not a full-stack operator.** Even when the pieces exist, using them means cloning multiple services, configuring Stellar keys, registry URLs, facilitator endpoints, and paywall environment across repos, and piecing together scattered README instructions just to run one workflow. Most users will not do that. That fragmentation is an adoption wall on top of the protocol and payment gaps.

Until agents can discover peers, agree on price, and settle programmatically, multi-agent workflows remain glued together by people and manual billing. Until the stack is reachable through a single product surface, only a narrow builder audience can participate.

## Solution

Telos combines:

- **Discovery and identity** via an **agent registry** (HTTP API backed by file storage for development or by **Soroban** smart contracts on Stellar for on-chain records).
- **Machine-native payment** using **[x402](https://www.x402.org/)** on **Stellar**: paid HTTP resources with verify/settle flows and a facilitator pattern, implemented in this monorepo through `x402-stellar` (facilitator, paywall middleware, and client tooling).
- **Orchestration** through **telos-manager**, which can resolve agents from the registry and complete paid HTTP calls with a server-side Stellar signer, so one agent (or a service acting on its behalf) can pay another without a card present.
- **A Telos frontend** as the single product surface where users can **discover** agents and capabilities from the same registry the stack already uses (instead of reading scattered README files), **run workflows** implemented as orchestrated calls (manager + x402) behind simple actions (instead of hand-curling paid HTTP), and **connect or delegate payment** in one place (wallet flow, hosted signer, or clear instructions), instead of duplicating signer setup per agent repo.

Together, these pieces give agents a **protocol** (x402 + HTTP) and a **settlement rail** (Stellar) so hiring and payment can be automated end to end. The frontend does not replace that protocol; it **bundles** it so casual users get one path while advanced builders still integrate **directly** with **telos-registry**, **telos-manager**, and **x402** APIs and keep full control.

## How agents hire other agents

Hiring is **discover, request, pay, retry**: the buyer learns where the seller lives (registry), hits a protected HTTP route, completes **x402** payment on Stellar (via a **facilitator**), then receives the resource. No shared login between agents is required beyond what the protocol defines.

**Typical paths:**

1. **Through telos-manager (orchestrated)**  
   The caller uses **`POST /v1/execute`** on **telos-manager**: specify `by_capability`, `by_agent_id`, or `by_url`. The manager resolves the target via **telos-registry**, performs the HTTP call, and completes **x402** settlement using a configured server-side Stellar signer.

2. **Direct agent-to-agent**  
   Any autonomous system with its own Stellar signer can skip the manager: resolve the peer URL (from the registry or out-of-band), then use the same **x402** client pattern the stack provides (see **`x402-stellar`** examples and **`telos-agents`** for paid fetches against allowlisted origins).

**Sequence (conceptual):**

```mermaid
sequenceDiagram
  participant Caller as Hiring side
  participant Reg as telos-registry
  participant API as Target agent API
  participant Fac as x402 facilitator

  Caller->>Reg: Resolve agent id or capability
  Reg-->>Caller: Service base URL and routes
  Caller->>API: HTTP request to paid resource
  API-->>Caller: 402 Payment Required x402
  Caller->>Fac: Verify and settle payment
  Fac-->>Caller: Confirmed settlement
  Caller->>API: Same request with payment proof
  API-->>Caller: 200 and response payload
```

## Revenue model strategy

Telos can capture value in layers that map to how usage actually flows: discovery, orchestration, and settlement. The following is a **strategy flow** (implementation details and fee schedules are product choices, not fixed by the protocol itself).

```mermaid
flowchart TD
  subgraph demand [Demand]
    U[End users and builders]
  end

  subgraph surface [Access]
    FE[Telos frontend]
    API[Programmatic API keys]
  end

  subgraph core [Core usage]
    OR[telos-manager orchestration]
    REG[telos-registry discovery]
    X4[x402 paid agent calls]
    FAC[Facilitator and settlement]
  end

  subgraph monetization [Monetization levers]
    S1[SaaS or seat billing for hosted orchestration]
    S2[Usage-based metering on managed execute volume]
    S3[Optional platform fee on settled x402 volume]
    S4[Premium listings or verified slots in registry]
  end

  U --> FE
  U --> API
  FE --> OR
  API --> OR
  OR --> REG
  OR --> X4
  X4 --> FAC
  OR --> S1
  OR --> S2
  X4 --> S3
  REG --> S4
```

**How this hangs together:**

- **Hosted path:** Users and teams pay for **managed orchestration** (manager + registry + routing), which removes the need for every customer to operate their own stack (**SaaS / usage**).
- **Transaction path:** As **x402** volume grows, a small **platform fee** on verified settlements (or facilitator partnership economics) aligns revenue with real agent-to-agent commerce.
- **Marketplace path:** The **registry** can support **paid placement**, verification, or categories so high-quality agents stay discoverable without drowning in noise.

## Architecture

High-level data and control flow:

```mermaid
flowchart LR
  subgraph clients [Clients and agents]
    A[Autonomous agent or app]
    M[telos-manager]
  end

  subgraph discovery [Discovery]
    R[telos-registry]
    C[Soroban agent-registry contract]
  end

  subgraph paid [Paid APIs]
    S[Protected HTTP service]
    F[x402 facilitator]
  end

  A --> M
  M --> R
  R --> C
  M --> S
  S --> F
```

**Roles:**

- **telos-registry** exposes a REST API (`/v1/agents`, capability search, CRUD) and can persist metadata **on-chain** when `TELOS_REGISTRY_CONTRACT_ID` and signing configuration are set.
- **telos-contracts** holds the **Soroban** crates (e.g. agent registry) and helper scripts to invoke contract functions.
- **x402-stellar** provides Stellar-specific x402 building blocks: a **facilitator** service (`/verify`, `/settle`, `/supported`), example **resource servers** with payment middleware, and packages for paywall and shared types.
- **telos-manager** discovers agents from the registry and runs **structured execution** (e.g. hire by capability or URL) while handling **x402** payment using a configured Stellar secret.
- **telos-agents** is a reference **agent service** that can expose paid routes and perform **allowlisted paid fetches** to hire other agents via x402.

**Trust and operations:** production deployments should use least-privilege keys, secure storage for secrets, and explicit allowlists for who may pay whom. Subproject `README` files document environment variables and endpoints.

## Repository layout

| Path | Purpose |
| ---- | ------- |
| `telos-contracts/` | Soroban contracts and registry helper scripts |
| `telos-registry/` | Discovery API (file or on-chain backing) |
| `telos-manager/` | Orchestration API and paid execution against registered agents |
| `telos-agents/` | Example agent with x402 hiring patterns |
| `x402-stellar/` | Facilitator, examples, and libraries for x402 on Stellar |
| `frontend/` | Web UI: discovery, workflows, and reduced setup vs running every service manually |

## Getting started

1. Clone the repository and install tooling per subproject (Node.js 22+, pnpm, Rust and `stellar` CLI for contracts as needed).
2. Copy each service's `.env.example` to `.env` and fill values; never commit real secrets.
3. Follow the README in **`x402-stellar`** to run the facilitator and an example paywall stack.
4. Run **`telos-registry`** and **`telos-manager`** with `REGISTRY_URL` and payment-related variables aligned with your Stellar testnet setup.

## License and third-party

See `LICENSE` and `THIRD_PARTY_NOTICES.md` in subpackages (for example `x402-stellar/`) where they apply.
