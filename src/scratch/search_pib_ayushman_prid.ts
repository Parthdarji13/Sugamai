import https from 'https';

function checkPrid(prid: number): Promise<{ prid: number; ok: boolean; title?: string }> {
  return new Promise((resolve) => {
    const url = `https://pib.gov.in/PressReleaseIframePage.aspx?PRID=${prid}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 SugamGovAI/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const lower = data.toLowerCase();
        if (lower.includes('ayushman') || lower.includes('pmjay') || lower.includes('health authority')) {
          const m = data.match(/<title>([\s\S]*?)<\/title>/i) || data.match(/h2[\s\S]*?>([\s\S]*?)<\/h2>/i);
          resolve({ prid, ok: true, title: m ? m[1].replace(/<[^>]+>/g, '').trim() : 'Found Ayushman PRID' });
        } else {
          resolve({ prid, ok: false });
        }
      });
    }).on('error', () => resolve({ prid, ok: false }));
  });
}

async function searchPrids() {
  console.log('Searching for official PIB Ayushman PRIDs...');
  // Check range around 2050000 - 2070000 or recent PRIDs
  for (let prid = 2050000; prid <= 2050200; prid += 5) {
    const res = await checkPrid(prid);
    if (res.ok) {
      console.log(`FOUND AYUSHMAN PRID: ${res.prid} -> "${res.title}"`);
    }
  }
}

searchPrids().catch(console.error);
