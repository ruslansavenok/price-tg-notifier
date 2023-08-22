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

// onst myChars = {
//   [SERVERS.AIRIN]: ['ZombieTrader6'],
//   [SERVERS.ELCARDIA]: ['ПупокКемба']
// };

// (async function () {
//   await setupConnection(MONGO_DB_URL);
//   logger.info('Mongo connected..');

//   const user = await TgBotUser.findOne({ tgUserId: '362410037' });
//   if (user) {
//     const subscriptions = await ParseItemSubscription.find({ tgUser: user });

//     const listings = await ParseItemListing.find({
//       type: LISTING_TYPE.SELL,
//       parseItem: { $in: uniq(subscriptions.map(s => s.parseItem._id)) },
//       serverId: { $in: Object.keys(myChars).map(s => parseInt(s, 10)) },
//       registeredAt: { $gte: new Date(Date.now() - 30 * 60 * 60 * 1000) }
//     }).sort({ registeredAt: -1, price: -1 });

//     const listingsIndex: { [key: string]: boolean } = {};
//     const myListings = listings
//       .filter(listing => {
//         if (
//           listing.serverId === SERVERS.AIRIN &&
//           myChars[SERVERS.AIRIN].includes(listing.playerName)
//         )
//           return true;
//         if (
//           listing.serverId === SERVERS.ELCARDIA &&
//           myChars[SERVERS.ELCARDIA].includes(listing.playerName)
//         )
//           return true;
//         return false;
//       })
//       .filter(listing => {
//         const indexKey = `${listing.parseItem}-${listing.serverId}`;
//         if (!listingsIndex[indexKey]) {
//           listingsIndex[indexKey] = true;
//           return true;
//         } else {
//           return false;
//         }
//       });

//     const result: {
//       [key: string]: {
//         [key: string]: {
//           item: any;
//           my: any;
//           competitor: any;
//         };
//       };
//     } = {};

//     for (const listing of myListings) {
//       const item = await ParseItem.findOne({ _id: listing.parseItem });
//       result[listing.serverId] = result[listing.serverId] || {};

//       const otherListings = listings.filter(otherListing => {
//         return (
//           otherListing.parseItem.toString() === listing.parseItem.toString() &&
//           otherListing.serverId === listing.serverId &&
//           otherListing.registeredAt >= listing.registeredAt &&
//           otherListing._id !== listing._id
//         );
//       });

//       const itemId = listing.parseItem.toString();
//       const competitor = minBy(otherListings, l => l.price);

//       result[listing.serverId][itemId] = {
//         item: {
//           name: item?.title as string,
//           id: item?.parseId as number
//         },
//         my: {
//           price: listing.price,
//           registeredAt: listing.registeredAt,
//           amount: listing.amount,
//           enchantmentLvl: listing.enchantmentLvl
//         },
//         competitor: {
//           name: competitor?.playerName as string,
//           registeredAt: competitor?.registeredAt as Date,
//           price: competitor?.price,
//           amount: competitor?.amount,
//           enchantmentLvl: competitor?.enchantmentLvl
//         }
//       };
//     }

//     console.log(JSON.stringify(result, null, 2));
//   }
// })();
