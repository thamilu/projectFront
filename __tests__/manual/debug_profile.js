const { chromium } = require('@playwright/test');

async function run() {
  // Keycloak login credentials are supplied via the shell environment, never
  // hardcoded — e.g.: E2E_USER_EMAIL=you@example.com E2E_USER_PASSWORD=yourpassword node __tests__/manual/debug_profile.js
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    console.error('Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run this script.');
    return;
  }

  console.log('Starting Playwright with system Chrome...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (_e) {
    console.log('Chrome channel failed, trying msedge...');
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e2) {
      console.error('Failed to launch system browser:', e2);
      return;
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console events
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER PAGEERROR]: ${err.stack || err.message}`);
  });

  try {
    console.log('Navigating to profile page...');
    await page.goto('http://localhost:3000/account/profile');
    
    // Wait for redirect to Keycloak login page
    console.log('Waiting for Keycloak login page...');
    await page.waitForSelector('#username', { timeout: 10000 });
    
    console.log('Filling credentials...');
    await page.fill('#username', email);
    await page.fill('#password', password);
    
    console.log('Submitting Keycloak form...');
    await Promise.all([
      page.click('#kc-login'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 })
    ]);
    
    console.log('Navigated back. Current URL:', page.url());
    
    // Wait for the main page to load
    await page.waitForTimeout(2000);
    
    console.log('Clicking Edit Profile button...');
    await page.click('button:has-text("Edit Profile")');
    
    // Wait for state updates
    await page.waitForTimeout(3000);
    
    console.log('Retrieving page DOM after clicking edit...');
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('--- BODY DOM PREVIEW (first 1000 chars) ---');
    console.log(bodyHTML.substring(0, 1000));
    console.log('--- END OF PREVIEW ---');
    
    // Look for #main-content specifically
    const mainContentHTML = await page.evaluate(() => {
      const el = document.getElementById('main-content');
      return el ? el.innerHTML : 'NOT FOUND';
    });
    console.log('--- #main-content HTML ---');
    console.log(mainContentHTML);
    console.log('-------------------------');

  } catch (err) {
    console.error('An error occurred during Playwright run:', err);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('Browser closed.');
  }
}

run();
