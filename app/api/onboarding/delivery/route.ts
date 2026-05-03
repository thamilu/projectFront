import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082/api/v1';

    const { safeFetch } = await import('@/lib/utils/fetch-utils');

    try {
      const data = await safeFetch(`${backendUrl}/delivery/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
      const status = err?.status || 502;
      const message = err?.message || 'Failed to submit application';
      return NextResponse.json({ message }, { status });
    }
  } catch (error) {
    console.error('Delivery onboarding error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
