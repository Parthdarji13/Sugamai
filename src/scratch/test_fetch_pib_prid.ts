async function testPibPridFetch() {
  const pridUrl = 'https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2303457';
  console.log(`Fetching ${pridUrl}...`);
  try {
    const res = await fetch(pridUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*'
      }
    });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      console.log(`HTML Length: ${html.length}`);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testPibPridFetch();
