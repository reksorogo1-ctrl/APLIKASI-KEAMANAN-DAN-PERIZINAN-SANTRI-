import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { 
  Santri, 
  DewanKeamanan, 
  Perizinan, 
  TataTertib, 
  Pelanggaran, 
  Sanksi, 
  UserAccount, 
  LogAktivitas, 
  NotifikasiApp,
  SystemConfig,
  PesanKoordinasi
} from './types';

import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { Sidebar, ActiveMenu } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KoordinasiList } from './components/KoordinasiList';
import { AdminOptionPanel } from './components/AdminOptionPanel';
import { SantriPerKelas } from './components/SantriPerKelas';
import { SantriList } from './components/SantriList';
import { DewanKeamananList } from './components/DewanKeamananList';
import { PerizinanList } from './components/PerizinanList';
import { GateScanner } from './components/GateScanner';
import { MonitoringRealtime } from './components/MonitoringRealtime';
import { TataTertibList } from './components/TataTertibList';
import { PelanggaranList } from './components/PelanggaranList';
import { SanksiList } from './components/SanksiList';
import { LaporanStatistik } from './components/LaporanStatistik';
import { DatabaseSettings } from './components/DatabaseSettings';
import { SuratIzinModal } from './components/SuratIzinModal';
import { NotificationModal } from './components/NotificationModal';
import { QuickQRScannerModal } from './components/QuickQRScannerModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { syncPWAIdentity } from './services/pwaSyncService';

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(storageService.getCurrentUser());

  // Navigation & UI state
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [selectedSuratIzin, setSelectedSuratIzin] = useState<Perizinan | null>(null);
  const [preSelectedPelanggaran, setPreSelectedPelanggaran] = useState<Pelanggaran | null>(null);

  // Storage synced state
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(storageService.getSystemConfig());
  const [usersList, setUsersList] = useState<UserAccount[]>(storageService.getUsers());
  const [genderScope, setGenderScope] = useState<'all' | 'putra' | 'putri'>(storageService.getGenderScope());
  const [santriList, setSantriList] = useState<Santri[]>(storageService.getSantriList());
  const [dewanList, setDewanList] = useState<DewanKeamanan[]>(storageService.getDewanKeamananList());
  const [perizinanList, setPerizinanList] = useState<Perizinan[]>(storageService.getPerizinanList());
  const [tataTertibList, setTataTertibList] = useState<TataTertib[]>(storageService.getTataTertibList());
  const [pelanggaranList, setPelanggaranList] = useState<Pelanggaran[]>(storageService.getPelanggaranList());
  const [sanksiList, setSanksiList] = useState<Sanksi[]>(storageService.getSanksiList());
  const [logsList, setLogsList] = useState<LogAktivitas[]>(storageService.getLogs());
  const [notifications, setNotifications] = useState<NotifikasiApp[]>(storageService.getNotifications());
  const [koordinasiList, setKoordinasiList] = useState<PesanKoordinasi[]>(storageService.getKoordinasiList());

  // Subscribe to storage service & automated background tardiness monitoring
  useEffect(() => {
    // Force dark tactical theme default
    document.documentElement.classList.add('dark');

    // Run tardiness check on startup and subscribe
    storageService.checkAndDetectLatePermits();
    const lateTimer = setInterval(() => {
      storageService.checkAndDetectLatePermits();
    }, 15000);

    const unsubscribe = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser());
      setSystemConfig(storageService.getSystemConfig());
      setUsersList(storageService.getUsers());
      setGenderScope(storageService.getGenderScope());
      setSantriList(storageService.getSantriList());
      setDewanList(storageService.getDewanKeamananList());
      setPerizinanList(storageService.getPerizinanList());
      setTataTertibList(storageService.getTataTertibList());
      setPelanggaranList(storageService.getPelanggaranList());
      setSanksiList(storageService.getSanksiList());
      setLogsList(storageService.getLogs());
      setNotifications(storageService.getNotifications());
      setKoordinasiList(storageService.getKoordinasiList());
    });

    return () => {
      unsubscribe();
      clearInterval(lateTimer);
    };
  }, []);

  // Sync PWA Identity (Title, Favicon, Theme-color, Manifest) whenever systemConfig changes
  useEffect(() => {
    syncPWAIdentity(systemConfig);
  }, [systemConfig]);

  // Handle Logout
  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  // Enforce RBAC route protection: non-admins cannot access admin_options or database
  const isAdmin = currentUser?.role === 'admin';
  useEffect(() => {
    if (currentUser && !isAdmin && (activeMenu === 'admin_options' || activeMenu === 'database')) {
      setActiveMenu('dashboard');
    }
  }, [currentUser, isAdmin, activeMenu]);

  // If not logged in, render the luxury tactical login screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveMenu('dashboard');
        }}
      />
    );
  }

  // Filter based on gender scope (Otoritas Banin vs Banat)
  const scopedSantriList = santriList.filter(s => {
    if (currentUser.genderAccess !== 'all') {
      return s.gender === currentUser.genderAccess;
    }
    if (genderScope === 'all') return true;
    return s.gender === genderScope;
  });

  const scopedPerizinanList = perizinanList.filter(p => {
    if (currentUser.genderAccess !== 'all') {
      return p.santriGender === currentUser.genderAccess;
    }
    if (genderScope === 'all') return true;
    return p.santriGender === genderScope;
  });

  const scopedPelanggaranList = pelanggaranList.filter(p => {
    if (currentUser.genderAccess !== 'all') {
      return p.santriGender === currentUser.genderAccess;
    }
    if (genderScope === 'all') return true;
    return p.santriGender === genderScope;
  });

  const scopedSanksiList = sanksiList.filter(s => {
    if (currentUser.genderAccess !== 'all') {
      return s.santriGender === currentUser.genderAccess;
    }
    if (genderScope === 'all') return true;
    return s.santriGender === genderScope;
  });

  // Badges
  const pendingApprovalsCount = scopedPerizinanList.filter(
    i => i.status === 'Diajukan' || i.status === 'Diverifikasi'
  ).length;

  const lateSantriCount = scopedPerizinanList.filter(
    i => i.status === 'Terlambat'
  ).length;

  const unreadNotifsCount = notifications.filter(n => !n.dibaca).length;

  const unreadKoordinasiCount = koordinasiList.filter(k => !k.dibacaOleh.includes(currentUser.id)).length;
  const mendesakKoordinasiCount = koordinasiList.filter(k => k.prioritas === 'Mendesak' && k.status !== 'Ditindaklanjuti').length;

  const handleOpenSanksiFromPelanggaran = (pelanggaran: Pelanggaran) => {
    setPreSelectedPelanggaran(pelanggaran);
    setActiveMenu('sanksi');
  };

  return (
    <div className="min-h-screen md:h-screen md:max-h-screen md:overflow-hidden bg-black text-white flex flex-col font-sans antialiased selection:bg-yellow-400 selection:text-black">
      
      {/* Tactical Top Bar Header */}
      <Header
        currentUser={currentUser}
        logoUrl={systemConfig.logoUrl}
        namaPondok={systemConfig.namaPondok}
        namaAplikasi={systemConfig.namaAplikasi}
        namaPendekAplikasi={systemConfig.namaPendekAplikasi}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadNotifsCount + (unreadKoordinasiCount > 0 ? 1 : 0)}
      />

      {/* Dynamic Background Scrim from System Config */}
      {systemConfig.bgUrl && (
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{ opacity: (systemConfig.bgOpacity || 25) / 100 }}
        >
          <img 
            src={systemConfig.bgUrl} 
            alt="Tactical Background Scrim" 
            className="w-full h-full object-cover filter contrast-125 brightness-75"
          />
        </div>
      )}

      {/* Main Layout Canvas: Menyesuaikan panjang sidebar dan konten ke bawah layar website secara penuh */}
      <div className="flex-1 flex w-full relative min-h-[calc(100vh-57px)] md:h-[calc(100vh-57px)] md:max-h-[calc(100vh-57px)] md:overflow-hidden items-stretch">
        
        {/* Navigation Sidebar: Selalu terbuka di laptop & PC, drawer di HP */}
        <Sidebar
          activeMenu={activeMenu}
          onSelectMenu={(menu) => setActiveMenu(menu)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userRole={currentUser.role}
          pendingApprovalsCount={pendingApprovalsCount}
          lateSantriCount={lateSantriCount}
          unreadKoordinasiCount={unreadKoordinasiCount}
          mendesakKoordinasiCount={mendesakKoordinasiCount}
          logoUrl={systemConfig.logoUrl}
          namaPondok={systemConfig.namaPondok}
          onLogout={handleLogout}
          currentUser={currentUser}
        />

        {/* Viewport Content Area: Responsif penuh layar laptop/PC dan mobile */}
        <main 
          className={`flex-1 h-full min-w-0 p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden bg-black transition-all ${
            isSidebarOpen ? 'max-md:overflow-hidden max-md:pointer-events-none' : ''
          }`}
        >
          <div className="w-full max-w-full">
            
            {/* 1. Dashboard Komando */}
            {activeMenu === 'dashboard' && (
              <Dashboard
                santriList={scopedSantriList}
                perizinanList={scopedPerizinanList}
                pelanggaranList={scopedPelanggaranList}
                sanksiList={scopedSanksiList}
                currentUser={currentUser}
                onNavigate={(menu) => setActiveMenu(menu)}
                onViewSuratIzin={(izin) => setSelectedSuratIzin(izin)}
              />
            )}

            {/* 2. Pusat Koordinasi Admin & Dewan Keamanan */}
            {activeMenu === 'koordinasi' && (
              <KoordinasiList
                currentUser={currentUser}
                koordinasiList={koordinasiList}
              />
            )}

            {/* 3. Admin Option Panel & Central Database (Admin Only) */}
            {activeMenu === 'admin_options' && isAdmin && (
              <AdminOptionPanel
                systemConfig={systemConfig}
                usersList={usersList}
                santriList={santriList}
                dewanList={dewanList}
                onConfigUpdated={() => {
                  setSystemConfig(storageService.getSystemConfig());
                  setUsersList(storageService.getUsers());
                  setSantriList(storageService.getSantriList());
                  setDewanList(storageService.getDewanKeamananList());
                }}
              />
            )}

            {/* 3. Data Santri Per Kelas (Explicitly for Security Officers & Admin) */}
            {activeMenu === 'santri_per_kelas' && (
              <SantriPerKelas
                santriList={scopedSantriList}
                perizinanList={scopedPerizinanList}
                pelanggaranList={scopedPelanggaranList}
                currentUser={currentUser}
                onNavigateToPermitWithSantri={(santri) => {
                  setActiveMenu('perizinan');
                }}
                onNavigateToPelanggaranWithSantri={(santri) => {
                  setActiveMenu('pelanggaran');
                }}
              />
            )}

            {/* 4. Administrasi Santri Induk */}
            {activeMenu === 'santri' && (
              <SantriList
                santriList={scopedSantriList}
                currentGenderScope={genderScope}
              />
            )}

            {/* 5. Dewan Keamanan & Piket */}
            {activeMenu === 'dewan_keamanan' && (
              <DewanKeamananList
                dewanList={dewanList}
              />
            )}

            {/* 6. Administrasi Perizinan (Live Sync ke Admin) */}
            {activeMenu === 'perizinan' && (
              <PerizinanList
                perizinanList={scopedPerizinanList}
                santriList={scopedSantriList}
                currentUser={currentUser}
                onViewSuratIzin={(izin) => setSelectedSuratIzin(izin)}
              />
            )}

            {/* 7. Pos Gerbang (Check-In/Out) */}
            {activeMenu === 'pos_gerbang' && (
              <GateScanner
                perizinanList={scopedPerizinanList}
                santriList={scopedSantriList}
                currentUser={currentUser}
                onViewSuratIzin={(izin) => setSelectedSuratIzin(izin)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
              />
            )}

            {/* 8. Monitoring Real-Time */}
            {activeMenu === 'monitoring' && (
              <MonitoringRealtime
                perizinanList={scopedPerizinanList}
                pelanggaranList={scopedPelanggaranList}
                sanksiList={scopedSanksiList}
                currentUser={currentUser}
                onViewSuratIzin={(izin) => setSelectedSuratIzin(izin)}
              />
            )}

            {/* 9. Buku Tata Tertib */}
            {activeMenu === 'tata_tertib' && (
              <TataTertibList
                tataTertibList={tataTertibList}
              />
            )}

            {/* 10. Catatan Pelanggaran */}
            {activeMenu === 'pelanggaran' && (
              <PelanggaranList
                pelanggaranList={scopedPelanggaranList}
                santriList={scopedSantriList}
                tataTertibList={tataTertibList}
                currentUser={currentUser}
                onOpenSanksiModalForPelanggaran={handleOpenSanksiFromPelanggaran}
              />
            )}

            {/* 11. Sanksi Edukatif */}
            {activeMenu === 'sanksi' && (
              <SanksiList
                sanksiList={scopedSanksiList}
                pelanggaranList={scopedPelanggaranList}
                santriList={scopedSantriList}
                currentUser={currentUser}
                preSelectedPelanggaran={preSelectedPelanggaran}
                onClearPreSelectedPelanggaran={() => setPreSelectedPelanggaran(null)}
              />
            )}

            {/* 12. Laporan & Statistik */}
            {activeMenu === 'laporan' && (
              <LaporanStatistik
                santriList={scopedSantriList}
                perizinanList={scopedPerizinanList}
                pelanggaranList={scopedPelanggaranList}
                sanksiList={scopedSanksiList}
                logsList={logsList}
              />
            )}

            {/* 13. Master Database Settings */}
            {activeMenu === 'database' && (
              <DatabaseSettings
                santriList={santriList}
                perizinanList={perizinanList}
                pelanggaranList={pelanggaranList}
                sanksiList={sanksiList}
                dewanList={dewanList}
                logsList={logsList}
              />
            )}

          </div>
        </main>

      </div>

      {/* Official Surat Izin Digital Modal */}
      <SuratIzinModal
        izin={selectedSuratIzin}
        onClose={() => setSelectedSuratIzin(null)}
      />

      {/* Quick QR Code Scanner Modal (Pos Pengurus & Admin Check-In) */}
      <QuickQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        currentUser={currentUser}
      />

      {/* Notifications Drawer / Modal */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onNavigate={(menuId) => setActiveMenu(menuId as ActiveMenu)}
      />

      {/* Real-time PWA Connectivity Indicator */}
      <OfflineIndicator />

    </div>
  );
}
