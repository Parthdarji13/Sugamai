async function checkFullLiveText() {
  const response = await fetch('https://pmkisan.gov.in/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0'
    }
  });
  const html = await response.text();
  
  // Clean HTML
  let cleaned = html.replace(/<(script|style|nav|header|footer|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, ' ');
  cleaned = cleaned.replace(/<(script|style|nav|header|footer|noscript|svg|iframe)[\s\S]*?>/gi, ' ');
  cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n\n');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n\n');

  console.log(`Cleaned Text Total Length: ${cleaned.length} chars`);
  console.log(`Contains 'eligib': ${cleaned.toLowerCase().includes('eligib')}`);
  console.log(`Contains 'landholding': ${cleaned.toLowerCase().includes('landholding')}`);
  console.log(`Contains 'benefit': ${cleaned.toLowerCase().includes('benefit')}`);
  
  console.log('\n--- FULL CLEANED TEXT OF PMKISAN.GOV.IN HOMEPAGE ---');
  console.log(cleaned.slice(0, 2000));
}

checkFullLiveText().catch(console.error);
