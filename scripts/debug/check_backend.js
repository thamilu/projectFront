
async function checkBackend() {
  const target = 'http://127.0.0.1:8082/api/v1/dashboard/customer';
  console.log(`Checking backend at ${target}...`);
  try {
    const res = await fetch(target);
    console.log('Status:', res.status);
    console.log('Headers content-type:', res.headers.get('content-type'));
    const text = await res.text();
    if (text.includes('Whitelabel Error Page') || res.status === 404) {
       // A 404 from Spring Boot is different from Next.js 404
       console.log('Backend reachable but returned 404 (Endpoint might be wrong or Auth required).');
    } else {
       console.log('Backend reachable.');
    }
  } catch (error) {
    console.error('Backend NOT reachable:', error.message);
  }
}

checkBackend();
