import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  formatIndonesianDate,
  formatIndonesianDateShort,
  getTodayDateString,
  INDONESIAN_MONTHS,
} from '../constants/schedule';
import {
  generateDailyReportPdf,
  generateWeeklyReportPdf,
  generateMonthlyReportPdf,
  copyToGoogleDocsHtml,
  downloadCsv,
  WeeklyRecapRow,
  MonthlyRecapRow,
} from '../utils/exportUtils';
import { downloadAllTeacherCardsPdf } from '../utils/barcodeUtils';
import {
  Printer,
  FileText,
  Calendar,
  CalendarRange,
  CalendarDays,
  Download,
  Copy,
  CheckCircle,
  ShieldCheck,
  QrCode,
  Barcode,
  IdCard,
} from 'lucide-react';

export const PrintHubView: React.FC = () => {
  const { records, teachers, settings, showToast, setActiveTab } = useAttendance();

  // Daily report state
  const [dailyDate, setDailyDate] = useState<string>(getTodayDateString());

  // Weekly report state
  const [weekStart, setWeekStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [weekEnd, setWeekEnd] = useState<string>(getTodayDateString());

  // Monthly report state
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth());
  const [year, setYear] = useState<number>(now.getFullYear());

  // Daily PDF
  const handleDailyPdf = () => {
    const dailyRecords = records.filter((r) => r.date === dailyDate);
    generateDailyReportPdf(dailyRecords, dailyDate, settings);
    showToast(`PDF Rekap Harian (${dailyDate}) berhasil diunduh.`, 'success');
  };

  // Weekly PDF
  const handleWeeklyPdf = () => {
    const filtered = records.filter((r) => r.date >= weekStart && r.date <= weekEnd);
    const teacherMap = new Map<string, WeeklyRecapRow>();

    teachers.forEach((t) => {
      teacherMap.set(t.name, {
        teacherName: t.name,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        dinas: 0,
        tidakHadir: 0,
        total: 0,
        percentage: 100,
      });
    });

    filtered.forEach((r) => {
      let item = teacherMap.get(r.teacherName);
      if (!item) {
        item = {
          teacherName: r.teacherName,
          hadir: 0,
          terlambat: 0,
          izin: 0,
          sakit: 0,
          dinas: 0,
          tidakHadir: 0,
          total: 0,
          percentage: 100,
        };
        teacherMap.set(r.teacherName, item);
      }
      item.total++;
      if (r.status === 'HADIR') item.hadir++;
      else if (r.status === 'TERLAMBAT') item.terlambat++;
      else if (r.status === 'IZIN') item.izin++;
      else if (r.status === 'SAKIT') item.sakit++;
      else if (r.status === 'DINAS/TUGAS') item.dinas++;
      else if (r.status === 'TIDAK HADIR') item.tidakHadir++;
    });

    const rows = Array.from(teacherMap.values()).map((r) => {
      const active = r.hadir + r.terlambat + r.dinas;
      const percentage = r.total > 0 ? (active / r.total) * 100 : 100;
      return { ...r, percentage };
    });

    generateWeeklyReportPdf(rows, weekStart, weekEnd, settings);
    showToast(`PDF Rekap Mingguan berhasil diunduh.`, 'success');
  };

  // Monthly PDF
  const handleMonthlyPdf = () => {
    const monthName = INDONESIAN_MONTHS[month];
    const filtered = records.filter((r) => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const teacherMap = new Map<string, MonthlyRecapRow>();

    teachers.forEach((t) => {
      teacherMap.set(t.name, {
        teacherName: t.name,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        dinas: 0,
        tidakHadir: 0,
        total: 0,
        percentage: 100,
      });
    });

    filtered.forEach((r) => {
      let item = teacherMap.get(r.teacherName);
      if (!item) {
        item = {
          teacherName: r.teacherName,
          hadir: 0,
          terlambat: 0,
          izin: 0,
          sakit: 0,
          dinas: 0,
          tidakHadir: 0,
          total: 0,
          percentage: 100,
        };
        teacherMap.set(r.teacherName, item);
      }
      item.total++;
      if (r.status === 'HADIR') item.hadir++;
      else if (r.status === 'TERLAMBAT') item.terlambat++;
      else if (r.status === 'IZIN') item.izin++;
      else if (r.status === 'SAKIT') item.sakit++;
      else if (r.status === 'DINAS/TUGAS') item.dinas++;
      else if (r.status === 'TIDAK HADIR') item.tidakHadir++;
    });

    const rows = Array.from(teacherMap.values()).map((r) => {
      const active = r.hadir + r.terlambat + r.dinas;
      const percentage = r.total > 0 ? (active / r.total) * 100 : 100;
      return { ...r, percentage };
    });

    generateMonthlyReportPdf(rows, monthName, year, settings);
    showToast(`PDF Rekap Bulanan (${monthName} ${year}) berhasil diunduh.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-700" />
            Pusat Cetak & Unduh Laporan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh laporan resmi dalam format PDF standar madrasah, cetak fisik, atau salin ke Google Docs
          </p>
        </div>
      </div>

      {/* 3 Main Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Harian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Laporan Rekap Harian</h2>
            <p className="text-xs text-slate-500 mt-1">
              Daftar kehadiran guru per jam (I-IX) pada tanggal terpilih lengkap dengan tanda tangan Kepala Madrasah & Guru Piket.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Pilih Tanggal:
              </label>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleDailyPdf}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Resmi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('daily_recap')}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <span>Buka Tampilan Harian</span>
            </button>
          </div>
        </div>

        {/* Card 2: Mingguan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-3">
              <CalendarRange className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Laporan Rekap Mingguan</h2>
            <p className="text-xs text-slate-500 mt-1">
              Rekapitulasi kumulatif total jam hadir, terlambat, izin, sakit, dinas, dan persentase kehadiran per guru.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Dari Tanggal:
                </label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Sampai Tanggal:
                </label>
                <input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleWeeklyPdf}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Mingguan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weekly_recap')}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <span>Buka Tampilan Mingguan</span>
            </button>
          </div>
        </div>

        {/* Card 3: Bulanan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 mb-3">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Laporan Rekap Bulanan</h2>
            <p className="text-xs text-slate-500 mt-1">
              Rekapitulasi bulanan resmi dewan guru untuk arsip pembinaan kepegawaian dan laporan berkala madrasah.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Bulan:
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-2 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                >
                  {INDONESIAN_MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Tahun:
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-2 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleMonthlyPdf}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Bulanan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly_recap')}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <span>Buka Tampilan Bulanan</span>
            </button>
          </div>
        </div>

        {/* Card 4: Kartu & Barcode Presensi Guru */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 mb-3">
              <IdCard className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Kartu & Barcode Guru</h2>
            <p className="text-xs text-slate-500 mt-1">
              Cetak lembar kartu ID presensi berbarcode otomatis untuk seluruh {teachers.length} dewan guru MA/MTs Darul Mahfudz.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 p-2.5 bg-teal-50/70 rounded-xl border border-teal-200/80 text-[11px] text-teal-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Mencakup Barcode 1D (Code128), QR Code resmi, Logo madrasah, dan data NIP pengampu.</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadAllTeacherCardsPdf(teachers, settings);
                  showToast('Seluruh kartu barcode guru berhasil dicetak ke PDF.', 'success');
                } catch (e) {
                  showToast('Gagal membuat PDF kartu barcode.', 'error');
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Semua Kartu Guru (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('master_teachers')}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <span>Kelola Guru & Unduh Satuan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
