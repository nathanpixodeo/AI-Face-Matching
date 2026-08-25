import fp from 'fastify-plugin';
import { resolveLocale, translate, type Locale, type TranslationKey, type TranslationValues } from '../i18n/messages';

declare module 'fastify' {
  interface FastifyRequest {
    locale: Locale;
    t: (key: TranslationKey, values?: TranslationValues) => string;
  }
}

export default fp(async (app) => {
  app.decorateRequest('locale', 'en');
  app.decorateRequest('t', () => '');

  app.addHook('onRequest', (request, reply, done) => {
    request.locale = resolveLocale(request.headers['x-locale'] ?? request.headers['accept-language']);
    request.t = (key, values) => translate(request.locale, key, values);
    reply.header('Content-Language', request.locale);
    done();
  });
});
