import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AttendanceRecord,
  Teacher,
  ClassRoom,
  Subject,
  AppSettings,
  ActiveTab,
  PeriodId,
  PeriodSlot,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_TEACHERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  generateInitialAttendanceRecords,
} from '../data/initialData';
import {
  VALID_ATTENDANCE_PERIODS,
  PERIOD_IDS,
  DEFAULT_ALL_PERIOD_SLOTS,
  buildManualPeriodChoices,
  ManualPeriodChoice,
  parseTimeToMinutes,
  minutesToTimeString,
  formatTimeSlotString,
  parsePeriodString,
} from '../constants/schedule';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AttendanceContextType {
  records: AttendanceRecord[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  settings: AppSettings;
  periodSlots: PeriodSlot[];
  validAttendancePeriods: PeriodSlot[];
  manualPeriodChoices: ManualPeriodChoice[];
  periodIds: PeriodId[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isFormModalOpen: boolean;
  setIsFormModalOpen: (open: boolean) => void;
  isBarcodeScannerOpen: boolean;
  setIsBarcodeScannerOpen: (open: boolean) => void;
  editingRecord: AttendanceRecord | null;
  setEditingRecord: (record: AttendanceRecord | null) => void;
  currentTime: Date;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  // CRUD Attendance
  addAttendanceRecord: (
    recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>
  ) => { success: boolean; error?: string };
  updateAttendanceRecord: (
    id: string,
    recordData: Partial<AttendanceRecord>
  ) => { success: boolean; error?: string };
  deleteAttendanceRecord: (id: string) => void;
  // Master CRUD
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Teacher;
  bulkAddTeachers: (teachers: Omit<Teacher, 'id'>[]) => Teacher[];
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addClassRoom: (classroom: Omit<ClassRoom, 'id'>) => void;
  updateClassRoom: (id: string, classroom: Partial<ClassRoom>) => void;
  deleteClassRoom: (id: string) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  bulkAddSubjects: (newSubjects: Omit<Subject, 'id'>[], replaceExisting?: boolean) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  // Periods CRUD
  addPeriodSlot: (slot: PeriodSlot) => { success: boolean; error?: string };
  updatePeriodSlot: (
    slotId: string,
    updatedData: Partial<PeriodSlot>,
    options?: { cascadeSubsequent?: boolean }
  ) => { success: boolean; error?: string };
  updateAllPeriodSlots: (slots: PeriodSlot[]) => { success: boolean; error?: string };
  deletePeriodSlot: (id: string) => { success: boolean; error?: string };
  resetPeriodSlots: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  syncAllPeriodSlotsDuration: (newDurationMinutes: number) => void;
  resetToSampleData: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  RECORDS: 'dm_madrasah_attendance_records_v1',
  TEACHERS: 'dm_madrasah_teachers_v1',
  CLASSES: 'dm_madrasah_classes_v1',
  SUBJECTS: 'dm_madrasah_subjects_v1',
  SETTINGS: 'dm_madrasah_settings_v1',
  PERIOD_SLOTS: 'dm_madrasah_period_slots_v1',
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Real-time clock ticking every second
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persistent States
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return generateInitialAttendanceRecords();
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TEACHERS;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_CLASSES;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SUBJECTS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          lessonDurationMinutes: Number(parsed.lessonDurationMinutes) || 40,
        };
      }
    } catch {
      // ignore
    }
    return INITIAL_SETTINGS;
  });

  // Custom / Extended Period Slots (allows adding periods up to 13 or beyond)
  const [periodSlots, setPeriodSlots] = useState<PeriodSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERIOD_SLOTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ALL_PERIOD_SLOTS;
  });

  // Navigation & UI states
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERIOD_SLOTS, JSON.stringify(periodSlots));
  }, [periodSlots]);

  // Derived period properties
  const validAttendancePeriods = useMemo(() => {
    return periodSlots.filter((slot) => !slot.isBreak);
  }, [periodSlots]);

  const manualPeriodChoices = useMemo(() => {
    return buildManualPeriodChoices(periodSlots);
  }, [periodSlots]);

  const periodIds = useMemo(() => {
    return validAttendancePeriods.map((slot) => slot.code as PeriodId);
  }, [validAttendancePeriods]);

  // Period slots management
  const addPeriodSlot = (newSlot: PeriodSlot): { success: boolean; error?: string } => {
    const code = newSlot.code.trim().toUpperCase();
    const exists = periodSlots.some(
      (s) => s.code.toUpperCase() === code || s.id === newSlot.id
    );
    if (exists) {
      const err = `Jam Pelajaran "${code}" sudah terdaftar dalam jadwal!`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const updated = [...periodSlots, { ...newSlot, code, id: newSlot.id || code }];
    updated.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
    setPeriodSlots(updated);
    showToast(`Jam Pelajaran ${code} (${newSlot.timeSlotString} WIB) berhasil ditambahkan!`, 'success');
    return { success: true };
  };

  const updatePeriodSlot = (
    slotId: string,
    updatedData: Partial<PeriodSlot>,
    options?: { cascadeSubsequent?: boolean }
  ): { success: boolean; error?: string } => {
    const targetIndex = periodSlots.findIndex((s) => s.id === slotId);
    if (targetIndex === -1) {
      return { success: false, error: 'Jam pelajaran tidak ditemukan' };
    }

    const currentTarget = periodSlots[targetIndex];
    const newStartTime = updatedData.startTime !== undefined ? updatedData.startTime : currentTarget.startTime;
    const newEndTime = updatedData.endTime !== undefined ? updatedData.endTime : currentTarget.endTime;
    const startMins = parseTimeToMinutes(newStartTime);
    const endMins = parseTimeToMinutes(newEndTime);

    if (isNaN(startMins) || isNaN(endMins) || startMins >= endMins) {
      const err = 'Waktu mulai harus lebih awal daripada waktu selesai!';
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const timeSlotString = formatTimeSlotString(newStartTime, newEndTime);

    const updatedTarget: PeriodSlot = {
      ...currentTarget,
      ...updatedData,
      startTime: newStartTime,
      endTime: newEndTime,
      timeSlotString,
    };

    let newSlots = [...periodSlots];
    newSlots[targetIndex] = updatedTarget;

    // If cascadeSubsequent is true, adjust all subsequent slots in sequence
    if (options?.cascadeSubsequent) {
      let prevEndTime = newEndTime;
      for (let i = targetIndex + 1; i < newSlots.length; i++) {
        const slot = newSlots[i];
        const prevSlotEndMins = parseTimeToMinutes(prevEndTime);
        const slotStartMins = parseTimeToMinutes(slot.startTime);
        const slotEndMins = parseTimeToMinutes(slot.endTime);
        const duration = Math.max(10, slotEndMins - slotStartMins);

        const shiftedStartMins = prevSlotEndMins;
        const shiftedEndMins = shiftedStartMins + duration;

        const shiftedStartStr = minutesToTimeString(shiftedStartMins);
        const shiftedEndStr = minutesToTimeString(shiftedEndMins);

        newSlots[i] = {
          ...slot,
          startTime: shiftedStartStr,
          endTime: shiftedEndStr,
          timeSlotString: formatTimeSlotString(shiftedStartStr, shiftedEndStr),
        };
        prevEndTime = shiftedEndStr;
      }
    }

    // Keep chronological order
    newSlots.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
    setPeriodSlots(newSlots);

    showToast(
      `Rentang Jam ${updatedTarget.code} berhasil diperbarui (${updatedTarget.timeSlotString} WIB)${
        options?.cascadeSubsequent ? ' & jam berikutnya disesuaikan' : ''
      }!`,
      'success'
    );
    return { success: true };
  };

  const updateAllPeriodSlots = (
    newSlots: PeriodSlot[]
  ): { success: boolean; error?: string } => {
    // Validate each slot
    for (const slot of newSlots) {
      const s = parseTimeToMinutes(slot.startTime);
      const e = parseTimeToMinutes(slot.endTime);
      if (isNaN(s) || isNaN(e) || s >= e) {
        const err = `Jam ${slot.code}: Jam mulai (${slot.startTime}) harus lebih awal dari jam selesai (${slot.endTime})!`;
        showToast(err, 'error');
        return { success: false, error: err };
      }
    }

    const formatted = newSlots.map((slot) => ({
      ...slot,
      timeSlotString: formatTimeSlotString(slot.startTime, slot.endTime),
    }));
    formatted.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    setPeriodSlots(formatted);
    showToast('Semua perubahan rentang jam pelajaran berhasil disimpan!', 'success');
    return { success: true };
  };

  const deletePeriodSlot = (id: string): { success: boolean; error?: string } => {
    const target = periodSlots.find((s) => s.id === id);
    if (!target) return { success: false, error: 'Jam pelajaran tidak ditemukan' };

    const updated = periodSlots.filter((s) => s.id !== id);
    setPeriodSlots(updated);
    showToast(`Jam Pelajaran ${target.code} telah dihapus dari jadwal`, 'info');
    return { success: true };
  };

  const resetPeriodSlots = () => {
    setPeriodSlots(DEFAULT_ALL_PERIOD_SLOTS);
    showToast('Jadwal jam pelajaran telah dikembalikan ke format standar (Jam I - IX)', 'info');
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 4000);
  };

  // Add Attendance with duplicate validation (same teacher, overlapping period, same date)
  const addAttendanceRecord = (
    recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>
  ): { success: boolean; error?: string } => {
    const isDuplicate = records.some((r) => {
      if (r.date !== recordData.date) return false;
      const sameTeacher =
        (recordData.teacherId && r.teacherId === recordData.teacherId) ||
        r.teacherName.trim().toLowerCase() === recordData.teacherName.trim().toLowerCase();
      if (!sameTeacher) return false;

      if (r.period === recordData.period) return true;

      const rRange = parsePeriodString(r.period);
      const newRange = parsePeriodString(recordData.period);
      const rStartIdx = PERIOD_IDS.indexOf(rRange.start);
      const rEndIdx = PERIOD_IDS.indexOf(rRange.end);
      const newStartIdx = PERIOD_IDS.indexOf(newRange.start);
      const newEndIdx = PERIOD_IDS.indexOf(newRange.end);

      if (rStartIdx !== -1 && rEndIdx !== -1 && newStartIdx !== -1 && newEndIdx !== -1) {
        return Math.max(rStartIdx, newStartIdx) <= Math.min(rEndIdx, newEndIdx);
      }
      return false;
    });

    if (isDuplicate) {
      const errorMsg = `Guru "${recordData.teacherName}" sudah tercatat pada Jam Pelajaran ${recordData.period} tanggal ${recordData.date}!`;
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    // Lookup time slot if missing
    let finalTimeSlot = recordData.timeSlot;
    if (!finalTimeSlot) {
      const matchedSlot = VALID_ATTENDANCE_PERIODS.find((p) => p.code === recordData.period);
      finalTimeSlot = matchedSlot ? matchedSlot.timeSlotString : '';
    }

    const newRecord: AttendanceRecord = {
      ...recordData,
      timeSlot: finalTimeSlot,
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) => [newRecord, ...prev]);
    showToast('Data absensi berhasil disimpan.', 'success');
    return { success: true };
  };

  const updateAttendanceRecord = (
    id: string,
    recordData: Partial<AttendanceRecord>
  ): { success: boolean; error?: string } => {
    // Check if updating creates duplicate with ANOTHER record
    if (recordData.date && recordData.period && (recordData.teacherId || recordData.teacherName)) {
      const isDuplicate = records.some((r) => {
        if (r.id === id) return false;
        if (r.date !== recordData.date) return false;
        const sameTeacher =
          (recordData.teacherId && r.teacherId === recordData.teacherId) ||
          r.teacherName.trim().toLowerCase() === recordData.teacherName?.trim().toLowerCase();
        if (!sameTeacher) return false;

        if (r.period === recordData.period) return true;

        const rRange = parsePeriodString(r.period);
        const newRange = parsePeriodString(recordData.period);
        const rStartIdx = PERIOD_IDS.indexOf(rRange.start);
        const rEndIdx = PERIOD_IDS.indexOf(rRange.end);
        const newStartIdx = PERIOD_IDS.indexOf(newRange.start);
        const newEndIdx = PERIOD_IDS.indexOf(newRange.end);

        if (rStartIdx !== -1 && rEndIdx !== -1 && newStartIdx !== -1 && newEndIdx !== -1) {
          return Math.max(rStartIdx, newStartIdx) <= Math.min(rEndIdx, newEndIdx);
        }
        return false;
      });

      if (isDuplicate) {
        const errorMsg = `Perubahan gagal: Guru sudah tercatat pada Jam ${recordData.period} tanggal ${recordData.date}!`;
        showToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    }

    setRecords((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...recordData,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    showToast('Data absensi berhasil diperbarui.', 'success');
    return { success: true };
  };

  const deleteAttendanceRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Data absensi berhasil dihapus.', 'info');
  };

  // Teachers CRUD
  const addTeacher = (teacherData: Omit<Teacher, 'id'>): Teacher => {
    const newTeacher: Teacher = {
      ...teacherData,
      id: 't-' + Date.now(),
    };
    setTeachers((prev) => [...prev, newTeacher]);
    showToast('Data guru berhasil ditambahkan & barcode otomatis siap diunduh.', 'success');
    return newTeacher;
  };

  const bulkAddTeachers = (teachersData: Omit<Teacher, 'id'>[]): Teacher[] => {
    const timestamp = Date.now();
    const newTeachers: Teacher[] = teachersData.map((data, index) => ({
      ...data,
      id: `t-${timestamp}-${index}`,
    }));
    setTeachers((prev) => [...prev, ...newTeachers]);
    showToast(`${newTeachers.length} data guru berhasil diimpor & barcode siap digunakan.`, 'success');
    return newTeachers;
  };

  const updateTeacher = (id: string, teacherData: Partial<Teacher>) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...teacherData } : t))
    );
    showToast('Data guru berhasil diperbarui.', 'success');
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    showToast('Data guru berhasil dihapus.', 'info');
  };

  // Classes CRUD
  const addClassRoom = (classData: Omit<ClassRoom, 'id'>) => {
    const newClass: ClassRoom = {
      ...classData,
      id: 'c-' + Date.now(),
    };
    setClasses((prev) => [...prev, newClass]);
    showToast('Data kelas berhasil ditambahkan.', 'success');
  };

  const updateClassRoom = (id: string, classData: Partial<ClassRoom>) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...classData } : c))
    );
    showToast('Data kelas berhasil diperbarui.', 'success');
  };

  const deleteClassRoom = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    showToast('Data kelas berhasil dihapus.', 'info');
  };

  // Subjects CRUD
  const addSubject = (subData: Omit<Subject, 'id'>) => {
    const newSub: Subject = {
      ...subData,
      id: 's-' + Date.now(),
    };
    setSubjects((prev) => [...prev, newSub]);
    showToast('Data mata pelajaran berhasil ditambahkan.', 'success');
  };

  const bulkAddSubjects = (newSubjectsData: Omit<Subject, 'id'>[], replaceExisting = false) => {
    const timestamp = Date.now();
    const created: Subject[] = newSubjectsData.map((data, idx) => ({
      ...data,
      id: `s-${timestamp}-${idx}`,
    }));

    if (replaceExisting) {
      setSubjects(created);
      showToast(`${created.length} data mata pelajaran & jadwal berhasil diperbarui!`, 'success');
    } else {
      setSubjects((prev) => [...prev, ...created]);
      showToast(`${created.length} data mata pelajaran & jadwal berhasil ditambahkan!`, 'success');
    }
  };

  const updateSubject = (id: string, subData: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...subData } : s))
    );
    showToast('Data mata pelajaran berhasil diperbarui.', 'success');
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('Data mata pelajaran berhasil dihapus.', 'info');
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Pengaturan madrasah berhasil disimpan.', 'success');
  };

  // Synchronize duration of all study period slots to the new duration, cascading cleanly
  const syncAllPeriodSlotsDuration = (newDurationMinutes: number) => {
    const validDur = Math.max(10, Math.min(120, newDurationMinutes));
    if (periodSlots.length === 0) return;

    const updated = [...periodSlots];
    let prevEnd = updated[0].startTime;

    for (let i = 0; i < updated.length; i++) {
      const slot = { ...updated[i] };
      const startMins = i === 0 ? parseTimeToMinutes(slot.startTime) : parseTimeToMinutes(prevEnd);
      const currentSlotDuration = parseTimeToMinutes(slot.endTime) - parseTimeToMinutes(slot.startTime);
      const slotDuration = slot.isBreak ? Math.max(10, currentSlotDuration) : validDur;

      const endMins = startMins + slotDuration;
      slot.startTime = minutesToTimeString(startMins);
      slot.endTime = minutesToTimeString(endMins);
      slot.timeSlotString = formatTimeSlotString(slot.startTime, slot.endTime);

      updated[i] = slot;
      prevEnd = slot.endTime;
    }

    setPeriodSlots(updated);
    showToast(`Durasi seluruh jam pelajaran pada jadwal utama berhasil disinkronkan menjadi ${validDur} menit!`, 'success');
  };

  // Reset to initial demo data
  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PERIOD_SLOTS);

    setRecords(generateInitialAttendanceRecords());
    setTeachers(INITIAL_TEACHERS);
    setClasses(INITIAL_CLASSES);
    setSubjects(INITIAL_SUBJECTS);
    setSettings(INITIAL_SETTINGS);
    setPeriodSlots(DEFAULT_ALL_PERIOD_SLOTS);

    showToast('Data berhasil di-reset ke data contoh awal.', 'info');
  };

  const exportDataJson = () => {
    const data = {
      records,
      teachers,
      classes,
      subjects,
      settings,
      periodSlots,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-absensi-darul-mahfudz-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor sebagai file JSON.', 'success');
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.records && Array.isArray(parsed.records)) {
        setRecords(parsed.records);
      }
      if (parsed.teachers && Array.isArray(parsed.teachers)) {
        setTeachers(parsed.teachers);
      }
      if (parsed.classes && Array.isArray(parsed.classes)) {
        setClasses(parsed.classes);
      }
      if (parsed.subjects && Array.isArray(parsed.subjects)) {
        setSubjects(parsed.subjects);
      }
      if (parsed.settings) {
        setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }
      if (parsed.periodSlots && Array.isArray(parsed.periodSlots)) {
        setPeriodSlots(parsed.periodSlots);
      }
      showToast('Data berhasil dipulihkan dari file backup.', 'success');
      return true;
    } catch {
      showToast('Gagal membaca file JSON backup. Format tidak valid.', 'error');
      return false;
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        records,
        teachers,
        classes,
        subjects,
        settings,
        periodSlots,
        validAttendancePeriods,
        manualPeriodChoices,
        periodIds,
        activeTab,
        setActiveTab,
        isFormModalOpen,
        setIsFormModalOpen,
        isBarcodeScannerOpen,
        setIsBarcodeScannerOpen,
        editingRecord,
        setEditingRecord,
        currentTime,
        toast,
        showToast,
        addAttendanceRecord,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        addTeacher,
        bulkAddTeachers,
        updateTeacher,
        deleteTeacher,
        addClassRoom,
        updateClassRoom,
        deleteClassRoom,
        addSubject,
        bulkAddSubjects,
        updateSubject,
        deleteSubject,
        addPeriodSlot,
        updatePeriodSlot,
        updateAllPeriodSlots,
        deletePeriodSlot,
        resetPeriodSlots,
        updateSettings,
        syncAllPeriodSlotsDuration,
        resetToSampleData,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
