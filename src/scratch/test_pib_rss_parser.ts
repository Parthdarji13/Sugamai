import https from 'https';

function fetchPibRss(lang: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=${lang}`;
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0',
          'Accept': 'application/xml,text/xml,*/*'
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }
    ).on('error', reject);
  });
}

function parseRssItems(xmlText: string) {
  const items: Array<{ title: string; link: string }> = [];
  const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1'),
        link: linkMatch[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
      });
    }
  }
  return items;
}

async function testPibParsing() {
  console.log('=== TESTING OFFICIAL PIB RSS PARSER ===\n');

  console.log('Fetching English RSS (lang=1)...');
  const enXml = await fetchPibRss(1);
  const enItems = parseRssItems(enXml);
  console.log(`Found ${enItems.length} English items:`);
  enItems.slice(0, 3).forEach((item, idx) => {
    console.log(`[${idx + 1}] Title: ${item.title}`);
    console.log(`    Link: ${item.link}`);
  });

  console.log('\nFetching Hindi RSS (lang=2)...');
  const hiXml = await fetchPibRss(2);
  const hiItems = parseRssItems(hiXml);
  console.log(`Found ${hiItems.length} Hindi items:`);
  hiItems.slice(0, 3).forEach((item, idx) => {
    console.log(`[${idx + 1}] Title: ${item.title}`);
    console.log(`    Link: ${item.link}`);
  });
}

testPibParsing().catch(console.error);
