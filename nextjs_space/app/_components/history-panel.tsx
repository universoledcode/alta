'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  FileSpreadsheet,
  Calendar,
  Loader2
} from 'lucide-react';

export default function HistoryPanel() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch('/api/batches');
        const data = await res.json();
        setBatches(data?.batches ?? []);
      } catch (e: any) {
        console.error('Error fetching batches:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Group batches by month
  const grouped = (batches ?? []).reduce((acc: Record<string, any[]>, batch: any) => {
    const date = batch?.createdAt ? new Date(batch.createdAt) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(batch);
    return acc;
  }, {} as Record<string, any[]>);

  const months = Object.keys(grouped ?? {}).sort().reverse();

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Historial de <span className="text-primary">Cargas</span>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Registro de todos los archivos procesados
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin mx-auto text-primary" />
        </div>
      ) : (batches?.length ?? 0) === 0 ? (
        <div className="text-center py-12">
          <FileSpreadsheet size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No hay cargas registradas aún</p>
          <p className="text-sm text-muted-foreground mt-1">Sube archivos Excel para comenzar</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(months ?? []).map((month: string) => {
            const [year, m] = month.split('-');
            const monthName = new Date(parseInt(year ?? '2026', 10), parseInt(m ?? '1', 10) - 1).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
            const monthBatches = grouped[month] ?? [];
            const totalRecords = monthBatches.reduce((sum: number, b: any) => sum + (b?.records ?? 0), 0);

            return (
              <motion.div
                key={month}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={16} className="text-primary" />
                  <h3 className="font-display text-base font-semibold capitalize">{monthName}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {monthBatches?.length ?? 0} archivos • {totalRecords} registros
                  </span>
                </div>
                <div className="space-y-2">
                  {(monthBatches ?? []).map((batch: any, i: number) => (
                    <div
                      key={batch?.id ?? i}
                      className="bg-card rounded-lg px-4 py-3 flex items-center justify-between"
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet size={18} className="text-green-600" />
                        <div>
                          <p className="text-sm font-medium">{batch?.fileName ?? 'archivo'}</p>
                          <p className="text-xs text-muted-foreground">
                            {batch?.createdAt ? new Date(batch.createdAt).toLocaleString('es-EC') : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          batch?.platform === 'DROPI' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {batch?.platform ?? '-'}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {batch?.records ?? 0} reg.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
