import React, { useState, useMemo, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  DEFAULT_ALL_PERIOD_SLOTS,
  PRESET_ADDITIONAL_PERIODS,
  getCurrentPeriodState,
  getSlotVisualStatus,
  parseTimeToMinutes,
  minutesToTimeString,
  formatTimeSlotString,
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
  Edit3,
  Sliders,
  LayoutGrid,
  Table as TableIcon,
  Save,
  ArrowRight,
  Check,
  Timer,
  ChevronRight,
} from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const {
    currentTime,
    setIsFormModalOpen,
    setEditingRecord,
    periodSlots,
    addPeriodSlot,
    updatePeriodSlot,
    updateAllPeriodSlots,
    deletePeriodSlot,
    resetPeriodSlots,
    showToast,
    settings,
    setActiveTab,
  } = useAttendance();

  // View mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [slotToEdit, setSlotToEdit] = useState<PeriodSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<PeriodSlot | null>(null);

  // Form states for manual period creation
  const [formCode, setFormCode] = useState<string>('X');
  const [formName, setFormName] = useState<string>('Jam Pelajaran X (Ke-10)');
  const [formStartTime, setFormStartTime] = useState<string>('14:40');
  const [formEndTime, setFormEndTime] = useState<string>('15:20');
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for period edit modal
  const [editCode, setEditCode] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('08:50');
  const [editEndTime, setEditEndTime] = useState<string>('09:30');
  const [editDuration, setEditDuration] = useState<number>(40);
  const [editIsBreak, setEditIsBreak] = useState<boolean>(false);
  const [editCascadeSubsequent, setEditCascadeSubsequent] = useState<boolean>(true);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Table direct edit states
  const [tableSlots, setTableSlots] = useState<PeriodSlot[]>(periodSlots);
  const [tableCascadeOnEdit, setTableCascadeOnEdit] = useState<boolean>(true);
  const [tableHasUnsavedChanges, setTableHasUnsavedChanges] = useState<boolean>(false);

  // Sync tableSlots with periodSlots when periodSlots changes from outside
  useEffect(() => {
    setTableSlots(periodSlots);
    setTableHasUnsavedChanges(false);
  }, [periodSlots]);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const activePeriodState = getCurrentPeriodState(currentTime, periodSlots);

  // Check which preset periods (X, XI, XII, XIII) are currently added
  const existingCodes = useMemo(() => {
    return periodSlots.map((s) => s.code.toUpperCase());
  }, [periodSlots]);

  const hasExtraSlots = useMemo(() => {
    return (
      periodSlots.length > DEFAULT_ALL_PERIOD_SLOTS.length ||
      periodSlots.some((s) => !DEFAULT_ALL_PERIOD_SLOTS.some((d) => d.id === s.id))
    );
  }, [periodSlots]);

  // Determine recommendation for the next period code
  const nextRecommendedPreset = useMemo(() => {
    return PRESET_ADDITIONAL_PERIODS.find((preset) => !existingCodes.includes(preset.code));
  }, [existingCodes]);

  // Open Edit Modal for a specific slot
  const handleOpenEditModal = (slot: PeriodSlot) => {
    setSlotToEdit(slot);
    setEditCode(slot.code);
    setEditName(slot.name);
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
    setEditIsBreak(slot.isBreak);
    const dur = Math.max(5, parseTimeToMinutes(slot.endTime) - parseTimeToMinutes(slot.startTime));
    setEditDuration(dur);
    setEditCascadeSubsequent(true);
    setEditFormError(null);
  };

  // Change duration in edit modal -> automatically calculate new end time
  const handleEditDurationChange = (newDur: number) => {
    const validDur = Math.max(5, newDur);
    setEditDuration(validDur);
    const startMins = parseTimeToMinutes(editStartTime);
    const newEndMins = startMins + validDur;
    setEditEndTime(minutesToTimeString(newEndMins));
  };

  // Change start time in edit modal -> adjust end time by duration
  const handleEditStartTimeChange = (newStart: string) => {
    setEditStartTime(newStart);
    const startMins = parseTimeToMinutes(newStart);
    if (!isNaN(startMins) && editDuration > 0) {
      const newEndMins = startMins + editDuration;
      setEditEndTime(minutesToTimeString(newEndMins));
    }
  };

  // Change end time in edit modal -> adjust duration
  const handleEditEndTimeChange = (newEnd: string) => {
    setEditEndTime(newEnd);
    const startMins = parseTimeToMinutes(editStartTime);
    const endMins = parseTimeToMinutes(newEnd);
    if (!isNaN(startMins) && !isNaN(endMins) && endMins > startMins) {
      setEditDuration(endMins - startMins);
    }
  };

  // Submit Edit Modal
  const handleSaveEditSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotToEdit) return;

    setEditFormError(null);
    const startMins = parseTimeToMinutes(editStartTime);
    const endMins = parseTimeToMinutes(editEndTime);

    if (isNaN(startMins) || isNaN(endMins) || startMins >= endMins) {
      setEditFormError('Waktu mulai harus lebih awal daripada waktu selesai!');
      return;
    }

    const res = updatePeriodSlot(
      slotToEdit.id,
      {
        name: editName.trim() || slotToEdit.name,
        startTime: editStartTime,
        endTime: editEndTime,
        isBreak: editIsBreak,
      },
      { cascadeSubsequent: editCascadeSubsequent }
    );

    if (res.success) {
      setSlotToEdit(null);
    } else if (res.error) {
      setEditFormError(res.error);
    }
  };

  // Open Add Modal
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
      setFormCode(`P${periodSlots.length + 1}`);
      setFormName(`Jam Pelajaran Tambahan ke-${periodSlots.length + 1}`);
      setFormStartTime(minutesToTimeString(startMin));
      setFormEndTime(minutesToTimeString(endMin));
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

    const timeSlotString = formatTimeSlotString(formStartTime, formEndTime);
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

  // Table view helper: edit a cell directly in table mode
  const handleTableSlotChange = (
    index: number,
    field: keyof PeriodSlot | 'duration',
    value: string | number | boolean
  ) => {
    const updated = [...tableSlots];
    const current = { ...updated[index] };

    if (field === 'startTime') {
      const oldStartMins = parseTimeToMinutes(current.startTime);
      const oldEndMins = parseTimeToMinutes(current.endTime);
      const currentDur = Math.max(10, oldEndMins - oldStartMins);
      current.startTime = String(value);

      const newStartMins = parseTimeToMinutes(String(value));
      const newEndMins = newStartMins + currentDur;
      current.endTime = minutesToTimeString(newEndMins);
      current.timeSlotString = formatTimeSlotString(current.startTime, current.endTime);
    } else if (field === 'endTime') {
      current.endTime = String(value);
      current.timeSlotString = formatTimeSlotString(current.startTime, current.endTime);
    } else if (field === 'duration') {
      const dur = Math.max(5, Number(value));
      const startMins = parseTimeToMinutes(current.startTime);
      const newEndMins = startMins + dur;
      current.endTime = minutesToTimeString(newEndMins);
      current.timeSlotString = formatTimeSlotString(current.startTime, current.endTime);
    } else if (field === 'name') {
      current.name = String(value);
    } else if (field === 'code') {
      current.code = String(value).toUpperCase();
    } else if (field === 'isBreak') {
      current.isBreak = Boolean(value);
    }

    updated[index] = current;

    // If auto cascade is enabled, ripple shift all subsequent rows
    if (tableCascadeOnEdit) {
      let prevEnd = current.endTime;
      for (let i = index + 1; i < updated.length; i++) {
        const nextSlot = { ...updated[i] };
        const slotStartMins = parseTimeToMinutes(nextSlot.startTime);
        const slotEndMins = parseTimeToMinutes(nextSlot.endTime);
        const slotDur = Math.max(10, slotEndMins - slotStartMins);

        const shiftedStartMins = parseTimeToMinutes(prevEnd);
        const shiftedEndMins = shiftedStartMins + slotDur;

        nextSlot.startTime = minutesToTimeString(shiftedStartMins);
        nextSlot.endTime = minutesToTimeString(shiftedEndMins);
        nextSlot.timeSlotString = formatTimeSlotString(nextSlot.startTime, nextSlot.endTime);

        updated[i] = nextSlot;
        prevEnd = nextSlot.endTime;
      }
    }

    setTableSlots(updated);
    setTableHasUnsavedChanges(true);
  };

  // Save changes from Table Mode
  const handleSaveAllTableChanges = () => {
    const res = updateAllPeriodSlots(tableSlots);
    if (res.success) {
      setTableHasUnsavedChanges(false);
    }
  };

  // Auto-cascade all rows in sequence starting from the first slot
  const handleAutoCascadeAllSequence = () => {
    if (tableSlots.length === 0) return;
    const cascaded = [...tableSlots];
    let prevEnd = cascaded[0].endTime;

    for (let i = 1; i < cascaded.length; i++) {
      const slot = { ...cascaded[i] };
      const sMins = parseTimeToMinutes(slot.startTime);
      const eMins = parseTimeToMinutes(slot.endTime);
      const dur = Math.max(10, eMins - sMins);

      const shiftedStart = parseTimeToMinutes(prevEnd);
      const shiftedEnd = shiftedStart + dur;

      slot.startTime = minutesToTimeString(shiftedStart);
      slot.endTime = minutesToTimeString(shiftedEnd);
      slot.timeSlotString = formatTimeSlotString(slot.startTime, slot.endTime);

      cascaded[i] = slot;
      prevEnd = slot.endTime;
    }

    setTableSlots(cascaded);
    setTableHasUnsavedChanges(true);
    showToast('Seluruh jam pelajaran berhasil disinkronkan berurutan!', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-700" />
              Jadwal Jam Pelajaran & Pergantian Jam
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Semua Kolom Bisa Diedit Manual
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur rentang jam (misal Jam III: 08.50 - 09.30) & durasi. Perubahan otomatis menyesuaikan formulir absensi dan banner waktu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Period Indicator */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {activePeriodState.displayText} ({activePeriodState.timeSlotText})
          </span>

          {/* View mode toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Edit Manual</span>
            </button>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={resetPeriodSlots}
            title="Kembalikan jadwal ke format standar (Jam I - IX)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          {/* Add period manual button */}
          <button
            id="btn-tambah-jam-pelajaran-manual"
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs hover:shadow-md transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Jam Pelajaran (s/d Ke-13)</span>
          </button>
        </div>
      </div>

      {/* Info Callout Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-emerald-950">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold">Sinkronisasi Otomatis Terhubung:</span>{' '}
            Durasi standar saat ini adalah <strong className="text-emerald-800 underline font-black">{settings.lessonDurationMinutes || 40} Menit</strong> per jam pelajaran (dapat diatur di menu <button type="button" onClick={() => setActiveTab('settings')} className="font-bold underline text-emerald-800 hover:text-emerald-950">Pengaturan</button>). Setiap perubahan rentang waktu langsung terhubung ke perhitungan laporan harian & mingguan, form absensi, dan jam berjalan secara instan.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-800" />
            1 Jam = {settings.lessonDurationMinutes || 40} Menit
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
            {periodSlots.filter((s) => !s.isBreak).length} Jam KBM
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-[11px]">
            {periodSlots.filter((s) => s.isBreak).length} Istirahat
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: CARDS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {periodSlots.map((slot) => {
            const visual = getSlotVisualStatus(slot, currentMinutes);
            const isCurrent = activePeriodState.currentSlot?.id === slot.id;
            const isBreak = slot.isBreak;
            const isStandardDefault = DEFAULT_ALL_PERIOD_SLOTS.some((d) => d.id === slot.id);
            const slotDuration = Math.max(
              0,
              parseTimeToMinutes(slot.endTime) - parseTimeToMinutes(slot.startTime)
            );

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

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {slotDuration} Menit
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Visual status chip */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
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
                        : 'Selesai'}
                    </span>

                    {/* Delete button if extra custom slot */}
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
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {slot.name}
                    </h3>
                  </div>

                  {/* Highlighted Time Range Display */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/90 border border-slate-200 font-mono text-sm font-bold text-slate-800">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{slot.timeSlotString} WIB</span>
                    <span className="text-xs font-sans text-slate-500 ml-auto">
                      ({slotDuration} menit)
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {isBreak
                      ? slot.id === 'ISTIRAHAT 1'
                        ? 'Istirahat pertama santri & dewan guru.'
                        : 'Istirahat kedua & shalat Dhuhur berjamaah.'
                      : !isStandardDefault
                      ? 'Jam pelajaran manual tambahan santri MA Darul Mahfudz.'
                      : 'Durasi tatap muka pembelajaran kelas.'}
                  </p>
                </div>

                {/* Action Buttons: Edit Manual & Catat Absen */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  {/* Edit Manual Rentang Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(slot)}
                    title={`Edit manual rentang jam ${slot.code}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Edit Rentang</span>
                  </button>

                  {/* Catat Absen Button */}
                  {isBreak ? (
                    <span className="text-xs italic text-amber-800 flex items-center gap-1.5 font-medium">
                      <Coffee className="w-3.5 h-3.5" /> Istirahat
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
                      <span>Catat Absen</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: FULL EDITABLE TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-emerald-700" />
                Edit Semua Kolom Jam Pelajaran Secara Manual
              </h2>
              <p className="text-xs text-slate-500">
                Ubah Nama, Jam Mulai, Jam Selesai, atau Durasi pada baris tabel di bawah. Perubahan otomatis menyesuaikan seluruh aplikasi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Cascade Shift toggle */}
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={tableCascadeOnEdit}
                  onChange={(e) => setTableCascadeOnEdit(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
                <span>Auto-Cascade (Geser Jam Berikutnya Otomatis)</span>
              </label>

              {/* Auto Cascade all sequence */}
              <button
                type="button"
                onClick={handleAutoCascadeAllSequence}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
                title="Rangkai jam pelajaran agar bersambung tepat waktu tanpa celah kosong"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                <span>Rapikan Urutan Berantai</span>
              </button>

              {/* Save All Table Changes */}
              {tableHasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleSaveAllTableChanges}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs animate-bounce"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Tabel</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-300 font-extrabold uppercase text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-28">Kode Jam</th>
                  <th className="py-3 px-3 min-w-[200px]">Nama Jam Pelajaran</th>
                  <th className="py-3 px-3 w-32">Jam Mulai</th>
                  <th className="py-3 px-3 w-32">Jam Selesai</th>
                  <th className="py-3 px-3 w-36">Durasi (Menit)</th>
                  <th className="py-3 px-3 w-32">Tipe Jam</th>
                  <th className="py-3 px-3 w-40 text-center">Aksi / Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tableSlots.map((slot, idx) => {
                  const sMins = parseTimeToMinutes(slot.startTime);
                  const eMins = parseTimeToMinutes(slot.endTime);
                  const duration = Math.max(0, eMins - sMins);
                  const isCurrent = activePeriodState.currentSlot?.id === slot.id;

                  return (
                    <tr
                      key={slot.id || idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-emerald-50/70 font-semibold' : slot.isBreak ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      {/* Kode Jam */}
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono">
                          {slot.code}
                        </span>
                      </td>

                      {/* Nama Jam Pelajaran (Editable) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={slot.name}
                          onChange={(e) => handleTableSlotChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium text-xs text-slate-800"
                        />
                      </td>

                      {/* Jam Mulai (Editable Time) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTableSlotChange(idx, 'startTime', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-xs text-slate-800"
                        />
                      </td>

                      {/* Jam Selesai (Editable Time) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTableSlotChange(idx, 'endTime', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-xs text-slate-800"
                        />
                      </td>

                      {/* Durasi Menit with Quick Controls */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Kurang 5 menit"
                            onClick={() => handleTableSlotChange(idx, 'duration', Math.max(5, duration - 5))}
                            className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="5"
                            max="180"
                            value={duration}
                            onChange={(e) => handleTableSlotChange(idx, 'duration', parseInt(e.target.value, 10) || 5)}
                            className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 text-[11px]">mnt</span>
                          <button
                            type="button"
                            title="Tambah 5 menit"
                            onClick={() => handleTableSlotChange(idx, 'duration', duration + 5)}
                            className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Tipe Jam (KBM vs Istirahat) */}
                      <td className="py-2.5 px-3">
                        <select
                          value={slot.isBreak ? 'break' : 'study'}
                          onChange={(e) => handleTableSlotChange(idx, 'isBreak', e.target.value === 'break')}
                          className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold"
                        >
                          <option value="study">Jam KBM</option>
                          <option value="break">Istirahat</option>
                        </select>
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(slot)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 transition-colors"
                            title="Edit Modal Lengkap"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {!slot.isBreak && (
                            <button
                              type="button"
                              onClick={() => handleStartAttendance(slot.id as PeriodId)}
                              className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px]"
                              title={`Input absensi Jam ${slot.code}`}
                            >
                              Absen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary & Save */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                <strong>Total Slot:</strong> {tableSlots.length} Jam
              </span>
              <span>
                <strong>Rentang Waktu Sekolah:</strong>{' '}
                {tableSlots[0]?.startTime || '07:30'} s.d.{' '}
                {tableSlots[tableSlots.length - 1]?.endTime || '14:40'} WIB
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAllTableChanges}
                disabled={!tableHasUnsavedChanges}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tableHasUnsavedChanges
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-98'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Simpan Semua Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL 1: EDIT RENTANG & DURASI JAM PELAJARAN (Spesifik per Jam) */}
      {slotToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10">
                  <Edit3 className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Edit Rentang Jam Pelajaran {slotToEdit.code}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Ubah jam mulai, jam selesai, atau durasi secara manual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSlotToEdit(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEditSlot} className="p-5 sm:p-6 space-y-5">
              {editFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* Current vs New Highlight Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Rentang Sebelumnya:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {slotToEdit.timeSlotString} WIB
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                  <span className="text-emerald-900 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Rentang Baru (Hasil Edit):
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                    {editStartTime.replace(':', '.')} – {editEndTime.replace(':', '.')} WIB ({editDuration} Menit)
                  </span>
                </div>
              </div>

              {/* Field: Nama Jam Pelajaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Jam Pelajaran:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Misal: Jam Pelajaran III"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-semibold"
                />
              </div>

              {/* Field: Jam Mulai & Jam Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Mulai:
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => handleEditStartTimeChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Selesai:
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => handleEditEndTimeChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-mono font-bold"
                  />
                </div>
              </div>

              {/* Field: Durasi dengan Pilihan Cepat Preset */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Durasi Jam Pelajaran:
                  </label>
                  <span className="text-xs font-mono font-extrabold text-emerald-800">
                    {editDuration} Menit
                  </span>
                </div>

                {/* Quick duration presets */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[30, 35, 40, 45, 50].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleEditDurationChange(mins)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        editDuration === mins
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins} mnt
                    </button>
                  ))}
                </div>
              </div>

              {/* Cascade Checkbox */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCascadeSubsequent}
                    onChange={(e) => setEditCascadeSubsequent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-extrabold text-amber-950">
                      Otomatis sesuaikan jam-jam berikutnya (Cascade Shift)
                    </span>
                    <p className="text-amber-800 mt-0.5 text-[11px] leading-relaxed">
                      Jika dicentang, jam pelajaran sesudah ini (misal Jam IV, Istirahat, Jam V, dst.) akan otomatis bergeser menyambung tepat pada jam selesai baru ini tanpa celah bertumpuk.
                    </p>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSlotToEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-98"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH JAM PELAJARAN MANUAL (s/d Ke-13) */}
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

      {/* CONFIRMATION MODAL TO DELETE A CUSTOM PERIOD SLOT */}
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
