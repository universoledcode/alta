'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Table2,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';

interface Filters {
  platform: string;
  status: string;
  carrier: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface DataTableProps {
  filters: Filters;
}

export default function DataTable({ filters }: DataTableProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortDir, setSortDir] = useState('desc');
  const limit = 15;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir
      });
      if (filters?.platform && filters.platform !== 'ALL') params.set('platform', filters.platform);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters?.carrier && filters.carrier !== 'ALL') params.set('carrier', filters.carrier);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data?.orders ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch (e: any) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleSort = useCallback((col: string) => {
    setSortBy((prev: string) => {
      if (prev === col) {
        setSortDir((d: string) => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('desc');
      return col;
    });
  }, []);

  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (filters?.platform && filters.platform !== 'ALL') params.set('platform', filters.platform);
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.carrier && filters.carrier !== 'ALL') params.set('carrier', filters.carrier);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    params.set('format', 'csv');

    const link = document.createElement('a');
    link.href = `/api/export?${params.toString()}`;
    link.download = `alta_pedidos.csv`;
    link.click();
  }, [filters]);

  const statusColor = (status: string): string => {
    const s = status?.toUpperCase() ?? '';
    if (s === 'ENTREGADO') return 'bg-green-100 text-green-800';
    if (s === 'EN TRANSITO') return 'bg-blue-100 text-blue-800';
    if (s === 'NOVEDAD') return 'bg-orange-100 text-orange-800';
    if (s === 'DEVOLUCION') return 'bg-red-100 text-red-800';
    if (s === 'ANULADO') return 'bg-gray-100 text-gray-800';
    if (s === 'DESPACHADO') return 'bg-cyan-100 text-cyan-800';
    if (s === 'PENDIENTE') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-700';
  };

  const columns = [
    { key: 'guideNumber', label: 'Guía' },
    { key: 'orderDate', label: 'Fecha' },
    { key: 'status', label: 'Estado' },
    { key: 'platform', label: 'Plataforma' },
    { key: 'totalAmount', label: 'Monto' },
    { key: 'carrier', label: 'Transportadora' },
    { key: 'city', label: 'Ciudad' }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Table2 size={18} className="text-primary" />
          <h3 className="font-display text-lg font-semibold">Datos Detallados</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {total.toLocaleString('es-EC')} registros
          </span>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="bg-card rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {(columns ?? []).map((col: any) => (
                  <th
                    key={col?.key}
                    onClick={() => handleSort(col?.key ?? 'orderDate')}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {col?.label}
                      <ArrowUpDown size={12} className={sortBy === col?.key ? 'text-primary' : 'opacity-30'} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Cargando datos...</p>
                  </td>
                </tr>
              ) : (orders?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileSpreadsheet size={32} className="mx-auto text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mt-2">No hay datos que mostrar</p>
                  </td>
                </tr>
              ) : (
                (orders ?? []).map((order: any, i: number) => (
                  <motion.tr
                    key={order?.id ?? i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{order?.guideNumber ?? '-'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {order?.orderDate ? new Date(order.orderDate).toLocaleDateString('es-EC') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(order?.status ?? '')}`}>
                        {order?.status ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        order?.platform === 'DROPI' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order?.platform ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">${(order?.totalAmount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs">{order?.carrier ?? '-'}</td>
                    <td className="px-4 py-3 text-xs">{order?.city ?? '-'}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_: any, i: number) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      page === pageNum ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
