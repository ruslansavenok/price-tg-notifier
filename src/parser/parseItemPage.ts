import axios from 'axios';
import { Iconv } from 'iconv';
import cherio from 'cheerio';
import { DATASOURCE_HOSTNAME } from '../../config';

export interface IParseItemInfo {
  title: string;
}

function itemUrl(itemId: number) {
  return `http://${DATASOURCE_HOSTNAME}/?c=market&a=item&id=${itemId}`;
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

async function parseItemPage(itemId: number): Promise<IParseItemInfo> {
  const url = itemUrl(itemId);
  const urlHtml = await fetchPageHtml(url);
  const $page = cherio.load(urlHtml);

  if ($page('#items-search').is('form')) {
    throw new Error(`Invalid ID for ${url}`);
  }

  const title = $page('#content h1').text();
  const titleSup = $page('#content h1 sup').text();

  return {
    title: title.replace(titleSup, '').trim()
  };
}

export default parseItemPage;
