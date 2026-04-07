/** @type {import('next').NextConfig} */
function toBaseWithoutApi(urlString) {
  if (!urlString || typeof urlString !== 'string') return null;
  try {
    const url = new URL(urlString.trim());
    url.pathname = url.pathname.replace(/\/api\/?$/, '/');
    return url;
  } catch {
    return null;
  }
}

function buildRemotePatterns() {
  const candidates = [
    process.env.NEXT_PUBLIC_UPLOAD_BASE,
    process.env.NEXT_PUBLIC_API_URL,
    'http://13.206.82.189:5000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ];

  const seen = new Set();
  const patterns = [];

  for (const item of candidates) {
    const url = toBaseWithoutApi(item);
    if (!url) continue;

    const protocol = url.protocol.replace(':', '');
    const hostname = url.hostname;
    const port = url.port || undefined;
    const key = `${protocol}://${hostname}:${port || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    patterns.push({
      protocol,
      hostname,
      ...(port ? { port } : {}),
      pathname: '/uploads/**',
    });
  }

  return patterns;
}

const nextConfig = {
  images: {
    remotePatterns: buildRemotePatterns(),
  },
};

export default nextConfig;
