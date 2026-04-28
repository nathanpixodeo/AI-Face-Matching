import { buildServer } from '../../server';
import { seedFreePlan } from '../helpers/fixtures';
import { FastifyInstance } from 'fastify';

process.env.JWT_SECRET = 'test-secret-minimum-16-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.CORS_ORIGINS = '*';
process.env.ML_SERVICE_URL = 'http://localhost:8000';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildServer();
});

afterAll(async () => {
  await app.close();
});

describe('Auth integration', () => {
  beforeEach(async () => {
    await seedFreePlan();
  });

  test('POST /api/auth/register creates user and returns token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123',
        teamName: 'Test Team',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.email).toBe('john@test.com');
    expect(body.data.team.plan).toBe('free');
  });

  test('POST /api/auth/login with valid credentials', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
        password: 'password123',
        teamName: 'Jane Team',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'jane@test.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  test('POST /api/auth/login rejects wrong password', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@test.com',
        password: 'password123',
        teamName: 'Bob Team',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'bob@test.com', password: 'wrongpassword' },
    });

    expect(res.statusCode).toBe(401);
  });

  test('protected route rejects without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/team',
    });

    expect(res.statusCode).toBe(401);
  });

  test('protected route accepts valid token', async () => {
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        firstName: 'Auth',
        lastName: 'Test',
        email: 'auth@test.com',
        password: 'password123',
        teamName: 'Auth Team',
      },
    });

    const { token } = JSON.parse(regRes.payload).data;

    const res = await app.inject({
      method: 'GET',
      url: '/api/team',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data.name).toBe('Auth Team');
  });
});
