export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseExcelBuffer } from '@/lib/excel-parser';
import { enforceRateLimit } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'upload:post', { windowMs: 60_000, max: 20 });
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }
    if (files.length > 20) {
      return NextResponse.json({ error: 'Máximo 20 archivos por solicitud' }, { status: 400 });
    }

    const results: Array<{ fileName: string; platform: string; records: number; duplicates: number; errors?: string }> = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      const fileName = file.name;
      try {
        const lowerName = fileName.toLowerCase();
        const isValidExtension = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
        if (!isValidExtension) {
          throw new Error(`Formato no permitido para ${fileName}. Solo .xlsx y .xls`);
        }
        const maxFileBytes = 15 * 1024 * 1024;
        if (file.size > maxFileBytes) {
          throw new Error(`El archivo ${fileName} excede 15MB`);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { platform, orders } = parseExcelBuffer(buffer, fileName);

        // Create upload batch
        const batch = await prisma.uploadBatch.create({
          data: {
            fileName,
            platform,
            records: orders.length
          }
        });

        let inserted = 0;
        let duplicates = 0;

        // Upsert orders (deduplicate by guideNumber + platform)
        for (const order of orders) {
          try {
            await prisma.order.upsert({
              where: {
                guideNumber_platform: {
                  guideNumber: order.guideNumber,
                  platform: order.platform
                }
              },
              update: {
                status: order.status,
                originalStatus: order.originalStatus,
                orderDate: order.orderDate,
                customerName: order.customerName,
                phone: order.phone,
                city: order.city,
                department: order.department,
                carrier: order.carrier,
                totalAmount: order.totalAmount,
                profit: order.profit,
                shippingCost: order.shippingCost,
                product: order.product,
                quantity: order.quantity,
                sku: order.sku,
                seller: order.seller,
                store: order.store,
                shipmentType: order.shipmentType,
                vigencia: order.vigencia,
                uploadBatchId: batch.id
              },
              create: {
                guideNumber: order.guideNumber,
                platform: order.platform,
                status: order.status,
                originalStatus: order.originalStatus,
                orderDate: order.orderDate,
                customerName: order.customerName,
                phone: order.phone,
                city: order.city,
                department: order.department,
                carrier: order.carrier,
                totalAmount: order.totalAmount,
                profit: order.profit,
                shippingCost: order.shippingCost,
                product: order.product,
                quantity: order.quantity,
                sku: order.sku,
                seller: order.seller,
                store: order.store,
                shipmentType: order.shipmentType,
                vigencia: order.vigencia,
                uploadBatchId: batch.id
              }
            });
            inserted++;
          } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
              duplicates++;
            } else {
              throw e;
            }
          }
        }

        results.push({ fileName, platform, records: inserted, duplicates });
      } catch (e: any) {
        results.push({ fileName, platform: 'UNKNOWN', records: 0, duplicates: 0, errors: e?.message ?? 'Error desconocido' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: e?.message ?? 'Error al procesar archivos' }, { status: 500 });
  }
}
