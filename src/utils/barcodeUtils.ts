import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Teacher, AppSettings } from '../types';

/**
 * Standard barcode identifier string for a teacher
 */
export function getTeacherBarcodeCode(teacher: { id: string; nip?: string }): string {
  return `DM-GURU-${teacher.id.toUpperCase()}`;
}

/**
 * Generates a standard 1D Code128 Barcode as a Data URL (PNG)
 */
export function generateBarcodeDataUrl(code: string): string {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, {
      format: 'CODE128',
      lineColor: '#0f172a',
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 13,
      font: 'monospace',
      margin: 10,
      background: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error generating barcode data URL:', err);
    return '';
  }
}

/**
 * Generates a 2D QR Code as a Data URL (PNG)
 */
export async function generateQrCodeDataUrl(code: string): Promise<string> {
  try {
    return await QRCode.toDataURL(code, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 200,
      color: {
        dark: '#064e3b', // Emerald dark
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code data URL:', err);
    return '';
  }
}

/**
 * Downloads a single raw barcode as PNG
 */
export function downloadBarcodePng(code: string, teacherName: string) {
  const dataUrl = generateBarcodeDataUrl(code);
  if (!dataUrl) return;

  const a = document.createElement('a');
  a.href = dataUrl;
  const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  a.download = `barcode_${safeName}_${code}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Downloads a raw QR Code as PNG
 */
export async function downloadQrCodePng(code: string, teacherName: string) {
  const dataUrl = await generateQrCodeDataUrl(code);
  if (!dataUrl) return;

  const a = document.createElement('a');
  a.href = dataUrl;
  const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  a.download = `qrcode_${safeName}_${code}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Draws and downloads an official, beautifully styled Teacher Attendance ID Card (PNG)
 */
export async function downloadTeacherCardPng(teacher: Teacher, settings: AppSettings): Promise<void> {
  const code = getTeacherBarcodeCode(teacher);
  const barcodeUrl = generateBarcodeDataUrl(code);
  const qrUrl = await generateQrCodeDataUrl(code);

  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 500;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Border & shadow line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Header Banner
  ctx.fillStyle = '#065f46'; // Emerald 800
  ctx.fillRect(10, 10, width - 20, 90);

  // Accent line
  ctx.fillStyle = '#10b981'; // Emerald 500
  ctx.fillRect(10, 100, width - 20, 6);

  // Header Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(settings.schoolName || 'MA DARUL MAHFUDZ', width / 2, 45);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText('KARTU PRESENSI DIGITAL DEWAN GURU & TENAGA PENDIDIK', width / 2, 72);

  // Load and draw madrasah logo if available
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = '/logo.png';
    await new Promise<void>((resolve) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => resolve();
    });
    if (logoImg.naturalWidth) {
      ctx.drawImage(logoImg, 30, 20, 65, 65);
    }
  } catch {
    // Continue without logo
  }

  // Teacher Info (Left side)
  ctx.textAlign = 'left';

  // Label Title
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('NAMA LENGKAP GURU:', 40, 140);

  // Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(teacher.name, 40, 172);

  // Details table
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('NIP / NUPTK', 40, 215);
  ctx.fillText('Mata Pelajaran', 40, 245);
  ctx.fillText('Kategori', 40, 275);
  ctx.fillText('ID Sistem', 40, 305);

  ctx.fillStyle = '#0f172a';
  ctx.font = '14px sans-serif';
  ctx.fillText(`:  ${teacher.nip || '-'}`, 170, 215);
  ctx.fillText(`:  ${teacher.primarySubject || '-'}`, 170, 245);
  ctx.fillText(`:  Guru Pengampu ${teacher.gender === 'L' ? 'Ikhwan' : 'Akhwat'}`, 170, 275);
  ctx.fillText(`:  ${code}`, 170, 305);

  // Load and draw QR code on the right
  if (qrUrl) {
    const qrImg = new Image();
    qrImg.src = qrUrl;
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => resolve();
    });
    ctx.drawImage(qrImg, width - 210, 135, 170, 170);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#065f46';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code Scanner', width - 125, 320);
  }

  // Load and draw 1D Barcode at bottom
  if (barcodeUrl) {
    const bcImg = new Image();
    bcImg.src = barcodeUrl;
    await new Promise<void>((resolve) => {
      bcImg.onload = () => resolve();
      bcImg.onerror = () => resolve();
    });
    ctx.drawImage(bcImg, 40, 340, width - 80, 80);
  }

  // Footer note
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tunjukkan kartu ini kepada Guru Piket untuk dipindai saat pergantian jam pelajaran.', width / 2, 455);
  ctx.fillText(`${settings.address || 'MA Darul Mahfudz'} • Tahun Pelajaran ${settings.academicYear}`, width / 2, 475);

  // Trigger download
  const safeName = teacher.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `kartu_absen_${safeName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Downloads a printable multi-page PDF containing ID cards for all teachers
 */
export async function downloadAllTeacherCardsPdf(teachers: Teacher[], settings: AppSettings): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const cardWidth = 92;
  const cardHeight = 62;
  const gapX = 6;
  const gapY = 8;
  const cardsPerRow = 2;
  const cardsPerCol = 4;
  const cardsPerPage = cardsPerRow * cardsPerCol;

  let currentCardOnPage = 0;

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const code = getTeacherBarcodeCode(teacher);
    const barcodeUrl = generateBarcodeDataUrl(code);
    const qrUrl = await generateQrCodeDataUrl(code);

    if (currentCardOnPage >= cardsPerPage) {
      doc.addPage();
      currentCardOnPage = 0;
    }

    const col = currentCardOnPage % cardsPerRow;
    const row = Math.floor(currentCardOnPage / cardsPerRow);

    const x = margin + col * (cardWidth + gapX);
    const y = margin + row * (cardHeight + gapY);

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setDrawColor(203, 213, 225); // Slate 300

    // Header banner
    doc.setFillColor(6, 95, 70); // Emerald 800
    doc.rect(x, y, cardWidth, 12, 'F');

    // School Name in header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(settings.schoolName || 'MA DARUL MAHFUDZ', x + cardWidth / 2, y + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(167, 243, 208);
    doc.text('KARTU PRESENSI GURU PIKET', x + cardWidth / 2, y + 9.5, { align: 'center' });

    // Teacher details
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    // Truncate name if too long
    const cleanName = teacher.name.length > 28 ? teacher.name.substring(0, 26) + '...' : teacher.name;
    doc.text(cleanName, x + 4, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIP: ${teacher.nip || '-'}`, x + 4, y + 23);
    const cleanSubject = (teacher.primarySubject || '-').length > 22 ? (teacher.primarySubject || '-').substring(0, 20) + '...' : (teacher.primarySubject || '-');
    doc.text(`Mapel: ${cleanSubject}`, x + 4, y + 27);

    // Embed QR code on the right
    if (qrUrl) {
      doc.addImage(qrUrl, 'PNG', x + cardWidth - 22, y + 14, 18, 18);
    }

    // Embed Barcode at bottom
    if (barcodeUrl) {
      doc.addImage(barcodeUrl, 'PNG', x + 3, y + 33, cardWidth - 6, 21);
    }

    // Footer
    doc.setFontSize(4.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${code} • Th. Pelajaran ${settings.academicYear}`, x + cardWidth / 2, y + 58, { align: 'center' });

    currentCardOnPage++;
  }

  doc.save(`KARTU_BARCODE_DEWAN_GURU_${settings.academicYear.replace('/', '-')}.pdf`);
}

/**
 * Intelligent barcode scanner matching logic
 */
export function matchTeacherFromBarcode(rawScan: string, teachers: Teacher[]): Teacher | null {
  if (!rawScan || !rawScan.trim()) return null;
  const clean = rawScan.trim();

  // Pattern 1: Exact barcode code (DM-GURU-T-1 or DM-GURU-t-1)
  const dmPrefixMatch = clean.match(/^DM-GURU-(.+)$/i);
  if (dmPrefixMatch) {
    const candidateId = dmPrefixMatch[1].trim().toLowerCase();
    const found = teachers.find(
      (t) =>
        t.id.toLowerCase() === candidateId ||
        t.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === candidateId.replace(/[^a-zA-Z0-9]/g, '')
    );
    if (found) return found;
  }

  // Pattern 2: Matching ID directly
  const idMatch = teachers.find((t) => t.id.toLowerCase() === clean.toLowerCase());
  if (idMatch) return idMatch;

  // Pattern 3: Matching NIP directly
  const nipMatch = teachers.find((t) => t.nip && t.nip.replace(/\s+/g, '') === clean.replace(/\s+/g, ''));
  if (nipMatch) return nipMatch;

  // Pattern 4: Matching Name directly
  const nameMatch = teachers.find((t) => t.name.toLowerCase() === clean.toLowerCase());
  if (nameMatch) return nameMatch;

  // Pattern 5: Loose partial match inside scanner string
  const partial = teachers.find(
    (t) =>
      clean.toLowerCase().includes(t.id.toLowerCase()) ||
      (t.nip && clean.includes(t.nip)) ||
      clean.toLowerCase().includes(t.name.toLowerCase())
  );
  if (partial) return partial;

  return null;
}
