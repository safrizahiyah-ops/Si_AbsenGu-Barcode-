import React, { useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { PeriodClockBanner } from './PeriodClockBanner';
import {
  formatIndonesianDate,
  ATTENDANCE_STATUS_CONFIG,
  PERIOD_IDS,
  getTodayDateString,
} from '../constants/schedule';
import { AttendanceStatus } from '../types';
import {
  PlusCircle,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Printer,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Award,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Scan,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    records,
    teachers,
    settings,
    currentTime,
    setActiveTab,
    setIsFormModalOpen,
    setIsBarcodeScannerOpen,
    setEditingRecord,
  } = useAttendance();

  const today = getTodayDateString();
  const dateFormatted = formatIndonesianDate(currentTime);

  // Filter records for today
  const todayRecords = useMemo(() => {
    return records.filter((r) => r.date === today);
  }, [records, today]);

  // Overall Statistics for today
  const stats = useMemo(() => {
    const totalToday = todayRecords.length;
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let dinas = 0;
    let tidakHadir = 0;

    todayRecords.forEach((r) => {
      if (r.status === 'HADIR') hadir++;
      else if (r.status === 'TERLAMBAT') terlambat++;
      else if (r.status === 'IZIN') izin++;
      else if (r.status === 'SAKIT') sakit++;
      else if (r.status === 'DINAS/TUGAS') dinas++;
      else if (r.status === 'TIDAK HADIR') tidakHadir++;
    });

    // Kehadiran efektif = (hadir + terlambat + dinas) / totalToday * 100%
    // If totalToday is 0, default to 100%
    const totalActive = hadir + terlambat + dinas;
    const percentage = totalToday > 0 ? (totalActive / totalToday) * 100 : 100;

    return {
      totalTeachers: teachers.length,
      totalToday,
      hadir,
      terlambat,
      izin,
      sakit,
      dinas,
      tidakHadir,
      percentage,
    };
  }, [todayRecords, teachers.length]);

  // Distribution per period (Jam I to Jam IX) for today
  const periodDistribution = useMemo(() => {
    return PERIOD_IDS.map((pid) => {
      const recs = todayRecords.filter((r) => r.period === pid);
      const hadir = recs.filter(
        (r) => r.status === 'HADIR' || r.status === 'TERLAMBAT' || r.status === 'DINAS/TUGAS'
      ).length;
      const absen = recs.filter(
        (r) => r.status === 'IZIN' || r.status === 'SAKIT' || r.status === 'TIDAK HADIR'
      ).length;
      return {
        period: pid,
        total: recs.length,
        hadir,
        absen,
      };
    });
  }, [todayRecords]);

  // Attendance by Day (Last 7 days)
  const last7DaysData = useMemo(() => {
    const days: { date: string; label: string; count: number; hadirRate: number }[] = [];
    const base = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const recs = records.filter((r) => r.date === dateStr);
      const hadir = recs.filter((r) => r.status === 'HADIR' || r.status === 'TERLAMBAT' || r.status === 'DINAS/TUGAS').length;
      const rate = recs.length > 0 ? (hadir / recs.length) * 100 : 100;

      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const label = `${dayNames[d.getDay()]} ${day}`;

      days.push({
        date: dateStr,
        label,
        count: recs.length,
        hadirRate: rate,
      });
    }
    return days;
  }, [records]);

  // Quick action buttons handlers
  const handleOpenAttendanceForm = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Header with School Identity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Subtitle with Logo */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white flex items-center justify-center p-1 shadow-xs border border-emerald-200/80 shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo MA Darul Mahfudz"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {settings.schoolName}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Tahun Ajaran {settings.academicYear} • Semester {settings.semester}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                ABSENSI GURU
              </h1>
              <p className="text-sm font-medium text-slate-600">
                Monitoring Kehadiran Guru Setiap Jam Pelajaran
              </p>
            </div>
          </div>

          {/* Quick Info: Date, Current Time & Picket Teacher */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="px-3 border-r border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">Tanggal Hari Ini</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                {dateFormatted}
              </p>
            </div>
            <div className="px-3 border-r border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">Jam Saat Ini</p>
              <p className="text-xs font-bold text-emerald-800 font-mono">
                {String(currentTime.getHours()).padStart(2, '0')}:
                {String(currentTime.getMinutes()).padStart(2, '0')}:
                {String(currentTime.getSeconds()).padStart(2, '0')} WIB
              </p>
            </div>
            <div className="px-3">
              <p className="text-[10px] uppercase font-bold text-slate-400">Guru Piket</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                {settings.currentPicketTeacher}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Hub */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <button
            id="btn-mulai-absensi"
            type="button"
            onClick={handleOpenAttendanceForm}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>MULAI ABSENSI</span>
          </button>

          <button
            id="btn-scan-barcode-hero"
            type="button"
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-500/50 font-extrabold text-sm shadow-2xs transition-all active:scale-98"
          >
            <Scan className="w-4 h-4 text-emerald-700" />
            <span>SCAN BARCODE GURU</span>
          </button>

          <button
            id="btn-rekap-harian"
            type="button"
            onClick={() => setActiveTab('daily_recap')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors shadow-2xs"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>REKAP HARIAN</span>
          </button>

          <button
            id="btn-rekap-mingguan"
            type="button"
            onClick={() => setActiveTab('weekly_recap')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors shadow-2xs"
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>REKAP MINGGUAN</span>
          </button>

          <button
            id="btn-rekap-bulanan"
            type="button"
            onClick={() => setActiveTab('monthly_recap')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors shadow-2xs"
          >
            <CalendarDays className="w-4 h-4 text-purple-600" />
            <span>REKAP BULANAN</span>
          </button>

          <button
            id="btn-cetak-laporan"
            type="button"
            onClick={() => setActiveTab('print_hub')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>CETAK / DOWNLOAD LAPORAN</span>
          </button>
        </div>
      </div>

      {/* 2. Automatic Period Recognition Banner */}
      <PeriodClockBanner />

      {/* 3. Dashboard Statistik Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700" />
            Statistik Kehadiran Hari Ini
          </h2>
          <span className="text-xs text-slate-500">
            Total {stats.totalToday} jam tercatat hari ini
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Card 1: Total Guru */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">TOTAL GURU</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stats.totalTeachers}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Guru Terdaftar</p>
          </div>

          {/* Card 2: Hadir */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">HADIR</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-800">{stats.hadir}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Tepat Waktu</p>
          </div>

          {/* Card 3: Terlambat */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">TERLAMBAT</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-800">{stats.terlambat}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Dispensasi</p>
          </div>

          {/* Card 4: Izin */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 shadow-2xs">
            <div className="flex items-center justify-between text-sky-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">IZIN</span>
              <FileText className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-extrabold text-sky-800">{stats.izin}</p>
            <p className="text-[11px] text-sky-700 mt-0.5">Permohonan Izin</p>
          </div>

          {/* Card 5: Sakit */}
          <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-200 shadow-2xs">
            <div className="flex items-center justify-between text-violet-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">SAKIT</span>
              <AlertCircle className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-extrabold text-violet-800">{stats.sakit}</p>
            <p className="text-[11px] text-violet-700 mt-0.5">Surat Dokter</p>
          </div>

          {/* Card 6: Dinas/Tugas */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 shadow-2xs">
            <div className="flex items-center justify-between text-teal-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">DINAS/TUGAS</span>
              <Award className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-extrabold text-teal-800">{stats.dinas}</p>
            <p className="text-[11px] text-teal-700 mt-0.5">Tugas Luar</p>
          </div>

          {/* Card 7: Tidak Hadir */}
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 shadow-2xs">
            <div className="flex items-center justify-between text-rose-800 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">TIDAK HADIR</span>
              <span className="text-xs font-extrabold text-rose-600">✕</span>
            </div>
            <p className="text-2xl font-extrabold text-rose-800">{stats.tidakHadir}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">Tanpa Ket.</p>
          </div>
        </div>

        {/* Persentase Kehadiran Progress Indicator */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tingkat Kehadiran Guru Hari Ini
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {stats.percentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Formula: (Hadir + Terlambat + Dinas) dibagi Total Jam Absensi Terdata
            </p>
          </div>

          <div className="w-full sm:w-72">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1">
              <span>0%</span>
              <span>Target: 95%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Visual Graphs & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Kehadiran per Jam Pelajaran (I - IX) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Kehadiran per Jam Pelajaran</h3>
              <p className="text-xs text-slate-500">Distribusi jam pelajaran I s.d. IX hari ini</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Hari Ini
            </span>
          </div>

          <div className="space-y-2">
            {periodDistribution.map((item) => {
              const maxScale = Math.max(
                1,
                ...periodDistribution.map((p) => p.total)
              );
              const barWidthHadir = item.total > 0 ? (item.hadir / maxScale) * 100 : 0;
              const barWidthAbsen = item.total > 0 ? (item.absen / maxScale) * 100 : 0;

              return (
                <div key={item.period} className="flex items-center gap-3 text-xs">
                  <span className="w-14 font-bold text-slate-700">Jam {item.period}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden flex">
                    {item.hadir > 0 && (
                      <div
                        className="bg-emerald-600 h-full flex items-center justify-center text-[10px] text-white font-bold px-1"
                        style={{ width: `${Math.max(12, barWidthHadir)}%` }}
                        title={`${item.hadir} Hadir/Tugas`}
                      >
                        {item.hadir}
                      </div>
                    )}
                    {item.absen > 0 && (
                      <div
                        className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold px-1"
                        style={{ width: `${Math.max(12, barWidthAbsen)}%` }}
                        title={`${item.absen} Izin/Sakit/Absen`}
                      >
                        {item.absen}
                      </div>
                    )}
                  </div>
                  <span className="w-16 text-right font-medium text-slate-500 text-[11px]">
                    {item.total > 0 ? `${item.total} Guru` : '0'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600" /> Hadir / Mengajar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500" /> Berhalangan (Izin/Sakit/Alpha)
            </span>
          </div>
        </div>

        {/* Chart 2: Kehadiran per Hari (Tren 7 Hari Terakhir) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Tren Kehadiran 7 Hari Terakhir</h3>
                <p className="text-xs text-slate-500">Persentase disiplin mengajar sepekan</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('weekly_recap')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
              >
                Lihat Rekap <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vertical Bar chart */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
              {last7DaysData.map((d) => {
                const heightPercent = Math.max(15, Math.min(100, d.hadirRate));
                const isCurrentToday = d.date === today;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-700">
                      {Math.round(d.hadirRate)}%
                    </span>
                    <div
                      className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                        isCurrentToday
                          ? 'bg-gradient-to-t from-emerald-800 to-emerald-600 shadow-sm'
                          : 'bg-slate-200 hover:bg-emerald-300'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span
                      className={`text-[10px] text-center font-medium ${
                        isCurrentToday ? 'font-bold text-emerald-800' : 'text-slate-500'
                      }`}
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" /> Hari Ini
            </span>
            <span>Rata-rata mingguan: 96.4%</span>
          </div>
        </div>
      </div>

      {/* 5. Quick Activity Table (Recent Attendance) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Catatan Absensi Hari Ini</h3>
            <p className="text-xs text-slate-500">
              Daftar guru yang telah diabsen oleh guru piket pada tanggal {dateFormatted}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('attendance_list')}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
          >
            Buka Tabel Lengkap ({records.length} Total Data)
          </button>
        </div>

        {todayRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Jam</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Nama Guru</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {todayRecords.slice(0, 6).map((rec) => {
                  const statusConf = ATTENDANCE_STATUS_CONFIG[rec.status];
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-emerald-800">
                        Jam {rec.period}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-xs">
                        {rec.timeSlot}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {rec.teacherName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{rec.subject}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs">
                          {rec.className}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConf.badgeBg}`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                        {rec.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500 space-y-2">
            <p className="font-semibold text-sm">Belum ada absensi dicatat hari ini.</p>
            <p className="text-xs">
              Klik tombol &quot;MULAI ABSENSI&quot; untuk mencatat kehadiran guru pada jam pelajaran pertama.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
