import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, test } from 'vitest';
import { hasObservedNativeReExport } from '../helpers/agent-ready-export-target.js';


const projectRoot = resolve(import.meta.dirname, '../..');
const packagedCli = join(projectRoot, 'dist', 'bin', 'diff-review.mjs');
const playwrightExecutable = join(projectRoot, 'node_modules', '.bin', 'playwright');
const scenarioCommand = ['test', 'tests/e2e'] as const;
const resumeTest = 'packaged-resume-after-relaunch preserves accepted review state, completes target-aware second export, and recovers exact bytes';

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
  readonly executed: boolean;
}

interface ScenarioEvidenceReport {
  readonly schemaVersion: number;
  readonly runId: string;
  readonly scenario: {
    readonly id: string;
    readonly title: string;
    readonly testFile: string;
  };
  readonly packageArtifact: {
    readonly path: string;
    readonly sourceSha256: string;
    readonly packedSha256: string;
  };
  readonly execution: {
    readonly target: {
      readonly platform: string;
      readonly arch: string;
      readonly observedNativeReExport: boolean;
    };
    readonly selectorKind: string;
    readonly originalOrderedFullOidPair: { readonly baseOid: string; readonly headOid: string };
    readonly acceptedState: {
      readonly revision: number;
      readonly summarySha256: string;
      readonly draftSha256: string;
      readonly comment: { readonly state: string; readonly anchor: { readonly side: string; readonly line: number; readonly selectedText: string } };
    };
    readonly closedBrowserPages: number;
    readonly launchedGeneratedProcesses: number;
    readonly terminatedGeneratedProcesses: number;
    readonly differentOrderedPair: { readonly baseOid: string; readonly headOid: string };
    readonly export: {
      readonly receiptPaths: readonly string[];
      readonly firstReceiptPaths: readonly string[];
      readonly firstStablePairSha256: { readonly json: string; readonly markdown: string };
      readonly reExport:
        | Readonly<{ readonly kind: 'exported'; readonly receiptPaths: readonly string[]; readonly stablePairSha256: { readonly json: string; readonly markdown: string } }>
        | Readonly<{ readonly kind: 'reExportUnsupported'; readonly stablePairSha256: { readonly json: string; readonly markdown: string } }>;
      readonly acceptedDraftRevision: number;
      readonly jsonSha256: string;
      readonly markdownSha256: string;
    };
  };
}
 
const observedNativeReExport = hasObservedNativeReExport(process.platform, process.arch);
 

function assertSha256(value: string): void {
  expect(value).toMatch(/^[a-f0-9]{64}$/);
}

function runPackagedScenario(): ScenarioEvidenceReport {
  const reportDirectory = mkdtempSync(join(tmpdir(), 'diff-review-agent-ready-evidence-'));
  const reportPath = join(reportDirectory, 'scenario.json');
  const runId = randomUUID();
  try {
    execFileSync(playwrightExecutable, scenarioCommand, {
      cwd: projectRoot,
      env: {
        ...process.env,
        DIFF_REVIEW_AGENT_READY_EVIDENCE_REPORT: reportPath,
        DIFF_REVIEW_AGENT_READY_EVIDENCE_RUN_ID: runId,
      },
      stdio: 'inherit',
    });
    expect(existsSync(reportPath)).toBe(true);
    const report = JSON.parse(readFileSync(reportPath, 'utf8')) as ScenarioEvidenceReport;
    expect(report.schemaVersion).toBe(1);
    expect(report.runId).toBe(runId);
    expect(report.scenario).toEqual({
      id: 'packaged-resume-after-relaunch',
      title: resumeTest,
      testFile: 'tests/e2e/agent-ready-export.spec.ts',
    });
    expect(report.packageArtifact.path).toBe('dist/bin/diff-review.mjs');
    assertSha256(report.packageArtifact.sourceSha256);
    assertSha256(report.packageArtifact.packedSha256);
    expect(report.packageArtifact.packedSha256).toBe(report.packageArtifact.sourceSha256);
    expect(report.execution.target).toEqual({
      platform: process.platform,
      arch: process.arch,
      observedNativeReExport,
    });
    expect(report.execution.selectorKind).toBe('branch-to-worktree');
    const expectedReceiptPaths = [
      `.diff-review/exports/${report.execution.originalOrderedFullOidPair.baseOid}..${report.execution.originalOrderedFullOidPair.headOid}/review.json`,
      `.diff-review/exports/${report.execution.originalOrderedFullOidPair.baseOid}..${report.execution.originalOrderedFullOidPair.headOid}/review.md`,
    ];
    expect(report.execution.export.firstReceiptPaths).toEqual(expectedReceiptPaths);
    assertSha256(report.execution.export.firstStablePairSha256.json);
    assertSha256(report.execution.export.firstStablePairSha256.markdown);
    if (observedNativeReExport) {
      expect(report.execution.export.reExport.kind).toBe('exported');
      if (report.execution.export.reExport.kind !== 'exported') throw new Error('Expected a native re-export receipt on darwin-arm64.');
      expect(report.execution.export.reExport.receiptPaths).toEqual(expectedReceiptPaths);
    } else {
      expect(report.execution.export.reExport.kind).toBe('reExportUnsupported');
      expect(report.execution.export.reExport.stablePairSha256).toEqual(report.execution.export.firstStablePairSha256);
    }
    expect(report.execution.originalOrderedFullOidPair).toMatchObject({
      baseOid: expect.stringMatching(/^[a-f0-9]{40,64}$/),
      headOid: expect.stringMatching(/^[a-f0-9]{40,64}$/),
    });
    expect(report.execution.originalOrderedFullOidPair.baseOid).not.toBe(report.execution.originalOrderedFullOidPair.headOid);
    expect(report.execution.acceptedState.revision).toBeGreaterThan(0);
    assertSha256(report.execution.acceptedState.summarySha256);
    assertSha256(report.execution.acceptedState.draftSha256);
    expect(report.execution.acceptedState.comment).toMatchObject({
      state: 'open',
      anchor: { side: 'head', line: 10, selectedText: 'export const stableContext10 = 10;' },
    });
    expect(report.execution.closedBrowserPages).toBe(3);
    expect(report.execution.launchedGeneratedProcesses).toBe(3);
    expect(report.execution.terminatedGeneratedProcesses).toBe(3);
    expect(report.execution.differentOrderedPair).toMatchObject({
      baseOid: report.execution.originalOrderedFullOidPair.baseOid,
      headOid: expect.stringMatching(/^[a-f0-9]{40,64}$/),
    });
    expect(report.execution.differentOrderedPair.headOid).not.toBe(report.execution.originalOrderedFullOidPair.headOid);
    expect(report.execution.export.receiptPaths).toEqual(['review.json', 'review.md']);
    expect(report.execution.export.acceptedDraftRevision).toBe(report.execution.acceptedState.revision);
    assertSha256(report.execution.export.jsonSha256);
    assertSha256(report.execution.export.markdownSha256);
    expect(report.execution.export.reExport.stablePairSha256).toEqual({
      json: report.execution.export.jsonSha256,
      markdown: report.execution.export.markdownSha256,
    });
    return report;
  } finally {
    rmSync(reportDirectory, { recursive: true, force: true });
  }
}

function evidence(id: string, test: string, report: ScenarioEvidenceReport): EvidenceRecord {
  return Object.freeze({
    id,
    test,
    command: `${playwrightExecutable} ${scenarioCommand.join(' ')}`,
    packageArtifact: report.packageArtifact.path,
    executed: report.runId.length > 0
      && report.scenario.id === 'packaged-resume-after-relaunch'
      && report.execution.launchedGeneratedProcesses === report.execution.terminatedGeneratedProcesses,
  });
}

function assertUniqueExecutedCoverage(records: readonly EvidenceRecord[]): void {
  expect(records).toHaveLength(new Set(records.map((record) => record.id)).size);
  for (const record of records) {
    expect(record.executed).toBe(true);
    expect(record.command).toBe(`${playwrightExecutable} ${scenarioCommand.join(' ')}`);
    expect(record.packageArtifact).toBe('dist/bin/diff-review.mjs');
  }
}

describe('agent-ready generated-package acceptance evidence', () => {
  test.each([
    ['declared native target', 'darwin', 'arm64', true],
    ['other operating system', 'linux', 'arm64', false],
    ['other architecture', 'darwin', 'x64', false],
  ])('runs packed re-export as %s only for declared target', (_label, platform, arch, expected) => {
    expect(hasObservedNativeReExport(platform, arch)).toBe(expected);
  });

  test('runs the exact packaged Chromium suite and emits fresh, fingerprinted coverage evidence', { timeout: 120_000 }, () => {
    const report = runPackagedScenario();
    expect(existsSync(packagedCli)).toBe(true);
    expect(createHash('sha256').update(readFileSync(packagedCli)).digest('hex')).toBe(report.packageArtifact.sourceSha256);

    const suiteTest = '04-08-packaged-export Chromium suite';
    const result = Object.freeze({
      schemaVersion: 1,
      packageArtifact: report.packageArtifact.path,
      packageArtifactSha256: report.packageArtifact.sourceSha256,
      requirements: requirements.map((id) => evidence(id, suiteTest, report)),
      decisions: decisions.map((id) => evidence(id, suiteTest, report)),
      roadmap: [evidence('Phase-4-success-criterion-5', resumeTest, report)],
      uiStates: uiStates.map((id) => evidence(`UI-${id}`, suiteTest, report)),
      threats: threats.map((id) => evidence(id, suiteTest, report)),
      resume: report.execution,
    });

    assertUniqueExecutedCoverage(result.requirements);
    assertUniqueExecutedCoverage(result.decisions);
    assertUniqueExecutedCoverage(result.roadmap);
    assertUniqueExecutedCoverage(result.uiStates);
    assertUniqueExecutedCoverage(result.threats);
    expect(result.roadmap).toEqual([evidence('Phase-4-success-criterion-5', resumeTest, report)]);
    process.stdout.write(`${JSON.stringify({ kind: 'agent-ready-export-coverage', result })}\n`);
  });
});
