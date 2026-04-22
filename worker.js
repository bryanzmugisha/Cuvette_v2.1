export default {
  async fetch(request, env) {
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

    // Resolve correct path
    const target = routes[path] || path;

    // ✅ IMPORTANT: use RELATIVE URL (not absolute)
    const newRequest = new Request(target, request);

    return env.ASSETS.fetch(newRequest);
  }
};
