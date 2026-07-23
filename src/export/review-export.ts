import { createHash } from 'node:crypto';

import {
  AnchorVerificationSchema,
  ReviewDraftV1Schema,
  ReviewExportV1Schema,
  compareReviewExportComments,
  compareUtf16CodeUnits,
  type AnchorVerificationDto,
  type ReviewDraftV1,
  type ReviewExportV1,
} from '../contracts/draft.js';
export type { ReviewExportV1 } from '../contracts/draft.js';
import { compareExactPaths } from '../domain/path-bytes.js';



export interface AcceptedReviewSnapshotV1 {
  readonly acceptedDraft: ReviewDraftV1;
  readonly commentVerification: Readonly<Record<string, AnchorVerificationDto>>;
  readonly comparison: {
    readonly selectedBase: { readonly label: string; readonly launchOid: string };
    readonly selectedHead: { readonly label: string; readonly launchOid: string };
    readonly mergeBaseOid: string;
    readonly comparisonKey: string;
  };
  readonly drift: {
    readonly observedAt: string;
    readonly acknowledged: boolean;
    readonly base: { readonly launchOid: string; readonly currentOid: string | null; readonly status: 'unchanged' | 'moved' | 'unavailable' };
    readonly head: { readonly launchOid: string; readonly currentOid: string | null; readonly status: 'unchanged' | 'moved' | 'unavailable' };
  };
}

export interface ExportHash {
  readonly algorithm: 'sha256';
  readonly sha256: string;
  readonly bytes: number;
}


function assertCanonicalString(value: string): void {
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
    throw new TypeError('Canonical JSON rejects strings with lone UTF-16 surrogate code units.');
  }
}

function serializeCanonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    assertCanonicalString(value);
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Canonical JSON rejects non-finite numbers.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(serializeCanonicalJson).join(',')}]`;
  if (typeof value !== 'object' || value === undefined) {
    throw new TypeError('Canonical JSON accepts only I-JSON primitives, arrays, and objects.');
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('Canonical JSON accepts only plain objects.');
  }
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort(compareUtf16CodeUnits)
    .map((key) => `${serializeCanonicalJson(key)}:${serializeCanonicalJson(object[key])}`)
    .join(',')}}`;
}

export function buildReviewExportV1(snapshot: AcceptedReviewSnapshotV1, exportedAt: string): ReviewExportV1 {
  const draft = ReviewDraftV1Schema.parse(snapshot.acceptedDraft);
  const comments = draft.comments.map((comment) => {
    const verification = snapshot.commentVerification[comment.id];
    if (verification === undefined) {
      throw new TypeError(`Missing anchor verification for accepted comment ${comment.id}.`);
    }
    const verified = AnchorVerificationSchema.parse(verification);
    return {
      id: comment.id,
      state: comment.state,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      resolvedAt: comment.state === 'resolved' ? comment.resolvedAt : null,
      verification: verified,
      anchor: comment.anchor,
    };
  });

  const groups = new Map<string, { path: (typeof comments)[number]['anchor']['path']; comments: typeof comments }>();
  for (const comment of comments) {
    const key = comment.anchor.path.bytesBase64url;
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, { path: comment.anchor.path, comments: [comment] });
    } else {
      group.comments.push(comment);
    }
  }

  const files = [...groups.values()]
    .sort((left, right) => compareExactPaths(left.path, right.path))
    .map((group) => ({ path: group.path, comments: group.comments.sort(compareReviewExportComments) }));
  const allComments = files.flatMap((file) => file.comments);
  const document = {
    schemaVersion: 1 as const,
    kind: 'diff-review/export' as const,
    exportedAt,
    acceptedDraftRevision: draft.revision,
    comparison: snapshot.comparison,
    drift: snapshot.drift,
    summary: { markdown: draft.summary === '' ? null : draft.summary },
    files,
    counts: {
      all: allComments.length,
      openActionable: allComments.filter((comment) => comment.state === 'open' && comment.verification.state === 'verified').length,
      openNeedsAttention: allComments.filter((comment) => comment.state === 'open' && comment.verification.state !== 'verified').length,
      resolved: allComments.filter((comment) => comment.state === 'resolved').length,
    },
  };

  return ReviewExportV1Schema.parse(document);
}

export function canonicalizeReviewExport(document: unknown): Uint8Array {
  return new TextEncoder().encode(serializeCanonicalJson(document));
}

export function parseCanonicalReviewExport(bytes: Uint8Array): ReviewExportV1 {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const parsed: unknown = JSON.parse(text);
  const document = ReviewExportV1Schema.parse(parsed);
  const canonicalBytes = canonicalizeReviewExport(document);
  if (bytes.byteLength !== canonicalBytes.byteLength || bytes.some((byte, index) => byte !== canonicalBytes[index])) {
    throw new TypeError('Export bytes are not the canonical representation of the validated document.');
  }
  return document;
}

export function hashExportBytes(bytes: Uint8Array): ExportHash {
  return Object.freeze({
    algorithm: 'sha256' as const,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.byteLength,
  });
}
