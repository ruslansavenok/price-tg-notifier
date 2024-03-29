import axios from 'axios';
import { Iconv } from 'iconv';
import cookie from 'cookie';
import cherio, { Cheerio, Element } from 'cheerio';
import { DATASOURCE_FETCH_TIMEOUT } from '../../config';
import { parseItemUrl } from '../format';
import { getSessionCookie, setSessionCookie } from '../db/datasourceConfig';

export interface IItemListing {
  id: string;
  playerName: string;
  playerLocation: string;
  price: number;
  registeredAt: Date;
  amount?: number;
  enchantmentLvl?: number;
}

export interface IParseItemInfo {
  title: string;
  imagePath: string;
  sellListings: IItemListing[];
  buyListings: IItemListing[];
}

const iconv = new Iconv('windows-1251', 'utf-8');

async function fetchPageHtml(
  url: string,
  cookieWorld: number
): Promise<string> {
  const cookies = [`world=${cookieWorld};`];
  const sessionCookie = await getSessionCookie();
  if (sessionCookie) {
    cookies.push(`PHPSESSID=${sessionCookie};`);
  }

  const page = await axios(url, {
    method: 'GET',
    timeout: DATASOURCE_FETCH_TIMEOUT,
    responseType: 'arraybuffer',
    headers: {
      Cookie: cookies.join(' ')
    },
    transformResponse: function (data: Buffer) {
      return iconv.convert(data).toString();
    }
  });

  // TODO:
  // This method is unreliable, we need to have a separate process performing
  // login with real credentials every N hours to get a cookie
  (page.headers['set-cookie'] || []).forEach(str => {
    const { PHPSESSID } = cookie.parse(str);
    if (PHPSESSID) {
      setSessionCookie(PHPSESSID);
    }
  });

  return page.data;
}

function parseOrderValue($el: Cheerio<Element>): string {
  const val = $el.attr('order');
  if (!val) {
    throw new Error('Invalid column data');
  } else {
    return val;
  }
}

async function parseItemPage(
  itemId: number,
  serverId: number
): Promise<IParseItemInfo> {
  const url = parseItemUrl({ itemId, serverId });
  const urlHtml = await fetchPageHtml(url, serverId);
  const $ = cherio.load(urlHtml);

  if ($('#items-search').is('form')) {
    throw new Error(`Invalid ID for ${url}`);
  }

  const htmlServerId = $('#setworld-field option[selected]').attr('value');
  if (htmlServerId && parseInt(htmlServerId, 10) !== serverId) {
    throw new Error(
      `Tryin to request server=${serverId} but got ${htmlServerId} url=${url}`
    );
  }

  const title = $('#content h1').text();
  const titleSup = $('#content h1 sup').text();
  const imagePath = (
    $(`[iteminfo="${itemId}"]`).css('background') || ''
  ).replace(/url\(\'(.*)?\'\).*/gi, '$1');

  function getDataFromTable(selector: string) {
    const columnNames = $(`${selector} thead tr th`)
      .toArray()
      .map(e => $(e).text().toLowerCase());

    const findIndexByHeaderName = (name: string): number =>
      columnNames.findIndex(val => val === name);

    const colIndex = {
      playerName: findIndexByHeaderName('персонаж'),
      playerLocation: findIndexByHeaderName('город'),
      price: findIndexByHeaderName('цена'),
      amount: findIndexByHeaderName('кол-во'),
      registeredAt: findIndexByHeaderName('замечен'),
      enchantmentLvl: findIndexByHeaderName('мод.')
    };

    return $(`${selector} tbody tr`)
      .toArray()
      .map(rowEl => {
        const $rowEl = $(rowEl);
        const rowClasses = $rowEl.attr('class');
        if (!rowClasses) throw new Error('Invalid page!');

        const id = rowClasses.split(' ')[0].replace('shop-', '');
        const $cols = $(rowEl)
          .find('td')
          .toArray()
          .map(el => $(el));

        return {
          id,
          playerName: $cols[colIndex.playerName].text(),
          playerLocation: $cols[colIndex.playerLocation].text(),
          price: parseInt(parseOrderValue($cols[colIndex.price]), 10),
          amount:
            colIndex.amount >= 0
              ? parseInt(parseOrderValue($cols[colIndex.amount]), 10)
              : undefined,
          registeredAt: new Date(
            parseInt(parseOrderValue($cols[colIndex.registeredAt]), 10) * 1000
          ),
          enchantmentLvl:
            colIndex.enchantmentLvl >= 0
              ? parseInt(parseOrderValue($cols[colIndex.enchantmentLvl]), 10)
              : undefined
        };
      });
  }

  const sellListings = getDataFromTable('#group_sell');
  const buyListings = getDataFromTable('#group_buy');

  return {
    title: title.replace(titleSup, '').trim(),
    imagePath,
    sellListings,
    buyListings
  };
}
export default parseItemPage;
