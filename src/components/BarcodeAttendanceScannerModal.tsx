import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAttendance } from '../context/AttendanceContext';
import { Teacher, PeriodId, AttendanceStatus } from '../types';
import { matchTeacherFromBarcode } from '../utils/barcodeUtils';
import {
  VALID_ATTENDANCE_PERIODS,
  getCurrentPeriodState,
  getTodayDateString,
  ATTENDANCE_STATUS_CONFIG,
} from '../constants/schedule';
import {
  Scan,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  X,
  Keyboard,
  UserCheck,
  Clock,
  Sparkles,
  Volume2,
  ChevronRight,
  School,
  BookOpen,
} from 'lucide-react';

interface BarcodeAttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeAttendanceScannerModal: React.FC<BarcodeAttendanceScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    teachers,
    classes,
    settings,
    addAttendanceRecord,
    records,
    showToast,
  } = useAttendance();

  // Scanner states
  const [scannerActive, setScannerActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [matchedTeacher, setMatchedTeacher] = useState<Teacher | null>(null);
  const [scannedStatus, setScannedStatus] = useState<AttendanceStatus>('HADIR');
  const [scannedPeriod, setScannedPeriod] = useState<PeriodId>('I');
  const [scannedClass, setScannedClass] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [autoSubmitMode, setAutoSubmitMode] = useState<boolean>(false);
  const [recentScanLog, setRecentScanLog] = useState<{ teacherName: string; time: string; status: AttendanceStatus; period: string }[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-camera-reader-viewport';
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Play a soft pleasant beep on scan
  const playBeep = (isSuccess = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = isSuccess ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime); // A5 or E4
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Set default period and class on open
  useEffect(() => {
    if (isOpen) {
      const state = getCurrentPeriodState(new Date());
      if (state.currentSlot && !state.isBreak) {
        setScannedPeriod(state.currentSlot.id as PeriodId);
      } else {
        setScannedPeriod('I');
      }
      setScannedClass(classes[0]?.name || 'X IPA');
      setMatchedTeacher(null);
      setCameraError(null);
      setManualCode('');

      // Auto-focus manual scanner input for physical barcode gun
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, classes]);

  // Handle successful scan match
  const handleBarcodeDetected = (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    const teacher = matchTeacherFromBarcode(rawText, teachers);
    if (teacher) {
      playBeep(true);
      setMatchedTeacher(teacher);
      setCameraError(null);

      // If auto-submit mode is active, automatically save attendance as HADIR
      if (autoSubmitMode) {
        const periodSlot = VALID_ATTENDANCE_PERIODS.find((p) => p.id === scannedPeriod) || VALID_ATTENDANCE_PERIODS[0];
        const res = addAttendanceRecord({
          date: getTodayDateString(),
          period: scannedPeriod,
          timeSlot: periodSlot.timeSlotString,
          teacherId: teacher.id,
          teacherName: teacher.name,
          subject: teacher.primarySubject || 'Mata Pelajaran',
          className: scannedClass || 'X IPA',
          status: 'HADIR',
          notes: 'Absensi otomatis scan barcode kartu',
          picketTeacher: settings.currentPicketTeacher,
        });

        if (res.success) {
          showToast(`Berhasil presensi: ${teacher.name} (HADIR Jam ${scannedPeriod})`, 'success');
          setRecentScanLog((prev) => [
            {
              teacherName: teacher.name,
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              status: 'HADIR',
              period: `Jam ${scannedPeriod}`,
            },
            ...prev.slice(0, 4),
          ]);
          setMatchedTeacher(null);
        } else {
          showToast(res.error || 'Gagal menyimpan absensi', 'error');
        }
      }
    } else {
      playBeep(false);
      showToast(`Barcode "${rawText}" tidak cocok dengan data guru terdaftar.`, 'error');
    }
  };

  // Initialize camera scanner
  useEffect(() => {
    if (!isOpen || !scannerActive) {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
          })
          .catch(() => {});
      }
      return;
    }

    let isSubscribed = true;
    const timer = setTimeout(() => {
      try {
        const element = document.getElementById(readerElementId);
        if (!element) return;

        const scanner = new Html5Qrcode(readerElementId);
        html5QrCodeRef.current = scanner;

        scanner
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 260, height: 260 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (isSubscribed) {
                handleBarcodeDetected(decodedText);
              }
            },
            () => {
              // Frame parse error - ignore
            }
          )
          .catch((err) => {
            if (isSubscribed) {
              console.warn('Camera scanner initialization notice:', err);
              setCameraError('Kamera tidak dapat diakses atau izin belum diberikan. Gunakan input barcode di bawah.');
            }
          });
      } catch (e) {
        if (isSubscribed) {
          setCameraError('Gagal memuat modul kamera scanner.');
        }
      }
    }, 250);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .then(() => {
              html5QrCodeRef.current?.clear();
            })
            .catch(() => {});
        }
      }
    };
  }, [isOpen, scannerActive]);

  // Submit manual / hardware barcode scanner input
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  // Confirm attendance from matched teacher
  const handleConfirmAttendance = (chosenStatus?: AttendanceStatus) => {
    if (!matchedTeacher) return;
    const finalStatus = chosenStatus || scannedStatus;
    const periodSlot = VALID_ATTENDANCE_PERIODS.find((p) => p.id === scannedPeriod) || VALID_ATTENDANCE_PERIODS[0];

    const result = addAttendanceRecord({
      date: getTodayDateString(),
      period: scannedPeriod,
      timeSlot: periodSlot.timeSlotString,
      teacherId: matchedTeacher.id,
      teacherName: matchedTeacher.name,
      subject: matchedTeacher.primarySubject || 'Mata Pelajaran',
      className: scannedClass || 'X IPA',
      status: finalStatus,
      notes: notes.trim() || 'Dicatat via pemindai barcode kartu',
      picketTeacher: settings.currentPicketTeacher,
    });

    if (result.success) {
      showToast(`Presensi berhasil: ${matchedTeacher.name} (${finalStatus} Jam ${scannedPeriod})`, 'success');
      setRecentScanLog((prev) => [
        {
          teacherName: matchedTeacher.name,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          status: finalStatus,
          period: `Jam ${scannedPeriod}`,
        },
        ...prev.slice(0, 4),
      ]);
      setMatchedTeacher(null);
      setNotes('');
      manualInputRef.current?.focus();
    } else {
      showToast(result.error || 'Gagal menyimpan absensi', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Scan className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>Pemindai Barcode & QR Presensi Guru</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-200">
                  Guru Piket
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Pindai kartu barcode guru atau gunakan scanner barcode USB untuk absensi instan
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Active Period & Settings Bar */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-slate-700">Jam Pelajaran:</span>
              <select
                value={scannedPeriod}
                onChange={(e) => setScannedPeriod(e.target.value as PeriodId)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {VALID_ATTENDANCE_PERIODS.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    Jam {slot.code} ({slot.timeSlotString})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-slate-700">Kelas:</span>
              <select
                value={scannedClass}
                onChange={(e) => setScannedClass(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick 1-scan auto submit toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              <input
                type="checkbox"
                checked={autoSubmitMode}
                onChange={(e) => setAutoSubmitMode(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-700 rounded cursor-pointer"
              />
              <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Mode Cepat (Auto Hadir)
              </span>
            </label>
          </div>

          {/* Teacher Matched Result Card (If scanned) */}
          {matchedTeacher ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {matchedTeacher.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 tracking-wider">
                      Guru Terdeteksi
                    </span>
                    <h4 className="font-black text-slate-900 text-base sm:text-lg mt-0.5">
                      {matchedTeacher.name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      NIP: <span className="font-mono font-bold">{matchedTeacher.nip || '-'}</span> • Mapel: <span className="font-semibold text-emerald-800">{matchedTeacher.primarySubject || '-'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMatchedTeacher(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                  title="Batalkan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Status Kehadiran Guru:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'DINAS/TUGAS', 'TIDAK HADIR'] as AttendanceStatus[]).map((st) => {
                    const cfg = ATTENDANCE_STATUS_CONFIG[st];
                    const isSelected = scannedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setScannedStatus(st);
                          handleConfirmAttendance(st);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? `${cfg.badgeBg} ${cfg.badgeText} ring-2 ring-emerald-600 font-black shadow-xs`
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span className="text-xs">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes & Submit */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Keterangan tambahan (opsional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleConfirmAttendance()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Presensi</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Viewport / Hardware Scanner View */
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-300 shadow-inner flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px]">
                {/* HTML5 QR Code Mount Element */}
                <div
                  id={readerElementId}
                  className={`w-full max-w-sm overflow-hidden ${scannerActive ? 'block' : 'hidden'}`}
                />

                {/* Laser scan line visual effect */}
                {scannerActive && !cameraError && (
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
                    <div className="w-56 h-56 border-2 border-emerald-400/70 rounded-2xl relative shadow-lg">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1" />
                      {/* Scanning laser beam */}
                      <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce duration-1000 mt-28" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-200 bg-slate-900/80 px-3 py-1 rounded-full mt-3 backdrop-blur-xs">
                      Arahkan barcode / QR guru ke dalam kotak
                    </span>
                  </div>
                )}

                {/* Camera error or deactivated notice */}
                {(!scannerActive || cameraError) && (
                  <div className="p-6 text-center text-slate-300 space-y-2">
                    <CameraOff className="w-10 h-10 mx-auto text-slate-500" />
                    <p className="text-xs font-semibold max-w-xs mx-auto">
                      {cameraError || 'Kamera sedang dinonaktifkan.'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Anda tetap bisa memasukkan barcode secara manual atau menggunakan alat scan barcode USB.
                    </p>
                  </div>
                )}

                {/* Camera toggle control button */}
                <div className="absolute bottom-2 right-2">
                  <button
                    type="button"
                    onClick={() => setScannerActive(!scannerActive)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 backdrop-blur-xs flex items-center gap-1.5 shadow-sm"
                  >
                    {scannerActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>{scannerActive ? 'Matikan Kamera' : 'Buka Kamera'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Input / Physical USB Barcode Gun Input */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <label className="flex items-center gap-1.5 uppercase tracking-wider">
                <Keyboard className="w-3.5 h-3.5 text-emerald-700" />
                Input Barcode / NIP Guru (Hardware Scanner atau Ketik):
              </label>
              <span className="text-slate-400 font-normal text-[11px]">
                Tekan Enter setelah scan
              </span>
            </div>
            <div className="flex gap-2">
              <input
                ref={manualInputRef}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Scan dengan Barcode Scanner USB atau ketik kode (contoh: DM-GURU-T-1 atau NIP)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap"
              >
                Pindai / Cari
              </button>
            </div>
          </form>

          {/* Quick Select from Teacher List fallback */}
          <div className="border-t border-slate-100 pt-3">
            <details className="group text-xs">
              <summary className="cursor-pointer font-bold text-slate-600 hover:text-emerald-700 list-none flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  Atau klik nama dewan guru secara langsung ({teachers.length} guru)
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-slate-400" />
              </summary>
              <div className="mt-2.5 max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
                {teachers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleBarcodeDetected(`DM-GURU-${t.id}`)}
                    className="text-left p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all flex items-center justify-between"
                  >
                    <span className="font-bold truncate">{t.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{t.id}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Recent Scan History Feed */}
          {recentScanLog.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Presensi yang Baru Saja Dipindai:
              </span>
              <div className="divide-y divide-slate-200 text-xs">
                {recentScanLog.map((log, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.teacherName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px]">{log.time}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status} ({log.period})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Sistem Barcode Otomatis • MA Darul Mahfudz
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Tutup Pemindai
          </button>
        </div>
      </div>
    </div>
  );
};
