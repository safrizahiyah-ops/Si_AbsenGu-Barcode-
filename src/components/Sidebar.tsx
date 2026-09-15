import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  ClipboardCheck,
  Clock,
  BarChart3,
  TrendingUp,
  CalendarDays,
  GraduationCap,
  School,
  BookOpen,
  Settings,
  Printer,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavMenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  category?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, records, settings } = useAttendance();

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = records.filter((r) => r.date === today).length;

  const menuItems: NavMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      category: 'Utama',
    },
    {
      id: 'attendance_list',
      label: 'Absensi Guru',
      icon: ClipboardCheck,
      badge: todayCount > 0 ? `${todayCount} Hari Ini` : undefined,
      category: 'Utama',
    },
    {
      id: 'schedule',
      label: 'Jadwal Pelajaran',
      icon: Clock,
      category: 'Utama',
    },
    {
      id: 'daily_recap',
      label: 'Rekap Harian',
      icon: BarChart3,
      category: 'Laporan',
    },
    {
      id: 'weekly_recap',
      label: 'Rekap Mingguan',
      icon: TrendingUp,
      category: 'Laporan',
    },
    {
      id: 'monthly_recap',
      label: 'Rekap Bulanan',
      icon: CalendarDays,
      category: 'Laporan',
    },
    {
      id: 'print_hub',
      label: 'Cetak / Download Laporan',
      icon: Printer,
      category: 'Laporan',
    },
    {
      id: 'master_teachers',
      label: 'Data Guru',
      icon: GraduationCap,
      category: 'Master Data',
    },
    {
      id: 'master_classes',
      label: 'Data Kelas',
      icon: School,
      category: 'Master Data',
    },
    {
      id: 'master_subjects',
      label: 'Data Mata Pelajaran',
      icon: BookOpen,
      category: 'Master Data',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      category: 'Sistem',
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-18 bottom-0 left-0 z-40 w-68 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-5">
          {/* Institution Header Mini Card with Logo */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-50/70 to-slate-50 border border-emerald-100 text-slate-700 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-xl bg-white p-1 border border-emerald-200/80 shadow-2xs flex items-center justify-center mb-2 overflow-hidden">
              <img
                src="/logo.png"
                alt="Logo Darul Mahfudz"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="font-extrabold text-xs text-slate-900 tracking-wide uppercase">
              {settings.schoolName}
            </p>
            <p className="text-[10px] font-semibold text-emerald-800 mt-0.5">
              Tahun {settings.academicYear} • Sem. {settings.semester}
            </p>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {settings.picketTeam || 'Piket Resmi'}
            </span>
          </div>

          {/* Navigation Items Grouped */}
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              const showCategory =
                index === 0 || item.category !== menuItems[index - 1].category;

              return (
                <React.Fragment key={item.id}>
                  {showCategory && (
                    <p className="px-3 pt-4 pb-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      {item.category}
                    </p>
                  )}

                  <button
                    id={`sidebar-nav-${item.id}`}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs border border-emerald-200/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Bottom Tagline */}
          <div className="pt-4 border-t border-slate-200 text-center px-1">
            <p className="text-[11px] italic text-slate-500 font-medium leading-snug">
              “Tertib Administrasi, Disiplin Mengajar, Berkualitas dalam Pendidikan.”
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
