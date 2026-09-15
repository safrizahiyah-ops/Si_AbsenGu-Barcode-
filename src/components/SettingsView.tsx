import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { AppSettings } from '../types';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  UserCheck,
  Building2,
  CheckCircle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSampleData,
    exportDataJson,
    importDataJson,
    showToast,
  } = useAttendance();

  const [formSettings, setFormSettings] = useState<AppSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Synchronize form if settings updated externally or on reset
  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof AppSettings, val: string) => {
    setFormSettings((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setIsSaved(true);
    showToast('Pengaturan madrasah berhasil disimpan.', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Restore data from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataJson(content);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      confirm(
        'Apakah Anda yakin ingin mengatur ulang data ke data percontohan awal? Data yang belum dicadangkan akan tertimpa.'
      )
    ) {
      resetToSampleData();
      setFormSettings({
        schoolName: 'MA DARUL MAHFUDZ',
        subTitle: 'Madrasah Aliyah & Madrasah Tsanawiyah Darul Mahfudz',
        institutionType: 'Madrasah Aliyah & Tsanawiyah',
        address: 'Jl. KH. Mahfudz No. 01, Komplek Pesantren Darul Mahfudz',
        academicYear: '2024/2025',
        semester: 'Genap',
        headmasterName: 'Drs. H. Ahmad Shodiq, M.Pd.I',
        headmasterNip: '19710512 199803 1 002',
        currentPicketTeacher: 'Ust. Muhammad Rizqi, S.Pd',
        picketTeam: 'Tim Piket Harian Darul Mahfudz',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            Pengaturan Sistem & Madrasah
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas lembaga, kepala madrasah, guru piket bertugas, dan pencadangan data
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Identitas Lembaga & Kop Surat
          </h2>
          <p className="text-xs text-slate-500">
            Nama madrasah dan alamat akan tercantum pada kop surat seluruh laporan resmi PDF
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Madrasah *
            </label>
            <input
              type="text"
              required
              value={formSettings.schoolName}
              onChange={(e) => handleChange('schoolName', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Sub-Judul / Jenjang Pendidikan
            </label>
            <input
              type="text"
              value={formSettings.subTitle}
              onChange={(e) => handleChange('subTitle', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Alamat Lengkap Madrasah
            </label>
            <input
              type="text"
              value={formSettings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={formSettings.academicYear}
              onChange={(e) => handleChange('academicYear', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Semester
            </label>
            <select
              value={formSettings.semester}
              onChange={(e) => handleChange('semester', e.target.value as 'Ganjil' | 'Genap')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>

        {/* Pejabat Penandatangan */}
        <div className="border-b border-slate-100 pt-4 pb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            Pejabat Pengesah Laporan
          </h2>
          <p className="text-xs text-slate-500">
            Nama Kepala Madrasah dan Guru Piket bertugas untuk kolom tanda tangan laporan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Kepala Madrasah *
            </label>
            <input
              type="text"
              required
              value={formSettings.headmasterName}
              onChange={(e) => handleChange('headmasterName', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              NIP Kepala Madrasah
            </label>
            <input
              type="text"
              value={formSettings.headmasterNip}
              onChange={(e) => handleChange('headmasterNip', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Guru Piket Hari Ini (Default)
            </label>
            <input
              type="text"
              value={formSettings.currentPicketTeacher}
              onChange={(e) => handleChange('currentPicketTeacher', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Otomatis mengisi kolom "Guru Piket" saat form absensi baru dibuka.
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* Backup, Restore & Reset Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Cadangan & Pemulihan Data (Backup & Restore)
          </h2>
          <p className="text-xs text-slate-500">
            Seluruh data tersimpan secara lokal dan aman di browser. Anda dapat mengekspor cadangan berkala ke berkas JSON.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Backup */}
          <button
            type="button"
            onClick={exportDataJson}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <Download className="w-4 h-4" />
              <span>Cadangkan Data (JSON)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Unduh seluruh riwayat absensi, daftar guru, mata pelajaran, dan pengaturan ke komputer Anda.
            </p>
          </button>

          {/* Restore */}
          <label className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
              <Upload className="w-4 h-4" />
              <span>Pulihkan Data (Restore)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Unggah file JSON cadangan untuk memulihkan kembali seluruh data absensi.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* Reset sample */}
          <button
            type="button"
            onClick={handleReset}
            className="p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-left transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <RotateCcw className="w-4 h-4" />
              <span>Reset Data Contoh</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Muat ulang data contoh lengkap (Jadwal I-IX, dewan guru, riwayat absensi hari ini).
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
