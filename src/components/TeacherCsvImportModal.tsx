import React, { useState, useRef } from 'react';
import { Teacher } from '../types';
import {
  parseTeacherCsv,
  downloadTeacherCsvTemplate,
  TeacherCsvParseResult,
} from '../utils/csvTeacherUtils';
import { getTeacherBarcodeCode } from '../utils/barcodeUtils';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  Barcode,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface TeacherCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTeachers: Teacher[];
  onImportComplete: (importedTeachers: Teacher[]) => void;
  onOpenPrintAllPdf?: () => void;
}

export const TeacherCsvImportModal: React.FC<TeacherCsvImportModalProps> = ({
  isOpen,
  onClose,
  existingTeachers,
  onImportComplete,
  onOpenPrintAllPdf,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<TeacherCsvParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const processFile = (fileToProcess: File) => {
    setFile(fileToProcess);
    setImportSuccess(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      try {
        const result = parseTeacherCsv(text);
        setParseResult(result);
      } catch (err) {
        console.error('CSV Parse Error:', err);
        setParseResult({
          validTeachers: [],
          errors: ['Gagal memproses file CSV. Pastikan format kolom sesuai dengan template.'],
          totalRows: 0,
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setParseResult({
        validTeachers: [],
        errors: ['Terjadi kesalahan saat membaca file.'],
        totalRows: 0,
      });
    };
    reader.readAsText(fileToProcess, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.name.endsWith('.csv') || dropped.type.includes('csv') || dropped.type.includes('excel'))) {
      processFile(dropped);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const existingTeacherNames = new Set(existingTeachers.map((t) => t.name.toLowerCase().trim()));

  const filteredTeachers = parseResult?.validTeachers.filter((t) => {
    if (!skipDuplicates) return true;
    return !existingTeacherNames.has(t.name.toLowerCase().trim());
  }) || [];

  const duplicateCount = (parseResult?.validTeachers.length || 0) - filteredTeachers.length;

  const handleExecuteImport = () => {
    if (filteredTeachers.length === 0) return;
    setIsProcessing(true);
    try {
      // Return the new teachers through callback
      const mockResult: Teacher[] = filteredTeachers.map((t, idx) => ({
        ...t,
        id: `t-${Date.now()}-${idx}`,
      }));
      onImportComplete(mockResult);
      setImportSuccess(filteredTeachers.length);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setImportSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="font-bold text-base leading-tight">Impor Data Dewan Guru (Format CSV)</h2>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Input seluruh dewan guru sekaligus & barcode langsung terbuat otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-700 text-xs sm:text-sm">
          {importSuccess !== null ? (
            /* Success View */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Impor Data Guru Berhasil!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Sebanyak <strong>{importSuccess} dewan guru</strong> berhasil disimpan ke sistem dan seluruh barcode presensi telah otomatis dibuat siap dicetak.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-center gap-2 max-w-md mx-auto">
                <Barcode className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Kartu ID barcode untuk guru baru dapat langsung dicetak per orang atau seluruhnya dalam format PDF.</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                {onOpenPrintAllPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onOpenPrintAllPdf();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <Barcode className="w-4 h-4" />
                    <span>Cetak Semua Kartu Barcode (PDF)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                >
                  <span>Tutup & Lihat Data Guru</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Download template guidance */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Unduh Format Template CSV</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Gunakan template resmi kami agar kolom Nama, NIP, Jenis Kelamin (L/P), Mata Pelajaran, dan No HP terdeteksi presisi.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadTeacherCsvTemplate()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Step 2: Upload Area */}
              {!parseResult ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      Tarik & lepas file CSV di sini, atau <span className="text-emerald-700 underline">pilih file</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mendukung file .csv (diekspor dari Microsoft Excel, Google Sheets, atau Dapodik/Simpatika)
                    </p>
                  </div>
                </div>
              ) : (
                /* Step 3: Parsed Results Preview */
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs text-slate-800 truncate max-w-xs sm:max-w-sm">
                        {file?.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Ganti File
                    </button>
                  </div>

                  {/* Errors / Warnings */}
                  {parseResult.errors.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertCircle className="w-4 h-4" />
                        Catatan saat parsing ({parseResult.errors.length} baris):
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 max-h-24 overflow-y-auto">
                        {parseResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary & Option for duplicates */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                        {filteredTeachers.length} Guru Siap Diimpor
                      </span>
                      {duplicateCount > 0 && skipDuplicates && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium text-[11px]">
                          {duplicateCount} guru dilewati (sudah ada)
                        </span>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="text-slate-700 font-medium">Lewati jika nama guru sudah terdaftar</span>
                    </label>
                  </div>

                  {/* Table Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-2.5 w-8 text-center">No</th>
                          <th className="py-2 px-2.5">Nama Guru</th>
                          <th className="py-2 px-2.5">NIP/NUPTK</th>
                          <th className="py-2 px-2.5 text-center">L/P</th>
                          <th className="py-2 px-2.5">Mata Pelajaran</th>
                          <th className="py-2 px-2.5">Kode Barcode Auto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {filteredTeachers.slice(0, 50).map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-800">{t.name}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-500">{t.nip || '-'}</td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded-sm font-semibold text-[10px] ${
                                  t.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                                }`}
                              >
                                {t.gender}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600 truncate max-w-xs">
                              {t.primarySubject}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-emerald-800 text-[10px]">
                              {getTeacherBarcodeCode({ ...t, id: `preview-${idx}` })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredTeachers.length > 50 && (
                    <p className="text-[11px] text-slate-400 text-center">
                      Menampilkan 50 dari {filteredTeachers.length} data guru yang akan diimpor.
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>

                {parseResult && (
                  <button
                    type="button"
                    disabled={filteredTeachers.length === 0 || isProcessing}
                    onClick={handleExecuteImport}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all active:scale-98"
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Mengimpor...'
                        : `Impor Sekarang (${filteredTeachers.length} Guru)`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
