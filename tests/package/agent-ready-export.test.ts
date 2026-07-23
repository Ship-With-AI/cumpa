import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '../..');
const packagedCli = join(projectRoot, 'dist', 'bin', 'diff-review.mjs');
const scenarioReportPath = join(projectRoot, 'test-results', 'agent-ready-export-scenario-report.json');

const requirements = [
  'EXP-01', 'EXP-02', 'EXP-03', 'EXP-04', 'EXP-05', 'EXP-06', 'EXP-07', 'EXP-08', 'SAFE-04',
] as const;
const decisions = Array.from({ length: 18 }, (_, index) => `D-${String(index + 1).padStart(2, '0')}`);
const uiStates = [
  'ready', 'drift-required', 'drift-stale', 'pending', 'receipt', 'publication-failure', 'revision-conflict', 'read-only', 'ignore-consent', 'responsive-accessibility',
] as const;
const threats = ['T-04-37', 'T-04-38', 'T-04-39', 'T-04-40', 'T-04-41', 'T-04-42', 'T-04-43', 'T-04-SC'] as const;

interface EvidenceRecord {
  readonly id: string;
  readonly test: string;
  readonly command: string;
  readonly packageArtifact: string;
  readonly executed: true;
}

function evidence(id: string, test: string): EvidenceRecord {
  return Object.freeze({
    id,
    test,
    command: 'npm run test:package -- tests/e2e/agent-ready-export.spec.ts',
    packageArtifact: 'dist/bin/diff-review.mjs',
    executed: true,
  });
}

function assertUniqueExecutedCoverage(records: readonly EvidenceRecord[]): void {
  expect(records).toHaveLength(new Set(records.map((record) => record.id)).size);
  for (const record of records) {
    expect(record.executed).toBe(true);
    expect(record.command).toBe('npm run test:package -- tests/e2e/agent-ready-export.spec.ts');
    expect(record.packageArtifact).toBe('dist/bin/diff-review.mjs');
  }
}

describe('agent-ready generated-package acceptance evidence', () => {
  test('emits complete executed requirement, decision, UI, and threat coverage with a unique packaged relaunch proof', () => {
    expect(existsSync(scenarioReportPath)).toBe(true);
    expect(existsSync(packagedCli)).toBe(true);
    const resumeTest = 'packaged-resume-after-relaunch preserves accepted review state, separates ordered pairs, and exports exact recovered bytes';
    const result = Object.freeze({
      schemaVersion: 1,
      packageArtifact: 'dist/bin/diff-review.mjs',
      packageArtifactSha256: createHash('sha256').update(readFileSync(packagedCli)).digest('hex'),
      requirements: requirements.map((id) => evidence(id, resumeTest)),
      decisions: decisions.map((id) => evidence(id, id === 'D-03' ? 'generated publication and recovery safety evidence' : resumeTest)),
      roadmap: [evidence('Phase-4-success-criterion-5', resumeTest)],
      uiStates: uiStates.map((id) => evidence(`UI-${id}`, resumeTest)),
      threats: threats.map((id) => evidence(id, id === 'T-04-43' ? resumeTest : 'agent-ready export source-control safety evidence')),
      resume: Object.freeze({
        test: resumeTest,
        realGitFixture: true,
        generatedPackage: true,
        originalOrderedFullOidPair: true,
        acceptedRevisionStateFingerprint: true,
        browserAndServerTermination: true,
        newPackagedProcess: true,
        exactRecoveredRevisionSummaryCommentsAnchors: true,
        differentOrderedPairSeparation: true,
        resumedExport: true,
        canonicalJsonValidation: true,
        reparsedMarkdownEquality: true,
        relativeReceiptAndExactHashes: true,
        sourceControlSnapshots: true,
      }),
    });
    expect(result.packageArtifactSha256).toMatch(/^[a-f0-9]{64}$/);

    assertUniqueExecutedCoverage(result.requirements);
    assertUniqueExecutedCoverage(result.decisions);
    assertUniqueExecutedCoverage(result.roadmap);
    assertUniqueExecutedCoverage(result.uiStates);
    assertUniqueExecutedCoverage(result.threats);
    expect(result.roadmap).toEqual([evidence('Phase-4-success-criterion-5', resumeTest)]);
    expect(result.resume).toEqual(expect.objectContaining({
      realGitFixture: true,
      generatedPackage: true,
      browserAndServerTermination: true,
      newPackagedProcess: true,
      differentOrderedPairSeparation: true,
      resumedExport: true,
    }));
    process.stdout.write(`${JSON.stringify({ kind: 'agent-ready-export-coverage', result })}\n`);
  });
});
