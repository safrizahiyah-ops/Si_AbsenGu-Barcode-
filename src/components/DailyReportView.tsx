import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  formatIndonesianDate,
  formatIndonesianDateShort,
  getTodayDateString,
  ATTENDANCE_STATUS_CONFIG,
} from '../constants/schedule';
import {
  generateDailyReportPdf,
  copyToGoogleDocsHtml,
  downloadCsv,
} from '../utils/exportUtils';
import {
  Calendar,
  Download,
  Copy,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const { records, settings, showToast } = useAttendance();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Filter records for selected date and sort by period
  const dailyRecords = useMemo(() => {
    const periodOrder: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9,
    };
    return records
      .filter((r) => r.date === selectedDate)
      .sort((a, b) => (periodOrder[a.period] || 0) - (periodOrder[b.period] || 0));
  }, [records, selectedDate]);

  // Statistics for this day
  const stats = useMemo(() => {
    const total = dailyRecords.length;
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let dinas = 0;
    let tidakHadir = 0;

    dailyRecords.forEach((r) => {
      if (r.status === 'HADIR') hadir++;
      else if (r.status === 'TERLAMBAT') terlambat++;
      else if (r.status === 'IZIN') izin++;
      else if (r.status === 'SAKIT') sakit++;
      else if (r.status === 'DINAS/TUGAS') dinas++;
      else if (r.status === 'TIDAK HADIR') tidakHadir++;
    });

    const active = hadir + terlambat + dinas;
    const percent = total > 0 ? (active / total) * 100 : 100;

    return { total, hadir, terlambat, izin, sakit, dinas, tidakHadir, percent };
  }, [dailyRecords]);

  // Handler: Download PDF
  const handleDownloadPdf = () => {
    generateDailyReportPdf(dailyRecords, selectedDate, settings);
    showToast('Laporan Rekap Harian berhasil diunduh dalam format PDF.', 'success');
  };

  // Handler: Print
  const handlePrint = () => {
    window.print();
  };

  // Handler: Copy to Google Docs (Rich HTML format)
  const handleCopyGoogleDocs = async () => {
    const formattedDate = formatIndonesianDate(selectedDate);
    const picketDisplay =
      dailyRecords.length > 0 && dailyRecords[0].picketTeacher
        ? dailyRecords[0].picketTeacher
        : settings.currentPicketTeacher;

    const rowsHtml = dailyRecords
      .map(
        (r, i) => `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${i + 1}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">Jam ${r.period}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.timeSlot}</td>
          <td style="border: 1px solid #000; padding: 6px;"><b>${r.teacherName}</b></td>
          <td style="border: 1px solid #000; padding: 6px;">${r.subject}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.className}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;"><b>${r.status}</b></td>
          <td style="border: 1px solid #000; padding: 6px;">${r.notes || '-'}</td>
          <td style="border: 1px solid #000; padding: 6px;">${r.picketTeacher || '-'}</td>
        </tr>`
      )
      .join('');

    const fullHtml = `
      <div style="font-family: Arial, sans-serif; color: #000;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${settings.schoolName}</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px;">${settings.subTitle}</p>
          <p style="margin: 2px 0 10px 0; font-size: 11px;">${settings.address}</p>
          <hr style="border: 1px solid #000; margin: 10px 0 20px 0;" />
          <h3 style="margin: 0; font-size: 15px; font-weight: bold;">REKAPITULASI ABSENSI GURU</h3>
          <p style="margin: 5px 0 15px 0; font-size: 12px;">Tanggal: ${formattedDate}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 5%;">No</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 8%;">Jam</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 12%;">Waktu</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 22%;">Nama Guru</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 15%;">Mata Pelajaran</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 8%;">Kelas</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 10%;">Status</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 10%;">Keterangan</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 10%;">Guru Piket</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 12px; border: 1px solid #000;">Tidak ada catatan absensi</td></tr>'}
          </tbody>
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
              <p style="margin: 0;">Darul Mahfudz, ${formatIndonesianDateShort(selectedDate)}</p>
              <p style="margin: 2px 0 60px 0; font-weight: bold;">Guru Piket</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${picketDisplay}</p>
              <p style="margin: 2px 0 0 0;">Petugas Piket Harian</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    const plainText = `${settings.schoolName}\nREKAPITULASI ABSENSI GURU\nTanggal: ${formattedDate}\n\n` +
      dailyRecords.map((r, i) => `${i + 1}. Jam ${r.period} (${r.timeSlot}) - ${r.teacherName} - ${r.subject} - Kelas ${r.className} - [${r.status}]`).join('\n') +
      `\n\nMengetahui,\nKepala Madrasah: ${settings.headmasterName}\nGuru Piket: ${picketDisplay}`;

    const success = await copyToGoogleDocsHtml(fullHtml, plainText);
    if (success) {
      setIsCopied(true);
      showToast('Tabel format resmi berhasil disalin! Buka Google Docs dan tekan Paste (Ctrl+V).', 'success');
      setTimeout(() => setIsCopied(false), 4000);
    } else {
      showToast('Gagal menyalin ke clipboard.', 'error');
    }
  };

  // Handler: CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Jam Pelajaran',
      'Waktu',
      'Nama Guru',
      'Mata Pelajaran',
      'Kelas',
      'Status',
      'Keterangan',
      'Guru Piket',
    ];
    const rows = dailyRecords.map((r, i) => [
      i + 1,
      `Jam ${r.period}`,
      r.timeSlot,
      r.teacherName,
      r.subject,
      r.className,
      r.status,
      r.notes || '-',
      r.picketTeacher || '-',
    ]);
    downloadCsv(`Rekap-Absensi-Harian-${selectedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Control & Date Selection Bar (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            Rekap Harian Absensi Guru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan kehadiran resmi per tanggal untuk arsip administrasi dan laporan madrasah
          </p>
        </div>

        {/* Date Picker and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Pilih Tanggal:</span>
            <input
              id="rekap-harian-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <button
            id="btn-rekap-download-pdf"
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PDF</span>
          </button>

          <button
            id="btn-rekap-copy-gdoc"
            type="button"
            onClick={handleCopyGoogleDocs}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'TERSALIN KE CLIPBOARD' : 'COPY KE GOOGLE DOCUMENT'}</span>
          </button>

          <button
            id="btn-rekap-print"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT / CETAK</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            title="Ekspor format CSV/Excel"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      </div>

      {/* Mini Stats Banner for the day (Hidden in Print) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Absensi</p>
          <p className="text-xl font-extrabold text-slate-900">{stats.total}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="text-[10px] font-bold uppercase text-emerald-700">Hadir</p>
          <p className="text-xl font-extrabold text-emerald-800">{stats.hadir}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
          <p className="text-[10px] font-bold uppercase text-amber-700">Terlambat</p>
          <p className="text-xl font-extrabold text-amber-800">{stats.terlambat}</p>
        </div>
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-center">
          <p className="text-[10px] font-bold uppercase text-sky-700">Izin</p>
          <p className="text-xl font-extrabold text-sky-800">{stats.izin}</p>
        </div>
        <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 text-center">
          <p className="text-[10px] font-bold uppercase text-violet-700">Sakit</p>
          <p className="text-xl font-extrabold text-violet-800">{stats.sakit}</p>
        </div>
        <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-center">
          <p className="text-[10px] font-bold uppercase text-teal-700">Dinas</p>
          <p className="text-xl font-extrabold text-teal-800">{stats.dinas}</p>
        </div>
        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
          <p className="text-[10px] font-bold uppercase text-rose-700">Tidak Hadir</p>
          <p className="text-xl font-extrabold text-rose-800">{stats.tidakHadir}</p>
        </div>
      </div>

      {/* Official Report Document Paper (Rendered on screen & prints perfectly) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 max-w-4xl mx-auto printable-report">
        {/* KOP RESMI MADRASAH */}
        <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-0.5 border border-slate-200 shrink-0 shadow-2xs overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo Darul Mahfudz"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left sm:text-center">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase">
                {settings.schoolName}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                {settings.subTitle}
              </p>
              <p className="text-[11px] text-slate-500">{settings.address}</p>
            </div>
          </div>
        </div>

        {/* REPORT TITLE */}
        <div className="text-center my-6">
          <h3 className="text-lg font-black text-slate-900 tracking-wide underline">
            REKAPITULASI ABSENSI GURU
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
            Tanggal: {formatIndonesianDate(selectedDate)}
          </p>
          <p className="text-[11px] text-slate-500">
            Tahun Ajaran {settings.academicYear} • Semester {settings.semester}
          </p>
        </div>

        {/* REPORT TABLE */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left border-collapse border border-slate-900 text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                <th className="border border-slate-900 py-2 px-2 text-center w-8">No</th>
                <th className="border border-slate-900 py-2 px-2 text-center w-16">Jam</th>
                <th className="border border-slate-900 py-2 px-2 text-center w-24">Waktu</th>
                <th className="border border-slate-900 py-2 px-3">Nama Guru</th>
                <th className="border border-slate-900 py-2 px-3">Mata Pelajaran</th>
                <th className="border border-slate-900 py-2 px-2 text-center w-16">Kelas</th>
                <th className="border border-slate-900 py-2 px-2 text-center w-24">Status</th>
                <th className="border border-slate-900 py-2 px-3">Keterangan</th>
                <th className="border border-slate-900 py-2 px-3">Guru Piket</th>
              </tr>
            </thead>
            <tbody>
              {dailyRecords.length > 0 ? (
                dailyRecords.map((rec, index) => {
                  const statusConf = ATTENDANCE_STATUS_CONFIG[rec.status];
                  return (
                    <tr key={rec.id} className="border-b border-slate-400">
                      <td className="border border-slate-400 py-2 px-2 text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center font-bold">
                        Jam {rec.period}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center font-mono text-xs">
                        {rec.timeSlot}
                      </td>
                      <td className="border border-slate-400 py-2 px-3 font-bold text-slate-900">
                        {rec.teacherName}
                      </td>
                      <td className="border border-slate-400 py-2 px-3">{rec.subject}</td>
                      <td className="border border-slate-400 py-2 px-2 text-center font-semibold">
                        {rec.className}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm text-xs ${
                            rec.status === 'HADIR'
                              ? 'text-emerald-800'
                              : rec.status === 'TERLAMBAT'
                              ? 'text-amber-800'
                              : rec.status === 'TIDAK HADIR'
                              ? 'text-rose-800'
                              : 'text-slate-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="border border-slate-400 py-2 px-3 text-xs italic">
                        {rec.notes || '-'}
                      </td>
                      <td className="border border-slate-400 py-2 px-3 text-xs">
                        {rec.picketTeacher || settings.currentPicketTeacher}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="border border-slate-900 py-8 text-center text-slate-500">
                    Belum ada data absensi untuk tanggal {formatIndonesianDateShort(selectedDate)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SIGNATURE SECTION MANDATED BY USER */}
        <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-xs sm:text-sm">
          {/* Left: Kepala Madrasah */}
          <div className="text-left space-y-1">
            <p className="font-medium text-slate-800">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala Madrasah</p>
            <div className="h-20" /> {/* Space for physical signature and stamp */}
            <p className="font-black text-slate-900 underline">{settings.headmasterName}</p>
            <p className="text-xs text-slate-600 font-medium">NIP. {settings.headmasterNip}</p>
          </div>

          {/* Right: Guru Piket */}
          <div className="text-right space-y-1">
            <p className="font-medium text-slate-800">
              Darul Mahfudz, {formatIndonesianDateShort(selectedDate)}
            </p>
            <p className="font-bold text-slate-900">Guru Piket</p>
            <div className="h-20" /> {/* Space for physical signature */}
            <p className="font-black text-slate-900 underline">
              {dailyRecords.length > 0 && dailyRecords[0].picketTeacher
                ? dailyRecords[0].picketTeacher
                : settings.currentPicketTeacher}
            </p>
            <p className="text-xs text-slate-600 font-medium">Petugas Piket Harian</p>
          </div>
        </div>
      </div>
    </div>
  );
};
