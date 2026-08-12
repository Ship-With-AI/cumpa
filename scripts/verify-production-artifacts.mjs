import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'cumpa-artifact-'));
try {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory], { encoding: 'utf8' }));
  const inventory = pack.files.map((file) => file.path);
  const forbidden = /(^|\/)(services\/support|\.env)|STRIPE_(?:API_KEY|WEBHOOK_SECRET)|DATABASE_URL|RESEND_API_KEY|EMAIL_LOOKUP_HMAC_KEY|RECOVERY_TOKEN_HMAC_KEY/;
  if (inventory.some((path) => forbidden.test(path))) throw new Error('npm artifact includes hosted source or secret-shaped file');
  execFileSync('tar', ['-xzf', join(directory, pack.filename), '-C', directory]);
  for (const file of inventory.filter((path) => /\.(?:js|mjs|json|html|css)$/.test(path))) {
    if (forbidden.test(readFileSync(join(directory, 'package', file), 'utf8'))) throw new Error(`npm artifact includes forbidden content: ${file}`);
  }
  process.stdout.write('Production artifact scan passed.\n');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
