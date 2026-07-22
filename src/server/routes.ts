import type { FastifyInstance } from 'fastify';

import {
  DraftMutationRequestSchema,
  OpaqueFileIdSchema,
} from '../contracts/api.js';
import { DurableAnchorV1Schema } from '../contracts/draft.js';
import { buildDurableAnchor } from '../domain/anchor.js';
import type { CapabilityRegistry } from './capabilities.js';
import type { DraftStoreMutation } from './draft-store.js';
import { REQUEST_UNAVAILABLE_ERROR } from './security.js';

const EMPTY_QUERY_SCHEMA = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const;

const FILE_PARAMS_SCHEMA = {
  type: 'object',
  required: ['fileId'],
  properties: {
    fileId: { type: 'string' },
  },
  additionalProperties: false,
} as const;

function unavailable(reply: { code(statusCode: number): { send(payload: unknown): unknown } }, statusCode: number) {
  return reply.code(statusCode).send(REQUEST_UNAVAILABLE_ERROR);
}

export function registerSessionRoutes(app: FastifyInstance, capabilities: CapabilityRegistry): void {
  app.get(
    '/api/session',
    {
      schema: {
        querystring: EMPTY_QUERY_SCHEMA,
      },
    },
    async () => capabilities.session,
  );

  app.get<{ Params: { fileId: string } }>(
    '/api/files/:fileId',
    {
      schema: {
        params: FILE_PARAMS_SCHEMA,
        querystring: EMPTY_QUERY_SCHEMA,
      },
    },
    async (request, reply) => {
      const fileId = OpaqueFileIdSchema.safeParse(request.params.fileId);
      if (!fileId.success) {
        return unavailable(reply, 404);
      }

      const metadata = capabilities.lookup(fileId.data);
      if (metadata === undefined) {
        return unavailable(reply, 404);
      }

      return metadata;
    },
  );

  app.get<{
    Params: { fileId: string };
    Querystring: Record<string, never>;
  }>(
    '/api/files/:fileId/content',
    async (request, reply) => {
      if (Object.keys(request.query).length !== 0) {
        return unavailable(reply, 400);
      }
      const fileId = OpaqueFileIdSchema.safeParse(request.params.fileId);
      if (!fileId.success) {
        return unavailable(reply, 404);
      }
      const metadata = capabilities.lookup(fileId.data);
      if (metadata === undefined) {
        return unavailable(reply, 404);
      }
      if (metadata.availability.kind !== 'text') {
        return unavailable(reply, 409);
      }
      const content = await capabilities.readContent(fileId.data);
      if (content === undefined) {
        return unavailable(reply, 409);
      }
      return content;
    },
  );

  app.get<{ Querystring: Record<string, never> }>(
    '/api/draft',
    { schema: { querystring: EMPTY_QUERY_SCHEMA } },
    async (request, reply) => {
      if (Object.keys(request.query).length !== 0) {
        return unavailable(reply, 400);
      }
      try {
        const draft = await capabilities.draftStore.load();
        return {
          ...draft,
          comments: await Promise.all(
            draft.comments.map(async (comment) => ({
              ...comment,
              verification: await capabilities.verifyAnchor(comment.anchor),
            })),
          ),
        };
      } catch {
        return unavailable(reply, 500);
      }
    },
  );

  app.post<{ Querystring: Record<string, never>; Body: unknown }>(
    '/api/draft/mutations',
    { schema: { querystring: EMPTY_QUERY_SCHEMA } },
    async (request, reply) => {
      const requestMutation = DraftMutationRequestSchema.safeParse(request.body);
      if (!requestMutation.success) {
        return unavailable(reply, 400);
      }

      const { expectedRevision } = requestMutation.data;
      let mutation: DraftStoreMutation;
      if (requestMutation.data.type === 'addComment') {
        const content = await capabilities.readContent(requestMutation.data.fileId);
        if (content === undefined || content[requestMutation.data.side].exists === false) {
          return unavailable(reply, 409);
        }
        const selectedSide = content[requestMutation.data.side];
        if (
          /(?:\r\n|\n)$/u.test(selectedSide.text) &&
          requestMutation.data.line === selectedSide.text.split(/\r\n|\n/u).length
        ) {
          return unavailable(reply, 409);
        }
        try {
          mutation = {
            type: 'addComment',
            body: requestMutation.data.body,
            anchor: DurableAnchorV1Schema.parse(
              buildDurableAnchor({
                path: selectedSide.path,
                safeDisplayPath: selectedSide.path.display,
                side: requestMutation.data.side,
                blobOid: selectedSide.blobOid,
                line: requestMutation.data.line,
                text: selectedSide.text,
              }),
            ),
          };
        } catch {
          return unavailable(reply, 409);
        }
        if (capabilities.onAnchorAdd !== undefined) {
          try {
            await capabilities.onAnchorAdd({ body: requestMutation.data.body, anchor: mutation.anchor });
            return reply.code(201).send({ kind: 'accepted', draft: await capabilities.draftStore.load() });
          } catch {
            return unavailable(reply, 500);
          }
        }
      } else {
        const { expectedRevision: _expectedRevision, ...operation } = requestMutation.data;
        mutation = operation;
      }

      const result = await capabilities.draftStore.mutate({ expectedRevision, mutation });
      switch (result.kind) {
        case 'accepted':
          return reply.code(requestMutation.data.type === 'addComment' ? 201 : 200).send(result);
        case 'revisionConflict':
          return reply.code(409).send(result);
        case 'invalidTarget':
          return reply.code(404).send(result);
        case 'illegalTransition':
          return reply.code(409).send(result);
        case 'persistenceFailure':
          return reply.code(500).send(result);
      }
    },
  );
}
