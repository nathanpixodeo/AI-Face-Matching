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
      firstName: 'Id',
      lastName: 'Test',
      email: `id-${Date.now()}@test.com`,
      password: 'password123',
      teamName: 'Id Team',
    },
  });
  return JSON.parse(res.payload).data.token;
}

describe('Identity integration', () => {
  beforeEach(async () => {
    token = await registerAndGetToken();
  });

  test('full CRUD flow', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/identities',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Alice', description: 'Test person' },
    });
    expect(createRes.statusCode).toBe(201);
    const { id } = JSON.parse(createRes.payload).data;

    // List
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/identities',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(JSON.parse(listRes.payload).data.total).toBe(1);

    // Get
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/identities/${id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(JSON.parse(getRes.payload).data.name).toBe('Alice');

    // Update
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/identities/${id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Alice Updated' },
    });
    expect(JSON.parse(updateRes.payload).data.name).toBe('Alice Updated');

    // Delete
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/identities/${id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(deleteRes.statusCode).toBe(200);

    // Verify deleted
    const getAfter = await app.inject({
      method: 'GET',
      url: `/api/identities/${id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getAfter.statusCode).toBe(404);
  });

  test('search filters by name', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/identities',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Alice' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/identities',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Bob' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/identities?search=Ali',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(JSON.parse(res.payload).data.total).toBe(1);
  });
});
