import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  DEFAULT_ALL_PERIOD_SLOTS,
  PRESET_ADDITIONAL_PERIODS,
  getCurrentPeriodState,
  getSlotVisualStatus,
  parseTimeToMinutes,
} from '../constants/schedule';
import { PeriodId, PeriodSlot } from '../types';
import {
  Clock,
  Play,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  Plus,
  Trash2,
  RotateCcw,
  X,
  Zap,
  Info,
  Calendar,
} from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const {
    currentTime,
    setIsFormModalOpen,
    setEditingRecord,
    periodSlots,
    addPeriodSlot,
    deletePeriodSlot,
    resetPeriodSlots,
  } = useAttendance();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [slotToDelete, setSlotToDelete] = useState<PeriodSlot | null>(null);

  // Form states for manual period creation
  const [formCode, setFormCode] = useState<string>('X');
  const [formName, setFormName] = useState<string>('Jam Pelajaran X (Ke-10)');
  const [formStartTime, setFormStartTime] = useState<string>('14:40');
  const [formEndTime, setFormEndTime] = useState<string>('15:20');
  const [formError, setFormError] = useState<string | null>(null);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const activePeriodState = getCurrentPeriodState(currentTime, periodSlots);

  // Check which preset periods (X, XI, XII, XIII) are currently added
  const existingCodes = useMemo(() => {
    return periodSlots.map((s) => s.code.toUpperCase());
  }, [periodSlots]);

  const hasExtraSlots = useMemo(() => {
    return periodSlots.length > DEFAULT_ALL_PERIOD_SLOTS.length ||
      periodSlots.some((s) => !DEFAULT_ALL_PERIOD_SLOTS.some((d) => d.id === s.id));
  }, [periodSlots]);

  // Determine recommendation for the next period code
  const nextRecommendedPreset = useMemo(() => {
    return PRESET_ADDITIONAL_PERIODS.find((preset) => !existingCodes.includes(preset.code));
  }, [existingCodes]);

  const handleOpenAddModal = () => {
    setFormError(null);
    if (nextRecommendedPreset) {
      setFormCode(nextRecommendedPreset.code);
      setFormName(nextRecommendedPreset.name);
      setFormStartTime(nextRecommendedPreset.startTime);
      setFormEndTime(nextRecommendedPreset.endTime);
    } else {
      // If beyond XIII, default to sequential number
      const lastSlot = periodSlots[periodSlots.length - 1];
      const startMin = lastSlot ? parseTimeToMinutes(lastSlot.endTime) : 17 * 60 + 20;
      const endMin = startMin + 40;
      const fmt = (min: number) => {
        const h = String(Math.floor(min / 60)).padStart(2, '0');
        const m = String(min % 60).padStart(2, '0');
        return `${h}:${m}`;
      };
      setFormCode(`P${periodSlots.length + 1}`);
      setFormName(`Jam Pelajaran Tambahan ke-${periodSlots.length + 1}`);
      setFormStartTime(fmt(startMin));
      setFormEndTime(fmt(endMin));
    }
    setIsAddModalOpen(true);
  };

  const handleStartAttendance = (periodId: PeriodId) => {
    setEditingRecord(null);
    sessionStorage.setItem('dm_target_period', periodId);
    setIsFormModalOpen(true);
  };

  const handleAddPresetSlot = (preset: PeriodSlot) => {
    addPeriodSlot(preset);
  };

  const handleAddAllUpTo13 = () => {
    const missing = PRESET_ADDITIONAL_PERIODS.filter((p) => !existingCodes.includes(p.code));
    missing.forEach((preset) => {
      addPeriodSlot(preset);
    });
  };

  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Kode jam pelajaran tidak boleh kosong');
      return;
    }

    if (existingCodes.includes(cleanCode)) {
      setFormError(`Jam Pelajaran dengan kode "${cleanCode}" sudah ada`);
      return;
    }

    const startMins = parseTimeToMinutes(formStartTime);
    const endMins = parseTimeToMinutes(formEndTime);
    if (isNaN(startMins) || isNaN(endMins) || startMins >= endMins) {
      setFormError('Waktu mulai harus lebih awal daripada waktu selesai');
      return;
    }

    const timeSlotString = `${formStartTime.replace(':', '.')} – ${formEndTime.replace(':', '.')}`;
    const newSlot: PeriodSlot = {
      id: cleanCode,
      code: cleanCode,
      name: formName.trim() || `Jam Pelajaran ${cleanCode}`,
      startTime: formStartTime,
      endTime: formEndTime,
      isBreak: false,
      timeSlotString,
    };

    const res = addPeriodSlot(newSlot);
    if (res.success) {
      setIsAddModalOpen(false);
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  const confirmDeleteSlot = (slot: PeriodSlot) => {
    deletePeriodSlot(slot.id);
    setSlotToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            Jadwal Jam Pelajaran & Pergantian Jam
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal resmi kegiatan belajar mengajar MA/MTs Darul Mahfudz (Mendukung Jam I s.d. Jam ke-13)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {activePeriodState.displayText} ({activePeriodState.timeSlotText})
          </span>

          {hasExtraSlots && (
            <button
              type="button"
              onClick={resetPeriodSlots}
              title="Kembalikan jadwal ke format standar (Jam I - IX)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          )}

          <button
            id="btn-tambah-jam-pelajaran-manual"
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs hover:shadow-md transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jam Pelajaran Manual</span>
          </button>
        </div>
      </div>

      {/* Quick notice banner if extra periods up to XIII are added */}
      {hasExtraSlots && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Fitur Jam Pelajaran Tambahan Aktif:</strong> Jam pelajaran manual telah ditambahkan ke sistem dan siap digunakan pada formulir absensi dan scanner barcode.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold text-[11px]">
            Total {periodSlots.filter((s) => !s.isBreak).length} Jam Pelajaran
          </span>
        </div>
      )}

      {/* Main Timetable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {periodSlots.map((slot) => {
          const visual = getSlotVisualStatus(slot, currentMinutes);
          const isCurrent = activePeriodState.currentSlot?.id === slot.id;
          const isBreak = slot.isBreak;
          const isStandardDefault = DEFAULT_ALL_PERIOD_SLOTS.some((d) => d.id === slot.id);

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrent
                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/40 shadow-md'
                  : visual === 'upcoming_soon'
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400 shadow-xs'
                  : visual === 'upcoming'
                  ? 'bg-white border-slate-200 hover:border-emerald-300'
                  : 'bg-slate-50/60 border-slate-200 opacity-80'
              }`}
            >
              {/* Badge strip at top */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
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

                  {!isStandardDefault && !isBreak && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Manual / Tambahan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
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

                  {/* Delete button for manually added slots */}
                  {!isStandardDefault && (
                    <button
                      type="button"
                      onClick={() => setSlotToDelete(slot)}
                      title={`Hapus Jam Pelajaran ${slot.code}`}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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
                    : !isStandardDefault
                    ? 'Jam pelajaran manual tambahan / sore santri MA Darul Mahfudz.'
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
              Pada jam pelajaran terakhir, guru piket mencetak/mengekspor rekapitulasi harian untuk ditandatangani Kepala Madrasah.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Tambah Jam Pelajaran Secara Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10">
                  <Plus className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Tambah Jam Pelajaran Manual</h3>
                  <p className="text-xs text-emerald-200">
                    Tambah jam pelajaran hingga jam ke-13 atau waktu sore
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Quick Presets Section (Jam X s.d Jam XIII) */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Pilihan Cepat Preset (Jam X s.d. Jam XIII):
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                    Satu Klik
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Klik tombol di bawah untuk menambah jam pelajaran berikutnya secara instan (durasi standar 40 menit):
                </p>

                {/* Individual Preset Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_ADDITIONAL_PERIODS.map((preset) => {
                    const isAdded = existingCodes.includes(preset.code);
                    return (
                      <button
                        key={preset.code}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddPresetSlot(preset)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                          isAdded
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-2xs'
                        }`}
                      >
                        <span>
                          Jam {preset.code} ({preset.startTime} - {preset.endTime})
                        </span>
                        {isAdded ? (
                          <span className="text-[10px] text-slate-400">Sudah Ada</span>
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Button to add all remaining up to 13 */}
                {PRESET_ADDITIONAL_PERIODS.some((p) => !existingCodes.includes(p.code)) && (
                  <button
                    type="button"
                    onClick={handleAddAllUpTo13}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>Tambah Sekaligus Sampai Jam Ke-13 (Jam X s.d. XIII)</span>
                  </button>
                )}
              </div>

              {/* Form Input Manual Kustom */}
              <form onSubmit={handleCustomFormSubmit} className="space-y-4 border-t border-slate-200 pt-4">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Atau Isi Formulir Jam Pelajaran Kustom:
                </h4>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Jam (Angka Romawi / Simbol):
                    </label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="Misal: X, XI, XII, XIII"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Jam Pelajaran:
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Misal: Jam Pelajaran X (Ke-10)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Waktu Mulai:
                    </label>
                    <input
                      type="time"
                      required
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Waktu Selesai:
                    </label>
                    <input
                      type="time"
                      required
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Jam pelajaran yang baru ditambahkan akan langsung terintegrasi otomatis ke kolom <strong>"Mulai Jam"</strong> dan <strong>"Sampai Jam"</strong> pada Form Absensi dan Scanner Barcode.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Simpan Jam Pelajaran
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to delete a custom period slot */}
      {slotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900">
                Hapus Jam Pelajaran {slotToDelete.code}?
              </h4>
            </div>

            <p className="text-xs text-slate-600">
              Jam Pelajaran <strong>{slotToDelete.name} ({slotToDelete.timeSlotString} WIB)</strong> akan dihapus dari jadwal dan daftar pilihan absensi.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSlotToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteSlot(slotToDelete)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
