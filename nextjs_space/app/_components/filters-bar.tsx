'use client';

import { useState, useCallback } from 'react';
import {
  Filter,
  Calendar,
  Search,
  X
} from 'lucide-react';

interface Filters {
  platform: string;
  status: string;
  carrier: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface FiltersBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  filterOptions?: { statuses?: string[]; carriers?: string[] };
}

export default function FiltersBar({ filters, onFiltersChange, filterOptions }: FiltersBarProps) {
  const [expanded, setExpanded] = useState(false);
  const statuses = filterOptions?.statuses ?? [];
  const carriers = filterOptions?.carriers ?? [];

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    onFiltersChange?.({ ...(filters ?? {}), [key]: value } as Filters);
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange?.({
      platform: 'ALL',
      status: 'ALL',
      carrier: 'ALL',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  }, [onFiltersChange]);

  const hasActiveFilters = (filters?.platform !== 'ALL') || (filters?.status !== 'ALL') ||
    (filters?.carrier !== 'ALL') || !!filters?.dateFrom || !!filters?.dateTo || !!filters?.search;

  return (
    <div className="bg-card rounded-xl p-4 mb-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por # guía, cliente o producto..."
            value={filters?.search ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('search', e?.target?.value ?? '')}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 transition-all"
          />
        </div>

        {/* Quick platform filter */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {['ALL', 'DROPI', 'EFFI'].map((p: string) => (
            <button
              key={p}
              onClick={() => updateFilter('platform', p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filters?.platform === p
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'ALL' ? 'Todas' : p}
            </button>
          ))}
        </div>

        {/* Toggle filters */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            expanded ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Filter size={14} />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Estado</label>
            <select
              value={filters?.status ?? 'ALL'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFilter('status', e?.target?.value ?? 'ALL')}
              className="w-full px-3 py-2 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent"
            >
              <option value="ALL">Todos</option>
              {(statuses ?? []).map((s: string) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Transportadora</label>
            <select
              value={filters?.carrier ?? 'ALL'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFilter('carrier', e?.target?.value ?? 'ALL')}
              className="w-full px-3 py-2 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent"
            >
              <option value="ALL">Todas</option>
              {(carriers ?? []).map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
              <Calendar size={12} /> Desde
            </label>
            <input
              type="date"
              value={filters?.dateFrom ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('dateFrom', e?.target?.value ?? '')}
              className="w-full px-3 py-2 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
              <Calendar size={12} /> Hasta
            </label>
            <input
              type="date"
              value={filters?.dateTo ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('dateTo', e?.target?.value ?? '')}
              className="w-full px-3 py-2 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
