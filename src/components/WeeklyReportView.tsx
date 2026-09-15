import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  formatIndonesianDateShort,
  getTodayDateString,
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

  // Filter records within range
  const filteredRecords = useMemo(() => {
    return records.filter((r) => r.date >= startDate && r.date <= endDate);
  }, [records, startDate, endDate]);

  // Aggregate stats per teacher
  const weeklyData: WeeklyRecapRow[] = useMemo(() => {
    // Map of teacherId or teacherName to stats
    const teacherMap = new Map<string, WeeklyRecapRow>();

    // Initialize all registered teachers so complete overview is shown
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

    filteredRecords.forEach((rec) => {
      let row = teacherMap.get(rec.teacherName);
      if (!row) {
        row = {
          teacherName: rec.teacherName,
          hadir: 0,
          terlambat: 0,
          izin: 0,
          sakit: 0,
          dinas: 0,
          tidakHadir: 0,
          total: 0,
          percentage: 100,
        };
        teacherMap.set(rec.teacherName, row);
      }

      row.total += 1;
      if (rec.status === 'HADIR') row.hadir += 1;
      else if (rec.status === 'TERLAMBAT') row.terlambat += 1;
      else if (rec.status === 'IZIN') row.izin += 1;
      else if (rec.status === 'SAKIT') row.sakit += 1;
      else if (rec.status === 'DINAS/TUGAS') row.dinas += 1;
      else if (rec.status === 'TIDAK HADIR') row.tidakHadir += 1;
    });

    // Calculate percentage
    const rows = Array.from(teacherMap.values()).map((row) => {
      const active = row.hadir + row.terlambat + row.dinas;
      const percentage = row.total > 0 ? (active / row.total) * 100 : 100;
      return {
        ...row,
        percentage,
      };
    });

    // Sort: teachers with entries first, then alphabetical
    return rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.teacherName.localeCompare(b.teacherName);
    });
  }, [teachers, filteredRecords]);

  // Overall totals
  const overall = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let dinas = 0;
    let tidakHadir = 0;
    let total = 0;

    weeklyData.forEach((r) => {
      hadir += r.hadir;
      terlambat += r.terlambat;
      izin += r.izin;
      sakit += r.sakit;
      dinas += r.dinas;
      tidakHadir += r.tidakHadir;
      total += r.total;
    });

    const active = hadir + terlambat + dinas;
    const percentage = total > 0 ? (active / total) * 100 : 100;

    return { hadir, terlambat, izin, sakit, dinas, tidakHadir, total, percentage };
  }, [weeklyData]);

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
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.hadir}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.terlambat}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.izin}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.sakit}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.dinas}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.tidakHadir}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;"><b>${r.total}</b></td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;"><b>${r.percentage.toFixed(1)}%</b></td>
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
          <p style="margin: 5px 0 15px 0; font-size: 12px;">Periode: ${formatIndonesianDateShort(startDate)} s.d. ${formatIndonesianDateShort(endDate)}</p>
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
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.hadir}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.terlambat}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.izin}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.sakit}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.dinas}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.tidakHadir}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.total}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${overall.percentage.toFixed(1)}%</td>
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

    const plain = `${settings.schoolName}\nREKAPITULASI MINGGUAN\nPeriode: ${startDate} s.d. ${endDate}\n\n` +
      weeklyData.map((r, i) => `${i + 1}. ${r.teacherName}: Hadir=${r.hadir}, Terlambat=${r.terlambat}, Izin=${r.izin}, Sakit=${r.sakit}, Dinas=${r.dinas}, Alpha=${r.tidakHadir} (${r.percentage.toFixed(1)}%)`).join('\n');

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
      'Hadir',
      'Terlambat',
      'Izin',
      'Sakit',
      'Dinas/Tugas',
      'Tidak Hadir',
      'Total Jam',
      '% Kehadiran',
    ];
    const rows = weeklyData.map((r, i) => [
      i + 1,
      r.teacherName,
      r.hadir,
      r.terlambat,
      r.izin,
      r.sakit,
      r.dinas,
      r.tidakHadir,
      r.total,
      `${r.percentage.toFixed(1)}%`,
    ]);
    downloadCsv(`Rekap-Absensi-Mingguan-${startDate}-sd-${endDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Rekap Mingguan Absensi Guru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan kumulatif kehadiran guru dalam rentang tanggal tertentu
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
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wider">{settings.schoolName}</h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">{settings.subTitle}</p>
              <p className="text-[11px] text-slate-500">{settings.address}</p>
            </div>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-3 underline">
            REKAPITULASI ABSENSI GURU MINGGUAN
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Periode: {formatIndonesianDateShort(startDate)} s.d. {formatIndonesianDateShort(endDate)}
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
                    {row.hadir}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-amber-700">
                    {row.terlambat}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-sky-700">
                    {row.izin}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-violet-700">
                    {row.sakit}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-teal-700">
                    {row.dinas}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center text-rose-700 font-bold">
                    {row.tidakHadir}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center font-extrabold text-slate-900">
                    {row.total}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center font-extrabold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-sm ${
                        row.percentage >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.percentage >= 75
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {row.percentage.toFixed(1)}%
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
                  {overall.hadir}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-amber-900">
                  {overall.terlambat}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-sky-900">
                  {overall.izin}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-violet-900">
                  {overall.sakit}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-teal-900">
                  {overall.dinas}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-rose-900">
                  {overall.tidakHadir}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center">
                  {overall.total}
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center font-black">
                  {overall.percentage.toFixed(1)}%
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
