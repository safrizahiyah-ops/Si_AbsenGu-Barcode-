import { PeriodSlot, PeriodId, AttendanceStatus } from '../types';

export const DEFAULT_ALL_PERIOD_SLOTS: PeriodSlot[] = [
  {
    id: 'I',
    code: 'I',
    name: 'Jam Pelajaran I',
    startTime: '07:30',
    endTime: '08:20',
    isBreak: false,
    timeSlotString: '07.30 – 08.20',
  },
  {
    id: 'II',
    code: 'II',
    name: 'Jam Pelajaran II',
    startTime: '08:20',
    endTime: '08:50',
    isBreak: false,
    timeSlotString: '08.20 – 08.50',
  },
  {
    id: 'III',
    code: 'III',
    name: 'Jam Pelajaran III',
    startTime: '08:50',
    endTime: '09:30',
    isBreak: false,
    timeSlotString: '08.50 – 09.30',
  },
  {
    id: 'IV',
    code: 'IV',
    name: 'Jam Pelajaran IV',
    startTime: '09:30',
    endTime: '10:10',
    isBreak: false,
    timeSlotString: '09.30 – 10.10',
  },
  {
    id: 'ISTIRAHAT 1',
    code: 'ISTIRAHAT 1',
    name: 'Istirahat 1',
    startTime: '10:10',
    endTime: '10:30',
    isBreak: true,
    timeSlotString: '10.10 – 10.30',
  },
  {
    id: 'V',
    code: 'V',
    name: 'Jam Pelajaran V',
    startTime: '10:30',
    endTime: '11:10',
    isBreak: false,
    timeSlotString: '10.30 – 11.10',
  },
  {
    id: 'VI',
    code: 'VI',
    name: 'Jam Pelajaran VI',
    startTime: '11:10',
    endTime: '11:50',
    isBreak: false,
    timeSlotString: '11.10 – 11.50',
  },
  {
    id: 'VII',
    code: 'VII',
    name: 'Jam Pelajaran VII',
    startTime: '11:50',
    endTime: '12:30',
    isBreak: false,
    timeSlotString: '11.50 – 12.30',
  },
  {
    id: 'ISTIRAHAT 2',
    code: 'ISTIRAHAT 2',
    name: 'Istirahat 2 & Shalat Dhuhur',
    startTime: '12:30',
    endTime: '13:20',
    isBreak: true,
    timeSlotString: '12.30 – 13.20',
  },
  {
    id: 'VIII',
    code: 'VIII',
    name: 'Jam Pelajaran VIII',
    startTime: '13:20',
    endTime: '14:00',
    isBreak: false,
    timeSlotString: '13.20 – 14.00',
  },
  {
    id: 'IX',
    code: 'IX',
    name: 'Jam Pelajaran IX',
    startTime: '14:00',
    endTime: '14:40',
    isBreak: false,
    timeSlotString: '14.00 – 14.40',
  },
];

// Presets for additional manual periods up to Period 13
export const PRESET_ADDITIONAL_PERIODS: PeriodSlot[] = [
  {
    id: 'X',
    code: 'X',
    name: 'Jam Pelajaran X (Ke-10)',
    startTime: '14:40',
    endTime: '15:20',
    isBreak: false,
    timeSlotString: '14.40 – 15.20',
  },
  {
    id: 'XI',
    code: 'XI',
    name: 'Jam Pelajaran XI (Ke-11)',
    startTime: '15:20',
    endTime: '16:00',
    isBreak: false,
    timeSlotString: '15.20 – 16.00',
  },
  {
    id: 'XII',
    code: 'XII',
    name: 'Jam Pelajaran XII (Ke-12)',
    startTime: '16:00',
    endTime: '16:40',
    isBreak: false,
    timeSlotString: '16.00 – 16.40',
  },
  {
    id: 'XIII',
    code: 'XIII',
    name: 'Jam Pelajaran XIII (Ke-13)',
    startTime: '16:40',
    endTime: '17:20',
    isBreak: false,
    timeSlotString: '16.40 – 17.20',
  },
];

export const ALL_PERIOD_SLOTS: PeriodSlot[] = [...DEFAULT_ALL_PERIOD_SLOTS];

// Valid periods that can be selected for attendance (excludes break periods)
export const VALID_ATTENDANCE_PERIODS: PeriodSlot[] = [
  ...DEFAULT_ALL_PERIOD_SLOTS.filter((slot) => !slot.isBreak),
  ...PRESET_ADDITIONAL_PERIODS,
];

export const PERIOD_IDS: PeriodId[] = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
];

export const ROMAN_INDEX_ORDER: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
  XIII: 13,
};

export function getPeriodOrderNumber(periodCodeOrRange?: string): number {
  if (!periodCodeOrRange) return 99;
  const range = parsePeriodString(periodCodeOrRange);
  return ROMAN_INDEX_ORDER[range.start] || 99;
}

// Pilihan manual untuk kolom "Mulai Jam" dan "Sampai Jam"
export interface ManualPeriodChoice {
  id: PeriodId;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  label: string;
}

export function buildManualPeriodChoices(slots: PeriodSlot[]): ManualPeriodChoice[] {
  return slots
    .filter((slot) => !slot.isBreak)
    .map((slot) => ({
      id: slot.id as PeriodId,
      code: slot.code,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `Jam ${slot.code} : (${slot.startTime.replace(':', ' : ')})`,
    }));
}

export const MANUAL_PERIOD_CHOICES: ManualPeriodChoice[] = [
  {
    id: 'I',
    code: 'I',
    name: 'Jam Pelajaran I',
    startTime: '07:30',
    endTime: '08:20',
    label: 'Jam I : (07 : 30)',
  },
  {
    id: 'II',
    code: 'II',
    name: 'Jam Pelajaran II',
    startTime: '08:20',
    endTime: '08:50',
    label: 'Jam II : (08 : 20)',
  },
  {
    id: 'III',
    code: 'III',
    name: 'Jam Pelajaran III',
    startTime: '08:50',
    endTime: '09:30',
    label: 'Jam III : (08 : 50)',
  },
  {
    id: 'IV',
    code: 'IV',
    name: 'Jam Pelajaran IV',
    startTime: '09:30',
    endTime: '10:10',
    label: 'Jam IV : (09 : 30)',
  },
  {
    id: 'V',
    code: 'V',
    name: 'Jam Pelajaran V',
    startTime: '10:30',
    endTime: '11:10',
    label: 'Jam V : (10 : 30)',
  },
  {
    id: 'VI',
    code: 'VI',
    name: 'Jam Pelajaran VI',
    startTime: '11:10',
    endTime: '11:50',
    label: 'Jam VI : (11 : 10)',
  },
  {
    id: 'VII',
    code: 'VII',
    name: 'Jam Pelajaran VII',
    startTime: '11:50',
    endTime: '12:30',
    label: 'Jam VII : (11 : 50)',
  },
  {
    id: 'VIII',
    code: 'VIII',
    name: 'Jam Pelajaran VIII',
    startTime: '13:20',
    endTime: '14:00',
    label: 'Jam VIII : (13 : 20)',
  },
  {
    id: 'IX',
    code: 'IX',
    name: 'Jam Pelajaran IX',
    startTime: '14:00',
    endTime: '14:40',
    label: 'Jam IX : (14 : 00)',
  },
  {
    id: 'X',
    code: 'X',
    name: 'Jam Pelajaran X (Ke-10)',
    startTime: '14:40',
    endTime: '15:20',
    label: 'Jam X : (14 : 40)',
  },
  {
    id: 'XI',
    code: 'XI',
    name: 'Jam Pelajaran XI (Ke-11)',
    startTime: '15:20',
    endTime: '16:00',
    label: 'Jam XI : (15 : 20)',
  },
  {
    id: 'XII',
    code: 'XII',
    name: 'Jam Pelajaran XII (Ke-12)',
    startTime: '16:00',
    endTime: '16:40',
    label: 'Jam XII : (16 : 00)',
  },
  {
    id: 'XIII',
    code: 'XIII',
    name: 'Jam Pelajaran XIII (Ke-13)',
    startTime: '16:40',
    endTime: '17:20',
    label: 'Jam XIII : (16 : 40)',
  },
];

// Menghitung rentang jam manual (Mulai Jam s/d Sampai Jam)
export function getPeriodRangeDetails(
  startId: PeriodId,
  endId: PeriodId,
  availableSlots: PeriodSlot[] = VALID_ATTENDANCE_PERIODS
): {
  periodString: string;
  timeSlotString: string;
  startSlot: PeriodSlot;
  endSlot: PeriodSlot;
  durationPeriods: number;
} {
  const startIdx = PERIOD_IDS.indexOf(startId);
  const endIdx = PERIOD_IDS.indexOf(endId);

  const effectiveStartId = startIdx !== -1 && endIdx !== -1 && startIdx > endIdx ? endId : startId;
  const effectiveEndId = startIdx !== -1 && endIdx !== -1 && startIdx > endIdx ? startId : endId;

  const startSlot =
    availableSlots.find((p) => p.id === effectiveStartId) ||
    VALID_ATTENDANCE_PERIODS.find((p) => p.id === effectiveStartId) ||
    VALID_ATTENDANCE_PERIODS[0];
  const endSlot =
    availableSlots.find((p) => p.id === effectiveEndId) ||
    VALID_ATTENDANCE_PERIODS.find((p) => p.id === effectiveEndId) ||
    startSlot;

  const periodString =
    effectiveStartId === effectiveEndId
      ? effectiveStartId
      : `${effectiveStartId} - ${effectiveEndId}`;

  const timeSlotString = `${startSlot.startTime.replace(':', '.')} – ${endSlot.endTime.replace(':', '.')}`;
  const pStartIdx = PERIOD_IDS.indexOf(effectiveStartId);
  const pEndIdx = PERIOD_IDS.indexOf(effectiveEndId);
  const durationPeriods =
    pStartIdx !== -1 && pEndIdx !== -1 ? Math.abs(pEndIdx - pStartIdx) + 1 : 1;

  return {
    periodString,
    timeSlotString,
    startSlot,
    endSlot,
    durationPeriods,
  };
}

// Membaca string period yang mungkin berbentuk "I" atau "I - II"
export function parsePeriodString(periodStr?: string): { start: PeriodId; end: PeriodId } {
  if (!periodStr) return { start: 'I', end: 'I' };
  const parts = periodStr.split(/[-–s/d ]+/).filter(Boolean);
  const startCandidate = parts[0] as PeriodId;
  const endCandidate = (parts.length > 1 ? parts[parts.length - 1] : parts[0]) as PeriodId;

  const start = PERIOD_IDS.includes(startCandidate) ? startCandidate : 'I';
  const end = PERIOD_IDS.includes(endCandidate) ? endCandidate : start;

  return { start, end };
}

// Cek apakah suatu target PeriodId berada di antara rentang start dan end
export function isPeriodInRange(target: PeriodId, start: PeriodId, end: PeriodId): boolean {
  const targetIdx = PERIOD_IDS.indexOf(target);
  const startIdx = PERIOD_IDS.indexOf(start);
  const endIdx = PERIOD_IDS.indexOf(end);
  if (targetIdx === -1 || startIdx === -1 || endIdx === -1) return false;
  const minIdx = Math.min(startIdx, endIdx);
  const maxIdx = Math.max(startIdx, endIdx);
  return targetIdx >= minIdx && targetIdx <= maxIdx;
}

export const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    iconColor: string;
    desc: string;
  }
> = {
  HADIR: {
    label: 'HADIR',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-300',
    iconColor: 'text-emerald-600',
    desc: 'Guru hadir tepat waktu dan mengajar di kelas',
  },
  TERLAMBAT: {
    label: 'TERLAMBAT',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    border: 'border-amber-300',
    iconColor: 'text-amber-600',
    desc: 'Guru hadir namun terlambat memasuki jam pelajaran',
  },
  IZIN: {
    label: 'IZIN',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    badgeText: 'text-sky-700',
    border: 'border-sky-300',
    iconColor: 'text-sky-600',
    desc: 'Guru mengajukan izin resmi yang telah disetujui',
  },
  SAKIT: {
    label: 'SAKIT',
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
    badgeText: 'text-violet-700',
    border: 'border-violet-300',
    iconColor: 'text-violet-600',
    desc: 'Guru berhalangan hadir dikarenakan sakit',
  },
  'DINAS/TUGAS': {
    label: 'DINAS/TUGAS',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    badgeText: 'text-teal-700',
    border: 'border-teal-300',
    iconColor: 'text-teal-600',
    desc: 'Menjalankan tugas kedinasan / mandat madrasah di luar',
  },
  'TIDAK HADIR': {
    label: 'TIDAK HADIR',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    border: 'border-rose-300',
    iconColor: 'text-rose-600',
    desc: 'Tanpa keterangan / alpha pada jam pelajaran ini',
  },
};

export interface PeriodCurrentState {
  currentSlot: PeriodSlot | null;
  nextSlot: PeriodSlot | null;
  statusType: 'active' | 'upcoming_soon' | 'before_school' | 'after_school';
  timeRemainingMinutes: number;
  minutesToNext: number;
  displayText: string;
  timeSlotText: string;
  isBreak: boolean;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const separator = timeStr.includes(':') ? ':' : '.';
  const [hours, minutes] = timeStr.split(separator).map(Number);
  return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
}

export function minutesToTimeString(minutes: number): string {
  const normalized = Math.max(0, minutes) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeSlotString(start: string, end: string): string {
  const cleanStart = start.replace(':', '.');
  const cleanEnd = end.replace(':', '.');
  return `${cleanStart} – ${cleanEnd}`;
}

export function getCurrentPeriodState(
  currentTime: Date = new Date(),
  slots: PeriodSlot[] = ALL_PERIOD_SLOTS
): PeriodCurrentState {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const effectiveSlots = slots && slots.length > 0 ? slots : ALL_PERIOD_SLOTS;

  const firstSlotMinutes = parseTimeToMinutes(effectiveSlots[0].startTime);
  const lastSlotMinutes = parseTimeToMinutes(
    effectiveSlots[effectiveSlots.length - 1].endTime
  );

  // Before school starts
  if (currentMinutes < firstSlotMinutes) {
    const minutesToFirst = firstSlotMinutes - currentMinutes;
    return {
      currentSlot: null,
      nextSlot: effectiveSlots[0],
      statusType: minutesToFirst <= 15 ? 'upcoming_soon' : 'before_school',
      timeRemainingMinutes: 0,
      minutesToNext: minutesToFirst,
      displayText: 'Belum Dimulai (Sebelum Jam I)',
      timeSlotText: `Mulai pukul ${effectiveSlots[0].startTime} WIB`,
      isBreak: false,
    };
  }

  // After school ends
  if (currentMinutes >= lastSlotMinutes) {
    return {
      currentSlot: null,
      nextSlot: null,
      statusType: 'after_school',
      timeRemainingMinutes: 0,
      minutesToNext: 0,
      displayText: 'Kegiatan Belajar Mengajar Selesai',
      timeSlotText: `Berakhir pukul ${effectiveSlots[effectiveSlots.length - 1].endTime} WIB`,
      isBreak: false,
    };
  }

  // Find current slot
  for (let i = 0; i < effectiveSlots.length; i++) {
    const slot = effectiveSlots[i];
    const startMins = parseTimeToMinutes(slot.startTime);
    const endMins = parseTimeToMinutes(slot.endTime);

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      const timeRemaining = endMins - currentMinutes;
      const nextSlot = i < effectiveSlots.length - 1 ? effectiveSlots[i + 1] : null;
      const isEndingSoon = timeRemaining <= 5;

      return {
        currentSlot: slot,
        nextSlot,
        statusType: isEndingSoon ? 'upcoming_soon' : 'active',
        timeRemainingMinutes: timeRemaining,
        minutesToNext: timeRemaining,
        displayText: slot.isBreak ? slot.name.toUpperCase() : `JAM ${slot.code}`,
        timeSlotText: slot.timeSlotString,
        isBreak: slot.isBreak,
      };
    }
  }

  return {
    currentSlot: null,
    nextSlot: effectiveSlots[0],
    statusType: 'before_school',
    timeRemainingMinutes: 0,
    minutesToNext: 0,
    displayText: 'Luar Jam Pelajaran',
    timeSlotText: '-',
    isBreak: false,
  };
}

export function getSlotVisualStatus(
  slot: PeriodSlot,
  currentMinutes: number
): 'active' | 'upcoming_soon' | 'completed' | 'upcoming' {
  const startMins = parseTimeToMinutes(slot.startTime);
  const endMins = parseTimeToMinutes(slot.endTime);

  if (currentMinutes >= startMins && currentMinutes < endMins) {
    if (endMins - currentMinutes <= 5) {
      return 'upcoming_soon';
    }
    return 'active';
  }

  if (currentMinutes >= endMins) {
    return 'completed';
  }

  // Slot hasn't started yet. Is it the very next slot starting within 10 minutes?
  if (startMins > currentMinutes && startMins - currentMinutes <= 10) {
    return 'upcoming_soon';
  }

  return 'upcoming';
}

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const SCHOOL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
export type SchoolDay = (typeof SCHOOL_DAYS)[number];

export function getTodaySchoolDay(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  if (isNaN(d.getTime())) return 'Senin';
  const dayName = INDONESIAN_DAYS[d.getDay()];
  return dayName === 'Minggu' ? 'Senin' : dayName;
}

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatIndonesianDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const dayName = INDONESIAN_DAYS[d.getDay()];
  const dayDate = d.getDate();
  const monthName = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();

  return `${dayName}, ${dayDate} ${monthName} ${year}`;
}

export function formatIndonesianDateShort(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const dayDate = d.getDate();
  const monthName = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayDate} ${monthName} ${year}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
