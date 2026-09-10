const http = require('http');

const urls = ['/', '/stores'];

async function fetchPage(url) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${url}`, (res) => {
      console.log(`Warmup ${url}: ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.warn(`Warmup ${url} failed:`, err.message);
      resolve();
    });
  });
}

async function run() {
  console.log('🔥 Warming up pages...');
  for (const url of urls) {
    await fetchPage(url);
  }
  console.log('✅ Warmup completed.');
}

run();
