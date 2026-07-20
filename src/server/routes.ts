import type { FastifyInstance } from 'fastify';

import { OpaqueFileIdSchema } from '../contracts/api.js';
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
        return reply.code(404).send(REQUEST_UNAVAILABLE_ERROR);
      }

      const metadata = capabilities.lookup(fileId.data);
      if (metadata === undefined) {
        return reply.code(404).send(REQUEST_UNAVAILABLE_ERROR);
      }

      return metadata;
    },
  );
}
