import https from 'https';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*'
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

async function run() {
  console.log('Testing PIB RSS/Endpoints...');
  const urls = [
    'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=3&lang=1',
    'https://www.pib.gov.in/RssMain.aspx?ModId=1&reg=48&lang=1',
    'https://www.pib.gov.in/RssMain.aspx?ModId=2&reg=48&lang=1',
  ];

  for (const url of urls) {
    try {
      const html = await fetchUrl(url);
      const items = (html.match(/<item>[\s\S]*?<\/item>/gi) || []);
      console.log(`URL: ${url} -> ${items.length} items`);
      if (items.length > 0 && items[0]) {
        const titleMatch = items[0].match(/<title>([\s\S]*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) console.log(`   Sample: ${titleMatch[1].substring(0, 80)}`);
      }
    } catch (err) {
      console.log(`URL: ${url} -> Error: ${(err as Error).message}`);
    }
  }
}

run().catch(console.error);
