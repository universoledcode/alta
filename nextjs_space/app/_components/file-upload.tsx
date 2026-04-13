'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CloudUpload
} from 'lucide-react';

interface UploadResult {
  fileName: string;
  platform: string;
  records: number;
  duplicates: number;
  errors?: string;
}

interface FileUploadZoneProps {
  onUploadComplete: () => void;
  onClearData: () => void;
  hasData: boolean;
}

export default function FileUploadZone({ onUploadComplete, onClearData, hasData }: FileUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e?.dataTransfer?.files ?? []).filter(
      (f: File) => f?.name?.endsWith('.xlsx') || f?.name?.endsWith('.xls')
    );
    setFiles((prev: File[]) => [...(prev ?? []), ...droppedFiles]);
    setResults([]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e?.target?.files ?? []).filter(
      (f: File) => f?.name?.endsWith('.xlsx') || f?.name?.endsWith('.xls')
    );
    setFiles((prev: File[]) => [...(prev ?? []), ...selected]);
    setResults([]);
    if (fileInputRef?.current) fileInputRef.current.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev: File[]) => (prev ?? []).filter((_: File, i: number) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!files?.length) return;
    setUploading(true);
    setResults([]);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data?.results) {
        setResults(data.results);
        const hasSuccess = (data.results ?? []).some((r: UploadResult) => (r?.records ?? 0) > 0);
        if (hasSuccess) {
          setTimeout(() => onUploadComplete?.(), 1500);
        }
      } else {
        setResults([{ fileName: 'Error', platform: '', records: 0, duplicates: 0, errors: data?.error ?? 'Error desconocido' }]);
      }
    } catch (e: any) {
      console.error('Upload error:', e);
      setResults([{ fileName: 'Error', platform: '', records: 0, duplicates: 0, errors: e?.message ?? 'Error de conexión' }]);
    } finally {
      setUploading(false);
    }
  }, [files, onUploadComplete]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Cargar Archivos <span className="text-primary">Excel</span>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-lg mx-auto">
          Arrastra los archivos exportados de Dropi y Effi. Se detectará automáticamente la plataforma y se eliminarán duplicados.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef?.current?.click?.()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <motion.div
          animate={{ y: dragOver ? -5 : 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CloudUpload className="text-primary" size={32} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {dragOver ? 'Suelta los archivos aquí' : 'Arrastra tus archivos Excel'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Archivos .xlsx y .xls de Dropi y Effi • Múltiples archivos permitidos
            </p>
          </div>
        </motion.div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {(files?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-foreground">
                Archivos seleccionados ({files?.length ?? 0})
              </h3>
              <button
                onClick={() => { setFiles([]); setResults([]); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Limpiar todo
              </button>
            </div>
            <div className="space-y-2">
              {(files ?? []).map((file: File, i: number) => (
                <motion.div
                  key={`${file?.name}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between bg-card rounded-lg px-4 py-3"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={20} className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file?.name ?? 'archivo'}</p>
                      <p className="text-xs text-muted-foreground">
                        {((file?.size ?? 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeFile(i); }}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              {uploading ? (
                <><Loader2 size={18} className="animate-spin" /> Procesando...</>
              ) : (
                <><Upload size={18} /> Procesar {files?.length ?? 0} archivo(s)</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Results */}
      <AnimatePresence>
        {(results?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h3 className="font-display text-sm font-semibold text-foreground">Resultados</h3>
            {(results ?? []).map((r: UploadResult, i: number) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  r?.errors ? 'bg-destructive/10' : 'bg-green-50'
                }`}
              >
                {r?.errors ? (
                  <AlertCircle size={20} className="text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r?.fileName}</p>
                  {r?.errors ? (
                    <p className="text-xs text-destructive">{r.errors}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {r?.platform} • {r?.records} registros procesados
                      {(r?.duplicates ?? 0) > 0 && ` • ${r.duplicates} duplicados actualizados`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Data Button */}
      {hasData && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onClearData}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-destructive/5"
          >
            <Trash2 size={14} /> Eliminar todos los datos y empezar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
