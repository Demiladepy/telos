import { spawnSync } from "child_process";

/**
 * If TELOS_REGISTRY_SIGNER_SECRET is set, imports it into Stellar CLI as
 * TELOS_REGISTRY_SOURCE_ACCOUNT (e.g. "alice") so `stellar contract invoke` can sign.
 * Uses stdin (works more reliably than shell pipes on Windows Git Bash).
 */
export function bootstrapStellarIdentityFromEnv(): void {
  const secret = process.env.TELOS_REGISTRY_SIGNER_SECRET?.trim();
  const alias = process.env.TELOS_REGISTRY_SOURCE_ACCOUNT?.trim();

  if (!secret) return;
  if (!alias) {
    console.warn(
      "[telos-registry] TELOS_REGISTRY_SIGNER_SECRET set but TELOS_REGISTRY_SOURCE_ACCOUNT missing; skipping key import",
    );
    return;
  }

  if (!secret.startsWith("S")) {
    throw new Error("TELOS_REGISTRY_SIGNER_SECRET must be a Stellar secret key (S...)");
  }

  const result = spawnSync(
    "stellar",
    ["keys", "add", alias, "--secret-key", "--overwrite"],
    {
      input: `${secret}\n`,
      encoding: "utf8",
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );

  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`Failed to import Stellar identity "${alias}": ${err || "unknown error"}`);
  }

  console.log(`[telos-registry] Stellar identity "${alias}" loaded from TELOS_REGISTRY_SIGNER_SECRET`);
}

export function getStellarPublicKey(alias: string): string {
  const result = spawnSync("stellar", ["keys", "address", alias], {
    shell: false,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
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
