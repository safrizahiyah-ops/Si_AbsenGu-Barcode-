export type PeriodId =
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  | 'V'
  | 'VI'
  | 'VII'
  | 'VIII'
  | 'IX'
  | 'X'
  | 'XI'
  | 'XII'
  | 'XIII'
  | string;

export type BreakId = 'ISTIRAHAT 1' | 'ISTIRAHAT 2';

export type AttendanceStatus =
  | 'HADIR'
  | 'TERLAMBAT'
  | 'IZIN'
  | 'SAKIT'
  | 'DINAS/TUGAS'
  | 'TIDAK HADIR';

export interface PeriodSlot {
  id: PeriodId | BreakId;
  code: string;
  name: string;
  startTime: string; // "HH:MM" e.g. "07:30"
  endTime: string;   // "HH:MM" e.g. "08:10"
  isBreak: boolean;
  timeSlotString: string; // e.g. "07.30 – 08.10"
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  period: string; // e.g. "I", "II", or "I - II"
  startPeriod?: PeriodId;
  endPeriod?: PeriodId;
  timeSlot: string; // e.g. "07.30 – 08.20" or "07.30 – 08.50"
  teacherId: string;
  teacherName: string;
  subject: string;
  className: string;
  status: AttendanceStatus;
  notes: string;
  picketTeacher: string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  nip?: string;
  name: string;
  gender: 'L' | 'P';
  primarySubject: string;
  phone?: string;
  isActive: boolean;
}

export interface ClassRoom {
  id: string;
  name: string;
  level: 'MTs' | 'MA';
  grade: 'VII' | 'VIII' | 'IX' | 'X' | 'XI' | 'XII';
  group?: string; // IPA, IPS, A, B
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Pendidikan Agama Islam' | 'Umum' | 'Muatan Lokal';
  teacherId?: string;
  teacherName?: string;
  day?: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | string;
  startPeriod?: PeriodId;
  endPeriod?: PeriodId;
  periodString?: string;
  timeSlotString?: string;
  classId?: string;
  className?: string;
}

export interface AppSettings {
  schoolName: string;
  subTitle: string;
  institutionType: string;
  address: string;
  headmasterName: string;
  headmasterNip: string;
  currentPicketTeacher: string;
  picketTeam?: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  lessonDurationMinutes: number; // 30, 35, 40, 45, 50 menit
}

export type ActiveTab =
  | 'dashboard'
  | 'attendance_form'
  | 'attendance_list'
  | 'schedule'
  | 'daily_recap'
  | 'weekly_recap'
  | 'monthly_recap'
  | 'master_teachers'
  | 'master_classes'
  | 'master_subjects'
  | 'settings'
  | 'print_hub';
