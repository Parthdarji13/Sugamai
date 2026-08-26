import https from 'https';

async function checkRedirect() {
  https.get('https://pib.gov.in/rss.aspx', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
  });
}

checkRedirect();
