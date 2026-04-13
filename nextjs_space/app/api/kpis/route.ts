export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit, parseDateParam, validateRangeDateParams } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'kpis:get', { windowMs: 60_000, max: 120 });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';
    const carrier = searchParams.get('carrier') ?? '';

    const dateError = validateRangeDateParams(dateFrom, dateTo);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    const where: any = {};
    if (platform && platform !== 'ALL') where.platform = platform;
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

    // Get all orders matching filters
    const orders = await prisma.order.findMany({
      where,
      select: {
        platform: true,
        status: true,
        totalAmount: true,
        profit: true,
        shippingCost: true,
        carrier: true,
        shipmentType: true,
        orderDate: true,
        city: true
      }
    });

    // Active orders (non-anulado)
    const activeOrders = orders.filter((o: any) => o?.status !== 'ANULADO');
    const totalDespachadas = activeOrders.length;

    // Devoluciones
    const devolucionesDropi = orders.filter((o: any) => o?.platform === 'DROPI' && o?.status === 'DEVOLUCION').length;
    const devolucionesEffi = orders.filter((o: any) => o?.platform === 'EFFI' && o?.status === 'ANULADO').length;
    const devolucionesTotalRecibidas = devolucionesDropi + devolucionesEffi;

    // Devoluciones pendientes = orders with NOVEDAD status (potential returns)
    const devolucionesPendientes = orders.filter((o: any) =>
      o?.status === 'NOVEDAD' || o?.status === 'NOVEDAD SOLUCIONADA'
    ).length;

    // Entregados
    const entregados = orders.filter((o: any) => o?.status === 'ENTREGADO');
    const totalEntregados = entregados.length;

    // Entregados sin pagar = delivered with SIN RECAUDO
    const entregadosSinPagar = entregados.filter((o: any) =>
      o?.shipmentType?.toUpperCase()?.includes('SIN RECAUDO')
    ).length;

    // Totals
    const totalVentas = activeOrders.reduce((sum: number, o: any) => sum + (o?.totalAmount ?? 0), 0);
    const totalGanancia = activeOrders.reduce((sum: number, o: any) => sum + (o?.profit ?? 0), 0);
    const totalFlete = activeOrders.reduce((sum: number, o: any) => sum + (o?.shippingCost ?? 0), 0);

    // Wallet estimates
    const walletEntregados = entregados.reduce((sum: number, o: any) => sum + (o?.profit ?? 0), 0);
    const ventasEntregadas = entregados.reduce((sum: number, o: any) => sum + (o?.totalAmount ?? 0), 0);

    // Tasas
    const tasaDevolucion = totalDespachadas > 0 ? ((devolucionesTotalRecibidas / totalDespachadas) * 100) : 0;
    const tasaEntrega = totalDespachadas > 0 ? ((totalEntregados / totalDespachadas) * 100) : 0;

    // Charts data
    // Orders by status
    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      const s = o?.status ?? 'DESCONOCIDO';
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }

    // By platform
    const platformCounts: Record<string, number> = {};
    for (const o of activeOrders) {
      const p = o?.platform ?? 'DESCONOCIDO';
      platformCounts[p] = (platformCounts[p] ?? 0) + 1;
    }

    // By carrier (deliveries)
    const carrierDeliveries: Record<string, number> = {};
    const carrierReturns: Record<string, number> = {};
    for (const o of orders) {
      const c = o?.carrier ?? 'OTRO';
      if (o?.status === 'ENTREGADO') {
        carrierDeliveries[c] = (carrierDeliveries[c] ?? 0) + 1;
      }
      if (o?.status === 'DEVOLUCION' || o?.status === 'ANULADO') {
        carrierReturns[c] = (carrierReturns[c] ?? 0) + 1;
      }
    }

    // Sales by day
    const salesByDay: Record<string, { total: number; count: number }> = {};
    for (const o of activeOrders) {
      if (o?.orderDate) {
        const day = new Date(o.orderDate).toISOString().split('T')[0] ?? '';
        if (day) {
          if (!salesByDay[day]) salesByDay[day] = { total: 0, count: 0 };
          salesByDay[day].total += o?.totalAmount ?? 0;
          salesByDay[day].count += 1;
        }
      }
    }
    const salesByDayArray = Object.entries(salesByDay)
      .map(([date, data]: [string, any]) => ({ date, total: data?.total ?? 0, count: data?.count ?? 0 }))
      .sort((a: any, b: any) => (a?.date ?? '').localeCompare(b?.date ?? ''));

    // Filters options
    const statuses = [...new Set(orders.map((o: any) => o?.status).filter(Boolean))];
    const carriers = [...new Set(orders.map((o: any) => o?.carrier).filter(Boolean))];

    return NextResponse.json({
      kpis: {
        totalDespachadas,
        devolucionesDropi,
        devolucionesEffi,
        devolucionesTotalRecibidas,
        devolucionesPendientes,
        totalEntregados,
        entregadosSinPagar,
        totalVentas,
        totalGanancia,
        totalFlete,
        walletEntregados,
        ventasEntregadas,
        tasaDevolucion,
        tasaEntrega
      },
      charts: {
        statusCounts,
        platformCounts,
        carrierDeliveries,
        carrierReturns,
        salesByDay: salesByDayArray
      },
      filters: {
        statuses,
        carriers
      }
    });
  } catch (e: any) {
    console.error('KPI error:', e);
    return NextResponse.json({ error: e?.message ?? 'Error al calcular KPIs' }, { status: 500 });
  }
}
