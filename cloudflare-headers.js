// Cloudflare Worker script to set proper cache headers
// Deploy this as a Cloudflare Worker in front of your GitHub Pages site
// 
// Setup:
// 1. Add your domain to Cloudflare
// 2. Create a Worker route: *.pugdb.github.io/*
// 3. Paste this code into the Worker
// 4. Deploy

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Fetch from GitHub Pages
  const response = await fetch(request);
  
  // Clone response to modify headers
  const newResponse = new Response(response.body, response);
  
  // Set cache headers based on file type
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i)) {
    // Images: 1 year cache
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.pathname.match(/\.(css|js|woff|woff2|ttf|otf|eot)$/i)) {
    // Static assets: 1 year cache
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.pathname.match(/\/_astro\/.*\.(css|js)$/)) {
    // Astro assets: 1 year cache (content-hashed, so safe to cache long)
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.pathname.match(/\.(html|htm)$/i)) {
    // HTML: 1 hour cache, revalidate
    newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  } else {
    // Default: 1 day cache
    newResponse.headers.set('Cache-Control', 'public, max-age=86400');
  }
  
  return newResponse;
}
