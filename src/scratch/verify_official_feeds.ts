import http from 'http';
import https from 'https';

interface FeedCheckResult {
  url: string;
  name: string;
  status: number | string;
  contentType: string;
  ok: boolean;
  length: number;
  snippet: string;
  redirectUrl?: string;
}

function testFetchUrlFollowRedirects(url: string, name: string, maxRedirects = 3, timeoutMs = 6000): Promise<FeedCheckResult> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const req = protocol.get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          timeout: timeoutMs
        },
        async (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location && maxRedirects > 0) {
            let redirectTarget = res.headers.location;
            if (redirectTarget.startsWith('/')) {
              redirectTarget = `${parsedUrl.protocol}//${parsedUrl.host}${redirectTarget}`;
            }
            console.log(`  [REDIRECT ${res.statusCode}] ${url} -> ${redirectTarget}`);
            const result = await testFetchUrlFollowRedirects(redirectTarget, name, maxRedirects - 1, timeoutMs);
            resolve(result);
            return;
          }

          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
            if (data.length > 60000) {
              req.destroy();
            }
          });
          res.on('end', () => {
            resolve({
              url,
              name,
              status: res.statusCode || 'UNKNOWN',
              contentType: res.headers['content-type'] || 'unknown',
              ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
              length: data.length,
              snippet: data.slice(0, 800).replace(/\s+/g, ' ')
            });
          });
        }
      );

      req.on('error', (err) => {
        resolve({
          url,
          name,
          status: `ERROR: ${err.message}`,
          contentType: 'none',
          ok: false,
          length: 0,
          snippet: ''
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          name,
          status: 'TIMEOUT (6000ms)',
          contentType: 'none',
          ok: false,
          length: 0,
          snippet: ''
        });
      });
    } catch (e) {
      resolve({
        url,
        name,
        status: `EXCEPTION: ${(e as Error).message}`,
        contentType: 'none',
        ok: false,
        length: 0,
        snippet: ''
      });
    }
  });
}

async function verifyFeeds() {
  console.log('====================================================');
  console.log(' VERIFYING OFFICIAL GOVERNMENT FEEDS (WITH REDIRECTS)');
  console.log('====================================================\n');

  const candidateEndpoints = [
    { name: 'PIB Main Index', url: 'https://pib.gov.in/index.aspx' },
    { name: 'PIB RSS Feed (ModId=6)', url: 'https://pib.gov.in/RssMain.aspx?ModId=6' },
    { name: 'PIB Press Release List', url: 'https://pib.gov.in/allRel.aspx' },
    { name: 'India.gov.in Main Portal', url: 'https://www.india.gov.in/' },
    { name: 'PM Kisan Official Portal', url: 'https://pmkisan.gov.in/' },
    { name: 'Ayushman Bharat Portal', url: 'https://pmjay.gov.in/' }
  ];

  for (const endpoint of candidateEndpoints) {
    console.log(`Checking: ${endpoint.name} (${endpoint.url})...`);
    const result = await testFetchUrlFollowRedirects(endpoint.url, endpoint.name);
    console.log(`- Final URL: ${result.url}`);
    console.log(`- Status: ${result.status}`);
    console.log(`- Content-Type: ${result.contentType}`);
    console.log(`- OK: ${result.ok}`);
    console.log(`- Response Length: ${result.length} bytes`);
    if (result.snippet) {
      console.log(`- Sample Content:\n  "${result.snippet}"`);
    }
    console.log('----------------------------------------------------\n');
  }
}

verifyFeeds();
