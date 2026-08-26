import https from 'https';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*'
        },
        timeout: 6000
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }
    ).on('error', (e) => resolve(`Error: ${e.message}`));
  });
}

async function inspectPibRssPage() {
  console.log('Inspecting PIB RSS Directory...');
  const page = await fetchUrl('https://www.pib.gov.in/rss.aspx');
  console.log(`Page length: ${page.length}`);
  
  // Find all links to RssMain.aspx
  const links = page.match(/href="[^"]*RssMain\.aspx[^"]*"/gi) || [];
  console.log(`Found ${links.length} RSS links on pib.gov.in/rss.aspx:`);
  links.slice(0, 20).forEach(l => console.log(` - ${l}`));

  // Also check if there are links containing "health" or "swasthya" or "ayushman"
  const healthLinks = links.filter(l => l.toLowerCase().includes('health') || l.toLowerCase().includes('min'));
  console.log(`\nHealth-related links: ${healthLinks.length}`);
  healthLinks.forEach(l => console.log(` - ${l}`));
}

inspectPibRssPage().catch(console.error);
