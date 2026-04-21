export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname.replace(/\/$/, '') || '/';

    const routes = {
      '/':                         '/index.html',
      '/about':                    '/about.html',
      '/services':                 '/services.html',
      '/projects':                 '/projects.html',
      '/contact':                  '/contact.html',
      '/quote':                    '/quote.html',
      '/careers':                  '/careers.html',
      '/privacy-policy':           '/privacy-policy.html',
      '/terms':                    '/terms.html',
      '/cookies':                  '/cookies.html',

      // SERVICES
      '/services/construction':    '/service-construction.html',
      '/services/fiber-telecom':   '/service-fiber.html',
      '/services/maintenance':     '/service-maintenance.html',
      '/services/security':        '/service-security.html',
      '/services/electrical':      '/service-electrical.html',
      '/services/consultancy':     '/service-consultancy.html',
    };

    // Rewrite if route exists
    if (routes[path]) {
      const rewrittenUrl = new URL(routes[path], url.origin);
      return env.ASSETS.fetch(new Request(rewrittenUrl, request));
    }

    // OPTIONAL: fallback to index.html (SPA-like behavior)
    if (!path.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    }

    return env.ASSETS.fetch(request);
  }
};
