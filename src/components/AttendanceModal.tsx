import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { PeriodId, AttendanceStatus } from '../types';
import {
  VALID_ATTENDANCE_PERIODS,
  PERIOD_IDS,
  ATTENDANCE_STATUS_CONFIG,
  getCurrentPeriodState,
  getTodayDateString,
  formatIndonesianDateShort,
} from '../constants/schedule';
import { X, Search, Check, AlertTriangle, User, BookOpen, School, Clock, Calendar, CheckCircle2, Scan } from 'lucide-react';

export const AttendanceModal: React.FC = () => {
  const {
    isFormModalOpen,
    setIsFormModalOpen,
    isBarcodeScannerOpen,
    setIsBarcodeScannerOpen,
    editingRecord,
    setEditingRecord,
    teachers,
    classes,
    subjects,
    settings,
    addAttendanceRecord,
    updateAttendanceRecord,
  } = useAttendance();

  // Form states
  const [date, setDate] = useState<string>(getTodayDateString());
  const [period, setPeriod] = useState<PeriodId>('I');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [status, setStatus] = useState<AttendanceStatus>('HADIR');
  const [notes, setNotes] = useState<string>('');
  const [picketTeacher, setPicketTeacher] = useState<string>(settings.currentPicketTeacher);
  const [validationError, setValidationError] = useState<string | null>(null);

  // References to prevent re-initializing form inputs while modal remains open
  const prevModalOpenRef = useRef<boolean>(false);
  const prevEditingIdRef = useRef<string | null>(null);

  // Initialize or reset ONLY when modal opens or editingRecord actually changes
  useEffect(() => {
    if (isFormModalOpen) {
      const isJustOpened = !prevModalOpenRef.current;
      const currentEditingId = editingRecord ? editingRecord.id : null;
      const isDifferentRecord = currentEditingId !== prevEditingIdRef.current;

      if (isJustOpened || isDifferentRecord) {
        setValidationError(null);
        setIsTeacherDropdownOpen(false);

        if (editingRecord) {
          setDate(editingRecord.date);
          setPeriod(editingRecord.period);
          setSelectedTeacherId(editingRecord.teacherId);
          setTeacherSearch(editingRecord.teacherName);
          setSubject(editingRecord.subject);
          setClassName(editingRecord.className);
          setStatus(editingRecord.status);
          setNotes(editingRecord.notes || '');
          setPicketTeacher(editingRecord.picketTeacher || settings.currentPicketTeacher);
        } else {
          // Preset date
          setDate(getTodayDateString());

          // Check if session storage has target period or check current real-time active period
          const storedTarget = sessionStorage.getItem('dm_target_period');
          if (storedTarget && PERIOD_IDS.includes(storedTarget as PeriodId)) {
            setPeriod(storedTarget as PeriodId);
            sessionStorage.removeItem('dm_target_period');
          } else {
            const currentState = getCurrentPeriodState(new Date());
            if (currentState.currentSlot && !currentState.isBreak) {
              setPeriod(currentState.currentSlot.id as PeriodId);
            } else {
              setPeriod('I');
            }
          }

          // Reset inputs for new attendance entry
          setSelectedTeacherId('');
          setTeacherSearch('');
          setSubject('');
          setClassName(classes[0]?.name || 'X IPA');
          setStatus('HADIR');
          setNotes('');
          setPicketTeacher(settings.currentPicketTeacher);
        }
      }
    }
    prevModalOpenRef.current = isFormModalOpen;
    prevEditingIdRef.current = editingRecord ? editingRecord.id : null;
  }, [isFormModalOpen, editingRecord]);

  // Selected Period details
  const selectedPeriodSlot = useMemo(() => {
    return (
      VALID_ATTENDANCE_PERIODS.find((p) => p.id === period) ||
      VALID_ATTENDANCE_PERIODS[0]
    );
  }, [period]);

  // Filter teachers for dropdown search
  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    const query = teacherSearch.toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.primarySubject && t.primarySubject.toLowerCase().includes(query)) ||
        (t.nip && t.nip.includes(query))
    );
  }, [teachers, teacherSearch]);

  const handleSelectTeacher = (t: (typeof teachers)[0]) => {
    setSelectedTeacherId(t.id);
    setTeacherSearch(t.name);
    setIsTeacherDropdownOpen(false);

    // Pre-fill subject if currently empty or matching previous
    if (t.primarySubject) {
      setSubject(t.primarySubject);
    }
  };

  const handleClose = () => {
    setIsFormModalOpen(false);
    setEditingRecord(null);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Form validations
    if (!selectedTeacherId && !teacherSearch.trim()) {
      setValidationError('Silakan pilih atau masukkan nama guru.');
      return;
    }

    if (!subject.trim()) {
      setValidationError('Silakan isi mata pelajaran.');
      return;
    }

    if (!className.trim()) {
      setValidationError('Silakan pilih kelas.');
      return;
    }

    const teacherName = teacherSearch.trim();

    if (editingRecord) {
      const result = updateAttendanceRecord(editingRecord.id, {
        date,
        period,
        timeSlot: selectedPeriodSlot.timeSlotString,
        teacherId: selectedTeacherId || `custom-${Date.now()}`,
        teacherName,
        subject: subject.trim(),
        className: className.trim(),
        status,
        notes: notes.trim(),
        picketTeacher: picketTeacher.trim() || settings.currentPicketTeacher,
      });

      if (result.success) {
        handleClose();
      } else if (result.error) {
        setValidationError(result.error);
      }
    } else {
      const result = addAttendanceRecord({
        date,
        period,
        timeSlot: selectedPeriodSlot.timeSlotString,
        teacherId: selectedTeacherId || `custom-${Date.now()}`,
        teacherName,
        subject: subject.trim(),
        className: className.trim(),
        status,
        notes: notes.trim(),
        picketTeacher: picketTeacher.trim() || settings.currentPicketTeacher,
      });

      if (result.success) {
        handleClose();
      } else if (result.error) {
        setValidationError(result.error);
      }
    }
  };

  if (!isFormModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 flex items-center justify-center border border-emerald-600/30 overflow-hidden shrink-0 shadow-xs">
              <img
                src="/logo.png"
                alt="Logo Darul Mahfudz"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {editingRecord ? 'Edit Catatan Absensi Guru' : 'Form Absensi Guru'}
              </h3>
              <p className="text-xs text-emerald-100">
                Pencatatan Kehadiran Jam Pelajaran • MA Darul Mahfudz
              </p>
            </div>
          </div>
          <button
            id="close-attendance-modal-btn"
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Validation Banner */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-sm animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Peringatan Validasi</p>
                <p className="text-xs text-rose-700 mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* Row 1: Tanggal & Jam Pelajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Tanggal Absensi
              </label>
              <div className="relative">
                <input
                  id="input-attendance-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium bg-slate-50/50"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {formatIndonesianDateShort(date)}
              </p>
            </div>

            {/* 2. Jam Pelajaran (I - IX) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Jam Pelajaran
              </label>
              <div className="relative">
                <select
                  id="select-attendance-period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as PeriodId)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-bold bg-white"
                >
                  {VALID_ATTENDANCE_PERIODS.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      Jam {slot.code} ({slot.timeSlotString})
                    </option>
                  ))}
                </select>
              </div>

              {/* Automatic Time Slot display */}
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Waktu Terjadwal: {selectedPeriodSlot.timeSlotString} WIB</span>
              </div>
            </div>
          </div>

          {/* 3. Nama Guru with Search Dropdown */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Nama Guru
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setIsBarcodeScannerOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
                title="Pindai barcode guru menggunakan kamera atau scanner USB"
              >
                <Scan className="w-3.5 h-3.5 text-emerald-700" />
                <span>Scan Barcode Guru</span>
              </button>
            </div>
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="input-teacher-search"
                  type="text"
                  placeholder="Cari atau pilih nama guru..."
                  value={teacherSearch}
                  onFocus={() => setIsTeacherDropdownOpen(true)}
                  onChange={(e) => {
                    setTeacherSearch(e.target.value);
                    setSelectedTeacherId('');
                    setIsTeacherDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
                />
                {teacherSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherSearch('');
                      setSelectedTeacherId('');
                    }}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown menu */}
              {isTeacherDropdownOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 divide-y divide-slate-100">
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTeacher(t)}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-center justify-between text-xs sm:text-sm transition-colors ${
                          selectedTeacherId === t.id ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{t.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {t.primarySubject || 'Guru Mata Pelajaran'} {t.nip ? `• NIP: ${t.nip}` : ''}
                          </p>
                        </div>
                        {selectedTeacherId === t.id && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Tidak ditemukan. Ketik nama manual atau tambahkan di Data Guru.
                    </div>
                  )}
                </div>
              )}
            </div>
            {isTeacherDropdownOpen && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsTeacherDropdownOpen(false)}
              />
            )}
          </div>

          {/* Row 2: Mata Pelajaran & Kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 4. Mata Pelajaran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                4. Mata Pelajaran
              </label>
              <div className="relative">
                <input
                  id="input-attendance-subject"
                  type="text"
                  required
                  placeholder="Contoh: Fikih, Matematika..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  list="subjects-datalist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
                />
                <datalist id="subjects-datalist">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* 5. Kelas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                5. Kelas
              </label>
              <div className="relative">
                <select
                  id="select-attendance-class"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold bg-white"
                >
                  <option value="" disabled>
                    Pilih Kelas...
                  </option>
                  <optgroup label="Tingkat Madrasah Tsanawiyah (MTs)">
                    {classes
                      .filter((c) => c.level === 'MTs' || c.grade === 'VII' || c.grade === 'VIII' || c.grade === 'IX')
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          Kelas {c.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Tingkat Madrasah Aliyah (MA)">
                    {classes
                      .filter((c) => c.level === 'MA' || c.grade === 'X' || c.grade === 'XI' || c.grade === 'XII')
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          Kelas {c.name}
                        </option>
                      ))}
                  </optgroup>
                  {/* Custom or additional classes */}
                  {classes.some((c) => c.level !== 'MTs' && c.level !== 'MA' && !['VII', 'VIII', 'IX', 'X', 'XI', 'XII'].includes(c.grade)) && (
                    <optgroup label="Kelas Lainnya">
                      {classes
                        .filter((c) => c.level !== 'MTs' && c.level !== 'MA' && !['VII', 'VIII', 'IX', 'X', 'XI', 'XII'].includes(c.grade))
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            Kelas {c.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {/* Preserve any existing class value from record */}
                  {className && !classes.some((c) => c.name === className) && (
                    <option value={className}>
                      Kelas {className}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 6. Status Kehadiran (Big clear radio/cards) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              6. Status Kehadiran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  'HADIR',
                  'TERLAMBAT',
                  'IZIN',
                  'SAKIT',
                  'DINAS/TUGAS',
                  'TIDAK HADIR',
                ] as AttendanceStatus[]
              ).map((statusOption) => {
                const config = ATTENDANCE_STATUS_CONFIG[statusOption];
                const isSelected = status === statusOption;

                return (
                  <button
                    key={statusOption}
                    type="button"
                    onClick={() => setStatus(statusOption)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${config.badgeBg} ring-2 ring-emerald-500 font-bold shadow-2xs`
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold">{config.label}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-emerald-700 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              7. Keterangan (Opsional)
            </label>
            <textarea
              id="textarea-attendance-notes"
              rows={2}
              placeholder="Contoh: Terlambat 10 menit karena rapat, tugas dikirim via ketua kelas, dll."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>

          {/* 8. Nama Guru Piket */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              8. Nama Guru Piket
            </label>
            <input
              id="input-picket-teacher"
              type="text"
              required
              value={picketTeacher}
              onChange={(e) => setPicketTeacher(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium bg-slate-50/50"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              id="cancel-attendance-btn"
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              id="submit-attendance-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingRecord ? 'Simpan Perubahan' : 'SIMPAN ABSENSI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
