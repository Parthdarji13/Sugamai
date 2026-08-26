import https from 'https';

function fetchPibRss(lang: number, modId = 6): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://www.pib.gov.in/RssMain.aspx?ModId=${modId}&reg=48&lang=${lang}`;
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
  const items: Array<{ title: string; link: string; description?: string; pubDate?: string }> = [];
  const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, ''),
        link: linkMatch[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1'),
        description: descMatch ? descMatch[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '') : undefined,
        pubDate: dateMatch ? dateMatch[1].trim() : undefined
      });
    }
  }
  return items;
}

async function run() {
  console.log('--- Checking PIB RSS feeds ---');
  const keywords = ['ayushman', 'pmjay', 'pm-jay', 'health', 'nha', 'national health authority', 'card', 'आयुष्मान', 'स्वास्थ्य'];
  
  for (const lang of [1, 2]) {
    const xml = await fetchPibRss(lang);
    const items = parseRssItems(xml);
    console.log(`\nLang=${lang} total items: ${items.length}`);
    const matches = items.filter(item => {
      const text = `${item.title} ${item.description || ''}`.toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    });
    console.log(`Lang=${lang} matching items for health/ayushman keywords: ${matches.length}`);
    matches.forEach(m => {
      console.log(`- Title: ${m.title}`);
      console.log(`  Link: ${m.link}`);
      console.log(`  Date: ${m.pubDate}`);
    });
  }

  // Also print all English titles so we see what's in the RSS feed right now
  console.log('\n--- All English RSS Titles ---');
  const enXml = await fetchPibRss(1);
  const enItems = parseRssItems(enXml);
  enItems.forEach((item, i) => console.log(`${i+1}. ${item.title}`));
}

run().catch(console.error);
