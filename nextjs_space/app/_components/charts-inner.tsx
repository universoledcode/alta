'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Truck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const COLORS = ['#D32F2F', '#FF9149', '#60B5FF', '#80D8C3', '#A19AD3', '#FF6363', '#FF90BB', '#72BF78'];
const STATUS_COLORS: Record<string, string> = {
  'ENTREGADO': '#4CAF50',
  'EN TRANSITO': '#2196F3',
  'NOVEDAD': '#FF9800',
  'DEVOLUCION': '#F44336',
  'ANULADO': '#9E9E9E',
  'DESPACHADO': '#00BCD4',
  'PENDIENTE': '#FFC107',
  'NOVEDAD SOLUCIONADA': '#8BC34A',
  'DESCONOCIDO': '#607D8B'
};

interface ChartsInnerProps {
  charts: any;
}

export default function ChartsInner({ charts }: ChartsInnerProps) {
  const statusData = useMemo(() => {
    const counts = charts?.statusCounts ?? {};
    return Object.entries(counts).map(([name, value]: [string, any]) => ({
      name: name?.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      value: value ?? 0,
      fill: STATUS_COLORS[name] ?? '#607D8B'
    }));
  }, [charts?.statusCounts]);

  const platformData = useMemo(() => {
    const counts = charts?.platformCounts ?? {};
    return Object.entries(counts).map(([name, value]: [string, any], i: number) => ({
      name,
      value: value ?? 0,
      fill: name === 'DROPI' ? '#D32F2F' : '#2196F3'
    }));
  }, [charts?.platformCounts]);

  const carrierDeliveryData = useMemo(() => {
    const counts = charts?.carrierDeliveries ?? {};
    return Object.entries(counts)
      .map(([name, value]: [string, any]) => ({ name, value: value ?? 0 }))
      .sort((a: any, b: any) => (b?.value ?? 0) - (a?.value ?? 0));
  }, [charts?.carrierDeliveries]);

  const carrierReturnData = useMemo(() => {
    const counts = charts?.carrierReturns ?? {};
    return Object.entries(counts)
      .map(([name, value]: [string, any]) => ({ name, value: value ?? 0 }))
      .sort((a: any, b: any) => (b?.value ?? 0) - (a?.value ?? 0));
  }, [charts?.carrierReturns]);

  const salesData = useMemo(() => {
    return (charts?.salesByDay ?? []).map((d: any) => ({
      date: d?.date ? new Date(d.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) : '',
      total: d?.total ?? 0,
      count: d?.count ?? 0
    }));
  }, [charts?.salesByDay]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Status Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-primary" />
          <h3 className="font-display text-sm font-semibold">Pedidos por Estado</h3>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 5, right: 10, left: 10, bottom: 50 }}>
              <XAxis
                dataKey="name"
                tickLine={false}
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" name="Pedidos" radius={[4, 4, 0, 0]}>
                {(statusData ?? []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry?.fill ?? '#607D8B'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Platform Pie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon size={18} className="text-primary" />
          <h3 className="font-display text-sm font-semibold">Distribución por Plataforma</h3>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                style={{ fontSize: 11 }}
              >
                {(platformData ?? []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry?.fill ?? COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Carrier Deliveries Pie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Truck size={18} className="text-primary" />
          <h3 className="font-display text-sm font-semibold">Transportadora Más Efectiva</h3>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={carrierDeliveryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                style={{ fontSize: 10 }}
              >
                {(carrierDeliveryData ?? []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Sales Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-primary" />
          <h3 className="font-display text-sm font-semibold">Tendencia de Ventas por Día</h3>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
              <XAxis
                dataKey="date"
                tickLine={false}
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tickLine={false} tick={{ fontSize: 10 }} label={{ value: 'Ventas ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total" name="Ventas ($)" stroke="#D32F2F" strokeWidth={2} dot={{ fill: '#D32F2F', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Carrier Returns Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl p-5 lg:col-span-2"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-primary" />
          <h3 className="font-display text-sm font-semibold">Devoluciones por Transportadora</h3>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={carrierReturnData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" name="Devoluciones" fill="#FF6363" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
