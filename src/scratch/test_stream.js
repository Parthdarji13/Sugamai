import http from 'http';

const postData = JSON.stringify({
  message: 'pm kisan eligibility kya hai?',
  language: 'hi',
  lastMatchedSourceId: null
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Sending request to streaming route...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  
  res.on('data', (chunk) => {
    console.log('--- RECEIVED CHUNK ---');
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.log('Raw text:', line);
      }
    }
  });

  res.on('end', () => {
    console.log('Stream ended.');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
