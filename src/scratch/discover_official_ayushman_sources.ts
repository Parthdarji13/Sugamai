import https from 'https';
import http from 'http';

interface DiscoveryResult {
  category: string;
  name: string;
  url: string;
  status: number | string;
  responseTimeMs: number;
  contentType: string;
  contentLength: number;
  isUseful: boolean;
  containsAyushman: boolean;
  canServerFetch: boolean;
  sample: string;
  notes: string;
}

function testEndpoint(category: string, name: string, url: string, timeoutMs = 5000): Promise<DiscoveryResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    try {
      const parsed = new URL(url);
      const protocol = parsed.protocol === 'https:' ? https : http;

      const req = protocol.get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
          },
          timeout: timeoutMs
        },
        (res) => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
            if (data.length > 100000) {
              // Read first 100KB is enough
              req.destroy();
            }
          });

          res.on('end', () => {
            const elapsed = Date.now() - start;
            const lower = data.toLowerCase();
            const hasAyushman = lower.includes('ayushman') || lower.includes('pmjay') || lower.includes('pm-jay') || lower.includes('health authority') || lower.includes('आयुष्मान');
            const isSpaShell = data.includes('<div id="root"></div>') || data.includes('<app-root></app-root>') || data.includes('You need to enable JavaScript to run this app.');
            const isWaf = data.includes('Attention Required! | Cloudflare') || data.includes('403 Forbidden') || data.includes('Access Denied');
            const isUseful = (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) && data.length > 500 && !isSpaShell && !isWaf && hasAyushman;

            resolve({
              category,
              name,
              url,
              status: res.statusCode || 'UNKNOWN',
              responseTimeMs: elapsed,
              contentType: res.headers['content-type'] || 'unknown',
              contentLength: data.length,
              isUseful,
              containsAyushman: hasAyushman,
              canServerFetch: (res.statusCode || 0) < 400 && !isWaf,
              sample: data.slice(0, 300).replace(/\s+/g, ' '),
              notes: isWaf ? 'Blocked by WAF / Cloudflare' : (isSpaShell ? 'Client-side SPA shell only' : (hasAyushman ? 'Contains Ayushman text' : 'No Ayushman keywords found'))
            });
          });
        }
      );

      req.on('error', (err) => {
        resolve({
          category,
          name,
          url,
          status: `ERROR: ${err.message}`,
          responseTimeMs: Date.now() - start,
          contentType: 'none',
          contentLength: 0,
          isUseful: false,
          containsAyushman: false,
          canServerFetch: false,
          sample: '',
          notes: `Network error: ${err.message}`
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          category,
          name,
          url,
          status: `TIMEOUT (${timeoutMs}ms)`,
          responseTimeMs: Date.now() - start,
          contentType: 'none',
          contentLength: 0,
          isUseful: false,
          containsAyushman: false,
          canServerFetch: false,
          sample: '',
          notes: 'Server-side request timed out'
        });
      });
    } catch (e) {
      resolve({
        category,
        name,
        url,
        status: `EXCEPTION: ${(e as Error).message}`,
        responseTimeMs: Date.now() - start,
        contentType: 'none',
        contentLength: 0,
        isUseful: false,
        containsAyushman: false,
        canServerFetch: false,
        sample: '',
        notes: `Exception: ${(e as Error).message}`
      });
    }
  });
}

async function runDiscovery() {
  console.log('================================================================');
  console.log(' FORENSIC SOURCE DISCOVERY FOR AYUSHMAN BHARAT (PM-JAY)');
  console.log('================================================================\n');

  const candidates = [
    // 1. PM-JAY official domains
    { category: 'PM-JAY', name: 'PM-JAY Main Portal', url: 'https://pmjay.gov.in/' },
    { category: 'PM-JAY', name: 'PM-JAY About Page', url: 'https://pmjay.gov.in/about/pmjay' },
    { category: 'PM-JAY', name: 'PM-JAY Beneficiary Portal', url: 'https://beneficiary.nha.gov.in/' },
    { category: 'PM-JAY', name: 'PM-JAY Mera Portal', url: 'https://mera.pmjay.gov.in/' },
    
    // 2. NHA official domains
    { category: 'NHA', name: 'NHA Main Portal', url: 'https://nha.gov.in/' },
    { category: 'NHA', name: 'NHA PM-JAY Scheme Page', url: 'https://nha.gov.in/PM-JAY' },
    { category: 'NHA', name: 'NHA News / Media', url: 'https://nha.gov.in/news-media' },
    { category: 'NHA', name: 'NHA Sitemap', url: 'https://nha.gov.in/sitemap.xml' },

    // 3. PIB official feeds & search
    { category: 'PIB', name: 'PIB RSS English (ModId=6)', url: 'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=1' },
    { category: 'PIB', name: 'PIB RSS Hindi (ModId=6)', url: 'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=2' },
    { category: 'PIB', name: 'PIB Press Release Iframe (Sample PRID 2303457)', url: 'https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2303457' },
    { category: 'PIB', name: 'PIB Main Index', url: 'https://pib.gov.in/index.aspx' },

    // 4. MoHFW (Ministry of Health & Family Welfare)
    { category: 'MoHFW', name: 'MoHFW Main Portal', url: 'https://www.mohfw.gov.in/' },
    { category: 'MoHFW', name: 'MoHFW Ayushman Bharat Page', url: 'https://main.mohfw.gov.in/' },
    { category: 'MoHFW', name: 'MoHFW News / Updates', url: 'https://www.mohfw.gov.in/news' },

    // 5. India.gov.in / National Portal
    { category: 'India.gov', name: 'India.gov Spotlight Ayushman', url: 'https://www.india.gov.in/spotlight/ayushman-bharat-national-health-protection-mission' },
    { category: 'India.gov', name: 'India.gov Services Health Search', url: 'https://services.india.gov.in/service/search?kw=ayushman+bharat' },
    { category: 'MyGov', name: 'MyGov India Schemes', url: 'https://www.mygov.in/schemes/' }
  ];

  const results: DiscoveryResult[] = [];

  for (const item of candidates) {
    console.log(`Auditing: [${item.category}] ${item.name} (${item.url})...`);
    const res = await testEndpoint(item.category, item.name, item.url, 5000);
    results.push(res);
    console.log(` - Status: ${res.status} | Time: ${res.responseTimeMs}ms | Size: ${res.contentLength}b | Fetchable: ${res.canServerFetch} | Useful: ${res.isUseful}`);
    console.log(` - Notes: ${res.notes}`);
    console.log('----------------------------------------------------------------');
  }

  console.log('\n\n================================================================');
  console.log(' DISCOVERY SUMMARY TABLE');
  console.log('================================================================');
  console.table(results.map(r => ({
    Category: r.category,
    Name: r.name,
    Status: r.status,
    TimeMs: r.responseTimeMs,
    Fetchable: r.canServerFetch,
    HasAyushman: r.containsAyushman,
    Useful: r.isUseful,
    Notes: r.notes
  })));
}

runDiscovery().catch(console.error);
