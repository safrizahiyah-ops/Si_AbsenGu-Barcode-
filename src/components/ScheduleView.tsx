import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  ALL_PERIOD_SLOTS,
  getCurrentPeriodState,
  getSlotVisualStatus,
} from '../constants/schedule';
import { PeriodId } from '../types';
import {
  Clock,
  Play,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const { currentTime, setIsFormModalOpen, setEditingRecord } = useAttendance();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const activePeriodState = getCurrentPeriodState(currentTime);

  const handleStartAttendance = (periodId: PeriodId) => {
    setEditingRecord(null);
    sessionStorage.setItem('dm_target_period', periodId);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            Jadwal Jam Pelajaran & Pergantian Jam
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal resmi kegiatan belajar mengajar MA/MTs Darul Mahfudz (Jam I s.d. IX)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {activePeriodState.displayText} ({activePeriodState.timeSlotText})
          </span>
        </div>
      </div>

      {/* Main Timetable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_PERIOD_SLOTS.map((slot) => {
          const visual = getSlotVisualStatus(slot, currentMinutes);
          const isCurrent = activePeriodState.currentSlot?.id === slot.id;
          const isBreak = slot.isBreak;

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrent
                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/40 shadow-md'
                  : visual === 'upcoming_soon'
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400 shadow-xs'
                  : visual === 'upcoming'
                  ? 'bg-white border-slate-200 hover:border-blue-300'
                  : 'bg-slate-50/60 border-slate-200 opacity-80'
              }`}
            >
              {/* Badge strip at top */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    isBreak
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : isCurrent
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isBreak ? 'Waktu Istirahat' : `Jam Pelajaran ${slot.code}`}
                </span>

                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    visual === 'active'
                      ? 'bg-emerald-600 text-white'
                      : visual === 'upcoming_soon'
                      ? 'bg-amber-500 text-white'
                      : visual === 'upcoming'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {visual === 'active'
                    ? 'Sedang Berlangsung'
                    : visual === 'upcoming_soon'
                    ? 'Segera Masuk'
                    : visual === 'upcoming'
                    ? 'Akan Datang'
                    : 'Sudah Selesai'}
                </span>
              </div>

              {/* Middle Information */}
              <div className="space-y-1.5 my-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {slot.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-mono text-sm font-semibold">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{slot.timeSlotString} WIB</span>
                </div>
                <p className="text-xs text-slate-500">
                  {isBreak
                    ? slot.id === 'ISTIRAHAT 1'
                      ? 'Istirahat pertama santri & dewan guru (20 menit).'
                      : 'Istirahat kedua, shalat Dhuhur berjamaah di masjid madrasah (50 menit).'
                    : 'Durasi pembelajaran: 40 menit per jam tatap muka.'}
                </p>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                {isBreak ? (
                  <span className="text-xs italic text-amber-800 flex items-center gap-1.5 font-medium">
                    <Coffee className="w-3.5 h-3.5" /> Absensi tidak dibuka saat istirahat
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartAttendance(slot.id as PeriodId)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors ${
                      isCurrent
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Catat Absen Jam {slot.code}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SOP Guru Piket Callout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600" />
          Prosedur Standar (SOP) Guru Piket MA Darul Mahfudz
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-800 mb-1">1. Monitoring Pergantian Jam</p>
            <p>
              Guru piket berkeliling mengecek ruang kelas 5 menit setelah bel berbunyi untuk memastikan guru telah hadir di kelas.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-800 mb-1">2. Penanganan Kelas Kosong</p>
            <p>
              Jika guru berhalangan (Izin/Sakit/Tugas), guru piket segera memberikan tugas mandiri atau menggantikan sementara.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-800 mb-1">3. Pengesahan Laporan Harian</p>
            <p>
              Pada jam ke-IX (14.40 WIB), guru piket mencetak/mengekspor rekapitulasi harian untuk ditandatangani Kepala Madrasah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
