import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';

export interface ParsedOrder {
  guideNumber: string;
  platform: string;
  status: string;
  originalStatus: string;
  orderDate: Date | null;
  customerName: string | null;
  phone: string | null;
  city: string | null;
  department: string | null;
  carrier: string | null;
  totalAmount: number;
  profit: number;
  shippingCost: number;
  product: string | null;
  quantity: number;
  sku: string | null;
  seller: string | null;
  store: string | null;
  shipmentType: string | null;
  vigencia: string | null;
}

function parseAmount(val: any): number {
  if (val == null || val === '') return 0;
  let str = String(val).replace(/\$/g, '').replace(/\s/g, '').trim();
  if (str === '') return 0;
  // Handle comma as decimal separator (e.g. "25,0" -> "25.0")
  // If there's a comma but no period, treat comma as decimal
  if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseDateDMY(val: any): Date | null {
  if (!val) return null;
  const str = String(val).trim();
  // DD-MM-YYYY or DD/MM/YYYY
  const match = str.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  // Try YYYY-MM-DD HH:MM:SS
  const match2 = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match2) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }
  // Try as Excel serial number
  if (!isNaN(Number(val))) {
    const serial = Number(val);
    if (serial > 40000 && serial < 60000) {
      const d = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function normalizeDropiStatus(status: string): string {
  const s = (status ?? '').toUpperCase().trim();
  if (s === 'ENTREGADO') return 'ENTREGADO';
  if (s.includes('SOLUCION APROBADA')) return 'DEVOLUCION';
  if (s === 'NOVEDAD') return 'NOVEDAD';
  if (s === 'NOVEDAD SOLUCIONADA') return 'NOVEDAD SOLUCIONADA';
  if (s === 'EN REPARTO' || s.includes('EN DISTRIBUCIÓN') || s.includes('EN DISTRIBUCION')) return 'EN TRANSITO';
  if (s.includes('RETIRO EN AGENCIA') || s.includes('RUTA A CONCESION')) return 'EN TRANSITO';
  return s || 'DESCONOCIDO';
}

function normalizeEffiStatus(estado: string, vigencia: string): string {
  const v = (vigencia ?? '').trim().toLowerCase();
  if (v === 'anulada') return 'ANULADO';
  const e = (estado ?? '').toLowerCase().trim();
  if (e.includes('entregad')) return 'ENTREGADO';
  if (e.includes('tránsito') || e.includes('transito') || e.includes('embarcando') || e.includes('ingresando')) return 'EN TRANSITO';
  if (e.includes('generada')) return 'DESPACHADO';
  if (e.includes('pendiente')) return 'PENDIENTE';
  if (e.includes('devol')) return 'DEVOLUCION';
  return (estado ?? 'DESCONOCIDO').toUpperCase();
}

function extractEffiCarrier(raw: string): string {
  if (!raw) return 'DESCONOCIDO';
  const parts = raw.split('|');
  let name = (parts[0] ?? '').trim().toUpperCase();
  if (name.includes('SERVIENTREGA')) return 'SERVIENTREGA';
  if (name.includes('GINTRACOM')) return 'GINTRACOM';
  if (name.includes('LAAR') || name.includes('LAARCOURIER')) return 'LAARCOURIER';
  if (name.includes('VELOCES')) return 'VELOCES';
  return name || 'DESCONOCIDO';
}

function extractEffiCity(address: string): { city: string | null; department: string | null } {
  if (!address) return { city: null, department: null };
  const parts = address.split('/');
  if (parts.length >= 3) {
    return {
      department: parts[1]?.trim() ?? null,
      city: parts[2]?.trim() ?? null
    };
  }
  return { city: null, department: null };
}

function detectPlatform(headers: string[]): 'DROPI' | 'EFFI' | null {
  const upper = headers.map((h: string) => (h ?? '').toUpperCase().trim());
  if (upper.includes('ESTATUS') || upper.includes('NÚMERO GUIA') || upper.includes('NUMERO GUIA')) return 'DROPI';
  if (upper.includes('VIGENCIA') || upper.includes('ID GUÍA') || upper.includes('GUÍA TRANSPORTADORA')) return 'EFFI';
  // Fallback checks
  if (upper.some((h: string) => h.includes('DROPSHIPPER'))) return 'DROPI';
  if (upper.some((h: string) => h.includes('REMITENTE'))) return 'EFFI';
  return null;
}

function parseHtmlTable(buffer: Buffer): any[] {
  // Try UTF-8 first, fall back to Latin-1 for Effi files
  let html = buffer.toString('utf-8');
  if (html.includes('\ufffd') || html.includes('gu�a')) {
    html = buffer.toString('latin1');
  }
  const $ = cheerio.load(html);
  const rows: any[] = [];
  const headers: string[] = [];
  
  $('table tr').each((rowIndex: number, row: any) => {
    const cells: string[] = [];
    $(row).find('th, td').each((_: number, cell: any) => {
      cells.push($(cell).text()?.trim() ?? '');
    });
    if (rowIndex === 0) {
      headers.push(...cells);
    } else if (cells.length > 0) {
      const obj: any = {};
      cells.forEach((val: string, i: number) => {
        const key = headers[i] ?? `col_${i}`;
        obj[key] = val;
      });
      rows.push(obj);
    }
  });
  
  return rows;
}

export function parseExcelBuffer(buffer: Buffer, fileName: string): { platform: string; orders: ParsedOrder[] } {
  const bufStr = buffer.toString('utf-8', 0, 100).trim();
  const isHtml = bufStr.startsWith('<') || bufStr.includes('<table') || bufStr.includes('<html');
  
  let data: any[];
  
  if (isHtml) {
    data = parseHtmlTable(buffer);
  } else {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) throw new Error(`No se encontró hoja en el archivo: ${fileName}`);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Hoja vacía en: ${fileName}`);
    data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }
  
  if (!data || data.length === 0) throw new Error(`Sin datos en: ${fileName}`);

  const headers = Object.keys(data[0] ?? {});
  const platform = detectPlatform(headers);
  if (!platform) throw new Error(`No se pudo detectar la plataforma (Dropi/Effi) en: ${fileName}`);

  const orders: ParsedOrder[] = [];

  if (platform === 'DROPI') {
    for (const row of data) {
      const guideNumber = String(row['NÚMERO GUIA'] ?? row['NUMERO GUIA'] ?? '').trim();
      if (!guideNumber) continue;
      const originalStatus = String(row['ESTATUS'] ?? '').trim();
      orders.push({
        guideNumber,
        platform: 'DROPI',
        status: normalizeDropiStatus(originalStatus),
        originalStatus,
        orderDate: parseDateDMY(row['FECHA']),
        customerName: row['NOMBRE CLIENTE'] || null,
        phone: row['TELÉFONO'] ? String(row['TELÉFONO']) : null,
        city: row['CIUDAD DESTINO'] || null,
        department: row['DEPARTAMENTO DESTINO'] || null,
        carrier: (row['TRANSPORTADORA'] ?? '').toUpperCase().trim() || null,
        totalAmount: parseAmount(row['TOTAL DE LA ORDEN']),
        profit: parseAmount(row['GANANCIA']),
        shippingCost: parseAmount(row['PRECIO FLETE']),
        product: row['PRODUCTO'] || null,
        quantity: parseInt(String(row['CANTIDAD'] ?? '1'), 10) || 1,
        sku: row['SKU'] || null,
        seller: row['VENDEDOR'] || null,
        store: row['TIENDA'] || null,
        shipmentType: row['TIPO DE ENVIO'] || null,
        vigencia: null
      });
    }
  } else {
    for (const row of data) {
      const guideNumber = String(row['Guía transportadora'] ?? row['Guia transportadora'] ?? '').trim();
      if (!guideNumber) continue;
      const originalStatus = String(row['Estado'] ?? '').trim();
      const vigencia = String(row['Vigencia'] ?? '').trim();
      const { city, department } = extractEffiCity(row['Dirección destinatario'] ?? '');
      orders.push({
        guideNumber,
        platform: 'EFFI',
        status: normalizeEffiStatus(originalStatus, vigencia),
        originalStatus: vigencia === 'Anulada' ? `${originalStatus} (Anulada)` : originalStatus,
        orderDate: parseDateDMY(row['Fecha de creación transacción']),
        customerName: row['Destinatario'] || null,
        phone: row['Teléfonos destinatario'] ? String(row['Teléfonos destinatario']) : null,
        city,
        department,
        carrier: extractEffiCarrier(row['Transportadora'] ?? ''),
        totalAmount: parseAmount(row['Precio neto total']),
        profit: 0,
        shippingCost: 0,
        product: row['Descripción en la venta'] || row['Descripción original artículo'] || null,
        quantity: parseInt(String(row['Cantidad'] ?? '1'), 10) || 1,
        sku: row['Referencia'] || null,
        seller: row['Remitente'] || null,
        store: null,
        shipmentType: 'CON RECAUDO',
        vigencia
      });
    }
  }

  return { platform, orders };
}
