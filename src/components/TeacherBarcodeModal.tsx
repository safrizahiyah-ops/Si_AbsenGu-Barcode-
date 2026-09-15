import React, { useEffect, useState } from 'react';
import { Teacher, AppSettings } from '../types';
import {
  getTeacherBarcodeCode,
  generateBarcodeDataUrl,
  generateQrCodeDataUrl,
  downloadBarcodePng,
  downloadQrCodePng,
  downloadTeacherCardPng,
} from '../utils/barcodeUtils';
import {
  X,
  Download,
  Printer,
  QrCode,
  Barcode,
  IdCard,
  Check,
  Building2,
  GraduationCap,
} from 'lucide-react';

interface TeacherBarcodeModalProps {
  teacher: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  isNewlyAdded?: boolean;
}

export const TeacherBarcodeModal: React.FC<TeacherBarcodeModalProps> = ({
  teacher,
  isOpen,
  onClose,
  settings,
  isNewlyAdded = false,
}) => {
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (teacher && isOpen) {
      const code = getTeacherBarcodeCode(teacher);
      const bUrl = generateBarcodeDataUrl(code);
      setBarcodeUrl(bUrl);

      generateQrCodeDataUrl(code).then((qUrl) => {
        setQrUrl(qUrl);
      });
    }
  }, [teacher, isOpen]);

  if (!isOpen || !teacher) return null;

  const code = getTeacherBarcodeCode(teacher);

  const handleDownloadCard = async () => {
    setIsDownloading(true);
    try {
      await downloadTeacherCardPng(teacher, settings);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <QrCode className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {isNewlyAdded ? 'Guru Berhasil Disimpan & Barcode Siap!' : 'Kartu & Barcode Presensi Guru'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isNewlyAdded
                  ? 'Barcode telah dicetak secara otomatis untuk guru ini'
                  : 'Barcode dan QR Code resmi untuk pencatatan absensi guru piket'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {isNewlyAdded && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <Check className="w-4 h-4" />
              </div>
              <p className="text-xs text-emerald-800 font-semibold">
                Data guru <span className="font-bold underline">{teacher.name}</span> berhasil tersimpan! Barcode otomatis siap diunduh di bawah ini.
              </p>
            </div>
          )}

          {/* Printable Preview Card */}
          <div
            id="printable-teacher-card"
            className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-300 p-5 shadow-sm space-y-4 overflow-hidden"
          >
            {/* Madrasah Card Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Logo Darul Mahfudz"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                    {settings.schoolName || 'MA DARUL MAHFUDZ'}
                  </h4>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Kartu Presensi Dewan Guru & Staf
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Tahun Pelajaran {settings.academicYear} • Semester {settings.semester}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Resmi Piket
              </span>
            </div>

            {/* Teacher Details & Codes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nama Tenaga Pendidik
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {teacher.name}
                </h3>
                <div className="space-y-0.5 text-xs text-slate-600">
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium">NIP / NUPTK</span>
                    <span className="font-mono font-bold text-slate-800">: {teacher.nip || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium">Mata Pelajaran</span>
                    <span className="font-semibold text-emerald-800">: {teacher.primarySubject || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-medium">Kode Sistem</span>
                    <span className="font-mono text-slate-700">: {code}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code Presensi" className="w-28 h-28 object-contain" />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 animate-pulse rounded-lg" />
                )}
                <span className="text-[10px] font-bold text-emerald-800 mt-1">QR Presensi</span>
              </div>
            </div>

            {/* 1D Barcode Container */}
            <div className="pt-2 border-t border-slate-100 flex flex-col items-center">
              {barcodeUrl ? (
                <img
                  src={barcodeUrl}
                  alt="Barcode 1D Presensi"
                  className="max-h-16 w-full object-contain"
                />
              ) : (
                <div className="h-14 w-full bg-slate-100 animate-pulse rounded-lg" />
              )}
              <span className="text-[10px] text-slate-400 italic mt-0.5">
                Pindai dengan kamera atau scanner barcode saat hadir di madrasah
              </span>
            </div>
          </div>

          {/* Quick Action Download Buttons */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilihan Unduh & Cetak Barcode:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Download Full Card PNG */}
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadCard}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                <IdCard className="w-4 h-4" />
                <span>{isDownloading ? 'Memproses...' : 'Unduh Kartu Lengkap (PNG)'}</span>
              </button>

              {/* Download QR Code */}
              <button
                type="button"
                onClick={() => downloadQrCodePng(code, teacher.name)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Unduh QR Code Saja</span>
              </button>

              {/* Download Barcode 1D */}
              <button
                type="button"
                onClick={() => downloadBarcodePng(code, teacher.name)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-colors"
              >
                <Barcode className="w-4 h-4 text-emerald-700" />
                <span>Unduh Barcode Garis</span>
              </button>

              {/* Print Card */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak / Print Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
