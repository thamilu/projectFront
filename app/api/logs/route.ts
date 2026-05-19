import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/core/telemetry/logger';

export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();
    if (entry && typeof entry === 'object' && entry.level && entry.message) {
      logger.logEntry(entry);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid log entry' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
