import { expect, it } from 'vitest';

import { captureRealOmpProfileDigest, discoverOmpIsolationCapability } from '../helpers/omp-profile.js';

it('reproduces the outer marketplace guard boundary', () => {
  const capability = discoverOmpIsolationCapability();
  const before = captureRealOmpProfileDigest();
  const after = captureRealOmpProfileDigest();
  const changed = Object.entries(after).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key as keyof typeof before]));
  console.log(JSON.stringify({ capability, changed }));
  expect(changed).toEqual([]);
}, 360_000);
