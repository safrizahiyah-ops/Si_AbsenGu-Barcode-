import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  formatIndonesianDate,
  formatIndonesianDateShort,
  getTodayDateString,
  parsePeriodString,
  ROMAN_INDEX_ORDER,
  ATTENDANCE_STATUS_CONFIG,
} from '../constants/schedule';
import {
  generateDailyRecapPdf,
  copyToGoogleDocsHtml,
  downloadCsv,
  DailyRecapTeacherRow,
} from '../utils/exportUtils';
import {
  Calendar,
  Download,
  Copy,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const { records, teachers, settings, showToast } = useAttendance();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showDetailedJournal, setShowDetailedJournal] = useState<boolean>(false);

  // Filter raw records for selected date
  const recordsForDate = useMemo(() => {
    return records.filter((r) => r.date === selectedDate);
  }, [records, selectedDate]);

  // Generate Daily Teacher Recap Rows with Automatic Effective Time & Percentage
  const dailyTeacherRows: DailyRecapTeacherRow[] = useMemo(() => {
    return teachers.map((teacher) => {
      const teacherRecords = recordsForDate.filter(
        (r) =>
          r.teacherId === teacher.id ||
          r.teacherName.trim().toLowerCase() === teacher.name.trim().toLowerCase()
      );

      if (teacherRecords.length === 0) {
        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          totalJamMengajar: 0,
          totalJamMengajarMenit: 0,
          hadirTepat: 0,
          terlambatMnt: 0,
          izinSakit: 0,
          dinasTugas: 0,
          tidakHadir: 0,
          jamEfektifMnt: 0,
          percentage: 0.0,
          hasData: false,
        };
      }

      let hadirTepat = 0;
      let terlambatHours = 0;
      let terlambatMnt = 0;
      let izinSakit = 0;
      let izinSakitMenit = 0;
      let dinasTugas = 0;
      let tidakHadir = 0;
      let jamEfektifMnt = 0;

      teacherRecords.forEach((rec) => {
        // Calculate number of lesson hours for this record
        const range = parsePeriodString(rec.period);
        const sNum = ROMAN_INDEX_ORDER[range.start] || 1;
        const eNum = ROMAN_INDEX_ORDER[range.end] || sNum;
        const recHours = Math.max(1, Math.abs(eNum - sNum) + 1);
        const recMinutes = recHours * 60; // Dikonversi ke menit (standar: 60 menit per jam)

        if (rec.status === 'HADIR') {
          hadirTepat += recHours;
          jamEfektifMnt += recMinutes;
        } else if (rec.status === 'TERLAMBAT') {
          terlambatHours += recHours;
          let late = rec.lateMinutes;
          if (!late || late <= 0) {
            const match = rec.notes?.match(/(\d+)\s*(?:menit|mnt|m\b)/i);
            late = match ? parseInt(match[1], 10) : 10;
          }
          terlambatMnt += late;
          // Jam efektif berkurang sebanyak menit keterlambatan
          jamEfektifMnt += Math.max(0, recMinutes - late);
        } else if (rec.status === 'DINAS/TUGAS') {
          dinasTugas += recHours;
          // Dinas/Tugas -> Jam Efektif = Total Jam -> 100%
          jamEfektifMnt += recMinutes;
        } else if (rec.status === 'TIDAK HADIR') {
          tidakHadir += recHours;
          // Tidak Hadir / Alfa -> Jam Efektif = 0 untuk jam tersebut
        } else if (rec.status === 'IZIN' || rec.status === 'SAKIT') {
          izinSakit += recHours;
          izinSakitMenit += recMinutes;
          // Izin/Sakit -> hanya jam hadir yang dihitung, sisa tidak dianggap alfa
        }
      });

      const totalJamMengajar = hadirTepat + terlambatHours + dinasTugas + tidakHadir + izinSakit;
      const totalJamMengajarMenit = totalJamMengajar * 60;

      let percentage = 0.0;
      if (totalJamMengajar === 0) {
        percentage = 0.0;
      } else if (izinSakit === totalJamMengajar) {
        // Full excused absence for the day (Izin/Sakit sah)
        percentage = 100.0;
      } else {
        // Evaluatable hours = total scheduled minus excused izin/sakit
        const evaluatableMinutes = totalJamMengajarMenit - izinSakitMenit;
        if (evaluatableMinutes > 0) {
          percentage = Math.min(100, Math.max(0, (jamEfektifMnt / evaluatableMinutes) * 100));
        } else {
          percentage = 0.0;
        }
      }

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        totalJamMengajar,
        totalJamMengajarMenit,
        hadirTepat,
        terlambatMnt,
        izinSakit,
        dinasTugas,
        tidakHadir,
        jamEfektifMnt,
        percentage,
        hasData: true,
      };
    }).sort((a, b) => {
      // Prioritize teachers with attendance data first, then alphabetical
      if (a.hasData && !b.hasData) return -1;
      if (!a.hasData && b.hasData) return 1;
      return a.teacherName.localeCompare(b.teacherName);
    });
  }, [teachers, recordsForDate]);

  // Overall totals for the day
  const overall = useMemo(() => {
    let totalJamMengajar = 0;
    let hadirTepat = 0;
    let terlambatMnt = 0;
    let izinSakit = 0;
    let dinasTugas = 0;
    let tidakHadir = 0;
    let jamEfektifMnt = 0;

    const rowsWithData = dailyTeacherRows.filter((r) => r.hasData);
    rowsWithData.forEach((r) => {
      totalJamMengajar += r.totalJamMengajar;
      hadirTepat += r.hadirTepat;
      terlambatMnt += r.terlambatMnt;
      izinSakit += r.izinSakit;
      dinasTugas += r.dinasTugas;
      tidakHadir += r.tidakHadir;
      jamEfektifMnt += r.jamEfektifMnt;
    });

    const avgPercentage =
      rowsWithData.length > 0
        ? rowsWithData.reduce((acc, r) => acc + r.percentage, 0) / rowsWithData.length
        : 0;

    return {
      totalJamMengajar,
      hadirTepat,
      terlambatMnt,
      izinSakit,
      dinasTugas,
      tidakHadir,
      jamEfektifMnt,
      avgPercentage,
      teachersCountWithData: rowsWithData.length,
    };
  }, [dailyTeacherRows]);

  // Picket teacher name display
  const picketDisplay = useMemo(() => {
    if (recordsForDate.length > 0 && recordsForDate[0].picketTeacher) {
      return recordsForDate[0].picketTeacher;
    }
    return settings.currentPicketTeacher;
  }, [recordsForDate, settings.currentPicketTeacher]);

  // Percentage badge color styling based on user specifications:
  // 🟩 ≥ 95% -> Hijau
  // 🟨 85–94,9% -> Kuning
  // 🟧 70–84,9% -> Oranye
  // 🟥 < 70% -> Merah
  const getBadgeStyle = (percentage: number, hasData: boolean) => {
    if (!hasData) {
      return 'bg-slate-100 text-slate-500 border border-slate-300';
    }
    if (percentage >= 95) {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
    if (percentage >= 85) {
      return 'bg-amber-100 text-amber-800 border border-amber-300';
    }
    if (percentage >= 70) {
      return 'bg-orange-100 text-orange-800 border border-orange-300';
    }
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  };

  // Handler: Download PDF
  const handleDownloadPdf = () => {
    generateDailyRecapPdf(dailyTeacherRows, selectedDate, settings, overall, picketDisplay);
    showToast('Laporan Rekapitulasi Harian berhasil diunduh dalam format PDF.', 'success');
  };

  // Handler: Print
  const handlePrint = () => {
    window.print();
  };

  // Handler: Copy to Google Docs
  const handleCopyGoogleDocs = async () => {
    const formattedDate = formatIndonesianDate(selectedDate);

    const rowsHtml = dailyTeacherRows
      .map(
        (r, i) => `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${i + 1}</td>
          <td style="border: 1px solid #000; padding: 6px;"><b>${r.teacherName}</b></td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.totalJamMengajar} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.hadirTepat} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.terlambatMnt} mnt</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.izinSakit} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.dinasTugas} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.tidakHadir} Jam</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.jamEfektifMnt} mnt</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;"><b>${r.percentage.toFixed(1).replace('.', ',')}%</b></td>
        </tr>`
      )
      .join('');

    const fullHtml = `
      <div style="font-family: Arial, sans-serif; color: #000;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${settings.schoolName}</h2>
          <p style="margin: 3px 0 0 0; font-size: 12px;">${settings.subTitle}</p>
          <p style="margin: 2px 0 10px 0; font-size: 11px;">${settings.address}</p>
          <hr style="border: 1px solid #000; margin: 10px 0 16px 0;" />
          <h3 style="margin: 0; font-size: 15px; font-weight: bold; text-decoration: underline;">REKAPITULASI ABSENSI GURU HARIAN</h3>
          <p style="margin: 5px 0 15px 0; font-size: 12px;">Tanggal: ${formattedDate} | Tahun Ajaran: ${settings.academicYear} | Semester: ${settings.semester}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">No</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: left;">Nama Guru</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">Total Jam Mengajar</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">Hadir Tepat</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">Terlambat (mnt)</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">Izin/Sakit</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">Dinas/Tugas</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">Tidak Hadir</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">Jam Efektif</th>
              <th style="border: 1px solid #000; padding: 7px; text-align: center;">% Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #e2e8f0; font-weight: bold;">
              <td colspan="2" style="border: 1px solid #000; padding: 7px; text-align: center;">TOTAL KESELURUHAN</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.totalJamMengajar} Jam</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.hadirTepat} Jam</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.terlambatMnt} mnt</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.izinSakit} Jam</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.dinasTugas} Jam</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.tidakHadir} Jam</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.jamEfektifMnt} mnt</td>
              <td style="border: 1px solid #000; padding: 7px; text-align: center;">${overall.avgPercentage.toFixed(1).replace('.', ',')}%</td>
            </tr>
          </tfoot>
        </table>

        <table style="width: 100%; font-size: 11px; margin-top: 25px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 2px 0 50px 0; font-weight: bold;">Kepala Madrasah</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${settings.headmasterName}</p>
              <p style="margin: 2px 0 0 0;">NIP: ${settings.headmasterNip}</p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <p style="margin: 0;">Darul Mahfudz, ${formatIndonesianDateShort(selectedDate)}</p>
              <p style="margin: 2px 0 50px 0; font-weight: bold;">Koordinator Guru Piket</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${picketDisplay}</p>
              <p style="margin: 2px 0 0 0;">Petugas Piket</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    const plainText =
      `${settings.schoolName}\nREKAPITULASI ABSENSI GURU HARIAN\nTanggal: ${formattedDate} | Tahun Ajaran: ${settings.academicYear} | Semester: ${settings.semester}\n\n` +
      dailyTeacherRows
        .map(
          (r, i) =>
            `${i + 1}. ${r.teacherName}: Total Jam=${r.totalJamMengajar} Jam, Hadir=${r.hadirTepat} Jam, Terlambat=${r.terlambatMnt} mnt, Izin/Sakit=${r.izinSakit} Jam, Dinas=${r.dinasTugas} Jam, Alpha=${r.tidakHadir} Jam, Efektif=${r.jamEfektifMnt} mnt (${r.percentage.toFixed(1).replace('.', ',')}%)`
        )
        .join('\n');

    const success = await copyToGoogleDocsHtml(fullHtml, plainText);
    if (success) {
      setIsCopied(true);
      showToast('Tabel Rekapitulasi Harian berhasil disalin ke clipboard.', 'success');
      setTimeout(() => setIsCopied(false), 4000);
    }
  };

  // Handler: Export CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Nama Guru',
      'Total Jam Mengajar (Jam)',
      'Hadir Tepat (Jam)',
      'Terlambat (mnt)',
      'Izin/Sakit (Jam)',
      'Dinas/Tugas (Jam)',
      'Tidak Hadir (Jam)',
      'Jam Efektif (mnt)',
      '% Kehadiran',
    ];
    const rows = dailyTeacherRows.map((r, i) => [
      i + 1,
      r.teacherName,
      r.totalJamMengajar,
      r.hadirTepat,
      r.terlambatMnt,
      r.izinSakit,
      r.dinasTugas,
      r.tidakHadir,
      r.jamEfektifMnt,
      `${r.percentage.toFixed(1).replace('.', ',')}%`,
    ]);
    downloadCsv(`Rekap-Harian-Guru-${selectedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. Controls & Filter Bar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            Rekapitulasi Absensi Guru Harian
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan persentase kehadiran otomatis berbasis jam & menit keterlambatan
          </p>
        </div>

        {/* Action Controls & Date Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* PILIH TANGGAL */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-bold text-slate-700">PILIH TANGGAL:</span>
            <input
              id="input-daily-recap-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* DOWNLOAD PDF */}
          <button
            id="btn-daily-download-pdf"
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PDF</span>
          </button>

          {/* COPY KE GOOGLE DOCUMENT */}
          <button
            id="btn-daily-copy-gdoc"
            type="button"
            onClick={handleCopyGoogleDocs}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'TERSALIN' : 'COPY KE GOOGLE DOCUMENT'}</span>
          </button>

          {/* PRINT */}
          <button
            id="btn-daily-print"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT</span>
          </button>

          {/* CSV Export */}
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

      {/* 2. Legend / Color Indicator Pill Banner */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Indikator Persentase Otomatis:</span>
        </div>
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            🟩 ≥ 95% (Sangat Baik / Tepat Waktu)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            🟨 85–94,9% (Cukup Baik)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            🟧 70–84,9% (Perlu Perhatian)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            🟥 &lt; 70% (Kurang / Keterlambatan Tinggi)
          </span>
        </div>
      </div>

      {/* 3. Main Printable Report Document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 printable-report space-y-6">
        {/* KOP & JUDUL */}
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
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {settings.subTitle}
              </p>
              <p className="text-[11px] text-slate-500">{settings.address}</p>
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 mt-3 underline tracking-wide uppercase">
            REKAPITULASI ABSENSI GURU HARIAN
          </h3>
          <p className="text-xs text-slate-700 mt-1 font-semibold">
            Tanggal:{' '}
            <span className="font-extrabold text-slate-900">
              {formatIndonesianDate(selectedDate)}
            </span>{' '}
            | Tahun Ajaran:{' '}
            <span className="font-extrabold text-slate-900">{settings.academicYear}</span> |
            Semester:{' '}
            <span className="font-extrabold text-slate-900">{settings.semester}</span>
          </p>
        </div>

        {/* Table Structure: Identical to Weekly Recap styling */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-900">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
              <tr>
                <th className="border border-slate-900 py-2.5 px-2 text-center w-8">No</th>
                <th className="border border-slate-900 py-2.5 px-3">Nama Guru</th>
                <th className="border border-slate-900 py-2.5 px-2 text-center">
                  Total Jam Mengajar
                </th>
                <th className="border border-slate-900 py-2.5 px-2 text-center">Hadir Tepat</th>
                <th className="border border-slate-900 py-2.5 px-2 text-center">
                  Terlambat (mnt)
                </th>
                <th className="border border-slate-900 py-2.5 px-2 text-center">Izin/Sakit</th>
                <th className="border border-slate-900 py-2.5 px-2 text-center">Dinas/Tugas</th>
                <th className="border border-slate-900 py-2.5 px-2 text-center">Tidak Hadir</th>
                <th className="border border-slate-900 py-2.5 px-2 text-center font-bold">
                  Jam Efektif
                </th>
                <th className="border border-slate-900 py-2.5 px-2 text-center font-black">
                  % Kehadiran
                </th>
              </tr>
            </thead>
            <tbody>
              {dailyTeacherRows.map((row, idx) => (
                <tr
                  key={row.teacherName}
                  className={`border-b border-slate-300 hover:bg-slate-50 transition-colors ${
                    !row.hasData ? 'opacity-65' : ''
                  }`}
                >
                  {/* No */}
                  <td className="border border-slate-300 py-2 px-2 text-center font-medium">
                    {idx + 1}
                  </td>

                  {/* Nama Guru */}
                  <td className="border border-slate-300 py-2 px-3 font-bold text-slate-900">
                    <div>{row.teacherName}</div>
                    {!row.hasData && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Tidak ada jam mengajar hari ini
                      </span>
                    )}
                  </td>

                  {/* Total Jam Mengajar */}
                  <td className="border border-slate-300 py-2 px-2 text-center font-semibold text-slate-800">
                    {row.totalJamMengajar > 0
                      ? `${row.totalJamMengajar} Jam (${row.totalJamMengajarMenit} mnt)`
                      : '-'}
                  </td>

                  {/* Hadir Tepat */}
                  <td className="border border-slate-300 py-2 px-2 text-center font-bold text-emerald-800">
                    {row.hadirTepat > 0 ? `${row.hadirTepat} Jam` : '0'}
                  </td>

                  {/* Terlambat (mnt) */}
                  <td className="border border-slate-300 py-2 px-2 text-center font-bold text-amber-700">
                    {row.terlambatMnt > 0 ? `${row.terlambatMnt} mnt` : '0'}
                  </td>

                  {/* Izin/Sakit */}
                  <td className="border border-slate-300 py-2 px-2 text-center text-sky-700 font-semibold">
                    {row.izinSakit > 0 ? `${row.izinSakit} Jam` : '0'}
                  </td>

                  {/* Dinas/Tugas */}
                  <td className="border border-slate-300 py-2 px-2 text-center text-teal-700 font-semibold">
                    {row.dinasTugas > 0 ? `${row.dinasTugas} Jam` : '0'}
                  </td>

                  {/* Tidak Hadir */}
                  <td className="border border-slate-300 py-2 px-2 text-center text-rose-700 font-bold">
                    {row.tidakHadir > 0 ? `${row.tidakHadir} Jam` : '0'}
                  </td>

                  {/* Jam Efektif */}
                  <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold text-slate-900">
                    {row.hasData ? `${row.jamEfektifMnt} mnt` : '-'}
                  </td>

                  {/* % Kehadiran */}
                  <td className="border border-slate-300 py-2 px-2 text-center font-black">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md font-mono ${getBadgeStyle(
                        row.percentage,
                        row.hasData
                      )}`}
                    >
                      {row.hasData
                        ? `${row.percentage.toFixed(1).replace('.', ',')}%`
                        : '0,0%'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* TOTAL per kolom + RATA-RATA % KEHADIRAN SELURUH GURU */}
            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-900">
                <td colSpan={2} className="border border-slate-900 py-2.5 px-3 text-center">
                  TOTAL KESELURUHAN & RATA-RATA
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center">
                  {overall.totalJamMengajar} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-emerald-900">
                  {overall.hadirTepat} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-amber-900">
                  {overall.terlambatMnt} mnt
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-sky-900">
                  {overall.izinSakit} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-teal-900">
                  {overall.dinasTugas} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center text-rose-900">
                  {overall.tidakHadir} Jam
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center font-mono font-black">
                  {overall.jamEfektifMnt} mnt
                </td>
                <td className="border border-slate-900 py-2.5 px-2 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-black ${getBadgeStyle(
                      overall.avgPercentage,
                      overall.teachersCountWithData > 0
                    )}`}
                  >
                    {overall.avgPercentage.toFixed(1).replace('.', ',')}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary Card below table */}
        <div className="no-print bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Guru Bertugas Hari Ini
            </span>
            <span className="text-lg font-black text-slate-900">
              {overall.teachersCountWithData} Guru
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Total Jam Efektif
            </span>
            <span className="text-lg font-black text-emerald-700">
              {overall.jamEfektifMnt} Menit
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Total Keterlambatan
            </span>
            <span className="text-lg font-black text-amber-600">
              {overall.terlambatMnt} Menit
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Rata-rata Kehadiran
            </span>
            <span
              className={`text-lg font-black ${
                overall.avgPercentage >= 95
                  ? 'text-emerald-700'
                  : overall.avgPercentage >= 85
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {overall.avgPercentage.toFixed(1).replace('.', ',')}%
            </span>
          </div>
        </div>

        {/* Bagian Tanda Tangan: Kepala Madrasah & Guru Piket */}
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
              Darul Mahfudz, {formatIndonesianDateShort(selectedDate)}
            </p>
            <p className="font-bold">Koordinator Guru Piket</p>
            <div className="h-20" />
            <p className="font-black underline">{picketDisplay}</p>
            <p className="text-slate-600">Petugas Piket</p>
          </div>
        </div>
      </div>

      {/* 4. Collapsible Section: Rincian Jurnal Absensi per Jam Pelajaran */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <button
          type="button"
          onClick={() => setShowDetailedJournal((prev) => !prev)}
          className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-800 hover:text-emerald-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Lihat Rincian Jurnal Absensi per Jam Pelajaran (Log Entri Harian)</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-semibold">
              {recordsForDate.length} Catatan
            </span>
          </div>
          {showDetailedJournal ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showDetailedJournal && (
          <div className="overflow-x-auto pt-2 border-t border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="py-2 px-3 text-center w-10">No</th>
                  <th className="py-2 px-3 text-center">Jam</th>
                  <th className="py-2 px-3 text-center">Waktu</th>
                  <th className="py-2 px-3">Nama Guru</th>
                  <th className="py-2 px-3">Mata Pelajaran</th>
                  <th className="py-2 px-3 text-center">Kelas</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Keterlambatan</th>
                  <th className="py-2 px-3">Keterangan</th>
                  <th className="py-2 px-3">Guru Piket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recordsForDate.length > 0 ? (
                  recordsForDate.map((rec, i) => {
                    const statusConf = ATTENDANCE_STATUS_CONFIG[rec.status];
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-medium text-slate-500">
                          {i + 1}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          Jam {rec.period}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {rec.timeSlot}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {rec.teacherName}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{rec.subject}</td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-800">
                          {rec.className}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${statusConf.badgeBg}`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-amber-700">
                          {rec.status === 'TERLAMBAT'
                            ? `${rec.lateMinutes || 10} mnt`
                            : '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate">
                          {rec.notes || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {rec.picketTeacher || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-400">
                      Tidak ada data absensi untuk tanggal {formatIndonesianDateShort(selectedDate)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
