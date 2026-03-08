import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8080';

// Only these headers are forwarded to the backend.
// Prevents header spoofing (e.g. X-Forwarded-For, X-Real-IP spoofing fingerprint-based rate limits).
const ALLOWED_REQUEST_HEADERS = new Set([
    'authorization',
    'content-type',
    'content-length',
    'accept',
    'accept-language',
    'accept-encoding',
    'x-captcha-token',
    'x-client-fingerprint',
]);

// Hop-by-hop headers must not be forwarded from the backend response to the browser.
const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
    'connection',
    'keep-alive',
    'transfer-encoding',
    'te',
    'trailer',
    'upgrade',
    'proxy-authorization',
    'proxy-authenticate',
]);

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    // The catch-all is mounted at /api/[...path], so Next.js strips the /api/ prefix
    // from params. We must add it back when forwarding to the backend.
    const pathname = '/api/' + path.join('/');
    const search = req.nextUrl.search;
    const targetUrl = `${BACKEND_URL}${pathname}${search}`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
        if (ALLOWED_REQUEST_HEADERS.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && req.body != null;
    const fetchOptions: RequestInit & { duplex?: string } = {
        method: req.method,
        headers,
        body: hasBody ? req.body : undefined,
    };
    if (hasBody) {
        // Required by Node.js fetch when body is a ReadableStream
        fetchOptions.duplex = 'half';
    }

    const response = await fetch(targetUrl, fetchOptions);

    const resHeaders = new Headers();
    response.headers.forEach((value, key) => {
        if (!HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) {
            resHeaders.set(key, value);
        }
    });

    return new NextResponse(response.body, {
        status: response.status,
        headers: resHeaders,
    });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
