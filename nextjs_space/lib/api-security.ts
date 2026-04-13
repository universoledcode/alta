import { NextRequest, NextResponse } from 'next/server';

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function enforceRateLimit(
  request: NextRequest,
  endpointKey: string,
  options: RateLimitOptions
): NextResponse | null {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${endpointKey}:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.max) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
      { status: 429 }
    );
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return null;
}

export function parseDateParam(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateRangeDateParams(dateFrom: string, dateTo: string): string | null {
  if (dateFrom && !parseDateParam(dateFrom)) return 'dateFrom no tiene un formato de fecha válido';
  if (dateTo && !parseDateParam(dateTo)) return 'dateTo no tiene un formato de fecha válido';
  return null;
}

export function validateAndClampPagination(pageRaw: string, limitRaw: string): {
  page: number;
  limit: number;
  error?: string;
} {
  const page = Number.parseInt(pageRaw, 10);
  const limit = Number.parseInt(limitRaw, 10);

  if (!Number.isFinite(page) || page < 1) {
    return { page: 1, limit: 20, error: 'page debe ser un entero mayor o igual a 1' };
  }
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    return { page, limit: 20, error: 'limit debe ser un entero entre 1 y 100' };
  }

  return { page, limit };
}

export function ensureResetAllowed(request: NextRequest): NextResponse | null {
  const resetEnabled = process.env.ALLOW_DATA_RESET === 'true';
  if (!resetEnabled) {
    return NextResponse.json(
      { error: 'La eliminación global está deshabilitada en este entorno' },
      { status: 403 }
    );
  }

  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { error: 'ADMIN_API_TOKEN no está configurado en el servidor' },
      { status: 500 }
    );
  }

  const providedToken = request.headers.get('x-admin-token');
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: 'Token de administrador inválido' }, { status: 401 });
  }

  return null;
}
