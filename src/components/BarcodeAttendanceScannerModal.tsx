import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAttendance } from '../context/AttendanceContext';
import { Teacher, PeriodId, AttendanceStatus, Subject } from '../types';
import { matchTeacherFromBarcode } from '../utils/barcodeUtils';
import {
  PERIOD_IDS,
  getPeriodRangeDetails,
  getTodayDateString,
  getTodaySchoolDay,
  getCurrentPeriodState,
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
  Clock,
  Sparkles,
  School,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Info,
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
    subjects,
    settings,
    addAttendanceRecord,
    showToast,
    periodIds,
    periodSlots,
    validAttendancePeriods,
    currentTime,
  } = useAttendance();

  // Scanner states
  const [scannerActive, setScannerActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [matchedTeacher, setMatchedTeacher] = useState<Teacher | null>(null);
  const [detectedSchedule, setDetectedSchedule] = useState<Subject | null>(null);

  // Selected attendance parameters
  const [scannedStatus, setScannedStatus] = useState<AttendanceStatus>('HADIR');
  const [scannedStartPeriod, setScannedStartPeriod] = useState<PeriodId>('I');
  const [scannedEndPeriod, setScannedEndPeriod] = useState<PeriodId>('I');
  const [scannedClass, setScannedClass] = useState<string>('');
  const [scannedSubject, setScannedSubject] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [autoSubmitMode, setAutoSubmitMode] = useState<boolean>(false);
  const [recentScanLog, setRecentScanLog] = useState<{
    teacherName: string;
    subject: string;
    className: string;
    time: string;
    status: AttendanceStatus;
    period: string;
  }[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-camera-reader-viewport';
  const manualInputRef = useRef<HTMLInputElement>(null);

  const todayDay = useMemo(() => getTodaySchoolDay(currentTime), [currentTime]);
  const activePeriodState = useMemo(() => getCurrentPeriodState(currentTime, periodSlots), [currentTime, periodSlots]);

  // Non-break period slots for study
  const studyPeriodSlots = useMemo(() => {
    return periodSlots.filter((s) => !s.isBreak);
  }, [periodSlots]);

  // Manual period range calculation
  const periodRange = useMemo(() => {
    return getPeriodRangeDetails(scannedStartPeriod, scannedEndPeriod, validAttendancePeriods);
  }, [scannedStartPeriod, scannedEndPeriod, validAttendancePeriods]);

  const handleStartPeriodChange = (val: PeriodId) => {
    setScannedStartPeriod(val);
    const startIdx = periodIds.indexOf(val);
    const endIdx = periodIds.indexOf(scannedEndPeriod);
    if (startIdx !== -1 && endIdx !== -1 && endIdx < startIdx) {
      setScannedEndPeriod(val);
    }
  };

  const handleEndPeriodChange = (val: PeriodId) => {
    const startIdx = periodIds.indexOf(scannedStartPeriod);
    const endIdx = periodIds.indexOf(val);
    if (startIdx !== -1 && endIdx !== -1 && endIdx < startIdx) {
      setScannedStartPeriod(val);
    }
    setScannedEndPeriod(val);
  };

  // Play a soft pleasant beep on scan
  const playBeep = (isSuccess = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = isSuccess ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted
    }
  };

  // Set default class & active period on open
  useEffect(() => {
    if (isOpen) {
      setMatchedTeacher(null);
      setDetectedSchedule(null);
      setCameraError(null);
      setManualCode('');

      // Auto pick current active period if available
      if (activePeriodState.currentSlot && !activePeriodState.currentSlot.isBreak) {
        setScannedStartPeriod(activePeriodState.currentSlot.id);
        setScannedEndPeriod(activePeriodState.currentSlot.id);
      } else {
        setScannedStartPeriod('I');
        setScannedEndPeriod('I');
      }

      setScannedClass(classes[0]?.name || 'X IPA');
      setScannedSubject(subjects[0]?.name || 'Mata Pelajaran');

      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, classes, subjects, activePeriodState.currentSlot]);

  // Find today's schedules for teacher
  const teacherTodaySchedules = useMemo(() => {
    if (!matchedTeacher) return [];
    return subjects.filter((s) => s.teacherId === matchedTeacher.id && s.day === todayDay);
  }, [matchedTeacher, subjects, todayDay]);

  // Apply a specific schedule to the scan form
  const applyScheduleToScan = (sch: Subject) => {
    setDetectedSchedule(sch);
    setScannedSubject(sch.name);
    if (sch.className) setScannedClass(sch.className);
    if (sch.startPeriod) setScannedStartPeriod(sch.startPeriod);
    if (sch.endPeriod) setScannedEndPeriod(sch.endPeriod);
  };

  // Handle successful scan match
  const handleBarcodeDetected = (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    const teacher = matchTeacherFromBarcode(rawText, teachers);
    if (teacher) {
      playBeep(true);
      setMatchedTeacher(teacher);
      setCameraError(null);

      // Search schedule for this teacher on today's day
      const todaySchedules = subjects.filter(
        (s) => s.teacherId === teacher.id && s.day === todayDay
      );

      const currentSlotId = activePeriodState.currentSlot?.id;
      let targetSchedule: Subject | undefined;

      // 1. Exact match with active period slot
      if (currentSlotId) {
        targetSchedule = todaySchedules.find((s) => {
          if (s.startPeriod && s.endPeriod) {
            const startIdx = periodIds.indexOf(s.startPeriod);
            const endIdx = periodIds.indexOf(s.endPeriod);
            const currIdx = periodIds.indexOf(currentSlotId);
            return startIdx !== -1 && endIdx !== -1 && currIdx !== -1 && currIdx >= startIdx && currIdx <= endIdx;
          }
          return s.startPeriod === currentSlotId;
        });
      }

      // 2. If no exact active period match, pick first schedule today
      if (!targetSchedule && todaySchedules.length > 0) {
        targetSchedule = todaySchedules[0];
      }

      // 3. Fallback to any schedule for this teacher
      if (!targetSchedule) {
        targetSchedule = subjects.find((s) => s.teacherId === teacher.id);
      }

      const targetSubjectName = targetSchedule?.name || teacher.primarySubject || 'Mata Pelajaran';
      const targetClassName = targetSchedule?.className || classes[0]?.name || 'X IPA';
      const targetStartP = targetSchedule?.startPeriod || scannedStartPeriod || 'I';
      const targetEndP = targetSchedule?.endPeriod || targetStartP;

      setDetectedSchedule(targetSchedule || null);
      setScannedSubject(targetSubjectName);
      setScannedClass(targetClassName);
      setScannedStartPeriod(targetStartP);
      setScannedEndPeriod(targetEndP);

      // Determine initial status based on punctuality
      let targetStatus: AttendanceStatus = 'HADIR';
      if (activePeriodState.status === 'in_progress') {
        const slotStartMins = activePeriodState.currentSlot
          ? parseInt(activePeriodState.currentSlot.startTime.split(':')[0], 10) * 60 +
            parseInt(activePeriodState.currentSlot.startTime.split(':')[1], 10)
          : 0;
        const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
        if (currentMins - slotStartMins >= 10) {
          targetStatus = 'TERLAMBAT';
        }
      }
      setScannedStatus(targetStatus);

      // If auto-submit mode is active, automatically save attendance
      if (autoSubmitMode) {
        const computedRange = getPeriodRangeDetails(targetStartP, targetEndP, validAttendancePeriods);
        const res = addAttendanceRecord({
          date: getTodayDateString(),
          period: computedRange.periodString,
          startPeriod: targetStartP,
          endPeriod: targetEndP,
          timeSlot: computedRange.timeSlotString,
          teacherId: teacher.id,
          teacherName: teacher.name,
          subject: targetSubjectName,
          className: targetClassName,
          status: targetStatus,
          notes: targetSchedule
            ? `Absensi otomatis barcode (Jadwal: ${targetSubjectName} ${targetClassName})`
            : 'Absensi otomatis scan barcode kartu',
          picketTeacher: settings.currentPicketTeacher,
        });

        if (res.success) {
          showToast(
            `Presensi berhasil: ${teacher.name} (${targetStatus} - ${targetSubjectName} di ${targetClassName})`,
            'success'
          );
          setRecentScanLog((prev) => [
            {
              teacherName: teacher.name,
              subject: targetSubjectName,
              className: targetClassName,
              time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              status: targetStatus,
              period: `Jam ${computedRange.periodString}`,
            },
            ...prev.slice(0, 4),
          ]);
          setMatchedTeacher(null);
          setDetectedSchedule(null);
        } else {
          showToast(res.error || 'Gagal menyimpan absensi', 'error');
        }
      }
    } else {
      playBeep(false);
      showToast(`Barcode "${rawText}" tidak cocok dengan data guru madrasah.`, 'error');
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
            () => {}
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

  // Submit manual barcode input
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

    const result = addAttendanceRecord({
      date: getTodayDateString(),
      period: periodRange.periodString,
      startPeriod: scannedStartPeriod,
      endPeriod: scannedEndPeriod,
      timeSlot: periodRange.timeSlotString,
      teacherId: matchedTeacher.id,
      teacherName: matchedTeacher.name,
      subject: scannedSubject || matchedTeacher.primarySubject || 'Mata Pelajaran',
      className: scannedClass || 'X IPA',
      status: finalStatus,
      lateMinutes: finalStatus === 'TERLAMBAT' ? 10 : 0,
      notes: notes.trim() || `Presensi barcode kartu (${scannedSubject} - ${scannedClass})`,
      picketTeacher: settings.currentPicketTeacher,
    });

    if (result.success) {
      showToast(
        `Presensi berhasil: ${matchedTeacher.name} (${finalStatus} - ${scannedSubject} di ${scannedClass})`,
        'success'
      );
      setRecentScanLog((prev) => [
        {
          teacherName: matchedTeacher.name,
          subject: scannedSubject,
          className: scannedClass,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          status: finalStatus,
          period: `Jam ${periodRange.periodString}`,
        },
        ...prev.slice(0, 4),
      ]);
      setMatchedTeacher(null);
      setDetectedSchedule(null);
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
              <h3 className="font-extrabold text-base flex items-center gap-2">
                Scanner Barcode Presensi Guru
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 border border-emerald-600 text-emerald-100">
                  Sinkron Otomatis
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Hari ini: <strong>{todayDay}</strong> • {activePeriodState.currentSlot ? `Sedang Berlangsung Jam ${activePeriodState.currentSlot.code}` : 'Luar Jam KBM'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Quick Config Bar */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                Pengaturan Jam Presensi Berjalan:
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSubmitMode}
                  onChange={(e) => setAutoSubmitMode(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-700 rounded cursor-pointer"
                />
                <span className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Mode Cepat (Auto Simpan Hadir)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Mulai Jam
                </label>
                <select
                  value={scannedStartPeriod}
                  onChange={(e) => handleStartPeriodChange(e.target.value as PeriodId)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs"
                >
                  {studyPeriodSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      Jam {s.code} ({s.startTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Sampai Jam
                </label>
                <select
                  value={scannedEndPeriod}
                  onChange={(e) => handleEndPeriodChange(e.target.value as PeriodId)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs"
                >
                  {studyPeriodSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      Jam {s.code} ({s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span className="font-mono">
                Rentang: <strong>{periodRange.timeSlotString} WIB</strong>
              </span>
              <span className="font-semibold text-emerald-800">
                Terhitung: {periodRange.durationPeriods} Jam Pelajaran
              </span>
            </div>
          </div>

          {/* Teacher Matched Result Card (If scanned) */}
          {matchedTeacher ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-sm space-y-4 animate-in fade-in zoom-in-95">
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
                      NIP: <span className="font-mono font-bold">{matchedTeacher.nip || '-'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMatchedTeacher(null);
                    setDetectedSchedule(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                  title="Batalkan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Automatic Schedule Detection Banner */}
              <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Jadwal Terbaca Otomatis (Hari {todayDay}):
                  </span>
                  {detectedSchedule ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      Sesuai Jadwal
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                      Jadwal Mandiri
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Mata Pelajaran:
                    </label>
                    <select
                      value={scannedSubject}
                      onChange={(e) => setScannedSubject(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-emerald-50/30 text-xs"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name} {sub.className ? `(${sub.className})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Kelas / Rombel:
                    </label>
                    <select
                      value={scannedClass}
                      onChange={(e) => setScannedClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-emerald-50/30 text-xs"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.name}>
                          {cls.name} ({cls.level})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* If teacher has other schedules today, show quick-switch pills */}
                {teacherTodaySchedules.length > 1 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Pilihan Jadwal Mengajar Guru Hari Ini ({teacherTodaySchedules.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {teacherTodaySchedules.map((sch) => {
                        const isCurrent =
                          scannedSubject === sch.name && scannedClass === sch.className;
                        return (
                          <button
                            key={sch.id}
                            type="button"
                            onClick={() => applyScheduleToScan(sch)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                              isCurrent
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <span>{sch.name}</span>
                            <span className="opacity-80">({sch.className} • Jam {sch.periodString})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleConfirmAttendance()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
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
                      Arahkan kartu barcode guru ke kamera
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
                placeholder="Contoh: DM-19800315... atau ketik NIP / nama guru..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Cari & Presensi
              </button>
            </div>
          </form>

          {/* Recent Scanned Log Table */}
          {recentScanLog.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Presensi Berhasil Baru Saja:
              </span>
              <div className="space-y-1.5">
                {recentScanLog.map((log, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs animate-in fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">{log.teacherName}</span>
                        <span className="text-slate-500 text-[11px] ml-1.5">
                          ({log.subject} - {log.className} • {log.period})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
