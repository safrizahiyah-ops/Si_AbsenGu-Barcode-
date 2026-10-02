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
  Clock,
  Sparkles,
  Timer,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    syncAllPeriodSlotsDuration,
    resetToSampleData,
    exportDataJson,
    importDataJson,
    showToast,
  } = useAttendance();

  const [formSettings, setFormSettings] = useState<AppSettings>({
    ...settings,
    lessonDurationMinutes: settings.lessonDurationMinutes || 40,
  });
  const [syncScheduleDuration, setSyncScheduleDuration] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Synchronize form if settings updated externally or on reset
  useEffect(() => {
    setFormSettings({
      ...settings,
      lessonDurationMinutes: settings.lessonDurationMinutes || 40,
    });
  }, [settings]);

  const handleChange = (field: keyof AppSettings, val: any) => {
    setFormSettings((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleDurationSelect = (mins: number) => {
    setFormSettings((prev) => ({
      ...prev,
      lessonDurationMinutes: mins,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = formSettings.lessonDurationMinutes || 40;
    updateSettings({
      ...formSettings,
      lessonDurationMinutes: duration,
    });
    if (syncScheduleDuration) {
      syncAllPeriodSlotsDuration(duration);
    }
    setIsSaved(true);
    showToast('Pengaturan madrasah & durasi jam pelajaran berhasil disimpan.', 'success');
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

        {/* Durasi Jam Pelajaran - Terhubung Otomatis ke Seluruh Rekap */}
        <div className="border-b border-slate-100 pt-4 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              Durasi Standar Jam Pelajaran (Terhubung ke Semua Laporan Rekap)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              Otomatis & Terhubung
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tentukan durasi 1 jam pelajaran (30/35/40/45/50 menit). Nilai ini otomatis digunakan untuk rumus jam efektif dan persentase kehadiran di Rekapitulasi Harian & Mingguan.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Pilih Durasi Jam Pelajaran:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[30, 35, 40, 45, 50].map((mins) => {
                const isSelected = (formSettings.lessonDurationMinutes || 40) === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationSelect(mins)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/50 scale-[1.02]'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span className="text-sm font-black">{mins} Menit</span>
                    <span className={`text-[10px] font-normal ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {mins === 40 ? 'Standar MA' : mins === 45 ? 'Standar SMA' : mins === 30 ? 'Khusus Ramadhan' : 'Kustom'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration Input if needed */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs font-bold text-slate-700">Atau Durasi Kustom:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="120"
                value={formSettings.lessonDurationMinutes || 40}
                onChange={(e) => handleDurationSelect(parseInt(e.target.value, 10) || 40)}
                className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 text-center font-bold text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <span className="text-xs font-semibold text-slate-600">Menit per Jam</span>
            </div>
          </div>

          {/* Live Formula Preview Box */}
          <div className="p-3.5 rounded-xl bg-white border border-emerald-200/90 text-xs text-slate-700 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <Timer className="w-4 h-4 text-emerald-700" />
              <span>Simulasi Rumus Terhubung Langsung:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">1 Jam Mengajar:</span>{' '}
                <strong className="text-slate-900">{formSettings.lessonDurationMinutes || 40} Menit</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">2 Jam Mengajar:</span>{' '}
                <strong className="text-slate-900">{(formSettings.lessonDurationMinutes || 40) * 2} Menit</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">3 Jam Mengajar:</span>{' '}
                <strong className="text-slate-900">{(formSettings.lessonDurationMinutes || 40) * 3} Menit</strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              <strong>Contoh Penghitungan:</strong> Jadwal 2 jam ({(formSettings.lessonDurationMinutes || 40) * 2} mnt) jika guru terlambat 10 menit → Jam Efektif = {(formSettings.lessonDurationMinutes || 40) * 2 - 10} mnt → % Kehadiran otomatis menjadi{' '}
              <strong className="text-emerald-800 font-bold font-mono">
                {((((formSettings.lessonDurationMinutes || 40) * 2 - 10) / ((formSettings.lessonDurationMinutes || 40) * 2)) * 100).toFixed(1).replace('.', ',')}%
              </strong>.
            </p>
          </div>

          {/* Sync schedule checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={syncScheduleDuration}
              onChange={(e) => setSyncScheduleDuration(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-emerald-600 rounded-md focus:ring-emerald-500"
            />
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">
                Sinkronkan juga durasi jam pelajaran pada menu "Jadwal Pelajaran"
              </span>
              <p className="text-slate-500 text-[11px]">
                Jika dicentang, seluruh jam KBM pada jadwal utama otomatis diperbarui ke durasi {formSettings.lessonDurationMinutes || 40} menit secara berurutan.
              </p>
            </div>
          </label>
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
