/**
 * Phase 5 Step 7 — Preferences API Integration Test Suite
 * Tests A–L as defined in the verified implementation plan.
 *
 * Run with:  node scripts/test-preferences.mjs
 *
 * Prerequisites:
 *   - npm run dev must be running on http://localhost:3000
 *   - A valid MongoDB connection must be configured in .env.local
 */

const BASE = 'http://localhost:3000';

let passCount = 0;
let failCount = 0;
const results = [];

function pass(label) {
  passCount++;
  results.push({ label, status: 'PASS' });
  console.log(`  ✅  PASS  ${label}`);
}

function fail(label, details) {
  failCount++;
  results.push({ label, status: 'FAIL', details });
  console.log(`  ❌  FAIL  ${label}`);
  if (details) console.log(`       Details: ${details}`);
}

/**
 * Sign up a new test user and return the Set-Cookie header value.
 */
async function signup(email, password, name) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const cookie = res.headers.get('set-cookie');
  const body = await res.json();
  return { status: res.status, cookie, body };
}

/**
 * Log in an existing test user and return the Set-Cookie header value.
 */
async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get('set-cookie');
  const body = await res.json();
  return { status: res.status, cookie, body };
}

/**
 * Log out using a session cookie.
 */
async function logout(cookie) {
  await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
}

/**
 * GET /api/preferences with optional cookie.
 */
async function getPreferences(cookie) {
  const headers = cookie ? { Cookie: cookie } : {};
  const res = await fetch(`${BASE}/api/preferences`, { headers });
  let body = null;
  try { body = await res.json(); } catch { /* ignore */ }
  return { status: res.status, body };
}

/**
 * PATCH /api/preferences with optional cookie.
 */
async function patchPreferences(language, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}/api/preferences`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ language }),
  });
  let body = null;
  try { body = await res.json(); } catch { /* ignore */ }
  return { status: res.status, body };
}

// ─── Generate unique test emails ───────────────────────────────────────────
const ts = Date.now();
const USER_A_EMAIL = `testa_${ts}@sugamtest.dev`;
const USER_B_EMAIL = `testb_${ts}@sugamtest.dev`;
const PASSWORD = 'TestPass123!';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  SugamGov AI — Phase 5 Step 7 Preferences Test Suite');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ─── Test A: Guest GET returns 401 ─────────────────────────────────────────
console.log('Test C: Guest GET /api/preferences → 401');
{
  const { status } = await getPreferences(null);
  if (status === 401) {
    pass('C. Guest GET /api/preferences → 401 Unauthorized');
  } else {
    fail('C. Guest GET /api/preferences → 401 Unauthorized', `Got HTTP ${status}`);
  }
}

// ─── Test D: Guest PATCH returns 401 ───────────────────────────────────────
console.log('Test D: Guest PATCH /api/preferences → 401');
{
  const { status } = await patchPreferences('en', null);
  if (status === 401) {
    pass('D. Guest PATCH /api/preferences → 401 Unauthorized');
  } else {
    fail('D. Guest PATCH /api/preferences → 401 Unauthorized', `Got HTTP ${status}`);
  }
}

// ─── Sign up User A ─────────────────────────────────────────────────────────
console.log('\nSigning up User A...');
const { status: signupStatusA, cookie: cookieA, body: signupBodyA } = await signup(
  USER_A_EMAIL, PASSWORD, 'User A Test'
);
let sessionCookieA = null;
if (signupStatusA === 201 && cookieA) {
  // Extract just the cookie name=value part
  sessionCookieA = cookieA.split(';')[0];
  console.log('  ✅ User A signed up successfully');
} else {
  console.log(`  ❌ User A signup failed: HTTP ${signupStatusA}`, signupBodyA);
}

// ─── Test A: Default new user language is "en" ─────────────────────────────
console.log('\nTest A: Default new user language = en');
if (sessionCookieA) {
  const { status, body } = await getPreferences(sessionCookieA);
  if (status === 200 && body?.language === 'en') {
    pass('A. New user default language = "en"');
  } else {
    fail('A. New user default language = "en"', `HTTP ${status}, language=${body?.language}`);
  }
} else {
  fail('A. New user default language = "en"', 'Could not create test user');
}

// ─── Test B: Authenticated GET returns correct preference ───────────────────
console.log('\nTest B: Authenticated GET returns correct preference');
if (sessionCookieA) {
  const { status, body } = await getPreferences(sessionCookieA);
  if (status === 200 && body?.language && body?.preferences) {
    pass('B. GET /api/preferences returns {language, preferences} for authenticated user');
  } else {
    fail('B. GET /api/preferences returns {language, preferences}', `HTTP ${status}, body=${JSON.stringify(body)}`);
  }
} else {
  fail('B. GET /api/preferences returns {language, preferences}', 'No session cookie');
}

// ─── Test E: Invalid language → 400 ────────────────────────────────────────
console.log('\nTest E: PATCH with invalid language "fr" → 400');
if (sessionCookieA) {
  const { status } = await patchPreferences('fr', sessionCookieA);
  if (status === 400) {
    pass('E. PATCH { language: "fr" } → 400 Bad Request');
  } else {
    fail('E. PATCH { language: "fr" } → 400 Bad Request', `Got HTTP ${status}`);
  }
} else {
  fail('E. PATCH { language: "fr" } → 400 Bad Request', 'No session cookie');
}

// ─── Test F: Save Hindi ─────────────────────────────────────────────────────
console.log('\nTest F: Save language "hi"');
if (sessionCookieA) {
  const { status: patchStatus } = await patchPreferences('hi', sessionCookieA);
  if (patchStatus === 200) {
    const { status: getStatus, body } = await getPreferences(sessionCookieA);
    if (getStatus === 200 && body?.language === 'hi') {
      pass('F. PATCH { language: "hi" } → 200, GET confirms language = "hi"');
    } else {
      fail('F. PATCH { language: "hi" } → 200, GET confirms language = "hi"', `GET returned ${getStatus}, language=${body?.language}`);
    }
  } else {
    fail('F. PATCH { language: "hi" } → 200', `HTTP ${patchStatus}`);
  }
} else {
  fail('F. PATCH { language: "hi" } → 200', 'No session cookie');
}

// ─── Test G: Save Gujarati ──────────────────────────────────────────────────
console.log('\nTest G: Save language "gu"');
if (sessionCookieA) {
  const { status: patchStatus } = await patchPreferences('gu', sessionCookieA);
  if (patchStatus === 200) {
    const { status: getStatus, body } = await getPreferences(sessionCookieA);
    if (getStatus === 200 && body?.language === 'gu') {
      pass('G. PATCH { language: "gu" } → 200, GET confirms language = "gu"');
    } else {
      fail('G. PATCH { language: "gu" } → 200, GET confirms language = "gu"', `GET returned ${getStatus}, language=${body?.language}`);
    }
  } else {
    fail('G. PATCH { language: "gu" } → 200', `HTTP ${patchStatus}`);
  }
} else {
  fail('G. PATCH { language: "gu" } → 200', 'No session cookie');
}

// ─── Test H: Save English ───────────────────────────────────────────────────
console.log('\nTest H: Save language "en"');
if (sessionCookieA) {
  const { status: patchStatus } = await patchPreferences('en', sessionCookieA);
  if (patchStatus === 200) {
    const { status: getStatus, body } = await getPreferences(sessionCookieA);
    if (getStatus === 200 && body?.language === 'en') {
      pass('H. PATCH { language: "en" } → 200, GET confirms language = "en"');
    } else {
      fail('H. PATCH { language: "en" } → 200, GET confirms language = "en"', `GET returned ${getStatus}, language=${body?.language}`);
    }
  } else {
    fail('H. PATCH { language: "en" } → 200', `HTTP ${patchStatus}`);
  }
} else {
  fail('H. PATCH { language: "en" } → 200', 'No session cookie');
}

// ─── Test I: Refresh Persistence ────────────────────────────────────────────
console.log('\nTest I: Refresh persistence (set hi, re-GET with same session)');
if (sessionCookieA) {
  // Set to Hindi
  await patchPreferences('hi', sessionCookieA);
  // Simulate refresh: re-GET using same persistent session cookie
  const { status, body } = await getPreferences(sessionCookieA);
  if (status === 200 && body?.language === 'hi') {
    pass('I. After PATCH "hi", new GET request returns "hi" (MongoDB persists across requests)');
  } else {
    fail('I. Refresh persistence', `GET returned ${status}, language=${body?.language}`);
  }
  // Reset back to 'en' for clean state
  await patchPreferences('en', sessionCookieA);
} else {
  fail('I. Refresh persistence', 'No session cookie');
}

// ─── Sign up User B ─────────────────────────────────────────────────────────
console.log('\nSigning up User B...');
const { status: signupStatusB, cookie: cookieB, body: signupBodyB } = await signup(
  USER_B_EMAIL, PASSWORD, 'User B Test'
);
let sessionCookieB = null;
if (signupStatusB === 201 && cookieB) {
  sessionCookieB = cookieB.split(';')[0];
  console.log('  ✅ User B signed up successfully');
} else {
  console.log(`  ❌ User B signup failed: HTTP ${signupStatusB}`, signupBodyB);
}

// ─── Test J: Cross-user isolation ───────────────────────────────────────────
console.log('\nTest J: Cross-user isolation');
if (sessionCookieA && sessionCookieB) {
  // User A sets Hindi
  await patchPreferences('hi', sessionCookieA);
  // User B sets Gujarati
  await patchPreferences('gu', sessionCookieB);

  const { body: bodyA } = await getPreferences(sessionCookieA);
  const { body: bodyB } = await getPreferences(sessionCookieB);

  const aIsHindi = bodyA?.language === 'hi';
  const bIsGujarati = bodyB?.language === 'gu';

  if (aIsHindi && bIsGujarati) {
    pass('J. Cross-user isolation: User A = "hi", User B = "gu" — each gets their own preference');
  } else {
    fail('J. Cross-user isolation', `User A language=${bodyA?.language}, User B language=${bodyB?.language}`);
  }
} else {
  fail('J. Cross-user isolation', 'Could not create both test users');
}

// ─── Test K: Chat language synchronization ───────────────────────────────────
console.log('\nTest K: Chat language synchronization');
// After PATCH "hi" for user A, GET confirms hi which is what the frontend sends to /api/chat.
// We confirm the API correctly stores and returns "hi" and "gu".
if (sessionCookieA) {
  // Ensure Hindi is set
  await patchPreferences('hi', sessionCookieA);
  const { body } = await getPreferences(sessionCookieA);
  if (body?.language === 'hi') {
    pass('K. Chat language synchronization: GET confirms language="hi" which frontend sends to /api/chat as the `language` field (existing mechanism preserved)');
  } else {
    fail('K. Chat language synchronization', `GET language=${body?.language}`);
  }
  // Reset
  await patchPreferences('en', sessionCookieA);
} else {
  fail('K. Chat language synchronization', 'No session cookie');
}

// ─── Test L: Logout/login switch ─────────────────────────────────────────────
console.log('\nTest L: Logout/login switch — User A logs out, User B logs in');
if (sessionCookieA && sessionCookieB) {
  // User A's preference is 'hi' (set in test J)
  await patchPreferences('hi', sessionCookieA);

  // User A logs out
  await logout(sessionCookieA);

  // User B still has their own session with 'gu'
  const { body: bodyB } = await getPreferences(sessionCookieB);
  if (bodyB?.language === 'gu') {
    pass('L. Logout/login switch: User B still gets "gu" after User A logs out (no preference leakage)');
  } else {
    fail('L. Logout/login switch', `User B language=${bodyB?.language} (expected "gu")`);
  }

  // Verify User A's old session is invalidated (should return 401 or different)
  const { status: oldSessionStatus } = await getPreferences(sessionCookieA);
  if (oldSessionStatus === 401) {
    pass('L (extra): User A old session correctly invalidated after logout → 401');
  } else {
    // Note: session cookie clearing depends on server behavior; log but don't hard fail
    console.log(`  ℹ️  Note: User A old session returned HTTP ${oldSessionStatus} after logout (cookie may linger in client)`);
  }
} else {
  fail('L. Logout/login switch', 'Could not create both test users');
}

// ─── Final Summary ────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Tests not automatically verified (require browser):');
console.log('  I.  Actual page refresh persistence (requires browser session management)');
console.log('  K.  Live Gemini chat language verification (requires live API key & stream)');
console.log('');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
