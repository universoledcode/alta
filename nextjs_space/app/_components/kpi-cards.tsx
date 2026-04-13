'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Truck,
  PackageCheck,
  PackageX,
  Package,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard
} from 'lucide-react';

interface KpiCardsProps {
  kpis: any;
  loading: boolean;
}

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView && !hasAnimated.current && value > 0) {
      hasAnimated.current = true;
      const duration = 1000;
      const steps = 40;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          current = value;
          clearInterval(interval);
        }
        setDisplay(current);
      }, duration / steps);
      return () => clearInterval(interval);
    }
    if (value === 0) setDisplay(0);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('es-EC')}{suffix}
    </span>
  );
}

export default function KpiCards({ kpis, loading }: KpiCardsProps) {
  if (loading && !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 10 }).map((_: any, i: number) => (
          <div key={i} className="bg-card rounded-xl p-4 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="h-4 bg-muted rounded w-2/3 mb-3" />
            <div className="h-8 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const cards = [
    {
      label: 'Guías Despachadas',
      value: kpis?.totalDespachadas ?? 0,
      icon: Truck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      format: 'number'
    },
    {
      label: 'Entregados Total',
      value: kpis?.totalEntregados ?? 0,
      icon: PackageCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
      format: 'number'
    },
    {
      label: 'Tasa de Entrega',
      value: kpis?.tasaEntrega ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      format: 'percent'
    },
    {
      label: 'Devoluciones Recibidas',
      value: kpis?.devolucionesTotalRecibidas ?? 0,
      icon: PackageX,
      color: 'text-red-600',
      bg: 'bg-red-50',
      format: 'number',
      subtitle: `Dropi: ${kpis?.devolucionesDropi ?? 0} | Effi: ${kpis?.devolucionesEffi ?? 0}`
    },
    {
      label: 'Tasa de Devolución',
      value: kpis?.tasaDevolucion ?? 0,
      icon: TrendingDown,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      format: 'percent'
    },
    {
      label: 'Devoluciones Pendientes',
      value: kpis?.devolucionesPendientes ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      format: 'number'
    },
    {
      label: 'Entregados Sin Pagar',
      value: kpis?.entregadosSinPagar ?? 0,
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      format: 'number'
    },
    {
      label: 'Total Ventas',
      value: kpis?.totalVentas ?? 0,
      icon: DollarSign,
      color: 'text-green-700',
      bg: 'bg-green-50',
      format: 'currency'
    },
    {
      label: 'Ganancia Acumulada',
      value: kpis?.totalGanancia ?? 0,
      icon: Wallet,
      color: 'text-primary',
      bg: 'bg-primary/10',
      format: 'currency'
    },
    {
      label: 'Ventas Entregadas',
      value: kpis?.ventasEntregadas ?? 0,
      icon: Package,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      format: 'currency'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {(cards ?? []).map((card: any, i: number) => {
        const Icon = card?.icon;
        return (
          <motion.div
            key={card?.label ?? i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="bg-card rounded-xl p-4 hover:scale-[1.02] transition-transform cursor-default group"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg ${card?.bg ?? 'bg-muted'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {Icon && <Icon size={16} className={card?.color ?? 'text-foreground'} />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{card?.label}</p>
            <p className={`text-xl font-bold ${card?.color ?? 'text-foreground'}`}>
              {card?.format === 'currency' && (
                <AnimatedNumber value={card?.value ?? 0} prefix="$" decimals={2} />
              )}
              {card?.format === 'percent' && (
                <AnimatedNumber value={card?.value ?? 0} suffix="%" decimals={1} />
              )}
              {card?.format === 'number' && (
                <AnimatedNumber value={card?.value ?? 0} />
              )}
            </p>
            {card?.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
