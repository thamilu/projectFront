const http = require('http');

http.get('http://localhost:8082/api/v1/sellers/profile/exists', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Exists:', data));
});
