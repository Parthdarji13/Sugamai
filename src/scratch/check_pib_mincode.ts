import https from 'https';

function fetchPib(minCode: number): Promise<{ minCode: number; count: number; titles: string[] }> {
  return new Promise((resolve) => {
    const url = `https://www.pib.gov.in/RssMain.aspx?ModId=6&mincode=${minCode}&lang=1`;
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
        res.on('end', () => {
          const itemMatches = data.match(/<item>[\s\S]*?<\/item>/gi) || [];
          const titles = itemMatches.map(item => {
            const m = item.match(/<title>([\s\S]*?)<\/title>/i);
            return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() : '';
          });
          resolve({ minCode, count: itemMatches.length, titles });
        });
      }
    ).on('error', () => resolve({ minCode, count: 0, titles: [] }));
  });
}

async function run() {
  console.log('Testing mincode 1..50 on PIB RSS...');
  for (let m = 1; m <= 50; m++) {
    const res = await fetchPib(m);
    if (res.count > 0) {
      console.log(`mincode=${m}: ${res.count} items. Sample title: "${res.titles[0]}"`);
    }
  }
}

run().catch(console.error);
