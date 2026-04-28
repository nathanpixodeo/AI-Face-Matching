import { register, login } from '../../modules/auth/auth.service';
import { User } from '../../models/user.model';
import { seedFreePlan } from '../helpers/fixtures';

// Set env vars before importing service
process.env.JWT_SECRET = 'test-secret-minimum-16-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.ML_SERVICE_URL = 'http://localhost:8000';

describe('Auth service', () => {
  beforeEach(async () => {
    await seedFreePlan();
  });

  describe('register', () => {
    test('creates user, team, and returns token', async () => {
      const result = await register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        teamName: 'My Team',
      });

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.role).toBe('owner');
      expect(result.team.name).toBe('My Team');
      expect(result.team.plan).toBe('free');
    });

    test('rejects duplicate email', async () => {
      await register({
        firstName: 'A',
        lastName: 'B',
        email: 'dup@example.com',
        password: 'password123',
        teamName: 'Team1',
      });

      await expect(
        register({
          firstName: 'C',
          lastName: 'D',
          email: 'dup@example.com',
          password: 'password456',
          teamName: 'Team2',
        }),
      ).rejects.toThrow('Email already registered');
    });

    test('hashes password', async () => {
      await register({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'mypassword',
        teamName: 'Team',
      });

      const user = await User.findOne({ email: 'jane@example.com' }).select('+password');
      expect(user!.password).not.toBe('mypassword');
      expect(user!.password).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await register({
        firstName: 'Login',
        lastName: 'Test',
        email: 'login@example.com',
        password: 'password123',
        teamName: 'LoginTeam',
      });
    });

    test('returns token on valid credentials', async () => {
      const result = await login({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
    });

    test('rejects wrong password', async () => {
      await expect(
        login({ email: 'login@example.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid email or password');
    });

    test('rejects non-existent email', async () => {
      await expect(
        login({ email: 'nobody@example.com', password: 'password123' }),
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
