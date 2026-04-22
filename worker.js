export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    const routes = {
      '/about':                    '/about.html',
      '/services':                 '/services.html',
      '/projects':                 '/projects.html',
      '/contact':                  '/contact.html',
      '/quote':                    '/quote.html',
      '/careers':                  '/careers.html',
      '/privacy-policy':           '/privacy-policy.html',
      '/terms':                    '/terms.html',
      '/cookies':                  '/cookies.html',
      '/coming-soon':              '/coming-soon.html',
      '/services/construction':    '/service-construction.html',
      '/services/fiber-telecom':   '/service-fiber.html',
      '/services/maintenance':     '/service-maintenance.html',
      '/services/security':        '/service-security.html',
      '/services/electrical':      '/service-electrical.html',
      '/services/consultancy':     '/service-consultancy.html',
    };

    // Only rewrite — never redirect. Pass a new internal request directly.
    if (routes[path]) {
      const rewritten = new Request(
        new URL(routes[path], url.origin).toString(),
        request
      );
      return env.ASSETS.fetch(rewritten);
    }

    return env.ASSETS.fetch(request);
  }
};