import type { FastifyInstance } from 'fastify';

import {
  AddCommentRequestSchema,
  OpaqueFileIdSchema,
} from '../contracts/api.js';
import { DurableAnchorV1Schema } from '../contracts/draft.js';
import { buildDurableAnchor } from '../domain/anchor.js';
import type { CapabilityRegistry } from './capabilities.js';
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

  app.get<{ Params: { fileId: string } }>(
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

  app.post(
    '/api/draft/comments',
    async (request, reply) => {
      if (Object.keys(request.query).length !== 0) {
        return unavailable(reply, 400);
      }
      const addRequest = AddCommentRequestSchema.safeParse(request.body);
      if (!addRequest.success) {
        return unavailable(reply, 400);
      }
      const metadata = capabilities.lookup(addRequest.data.fileId);
      if (metadata === undefined) {
        return unavailable(reply, 404);
      }
      if (metadata.availability.kind !== 'text') {
        return unavailable(reply, 409);
      }
      const content = await capabilities.readContent(addRequest.data.fileId);
      if (content === undefined) {
        return unavailable(reply, 409);
      }
      const selectedSide = content[addRequest.data.side];
      if (!selectedSide.exists) {
        return unavailable(reply, 409);
      }
      let anchor;
      try {
        anchor = DurableAnchorV1Schema.parse(
          buildDurableAnchor({
            path: selectedSide.path,
            safeDisplayPath: selectedSide.path.display,
            side: addRequest.data.side,
            blobOid: selectedSide.blobOid,
            line: addRequest.data.line,
            text: selectedSide.text,
          }),
        );
      } catch {
        return unavailable(reply, 409);
      }
      if (capabilities.onAnchorAdd === undefined) {
        return unavailable(reply, 409);
      }
      try {
        await capabilities.onAnchorAdd({ body: addRequest.data.body, anchor });
      } catch {
        return unavailable(reply, 500);
      }
      return reply.code(201).send({ anchor });
    },
  );
}
