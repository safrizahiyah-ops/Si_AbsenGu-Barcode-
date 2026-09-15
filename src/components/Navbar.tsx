import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { formatIndonesianDate } from '../constants/schedule';
import { Clock, Calendar, UserCheck, Menu, X, ShieldCheck, Scan } from 'lucide-react';

interface NavbarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { settings, currentTime, setIsFormModalOpen, setEditingRecord, setIsBarcodeScannerOpen } = useAttendance();

  // Format real-time clock HH:mm:ss WIB
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const timeFormatted = `${hours}:${minutes}:${seconds} WIB`;
  const dateFormatted = formatIndonesianDate(currentTime);

  const handleOpenNewAttendance = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3.5">
            <button
              id="mobile-menu-btn"
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* School Crest / Logo Emblem */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-xs border border-emerald-200/80 shrink-0 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Logo MA Darul Mahfudz"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-lg tracking-tight">
                    {settings.schoolName}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Piket Resmi
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 font-medium hidden sm:block">
                  Sistem Absensi Guru Setiap Jam Pelajaran
                </p>
              </div>
            </div>
          </div>

          {/* Right section: Live Time, Date, Guru Piket & Quick Add */}
          <div className="flex items-center gap-4">
            {/* Real-time Clock & Date widget */}
            <div className="hidden md:flex flex-col items-end text-right border-r border-slate-200 pr-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{dateFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 tracking-wider">
                <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>{timeFormatted}</span>
              </div>
            </div>

            {/* Guru Piket badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400 leading-tight">Guru Piket Aktif</p>
                <p className="font-medium text-slate-800 truncate max-w-[140px] leading-tight">
                  {settings.currentPicketTeacher.replace('Ust. ', '').replace('Usth. ', '')}
                </p>
              </div>
            </div>

            {/* Barcode Scanner Action Button */}
            <button
              id="navbar-scan-barcode-btn"
              type="button"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300 text-xs sm:text-sm font-bold shadow-2xs transition-colors"
              title="Pindai Kartu Barcode Guru"
            >
              <Scan className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>

            {/* Quick Action Button */}
            <button
              id="navbar-quick-attendance-btn"
              type="button"
              onClick={handleOpenNewAttendance}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-semibold shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Input Absensi</span>
              <span className="sm:hidden">Absen</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
