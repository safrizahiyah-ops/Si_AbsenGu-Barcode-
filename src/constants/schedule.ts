import { PeriodSlot, PeriodId, AttendanceStatus } from '../types';

export const ALL_PERIOD_SLOTS: PeriodSlot[] = [
  {
    id: 'I',
    code: 'I',
    name: 'Jam Pelajaran I',
    startTime: '07:30',
    endTime: '08:10',
    isBreak: false,
    timeSlotString: '07.30 – 08.10',
  },
  {
    id: 'II',
    code: 'II',
    name: 'Jam Pelajaran II',
    startTime: '08:10',
    endTime: '08:50',
    isBreak: false,
    timeSlotString: '08.10 – 08.50',
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

// Valid periods that can be selected for attendance (excludes break periods)
export const VALID_ATTENDANCE_PERIODS: PeriodSlot[] = ALL_PERIOD_SLOTS.filter(
  (slot) => !slot.isBreak
);

export const PERIOD_IDS: PeriodId[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

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
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getCurrentPeriodState(currentTime: Date = new Date()): PeriodCurrentState {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const firstSlotMinutes = parseTimeToMinutes(ALL_PERIOD_SLOTS[0].startTime);
  const lastSlotMinutes = parseTimeToMinutes(
    ALL_PERIOD_SLOTS[ALL_PERIOD_SLOTS.length - 1].endTime
  );

  // Before school starts
  if (currentMinutes < firstSlotMinutes) {
    const minutesToFirst = firstSlotMinutes - currentMinutes;
    return {
      currentSlot: null,
      nextSlot: ALL_PERIOD_SLOTS[0],
      statusType: minutesToFirst <= 15 ? 'upcoming_soon' : 'before_school',
      timeRemainingMinutes: 0,
      minutesToNext: minutesToFirst,
      displayText: 'Belum Dimulai (Sebelum Jam I)',
      timeSlotText: `Mulai pukul ${ALL_PERIOD_SLOTS[0].startTime} WIB`,
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
      timeSlotText: `Berakhir pukul ${ALL_PERIOD_SLOTS[ALL_PERIOD_SLOTS.length - 1].endTime} WIB`,
      isBreak: false,
    };
  }

  // Find current slot
  for (let i = 0; i < ALL_PERIOD_SLOTS.length; i++) {
    const slot = ALL_PERIOD_SLOTS[i];
    const startMins = parseTimeToMinutes(slot.startTime);
    const endMins = parseTimeToMinutes(slot.endTime);

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      const timeRemaining = endMins - currentMinutes;
      const nextSlot = i < ALL_PERIOD_SLOTS.length - 1 ? ALL_PERIOD_SLOTS[i + 1] : null;
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
    nextSlot: ALL_PERIOD_SLOTS[0],
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
