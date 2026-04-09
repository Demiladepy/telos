#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function run(cmd, args, { inherit = false } = {}) {
  const result = spawnSync(cmd, args, {
    stdio: inherit ? "inherit" : "pipe",
    shell: false,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    fail(`Command failed: ${cmd} ${args.join(" ")}\n${stderr || stdout}`);
  }
  return (result.stdout || "").trim();
}

function ensureHex32(value, label) {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    fail(`${label} must be a 32-byte hex string (64 hex chars)`);
  }
  return normalized.toLowerCase();
}

function fromNameToHexId(name) {
  return createHash("sha256").update(name).digest("hex");
}

function getArg(args, name, fallbackEnv) {
  return args[name] || (fallbackEnv ? process.env[fallbackEnv] : undefined);
}

function getRequired(args, name, fallbackEnv) {
  const value = getArg(args, name, fallbackEnv);
  if (!value) fail(`Missing required --${name}`);
  return value;
}

function getOwnerAddress(ownerOrAlias) {
  if (ownerOrAlias.startsWith("G") && ownerOrAlias.length >= 56) {
    return ownerOrAlias;
  }
  const out = run("stellar", ["keys", "address", ownerOrAlias]);
  return out.split(/\r?\n/).at(-1).trim();
}

function invokeBase({ contractId, network, sourceAccount }) {
  return [
    "contract",
    "invoke",
    "--id",
    contractId,
    "--network",
    network,
    "--source-account",
    sourceAccount,
  ];
}

function help() {
  console.log(`telos registry contract helper

Usage:
  node scripts/registry.mjs id --name "weather-agent"
  node scripts/registry.mjs list --contract-id <C...> --source-account alice
  node scripts/registry.mjs get --contract-id <C...> --source-account alice --agent-id <hex32>
  node scripts/registry.mjs register --contract-id <C...> --source-account alice --agent-id <hex32> --owner alice --pay-to <G...> --endpoint <url> --metadata-uri <uri>
  node scripts/registry.mjs update --contract-id <C...> --source-account alice --agent-id <hex32> --pay-to <G...> --endpoint <url> --metadata-uri <uri>
  node scripts/registry.mjs remove --contract-id <C...> --source-account alice --agent-id <hex32>

Defaults:
  --network defaults to stellar:testnet
  --contract-id can come from TELOS_REGISTRY_CONTRACT_ID
`);
}

function main() {
  const [, , command, ...rest] = process.argv;
  if (!command || command === "help" || command === "--help") {
    help();
    return;
  }

  const args = parseArgs(rest);
  const network = args.network || "testnet";

  if (command === "id") {
    const name = getRequired(args, "name");
    console.log(fromNameToHexId(name));
    return;
  }

  const contractId = getRequired(args, "contract-id", "TELOS_REGISTRY_CONTRACT_ID");
  const sourceAccount = getRequired(args, "source-account");
  const base = invokeBase({ contractId, network, sourceAccount });

  if (command === "list") {
    const out = run("stellar", [...base, "--", "list_ids"]);
    console.log(out);
    return;
  }

  if (command === "get") {
    const agentId = ensureHex32(getRequired(args, "agent-id"), "agent-id");
    const out = run("stellar", [...base, "--", "get", "--agent_id", agentId]);
    console.log(out);
    return;
  }

  if (command === "register") {
    const agentId = ensureHex32(getRequired(args, "agent-id"), "agent-id");
    const owner = getOwnerAddress(getRequired(args, "owner"));
    const payTo = getRequired(args, "pay-to");
    const endpoint = getRequired(args, "endpoint");
    const metadataUri = getRequired(args, "metadata-uri");
    run(
      "stellar",
      [
        ...base,
        "--send",
        "yes",
        "--",
        "register",
        "--agent_id",
        agentId,
        "--owner",
        owner,
        "--pay_to",
        payTo,
        "--endpoint",
        endpoint,
        "--metadata_uri",
        metadataUri,
      ],
      { inherit: true },
    );
    return;
  }

  if (command === "update") {
    const agentId = ensureHex32(getRequired(args, "agent-id"), "agent-id");
    const payTo = getRequired(args, "pay-to");
    const endpoint = getRequired(args, "endpoint");
    const metadataUri = getRequired(args, "metadata-uri");
    run(
      "stellar",
      [
        ...base,
        "--send",
        "yes",
        "--",
        "update",
        "--agent_id",
        agentId,
        "--pay_to",
        payTo,
        "--endpoint",
        endpoint,
        "--metadata_uri",
        metadataUri,
      ],
      { inherit: true },
    );
    return;
  }

  if (command === "remove") {
    const agentId = ensureHex32(getRequired(args, "agent-id"), "agent-id");
    run("stellar", [...base, "--send", "yes", "--", "remove", "--agent_id", agentId], {
      inherit: true,
    });
    return;
  }

  fail(`Unknown command: ${command}`);
}

main();

