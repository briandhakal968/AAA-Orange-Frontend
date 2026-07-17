import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/api/countries`);
  const data = await res.json();
  return NextResponse.json(data);
}