import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function runEffect(path, context) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const start = source.indexOf('  useEffect(() => {');
  const end = source.indexOf('  }, []);', start) + '  }, []);'.length;
  assert.ok(start >= 0 && end > start);
  vm.runInNewContext(source.slice(start, end), {
    useEffect: (callback) => callback(),
    ...context,
  });
}

test('expired passcode leaves the persisted Supabase session intact', () => {
  const storage = new Map([
    ['isAsakanAuth', 'true'],
    ['asakanLoginTime', String(Date.now() - 25 * 60 * 60 * 1000)],
    ['sb-project-auth-token', 'persisted-session'],
  ]);
  let authenticated;
  runEffect('../src/App.jsx', {
    localStorage: {
      getItem: (key) => storage.get(key),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
    },
    setIsAuthenticated: (value) => { authenticated = value; },
    setLoading() {},
  });
  assert.equal(authenticated, false);
  assert.equal(storage.get('sb-project-auth-token'), 'persisted-session');
  assert.equal(storage.has('isAsakanAuth'), false);
  assert.equal(storage.has('asakanLoginTime'), false);
});

async function profileEvent(fetchRole) {
  let listener;
  let signOuts = 0;
  const jobs = [];
  runEffect('../src/contexts/AuthContext.jsx', {
    supabase: { auth: {
      onAuthStateChange: (callback) => {
        listener = callback;
        return { data: { subscription: { unsubscribe() {} } } };
      },
      signOut: async () => { signOuts += 1; },
    } },
    setTimeout: (callback, delay) => { if (delay === 0) jobs.push(callback); return 1; },
    clearTimeout() {},
    fetchRole,
    setUser() {}, setRole() {}, setLoading() {}, setAuthError() {},
    NO_ACCESS: 'no access',
  });
  listener('SIGNED_IN', { user: { id: 'staff-id' } });
  for (const job of jobs) await job();
  return signOuts;
}

test('a transient profile network failure does not sign out the user', async () => {
  assert.equal(await profileEvent(async () => { throw new Error('Failed to fetch'); }), 0);
});

test('a confirmed missing profile still denies access and signs out', async () => {
  assert.equal(await profileEvent(async () => null), 1);
});
