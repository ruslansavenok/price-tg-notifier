import Fastify, { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { UI_API_PORT, MONGO_DB_URL, SERVERS } from '../config';
import { setupConnection } from './db/connection';
import logger from './logger';

const fastify = Fastify({
  logger: true
});
fastify.register(cors, {
  origin: true
});

const CHAR_REGEX_PATTERN = `^[^:]*\:(${Object.values(SERVERS).join('|')})$`;

fastify.get(
  '/',
  {
    schema: {
      querystring: {
        type: 'object',
        required: ['chars', 'accessKey'],
        properties: {
          accessKey: { type: 'string' },
          chars: {
            type: 'array',
            items: {
              type: 'string',
              pattern: CHAR_REGEX_PATTERN
            }
          }
        }
      }
    }
  },
  async function (
    request: FastifyRequest<{
      Querystring: { chars: string[]; accessKey: string };
    }>,
    reply
  ) {
    const characters = request.query.chars.map(val => val.split(':'));
    reply.send(characters);
  }
);

(async function () {
  await setupConnection(MONGO_DB_URL);
  logger.info('Mongo connected..');

  try {
    await fastify.listen({ port: UI_API_PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
