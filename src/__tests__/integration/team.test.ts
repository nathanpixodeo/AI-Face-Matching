import { buildServer } from '../../server';
import { seedFreePlan } from '../helpers/fixtures';
import { FastifyInstance } from 'fastify';

process.env.JWT_SECRET = 'test-secret-minimum-16-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.CORS_ORIGINS = '*';
process.env.ML_SERVICE_URL = 'http://localhost:8000';

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildServer();
});

afterAll(async () => {
  await app.close();
});

async function registerAndGetToken() {
  await seedFreePlan();
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      firstName: 'Team',
      lastName: 'Owner',
      email: `owner-${Date.now()}@test.com`,
      password: 'password123',
      teamName: 'My Team',
    },
  });
  return JSON.parse(res.payload).data.token;
}

describe('Team integration', () => {
  beforeEach(async () => {
    token = await registerAndGetToken();
  });

  test('GET /api/team returns team info', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/team',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data.name).toBe('My Team');
    expect(body.data.plan.name).toBe('free');
    expect(body.data.usage).toBeDefined();
  });

  test('PUT /api/team updates name', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/team',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Updated Team' },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).data.name).toBe('Updated Team');
  });

  test('GET /api/team/members lists members', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/team/members',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].role).toBe('owner');
  });
});
