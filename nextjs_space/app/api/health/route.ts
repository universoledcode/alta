export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      service: 'alta-dashboard',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok'
      },
      uptimeSeconds: Math.floor(process.uptime()),
      responseMs: Date.now() - startedAt
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'alta-dashboard',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'error'
        },
        error: error?.message ?? 'database check failed',
        uptimeSeconds: Math.floor(process.uptime()),
        responseMs: Date.now() - startedAt
      },
      { status: 503 }
    );
  }
}
