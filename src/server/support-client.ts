import { z } from 'zod';

const installationStatusSchema = z.strictObject({ status: z.enum(['unverified', 'verified']) });
const recoveryRequestSchema = z.strictObject({ kind: z.literal('accepted'), challengeId: z.string().min(1), pollToken: z.string().min(1), expiresAt: z.string().datetime() });
const recoveryStatusSchema = z.strictObject({ kind: z.enum(['pending', 'verified', 'expired']) });

export type HostedSupportClient = Readonly<{
  checkoutUrl(installationId: string): string | undefined;
  status(installationId: string): Promise<'unverified' | 'verified' | undefined>;
  requestRecovery(input: Readonly<{ installationId: string; email: string }>): Promise<Readonly<{ challengeId: string; pollToken: string; expiresAt: string }> | undefined>;
  recoveryStatus(input: Readonly<{ challengeId: string; pollToken: string }>): Promise<'pending' | 'verified' | 'expired' | undefined>;
  close(): void;
}>;

async function responseJson(response: Response): Promise<unknown | undefined> {
  const contentLength = Number(response.headers.get('content-length') ?? '0');
  if (!response.ok || contentLength > 8192) return undefined;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 8192) return undefined;
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { return undefined; }
}

export function createHostedSupportClient(options: Readonly<{
  serviceUrl?: string;
  paymentUrl?: string;
  fetch?: typeof fetch;
}> = {}): HostedSupportClient {
  const serviceUrl = options.serviceUrl ?? process.env.CUMPA_SUPPORT_SERVICE_URL;
  const paymentUrl = options.paymentUrl ?? process.env.CUMPA_SUPPORT_PAYMENT_URL;
  const service = serviceUrl === undefined ? undefined : new URL(serviceUrl);
  const payment = paymentUrl === undefined ? undefined : new URL(paymentUrl);
  if (service?.protocol !== 'https:' || payment?.protocol !== 'https:') {
    return { checkoutUrl: () => undefined, status: async () => undefined, requestRecovery: async () => undefined, recoveryStatus: async () => undefined, close: () => undefined };
  }
  const request = options.fetch ?? fetch;
  const controller = new AbortController();
  const fetchJson = async (path: string, init: RequestInit = {}): Promise<unknown | undefined> => {
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      return await responseJson(await request(new URL(path, service), { ...init, signal: controller.signal, headers: { accept: 'application/json', 'cache-control': 'no-store', ...(init.headers ?? {}) } }));
    } catch { return undefined; } finally { clearTimeout(timeout); }
  };
  return {
    checkoutUrl(installationId) { const url = new URL(payment); url.searchParams.set('client_reference_id', installationId); return url.toString(); },
    async status(installationId) { const result = installationStatusSchema.safeParse(await fetchJson(`/v1/installations/${encodeURIComponent(installationId)}/status`)); return result.success ? result.data.status : undefined; },
    async requestRecovery(input) { const result = recoveryRequestSchema.safeParse(await fetchJson('/v1/recovery-requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })); return result.success ? result.data : undefined; },
    async recoveryStatus(input) { const result = recoveryStatusSchema.safeParse(await fetchJson(`/v1/recovery-requests/${encodeURIComponent(input.challengeId)}/status`, { headers: { authorization: `Bearer ${input.pollToken}` } })); return result.success ? result.data.kind : undefined; },
    close() { controller.abort(); },
  };
}
