import { describe, it, expect } from 'vitest';
import worker, { runAutonomousMining } from '../src/index';

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
});
