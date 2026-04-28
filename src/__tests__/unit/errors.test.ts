import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  PlanLimitError,
} from '../../lib/errors';

describe('Error classes', () => {
  test('AppError sets statusCode and code', () => {
    const err = new AppError('fail', 502, 'BAD_GW');
    expect(err.message).toBe('fail');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('BAD_GW');
    expect(err.name).toBe('AppError');
  });

  test('NotFoundError is 404', () => {
    const err = new NotFoundError('User', '123');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('123');
    expect(err.code).toBe('NOT_FOUND');
  });

  test('NotFoundError without id', () => {
    const err = new NotFoundError('Plan');
    expect(err.message).toBe('Plan not found');
  });

  test('ValidationError is 400', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
  });

  test('UnauthorizedError is 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  test('ForbiddenError is 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  test('ConflictError is 409', () => {
    const err = new ConflictError('duplicate');
    expect(err.statusCode).toBe(409);
  });

  test('PlanLimitError includes limit info', () => {
    const err = new PlanLimitError('identities', 50);
    expect(err.statusCode).toBe(403);
    expect(err.message).toContain('50');
    expect(err.message).toContain('identities');
    expect(err.code).toBe('PLAN_LIMIT_EXCEEDED');
  });
});
