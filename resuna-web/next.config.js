/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

// Backend API URL for connect-src (explicit allowlist, no wildcard https:)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Firebase/Google domains used by the app
const firebaseDomains = [
  'https://*.googleapis.com',
  'https://*.firebase.googleapis.com',
  'https://*.firebaseio.com',
  'wss://*.firebaseio.com',
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
].join(' ');

const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "img-src 'self' data: https://lh3.googleusercontent.com; " +
              (isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://apis.google.com https://accounts.google.com; "
                : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://apis.google.com https://accounts.google.com; ") +
              "script-src-elem 'self' 'unsafe-inline' https://challenges.cloudflare.com https://apis.google.com https://accounts.google.com; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              `connect-src 'self' ${apiUrl} ${firebaseDomains} https://challenges.cloudflare.com; ` +
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://www.googleapis.com https://challenges.cloudflare.com; " +
              "child-src 'self' https://*.firebaseapp.com https://accounts.google.com https://challenges.cloudflare.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

