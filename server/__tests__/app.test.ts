import request from 'supertest';
import app from '../app';

it('applies security headers', async () => {
  const res = await request(app).get('/');
  expect(res.headers['x-dns-prefetch-control']).toBe('off');
});

it('applies rate limiting headers', async () => {
  const res = await request(app).get('/');
  expect(res.headers['x-ratelimit-limit']).toBe('100');
});
