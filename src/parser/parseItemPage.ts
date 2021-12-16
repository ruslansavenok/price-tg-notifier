import axios from 'axios';
import { Iconv } from 'iconv';
import cherio, { Cheerio, Element } from 'cheerio';
import { DATASOURCE_HOSTNAME } from '../../config';

export interface IItemListing {
  id: number;
  sellerName: string;
  sellerLocation: string;
  price: number;
  addedAt: number;
  amount?: number;
  enchantmentLvl?: number;
}

export interface IParseItemInfo {
  title: string;
  listings: IItemListing[];
}

async function fetchPageHtml(url: string): Promise<string> {
  const page = await axios(url, {
    method: 'GET',
    timeout: 3000,
    responseType: 'arraybuffer',
    transformResponse: function (data: Buffer) {
      const iconv = new Iconv('windows-1251', 'utf-8');
      data = iconv.convert(data);
      return data.toString();
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
  const url = `http://${DATASOURCE_HOSTNAME}/?c=market&a=item&id=${itemId}&setworld=${serverId}`;
  const urlHtml = await fetchPageHtml(url);
  const $ = cherio.load(urlHtml);

  if ($('#items-search').is('form')) {
    throw new Error(`Invalid ID for ${url}`);
  }

  const title = $('#content h1').text();
  const titleSup = $('#content h1 sup').text();

  const columnNames = $('#group_sell thead tr th')
    .toArray()
    .map(e => $(e).text().toLowerCase());
  const findIndexByHeaderName = (name: string): number =>
    columnNames.findIndex(val => val === name);
  const colIndex = {
    sellerName: findIndexByHeaderName('персонаж'),
    sellerLocation: findIndexByHeaderName('город'),
    price: findIndexByHeaderName('цена'),
    amount: findIndexByHeaderName('кол-во'),
    addedAt: findIndexByHeaderName('замечен'),
    enchantmentLvl: findIndexByHeaderName('мод.')
  };

  const listings = $('#group_sell tbody tr')
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
        id: parseInt(id, 10),
        sellerName: $cols[colIndex.sellerName].text(),
        sellerLocation: $cols[colIndex.sellerLocation].text(),
        price: parseInt(parseOrderValue($cols[colIndex.price]), 10),
        amount:
          colIndex.amount >= 0
            ? parseInt(parseOrderValue($cols[colIndex.amount]), 10)
            : undefined,
        addedAt: parseInt(parseOrderValue($cols[colIndex.addedAt]), 10) * 1000,
        enchantmentLvl:
          colIndex.enchantmentLvl >= 0
            ? parseInt(parseOrderValue($cols[colIndex.enchantmentLvl]), 10)
            : undefined
      };
    });

  return {
    title: title.replace(titleSup, '').trim(),
    listings
  };
}
export default parseItemPage;
