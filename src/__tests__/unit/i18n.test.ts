import { resolveLocale, translate, translateLegacyError } from '../../i18n/messages';

describe('API locale negotiation and translation', () => {
  test('selects a supported language tag and falls back to English', () => {
    expect(resolveLocale('vi-VN,fr;q=0.8')).toBe('vi');
    expect(resolveLocale('fr-FR')).toBe('fr');
    expect(resolveLocale('de-DE')).toBe('en');
  });

  test('translates response messages and interpolated validation fields', () => {
    expect(translate('fr', 'response.loginSuccessful')).toBe('Connexion réussie');
    expect(translate('vi', 'error.invalidField', { field: 'email' })).toBe('Giá trị không hợp lệ cho email');
  });

  test('maps legacy service errors to the request locale without changing error codes', () => {
    expect(translateLegacyError('fr', 'Invalid email or password')).toBe('Adresse e-mail ou mot de passe invalide');
    expect(translateLegacyError('vi', 'unmapped error', 'FORBIDDEN')).toBe('Truy cập bị từ chối');
  });
});
