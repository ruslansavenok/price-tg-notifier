import Fastify from 'fastify';
import cors from '@fastify/cors';
import { UI_API_PORT } from '../config';

const fastify = Fastify({
  logger: true
});
fastify.register(cors, {
  origin: true
});

fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

fastify.listen({ port: UI_API_PORT }, function (err) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
