import { successResponse, errorResponse } from '../../lib/response';

describe('Response builder', () => {
  test('successResponse returns correct shape', () => {
    const result = successResponse({ id: '1' }, 'Created');
    expect(result).toEqual({
      success: true,
      data: { id: '1' },
      message: 'Created',
    });
  });

  test('successResponse uses default message', () => {
    const result = successResponse([1, 2, 3]);
    expect(result.message).toBe('OK');
    expect(result.success).toBe(true);
  });

  test('errorResponse returns null data', () => {
    const result = errorResponse('Something failed');
    expect(result).toEqual({
      success: false,
      data: null,
      message: 'Something failed',
    });
  });
});
