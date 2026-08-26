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
  console.log('Testing pib.gov.in/allRel.aspx and search...');
  try {
    const html = await fetchUrl('https://pib.gov.in/allRel.aspx');
    console.log(`allRel.aspx length: ${html.length}`);
    const ayushmanIndex = html.toLowerCase().indexOf('ayushman');
    console.log(`Ayushman in allRel.aspx: ${ayushmanIndex !== -1 ? 'FOUND at ' + ayushmanIndex : 'NOT FOUND'}`);
  } catch (err) {
    console.log('Error fetching allRel.aspx:', err);
  }
}

run().catch(console.error);
