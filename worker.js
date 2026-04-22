export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      let path = url.pathname.replace(/\/$/, '') || '/';

      const routes = {
        '/': '/index.html',
        '/about': '/about.html',
        '/services': '/services.html',
        '/projects': '/projects.html',
        '/contact': '/contact.html',
        '/quote': '/quote.html',
        '/careers': '/careers.html',
        '/privacy-policy': '/privacy-policy.html',
        '/terms': '/terms.html',
        '/cookies': '/cookies.html',

        // SERVICES
        '/services/construction': '/service-construction.html',
        '/services/fiber-telecom': '/service-fiber.html',
        '/services/maintenance': '/service-maintenance.html',
        '/services/security': '/service-security.html',
        '/services/electrical': '/service-electrical.html',
        '/services/consultancy': '/service-consultancy.html',
      };

      const target = routes[path] || path;

      // Serve assets safely
      return env.ASSETS.fetch(new Request(target, request));

    } catch (err) {
      return new Response("Worker Error: " + err.message, {
        status: 500
      });
    }
  }
};
