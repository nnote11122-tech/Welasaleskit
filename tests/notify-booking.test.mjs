import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { transform } from 'esbuild';

const source = await readFile(new URL('../supabase/functions/notify-booking/index.ts', import.meta.url), 'utf8');
const { code } = await transform(source.replace(/^import .*;\r?\n/, ''), { loader: 'ts' });
const booking = {
  id: '00000000-0000-4000-8000-000000000001', status: 'approved',
  building: 'wela1', unit_no: '201', customer_name: 'Test Customer',
  customer_phone: '0000000000', offer_price: 1000000,
  snapshot_url: 'https://example.invalid/quotation.jpg',
};

function harness({ record = booking, telegramOK = true, telegramStatus = 502, description = '', secrets = true, authenticated = true } = {}) {
  let handler;
  const sent = [];
  const query = { select: () => query, eq: () => query, single: async () => ({ data: record }) };
  const createClient = () => ({
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'test' } : null } }) },
    from: () => query,
  });
  const deno = {
    serve: fn => { handler = fn; },
    env: { get: key => key.startsWith('TELEGRAM_') ? (secrets ? 'test-only' : undefined) : 'test-only' },
  };
  const fetchMock = async (url, options) => {
    sent.push({ url, body: JSON.parse(options.body) });
    return { ok: telegramOK, status: telegramOK ? 200 : telegramStatus, json: async () => ({ ok: telegramOK, description }) };
  };
  new Function('createClient', 'Deno', 'fetch', code)(createClient, deno, fetchMock);
  return { sent, run: () => handler(new Request('https://example.invalid', {
    method: 'POST', headers: { Authorization: 'Bearer test' },
    body: JSON.stringify({ booking_id: booking.id, customer: 'Forged browser value' }),
  })) };
}

test('sends saved customer details and quotation photo without approval controls', async () => {
  const h = harness();
  assert.equal((await h.run()).status, 200);
  assert.equal(h.sent.length, 1);
  const payload = h.sent[0].body;
  assert.equal(payload.photo, booking.snapshot_url);
  for (const value of ['Test Customer', '0000000000', '1,000,000']) assert.ok(payload.caption.includes(value));
  assert.ok(!payload.caption.includes('Forged browser value'));
  assert.equal(payload.reply_markup, undefined);
});

test('reports failed Telegram delivery instead of claiming success', async () => {
  const h = harness({ telegramOK: false });
  assert.equal((await h.run()).status, 502);
});

test('identifies token, chat, and permission failures without exposing secrets', async () => {
  for (const [status, description, reason] of [
    [401, 'Unauthorized', 'invalid_token'],
    [400, 'Bad Request: chat not found', 'chat_not_found'],
    [403, 'Forbidden: bot was kicked', 'bot_forbidden'],
    [429, 'Too Many Requests', 'rate_limited'],
  ]) {
    const h = harness({ telegramOK: false, telegramStatus: status, description });
    const response = await h.run();
    const body = await response.json();
    assert.equal(response.status, 502);
    assert.equal(body.reason, reason);
    assert.equal(JSON.stringify(body).includes('test-only'), false);
  }
});

test('rejects anonymous callers, pending bookings, and missing secrets without sending', async () => {
  for (const [options, status] of [
    [{ authenticated: false }, 401],
    [{ record: { ...booking, status: 'pending' } }, 409],
    [{ secrets: false }, 503],
  ]) {
    const h = harness(options);
    assert.equal((await h.run()).status, status);
    assert.equal(h.sent.length, 0);
  }
});
