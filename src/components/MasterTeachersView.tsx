import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Teacher } from '../types';
import { TeacherBarcodeModal } from './TeacherBarcodeModal';
import { TeacherCsvImportModal } from './TeacherCsvImportModal';
import {
  getTeacherBarcodeCode,
  downloadAllTeacherCardsPdf,
  downloadTeacherCardPng,
} from '../utils/barcodeUtils';
import {
  downloadTeacherCsvTemplate,
  exportTeachersToCsv,
} from '../utils/csvTeacherUtils';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  UserCheck,
  QrCode,
  Barcode,
  Download,
  Printer,
  Upload,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';

export const MasterTeachersView: React.FC = () => {
  const {
    teachers,
    subjects,
    settings,
    addTeacher,
    bulkAddTeachers,
    updateTeacher,
    deleteTeacher,
    showToast,
  } = useAttendance();

  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // CSV import modal state
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);

  // Barcode modal states
  const [selectedBarcodeTeacher, setSelectedBarcodeTeacher] = useState<Teacher | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState<boolean>(false);
  const [isNewlyAdded, setIsNewlyAdded] = useState<boolean>(false);
  const [isExportingAllPdf, setIsExportingAllPdf] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [nip, setNip] = useState<string>('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [primarySubject, setPrimarySubject] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.primarySubject && t.primarySubject.toLowerCase().includes(q)) ||
        (t.nip && t.nip.includes(q))
    );
  }, [teachers, search]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setNip('');
    setGender('L');
    setPrimarySubject(subjects[0]?.name || '');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setName(t.name);
    setNip(t.nip || '');
    setGender(t.gender);
    setPrimarySubject(t.primarySubject);
    setPhone(t.phone || '');
    setIsModalOpen(true);
  };

  const handleOpenBarcode = (t: Teacher, newlyAdded = false) => {
    setSelectedBarcodeTeacher(t);
    setIsNewlyAdded(newlyAdded);
    setIsBarcodeModalOpen(true);
  };

  const handleImportComplete = (imported: Teacher[]) => {
    bulkAddTeachers(
      imported.map((t) => ({
        name: t.name,
        nip: t.nip,
        gender: t.gender,
        primarySubject: t.primarySubject,
        phone: t.phone,
        isActive: true,
      }))
    );
  };

  const handleExportAllPdf = async () => {
    if (teachers.length === 0) {
      showToast('Tidak ada data guru untuk dicetak.', 'warning');
      return;
    }
    setIsExportingAllPdf(true);
    try {
      await downloadAllTeacherCardsPdf(teachers, settings);
      showToast('Seluruh kartu barcode guru berhasil dicetak ke PDF.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file PDF kartu barcode.', 'error');
    } finally {
      setIsExportingAllPdf(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, {
        name: name.trim(),
        nip: nip.trim() || undefined,
        gender,
        primarySubject: primarySubject.trim(),
        phone: phone.trim() || undefined,
      });
      setIsModalOpen(false);
    } else {
      const added = addTeacher({
        name: name.trim(),
        nip: nip.trim() || undefined,
        gender,
        primarySubject: primarySubject.trim(),
        phone: phone.trim() || undefined,
        isActive: true,
      });
      setIsModalOpen(false);

      // Auto open barcode download modal for newly inputted teacher
      handleOpenBarcode(added, true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Data Guru & Barcode Presensi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap guru yang diinput otomatis dibuatkan kartu & barcode presensi yang siap diunduh
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Unduh Template CSV */}
          <button
            type="button"
            onClick={() => downloadTeacherCsvTemplate()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-xs transition-colors"
            title="Unduh contoh template format CSV untuk input data guru massal"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Unduh Template CSV</span>
          </button>

          {/* Impor CSV */}
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-xs transition-colors"
            title="Impor banyak data guru sekaligus dari file CSV"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Impor Data Guru (CSV)</span>
          </button>

          {/* Cetak Semua Barcode PDF */}
          <button
            type="button"
            disabled={isExportingAllPdf}
            onClick={handleExportAllPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>{isExportingAllPdf ? 'Membuat PDF...' : 'Cetak Semua Barcode (PDF)'}</span>
          </button>

          {/* Tambah Guru Manual */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru Baru</span>
          </button>
        </div>
      </div>

      {/* Info Banner for CSV & Barcode */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Input Cepat Dewan Guru Tanpa Mengisi Satu per Satu
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Unduh template CSV, isi data nama & mapel, lalu impor. Seluruh barcode presensi guru otomatis terbuat seketika. Anda juga tetap dapat menambah data guru secara manual kapan saja.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => downloadTeacherCsvTemplate()}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor CSV Sekarang</span>
          </button>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama guru, mata pelajaran, NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => exportTeachersToCsv(teachers)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            title="Ekspor seluruh data dewan guru ke file CSV"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <span className="font-semibold text-slate-500">
            Total {teachers.length} Dewan Guru
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
            <Barcode className="w-3.5 h-3.5" />
            Barcode Aktif
          </span>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">Nama Lengkap & Gelar</th>
                <th className="py-3 px-3">NIP / NUPTK</th>
                <th className="py-3 px-3 text-center">L/P</th>
                <th className="py-3 px-3">Mata Pelajaran Utama</th>
                <th className="py-3 px-3 text-center">Barcode & Kartu Presensi</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    {t.phone && <div className="text-[11px] text-slate-400 font-mono">{t.phone}</div>}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">{t.nip || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        t.gender === 'L'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-pink-50 text-pink-700'
                      }`}
                    >
                      {t.gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {t.primarySubject || '-'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenBarcode(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors shadow-2xs"
                        title="Lihat & Unduh Barcode Guru"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Unduh Barcode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTeacherCardPng(t, settings)}
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                        title="Unduh Kartu PNG Langsung"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Edit Data Guru"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(`Hapus guru ${t.name}? Tindakan ini tidak dapat dibatalkan.`)
                          ) {
                            deleteTeacher(t.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Hapus Guru"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Setelah data guru disimpan, <strong>barcode dan kartu presensi akan otomatis dibuat</strong> dan langsung siap diunduh.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. Ahmad Fauzi, S.Pd.I"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1980..."
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhwat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mata Pelajaran Utama
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Al-Qur'an Hadits, Fikih..."
                  value={primarySubject}
                  onChange={(e) => setPrimarySubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="081234..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md"
                >
                  Simpan & Cetak Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Barcode & Card View/Download Modal */}
      <TeacherBarcodeModal
        teacher={selectedBarcodeTeacher}
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setSelectedBarcodeTeacher(null);
          setIsNewlyAdded(false);
        }}
        settings={settings}
        isNewlyAdded={isNewlyAdded}
      />

      {/* CSV Import Modal */}
      <TeacherCsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        existingTeachers={teachers}
        onImportComplete={handleImportComplete}
        onOpenPrintAllPdf={handleExportAllPdf}
      />
    </div>
  );
};
