
import { describe, expect, it } from 'vitest';

import { assessOmpIsolation, discoverOmpIsolationCapability } from '../helpers/omp-profile.js';

describe('OMP isolation capability', () => {
  it('accepts empty XDG redirect directories when HOME and PI agent state are redirected', () => {
    expect(assessOmpIsolation({
      homeHasOmpTree: true,
      agentDatabasePresent: true,
      resolvedRealProfilePath: false,
      realProfileChanged: false,
    })).toMatchObject({
      ompAvailable: true,
      honoredVariables: ['HOME', 'PI_CODING_AGENT_DIR'],
      unhonoredVariables: [],
      contaminated: false,
    });
  });

  it('marks real-profile resolution or mutation as contaminated even when redirects are honored', () => {
    expect(assessOmpIsolation({
      homeHasOmpTree: true,
      agentDatabasePresent: true,
      resolvedRealProfilePath: true,
      realProfileChanged: false,
    }).contaminated).toBe(true);
  });

  it('proves this machine redirects HOME and PI agent state', () => {
    const capability = discoverOmpIsolationCapability();
    console.log(`[omp-isolation] ${JSON.stringify(capability)}`);
    expect(capability).toMatchObject({
      ompAvailable: true,
      honoredVariables: ['HOME', 'PI_CODING_AGENT_DIR'],
      unhonoredVariables: [],
      contaminated: false,
    });
  }, 180_000);
});

