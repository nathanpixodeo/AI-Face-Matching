import jwt from 'jsonwebtoken';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { createTestUser, JWT_SECRET } from '../helpers/fixtures';
import { User } from '../../models/user.model';

process.env.JWT_SECRET = JWT_SECRET;
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

describe('Platform integration', () => {
  test('requires superadmin access and enforces suspended account and team status', async () => {
    const { user, team, token } = await createTestUser({ isSuperadmin: true });
    const standardToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        teamId: team._id.toString(),
        role: user.role,
        isSuperadmin: false,
      },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    const forbidden = await app.inject({
      method: 'GET',
      url: '/api/platform/overview',
      headers: { authorization: `Bearer ${standardToken}` },
    });
    expect(forbidden.statusCode).toBe(403);

    const overview = await app.inject({
      method: 'GET',
      url: '/api/platform/overview',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(overview.statusCode).toBe(200);
    expect(JSON.parse(overview.payload).data.teams.total).toBe(1);

    const suspendedTeam = await app.inject({
      method: 'PUT',
      url: `/api/platform/teams/${team._id.toString()}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'suspended' },
    });
    expect(suspendedTeam.statusCode).toBe(200);
    expect(JSON.parse(suspendedTeam.payload).data.status).toBe('suspended');

    const blockedTeamRoute = await app.inject({
      method: 'GET',
      url: '/api/team',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(blockedTeamRoute.statusCode).toBe(403);

    const restoredTeam = await app.inject({
      method: 'PUT',
      url: `/api/platform/teams/${team._id.toString()}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'active', planName: 'pro' },
    });
    expect(restoredTeam.statusCode).toBe(200);
    expect(JSON.parse(restoredTeam.payload).data).toMatchObject({ status: 'active', planName: 'pro' });

    const member = await User.create({
      firstName: 'Suspended',
      lastName: 'Member',
      email: 'suspended-member@example.test',
      password: 'hashed-password',
      teamId: team._id,
      role: 'member',
    });
    const memberToken = jwt.sign(
      {
        userId: member._id.toString(),
        email: member.email,
        teamId: team._id.toString(),
        role: member.role,
        isSuperadmin: false,
      },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    const suspendedUser = await app.inject({
      method: 'PUT',
      url: `/api/platform/users/${member._id.toString()}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'suspended' },
    });
    expect(suspendedUser.statusCode).toBe(200);
    expect(JSON.parse(suspendedUser.payload).data.status).toBe('suspended');

    const blockedUserRoute = await app.inject({
      method: 'GET',
      url: '/api/team',
      headers: { authorization: `Bearer ${memberToken}` },
    });
    expect(blockedUserRoute.statusCode).toBe(403);
  });
});
