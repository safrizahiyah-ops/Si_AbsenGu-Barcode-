import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AttendanceRecord,
  Teacher,
  ClassRoom,
  Subject,
  AppSettings,
  ActiveTab,
  PeriodId,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_TEACHERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  generateInitialAttendanceRecords,
} from '../data/initialData';
import { VALID_ATTENDANCE_PERIODS } from '../constants/schedule';

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
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
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
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SETTINGS;
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

  // Add Attendance with duplicate validation (same teacher, same period, same date)
  const addAttendanceRecord = (
    recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>
  ): { success: boolean; error?: string } => {
    const isDuplicate = records.some(
      (r) =>
        r.date === recordData.date &&
        r.period === recordData.period &&
        (r.teacherId === recordData.teacherId ||
          r.teacherName.trim().toLowerCase() === recordData.teacherName.trim().toLowerCase())
    );

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
      const isDuplicate = records.some(
        (r) =>
          r.id !== id &&
          r.date === recordData.date &&
          r.period === recordData.period &&
          (r.teacherId === recordData.teacherId ||
            r.teacherName.trim().toLowerCase() === recordData.teacherName?.trim().toLowerCase())
      );

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

  // Reset to initial demo data
  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);

    setRecords(generateInitialAttendanceRecords());
    setTeachers(INITIAL_TEACHERS);
    setClasses(INITIAL_CLASSES);
    setSubjects(INITIAL_SUBJECTS);
    setSettings(INITIAL_SETTINGS);

    showToast('Data berhasil di-reset ke data contoh awal.', 'info');
  };

  const exportDataJson = () => {
    const data = {
      records,
      teachers,
      classes,
      subjects,
      settings,
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
        updateSubject,
        deleteSubject,
        updateSettings,
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
