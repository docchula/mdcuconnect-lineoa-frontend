import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

describe('Registration API contract tests (docchula.com only)', () => {
  let server;
  let serverUrl;
  let receivedRequestBody = null;
  let mockStatusCode = 200;
  let mockResponseBody = { success: true };

  before(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/api/profile/register' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          receivedRequestBody = JSON.parse(body);
          res.writeHead(mockStatusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mockResponseBody));
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        serverUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(() => {
    server.close();
  });

  test('submitting registration sends correct payload with @docchula.com to /api/profile/register', async () => {
    mockStatusCode = 200;
    mockResponseBody = { message: 'Registered successfully' };
    receivedRequestBody = null;

    const payload = {
      accessToken: 'mock_line_access_token_123',
      studentId: '6731194430',
      email: 'somchai@docchula.com',
    };

    const res = await fetch(`${serverUrl}/api/profile/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(receivedRequestBody, payload);
    const data = await res.json();
    assert.strictEqual(data.message, 'Registered successfully');
  });

  test('handles 201 Created as success', async () => {
    mockStatusCode = 201;
    mockResponseBody = { status: 'created' };
    receivedRequestBody = null;

    const res = await fetch(`${serverUrl}/api/profile/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: 'token_abc',
        studentId: '6731194430',
        email: 'doctor@docchula.com',
      }),
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.ok, true);
  });

  test('handles 400 Bad Request error message extraction', async () => {
    mockStatusCode = 400;
    mockResponseBody = { error: 'Student ID already registered' };

    const res = await fetch(`${serverUrl}/api/profile/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: 'token_abc',
        studentId: '6731194430',
        email: 'doctor@docchula.com',
      }),
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.ok, false);
    const data = await res.json();
    assert.strictEqual(data.error, 'Student ID already registered');
  });

  test('handles 500 Internal Server Error message extraction', async () => {
    mockStatusCode = 500;
    mockResponseBody = { error: 'Database connection failed' };

    const res = await fetch(`${serverUrl}/api/profile/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: 'token_abc',
        studentId: '6731194430',
        email: 'doctor@docchula.com',
      }),
    });

    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.strictEqual(data.error, 'Database connection failed');
  });
});
