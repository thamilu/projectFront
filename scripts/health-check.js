const http = require('http');

const endpoints = [
  '/',
  '/stores'
];

async function check(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${path} is healthy (status 200)`);
        resolve();
      } else {
        console.error(`❌ ${path} is unhealthy (status ${res.statusCode})`);
        reject(new Error(`Status ${res.statusCode}`));
      }
    }).on('error', (err) => {
      console.error(`❌ ${path} check failed: ${err.message}`);
      reject(err);
    });
  });
}

Promise.all(endpoints.map(check))
  .then(() => {
    console.log('🎉 Health check passed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('🚨 Health check failed:', err.message);
    process.exit(1);
  });
