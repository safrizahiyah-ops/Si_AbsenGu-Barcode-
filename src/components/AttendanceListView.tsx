import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceRecord, AttendanceStatus, PeriodId } from '../types';
import {
  PERIOD_IDS,
  ATTENDANCE_STATUS_CONFIG,
  formatIndonesianDateShort,
} from '../constants/schedule';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  PlusCircle,
  X,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { downloadCsv } from '../utils/exportUtils';

export const AttendanceListView: React.FC = () => {
  const {
    records,
    teachers,
    classes,
    deleteAttendanceRecord,
    setEditingRecord,
    setIsFormModalOpen,
  } = useAttendance();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterTeacher, setFilterTeacher] = useState<string>('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');

  // Sort State
  const [sortField, setSortField] = useState<'date' | 'period' | 'teacherName' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Delete confirmation modal state
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  // Filter and sort computation
  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter((rec) => {
        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = rec.teacherName.toLowerCase().includes(q);
          const matchSubject = rec.subject.toLowerCase().includes(q);
          const matchClass = rec.className.toLowerCase().includes(q);
          const matchNotes = rec.notes ? rec.notes.toLowerCase().includes(q) : false;
          if (!matchName && !matchSubject && !matchClass && !matchNotes) {
            return false;
          }
        }

        // Filter Date
        if (filterDate && rec.date !== filterDate) {
          return false;
        }

        // Filter Teacher
        if (filterTeacher && rec.teacherId !== filterTeacher && rec.teacherName !== filterTeacher) {
          return false;
        }

        // Filter Period
        if (filterPeriod && rec.period !== filterPeriod) {
          return false;
        }

        // Filter Status
        if (filterStatus && rec.status !== filterStatus) {
          return false;
        }

        // Filter Class
        if (filterClass && rec.className !== filterClass) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'date') {
          comparison = a.date.localeCompare(b.date);
          if (comparison === 0) {
            // Secondary sort by period
            const periodOrder: Record<string, number> = {
              I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9
            };
            comparison = (periodOrder[a.period] || 0) - (periodOrder[b.period] || 0);
          }
        } else if (sortField === 'period') {
          const periodOrder: Record<string, number> = {
            I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9
          };
          comparison = (periodOrder[a.period] || 0) - (periodOrder[b.period] || 0);
        } else if (sortField === 'teacherName') {
          comparison = a.teacherName.localeCompare(b.teacherName);
        } else if (sortField === 'status') {
          comparison = a.status.localeCompare(b.status);
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [
    records,
    searchQuery,
    filterDate,
    filterTeacher,
    filterPeriod,
    filterStatus,
    filterClass,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: 'date' | 'period' | 'teacherName' | 'status') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setFilterTeacher('');
    setFilterPeriod('');
    setFilterStatus('');
    setFilterClass('');
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setIsFormModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteAttendanceRecord(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Tanggal',
      'Jam Pelajaran',
      'Waktu',
      'Nama Guru',
      'Mata Pelajaran',
      'Kelas',
      'Status',
      'Keterangan',
      'Guru Piket',
    ];
    const rows = filteredAndSortedRecords.map((r, i) => [
      i + 1,
      r.date,
      `Jam ${r.period}`,
      r.timeSlot,
      r.teacherName,
      r.subject,
      r.className,
      r.status,
      r.notes || '-',
      r.picketTeacher || '-',
    ]);

    downloadCsv(`Data-Absensi-Guru-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(filterDate) ||
    Boolean(filterTeacher) ||
    Boolean(filterPeriod) ||
    Boolean(filterStatus) ||
    Boolean(filterClass);

  return (
    <div className="space-y-5">
      {/* Header & Quick Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Tabel Data Absensi Guru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan kehadiran guru per jam pelajaran secara realtime oleh guru piket
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>
          <button
            id="tabel-tambah-absensi-btn"
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Absensi</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search bar row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="filter-search-input"
              type="text"
              placeholder="Cari nama guru, mata pelajaran, kelas, keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filter
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Filter Tanggal */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Filter Tanggal
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Filter Jam Pelajaran */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Jam Pelajaran
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">Semua Jam (I - IX)</option>
              {PERIOD_IDS.map((p) => (
                <option key={p} value={p}>
                  Jam {p}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Status Kehadiran
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="HADIR">HADIR</option>
              <option value="TERLAMBAT">TERLAMBAT</option>
              <option value="IZIN">IZIN</option>
              <option value="SAKIT">SAKIT</option>
              <option value="DINAS/TUGAS">DINAS/TUGAS</option>
              <option value="TIDAK HADIR">TIDAK HADIR</option>
            </select>
          </div>

          {/* Filter Guru */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Guru
            </label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 bg-white truncate"
            >
              <option value="">Semua Guru</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Kelas
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>
            Menampilkan <strong className="text-slate-900">{filteredAndSortedRecords.length}</strong> data absensi
          </span>
          <span className="text-[11px] text-slate-400">
            Klik judul kolom bertanda panah untuk mengurutkan (sort)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 text-center"
                  onClick={() => handleSort('period')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Jam</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Waktu</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('teacherName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Guru</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 text-center"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3">Guru Piket</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredAndSortedRecords.length > 0 ? (
                filteredAndSortedRecords.map((rec, index) => {
                  const statusConf = ATTENDANCE_STATUS_CONFIG[rec.status];

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-semibold text-slate-500 text-xs">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {formatIndonesianDateShort(rec.date)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {rec.period}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-500">
                        {rec.timeSlot}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {rec.teacherName}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {rec.subject}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs">
                          {rec.className}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConf.badgeBg}`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate italic text-xs">
                        {rec.notes || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">
                        {rec.picketTeacher || '-'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="Edit Data"
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Hapus Data"
                            onClick={() => setRecordToDelete(rec)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">Tidak ada data absensi yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau reset filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Konfirmasi Hapus Data</h3>
            </div>

            <p className="text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus data absensi guru{' '}
              <strong className="text-slate-900">{recordToDelete.teacherName}</strong> pada{' '}
              <strong>Jam {recordToDelete.period}</strong> tanggal{' '}
              <strong>{formatIndonesianDateShort(recordToDelete.date)}</strong>?
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <p>Mata Pelajaran: {recordToDelete.subject}</p>
              <p>Kelas: {recordToDelete.className}</p>
              <p>Status: {recordToDelete.status}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
