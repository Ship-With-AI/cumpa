import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const textFile = /\.(?:js|mjs|cjs|json|html|css)$/u;
const protectedValue = /(?:\b(?:sk|rk|pk)_[A-Za-z0-9_]+|\bwhsec_[A-Za-z0-9_]+|\bgh[ops]_[A-Za-z0-9_]+|\b(?:STRIPE|SUPABASE|GITHUB)_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|CLIENT_ID|PRICE_ID|WEBHOOK_ENDPOINT_ID)\b|(?:oauth|access_token|id_token|payer_email|profile_email)=)/iu;
const legacyRuntime = /(?:services\/support|render\.ya?ml|RESEND_API_KEY|magic[-_ ]?link|recovery[-_ ]?token|DATABASE_URL|EMAIL_LOOKUP_HMAC_KEY|RECOVERY_TOKEN_HMAC_KEY)/iu;

function fail(message) {
  throw new Error(message);
}

function originPolicy(origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    fail('expected support origin must be canonical');
  }
  const ref = url.hostname.slice(0, -'.supabase.co'.length);
  if (
    url.protocol !== 'https:' || url.username || url.password || url.port
    || url.pathname !== '/' || url.search || url.hash
    || !/^[a-z0-9]{20}$/u.test(ref) || url.origin !== `https://${ref}.supabase.co`
  ) fail('expected support origin must be canonical');
  const routes = [
    '/auth/v1/callback',
    '/auth/v1/settings',
    '/functions/v1/support-api',
    '/functions/v1/support-flow',
    '/functions/v1/support-flow/callback',
    '/functions/v1/support-flow/complete',
    '/functions/v1/stripe-webhook',
  ].map((path) => `${url.origin}${path}`);
  return { origin: url.origin, ref, allowed: [url.origin, ...routes] };
}

function parseArguments(argv) {
  if (argv.length === 0) return {};
  if (argv.length !== 4 || argv[0] !== '--expected-support-origin' || argv[2] !== '--require-configured-launcher') {
    fail('production scanner accepts only --expected-support-origin ORIGIN --require-configured-launcher PATH');
  }
  return { policy: originPolicy(argv[1]), launcher: argv[3] };
}

function scanText(path, content, policy) {
  if (legacyRuntime.test(path) || legacyRuntime.test(content)) fail(`legacy runtime content: ${path}`);
  if (protectedValue.test(content)) fail(`protected value: ${path}`);
  if (!policy) {
    if (/^(?:[a-z0-9]{20})$/imu.test(content)) fail(`unexpected Supabase origin or raw Supabase project ref: ${path}`);
    return;
  }
  let remainder = content;
  for (const allowed of policy.allowed) remainder = remainder.replaceAll(allowed, '');
  if (remainder.includes('.supabase.co')) fail(`unexpected Supabase origin: ${path}`);
  if (new RegExp(`(?<![a-z0-9])${policy.ref}(?![a-z0-9])`, 'iu').test(remainder)) fail(`raw Supabase project ref: ${path}`);
}

const options = parseArguments(process.argv.slice(2));
const directory = mkdtempSync(join(tmpdir(), 'cumpa-artifact-'));
try {
  execFileSync('npm', ['run', 'build'], { encoding: 'utf8', stdio: 'pipe' });
  const [dryRun] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' }));
  const inventory = dryRun.files.map((file) => file.path);
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory], { encoding: 'utf8' }));
  const launcher = options.launcher?.replace(/^dist\//u, '');
  const packagedLauncher = launcher && `dist/${launcher}`;
  if (options.policy && inventory.filter((path) => path === packagedLauncher).length !== 1) fail('configured launcher is missing from package inventory');
  execFileSync('tar', ['-xzf', join(directory, pack.filename), '-C', directory]);
  let launcherAssignments = 0;
  for (const file of inventory.filter((path) => textFile.test(path))) {
    const content = readFileSync(join(directory, 'package', file), 'utf8');
    scanText(`package/${file}`, content, options.policy);
    if (options.policy && file === packagedLauncher) {
      launcherAssignments += [...content.matchAll(new RegExp(`(?:^|\\n)CUMPA_SUPPORT_SERVICE_URL=${options.policy.origin.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}(?=\\n|$)`, 'gu'))].length;
    }
  }
  if (options.policy && launcherAssignments !== 1) fail('configured launcher requires exactly one configured launcher assignment');
  process.stdout.write('Production artifact scan passed.\n');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
