export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'batches:get', { windowMs: 60_000, max: 120 });
    if (rateLimitResponse) return rateLimitResponse;

    const batches = await prisma.uploadBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json({ batches });
  } catch (e: any) {
    console.error('Batches error:', e);
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
