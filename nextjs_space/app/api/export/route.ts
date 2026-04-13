export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit, parseDateParam, validateRangeDateParams } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'export:get', { windowMs: 60_000, max: 60 });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') ?? '';
    const status = searchParams.get('status') ?? '';
    const carrier = searchParams.get('carrier') ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';
    const format = searchParams.get('format') ?? 'csv';

    const dateError = validateRangeDateParams(dateFrom, dateTo);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }
    if (format !== 'csv') {
      return NextResponse.json({ error: 'Formato no soportado. Usa format=csv' }, { status: 400 });
    }

    const where: any = {};
    if (platform && platform !== 'ALL') where.platform = platform;
    if (status && status !== 'ALL') where.status = status;
    if (carrier && carrier !== 'ALL') where.carrier = carrier;
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = parseDateParam(dateFrom);
      if (dateTo) {
        const end = parseDateParam(dateTo) as Date;
        end.setHours(23, 59, 59, 999);
        where.orderDate.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { orderDate: 'desc' }
    });

    const headers = ['Guía', 'Plataforma', 'Estado', 'Estado Original', 'Fecha', 'Cliente', 'Ciudad', 'Departamento', 'Transportadora', 'Monto', 'Ganancia', 'Flete', 'Producto', 'Cantidad', 'SKU', 'Tipo Envío'];

    const rows = (orders ?? []).map((o: any) => [
      o?.guideNumber ?? '',
      o?.platform ?? '',
      o?.status ?? '',
      o?.originalStatus ?? '',
      o?.orderDate ? new Date(o.orderDate).toLocaleDateString('es-EC') : '',
      o?.customerName ?? '',
      o?.city ?? '',
      o?.department ?? '',
      o?.carrier ?? '',
      o?.totalAmount?.toFixed?.(2) ?? '0',
      o?.profit?.toFixed?.(2) ?? '0',
      o?.shippingCost?.toFixed?.(2) ?? '0',
      o?.product ?? '',
      String(o?.quantity ?? 1),
      o?.sku ?? '',
      o?.shipmentType ?? ''
    ]);

    const csvContent = [headers.join(','), ...(rows ?? []).map((r: any[]) =>
      (r ?? []).map((cell: any) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="alta_pedidos_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (e: any) {
    console.error('Export error:', e);
    return NextResponse.json({ error: e?.message ?? 'Error al exportar' }, { status: 500 });
  }
}
