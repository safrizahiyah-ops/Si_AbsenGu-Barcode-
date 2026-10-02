import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  formatIndonesianDateShort,
  getTodayDateString,
  parsePeriodString,
  ROMAN_INDEX_ORDER,
} from '../constants/schedule';
import {
  generateWeeklyReportPdf,
  copyToGoogleDocsHtml,
  downloadCsv,
  WeeklyRecapRow,
} from '../utils/exportUtils';
import {
  CalendarRange,
  Download,
  Copy,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Timer,
} from 'lucide-react';

export const WeeklyReportView: React.FC = () => {
  const { records, teachers, settings, showToast } = useAttendance();

  // Date range default: last 7 days
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Connected period duration from settings (30/35/40/45/50 menit)
  const periodMinutes = settings.lessonDurationMinutes || 40;

  // Filter records within range
  const filteredRecords = useMemo(() => {
    return records.filter((r) => r.date >= startDate && r.date <= endDate);
  }, [records, startDate, endDate]);

  // Aggregate stats per teacher based on connected period duration and effective minutes
  const weeklyData: WeeklyRecapRow[] = useMemo(() => {
    const teacherMap = new Map<
      string,
      {
        teacherName: string;
        hadir: number;
        terlambat: number;
        terlambatMnt: number;
        izin: number;
        sakit: number;
        dinas: number;
        tidakHadir: number;
        total: number;
        totalMenit: number;
        jamEfektifMnt: number;
        izinSakitMnt: number;
        percentage: number;
        hasData: boolean;
      }
    >();

    // Initialize all registered teachers so complete overview is shown
    teachers.forEach((t) => {
      teacherMap.set(t.name, {
        teacherName: t.name,
        hadir: 0,
        terlambat: 0,
        terlambatMnt: 0,
        izin: 0,
        sakit: 0,
        dinas: 0,
        tidakHadir: 0,
        total: 0,
        totalMenit: 0,
        jamEfektifMnt: 0,
        izinSakitMnt: 0,
        percentage: 0.0,
        hasData: false,
      });
    });

    filteredRecords.forEach((rec) => {
      let row = teacherMap.get(rec.teacherName);
      if (!row) {
        row = {
          teacherName: rec.teacherName,
          hadir: 0,
          terlambat: 0,
          terlambatMnt: 0,
          izin: 0,
          sakit: 0,
          dinas: 0,
          tidakHadir: 0,
          total: 0,
          totalMenit: 0,
          jamEfektifMnt: 0,
          izinSakitMnt: 0,
          percentage: 0.0,
          hasData: false,
        };
        teacherMap.set(rec.teacherName, row);
      }

      row.hasData = true;

      // Calculate number of lesson hours for this record
      const range = parsePeriodString(rec.period);
      const sNum = ROMAN_INDEX_ORDER[range.start] || 1;
      const eNum = ROMAN_INDEX_ORDER[range.end] || sNum;
      const recHours = Math.max(1, Math.abs(eNum - sNum) + 1);
      const recMinutes = recHours * periodMinutes; // Dikonversi ke menit sesuai pengaturan

      if (rec.status === 'HADIR') {
        row.hadir += recHours;
        row.jamEfektifMnt += recMinutes;
      } else if (rec.status === 'TERLAMBAT') {
        row.terlambat += recHours;
        let late = rec.lateMinutes;
        if (!late || late <= 0) {
          const match = rec.notes?.match(/(\d+)\s*(?:menit|mnt|m\b)/i);
          late = match ? parseInt(match[1], 10) : 10;
        }
        row.terlambatMnt += late;
        row.jamEfektifMnt += Math.max(0, recMinutes - late);
      } else if (rec.status === 'IZIN') {
        row.izin += recHours;
        row.izinSakitMnt += recMinutes;
      } else if (rec.status === 'SAKIT') {
        row.sakit += recHours;
        row.izinSakitMnt += recMinutes;
      } else if (rec.status === 'DINAS/TUGAS') {
        row.dinas += recHours;
        row.jamEfektifMnt += recMinutes;
      } else if (rec.status === 'TIDAK HADIR') {
        row.tidakHadir += recHours;
      }
    });

    // Calculate percentage per teacher based on effective minutes and period duration
    const rows: WeeklyRecapRow[] = Array.from(teacherMap.values()).map((row) => {
      const total = row.hadir + row.terlambat + row.izin + row.sakit + row.dinas + row.tidakHadir;
      const totalMenit = total * periodMinutes;
      let percentage = 0.0;

      if (!row.hasData || total === 0) {
        percentage = 0.0;
      } else if (row.izin + row.sakit === total) {
        percentage = 100.0;
      } else {
        const evaluatableMinutes = totalMenit - row.izinSakitMnt;
        if (evaluatableMinutes > 0) {
          percentage = Math.min(100, Math.max(0, (row.jamEfektifMnt / evaluatableMinutes) * 100));
        } else {
          percentage = 0.0;
        }
      }

      return {
        teacherName: row.teacherName,
        hadir: row.hadir,
        terlambat: row.terlambat,
        terlambatMnt: row.terlambatMnt,
        izin: row.izin,
        sakit: row.sakit,
        dinas: row.dinas,
        tidakHadir: row.tidakHadir,
        total,
        totalMenit,
        jamEfektifMnt: row.jamEfektifMnt,
        percentage,
      };
    });

    // Sort: teachers with entries first, then alphabetical
    return rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.teacherName.localeCompare(b.teacherName);
    });
  }, [teachers, filteredRecords, periodMinutes]);

  // Overall totals
  const overall = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let terlambatMnt = 0;
    let izin = 0;
    let sakit = 0;
    let dinas = 0;
    let tidakHadir = 0;
    let total = 0;
    let totalJamEfektifMnt = 0;
    let totalEvaluatableMnt = 0;

    weeklyData.forEach((r) => {
      hadir += r.hadir;
      terlambat += r.terlambat;
      terlambatMnt += r.terlambatMnt || 0;
      izin += r.izin;
      sakit += r.sakit;
      dinas += r.dinas;
      tidakHadir += r.tidakHadir;
      total += r.total;

      const rTotalMenit = r.total * periodMinutes;
      const rExcusedMenit = (r.izin + r.sakit) * periodMinutes;
      const rEval = rTotalMenit - rExcusedMenit;
      if (rEval > 0) {
        totalEvaluatableMnt += rEval;
        totalJamEfektifMnt += r.jamEfektifMnt || 0;
      }
    });

    const percentage =
      totalEvaluatableMnt > 0
        ? (totalJamEfektifMnt / totalEvaluatableMnt) * 100
        : total > 0 && izin + sakit === total
        ? 100
        : 0;

    return {
      hadir,
      terlambat,
      terlambatMnt,
      izin,
      sakit,
      dinas,
      tidakHadir,
      total,
      percentage,
    };
  }, [weeklyData, periodMinutes]);

  const handleDownloadPdf = () => {
    generateWeeklyReportPdf(weeklyData, startDate, endDate, settings);
    showToast('Laporan Rekap Mingguan berhasil diunduh dalam format PDF.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyGoogleDocs = async () => {
    const rowsHtml = weeklyData
      .map(
        (r, i) => `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${i + 1}</td>
          <td style="border: 1px solid #000; padding: 6px;"><b>${r.teacherName}</b></td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.hadir} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.terlambat} Jam${r.terlambatMnt ? ` (${r.terlambatMnt} mnt)` : ''}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.izin} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.sakit} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.dinas} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.tidakHadir} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;"><b>${r.total} Jam (${r.total * periodMinutes} mnt)</b></td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;"><b>${r.percentage.toFixed(1).replace('.', ',')}%</b></td>
        </tr>`
      )
      .join('');

    const fullHtml = `
      <div style="font-family: Arial, sans-serif; color: #000;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${settings.schoolName}</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px;">${settings.subTitle}</p>
          <hr style="border: 1px solid #000; margin: 10px 0 20px 0;" />
          <h3 style="margin: 0; font-size: 15px; font-weight: bold;">REKAPITULASI ABSENSI GURU MINGGUAN</h3>
          <p style="margin: 5px 0 15px 0; font-size: 12px;">
            Periode: ${formatIndonesianDateShort(startDate)} s.d. ${formatIndonesianDateShort(endDate)} | Tahun Ajaran: ${settings.academicYear} | 1 Jam Pelajaran = ${periodMinutes} Menit
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">No</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left;">Nama Guru</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Hadir</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Terlambat</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Izin</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Sakit</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Dinas/Tugas</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Tidak Hadir</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">Total Jam</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">% Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #e6e6e6; font-weight: bold;">
              <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: center;">TOTAL KESELURUHAN</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.hadir} Jam</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.terlambat} Jam${overall.terlambatMnt ? ` (${overall.terlambatMnt} mnt)` : ''}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.izin} Jam</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.sakit} Jam</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.dinas} Jam</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.tidakHadir} Jam</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.total} Jam (${overall.total * periodMinutes} mnt)</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.percentage.toFixed(1).replace('.', ',')}%</td>
            </tr>
          </tfoot>
        </table>

        <table style="width: 100%; font-size: 12px; margin-top: 30px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 2px 0 60px 0; font-weight: bold;">Kepala Madrasah</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${settings.headmasterName}</p>
              <p style="margin: 2px 0 0 0;">NIP: ${settings.headmasterNip}</p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <p style="margin: 0;">Darul Mahfudz, ${formatIndonesianDateShort(new Date())}</p>
              <p style="margin: 2px 0 60px 0; font-weight: bold;">Koordinator Guru Piket</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${settings.currentPicketTeacher}</p>
              <p style="margin: 2px 0 0 0;">Petugas Piket</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    const plain =
      `${settings.schoolName}\nREKAPITULASI MINGGUAN\nPeriode: ${startDate} s.d. ${endDate} | 1 Jam = ${periodMinutes} Menit\n\n` +
      weeklyData
        .map(
          (r, i) =>
            `${i + 1}. ${r.teacherName}: Hadir=${r.hadir} Jam, Terlambat=${r.terlambat} Jam (${r.terlambatMnt || 0} mnt), Izin=${r.izin} Jam, Sakit=${r.sakit} Jam, Dinas=${r.dinas} Jam, Alpha=${r.tidakHadir} Jam, Total=${r.total} Jam (${r.total * periodMinutes} mnt) [${r.percentage.toFixed(1).replace('.', ',')}%]`
        )
        .join('\n');

    const success = await copyToGoogleDocsHtml(fullHtml, plain);
    if (success) {
      setIsCopied(true);
      showToast('Tabel Rekap Mingguan berhasil disalin ke clipboard.', 'success');
      setTimeout(() => setIsCopied(false), 4000);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Nama Guru',
      'Hadir (Jam)',
      'Terlambat (Jam)',
      'Terlambat (Menit)',
      'Izin (Jam)',
      'Sakit (Jam)',
      'Dinas/Tugas (Jam)',
      'Tidak Hadir (Jam)',
      'Total Jam',
      'Total Menit',
      '% Kehadiran',
    ];
    const rows = weeklyData.map((r, i) => [
      i + 1,
      r.teacherName,
      r.hadir,
      r.terlambat,
      r.terlambatMnt || 0,
      r.izin,
      r.sakit,
      r.dinas,
      r.tidakHadir,
      r.total,
      r.total * periodMinutes,
      `${r.percentage.toFixed(1)}%`,
    ]);

    downloadCsv(
      `REKAP_MINGGUAN_${startDate}_sd_${endDate}_DURASI_${periodMinutes}MNT.csv`,
      headers,
      rows
    );
    showToast('Berkas CSV berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Controls & Filter Bar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Rekap Mingguan Absensi Guru
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-700" />
              1 Jam = {periodMinutes} Menit (Otomatis)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Laporan kumulatif kehadiran guru dalam rentang tanggal tertentu dengan jam efektif terhubung langsung ke pengaturan
          </p>
        </div>

        {/* Date Range & Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
            />
            <span className="font-bold text-slate-600">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
            />
          </div>

          <button
            id="btn-weekly-download-pdf"
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PDF</span>
          </button>

          <button
            id="btn-weekly-copy-gdoc"
            type="button"
            onClick={handleCopyGoogleDocs}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'TERSALIN' : 'COPY KE GOOGLE DOCUMENT'}</span>
          </button>

          <button
            id="btn-weekly-print"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Ekspor CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      </div>

      {/* Legend / Color Indicator Pill Banner */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Indikator Persentase Otomatis (1 Jam = {periodMinutes} Menit):</span>
        </div>
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            🟩 ≥ 95% (Sangat Baik)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            🟨 85–94,9% (Cukup)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            🟧 70–84,9% (Perlu Perhatian)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            🟥 &lt; 70% (Kurang)
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 printable-report">
        {/* Madrasah Header for report */}
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-0.5 border border-slate-200 shrink-0 shadow-2xs overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo Darul Mahfudz"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left sm:text-center">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wider">
                {settings.schoolName}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">{settings.subTitle}</p>
              <p className="text-[11px] text-slate-500">{settings.address}</p>
            </div>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-3 underline tracking-wide uppercase">
            REKAPITULASI ABSENSI GURU MINGGUAN
          </h3>
          <p className="text-xs text-slate-700 mt-1 font-semibold flex items-center justify-center flex-wrap gap-2">
            <span>
              Periode:{' '}
              <span className="font-extrabold text-slate-900">
                {formatIndonesianDateShort(startDate)} s.d. {formatIndonesianDateShort(endDate)}
              </span>
            </span>
            <span>|</span>
            <span>
              Tahun Ajaran:{' '}
              <span className="font-extrabold text-slate-900">{settings.academicYear}</span>
            </span>
            <span>|</span>
            <span>
              Semester:{' '}
              <span className="font-extrabold text-slate-900">{settings.semester}</span>
            </span>
            <span>|</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
              1 Jam = {periodMinutes} Menit
            </span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-900">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
              <tr>
                <th className="border border-slate-900 py-2 px-2 text-center w-8">No</th>
                <th className="border border-slate-900 py-2 px-3">Nama Guru</th>
                <th className="border border-slate-900 py-2 px-2 text-center">Hadir</th>
                <th className="border border-slate-900 py-2 px-2 text-center">Terlambat</th>
                <th className="border border-slate-900 py-2 px-2 text-center">Izin</th>
                <th className="border border-slate-900 py-2 px-2 text-center">Sakit</th>
                <th className="border border-slate-900 py-2 px-2 text-center">Dinas/Tugas</th>
                <th className="border border-slate-900 py-2 px-2 text-center">Tidak Hadir</th>
                <th className="border border-slate-900 py-2 px-2 text-center">Total Jam</th>
                <th className="border border-slate-900 py-2 px-2 text-center font-extrabold">
                  % Kehadiran
                </th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((row, idx) => (
                <tr key={row.teacherName} className="hover:bg-slate-50 border-b border-slate-300">
                  <td className="border border-slate-300 py-2 px-2 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 py-2 px-3 font-bold text-slate-900">
                    {row.teacherName}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center font-semibold text-emerald-800">
                    {row.hadir > 0 ? `${row.hadir} Jam` : '0'}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-amber-700 font-medium">
                    {row.terlambat > 0
                      ? `${row.terlambat} Jam${
                          row.terlambatMnt && row.terlambatMnt > 0 ? ` (${row.terlambatMnt} mnt)` : ''
                        }`
                      : '0'}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-sky-700">
                    {row.izin > 0 ? `${row.izin} Jam` : '0'}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-violet-700">
                    {row.sakit > 0 ? `${row.sakit} Jam` : '0'}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-teal-700">
                    {row.dinas > 0 ? `${row.dinas} Jam` : '0'}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-rose-700 font-bold">
                    {row.tidakHadir > 0 ? `${row.tidakHadir} Jam` : '0'}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center font-extrabold text-slate-900">
                    {row.total > 0 ? `${row.total} Jam (${row.total * periodMinutes} mnt)` : '-'}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center font-extrabold">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md font-mono ${
                        row.percentage >= 95
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.percentage >= 85
                          ? 'bg-amber-100 text-amber-800'
                          : row.percentage >= 70
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {row.percentage.toFixed(1).replace('.', ',')}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-900">
                <td colSpan={2} className="border border-slate-900 py-2.5 px-3 text-center">
                  TOTAL KESELURUHAN
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-emerald-900">
                  {overall.hadir} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-amber-900">
                  {overall.terlambat} Jam{overall.terlambatMnt ? ` (${overall.terlambatMnt} mnt)` : ''}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-sky-900">
                  {overall.izin} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-violet-900">
                  {overall.sakit} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-teal-900">
                  {overall.dinas} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-rose-900">
                  {overall.tidakHadir} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center">
                  {overall.total} Jam ({overall.total * periodMinutes} mnt)
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center font-black text-sm">
                  {overall.percentage.toFixed(1).replace('.', ',')}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-xs sm:text-sm">
          <div>
            <p className="font-medium">Mengetahui,</p>
            <p className="font-bold">Kepala Madrasah</p>
            <div className="h-20" />
            <p className="font-black underline">{settings.headmasterName}</p>
            <p className="text-slate-600">NIP: {settings.headmasterNip}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">
              Darul Mahfudz, {formatIndonesianDateShort(new Date())}
            </p>
            <p className="font-bold">Koordinator Guru Piket</p>
            <div className="h-20" />
            <p className="font-black underline">{settings.currentPicketTeacher}</p>
            <p className="text-slate-600">Petugas Piket</p>
          </div>
        </div>
      </div>
    </div>
  );
};
