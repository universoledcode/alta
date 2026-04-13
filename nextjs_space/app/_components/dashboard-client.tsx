'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  Table2,
  History,
  Menu,
  X
} from 'lucide-react';
import FileUploadZone from './file-upload';
import KpiCards from './kpi-cards';
import ChartsSection from './charts-section';
import FiltersBar from './filters-bar';
import DataTable from './data-table';
import HistoryPanel from './history-panel';

type Tab = 'dashboard' | 'upload' | 'table' | 'history';

interface Filters {
  platform: string;
  status: string;
  carrier: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    platform: 'ALL',
    status: 'ALL',
    carrier: 'ALL',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.platform !== 'ALL') params.set('platform', filters.platform);
      if (filters.carrier !== 'ALL') params.set('carrier', filters.carrier);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/kpis?${params.toString()}`);
      const data = await res.json();
      if (data?.kpis) {
        setKpiData(data);
        const total = data?.kpis?.totalDespachadas ?? 0;
        setHasData(total > 0);
        if (total > 0 && activeTab === 'upload') {
          setActiveTab('dashboard');
        }
      }
    } catch (e: any) {
      console.error('Error fetching KPIs:', e);
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  useEffect(() => {
    if (hasData) {
      fetchKpis();
    }
  }, [filters, hasData, fetchKpis]);

  const handleUploadComplete = useCallback(() => {
    fetchKpis();
    setActiveTab('dashboard');
  }, [fetchKpis]);

  const handleClearData = useCallback(async () => {
    if (!confirm('¿Estás seguro de eliminar todos los datos? Esta acción no se puede deshacer.')) return;
    try {
      const adminToken = prompt('Ingresa el token de administrador para borrar todos los datos:');
      if (!adminToken) return;

      const response = await fetch('/api/orders', {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errorMessage = payload?.error ?? 'No se pudo eliminar la data';
        alert(errorMessage);
        return;
      }

      setKpiData(null);
      setHasData(false);
      setActiveTab('upload');
    } catch (e: any) {
      console.error('Error clearing data:', e);
    }
  }, []);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as Tab, label: 'Cargar Archivos', icon: Upload },
    { id: 'table' as Tab, label: 'Datos', icon: Table2 },
    { id: 'history' as Tab, label: 'Historial', icon: History }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white p-1">
                <Image src="/alta-logo.png" alt="ALTA Logo" fill className="object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-lg font-bold text-white tracking-tight">ALTA</h1>
                <p className="text-xs text-white/60">Dashboard Operativo</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab: any) => {
                const Icon = tab?.icon;
                return (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab?.id
                        ? 'bg-primary text-white shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {Icon && <Icon size={16} />}
                    {tab?.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-secondary border-t border-white/10"
            >
              <div className="px-4 py-2 space-y-1">
                {tabs.map((tab: any) => {
                  const Icon = tab?.icon;
                  return (
                    <button
                      key={tab?.id}
                      onClick={() => {
                        setActiveTab(tab?.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab?.id
                          ? 'bg-primary text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {Icon && <Icon size={18} />}
                      {tab?.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FileUploadZone
                onUploadComplete={handleUploadComplete}
                onClearData={handleClearData}
                hasData={hasData}
              />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FiltersBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                filterOptions={kpiData?.filters}
              />
              <KpiCards kpis={kpiData?.kpis} loading={loading} />
              <ChartsSection charts={kpiData?.charts} loading={loading} />
            </motion.div>
          )}

          {activeTab === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FiltersBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                filterOptions={kpiData?.filters}
              />
              <DataTable filters={filters} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <HistoryPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            ALTA Dashboard Operativo &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
