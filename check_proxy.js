
async function checkProxy() {
  try {
    console.log('Testing proxy at http://localhost:3000/api/v1/dashboard/customer');
    const res = await fetch('http://localhost:3000/api/v1/dashboard/customer', { redirect: 'manual' });
    const text = await res.text();
    
    console.log('Status:', res.status);
    console.log('Headers content-type:', res.headers.get('content-type'));
    
    if (text.includes('<!DOCTYPE html>') || text.includes('Page Not Found')) {
      console.log('FAIL: Still getting Next.js 404 HTML page.');
    } else {
      console.log('SUCCESS: Received response from backend (likely 401/403, which is good).');
      console.log('Body snippet:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProxy();
