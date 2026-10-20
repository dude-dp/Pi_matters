import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { runAutonomousMining } from '../src/mining';

describe('Hono API & Worker Autonomous Mining', () => {
  it('mines a batch of Pi digits autonomously', async () => {
    const mockEnv = {};
    const result = await runAutonomousMining(mockEnv, 50);

    expect(result.batchSize).toBe(50);
    expect(result.cursorBefore).toBe(0);
    expect(result.cursorAfter).toBe(50);
    expect(result.hexSnippet.startsWith('243F6A8885')).toBe(true);
  });

  it('serves GET /api/stats', async () => {
    const req = new Request('http://localhost/api/stats');
    const res = await worker.fetch(req, {}, {} as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.algorithm).toContain('Bailey–Borwein–Plouffe');
    expect(typeof data.cursor).toBe('number');
  });

  it('serves GET /api/inspect/0', async () => {
    const req = new Request('http://localhost/api/inspect/0?count=32');
    const res = await worker.fetch(req, {}, {} as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.position).toBe(0);
    expect(data.hex.startsWith('243F6A88')).toBe(true);
    expect(data.binary.length).toBe(32 * 4); // 4 bits per hex digit
    expect(typeof data.ascii).toBe('string');
  });

  it('serves POST /api/mine', async () => {
    const req = new Request('http://localhost/api/mine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchSize: 20 })
    });
    const res = await worker.fetch(req, {}, {} as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.batchSize).toBe(20);
  });

  it('serves GET /api/lease-job with atomic cursor advance', async () => {
    const req1 = new Request('http://localhost/api/lease-job?size=250');
    const res1 = await worker.fetch(req1, {}, {} as any);
    expect(res1.status).toBe(200);
    const data1 = await res1.json() as any;
    expect(typeof data1.startDigit).toBe('number');
    expect(data1.blockSize).toBe(250);
    expect(data1.nextCursor).toBe(data1.startDigit + 250);

    const req2 = new Request('http://localhost/api/lease-job?size=250');
    const res2 = await worker.fetch(req2, {}, {} as any);
    const data2 = await res2.json() as any;
    expect(data2.startDigit).toBe(data1.nextCursor);
  });

  it('rejects POST /api/contribute with invalid cryptographic proof', async () => {
    const req = new Request('http://localhost/api/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDigit: 0,
        count: 100,
        hexSnippet: 'DEADBEEF00112233', // Wrong hex for Pi at digit 0 (should be 243F6A88...)
        discoveries: []
      })
    });
    const res = await worker.fetch(req, {}, {} as any);
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.success).toBe(false);
    expect(data.error).toContain('Cryptographic proof-of-work verification failed');
  });

  it('accepts POST /api/contribute with authentic cryptographic proof and valid discoveries', async () => {
    // Digit 0 of Pi is 243F6A88
    const req = new Request('http://localhost/api/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDigit: 0,
        count: 100,
        hexSnippet: '243F6A8885A308D3',
        discoveries: [
          {
            word: 'LOVE',
            digitStart: 10,
            digitEnd: 15,
            hexSnippet: '243F6A',
            binarySnippet: '001001',
            decodedAscii: 'LOVE'
          }
        ]
      })
    });
    const res = await worker.fetch(req, {}, {} as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.acceptedDiscoveries).toBe(1);
    expect(data.startDigit).toBe(0);
  });
});

