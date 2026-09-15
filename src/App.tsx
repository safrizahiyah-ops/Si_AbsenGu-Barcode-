import React, { useState } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AttendanceModal } from './components/AttendanceModal';
import { BarcodeAttendanceScannerModal } from './components/BarcodeAttendanceScannerModal';
import { DashboardView } from './components/DashboardView';
import { AttendanceListView } from './components/AttendanceListView';
import { DailyReportView } from './components/DailyReportView';
import { WeeklyReportView } from './components/WeeklyReportView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { ScheduleView } from './components/ScheduleView';
import { MasterTeachersView } from './components/MasterTeachersView';
import { MasterClassesView } from './components/MasterClassesView';
import { MasterSubjectsView } from './components/MasterSubjectsView';
import { PrintHubView } from './components/PrintHubView';
import { SettingsView } from './components/SettingsView';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const MainAppLayout: React.FC = () => {
  const { activeTab, toast, isBarcodeScannerOpen, setIsBarcodeScannerOpen } = useAttendance();
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'attendance_list':
      case 'attendance_form':
        return <AttendanceListView />;
      case 'schedule':
        return <ScheduleView />;
      case 'daily_recap':
        return <DailyReportView />;
      case 'weekly_recap':
        return <WeeklyReportView />;
      case 'monthly_recap':
        return <MonthlyReportView />;
      case 'master_teachers':
        return <MasterTeachersView />;
      case 'master_classes':
        return <MasterClassesView />;
      case 'master_subjects':
        return <MasterSubjectsView />;
      case 'print_hub':
        return <PrintHubView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (desktop and mobile responsive) */}
        <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/90">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Global Attendance Modal */}
      <AttendanceModal />

      {/* Global Barcode & QR Scanner Modal */}
      <BarcodeAttendanceScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md bg-white border-slate-200"
        >
          {toast.type === 'success' && (
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-700" />
            </div>
          )}
          {toast.type === 'warning' && (
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-700" />
            </div>
          )}

          <p className="text-xs font-semibold text-slate-800 leading-snug">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainAppLayout />
    </AttendanceProvider>
  );
}
