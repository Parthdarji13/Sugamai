import https from 'https';

function fetchFollow(url: string, redirects = 3): Promise<{ url: string; status: number; text: string }> {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0' } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirects > 0) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) nextUrl = `https://www.pib.gov.in${nextUrl}`;
        resolve(fetchFollow(nextUrl, redirects - 1));
        return;
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ url, status: res.statusCode || 0, text: data }));
    }).on('error', e => resolve({ url, status: 500, text: `Error: ${e.message}` }));
  });
}

async function run() {
  const urls = [
    'https://www.pib.gov.in/rss.aspx',
    'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=1',
    'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=2',
    'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=3&lang=1',
    'https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2060000',
    'https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2053912'
  ];

  for (const u of urls) {
    const res = await fetchFollow(u);
    console.log(`URL: ${u} -> Final: ${res.url} | Status: ${res.status} | Length: ${res.text.length}`);
    const hasAyushman = res.text.toLowerCase().includes('ayushman') || res.text.toLowerCase().includes('pmjay') || res.text.toLowerCase().includes('health');
    console.log(` - Contains health/ayushman keywords: ${hasAyushman}`);
  }
}

run().catch(console.error);
