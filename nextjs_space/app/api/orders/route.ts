export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  enforceRateLimit,
  ensureResetAllowed,
  parseDateParam,
  validateAndClampPagination,
  validateRangeDateParams
} from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'orders:get', { windowMs: 60_000, max: 120 });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const pagination = validateAndClampPagination(
      searchParams.get('page') ?? '1',
      searchParams.get('limit') ?? '20'
    );
    if (pagination.error) {
      return NextResponse.json({ error: pagination.error }, { status: 400 });
    }
    const page = pagination.page;
    const limit = pagination.limit;
    const platform = searchParams.get('platform') ?? '';
    const status = searchParams.get('status') ?? '';
    const carrier = searchParams.get('carrier') ?? '';
    const search = searchParams.get('search') ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';
    const dateError = validateRangeDateParams(dateFrom, dateTo);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    const sortBy = searchParams.get('sortBy') ?? 'orderDate';
    const sortDir = searchParams.get('sortDir') ?? 'desc';

    const where: any = {};

    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (carrier && carrier !== 'ALL') {
      where.carrier = carrier;
    }
    if (search) {
      where.OR = [
        { guideNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { product: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = parseDateParam(dateFrom);
      if (dateTo) {
        const end = parseDateParam(dateTo) as Date;
        end.setHours(23, 59, 59, 999);
        where.orderDate.lte = end;
      }
    }

    const validSortFields = ['orderDate', 'totalAmount', 'status', 'platform', 'carrier', 'guideNumber', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'orderDate';
    const orderByDir = sortDir === 'asc' ? 'asc' : 'desc';

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          guideNumber: true,
          platform: true,
          status: true,
          originalStatus: true,
          orderDate: true,
          customerName: true,
          city: true,
          carrier: true,
          totalAmount: true,
          profit: true,
          product: true,
          shipmentType: true
        }
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e: any) {
    console.error('Orders error:', e);
    return NextResponse.json({ error: e?.message ?? 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'orders:delete', { windowMs: 60_000, max: 20 });
    if (rateLimitResponse) return rateLimitResponse;

    const authResponse = ensureResetAllowed(request);
    if (authResponse) return authResponse;

    await prisma.order.deleteMany({});
    await prisma.uploadBatch.deleteMany({});
    return NextResponse.json({ success: true, message: 'Todos los datos fueron eliminados' });
  } catch (e: any) {
    console.error('Delete error:', e);
    return NextResponse.json({ error: e?.message ?? 'Error al eliminar datos' }, { status: 500 });
  }
}
