import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, AppSettings } from '../types';
import { formatIndonesianDate, formatIndonesianDateShort } from '../constants/schedule';

export interface WeeklyRecapRow {
  teacherName: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  dinas: number;
  tidakHadir: number;
  total: number;
  percentage: number;
}

export interface MonthlyRecapRow {
  teacherName: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  dinas: number;
  tidakHadir: number;
  total: number;
  percentage: number;
}

/**
 * Copies rich HTML formatted text to system clipboard for instant pasting into Google Docs
 */
export async function copyToGoogleDocsHtml(
  htmlContent: string,
  plainFallback: string
): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plainFallback], { type: 'text/plain' });
      const data = [
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ];
      await navigator.clipboard.write(data);
      return true;
    } else {
      await navigator.clipboard.writeText(plainFallback);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write error, attempting fallback:', err);
    try {
      await navigator.clipboard.writeText(plainFallback);
      return true;
    } catch (fallbackErr) {
      console.error('Clipboard copy failed completely:', fallbackErr);
      return false;
    }
  }
}

/**
 * Generates Daily Recap PDF
 */
export function generateDailyReportPdf(
  records: AttendanceRecord[],
  selectedDate: string,
  settings: AppSettings
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const formattedDate = formatIndonesianDate(selectedDate);

  // Header / KOP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.schoolName, 105, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(settings.subTitle, 105, 23, { align: 'center' });
  doc.text(settings.address, 105, 28, { align: 'center' });

  // Divider line
  doc.setLineWidth(0.8);
  doc.line(15, 31, 195, 31);
  doc.setLineWidth(0.2);
  doc.line(15, 32, 195, 32);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('REKAPITULASI ABSENSI GURU', 105, 40, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Tanggal: ${formattedDate}`, 15, 47);
  doc.text(`Tahun Pelajaran: ${settings.academicYear} (${settings.semester})`, 195, 47, {
    align: 'right',
  });

  // Table rows
  const tableData = records.map((rec, index) => [
    index + 1,
    `Jam ${rec.period}`,
    rec.timeSlot,
    rec.teacherName,
    rec.subject,
    rec.className,
    rec.status,
    rec.notes || '-',
    rec.picketTeacher || '-',
  ]);

  autoTable(doc, {
    startY: 51,
    head: [
      [
        'No',
        'Jam',
        'Waktu',
        'Nama Guru',
        'Mata Pelajaran',
        'Kelas',
        'Status',
        'Keterangan',
        'Guru Piket',
      ],
    ],
    body: tableData.length > 0 ? tableData : [['-', '-', '-', 'Tidak ada data absensi', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105], // emerald-600
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 38 },
      4: { cellWidth: 28 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 20 },
      7: { cellWidth: 26 },
      8: { cellWidth: 26 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw);
        if (text === 'HADIR') {
          data.cell.styles.textColor = [5, 122, 85];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'TERLAMBAT') {
          data.cell.styles.textColor = [180, 83, 9];
        } else if (text === 'TIDAK HADIR') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Calculate position after table for signatures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 120;
  const signatureY = Math.max(lastY + 14, 220);

  // Check if signature overflows page
  if (signatureY > 260) {
    doc.addPage();
  }

  const actualSignY = signatureY > 260 ? 25 : signatureY;

  // Signatures
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, actualSignY);
  doc.text('Kepala Madrasah', 25, actualSignY + 5);

  const picketDisplay = records.length > 0 && records[0].picketTeacher ? records[0].picketTeacher : settings.currentPicketTeacher;
  doc.text(`${settings.schoolName.replace('MA ', '')}, ${formatIndonesianDateShort(selectedDate)}`, 140, actualSignY);
  doc.text('Guru Piket', 140, actualSignY + 5);

  // Names and NIP
  doc.setFont('helvetica', 'bold');
  doc.text(settings.headmasterName, 25, actualSignY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP: ${settings.headmasterNip}`, 25, actualSignY + 33);

  doc.setFont('helvetica', 'bold');
  doc.text(picketDisplay, 140, actualSignY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. - / Petugas Piket', 140, actualSignY + 33);

  // Save PDF
  doc.save(`Rekap-Absensi-Harian-${selectedDate}.pdf`);
}

/**
 * Generates Weekly Recap PDF
 */
export function generateWeeklyReportPdf(
  rows: WeeklyRecapRow[],
  startDate: string,
  endDate: string,
  settings: AppSettings
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header / KOP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.schoolName, 148, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(settings.subTitle, 148, 21, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.line(20, 25, 277, 25);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('REKAPITULASI ABSENSI GURU MINGGUAN', 148, 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Periode: ${formatIndonesianDateShort(startDate)} s.d. ${formatIndonesianDateShort(endDate)}`, 20, 40);

  const tableData = rows.map((r, i) => [
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

  autoTable(doc, {
    startY: 44,
    head: [
      [
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
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 75 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 24 },
      7: { halign: 'center', cellWidth: 24 },
      8: { halign: 'center', cellWidth: 22 },
      9: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 120;
  const signatureY = Math.min(lastY + 12, 160);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 30, signatureY);
  doc.text('Kepala Madrasah', 30, signatureY + 5);
  doc.text(settings.headmasterName, 30, signatureY + 24);
  doc.text(`NIP: ${settings.headmasterNip}`, 30, signatureY + 28);

  doc.text(`Darul Mahfudz, ${formatIndonesianDateShort(new Date())}`, 200, signatureY);
  doc.text('Koordinator Guru Piket', 200, signatureY + 5);
  doc.text(settings.currentPicketTeacher, 200, signatureY + 24);
  doc.text('NIP. -', 200, signatureY + 28);

  doc.save(`Rekap-Absensi-Mingguan-${startDate}-sd-${endDate}.pdf`);
}

/**
 * Generates Monthly Recap PDF
 */
export function generateMonthlyReportPdf(
  rows: MonthlyRecapRow[],
  monthName: string,
  year: number,
  settings: AppSettings
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header / KOP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.schoolName, 148, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(settings.subTitle, 148, 21, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.line(20, 25, 277, 25);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('REKAPITULASI ABSENSI GURU BULANAN', 148, 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Bulan: ${monthName} ${year}`, 20, 40);

  const tableData = rows.map((r, i) => [
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

  autoTable(doc, {
    startY: 44,
    head: [
      [
        'No',
        'Nama Guru',
        'Hadir',
        'Terlambat',
        'Izin',
        'Sakit',
        'Dinas',
        'Tidak Hadir',
        'Total Jam',
        'Persentase Kehadiran',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 70 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 24 },
      8: { halign: 'center', cellWidth: 24 },
      9: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 120;
  const signatureY = Math.min(lastY + 12, 160);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 30, signatureY);
  doc.text('Kepala Madrasah', 30, signatureY + 5);
  doc.text(settings.headmasterName, 30, signatureY + 24);
  doc.text(`NIP: ${settings.headmasterNip}`, 30, signatureY + 28);

  doc.text(`Darul Mahfudz, Akhir ${monthName} ${year}`, 200, signatureY);
  doc.text('Koordinator Guru Piket', 200, signatureY + 5);
  doc.text(settings.currentPicketTeacher, 200, signatureY + 24);
  doc.text('NIP. -', 200, signatureY + 28);

  doc.save(`Rekap-Absensi-Bulanan-${monthName}-${year}.pdf`);
}

/**
 * Downloads CSV format for Excel/Spreadsheet
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM so Excel opens indonesian special characters correctly
    [headers.map((h) => `"${h}"`).join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
