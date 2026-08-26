import https from 'https';

function fetchPibRss(params: string): Promise<{ ok: boolean; count: number; titles: string[]; xml: string }> {
  return new Promise((resolve) => {
    const url = `https://www.pib.gov.in/RssMain.aspx?${params}`;
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0',
          'Accept': 'application/xml,text/xml,*/*'
        },
        timeout: 5000
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
          resolve({ ok: res.statusCode === 200, count: itemMatches.length, titles, xml: data });
        });
      }
    ).on('error', () => resolve({ ok: false, count: 0, titles: [], xml: '' }));
  });
}

async function findHealthMinistryMinCode() {
  console.log('Searching PIB Ministry Codes for Health / Family Welfare / Ayushman...');
  
  // Let's test mincodes from 1 to 70 in parallel batches of 10
  for (let batch = 0; batch < 7; batch++) {
    const promises = [];
    for (let i = 1; i <= 10; i++) {
      const minCode = batch * 10 + i;
      promises.push(
        fetchPibRss(`ModId=6&mincode=${minCode}&lang=1`).then(res => ({ minCode, ...res }))
      );
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r.count > 0) {
        console.log(`MinCode ${r.minCode}: ${r.count} items. Sample title: "${r.titles[0]?.substring(0, 80)}"`);
        const lowerTitles = r.titles.join(' ').toLowerCase();
        if (lowerTitles.includes('health') || lowerTitles.includes('ayushman') || lowerTitles.includes('pmjay') || lowerTitles.includes('medical') || lowerTitles.includes('hospital')) {
          console.log(`>>> MATCH FOUND FOR HEALTH / AYUSHMAN: MinCode ${r.minCode} <<<`);
          r.titles.slice(0, 5).forEach((t, idx) => console.log(`   [${idx + 1}] ${t}`));
        }
      }
    }
  }
}

findHealthMinistryMinCode().catch(console.error);
