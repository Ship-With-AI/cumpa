import type { RecoveryEmailSender } from './recovery.js';

export function createRecoveryEmailSender(config: { resendApiKey: string; emailFrom: string; publicBaseUrl: string }, fetcher: typeof fetch = fetch): RecoveryEmailSender {
  return {
    async send({ email, magicToken }): Promise<void> {
      const signal = AbortSignal.timeout(1000);
      const response = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        signal,
        headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: config.emailFrom, to: [email], subject: 'Restore Cumpa support', html: `<form method="post" action="${config.publicBaseUrl}/v1/recovery/${magicToken}/confirm"><p>Confirm restoring Cumpa support.</p><button type="submit">Confirm</button></form>` }),
      });
      if (!response.ok) throw new Error('recovery-email-unavailable');
    },
  };
}
