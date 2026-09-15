import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { ClassRoom } from '../types';
import { School, Plus, Edit2, Trash2, X } from 'lucide-react';

export const MasterClassesView: React.FC = () => {
  const { classes, addClassRoom, updateClassRoom, deleteClassRoom } = useAttendance();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const [name, setName] = useState<string>('');
  const [grade, setGrade] = useState<'VII' | 'VIII' | 'IX' | 'X' | 'XI' | 'XII'>('VII');
  const [level, setLevel] = useState<'MTs' | 'MA'>('MTs');
  const [group, setGroup] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingClass(null);
    setName('');
    setGrade('VII');
    setLevel('MTs');
    setGroup('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClassRoom) => {
    setEditingClass(c);
    setName(c.name);
    setGrade(c.grade);
    setLevel(c.level);
    setGroup(c.group || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClass) {
      updateClassRoom(editingClass.id, {
        name: name.trim(),
        grade,
        level,
        group: group.trim() || undefined,
      });
    } else {
      addClassRoom({
        name: name.trim(),
        grade,
        level,
        group: group.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-700" />
            Data Kelas & Rombongan Belajar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar kelas jenjang MTs (Kelas VII-IX) dan MA (Kelas X-XII) Darul Mahfudz
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                  Kelas {cls.grade}
                </span>
                <span className="text-xs text-emerald-700 font-bold">{cls.level}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-2">{cls.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {cls.level === 'MTs'
                  ? 'Madrasah Tsanawiyah (MTs)'
                  : 'Madrasah Aliyah (MA)'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(cls)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus kelas ${cls.name}?`)) {
                    deleteClassRoom(cls.id);
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
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
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: VII-A atau X-IPA 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenjang
                  </label>
                  <select
                    value={level}
                    onChange={(e) => {
                      const lvl = e.target.value as 'MTs' | 'MA';
                      setLevel(lvl);
                      setGrade(lvl === 'MTs' ? 'VII' : 'X');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="MTs">MTs (Tsanawiyah)</option>
                    <option value="MA">MA (Aliyah)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tingkat
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    {level === 'MTs' ? (
                      <>
                        <option value="VII">Kelas VII</option>
                        <option value="VIII">Kelas VIII</option>
                        <option value="IX">Kelas IX</option>
                      </>
                    ) : (
                      <>
                        <option value="X">Kelas X</option>
                        <option value="XI">Kelas XI</option>
                        <option value="XII">Kelas XII</option>
                      </>
                    )}
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
