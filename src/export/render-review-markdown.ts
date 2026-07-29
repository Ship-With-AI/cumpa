import { parseCanonicalReviewExport, type ReviewExportV1 } from './review-export.js';

function fenceFor(value: string): string {
  const runs = value.match(/`+/gu) ?? [];
  const longest = runs.reduce((length, run) => Math.max(length, run.length), 2);
  return '`'.repeat(longest + 1);
}

function appendFencedData(lines: string[], label: string, value: string): void {
  const fence = fenceFor(value);
  lines.push(label, `${fence}text`, value, fence);
}

function appendAnchor(lines: string[], comment: ReviewExportV1['files'][number]['comments'][number]): void {
  const { anchor } = comment;
  lines.push(`Side: \`${anchor.side}\``, `Recorded line: ${anchor.line} (hint only)`, `Blob: \`${anchor.blobOid}\``, `Context hash: \`${anchor.contextHash.algorithm}:${anchor.contextHash.value}\``);
  appendFencedData(lines, 'Repository-relative path:', anchor.path.utf8 ?? anchor.path.bytesBase64url);
  appendFencedData(lines, 'Selected text:', anchor.selectedText);
  appendFencedData(
    lines,
    'Nearby context:',
    [...anchor.context.before, anchor.context.target, ...anchor.context.after]
      .map((line) => `${line.line}: ${line.text}`)
      .join('\n'),
  );
}

function appendComment(lines: string[], comment: ReviewExportV1['files'][number]['comments'][number]): void {
  lines.push(`### ${comment.id}`);
  appendAnchor(lines, comment);
  appendFencedData(lines, 'Review feedback:', comment.body);
}

export function renderReviewMarkdown(canonicalBytes: Uint8Array): string {
  const document = parseCanonicalReviewExport(canonicalBytes);
  const lines: string[] = [
    '# Compare Export',
    '',
    '## Pinned comparison',
    `Accepted draft revision: ${document.acceptedDraftRevision}`,
    `Exported at: ${document.exportedAt}`,
    `Base commit: \`${document.comparison.selectedBase.launchOid}\``,
    `Head commit: \`${document.comparison.selectedHead.launchOid}\``,
    `Merge base: \`${document.comparison.mergeBaseOid}\``,
    `Comparison key: \`${document.comparison.comparisonKey}\``,
  ];
  appendFencedData(lines, 'Base label:', document.comparison.selectedBase.label);
  appendFencedData(lines, 'Head label:', document.comparison.selectedHead.label);
  lines.push(
    '',
    '## Drift observation',
    `Observed at: ${document.drift.observedAt}`,
    `Acknowledged: ${document.drift.acknowledged ? 'yes' : 'no'}`,
    `Base selector: ${document.drift.base.status}; launch \`${document.drift.base.launchOid}\`; current \`${document.drift.base.currentOid ?? 'unavailable'}\``,
    `Head selector: ${document.drift.head.status}; launch \`${document.drift.head.launchOid}\`; current \`${document.drift.head.currentOid ?? 'unavailable'}\``,
    '',
    '## Summary',
  );

  if (document.summary.markdown === null) {
    lines.push('No summary provided');
  } else {
    appendFencedData(lines, 'Review summary:', document.summary.markdown);
  }

  lines.push('', '## Open actionable requests');
  let actionable = 0;
  for (const file of document.files) {
    const verified = file.comments.filter((comment) => comment.state === 'open' && comment.verification.state === 'verified');
    if (verified.length === 0) continue;
    actionable += verified.length;
    lines.push('', '### Path');
    appendFencedData(lines, 'Repository-relative path:', file.path.utf8 ?? file.path.bytesBase64url);
    for (const comment of verified) {
      lines.push('');
      appendComment(lines, comment);
    }
  }
  if (actionable === 0) lines.push('No open actionable requests.');

  lines.push('', '## Needs reviewer attention');
  const attention = document.files.flatMap((file) => file.comments).filter((comment) => comment.state === 'open' && comment.verification.state !== 'verified');
  if (attention.length === 0) {
    lines.push('No open comments need reviewer attention.');
  } else {
    for (const comment of attention) {
      lines.push('', `### ${comment.id}`, `Anchor state: \`${comment.verification.state}\` (${comment.verification.reason})`);
      appendAnchor(lines, comment);
      appendFencedData(lines, 'Review feedback:', comment.body);
    }
  }

  lines.push(
    '',
    `Resolved comments: ${document.counts.resolved}. Full history remains in canonical JSON.`,
    '',
    '## Applying-agent instructions',
    'Before editing, verify the pinned comparison commit, relevant blob, repository-relative path, base/head side, exact selected text, and context hash.',
    'Line number is a navigation hint, never editing authority.',
    'Do not guess, fuzzy-match, silently relocate, or apply resolved feedback.',
    'Do not apply stale, orphaned, missing, or ambiguous anchors.',
    'Report ambiguous, missing, stale, orphaned, blob, path, side, selected-text, and context-hash mismatches.',
    'Include the recorded comment ID and identity in every mismatch report.',
  );
  return `${lines.join('\n')}\n`;
}
