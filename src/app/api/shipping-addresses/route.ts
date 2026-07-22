import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function forward(request: Request, method: string, path: string) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('Authorization') || '',
      Accept: 'application/json',
    },
    body: method === 'GET' || method === 'DELETE' ? undefined : await request.text(),
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function GET(request: Request) {
  return forward(request, 'GET', '/api/shipping-addresses');
}

export async function POST(request: Request) {
  return forward(request, 'POST', '/api/shipping-addresses');
}
