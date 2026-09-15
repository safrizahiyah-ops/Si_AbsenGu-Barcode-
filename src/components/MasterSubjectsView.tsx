import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Subject } from '../types';
import { BookOpen, Plus, Edit2, Trash2, X } from 'lucide-react';

export const MasterSubjectsView: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useAttendance();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subject | null>(null);

  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [category, setCategory] = useState<'Pendidikan Agama Islam' | 'Umum' | 'Muatan Lokal'>('Pendidikan Agama Islam');

  const handleOpenAdd = () => {
    setEditingSub(null);
    setName('');
    setCode('');
    setCategory('Pendidikan Agama Islam');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSub(s);
    setName(s.name);
    setCode(s.code || '');
    setCategory(s.category);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSub) {
      updateSubject(editingSub.id, {
        name: name.trim(),
        code: code.trim(),
        category,
      });
    } else {
      addSubject({
        name: name.trim(),
        code: code.trim() || name.substring(0, 3).toUpperCase(),
        category,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            Data Mata Pelajaran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mata pelajaran rumpun PAI (Kemenag), mapel umum (Kemendikbud), dan muatan lokal pesantren
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    sub.category === 'Pendidikan Agama Islam'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sub.category === 'Umum'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sub.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">{sub.code || '-'}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2">{sub.name}</h3>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(sub)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus mata pelajaran ${sub.name}?`)) {
                    deleteSubject(sub.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingSub ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
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
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akidah Akhlak"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kode Mapel
                  </label>
                  <input
                    type="text"
                    placeholder="AKH"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kelompok / Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="Pendidikan Agama Islam">Pendidikan Agama Islam</option>
                    <option value="Umum">Umum (Kemendikbud)</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
