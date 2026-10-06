import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAttendance } from '../context/AttendanceContext';
import { Subject, PeriodId } from '../types';
import {
  SCHOOL_DAYS,
  getPeriodRangeDetails,
} from '../constants/schedule';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  User,
  Calendar,
  Clock,
  School,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronRight,
  Layers,
  FileDown,
} from 'lucide-react';

export const MasterSubjectsView: React.FC = () => {
  const {
    subjects,
    addSubject,
    bulkAddSubjects,
    updateSubject,
    deleteSubject,
    teachers,
    classes,
    periodSlots,
    validAttendancePeriods,
    showToast,
  } = useAttendance();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subject | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [category, setCategory] = useState<'Pendidikan Agama Islam' | 'Umum' | 'Muatan Lokal'>('Pendidikan Agama Islam');
  const [teacherId, setTeacherId] = useState<string>('');
  const [day, setDay] = useState<string>('Senin');
  const [startPeriod, setStartPeriod] = useState<PeriodId>('I');
  const [endPeriod, setEndPeriod] = useState<PeriodId>('II');
  const [className, setClassName] = useState<string>('');

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importRows, setImportRows] = useState<Omit<Subject, 'id'>[]>([]);
  const [importReplaceMode, setImportReplaceMode] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available study periods (excluding breaks)
  const studyPeriodSlots = useMemo(() => {
    return periodSlots.filter((s) => !s.isBreak);
  }, [periodSlots]);

  // Calculated period range preview for the form
  const formPeriodRange = useMemo(() => {
    return getPeriodRangeDetails(startPeriod, endPeriod, validAttendancePeriods);
  }, [startPeriod, endPeriod, validAttendancePeriods]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingSub(null);
    setName('');
    setCode('');
    setCategory('Pendidikan Agama Islam');
    setTeacherId(teachers[0]?.id || '');
    setDay('Senin');
    setStartPeriod('I');
    setEndPeriod('II');
    setClassName(classes[0]?.name || 'X IPA');
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (s: Subject) => {
    setEditingSub(s);
    setName(s.name);
    setCode(s.code || '');
    setCategory(s.category);
    setTeacherId(s.teacherId || teachers[0]?.id || '');
    setDay(s.day || 'Senin');
    setStartPeriod(s.startPeriod || 'I');
    setEndPeriod(s.endPeriod || s.startPeriod || 'I');
    setClassName(s.className || classes[0]?.name || '');
    setIsModalOpen(true);
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama mata pelajaran wajib diisi!', 'error');
      return;
    }

    const selectedTeacher = teachers.find((t) => t.id === teacherId);
    const selectedClass = classes.find((c) => c.name === className);
    const rangeDetails = getPeriodRangeDetails(startPeriod, endPeriod, validAttendancePeriods);

    const subjectPayload: Omit<Subject, 'id'> = {
      name: name.trim(),
      code: code.trim().toUpperCase() || name.trim().substring(0, 3).toUpperCase(),
      category,
      teacherId: selectedTeacher?.id || undefined,
      teacherName: selectedTeacher?.name || undefined,
      day: day || 'Senin',
      startPeriod,
      endPeriod,
      periodString: rangeDetails.periodString,
      timeSlotString: rangeDetails.timeSlotString,
      classId: selectedClass?.id || undefined,
      className: className || undefined,
    };

    if (editingSub) {
      updateSubject(editingSub.id, subjectPayload);
      showToast(`Mata pelajaran ${name.trim()} berhasil diperbarui & sinkron ke jadwal!`, 'success');
    } else {
      addSubject(subjectPayload);
      showToast(`Mata pelajaran ${name.trim()} berhasil ditambahkan & masuk jadwal!`, 'success');
    }

    setIsModalOpen(false);
  };

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchTeacher = (s.teacherName || '').toLowerCase().includes(q);
        const matchClass = (s.className || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTeacher && !matchClass) return false;
      }
      // Category
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      // Day
      if (filterDay !== 'all' && s.day !== filterDay) return false;
      // Teacher
      if (filterTeacher !== 'all' && s.teacherId !== filterTeacher) return false;
      // Class
      if (filterClass !== 'all' && s.className !== filterClass) return false;

      return true;
    });
  }, [subjects, searchQuery, filterCategory, filterDay, filterTeacher, filterClass]);

  // Export subjects to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const dataToExport = subjects.map((s, idx) => ({
        No: idx + 1,
        'Kode Mapel': s.code || '-',
        'Nama Mata Pelajaran': s.name,
        Kelompok: s.category,
        'Guru Pengampu': s.teacherName || '-',
        'Hari Mengajar': s.day || '-',
        'Jam Pelajaran': s.periodString ? `Jam ${s.periodString}` : '-',
        'Rentang Waktu': s.timeSlotString || '-',
        'Kelas / Rombel': s.className || '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Mata Pelajaran');
      XLSX.writeFile(workbook, `Data_Mata_Pelajaran_Jadwal_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('Data Mata Pelajaran berhasil diekspor ke Excel!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data ke Excel.', 'error');
    }
  };

  // Download template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          'Kode Mapel': 'QUR',
          'Nama Mata Pelajaran': "Al-Qur'an Hadits",
          Kelompok: 'Pendidikan Agama Islam',
          'Guru Pengampu / NIP': 'Ust. H. Abdullah Mansyur, Lc., M.A.',
          'Hari Mengajar': 'Senin',
          'Jam Mulai': 'I',
          'Jam Selesai': 'II',
          'Kelas / Rombel': 'XII IPA',
        },
        {
          'Kode Mapel': 'MAT',
          'Nama Mata Pelajaran': 'Matematika',
          Kelompok: 'Umum',
          'Guru Pengampu / NIP': 'Bpk. Hendra Gunawan, S.Pd., M.Si.',
          'Hari Mengajar': 'Senin',
          'Jam Mulai': 'I',
          'Jam Selesai': 'II',
          'Kelas / Rombel': 'X IPA',
        },
        {
          'Kode Mapel': 'AKH',
          'Nama Mata Pelajaran': 'Akidah Akhlak',
          Kelompok: 'Pendidikan Agama Islam',
          'Guru Pengampu / NIP': 'Usth. Dra. Hj. Siti Aminah, M.Pd.',
          'Hari Mengajar': 'Selasa',
          'Jam Mulai': 'II',
          'Jam Selesai': 'III',
          'Kelas / Rombel': 'XI IPS',
        },
        {
          'Kode Mapel': 'BIO',
          'Nama Mata Pelajaran': 'Biologi',
          Kelompok: 'Umum',
          'Guru Pengampu / NIP': 'Ibu Dr. Fitri Rahmawati, M.Sc.',
          'Hari Mengajar': 'Kamis',
          'Jam Mulai': 'VI',
          'Jam Selesai': 'VII',
          'Kelas / Rombel': 'XII IPA',
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Jadwal_Mapel');
      XLSX.writeFile(workbook, 'Template_Jadwal_Mata_Pelajaran.xlsx');
      showToast('Template Excel berhasil diunduh. Silakan isi dan unggah kembali.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template Excel.', 'error');
    }
  };

  // Handle Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          setImportError('File Excel tidak berisi baris data yang valid.');
          return;
        }

        const parsedList: Omit<Subject, 'id'>[] = [];

        for (const row of rows) {
          // Normalize column names
          const nameVal =
            row['Nama Mata Pelajaran'] ||
            row['Mata Pelajaran'] ||
            row['Nama Mapel'] ||
            row['Mapel'] ||
            row['name'] ||
            '';
          if (!nameVal || !String(nameVal).trim()) continue;

          const codeVal =
            row['Kode Mapel'] ||
            row['Kode'] ||
            row['code'] ||
            String(nameVal).trim().substring(0, 3).toUpperCase();

          const catRaw = String(row['Kelompok'] || row['Kategori'] || row['category'] || '').trim();
          let categoryVal: 'Pendidikan Agama Islam' | 'Umum' | 'Muatan Lokal' = 'Umum';
          if (catRaw.toLowerCase().includes('agama') || catRaw.toLowerCase().includes('pai')) {
            categoryVal = 'Pendidikan Agama Islam';
          } else if (catRaw.toLowerCase().includes('lokal') || catRaw.toLowerCase().includes('mulok')) {
            categoryVal = 'Muatan Lokal';
          }

          // Teacher match
          const teacherRaw = String(
            row['Guru Pengampu'] ||
            row['Guru'] ||
            row['Pengampu'] ||
            row['Guru Pengampu / NIP'] ||
            row['teacherName'] ||
            ''
          ).trim();

          let matchedTeacher = teachers.find(
            (t) =>
              t.name.toLowerCase().includes(teacherRaw.toLowerCase()) ||
              (t.nip && t.nip.replace(/\s+/g, '') === teacherRaw.replace(/\s+/g, ''))
          );

          // Day match
          const dayRaw = String(row['Hari Mengajar'] || row['Hari'] || row['day'] || 'Senin').trim();
          const validDay = SCHOOL_DAYS.find((d) => d.toLowerCase() === dayRaw.toLowerCase()) || 'Senin';

          // Periods match
          let startP: PeriodId = 'I';
          let endP: PeriodId = 'I';

          const periodRaw = String(row['Jam Pelajaran'] || row['Jam Mengajar'] || row['Jam'] || '').trim();
          const startPRaw = String(row['Jam Mulai'] || row['Mulai'] || '').trim();
          const endPRaw = String(row['Jam Selesai'] || row['Selesai'] || '').trim();

          if (startPRaw && endPRaw) {
            startP = (startPRaw.replace(/jam/i, '').trim().toUpperCase() || 'I') as PeriodId;
            endP = (endPRaw.replace(/jam/i, '').trim().toUpperCase() || startP) as PeriodId;
          } else if (periodRaw) {
            // E.g. "I - II" or "1 - 2" or "I"
            const parts = periodRaw.replace(/jam/i, '').split(/[-–]/).map((p) => p.trim());
            if (parts.length >= 2) {
              startP = parts[0].toUpperCase() as PeriodId;
              endP = parts[1].toUpperCase() as PeriodId;
            } else if (parts.length === 1 && parts[0]) {
              startP = parts[0].toUpperCase() as PeriodId;
              endP = parts[0].toUpperCase() as PeriodId;
            }
          }

          // Class match
          const classRaw = String(
            row['Kelas / Rombel'] || row['Kelas'] || row['Rombel'] || row['className'] || ''
          ).trim();
          const matchedClass = classes.find(
            (c) => c.name.toLowerCase() === classRaw.toLowerCase()
          );

          const rangeDetails = getPeriodRangeDetails(startP, endP, validAttendancePeriods);

          parsedList.push({
            name: String(nameVal).trim(),
            code: String(codeVal).trim().toUpperCase(),
            category: categoryVal,
            teacherId: matchedTeacher?.id,
            teacherName: matchedTeacher?.name || (teacherRaw ? teacherRaw : undefined),
            day: validDay,
            startPeriod: startP,
            endPeriod: endP,
            periodString: rangeDetails.periodString,
            timeSlotString: rangeDetails.timeSlotString,
            classId: matchedClass?.id,
            className: matchedClass?.name || (classRaw ? classRaw : undefined),
          });
        }

        if (parsedList.length === 0) {
          setImportError('Tidak ditemukan baris data yang cocok pada file Excel tersebut.');
          return;
        }

        setImportRows(parsedList);
      } catch (err) {
        console.error(err);
        setImportError('Gagal membaca file Excel. Pastikan format file adalah .xlsx atau .xls atau .csv yang valid.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Commit import
  const handleCommitImport = () => {
    if (importRows.length === 0) return;
    bulkAddSubjects(importRows, importReplaceMode);
    setIsImportModalOpen(false);
    setImportRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Data Mata Pelajaran & Jadwal Mengajar
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengelolaan rumpun mapel, guru pengampu, hari mengajar, dan jam pelajaran yang tersinkronisasi otomatis ke Barcode & Rekap
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            title="Unduh contoh template excel"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Format Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportRows([]);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mapel</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Mata Pelajaran</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{subjects.length}</span>
            <span className="text-xs text-slate-500">Mata Pelajaran</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rumpun PAI (Kemenag)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">
              {subjects.filter((s) => s.category === 'Pendidikan Agama Islam').length}
            </span>
            <span className="text-xs text-emerald-600">Mapel</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mapel Umum</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-700">
              {subjects.filter((s) => s.category === 'Umum').length}
            </span>
            <span className="text-xs text-blue-600">Mapel</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terhubung Guru & Jadwal</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-violet-700">
              {subjects.filter((s) => s.teacherId && s.day).length}
            </span>
            <span className="text-xs text-violet-600">Terjadwal</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran, kode, guru pengampu, atau kelas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewLayout === 'table'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel Jadwal
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewLayout === 'cards'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kartu Grid
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Kategori
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs"
            >
              <option value="all">Semua Kategori</option>
              <option value="Pendidikan Agama Islam">PAI</option>
              <option value="Umum">Umum</option>
              <option value="Muatan Lokal">Muatan Lokal</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Hari Mengajar
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs"
            >
              <option value="all">Semua Hari</option>
              {SCHOOL_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Guru Pengampu
            </label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs"
            >
              <option value="all">Semua Guru</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Kelas / Rombel
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table View */}
      {viewLayout === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-20">Kode</th>
                  <th className="py-3 px-4">Mata Pelajaran & Kelompok</th>
                  <th className="py-3 px-4">Guru Pengampu</th>
                  <th className="py-3 px-3 text-center">Hari</th>
                  <th className="py-3 px-4">Jam Mengajar (Rentang)</th>
                  <th className="py-3 px-3 text-center">Kelas</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-semibold text-slate-500">Tidak ada data mata pelajaran yang cocok.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Coba atur ulang kata kunci atau filter pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((sub, index) => {
                    const dayBadgeColor =
                      sub.day === 'Senin'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : sub.day === 'Selasa'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : sub.day === 'Rabu'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : sub.day === 'Kamis'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : sub.day === 'Jumat'
                        ? 'bg-teal-100 text-teal-800 border-teal-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200';

                    return (
                      <tr key={sub.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {sub.code || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{sub.name}</div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${
                              sub.category === 'Pendidikan Agama Islam'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.category === 'Umum'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sub.teacherName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {sub.teacherName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{sub.teacherName}</p>
                                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Pengampu Aktif
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum ditentukan</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sub.day ? (
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${dayBadgeColor}`}>
                              {sub.day}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {sub.periodString ? (
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Jam {sub.periodString}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                                {sub.timeSlotString || '-'} WIB
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sub.className ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
                              {sub.className}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sub)}
                              title="Edit Mata Pelajaran"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus mata pelajaran "${sub.name}" dari sistem dan jadwal?`)) {
                                  deleteSubject(sub.id);
                                }
                              }}
                              title="Hapus Mata Pelajaran"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Menampilkan <strong>{filteredSubjects.length}</strong> dari <strong>{subjects.length}</strong> mata pelajaran
            </span>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung otomatis ke Barcode Scan & Jadwal
            </span>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      sub.category === 'Pendidikan Agama Islam'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sub.category === 'Umum'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sub.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {sub.code || '-'}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mt-2.5">{sub.name}</h3>

                {/* Details Pill Grid */}
                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <User className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Guru Pengampu</p>
                      <p className="font-bold text-slate-800 truncate">
                        {sub.teacherName || 'Belum diatur'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] font-bold uppercase">Hari</span>
                      </div>
                      <p className="font-bold text-slate-800">{sub.day || '-'}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                        <School className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[10px] font-bold uppercase">Kelas</span>
                      </div>
                      <p className="font-bold text-slate-800">{sub.className || '-'}</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <div className="flex items-center justify-between text-emerald-800">
                      <span className="text-[10px] font-bold uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Jam Mengajar
                      </span>
                      <span className="font-bold font-mono text-xs">
                        {sub.periodString ? `Jam ${sub.periodString}` : '-'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      {sub.timeSlotString || '-'} WIB
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">ID: {sub.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus mata pelajaran ${sub.name}?`)) {
                        deleteSubject(sub.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT MATA PELAJARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">
                  {editingSub ? 'Edit Mata Pelajaran & Jadwal Mengajar' : 'Tambah Mata Pelajaran & Jadwal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
              {/* Nama & Kode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akidah Akhlak, Matematika Wajib"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kode Mapel (Singkatan)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: AKH, MAT, BIO"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kelompok / Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                    <option value="Umum">Umum (Kemendikbud)</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
              </div>

              {/* Guru Pengampu (Pilihan) */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-700" />
                    Guru Pengampu (Pilihan) *
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Tersinkron ke kartu barcode guru</span>
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
                >
                  <option value="">-- Pilih Guru Pengampu --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.nip ? `(NIP: ${t.nip})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hari Mengajar & Kelas (Pilihan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Hari Mengajar (Pilihan) *
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold"
                  >
                    {SCHOOL_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-indigo-600" />
                    Kelas / Rombel *
                  </label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.level} Kelas {c.grade})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jam Mengajar (Pilihan Jam) */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    Jam Mengajar (Pilihan Jam) *
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Sesuai jam lonceng madrasah</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                      Mulai Dari Jam Ke-
                    </label>
                    <select
                      value={startPeriod}
                      onChange={(e) => {
                        const val = e.target.value as PeriodId;
                        setStartPeriod(val);
                        // Auto-adjust endPeriod if earlier
                        const startIdx = validAttendancePeriods.findIndex((p) => p.id === val);
                        const endIdx = validAttendancePeriods.findIndex((p) => p.id === endPeriod);
                        if (startIdx !== -1 && endIdx !== -1 && endIdx < startIdx) {
                          setEndPeriod(val);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold"
                    >
                      {studyPeriodSlots.map((s) => (
                        <option key={s.id} value={s.id}>
                          Jam {s.code} ({s.startTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                      Sampai Jam Ke-
                    </label>
                    <select
                      value={endPeriod}
                      onChange={(e) => {
                        const val = e.target.value as PeriodId;
                        setEndPeriod(val);
                        // Auto-adjust startPeriod if later
                        const startIdx = validAttendancePeriods.findIndex((p) => p.id === startPeriod);
                        const endIdx = validAttendancePeriods.findIndex((p) => p.id === val);
                        if (startIdx !== -1 && endIdx !== -1 && endIdx < startIdx) {
                          setStartPeriod(val);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold"
                    >
                      {studyPeriodSlots.map((s) => (
                        <option key={s.id} value={s.id}>
                          Jam {s.code} ({s.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                  <div>
                    <span className="font-bold block">
                      Jam {formPeriodRange.periodString} ({formPeriodRange.timeSlotString} WIB)
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Durasi mengajar terhitung: {formPeriodRange.totalPeriods} Jam Pelajaran
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-200 text-emerald-800 rounded-md font-bold text-[10px] uppercase">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Notice Sinkronisasi */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Otomatis Sinkron ke Seluruh Fitur:</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Ketika guru memindai barcode / NIP pada hari <strong>{day}</strong> di jam ini, sistem langsung mengenali mapel <strong>{name || '...'}</strong> di kelas <strong>{className || '...'}</strong> dan otomatis tercatat pada rekapitulasi harian!
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingSub ? 'Simpan Perubahan' : 'Tambahkan & Sinkronkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL / SPREADSHEET */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-5 py-4 bg-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-200" />
                <div>
                  <h3 className="font-bold text-base">Import Data Mata Pelajaran & Jadwal dari Excel</h3>
                  <p className="text-[11px] text-blue-200">Mendukung file .xlsx, .xls, atau .csv</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-blue-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
              {/* Step 1: Upload File */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-blue-600 mb-2 opacity-80" />
                <p className="font-bold text-slate-800 text-sm">Pilih File Excel Jadwal Mata Pelajaran</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Unggah file Excel Anda. Sistem akan otomatis membaca nama mapel, guru pengampu, hari mengajar, jam pelajaran, dan kelas.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-md transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Pilih Berkas Excel</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Unduh Contoh Format Excel</span>
                  </button>
                </div>
              </div>

              {/* Error Box */}
              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal memproses file:</span>
                    <p className="mt-0.5">{importError}</p>
                  </div>
                </div>
              )}

              {/* Preview Table of Read Rows */}
              {importRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pratinjau Data ({importRows.length} Baris Terbaca)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Periksa data sebelum disimpan ke jadwal
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-600 uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="p-2">Kode</th>
                          <th className="p-2">Mata Pelajaran</th>
                          <th className="p-2">Guru Pengampu</th>
                          <th className="p-2">Hari</th>
                          <th className="p-2">Jam</th>
                          <th className="p-2">Kelas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importRows.map((r, i) => (
                          <tr key={i} className="hover:bg-blue-50/30">
                            <td className="p-2 font-mono font-bold text-slate-700">{r.code}</td>
                            <td className="p-2 font-bold text-slate-900">{r.name}</td>
                            <td className="p-2 text-slate-700">{r.teacherName || '-'}</td>
                            <td className="p-2 font-semibold text-blue-700">{r.day || '-'}</td>
                            <td className="p-2 font-mono text-slate-600">Jam {r.periodString || '-'}</td>
                            <td className="p-2 font-semibold text-indigo-700">{r.className || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mode options */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 block">Metode Penerapan Data:</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={!importReplaceMode}
                          onChange={() => setImportReplaceMode(false)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-700 font-medium">
                          Tambahkan ke data saat ini (gabungkan)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importReplaceMode}
                          onChange={() => setImportReplaceMode(true)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-slate-700 font-medium">
                          Gantikan semua data mata pelajaran
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importRows.length === 0}
                  onClick={handleCommitImport}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 ${
                    importRows.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Terapkan ke Jadwal ({importRows.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
