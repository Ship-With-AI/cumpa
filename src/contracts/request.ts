import { Buffer } from 'node:buffer';

import { z } from 'zod';

export const MAX_AGENT_REQUEST_BYTES = 1_048_576;
export const MAX_GIT_ARGUMENT_BYTES = 4_096;
export const MAX_PATHSPEC_COUNT = 256;

const emptyPathspecs: string[] = [];

function isBoundedGitArgument(value: string): boolean {
  if (value.length === 0 || value.includes('\0') || Buffer.byteLength(value, 'utf8') > MAX_GIT_ARGUMENT_BYTES) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return false;
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }

  return true;
}

const GitArgumentSchema = z.string().refine(isBoundedGitArgument, {
  message: 'Git arguments must be non-empty, valid Unicode without NUL, and at most 4096 UTF-8 bytes.',
});

const RevisionRangeSchema = z
  .strictObject({
    base: GitArgumentSchema,
    head: GitArgumentSchema,
    pathspecs: z
      .array(GitArgumentSchema)
      .max(MAX_PATHSPEC_COUNT)
      .default(emptyPathspecs)
      .transform((pathspecs) => Object.freeze(pathspecs)),
  })
  .readonly();

export const AgentReviewRequestSchema = z
  .strictObject({
    kind: z.literal('compare.review-request'),
    schemaVersion: z.literal(1),
    mode: z.literal('revisions'),
    revisions: RevisionRangeSchema,
  })
  .readonly();

export type AgentReviewRequest = z.infer<typeof AgentReviewRequestSchema>;
