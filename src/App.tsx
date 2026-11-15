import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { StaggeredTabPanel } from './components/MotionPrimitives';
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
  PesanKoordinasi,
  StrukturOrganisasiNode,
  AgendaPengurus,
  EvaluasiKepengurusan,
  PengajuanDivisi,
  ArsipSurat,
  TransaksiKeuangan,
  BarangInventaris,
  PeminjamanBarang,
} from './types';

import { Header } from './components/Header';
import { Sidebar, ActiveMenu, KeamananSubTab, canAccessMainMenu } from './components/Sidebar';
import { MainDashboard } from './components/MainDashboard';
import { StrukturOrganisasiPanel } from './components/StrukturOrganisasiPanel';
import { KetuaPondokDashboard } from './components/KetuaPondokDashboard';
import { SekretarisPanel } from './components/SekretarisPanel';
import { BendaharaPanel } from './components/BendaharaPanel';
import { PerlengkapanPanel, PerlengkapanSubTab } from './components/PerlengkapanPanel';
import { KeamananModule } from './components/KeamananModule';
import { AdminOptionPanel } from './components/AdminOptionPanel';
import { BiodataProfilPanel } from './components/BiodataProfilPanel';
import { SuratIzinModal } from './components/SuratIzinModal';
import { NotificationModal } from './components/NotificationModal';
import { QuickQRScannerModal } from './components/QuickQRScannerModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginScreen } from './components/LoginScreen';
import { syncPWAIdentity } from './services/pwaSyncService';

const KEAMANAN_SUBTABS: KeamananSubTab[] = [
  'ringkasan',
  'koordinasi',
  'santri_per_kelas',
  'santri',
  'perizinan',
  'pos_gerbang',
  'monitoring',
  'tata_tertib',
  'pelanggaran',
  'sanksi',
  'dewan_keamanan',
  'laporan',
  'laporan_mingguan',
  'option_keamanan',
  'database',
];

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(storageService.getCurrentUser());

  // Navigation & UI state
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [keamananSubTab, setKeamananSubTab] = useState<KeamananSubTab>('ringkasan');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [selectedSuratIzin, setSelectedSuratIzin] = useState<Perizinan | null>(null);
  const [preSelectedPelanggaran, setPreSelectedPelanggaran] = useState<Pelanggaran | null>(null);

  // Storage synced state (Security + Core)
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

  // Storage synced state (Management Divisions)
  const [strukturOrganisasi, setStrukturOrganisasi] = useState<StrukturOrganisasiNode[]>(
    storageService.getStrukturOrganisasi()
  );
  const [agendaPengurus, setAgendaPengurus] = useState<AgendaPengurus[]>(storageService.getAgendaPengurus());
  const [evaluasiKepengurusan, setEvaluasiKepengurusan] = useState<EvaluasiKepengurusan[]>(
    storageService.getEvaluasiKepengurusan()
  );
  const [pengajuanDivisi, setPengajuanDivisi] = useState<PengajuanDivisi[]>(storageService.getPengajuanDivisi());
  const [arsipSurat, setArsipSurat] = useState<ArsipSurat[]>(storageService.getArsipSurat());
  const [transaksiKeuangan, setTransaksiKeuangan] = useState<TransaksiKeuangan[]>(
    storageService.getTransaksiKeuangan()
  );
  const [barangInventaris, setBarangInventaris] = useState<BarangInventaris[]>(
    storageService.getBarangInventaris()
  );
  const [peminjamanBarang, setPeminjamanBarang] = useState<PeminjamanBarang[]>(
    storageService.getPeminjamanBarang()
  );

  // Subscribe to central Firestore + localStorage sync service
  useEffect(() => {
    document.documentElement.classList.add('dark');

    storageService.checkAndDetectLatePermits();
    storageService.checkAndDetectTodayAgendas();
    const lateTimer = setInterval(() => {
      storageService.checkAndDetectLatePermits();
      storageService.checkAndDetectTodayAgendas();
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
      setStrukturOrganisasi(storageService.getStrukturOrganisasi());
      setAgendaPengurus(storageService.getAgendaPengurus());
      setEvaluasiKepengurusan(storageService.getEvaluasiKepengurusan());
      setPengajuanDivisi(storageService.getPengajuanDivisi());
      setArsipSurat(storageService.getArsipSurat());
      setTransaksiKeuangan(storageService.getTransaksiKeuangan());
      setBarangInventaris(storageService.getBarangInventaris());
      setPeminjamanBarang(storageService.getPeminjamanBarang());
    });

    return () => {
      unsubscribe();
      clearInterval(lateTimer);
    };
  }, []);

  // Sync PWA Identity whenever systemConfig updates
  useEffect(() => {
    syncPWAIdentity(systemConfig);
  }, [systemConfig]);

  // Handle Reset / Kembali ke Dashboard Utama Administrator
  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(storageService.getCurrentUser());
    setActiveMenu('dashboard');
    setActiveSubTab('');
  };

  // Enforce RBAC route protection across main menu
  const isAdmin = currentUser?.role === 'admin';
  useEffect(() => {
    if (currentUser && !canAccessMainMenu(currentUser.role, activeMenu)) {
      setActiveMenu('dashboard');
    }
  }, [currentUser, activeMenu]);

  // Handle Sidebar menu & subTab selection
  const handleSelectSidebarMenu = (menu: ActiveMenu, subTab?: string) => {
    setActiveMenu(menu);
    if (menu === 'keamanan') {
      const nextSub = (subTab as KeamananSubTab) || 'ringkasan';
      setKeamananSubTab(nextSub);
      setActiveSubTab(nextSub);
    } else if (subTab) {
      setActiveSubTab(subTab);
    } else {
      setActiveSubTab('');
    }
  };

  // Filter based on gender scope (Otoritas Banin vs Banat)
  const userGenderAccess = currentUser?.genderAccess || 'all';
  const scopedSantriList = santriList.filter((s) => {
    if (userGenderAccess !== 'all') {
      return s.gender === userGenderAccess;
    }
    if (genderScope === 'all') return true;
    return s.gender === genderScope;
  });

  const scopedPerizinanList = perizinanList.filter((p) => {
    if (userGenderAccess !== 'all') {
      return p.santriGender === userGenderAccess;
    }
    if (genderScope === 'all') return true;
    return p.santriGender === genderScope;
  });

  const scopedPelanggaranList = pelanggaranList.filter((p) => {
    if (userGenderAccess !== 'all') {
      return p.santriGender === userGenderAccess;
    }
    if (genderScope === 'all') return true;
    return p.santriGender === genderScope;
  });

  const scopedSanksiList = sanksiList.filter((s) => {
    if (userGenderAccess !== 'all') {
      return s.santriGender === userGenderAccess;
    }
    if (genderScope === 'all') return true;
    return s.santriGender === genderScope;
  });

  // Badges
  const pendingPengajuanCount = pengajuanDivisi.filter((p) => p.status === 'Menunggu Persetujuan').length;
  const pendingApprovalsCount = scopedPerizinanList.filter(
    (i) => i.status === 'Diajukan' || i.status === 'Diverifikasi'
  ).length;
  const lateSantriCount = scopedPerizinanList.filter((i) => i.status === 'Terlambat').length;
  const unreadNotifsCount = notifications.filter((n) => !n.dibaca).length;
  const unreadKoordinasiCount = currentUser
    ? koordinasiList.filter((k) => !(k.dibacaOleh || []).includes(currentUser.id)).length
    : 0;

  const handleOpenSanksiFromPelanggaran = (pelanggaran: Pelanggaran) => {
    setPreSelectedPelanggaran(pelanggaran);
    setActiveMenu('keamanan');
    setKeamananSubTab('sanksi');
    setActiveSubTab('sanksi');
  };

  const handleNavigateFromNotification = (menuId: string) => {
    if (!currentUser) return;
    if (menuId === 'kalender_akademik') {
      setActiveMenu('dashboard');
      setActiveSubTab('');
      setTimeout(() => {
        document.getElementById('kalender-akademik')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }
    if (menuId === 'koordinasi') {
      if (currentUser.role === 'ketua_pondok') {
        handleSelectSidebarMenu('ketua_pondok', 'sk_koordinasi');
      } else if (currentUser.role === 'sekretaris') {
        handleSelectSidebarMenu('sekretaris', 'kotak_masuk');
      } else if (currentUser.role === 'bendahara') {
        handleSelectSidebarMenu('bendahara', 'kotak_masuk');
      } else if (currentUser.role === 'perlengkapan') {
        handleSelectSidebarMenu('perlengkapan', 'kotak_masuk');
      } else {
        handleSelectSidebarMenu('keamanan', 'koordinasi');
      }
      return;
    }
    if (menuId === 'ketua_pondok_koordinasi' && canAccessMainMenu(currentUser.role, 'ketua_pondok')) {
      handleSelectSidebarMenu('ketua_pondok', 'sk_koordinasi');
      return;
    }
    if (menuId === 'ketua_pondok_persetujuan' && canAccessMainMenu(currentUser.role, 'ketua_pondok')) {
      handleSelectSidebarMenu('ketua_pondok', 'persetujuan');
      return;
    }
    if (menuId === 'sekretaris_inbox' && canAccessMainMenu(currentUser.role, 'sekretaris')) {
      handleSelectSidebarMenu('sekretaris', 'kotak_masuk');
      return;
    }
    if (menuId === 'bendahara_inbox' && canAccessMainMenu(currentUser.role, 'bendahara')) {
      handleSelectSidebarMenu('bendahara', 'kotak_masuk');
      return;
    }
    if (menuId === 'perlengkapan_inbox' && canAccessMainMenu(currentUser.role, 'perlengkapan')) {
      handleSelectSidebarMenu('perlengkapan', 'kotak_masuk');
      return;
    }
    if (menuId === 'dashboard_keamanan') {
      setActiveMenu('keamanan');
      setKeamananSubTab('ringkasan');
      setActiveSubTab('ringkasan');
      return;
    }
    if (KEAMANAN_SUBTABS.includes(menuId as KeamananSubTab)) {
      if (canAccessMainMenu(currentUser.role, 'keamanan')) {
        setActiveMenu('keamanan');
        setKeamananSubTab(menuId as KeamananSubTab);
        setActiveSubTab(menuId);
      }
      return;
    }
    const mainCandidate = menuId as ActiveMenu;
    if (canAccessMainMenu(currentUser.role, mainCandidate)) {
      setActiveMenu(mainCandidate);
      setActiveSubTab('');
    }
  };

  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            if (
              user.role === 'ketua_keamanan' ||
              user.role === 'anggota_keamanan' ||
              user.role === 'petugas_gerbang'
            ) {
              setActiveMenu('keamanan');
              setKeamananSubTab('ringkasan');
              setActiveSubTab('ringkasan');
            } else {
              setActiveMenu('dashboard');
              setActiveSubTab('');
            }
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen md:h-screen md:max-h-screen md:overflow-hidden bg-[#02100a] text-[#f4f9f5] flex flex-col font-sans antialiased selection:bg-[#d4af37] selection:text-[#02100a]">
      {/* Luxury Top Header Bar */}
      <Header
        currentUser={currentUser}
        logoUrl={
          activeMenu === 'keamanan' ||
          currentUser.role === 'ketua_keamanan' ||
          currentUser.role === 'anggota_keamanan' ||
          currentUser.role === 'petugas_gerbang'
            ? (systemConfig.logoDashboardKeamananUrl ||
               'https://cdn.phototourl.com/member/2026-11-11-7ffd46ad-6406-4c9c-8043-01c37a880156.png')
            : systemConfig.logoUrl
        }
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
          style={{ opacity: (systemConfig.bgOpacity || 15) / 100 }}
        >
          <img
            src={systemConfig.bgUrl}
            alt="Latar Belakang Pondok"
            className="w-full h-full object-cover filter contrast-125 brightness-75"
          />
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full relative min-h-[calc(100vh-57px)] md:h-[calc(100vh-57px)] md:max-h-[calc(100vh-57px)] md:overflow-hidden items-stretch">
        {/* Sidebar Navigation */}
        <Sidebar
          activeMenu={activeMenu}
          activeSubTab={activeSubTab}
          onSelectMenu={handleSelectSidebarMenu}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userRole={currentUser.role}
          pendingPengajuanCount={pendingPengajuanCount}
          pendingSecurityCount={pendingApprovalsCount + unreadKoordinasiCount}
          lateSantriCount={lateSantriCount}
          unreadKoordinasiCount={unreadKoordinasiCount}
          onLogout={handleLogout}
          currentUser={currentUser}
        />

        {/* Viewport Content Area */}
        <main
          className={`flex-1 h-full min-w-0 p-2.5 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden bg-[#02100a] bg-security-grid transition-all ${
            isSidebarOpen ? 'max-md:overflow-hidden max-md:pointer-events-none' : ''
          }`}
        >
          <div className="w-full max-w-full">
            <AnimatePresence mode="wait">
              <StaggeredTabPanel key={activeMenu} tabKey={activeMenu}>
                {/* 1. Dashboard Utama Pesantren */}
                {activeMenu === 'dashboard' && (
              <MainDashboard
                currentUser={currentUser}
                systemConfig={systemConfig}
                santriList={santriList}
                perizinanList={perizinanList}
                pelanggaranList={pelanggaranList}
                transaksiKeuangan={transaksiKeuangan}
                arsipSurat={arsipSurat}
                barangInventaris={barangInventaris}
                peminjamanBarang={peminjamanBarang}
                agendaPengurus={agendaPengurus}
                pengajuanDivisi={pengajuanDivisi}
                koordinasiList={koordinasiList}
                onNavigate={handleSelectSidebarMenu}
              />
            )}

            {/* 2. Struktur Organisasi */}
            {activeMenu === 'struktur_organisasi' && (
              <StrukturOrganisasiPanel
                strukturList={strukturOrganisasi}
                currentUser={currentUser}
              />
            )}

            {/* 3. Ketua Pondok */}
            {activeMenu === 'ketua_pondok' && canAccessMainMenu(currentUser.role, 'ketua_pondok') && (
              <KetuaPondokDashboard
                currentUser={currentUser}
                systemConfig={systemConfig}
                santriList={santriList}
                perizinanList={perizinanList}
                pelanggaranList={pelanggaranList}
                arsipSurat={arsipSurat}
                transaksiKeuangan={transaksiKeuangan}
                barangInventaris={barangInventaris}
                agendaPengurus={agendaPengurus}
                evaluasiKepengurusan={evaluasiKepengurusan}
                pengajuanDivisi={pengajuanDivisi}
                strukturList={strukturOrganisasi}
                dewanList={dewanList}
                koordinasiList={koordinasiList}
                initialSubTab={activeSubTab as any}
              />
            )}

            {/* 4. Sekretaris (15 Jenis Surat, Data Santri, Data Ustadz Mukim/Laju, Notulen & Format Surat) */}
            {activeMenu === 'sekretaris' && canAccessMainMenu(currentUser.role, 'sekretaris') && (
              <SekretarisPanel
                currentUser={currentUser}
                systemConfig={systemConfig}
                arsipSurat={arsipSurat}
                santriList={santriList}
                koordinasiList={koordinasiList}
                agendaPengurus={agendaPengurus}
                initialSubTab={activeSubTab as any}
              />
            )}

            {/* 5. Bendahara (Kotak Masuk, Syahriyah, Uang Saku, Pengajuan Dana, Pemasukan & Pengeluaran) */}
            {activeMenu === 'bendahara' && canAccessMainMenu(currentUser.role, 'bendahara') && (
              <BendaharaPanel
                currentUser={currentUser}
                systemConfig={systemConfig}
                transaksiKeuangan={transaksiKeuangan}
                santriList={santriList}
                pengajuanDivisi={pengajuanDivisi}
                koordinasiList={koordinasiList}
                logsList={logsList}
                initialSubTab={activeSubTab as any}
              />
            )}

            {/* 6. Perlengkapan (Kotak Masuk, Inventaris, Keluar Masuk, Peminjaman, Pembelian, Kamar & Fasilitas) */}
            {activeMenu === 'perlengkapan' && canAccessMainMenu(currentUser.role, 'perlengkapan') && (
              <PerlengkapanPanel
                currentUser={currentUser}
                systemConfig={systemConfig}
                santriList={santriList}
                barangInventaris={barangInventaris}
                peminjamanBarang={peminjamanBarang}
                pengajuanDivisi={pengajuanDivisi}
                koordinasiList={koordinasiList}
                initialSubTab={(activeSubTab as PerlengkapanSubTab) || undefined}
              />
            )}

            {/* 7. Keamanan (Dashboard Utama, Kotak Masuk, Perizinan, Radar, Pelanggaran, Sanksi, Data Santri, Tata Tertib & Piket, Laporan, Option Panel Keamanan) */}
            {activeMenu === 'keamanan' && canAccessMainMenu(currentUser.role, 'keamanan') && (
              <KeamananModule
                subTab={keamananSubTab}
                onChangeSubTab={(tab) => {
                  setKeamananSubTab(tab);
                  setActiveSubTab(tab);
                }}
                currentUser={currentUser}
                systemConfig={systemConfig}
                agendaPengurus={agendaPengurus}
                genderScope={genderScope}
                santriList={santriList}
                scopedSantriList={scopedSantriList}
                dewanList={dewanList}
                perizinanList={perizinanList}
                scopedPerizinanList={scopedPerizinanList}
                tataTertibList={tataTertibList}
                pelanggaranList={pelanggaranList}
                scopedPelanggaranList={scopedPelanggaranList}
                sanksiList={sanksiList}
                scopedSanksiList={scopedSanksiList}
                logsList={logsList}
                koordinasiList={koordinasiList}
                pendingApprovalsCount={pendingApprovalsCount}
                lateSantriCount={lateSantriCount}
                unreadKoordinasiCount={unreadKoordinasiCount}
                preSelectedPelanggaran={preSelectedPelanggaran}
                onClearPreSelectedPelanggaran={() => setPreSelectedPelanggaran(null)}
                onOpenSanksiFromPelanggaran={handleOpenSanksiFromPelanggaran}
                onViewSuratIzin={(izin) => setSelectedSuratIzin(izin)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
              />
            )}

            {/* 8. Tab Biodata dan Profil (Editable Foto Profil, Nama, Jabatan, No WA, Alamat & PIN 6 Digit) */}
            {activeMenu === 'biodata_profil' && (
              <BiodataProfilPanel
                currentUser={currentUser}
                onProfileUpdated={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  setUsersList(storageService.getUsers());
                }}
              />
            )}

            {/* 9. Options Panel (Admin Only — Pengelolaan Sistem Login Seluruh Divisi, PIN 6 Digit, Password, Role) */}
            {activeMenu === 'admin_options' && isAdmin && (
              <AdminOptionPanel
                systemConfig={systemConfig}
                usersList={usersList}
                santriList={santriList}
                dewanList={dewanList}
                agendaPengurus={agendaPengurus}
                onConfigUpdated={() => {
                  setSystemConfig(storageService.getSystemConfig());
                  setUsersList(storageService.getUsers());
                  setSantriList(storageService.getSantriList());
                  setDewanList(storageService.getDewanKeamananList());
                  setAgendaPengurus(storageService.getAgendaPengurus());
                }}
              />
            )}
              </StaggeredTabPanel>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Official Surat Izin Digital Modal */}
      <SuratIzinModal izin={selectedSuratIzin} onClose={() => setSelectedSuratIzin(null)} />

      {/* Quick QR Code Scanner Modal */}
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
        onNavigate={handleNavigateFromNotification}
      />

      {/* Real-time PWA Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
