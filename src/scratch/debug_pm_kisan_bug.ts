import { retrieveOfficialInfo } from '../retrieval/sourceManager';
import { extractRelevantContent } from '../retrieval/contentExtractor';

async function debugPmKisanBug() {
  console.log('====================================================');
  console.log(' DEBUGGING PM KISAN RETRIEVAL BUG');
  console.log('====================================================\n');

  const query = "PM Kisan eligibility kya hai?";
  console.log(`Query: "${query}"\n`);

  const result = await retrieveOfficialInfo(query);

  console.log(`- Matched: ${result.matched}`);
  console.log(`- Service Name: ${result.serviceName}`);
  console.log(`- Retrieval Method: ${result.retrievalMethod}`);
  console.log(`- Extracted Content Length: ${result.content.length} chars`);
  console.log(`\n---------------- EXPACT 335 CHARS PRODUCED ----------------`);
  console.log(result.content);
  console.log(`-----------------------------------------------------------\n`);

  // Let's also fetch live pmkisan.gov.in raw HTML and inspect what text is on the homepage vs what is in pm_kisan.txt!
  const response = await fetch('https://pmkisan.gov.in/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0'
    }
  });
  const html = await response.text();
  console.log(`Raw Live HTML Length: ${html.length} bytes`);
}

debugPmKisanBug().catch(console.error);
