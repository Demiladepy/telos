import { spawnSync, type SpawnSyncReturns } from "child_process";

const STELLAR_BINS = process.platform === "win32" ? ["stellar", "stellar.cmd"] : ["stellar"];

function stellarCliAppearsMissing(result: SpawnSyncReturns<string>): boolean {
  if (result.error && "code" in result.error) {
    const code = result.error.code;
    if (code === "ENOENT" || code === "EINVAL") return true;
  }
  if (result.error && `${result.error.message ?? ""}`.toLowerCase().includes("einval")) {
    return true;
  }
  const msg = `${result.stderr ?? ""} ${result.stdout ?? ""} ${result.error?.message ?? ""}`.toLowerCase();
  return (
    msg.includes("not recognized") ||
    msg.includes("enoent") ||
    msg.includes("no such file or directory") ||
    msg.includes("is not recognized as an internal or external command")
  );
}

function runStellar(args: string[], input?: string): SpawnSyncReturns<string> {
  let lastResult: SpawnSyncReturns<string> | undefined;
  for (const bin of STELLAR_BINS) {
    const result = spawnSync(bin, args, {
      input,
      encoding: "utf8",
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
    lastResult = result;
    if (!stellarCliAppearsMissing(result)) return result;
  }
  return lastResult ?? spawnSync("stellar", args, { encoding: "utf8", shell: false, stdio: "pipe" });
}

/**
 * If TELOS_REGISTRY_SIGNER_SECRET is set, imports it into Stellar CLI as
 * TELOS_REGISTRY_SOURCE_ACCOUNT (e.g. "alice") so `stellar contract invoke` can sign.
 * Uses stdin (works more reliably than shell pipes on Windows Git Bash).
 */
export function bootstrapStellarIdentityFromEnv(): void {
  if (process.env.TELOS_REGISTRY_SKIP_STELLAR_BOOTSTRAP?.trim() === "1") {
    console.warn("[telos-registry] Skipping Stellar CLI bootstrap (TELOS_REGISTRY_SKIP_STELLAR_BOOTSTRAP=1)");
    return;
  }

  const contractId = process.env.TELOS_REGISTRY_CONTRACT_ID?.trim();
  const secret = process.env.TELOS_REGISTRY_SIGNER_SECRET?.trim();
  const alias = process.env.TELOS_REGISTRY_SOURCE_ACCOUNT?.trim();

  if (!secret) return;

  if (!contractId || !alias) {
    console.warn(
      "[telos-registry] TELOS_REGISTRY_SIGNER_SECRET is set but on-chain mode is incomplete " +
        "(need TELOS_REGISTRY_CONTRACT_ID and TELOS_REGISTRY_SOURCE_ACCOUNT); skipping key import",
    );
    return;
  }

  const stellarAlias = alias;

  if (!secret.startsWith("S")) {
    throw new Error("TELOS_REGISTRY_SIGNER_SECRET must be a Stellar secret key (S...)");
  }

  const result = runStellar(["keys", "add", stellarAlias, "--secret-key", "--overwrite"], `${secret}\n`);

  if (stellarCliAppearsMissing(result)) {
    console.warn(
      `[telos-registry] Stellar CLI not on PATH — skipped importing "${stellarAlias}" from TELOS_REGISTRY_SIGNER_SECRET.\n` +
        `  Install: https://developers.stellar.org/docs/tools/developer-tools\n` +
        `  Or run once in a terminal where stellar works:\n` +
        `    stellar keys add ${stellarAlias} --secret-key --overwrite\n` +
        `  Or set TELOS_REGISTRY_SKIP_STELLAR_BOOTSTRAP=1 after adding the key manually.\n` +
        `  On-chain registry reads/writes need that alias in the Stellar CLI keystore.`,
    );
    return;
  }

  if (result.error) {
    throw new Error(
      `Could not run Stellar CLI: ${result.error.message}. Install Stellar CLI and ensure "stellar" is on PATH, ` +
        `or set TELOS_REGISTRY_SKIP_STELLAR_BOOTSTRAP=1 if you already ran "stellar keys add ${stellarAlias}" manually.`,
    );
  }

  if (result.status !== 0) {
    const out = [result.stderr, result.stdout].map((s) => (s || "").trim()).filter(Boolean).join("\n");
    throw new Error(
      `Failed to import Stellar identity "${stellarAlias}" (exit ${result.status}). ${out || "No CLI output — on Windows try PowerShell or Git Bash where stellar is on PATH."}`,
    );
  }

  console.log(`[telos-registry] Stellar identity "${stellarAlias}" loaded from TELOS_REGISTRY_SIGNER_SECRET`);
}

export function getStellarPublicKey(alias: string): string {
  const result = runStellar(["keys", "address", alias]);
  if (result.status !== 0) {
    const err = (result.stderr || "").trim();
    throw new Error(`stellar keys address ${alias} failed: ${err || "unknown"}`);
  }
  const lines = (result.stdout || "").trim().split(/\r?\n/);
  const addr = lines.at(-1)?.trim() ?? "";
  if (!addr.startsWith("G")) {
    throw new Error(`Unexpected stellar keys address output: ${result.stdout}`);
  }
  return addr;
}
