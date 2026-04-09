import { x402Client, x402HTTPClient } from "@x402/core/client";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import {
  NETWORK_KEY,
  STELLAR_EXPERT_TX,
  STELLAR_NETWORK,
  STELLAR_PRIVATE_KEY,
  assertConfig,
} from "./config.js";

function isInsufficientBalanceSimulationError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("resulting balance is not within the allowed range");
}

let httpClient: x402HTTPClient | null = null;

function getHttpClient(): x402HTTPClient {
  if (!httpClient) {
    assertConfig();
    const signer = createEd25519Signer(STELLAR_PRIVATE_KEY!, STELLAR_NETWORK!);
    const coreClient = new x402Client().register("stellar:*", new ExactStellarScheme(signer));
    httpClient = new x402HTTPClient(coreClient);
  }
  return httpClient;
}

export type PaidFetchResult = {
  status: number;
  bodyText: string;
  contentType: string | null;
  transaction?: string;
  transactionUrl?: string;
};

export async function paidFetch(url: string, init: RequestInit = {}): Promise<PaidFetchResult> {
  const client = getHttpClient();
  const method = (init.method ?? "GET").toUpperCase();
  const initialResponse = await fetch(url, { ...init, method });

  if (initialResponse.status !== 402) {
    const bodyText = await initialResponse.text();
    return {
      status: initialResponse.status,
      bodyText,
      contentType: initialResponse.headers.get("content-type"),
    };
  }

  const paymentRequired = client.getPaymentRequiredResponse(
    (name: string) => initialResponse.headers.get(name),
    await initialResponse.json(),
  );

  const accepted = paymentRequired.accepts[0];
  if (!accepted) {
    throw new Error("402 response had no acceptable payment options");
  }

  let paymentPayload;
  try {
    paymentPayload = await client.createPaymentPayload(paymentRequired);
  } catch (error) {
    if (isInsufficientBalanceSimulationError(error)) {
      const hint =
        NETWORK_KEY === "testnet"
          ? " Fund testnet USDC (e.g. https://faucet.circle.com/) and ensure trustline."
          : "";
      throw new Error(`Insufficient balance for payment.${hint}`);
    }
    throw error;
  }

  const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);
  const paidResponse = await fetch(url, {
    ...init,
    method,
    headers: {
      ...(init.headers as Record<string, string>),
      ...paymentHeaders,
    },
  });

  const bodyText = await paidResponse.text();

  if (!paidResponse.ok) {
    throw new Error(`Paid request failed: ${paidResponse.status} ${bodyText.slice(0, 500)}`);
  }

  const settlement = client.getPaymentSettleResponse((name: string) =>
    paidResponse.headers.get(name),
  );
  const txHash = settlement.transaction;
  const txUrl = txHash ? `${STELLAR_EXPERT_TX[NETWORK_KEY]}/${txHash}` : undefined;

  return {
    status: paidResponse.status,
    bodyText,
    contentType: paidResponse.headers.get("content-type"),
    transaction: txHash,
    transactionUrl: txUrl,
  };
}
