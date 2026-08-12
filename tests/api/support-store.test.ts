import { describe, expect, test } from 'vitest';


describe('machine support state', () => {
  test.each([
    ['darwin', '/Users/alice', {}, '/Users/alice/Library/Application Support/Cumpa/support.json'],
    ['win32', 'C:\\Users\\alice', { LOCALAPPDATA: 'C:\\Local' }, 'C:\\Local\\Cumpa\\support.json'],
    ['win32', 'C:\\Users\\alice', { APPDATA: 'C:\\Roaming' }, 'C:\\Roaming\\Cumpa\\support.json'],
    ['linux', '/home/alice', { XDG_STATE_HOME: '/state' }, '/state/cumpa/support.json'],
    ['linux', '/home/alice', {}, '/home/alice/.local/state/cumpa/support.json'],
  ] as const)('resolves %s state independently of repository roots', (platform, home, env, expected) => {
    expect(resolveSupportStatePath({ platform, home, env })).toBe(expected);
  });
});
