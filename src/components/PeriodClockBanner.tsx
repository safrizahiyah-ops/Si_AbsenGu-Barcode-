import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  ALL_PERIOD_SLOTS,
  getCurrentPeriodState,
  getSlotVisualStatus,
  parseTimeToMinutes,
} from '../constants/schedule';
import { PeriodSlot, PeriodId } from '../types';
import { Clock, AlertCircle, ArrowRight, Play, CheckCircle2, Coffee, Sparkles } from 'lucide-react';

export const PeriodClockBanner: React.FC = () => {
  const { currentTime, setIsFormModalOpen, setEditingRecord } = useAttendance();
  const [simulatedTimeStr, setSimulatedTimeStr] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Effective time for period detection (either real-time or simulation)
  const effectiveDate = React.useMemo(() => {
    if (!isSimulating || !simulatedTimeStr) {
      return currentTime;
    }
    const [h, m] = simulatedTimeStr.split(':').map(Number);
    const d = new Date(currentTime);
    d.setHours(h, m, 0);
    return d;
  }, [currentTime, isSimulating, simulatedTimeStr]);

  const periodState = getCurrentPeriodState(effectiveDate);
  const currentMinutes = effectiveDate.getHours() * 60 + effectiveDate.getMinutes();

  const handleStartAttendanceForPeriod = (periodId?: PeriodId) => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
    // If specific period is passed, form can initialize with it
    if (periodId) {
      sessionStorage.setItem('dm_target_period', periodId);
    }
  };

  const getVisualIndicatorConfig = (status: 'active' | 'upcoming_soon' | 'completed' | 'upcoming') => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-emerald-500 text-white border-emerald-600',
          dotColor: 'bg-emerald-400',
          label: 'Sedang Berlangsung',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'upcoming_soon':
        return {
          bg: 'bg-amber-400 text-amber-950 border-amber-500',
          dotColor: 'bg-amber-500 animate-ping',
          label: 'Segera Memasuki',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'upcoming':
        return {
          bg: 'bg-blue-500 text-white border-blue-600',
          dotColor: 'bg-blue-300',
          label: 'Jam Berikutnya',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'completed':
      default:
        return {
          bg: 'bg-slate-200 text-slate-600 border-slate-300',
          dotColor: 'bg-slate-400',
          label: 'Selesai',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-200 border border-emerald-500/30">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                Sistem Pergantian Jam Otomatis
              </span>
              {isSimulating && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-950">
                  <Sparkles className="w-3 h-3" /> Mode Simulasi Waktu
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {periodState.displayText}
              </h2>
              <span className="text-base sm:text-lg font-medium text-emerald-100/90 font-mono">
                {periodState.timeSlotText}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100/80">
              {periodState.isBreak ? (
                <span className="flex items-center gap-1.5 text-amber-200">
                  <Coffee className="w-4 h-4" /> Waktu istirahat madrasah, absensi kelas ditangguhkan.
                </span>
              ) : periodState.currentSlot ? (
                `Sisa waktu jam pelajaran ini: ${periodState.timeRemainingMinutes} menit`
              ) : (
                'Di luar jam aktif belajar mengajar madrasah (07.30 - 14.40 WIB).'
              )}
            </p>
          </div>

          {/* Action on Active Slot */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {periodState.currentSlot && !periodState.isBreak && (
              <button
                id="btn-absen-jam-ini"
                type="button"
                onClick={() => handleStartAttendanceForPeriod(periodState.currentSlot?.id as PeriodId)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm shadow-md transition-all active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Absen Jam Ini ({periodState.currentSlot.code})</span>
              </button>
            )}

            {/* Simulation toggle button for testing periods */}
            <div className="flex items-center gap-1.5 bg-emerald-900/60 p-1 rounded-xl border border-emerald-600/40 text-xs">
              <span className="text-emerald-200 text-[11px] font-medium px-1.5 hidden sm:inline">Uji Jam:</span>
              <select
                className="bg-emerald-950 text-white rounded-lg px-2 py-1 text-xs font-semibold border border-emerald-500/40 focus:outline-hidden"
                value={isSimulating ? simulatedTimeStr : 'live'}
                onChange={(e) => {
                  if (e.target.value === 'live') {
                    setIsSimulating(false);
                    setSimulatedTimeStr('');
                  } else {
                    setIsSimulating(true);
                    setSimulatedTimeStr(e.target.value);
                  }
                }}
              >
                <option value="live">Waktu Real-time</option>
                <option value="07:45">07.45 (Jam I)</option>
                <option value="08:15">08.15 (Jam II)</option>
                <option value="09:00">09.00 (Jam III)</option>
                <option value="09:40">09.40 (Jam IV)</option>
                <option value="10:15">10.15 (Istirahat 1)</option>
                <option value="10:45">10.45 (Jam V)</option>
                <option value="11:20">11.20 (Jam VI)</option>
                <option value="12:00">12.00 (Jam VII)</option>
                <option value="12:45">12.45 (Istirahat 2)</option>
                <option value="13:30">13.30 (Jam VIII)</option>
                <option value="14:10">14.10 (Jam IX)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline strip with mandated colors */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Alur Jam Pelajaran Hari Ini (I - IX)
          </span>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hijau: Berlangsung
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Kuning: Segera Masuk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Biru: Berikutnya
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Abu-abu: Selesai
            </span>
          </div>
        </div>

        {/* Period Pills Horizontal Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
          {ALL_PERIOD_SLOTS.map((slot) => {
            const visual = getSlotVisualStatus(slot, currentMinutes);
            const isBreak = slot.isBreak;
            const isSelectedActive = periodState.currentSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isBreak}
                onClick={() => !isBreak && handleStartAttendanceForPeriod(slot.id as PeriodId)}
                title={isBreak ? 'Waktu Istirahat' : `Klik untuk input absensi Jam ${slot.code}`}
                className={`relative flex flex-col justify-between p-2.5 rounded-xl border text-center transition-all text-left ${
                  isBreak ? 'cursor-default opacity-85' : 'cursor-pointer hover:shadow-md hover:border-emerald-400 active:scale-98'
                } ${
                  isSelectedActive
                    ? 'ring-2 ring-emerald-500 ring-offset-1 font-bold shadow-xs'
                    : ''
                } ${
                  visual === 'active'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                    : visual === 'upcoming_soon'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-2xs animate-pulse'
                    : visual === 'upcoming'
                    ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                    : 'bg-white border-slate-200 text-slate-500 opacity-80'
                }`}
              >
                {/* Top indicator dot */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      visual === 'active'
                        ? 'bg-emerald-500'
                        : visual === 'upcoming_soon'
                        ? 'bg-amber-500'
                        : visual === 'upcoming'
                        ? 'bg-blue-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="text-[10px] uppercase font-bold tracking-tight text-slate-500">
                    {isBreak ? 'Break' : `Jam ${slot.code}`}
                  </span>
                </div>

                <div className="py-0.5">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                    {isBreak ? (slot.id === 'ISTIRAHAT 1' ? 'Istirahat 1' : 'Istirahat 2') : slot.code}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {slot.startTime}
                  </p>
                </div>

                {/* Status mini tag */}
                <div className="mt-1">
                  <span
                    className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-sm uppercase ${
                      visual === 'active'
                        ? 'bg-emerald-600 text-white'
                        : visual === 'upcoming_soon'
                        ? 'bg-amber-500 text-white'
                        : visual === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {visual === 'active'
                      ? 'Aktif'
                      : visual === 'upcoming_soon'
                      ? 'Segera'
                      : visual === 'upcoming'
                      ? 'Nanti'
                      : 'Lewat'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
