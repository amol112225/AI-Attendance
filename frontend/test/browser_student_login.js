/**
 * AttendAI Real Chrome Browser Test: Student Portal Layout, Navigation & Auth Hardening
 * Runs against the production `vite build` output in real headless Google Chrome via CDP.
 * Uses CDP Fetch interception on Supabase REST/Auth endpoints so fail-closed DB authorization,
 * pending-teacher denial, missing-profile fail-closed handling, session restore, logout,
 * navigation across the 3 Student Portal sections, mobile drawer ARIA/inert behavior, and
 * responsive overflow checks execute authentically end to end.
 */

import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5188;
const DIST_DIR = path.resolve('frontend/dist');
const USER_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'attendai_chrome_suite_'));

console.log('================================================================');
console.log('   AttendAI Real Chrome Browser Test: Student Portal Task 1     ');
console.log('================================================================');

console.log('Building frontend bundle for production browser test...');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

// 1. Start Static HTTP Server with SPA Routing Fallback
console.log(`\n[1/7] Starting local HTTP SPA server on port ${PORT}...`);
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
console.log('[2/7] Launching Google Chrome (headless=new)...');
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

// 3. Connect CDP Client
const targetsRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
const targets = await targetsRes.json();
const pageTarget = targets.find((t) => t.type === 'page');
if (!pageTarget) {
  throw new Error('No page target found in Chrome instances');
}

class CDPClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 1;
    this.callbacks = new Map();
    this.eventHandlers = new Map();
  }

  on(method, handler) {
    if (!this.eventHandlers.has(method)) {
      this.eventHandlers.set(method, []);
    }
    this.eventHandlers.get(method).push(handler);
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
        } else if (msg.method && this.eventHandlers.has(msg.method)) {
          for (const handler of this.eventHandlers.get(msg.method)) {
            Promise.resolve(handler(msg.params)).catch((err) => {
              console.error(`CDP handler error (${msg.method}):`, err);
            });
          }
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

const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
await cdp.init();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('DOM.enable');
await cdp.send('Fetch.enable', {
  patterns: [{ urlPattern: '*supabase.co/*', requestStage: 'Request' }],
});

// Track console errors and page exceptions
const runtimeErrors = [];
cdp.on('Runtime.exceptionThrown', (params) => {
  runtimeErrors.push(params.exceptionDetails?.text || 'Runtime exception');
});
cdp.on('Runtime.consoleAPICalled', (params) => {
  if (params.type === 'error') {
    const text = (params.args || []).map((a) => a.value || a.description || '').join(' ');
    runtimeErrors.push(`console.error: ${text}`);
  }
});

// Mock Supabase Database & Auth responses controlled per scenario
const mockBackend = {
  profile: null,
  teacherRequest: null,
  user: null,
};

const corsHeaders = [
  { name: 'access-control-allow-origin', value: '*' },
  { name: 'access-control-allow-methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' },
  { name: 'access-control-allow-headers', value: 'authorization, apikey, content-type, x-client-info, prefer, accept-profile' },
];

function respondJson(requestId, code, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  return cdp.send('Fetch.fulfillRequest', {
    requestId,
    responseCode: code,
    responseHeaders: [
      ...corsHeaders,
      { name: 'content-type', value: 'application/json; charset=utf-8' },
    ],
    body,
  });
}

cdp.on('Fetch.requestPaused', async ({ requestId, request }) => {
  const { url, method } = request;
  if (method === 'OPTIONS') {
    await cdp.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 204,
      responseHeaders: corsHeaders,
    });
    return;
  }

  if (url.includes('/rest/v1/profiles')) {
    await respondJson(requestId, 200, mockBackend.profile ? [mockBackend.profile] : []);
    return;
  }

  if (url.includes('/rest/v1/teacher_registration_requests')) {
    await respondJson(requestId, 200, mockBackend.teacherRequest ? [mockBackend.teacherRequest] : []);
    return;
  }

  if (url.includes('/rest/v1/attendance_records') || url.includes('/rest/v1/student_subjects')) {
    await respondJson(requestId, 200, []);
    return;
  }

  if (url.includes('/auth/v1/logout')) {
    mockBackend.user = null;
    mockBackend.profile = null;
    await cdp.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 204,
      responseHeaders: corsHeaders,
    });
    return;
  }

  if (url.includes('/auth/v1/user')) {
    await respondJson(requestId, 200, mockBackend.user || {});
    return;
  }

  await cdp.send('Fetch.continueRequest', { requestId });
});

console.log('✔ CDP WebSocket session & Supabase REST interceptor initialized');

let testFailures = 0;

function assertCheck(name, condition, details = '') {
  if (condition) {
    console.log(`  ✔ [PASS] ${name}${details ? ` (${details})` : ''}`);
  } else {
    console.error(`  ✖ [FAIL] ${name}${details ? ` (${details})` : ''}`);
    testFailures++;
  }
}

function makeMockSession({ id, email, fullName, userMetadata = {} }) {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id,
    email,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: fullName, ...userMetadata },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    role: 'authenticated',
  };
  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated',
      exp: now + 7200,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    })
  ).toString('base64url');
  const jwtSig = Buffer.from('attendai_mock_signature_hash_bytes_1234567890').toString('base64url');
  return {
    user,
    session: {
      access_token: `${jwtHeader}.${jwtPayload}.${jwtSig}`,
      token_type: 'bearer',
      expires_at: now + 7200,
      expires_in: 7200,
      refresh_token: 'attendai_refresh_token_123',
      user,
    },
  };
}

async function setBrowserSession(sessionData) {
  await cdp.eval(`
    localStorage.setItem('attendai_auth_token', JSON.stringify(${JSON.stringify(sessionData.session)}));
    localStorage.setItem('attendai_auth_token-user', JSON.stringify({ user: ${JSON.stringify(sessionData.user)} }));
  `);
}

async function clearBrowserSession() {
  await cdp.eval(`
    localStorage.removeItem('attendai_auth_token');
    localStorage.removeItem('attendai_auth_token-user');
  `);
}

async function waitForCondition(expr, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const val = await cdp.eval(expr);
    if (val) return val;
    await new Promise((r) => setTimeout(r, 150));
  }
  return await cdp.eval(expr);
}

try {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // ---------------------------------------------------------------------------
  // STEP 3: Login Page Validation & Student Login
  // ---------------------------------------------------------------------------
  console.log('\n[3/7] Verifying Login page & validation...');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/login` });
  const pageTitle = await waitForCondition('document.querySelector("h1.login-title")?.textContent');
  assertCheck('Initial navigation to /login', (await cdp.eval('window.location.pathname')) === '/login');
  assertCheck('Login page rendered', pageTitle === 'Welcome back', `Header: "${pageTitle}"`);

  await cdp.eval('document.querySelector("button[type=submit]").click()');
  await new Promise((r) => setTimeout(r, 250));
  const emailError = await cdp.eval('document.querySelector("#email-error")?.textContent');
  assertCheck('Empty form triggers validation', emailError?.includes('Email Address is required'));

  // Configure authoritative DB student profile & log in
  const studentId = 'b61a815e-5609-463b-aa63-da7e33699e64';
  const studentSession = makeMockSession({
    id: studentId,
    email: 'student.attendai@gmail.com',
    fullName: 'Amol Kendre (Student)',
    userMetadata: { role: 'student' },
  });
  mockBackend.user = studentSession.user;
  mockBackend.profile = {
    id: studentId,
    full_name: 'Amol Kendre (Student)',
    role: 'student',
    is_approved: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockBackend.teacherRequest = null;

  await setBrowserSession(studentSession);
  await cdp.send('Page.reload');

  const redirectedToStudent = await waitForCondition('window.location.pathname === "/student/dashboard"');
  assertCheck('Authenticated Student redirects from /login to /student/dashboard', Boolean(redirectedToStudent));

  // ---------------------------------------------------------------------------
  // STEP 4: Student Portal Layout, Public Component Isolation & 3-Section Nav
  // ---------------------------------------------------------------------------
  console.log('\n[4/7] Verifying Student Portal layout & 3-section navigation (Desktop 1280x800)...');
  await waitForCondition('document.querySelector(".dashboard-sidebar") && document.querySelector(".dashboard-page-header__title")');

  const layoutCheck = await cdp.eval(`(() => {
    const publicNavbar = document.querySelector(".navbar");
    const publicHero = document.querySelector(".hero");
    const publicFeatures = document.querySelector(".features");
    const publicFooter = document.querySelector("footer.footer");
    const sidebarLinks = Array.from(document.querySelectorAll(".dashboard-sidebar .dashboard-nav-item__link"))
      .map(el => ({ text: el.textContent.trim(), href: el.getAttribute("href") }));
    const brandText = document.querySelector(".dashboard-sidebar__brand-text")?.textContent?.trim();
    const sidebarEmail = document.querySelector(".dashboard-user-email")?.textContent?.trim();
    const hasSkipLink = Boolean(document.querySelector("a.dashboard-skip-link[href='#dashboard-main-content']"));
    const hasFocusableMain = document.querySelector("main#dashboard-main-content")?.getAttribute("tabindex") === "-1";
    const sidebarLogout = Boolean(document.querySelector(".dashboard-sidebar__logout-btn"));
    return {
      hasPublicUi: Boolean(publicNavbar || publicHero || publicFeatures || publicFooter),
      sidebarLinks,
      brandText,
      sidebarEmail,
      hasSkipLink,
      hasFocusableMain,
      sidebarLogout,
    };
  })()`);

  assertCheck('Public Navbar, Hero, Features, and Footer excluded from Student Portal', layoutCheck.hasPublicUi === false);
  assertCheck('AttendAI brand identity displayed in desktop sidebar', layoutCheck.brandText === 'AttendAI');
  assertCheck('Student email identity shown in sidebar footer', layoutCheck.sidebarEmail === 'student.attendai@gmail.com');
  assertCheck('Desktop sidebar has Logout button', layoutCheck.sidebarLogout === true);
  assertCheck('Accessible skip link & focusable main landmark present', layoutCheck.hasSkipLink && layoutCheck.hasFocusableMain);

  const expectedLinks = ['My Attendance', 'My Subjects', 'My Profile'];
  const actualLabels = layoutCheck.sidebarLinks.map((l) => l.text);
  assertCheck(
    'Sidebar renders exact three Student sections (My Attendance, My Subjects, My Profile)',
    JSON.stringify(actualLabels) === JSON.stringify(expectedLinks),
    `Found: ${JSON.stringify(actualLabels)}`
  );

  // Click through all 3 sections in sidebar and assert route, active state, breadcrumb, and H1
  for (const section of [
    { label: 'My Attendance', route: '/student/attendance', heading: 'My Attendance' },
    { label: 'My Subjects', route: '/student/subjects', heading: 'My Subjects' },
    { label: 'My Profile', route: '/student/profile', heading: 'My Profile' },
  ]) {
    await cdp.eval(`
      Array.from(document.querySelectorAll(".dashboard-sidebar .dashboard-nav-item__link"))
        .find(el => el.textContent.trim() === ${JSON.stringify(section.label)})
        ?.click();
    `);
    const routeReached = await waitForCondition(`window.location.pathname === ${JSON.stringify(section.route)}`);
    const headingMatch = await waitForCondition(`document.querySelector("h1.dashboard-page-header__title")?.textContent?.trim() === ${JSON.stringify(section.heading)}`);
    const sectionState = await cdp.eval(`(() => {
      const activeLinks = Array.from(document.querySelectorAll(".dashboard-sidebar .dashboard-nav-item__link--active"))
        .map(el => el.textContent.trim());
      const breadcrumb = document.querySelector(".dashboard-header__breadcrumb-active")?.textContent?.trim();
      const scrollOk = document.documentElement.scrollWidth <= window.innerWidth;
      return { activeLinks, breadcrumb, scrollOk };
    })()`);

    assertCheck(
      `Sidebar link "${section.label}" navigates & activates cleanly`,
      Boolean(routeReached && headingMatch) &&
        sectionState.activeLinks.length === 1 &&
        sectionState.activeLinks[0] === section.label &&
        sectionState.breadcrumb === section.label &&
        sectionState.scrollOk
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Direct URL Visit & Refresh Persistence on Student Portal Subroutes
  // ---------------------------------------------------------------------------
  console.log('\n[5/7] Verifying refresh persistence & direct URL visits...');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/student/subjects` });
  await waitForCondition('document.querySelector("h1.dashboard-page-header__title")?.textContent?.trim() === "My Subjects"');
  await cdp.send('Page.reload');
  const postReloadOk = await waitForCondition(
    'window.location.pathname === "/student/subjects" && document.querySelector("h1.dashboard-page-header__title")?.textContent?.trim() === "My Subjects"'
  );
  assertCheck('Page reload preserves session and /student/subjects route', Boolean(postReloadOk));

  // ---------------------------------------------------------------------------
  // STEP 6: Responsive Mobile & Tablet Viewports + Drawer ARIA/Inert + Zero Overflow
  // ---------------------------------------------------------------------------
  console.log('\n[6/7] Verifying Tablet (768x1024) & Mobile (360x740) layouts, drawer ARIA/inert, and overflow...');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 200));

  for (const r of ['/student/attendance', '/student/subjects', '/student/profile']) {
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}${r}` });
    await waitForCondition('document.querySelector(".dashboard-mobile-nav") && document.querySelector("h1.dashboard-page-header__title")');
    const tabletState = await cdp.eval(`(() => {
      const mobileNav = document.querySelector(".dashboard-mobile-nav");
      const mobileLinks = Array.from(document.querySelectorAll(".dashboard-mobile-nav__link")).map(el => el.textContent.trim());
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        visible: mobileNav ? getComputedStyle(mobileNav).display !== "none" : false,
        mobileLinks,
        overflow,
      };
    })()`);
    assertCheck(
      `Tablet (768px) ${r} shows 3-section compact nav without overflow`,
      tabletState.visible &&
        JSON.stringify(tabletState.mobileLinks) === JSON.stringify(expectedLinks) &&
        tabletState.overflow === false
    );
  }

  // Mobile 360x740
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 740,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 200));

  for (const r of ['/student/attendance', '/student/subjects', '/student/profile']) {
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}${r}` });
    await waitForCondition('document.querySelector(".dashboard-mobile-nav") && document.querySelector("h1.dashboard-page-header__title")');
    const mobileOverflow = await cdp.eval('({ w: window.innerWidth, sw: document.documentElement.scrollWidth })');
    assertCheck(
      `Mobile (360x740) ${r} has zero horizontal overflow`,
      mobileOverflow.sw <= mobileOverflow.w,
      `scrollWidth=${mobileOverflow.sw}, innerWidth=${mobileOverflow.w}`
    );
  }

  // Drawer open/close, Escape, aria-expanded, and inert trapping on mobile
  const beforeDrawer = await cdp.eval(`(() => ({
    expanded: document.querySelector(".dashboard-header__toggle-btn")?.getAttribute("aria-expanded"),
    sidebarInert: document.querySelector("#dashboard-sidebar")?.inert,
    contentInert: document.querySelector(".dashboard-content-wrapper")?.inert,
  }))()`);
  assertCheck(
    'Mobile drawer initially closed with hidden sidebar marked inert',
    beforeDrawer.expanded === 'false' && beforeDrawer.sidebarInert === true && beforeDrawer.contentInert === false
  );

  await cdp.eval('document.querySelector(".dashboard-header__toggle-btn").click()');
  await new Promise((r) => setTimeout(r, 200));
  const openDrawer = await cdp.eval(`(() => ({
    expanded: document.querySelector(".dashboard-header__toggle-btn")?.getAttribute("aria-expanded"),
    hasOpenClass: document.querySelector("#dashboard-sidebar")?.classList.contains("dashboard-sidebar--open"),
    sidebarInert: document.querySelector("#dashboard-sidebar")?.inert,
    contentInert: document.querySelector(".dashboard-content-wrapper")?.inert,
    hasBackdrop: Boolean(document.querySelector(".dashboard-backdrop")),
  }))()`);
  assertCheck(
    'Opening mobile drawer sets aria-expanded="true", shows backdrop, and marks background inert',
    openDrawer.expanded === 'true' &&
      openDrawer.hasOpenClass === true &&
      openDrawer.sidebarInert === false &&
      openDrawer.contentInert === true &&
      openDrawer.hasBackdrop === true
  );

  // Close with Escape
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 200));
  const afterEsc = await cdp.eval(`(() => ({
    expanded: document.querySelector(".dashboard-header__toggle-btn")?.getAttribute("aria-expanded"),
    hasOpenClass: document.querySelector("#dashboard-sidebar")?.classList.contains("dashboard-sidebar--open"),
    contentInert: document.querySelector(".dashboard-content-wrapper")?.inert,
  }))()`);
  assertCheck(
    'Escape key closes mobile drawer and restores background interactivity',
    afterEsc.expanded === 'false' && afterEsc.hasOpenClass === false && afterEsc.contentInert === false
  );

  // ---------------------------------------------------------------------------
  // STEP 7: Logout, Unauthenticated Blocking, Pending Teacher Blocking & Fail-Closed Missing Profile
  // ---------------------------------------------------------------------------
  console.log('\n[7/7] Verifying Logout, Pending Teacher denial, & Fail-Closed missing profile...');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.eval('window.dispatchEvent(new Event("resize"))');
  await new Promise((r) => setTimeout(r, 300));

  await cdp.eval(`(() => {
    const el = document.querySelector(".dashboard-sidebar__logout-btn") ||
               document.querySelector(".sp-logout-btn") ||
               document.querySelector(".dashboard-header__signout-btn");
    console.log("Logout button clicked:", el);
    if (el) el.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1000));
  const currentPath = await cdp.eval('window.location.pathname');
  const hasNavbar = await cdp.eval('Boolean(document.querySelector(".navbar"))');
  console.log('After logout click -> currentPath:', currentPath, 'hasNavbar:', hasNavbar);
  const loggedOutToRoot = await waitForCondition('(window.location.pathname === "/" || window.location.pathname === "/login") && Boolean(document.querySelector(".navbar"))');
  assertCheck('Logout clears session and redirects to public page (/ or /login)', Boolean(loggedOutToRoot));

  // Unauthenticated access to Student Portal sections blocked -> /login
  for (const r of ['/student/attendance', '/student/subjects', '/student/profile']) {
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}${r}` });
    const blocked = await waitForCondition('window.location.pathname === "/login"');
    assertCheck(`Unauthenticated ${r} redirects to /login`, Boolean(blocked));
  }

  // Pending Teacher even with spoofed user_metadata.role = "student" -> MUST be blocked (/unauthorized)
  const pendingTeacherId = '11111111-2222-3333-4444-555555555555';
  const pendingSession = makeMockSession({
    id: pendingTeacherId,
    email: 'pending.teacher@attendai.edu',
    fullName: 'Pending Faculty Applicant',
    userMetadata: { role: 'student', requested_role: 'teacher' },
  });
  mockBackend.user = pendingSession.user;
  mockBackend.profile = {
    id: pendingTeacherId,
    full_name: 'Pending Faculty Applicant',
    role: 'teacher',
    is_approved: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockBackend.teacherRequest = {
    id: 'req-1',
    user_id: pendingTeacherId,
    status: 'pending',
    rejection_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setBrowserSession(pendingSession);
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/student/attendance` });
  const pendingBlocked = await waitForCondition('window.location.pathname === "/unauthorized"');
  assertCheck('Pending Teacher is blocked from /student/attendance (-> /unauthorized)', Boolean(pendingBlocked));

  // Missing DB profile WITH spoofed user_metadata.role = "student" -> MUST fail closed (/unauthorized, NO synthetic fallback!)
  mockBackend.profile = null;
  mockBackend.teacherRequest = null;
  const spoofSession = makeMockSession({
    id: '99999999-8888-7777-6666-555555555555',
    email: 'missing.profile@attendai.edu',
    fullName: 'Spoofed Student',
    userMetadata: { role: 'student' },
  });
  mockBackend.user = spoofSession.user;

  await setBrowserSession(spoofSession);
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/student/attendance` });
  const missingBlocked = await waitForCondition('window.location.pathname === "/unauthorized"');
  assertCheck('Missing profile fails closed without synthetic/metadata fallback (-> /unauthorized)', Boolean(missingBlocked));

  await clearBrowserSession();

  assertCheck(
    'Zero uncaught runtime or console errors during entire browser test',
    runtimeErrors.length === 0,
    runtimeErrors.length ? runtimeErrors.join(' | ') : 'clean'
  );

  console.log('\n================================================================');
  if (testFailures === 0) {
    console.log('   ✔ ALL REAL CHROME BROWSER TESTS PASSED SUCCESSFULLY!       ');
  } else {
    console.error(`   ✖ ${testFailures} TEST(S) FAILED IN BROWSER EXECUTION!`);
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
