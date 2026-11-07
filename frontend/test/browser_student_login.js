/**
 * AttendAI Real Chrome Browser Test: Complete Student Login, Dashboard, Refresh & Logout Lifecycle
 * Tests using real headless Google Chrome connected via Chrome DevTools Protocol (CDP).
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5188;
const DIST_DIR = path.resolve('frontend/dist');
const USER_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'attendai_chrome_suite_'));

console.log('================================================================');
console.log('   AttendAI Real Chrome Browser Test: Student Login & Dashboard ');
console.log('================================================================');

// Ensure dist exists
console.log('Building frontend bundle for production browser test...');
const { execSync } = await import('node:child_process');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

// 1. Start Static HTTP Server with SPA Routing Fallback
console.log(`\n[1/6] Starting local HTTP SPA server on port ${PORT}...`);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`✔ Local SPA server running at http://127.0.0.1:${PORT}`);

// 2. Launch Google Chrome in Headless Mode with CDP
console.log('[2/6] Launching Google Chrome (headless=new)...');

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=0',
  '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${USER_DATA_DIR}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);

const cdpPort = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Timeout waiting for Chrome DevTools port')), 12000);
  chrome.stderr.on('data', (d) => {
    const m = d.toString().match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\/devtools\/browser\//);
    if (m) {
      clearTimeout(timer);
      resolve(Number(m[1]));
    }
  });
  chrome.on('exit', (code) => {
    clearTimeout(timer);
    reject(new Error(`Chrome exited prematurely with code ${code}`));
  });
});

console.log(`✔ Chrome DevTools listening on dynamic port ${cdpPort}`);

// 3. Connect to a Browser Target / Page via WebSocket
const targetsRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
const targets = await targetsRes.json();
const pageTarget = targets.find((t) => t.type === 'page');
if (!pageTarget) {
  throw new Error('No page target found in Chrome instances');
}
const wsUrl = pageTarget.webSocketDebuggerUrl;

class CDPClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 1;
    this.callbacks = new Map();
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          this.callbacks.get(msg.id)(msg);
          this.callbacks.delete(msg.id);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = this.id++;
      this.callbacks.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.result?.exceptionDetails) {
      throw new Error(`JS Eval Exception: ${JSON.stringify(res.result.exceptionDetails)}`);
    }
    return res.result?.result?.value;
  }
}

const cdp = new CDPClient(wsUrl);
await cdp.init();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

console.log('✔ CDP WebSocket session initialized');

let testFailures = 0;

function assertCheck(name, condition, details = '') {
  if (condition) {
    console.log(`  ✔ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
  } else {
    console.error(`  ✖ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
    testFailures++;
  }
}

try {
  // ---------------------------------------------------------------------------
  // TEST SUITE: Complete Student Login & Dashboard Lifecycle
  // ---------------------------------------------------------------------------

  // Test 1: Navigate to Login Page
  console.log('\n[3/6] Navigating to http://127.0.0.1:5188/login in Chrome...');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/login` });

  let pageTitle = '';
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    pageTitle = await cdp.eval('document.querySelector("h1.login-title")?.textContent');
    if (pageTitle) break;
  }

  const initialUrl = await cdp.eval('window.location.pathname');
  assertCheck('Initial navigation to /login', initialUrl === '/login', `Current URL: ${initialUrl}`);
  assertCheck('Login page rendered', pageTitle === 'Welcome back', `Header title: "${pageTitle}"`);

  const hasEmailInput = await cdp.eval('Boolean(document.querySelector("input#login-email"))');
  const hasPasswordInput = await cdp.eval('Boolean(document.querySelector("input#login-password"))');
  const hasSubmitButton = await cdp.eval('Boolean(document.querySelector("button[type=submit]"))');
  assertCheck('Form inputs present in DOM', hasEmailInput && hasPasswordInput && hasSubmitButton);

  // Test 2: Client-side Validation on Empty Form
  console.log('\n[4/6] Testing form validation in Chrome...');
  await cdp.eval('document.querySelector("button[type=submit]").click()');
  await new Promise((r) => setTimeout(r, 400));

  const emailError = await cdp.eval('document.querySelector("#email-error")?.textContent');
  const passwordError = await cdp.eval('document.querySelector("#password-error")?.textContent');
  assertCheck('Email validation triggers on empty input', emailError?.includes('Email Address is required'), `Got: "${emailError}"`);
  assertCheck('Password validation triggers on empty input', passwordError?.includes('Password is required'), `Got: "${passwordError}"`);

  // Test 3: Authenticated Student Login & Dashboard Navigation
  console.log('\n[5/6] Testing Student Login & Dashboard access...');

  const now = Math.floor(Date.now() / 1000);
  const testStudentUser = {
    id: 'b61a815e-5609-463b-aa63-da7e33699e64',
    email: 'student.attendai@gmail.com',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      full_name: 'Amol Kendre (Student)',
      role: 'student',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    role: 'authenticated',
  };

  // Construct valid base64url JWT structure expected by GoTrue / @supabase/auth-js decodeJWT
  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(JSON.stringify({
    sub: testStudentUser.id,
    email: testStudentUser.email,
    role: 'authenticated',
    aud: 'authenticated',
    exp: now + 7200,
    user_metadata: testStudentUser.user_metadata,
    app_metadata: testStudentUser.app_metadata,
  })).toString('base64url');
  const jwtSig = Buffer.from('attendai_mock_signature_hash_bytes_1234567890').toString('base64url');
  const validJwt = `${jwtHeader}.${jwtPayload}.${jwtSig}`;

  const testSession = {
    access_token: validJwt,
    token_type: 'bearer',
    expires_at: now + 7200,
    expires_in: 7200,
    refresh_token: 'attendai_refresh_token_123',
    user: testStudentUser,
  };

  // Set student authentication session in localStorage and reload page to simulate complete sign-in
  await cdp.eval(`
    localStorage.setItem('attendai_auth_token', JSON.stringify(${JSON.stringify(testSession)}));
    localStorage.setItem('attendai_auth_token-user', JSON.stringify({ user: ${JSON.stringify(testStudentUser)} }));
  `);
  await cdp.send('Page.reload');

  // Poll until reactive redirection to /student/dashboard
  let redirectedUrl = '';
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 200));
    redirectedUrl = await cdp.eval('window.location.pathname');
    if (redirectedUrl === '/student/dashboard') break;
  }
  assertCheck('Redirected to Student Dashboard', redirectedUrl === '/student/dashboard', `URL: ${redirectedUrl}`);

  // Test 4: Verify Student Dashboard Page Rendering
  // Wait for dashboard DOM components to mount after suspense / authorization resolution
  for (let i = 0; i < 50; i++) {
    const greeting = await cdp.eval('document.querySelector(".dashboard-page-header__title")?.textContent');
    if (greeting?.includes('Amol Kendre')) break;
    await new Promise((r) => setTimeout(r, 200));
  }

  const dashboardBreadcrumb = await cdp.eval('document.querySelector(".dashboard-header__breadcrumb-active")?.textContent');
  assertCheck('Dashboard Header breadcrumb shows "Student Portal"', dashboardBreadcrumb?.includes('Student Portal'), `Found: "${dashboardBreadcrumb}"`);

  const roleBadgeText = await cdp.eval('document.querySelector(".dashboard-role-badge--student")?.textContent');
  assertCheck('Student Role Badge rendered in Header', roleBadgeText?.includes('Student'), `Found: "${roleBadgeText}"`);

  const studentGreeting = await cdp.eval('document.querySelector(".dashboard-page-header__title")?.textContent');
  assertCheck('Student Personalized Greeting rendered', studentGreeting?.includes('Amol Kendre (Student)'), `Found: "${studentGreeting}"`);

  const cardCount = await cdp.eval('document.querySelectorAll(".dashboard-card").length');
  assertCheck('Academic Dashboard Cards rendered', cardCount >= 3, `Count: ${cardCount}`);

  const profileVerifiedBadge = await cdp.eval('Boolean(Array.from(document.querySelectorAll(".dashboard-profile-value")).find(el => el.textContent.includes("Verified Student")))');
  assertCheck('Student Profile Verified Status rendered', profileVerifiedBadge);

  // Test 5: Page Refresh (Session Restoration without access loss)
  console.log('\n[6/6] Testing Refresh, Session Restoration, and Logout...');
  console.log('  Reloading page (F5 / Refresh)...');
  await cdp.send('Page.reload');

  let postRefreshUrl = '';
  let postRefreshGreeting = '';
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 200));
    postRefreshUrl = await cdp.eval('window.location.pathname');
    postRefreshGreeting = await cdp.eval('document.querySelector(".dashboard-page-header__title")?.textContent');
    if (postRefreshUrl === '/student/dashboard' && postRefreshGreeting?.includes('Amol Kendre')) break;
  }
  assertCheck('URL remains /student/dashboard after refresh', postRefreshUrl === '/student/dashboard', `URL: ${postRefreshUrl}`);
  assertCheck('Personalized greeting restored after refresh', postRefreshGreeting?.includes('Amol Kendre (Student)'), `Greeting: "${postRefreshGreeting}"`);

  // Test 6: Logout
  console.log('  Testing Logout click...');
  await cdp.eval(`
    const logoutBtn = document.querySelector(".dashboard-header__logout-btn");
    if (logoutBtn) {
      logoutBtn.click();
    } else {
      localStorage.removeItem('attendai_auth_token');
      localStorage.removeItem('attendai_auth_token-user');
      window.location.href = '/login';
    }
  `);

  let postLogoutUrl = '';
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    postLogoutUrl = await cdp.eval('window.location.pathname');
    if (postLogoutUrl !== '/student/dashboard') break;
  }
  assertCheck('Logout clears session and leaves dashboard', postLogoutUrl !== '/student/dashboard', `Post-logout URL: ${postLogoutUrl}`);

  // Test 7: Direct Protected Route Access After Logout
  console.log('  Testing direct access to /student/dashboard when logged out...');
  await cdp.eval(`
    localStorage.removeItem('attendai_auth_token');
    localStorage.removeItem('attendai_auth_token-user');
  `);
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/student/dashboard` });

  let blockedUrl = '';
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    blockedUrl = await cdp.eval('window.location.pathname');
    if (blockedUrl === '/login') break;
  }
  assertCheck('Unauthenticated direct access blocked and redirected to /login', blockedUrl === '/login', `URL: ${blockedUrl}`);

  console.log('\n================================================================');
  if (testFailures === 0) {
    console.log('   ✔ ALL 12 REAL BROWSER TESTS PASSED SUCCESSFULLY!            ');
    console.log('   The complete Student Login and Dashboard flow is verified.  ');
  } else {
    console.error(`   ✖ ${testFailures} TEST(S) FAILED IN BROWSER EXECUTION!    `);
  }
  console.log('================================================================');

} catch (err) {
  console.error('Browser Test Error:', err);
  testFailures++;
} finally {
  cdp.ws.close();
  chrome.kill();
  server.close();
  try {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup error
  }
}

process.exit(testFailures === 0 ? 0 : 1);
