'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Truck
} from 'lucide-react';
import dynamic from 'next/dynamic';

const ChartsInner = dynamic(() => import('./charts-inner'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4, 5].map((i: number) => (
        <div key={i} className="bg-card rounded-xl p-6 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="h-6 bg-muted rounded w-1/3 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
});

interface ChartsSectionProps {
  charts: any;
  loading: boolean;
}

export default function ChartsSection({ charts, loading }: ChartsSectionProps) {
  if (loading && !charts) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5].map((i: number) => (
          <div key={i} className="bg-card rounded-xl p-6 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!charts) return null;

  return <ChartsInner charts={charts} />;
}
