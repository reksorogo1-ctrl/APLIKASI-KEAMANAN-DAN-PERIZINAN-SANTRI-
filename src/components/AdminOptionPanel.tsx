import React, { useState } from 'react';
import { 
  Database, 
  Sliders, 
  ShieldCheck, 
  KeyRound, 
  UserPlus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Download, 
  Upload, 
  AlertOctagon, 
  CheckCircle2, 
  Lock, 
  Radio, 
  Server, 
  Users, 
  Image, 
  Palette, 
  Plus, 
  Search, 
  ShieldAlert, 
  X,
  FileText,
  GraduationCap,
  Smartphone,
  Monitor,
  Sparkles,
  RefreshCw,
  User
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { syncPWAIdentity } from '../services/pwaSyncService';
import { INITIAL_SURAT_SEKRETARIS_CONFIG } from '../data/seedData';
import { SystemConfig, UserAccount, UserRole, Santri, DewanKeamanan, Gender, KodeJenisSurat, SuratSekretarisConfig } from '../types';

interface AdminOptionPanelProps {
  systemConfig: SystemConfig;
  usersList: UserAccount[];
  santriList: Santri[];
  dewanList: DewanKeamanan[];
  onConfigUpdated: () => void;
}

export const AdminOptionPanel: React.FC<AdminOptionPanelProps> = ({
  systemConfig,
  usersList,
  santriList,
  dewanList,
  onConfigUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'control' | 'visual' | 'surat_sekretaris_config' | 'santri_crud' | 'dewan_crud' | 'rbac' | 'database'>('control');
  const [settingCategory, setSettingCategory] = useState<'all' | 'sistem' | 'persuratan' | 'datamaster' | 'keamanan_db'>('all');
  const [settingSearch, setSettingSearch] = useState('');
  const [selectedKodeSuratEdit, setSelectedKodeSuratEdit] = useState<KodeJenisSurat>('SK');
  const [configForm, setConfigForm] = useState<SystemConfig>({
    ...systemConfig,
    suratSekretarisConfig: systemConfig.suratSekretarisConfig || INITIAL_SURAT_SEKRETARIS_CONFIG,
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Search in CRUD tabs
  const [searchSantri, setSearchSantri] = useState('');
  const [searchDewan, setSearchDewan] = useState('');

  // Modals for Santri CRUD in Option Panel
  const [isSantriModalOpen, setIsSantriModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [santriForm, setSantriForm] = useState<Partial<Santri>>({
    nis: '',
    nama: '',
    gender: 'putra',
    kelas: '1 Ulya (Aliyah)',
    kamar: 'K-01 (Imam Nafi\')',
    asrama: 'Asrama Putra Sunan Giri',
    alamat: 'Karawang',
    namaWali: '',
    noWaWali: '0812',
    jarakRumahKm: 15,
    status: 'Aktif',
    poinPelanggaran: 0,
    foto: '',
  });

  // Modals for Dewan Keamanan CRUD in Option Panel
  const [isDewanModalOpen, setIsDewanModalOpen] = useState(false);
  const [editingDewan, setEditingDewan] = useState<DewanKeamanan | null>(null);
  const [dewanForm, setDewanForm] = useState<Partial<DewanKeamanan>>({
    nrp: '',
    nama: '',
    jabatan: 'Anggota Keamanan',
    divisi: 'Pos Gerbang Utama',
    noWa: '0812',
    alamat: 'Komplek Asatidz Al-Maliki',
    statusKeaktifan: 'Aktif',
    foto: '',
    jadwalPiket: [{ hari: 'Senin', shift: 'Pagi (06.00 - 14.00)', pos: 'Pos Gerbang Utama' }],
  });

  // Modals for RBAC User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<UserAccount>>({
    username: '',
    password: '',
    pin: '',
    nama: '',
    role: 'anggota_keamanan',
    nrp: '',
    jabatan: 'Petugas Keamanan',
    divisi: 'Pos Gerbang Utama',
    genderAccess: 'all',
    noWa: '0812',
    alamat: '',
    avatar: '',
    statusAktif: true,
  });

  // Save Config & Visual Options (strictly for Website — preserves Keamanan Option Panel settings)
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const latest = storageService.getSystemConfig();
    const mergedWebsiteConfig: SystemConfig = {
      ...configForm,
      logoDashboardKeamananUrl: latest.logoDashboardKeamananUrl,
      logoSuratPerizinanUrl: latest.logoSuratPerizinanUrl,
      suratIzinLayout: latest.suratIzinLayout,
      suratSanksiLayout: latest.suratSanksiLayout,
      kopSuratBaris1: latest.kopSuratBaris1,
      kopSuratBaris2: latest.kopSuratBaris2,
      alamatKopSurat: latest.alamatKopSurat,
      judulSuratSanksi: latest.judulSuratSanksi,
      pembukaSuratSanksi: latest.pembukaSuratSanksi,
      penutupSuratSanksi: latest.penutupSuratSanksi,
      catatanKakiSuratSanksi: latest.catatanKakiSuratSanksi,
      ketuaKeamananPutra: latest.ketuaKeamananPutra,
      ketuaKeamananPutri: latest.ketuaKeamananPutri,
      hotlineWa: latest.hotlineWa,
      bendaharaConfig: latest.bendaharaConfig,
      syahriyahList: latest.syahriyahList,
      uangSakuList: latest.uangSakuList,
      anggaranList: latest.anggaranList,
    };
    storageService.updateSystemConfig(mergedWebsiteConfig);
    syncPWAIdentity(mergedWebsiteConfig);
    setSaveSuccessMsg('Konfigurasi website, logo website, dan identitas PWA berhasil disimpan & disinkronkan!');
    setTimeout(() => setSaveSuccessMsg(''), 4500);
    onConfigUpdated();
  };

  // PWA App Icon Uploader with safe-zone canvas normalization
  const handleUploadAppIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const svgContent = evt.target?.result as string;
        setConfigForm(prev => ({ ...prev, appIconUrl: svgContent }));
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = configForm.backgroundColor || '#02100a';
          ctx.fillRect(0, 0, 512, 512);

          const targetSize = 410;
          let drawWidth = targetSize;
          let drawHeight = targetSize;

          if (img.width > img.height) {
            drawHeight = (img.height / img.width) * targetSize;
          } else {
            drawWidth = (img.width / img.height) * targetSize;
          }

          const dx = (512 - drawWidth) / 2;
          const dy = (512 - drawHeight) / 2;
          ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

          const normalizedPng = canvas.toDataURL('image/png', 0.95);
          setConfigForm(prev => ({ ...prev, appIconUrl: normalizedPng }));
        } else {
          setConfigForm(prev => ({ ...prev, appIconUrl: b64 }));
        }
      };
      img.src = b64;
    };
    reader.readAsDataURL(file);
  };

  // Image Upload Handlers for Logo & Background
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      setConfigForm(prev => ({ ...prev, logoUrl: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      setConfigForm(prev => ({ ...prev, bgUrl: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSantriFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      setSantriForm(prev => ({ ...prev, foto: b64 }));
    };
    reader.readAsDataURL(file);
  };

  // Santri Handlers
  const handleSaveSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriForm.nis || !santriForm.nama) return;

    const saved: Santri = {
      id: editingSantri ? editingSantri.id : `san_${Date.now()}`,
      nis: santriForm.nis.trim(),
      nama: santriForm.nama.trim(),
      foto: (santriForm.foto && santriForm.foto.trim()) ? santriForm.foto.trim() : '',
      gender: (santriForm.gender as Gender) || 'putra',
      kelas: santriForm.kelas || '1 Wustho',
      kamar: santriForm.kamar || 'K-01',
      asrama: santriForm.asrama || 'Asrama Utama',
      alamat: santriForm.alamat || 'Karawang',
      namaWali: santriForm.namaWali || 'Wali Santri',
      noWaWali: santriForm.noWaWali || '08123456789',
      jarakRumahKm: Number(santriForm.jarakRumahKm) || 10,
      status: (santriForm.status as any) || 'Aktif',
      poinPelanggaran: Number(santriForm.poinPelanggaran) || 0,
      tglMasuk: santriForm.tglMasuk || new Date().toISOString().split('T')[0],
    };

    storageService.saveSantri(saved);
    setIsSantriModalOpen(false);
    onConfigUpdated();
  };

  // Dewan Keamanan Handlers
  const handleSaveDewan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dewanForm.nama) return;

    const saved: DewanKeamanan = {
      id: editingDewan ? editingDewan.id : `dk_${Date.now()}`,
      nrp: dewanForm.nrp || `KAMTIB-${Math.floor(100 + Math.random() * 900)}`,
      nama: dewanForm.nama,
      foto: dewanForm.foto || '',
      jabatan: dewanForm.jabatan || 'Anggota Keamanan',
      divisi: (dewanForm.divisi as any) || 'Pos Gerbang Utama',
      noWa: dewanForm.noWa || '08123456789',
      alamat: dewanForm.alamat || 'Karawang',
      statusKeaktifan: (dewanForm.statusKeaktifan as any) || 'Aktif',
      jadwalPiket: dewanForm.jadwalPiket || [{ hari: 'Senin', shift: 'Pagi (06.00 - 14.00)', pos: 'Pos Gerbang Utama' }],
    };

    storageService.saveDewanKeamanan(saved);
    setIsDewanModalOpen(false);
    onConfigUpdated();
  };

  // RBAC User Handlers
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.username || !userFormData.nama) return;

    const cleanPin = (userFormData.pin || '').replace(/\D/g, '').slice(0, 6);
    const saved: UserAccount = {
      id: editingUser ? editingUser.id : `usr_${Date.now()}`,
      username: userFormData.username.trim().toLowerCase(),
      password: userFormData.password || 'kamtib123',
      pin: cleanPin.length === 6 ? cleanPin : (editingUser?.pin || '999999'),
      nama: userFormData.nama,
      role: userFormData.role as UserRole,
      nrp: userFormData.nrp || `SECOP-${Math.floor(10 + Math.random() * 90)}`,
      jabatan: userFormData.jabatan || 'Personil Keamanan',
      divisi: userFormData.divisi || 'Komando Pusat',
      genderAccess: userFormData.genderAccess as any,
      noWa: userFormData.noWa || '08123456789',
      alamat: userFormData.alamat || 'Komplek Ponpes Salaf Al-Maliki',
      avatar: userFormData.avatar || '',
      statusAktif: userFormData.statusAktif ?? true,
    };

    storageService.saveUser(saved);
    setIsUserModalOpen(false);
    setSaveSuccessMsg(`Akun RBAC ${saved.nama} (PIN: ${saved.pin}) berhasil diperbarui!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    onConfigUpdated();
  };

  // Filtered lists for option panel CRUD tables
  const filteredSantri = santriList.filter(s => {
    if (!searchSantri.trim()) return true;
    const q = searchSantri.toLowerCase();
    return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q);
  });

  const filteredDewan = dewanList.filter(d => {
    if (!searchDewan.trim()) return true;
    const q = searchDewan.toLowerCase();
    return d.nama.toLowerCase().includes(q) || d.nrp.toLowerCase().includes(q) || d.jabatan.toLowerCase().includes(q);
  });

  const optionModules: {
    key: 'control' | 'visual' | 'surat_sekretaris_config' | 'santri_crud' | 'dewan_crud' | 'rbac' | 'database';
    category: 'sistem' | 'persuratan' | 'datamaster' | 'keamanan_db';
    categoryLabel: string;
    title: string;
    subtitle: string;
    badge: string;
    keywords: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'control',
      category: 'sistem',
      categoryLabel: 'Sistem & Visual Website',
      title: 'Operasional, Gerbang & Berita Website',
      subtitle: 'Kelola Berita & Informasi Terkini di Dashboard Utama, aturan gerbang, dan toleransi waktu.',
      badge: 'OPERASIONAL & BERITA',
      keywords: 'berita informasi pengumuman maklumat dashboard gerbang operasional toleransi terlambat waktu wib',
      icon: Sliders,
    },
    {
      key: 'visual',
      category: 'sistem',
      categoryLabel: 'Sistem & Visual Website',
      title: 'Logo Website, Identitas Pondok & PWA',
      subtitle: 'Edit nama pondok, logo website (Header, Dashboard Utama & Login), ikon PWA, & wallpaper.',
      badge: 'LOGO WEBSITE & PWA',
      keywords: 'logo website ikon pwa background nama pondok pimpinan pengasuh warna tema visual login',
      icon: Palette,
    },
    {
      key: 'surat_sekretaris_config',
      category: 'persuratan',
      categoryLabel: 'Format Surat Sekretaris',
      title: 'Editor 15 Surat Resmi Sekretaris',
      subtitle: 'Kustomisasi kop dua logo, kode klasifikasi, & pejabat penandatangan 15 jenis surat Sekretaris.',
      badge: '15 JENIS SURAT',
      keywords: 'sekretaris 15 surat sk undangan tugas izin pengantar keterangan edaran mou panggilan peringatan',
      icon: FileText,
    },
    {
      key: 'santri_crud',
      category: 'datamaster',
      categoryLabel: 'Data Master Pondok',
      title: 'Data Master Santri',
      subtitle: 'Tambah, edit, cari, dan hapus data santri putra/putri beserta foto & kontak wali.',
      badge: `${santriList.length} SANTRI`,
      keywords: 'santri putra putri banin banat nis kamar asrama kelas wali tambah hapus edit',
      icon: GraduationCap,
    },
    {
      key: 'dewan_crud',
      category: 'datamaster',
      categoryLabel: 'Data Master Pondok',
      title: 'Personil Dewan Keamanan',
      subtitle: 'Kelola data anggota keamanan, NRP, divisi pos penjagaan, dan jadwal piket.',
      badge: `${dewanList.length} PERSONIL`,
      keywords: 'dewan keamanan personil petugas gerbang nrp jadwal piket pos',
      icon: ShieldCheck,
    },
    {
      key: 'rbac',
      category: 'keamanan_db',
      categoryLabel: 'Hak Akses & Database',
      title: 'Akun RBAC & Password Pengurus',
      subtitle: 'Kelola akun login seluruh divisi pengurus, password, PIN 6 digit, role, dan otoritas akses.',
      badge: `${usersList.length} AKUN`,
      keywords: 'akun login user password pin rbac role admin ketua sekretaris bendahara perlengkapan keamanan',
      icon: KeyRound,
    },
    {
      key: 'database',
      category: 'keamanan_db',
      categoryLabel: 'Hak Akses & Database',
      title: 'Master Backup & Sinkronisasi DB',
      subtitle: 'Sinkronisasi real-time Cloud Firestore, unduh backup JSON, restore, & reset.',
      badge: 'CLOUD SYNC',
      keywords: 'database backup restore json sinkronisasi cloud firestore reset',
      icon: Database,
    },
  ];

  const categoryTabs: { id: 'all' | 'sistem' | 'persuratan' | 'datamaster' | 'keamanan_db'; label: string; count: number }[] = [
    { id: 'all', label: 'Semua Pengaturan Website', count: optionModules.length },
    { id: 'sistem', label: 'Visual Website & PWA', count: 2 },
    { id: 'persuratan', label: 'Persuratan Sekretaris', count: 1 },
    { id: 'datamaster', label: 'Data Master Pondok', count: 2 },
    { id: 'keamanan_db', label: 'Hak Akses & Database', count: 2 },
  ];

  const filteredModules = optionModules.filter((mod) => {
    const matchesCategory = settingCategory === 'all' || mod.category === settingCategory;
    if (!settingSearch.trim()) return matchesCategory;
    const q = settingSearch.toLowerCase();
    return (
      mod.title.toLowerCase().includes(q) ||
      mod.subtitle.toLowerCase().includes(q) ||
      mod.categoryLabel.toLowerCase().includes(q) ||
      mod.keywords.toLowerCase().includes(q)
    );
  });

  const activeModuleMeta = optionModules.find((m) => m.key === activeSubTab) || optionModules[0];

  return (
    <div className="space-y-6">
      
      {/* Luxury 3D Emerald-Gold Command Header + Search Bar */}
      <div className="metallic-glass-card rounded-3xl p-5 sm:p-6 border border-[#d4af37]/30 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/15 text-emerald-300 border border-[#d4af37]/40 glow-gold">
                Pusat Kendali Administrasi Pondok
              </span>
              <span className="text-[10px] font-mono text-emerald-300/70">· Single Database Cloud Sync</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <Sliders className="w-6 h-6 text-[#e5c158] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)] shrink-0" />
              <span>Options Panel & Konfigurasi Terpadu</span>
            </h1>
            <p className="text-xs text-emerald-100/75 mt-1">
              Kelola pengaturan operasional, identitas visual PWA, format 15 surat resmi, data master santri, akun RBAC, dan database pusat
            </p>
          </div>

          {/* Search Bar Pengaturan + Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-[#e5c158] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={settingSearch}
                onChange={(e) => setSettingSearch(e.target.value)}
                placeholder="Cari menu pengaturan (mis. logo, surat, akun)..."
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#03160f]/95 border border-[#d4af37]/35 focus:border-[#d4af37] text-xs text-white placeholder-emerald-200/45 outline-none shadow-inner transition-all"
              />
              {settingSearch && (
                <button
                  type="button"
                  onClick={() => setSettingSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-300/70 hover:text-white cursor-pointer"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 bg-[#03160f]/95 border border-[#d4af37]/30 px-3.5 py-2.5 rounded-xl text-[11px] font-mono shadow-inner shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#e5c158] font-bold tracking-wide">DB PUSAT: AKTIF</span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-[#d4af37]/50 text-emerald-100 text-xs flex items-center justify-between shadow-xl font-mono">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#e5c158] shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg('')} className="text-[#e5c158] hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Categorized Navigation Panel (No Horizontal Scrollbar Track) */}
      <div className="metallic-glass-card border border-[#d4af37]/25 p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl">
        {/* Category Filter Tabs (Wrapped cleanly) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/40">
          <div className="flex flex-wrap items-center gap-1.5">
            {categoryTabs.map((cat) => {
              const isCatActive = settingCategory === cat.id && !settingSearch.trim();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSettingCategory(cat.id);
                    setSettingSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isCatActive
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#b58e24] text-[#02120a] border-[#f3d266] shadow-md'
                      : 'bg-[#041d13]/85 text-emerald-100/80 hover:text-white hover:bg-[#083021] border-emerald-700/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      isCatActive ? 'bg-[#02120a]/20 text-[#02120a] font-black' : 'bg-emerald-950/80 text-[#e5c158]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-emerald-200/75 flex items-center gap-1.5">
            <span>Modul Aktif:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#d4af37]/20 text-[#e5c158] border border-[#d4af37]/40 font-bold">
              {activeModuleMeta.title}
            </span>
          </div>
        </div>

        {/* 3D Category Cards Grid */}
        {filteredModules.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-bold text-emerald-100">Pengaturan tidak ditemukan untuk kata kunci "{settingSearch}"</p>
            <button
              type="button"
              onClick={() => {
                setSettingSearch('');
                setSettingCategory('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#d4af37]/20 text-[#e5c158] border border-[#d4af37]/40 text-xs font-bold cursor-pointer"
            >
              Tampilkan Semua Pengaturan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredModules.map((mod) => {
              const Icon = mod.icon;
              const isSelected = activeSubTab === mod.key;
              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => setActiveSubTab(mod.key)}
                  className={`text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3 border relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#0b422d] via-[#072c1e] to-[#041b12] border-[#d4af37] shadow-[0_8px_22px_-6px_rgba(212,175,55,0.35)]'
                      : 'bg-[#03160f]/85 hover:bg-[#06281c]/90 border-emerald-800/45 hover:border-[#d4af37]/45'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors border ${
                      isSelected
                        ? 'bg-[#d4af37]/25 text-[#f3d266] border-[#d4af37]/60 shadow-inner'
                        : 'bg-[#06281c] text-emerald-300 group-hover:text-[#e5c158] border-emerald-700/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#e5c158] truncate">
                        {mod.categoryLabel}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#d4af37] text-[#02120a]'
                            : 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/40'
                        }`}
                      >
                        {mod.badge}
                      </span>
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-emerald-50'}`}>
                      {mod.title}
                    </h3>
                    <p className="text-[11px] text-emerald-200/70 line-clamp-2 mt-0.5 leading-relaxed">
                      {mod.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SUB-TAB 1: OPERASIONAL GERBANG & FITUR */}
      {activeSubTab === 'control' && (
        <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Konfigurasi Parameter Operasional Manual
              </h3>
              <p className="text-xs text-emerald-200/75 mt-0.5">
                Nyalakan atau matikan fitur pengawasan gerbang dan toleransi secara instan
              </p>
            </div>
            <span className="text-[10px] font-mono text-yellow-400">ADMIN CONTROL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Penegakan Gerbang Ketat */}
            <div className="p-4 rounded-xl bg-[#041d13]/90 border border-emerald-800 flex items-start justify-between gap-4 tactile-interactive">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Penegakan Gerbang Ketat (Strict Gate Enforcement)</p>
                <p className="text-[11px] text-emerald-200/75">Santri mutlak dilarang check-out tanpa surat izin digital yang telah disetujui.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={configForm.gerbangStrictEnforcement}
                  onChange={(e) => setConfigForm({ ...configForm, gerbangStrictEnforcement: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#0b422d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Auto Generate Pelanggaran Keterlambatan */}
            <div className="p-4 rounded-xl bg-[#041d13]/90 border border-emerald-800 flex items-start justify-between gap-4 tactile-interactive">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Pencatatan Otomatis Pelanggaran Keterlambatan</p>
                <p className="text-[11px] text-emerald-200/75">Saat santri tiba di gerbang melebihi batas waktu, otomatis diterbitkan berkas pelanggaran.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={configForm.autoGenerateViolationOnLate}
                  onChange={(e) => setConfigForm({ ...configForm, autoGenerateViolationOnLate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#0b422d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400" />
              </label>
            </div>

            {/* Toleransi Waktu */}
            <div className="p-4 rounded-xl bg-[#041d13]/90 border border-emerald-800 space-y-2 tactile-interactive">
              <label className="block text-xs font-bold text-white">Toleransi Waktu Keterlambatan (Menit)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={configForm.toleransiKeterlambatanMenit}
                onChange={(e) => setConfigForm({ ...configForm, toleransiKeterlambatanMenit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Kuota Izin Harian */}
            <div className="p-4 rounded-xl bg-[#041d13]/90 border border-emerald-800 space-y-2 tactile-interactive">
              <label className="block text-xs font-bold text-white">Batas Kuota Izin Santri Harian</label>
              <input
                type="number"
                min="5"
                max="200"
                value={configForm.kuotaIzinHarian}
                onChange={(e) => setConfigForm({ ...configForm, kuotaIzinHarian: parseInt(e.target.value) || 35 })}
                className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Mode Operasi Darurat (Lockdown) */}
            <div className="md:col-span-2 p-5 rounded-xl bg-red-950/40 border border-red-600/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 tactile-interactive">
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-500" />
                  Mode Operasi Darurat (Emergency Lockdown Gerbang)
                </p>
                <p className="text-[11px] text-red-200/80 leading-relaxed">
                  Bila diaktifkan, seluruh portal gerbang terkunci dan perizinan keluar santri dibekukan seketika.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfigForm({ ...configForm, modeOperasiDarurat: !configForm.modeOperasiDarurat })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  configForm.modeOperasiDarurat
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40'
                    : 'bg-[#072c1e] text-emerald-100/90 hover:text-white border border-emerald-800'
                }`}
              >
                {configForm.modeOperasiDarurat ? 'NONAKTIFKAN LOCKDOWN' : 'AKTIFKAN LOCKDOWN DARURAT'}
              </button>
            </div>

          </div>

          {/* MANAJEMEN BERITA & INFORMASI TERKINI DASHBOARD UTAMA */}
          <div className="pt-6 border-t border-emerald-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  Manajemen Berita & Informasi Terkini (Dashboard Utama)
                </h4>
                <p className="text-xs text-emerald-200/75 mt-0.5">
                  Tambah, ubah, atau hapus maklumat pengasuh & berita terkini yang tampil di bagian atas Dashboard Utama
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const list = configForm.beritaTerkini || [];
                  const newBerita = {
                    id: `brt_${Date.now()}`,
                    judul: 'Pengumuman Resmi Pengurus Pondok Pesantren Salaf Al-Maliki',
                    isi: 'Tuliskan rincian informasi atau maklumat resmi untuk seluruh pengurus dan santri di sini...',
                    kategori: 'Agenda Pondok' as const,
                    tanggal: new Date().toISOString().split('T')[0],
                    penulis: 'Admin Pusat Al-Maliki',
                    penting: true,
                    gambarUrl: 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=900&q=80',
                  };
                  setConfigForm({ ...configForm, beritaTerkini: [newBerita, ...list] });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#d4af37] hover:bg-[#e5c158] text-[#02120a] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Tambah Berita Baru
              </button>
            </div>

            <div className="space-y-3">
              {(configForm.beritaTerkini || []).map((brt, idx) => (
                <div
                  key={brt.id}
                  className="p-4 rounded-2xl bg-[#03160f]/95 border border-emerald-800/70 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Judul Berita / Maklumat</label>
                      <input
                        type="text"
                        value={brt.judul}
                        onChange={(e) => {
                          const updated = [...(configForm.beritaTerkini || [])];
                          updated[idx] = { ...brt, judul: e.target.value };
                          setConfigForm({ ...configForm, beritaTerkini: updated });
                        }}
                        className="w-full px-3 py-2 bg-black/70 border border-emerald-800 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Kategori</label>
                      <select
                        value={brt.kategori}
                        onChange={(e) => {
                          const updated = [...(configForm.beritaTerkini || [])];
                          updated[idx] = { ...brt, kategori: e.target.value as any };
                          setConfigForm({ ...configForm, beritaTerkini: updated });
                        }}
                        className="w-full px-3 py-2 bg-black/70 border border-emerald-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="Maklumat Pengasuh">Maklumat Pengasuh</option>
                        <option value="Agenda Pondok">Agenda Pondok</option>
                        <option value="Akademik & Taklim">Akademik & Taklim</option>
                        <option value="Keamanan & Ketertiban">Keamanan & Ketertiban</option>
                        <option value="Informasi Wali">Informasi Wali</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Penulis / Pejabat</label>
                        <input
                          type="text"
                          value={brt.penulis}
                          onChange={(e) => {
                            const updated = [...(configForm.beritaTerkini || [])];
                            updated[idx] = { ...brt, penulis: e.target.value };
                            setConfigForm({ ...configForm, beritaTerkini: updated });
                          }}
                          className="w-full px-3 py-2 bg-black/70 border border-emerald-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (configForm.beritaTerkini || []).filter((_, i) => i !== idx);
                          setConfigForm({ ...configForm, beritaTerkini: updated });
                        }}
                        className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/50 cursor-pointer"
                        title="Hapus Berita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Input Gambar Kartu Berita Terkini (Link URL atau Upload Gambar) */}
                  <div className="p-3 rounded-xl bg-black/50 border border-[#d4af37]/35 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-[#02100a] border border-[#d4af37]/50 shrink-0">
                      <img
                        src={
                          brt.gambarUrl ||
                          'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=900&q=80'
                        }
                        alt={brt.judul}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-[10px] font-mono font-bold uppercase text-[#f3d266]">
                          Link URL Gambar Kartu Berita (Tampil di Dashboard Utama)
                        </label>
                        <label className="px-2.5 py-1 rounded-lg bg-emerald-800/70 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold cursor-pointer border border-emerald-500/40">
                          Unggah File Gambar
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const updated = [...(configForm.beritaTerkini || [])];
                                updated[idx] = { ...brt, gambarUrl: String(reader.result || '') };
                                setConfigForm({ ...configForm, beritaTerkini: updated });
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Masukkan Link URL Gambar Berita (https://...)"
                        value={brt.gambarUrl || ''}
                        onChange={(e) => {
                          const updated = [...(configForm.beritaTerkini || [])];
                          updated[idx] = { ...brt, gambarUrl: e.target.value };
                          setConfigForm({ ...configForm, beritaTerkini: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-black/80 border border-emerald-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Isi Informasi / Pengumuman</label>
                    <textarea
                      rows={2}
                      value={brt.isi}
                      onChange={(e) => {
                        const updated = [...(configForm.beritaTerkini || [])];
                        updated[idx] = { ...brt, isi: e.target.value };
                        setConfigForm({ ...configForm, beritaTerkini: updated });
                      }}
                      className="w-full px-3 py-2 bg-black/70 border border-emerald-800 rounded-xl text-xs text-emerald-50 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-300/80">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brt.penting}
                        onChange={(e) => {
                          const updated = [...(configForm.beritaTerkini || [])];
                          updated[idx] = { ...brt, penting: e.target.checked };
                          setConfigForm({ ...configForm, beritaTerkini: updated });
                        }}
                        className="rounded border-emerald-600 text-amber-400 focus:ring-0"
                      />
                      <span>Tandai sebagai Berita Utama / Penting (Sorotan Emas)</span>
                    </label>
                    <span className="font-mono text-[10px] text-emerald-400/70">Tanggal: {brt.tanggal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-emerald-800">
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Simpan Pengaturan Operasional & Berita Dashboard
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: EDIT LOGO, IKON PWA & IDENTITAS APLIKASI */}
      {activeSubTab === 'visual' && (
        <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Palette className="w-4 h-4 text-amber-400" />
                Kustomisasi Logo, Ikon PWA & Identitas Aplikasi
              </h3>
              <p className="text-xs text-emerald-200/75 mt-1 font-mono">
                Atur identitas aplikasi yang terpasang di HP / Laptop (PWA), lambang pondok pesantren, dan latar belakang komando
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 glow-gold">
              PWA & VISUAL SYNC
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* PANEL 1: PENGATURAN IKON APLIKASI PWA (DESKTOP, ANDROID, IOS) */}
            <div className="p-5 rounded-2xl bg-[#041d13]/90 border border-emerald-800/80 space-y-4 shadow-md hover-rainbow-edge">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Ikon Aplikasi PWA (Android / iOS / PC)
                </h4>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/30 font-mono">
                  AUTO SAFE-ZONE
                </span>
              </div>

              {/* TRIPLE PREVIEW: STANDARD, ANDROID SQUIRCLE, DESKTOP BADGE */}
              <div className="p-4 bg-black/70 rounded-2xl border border-emerald-800/90 space-y-3">
                <p className="text-[11px] font-mono text-emerald-100/90 font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Pratinjau Tampilan Ikon di Berbagai Perangkat:
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {/* Preview 1: Android Squircle Maskable */}
                  <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#041d13]/60 border border-emerald-800">
                    <div className="w-14 h-14 rounded-[22%] p-1.5 bg-[#02100a] border border-amber-400/60 shadow-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={configForm.appIconUrl || '/icon.svg'}
                        alt="Android Icon"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-emerald-200/75">Android (Maskable)</span>
                  </div>

                  {/* Preview 2: iOS Rounded App Icon */}
                  <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#041d13]/60 border border-emerald-800">
                    <div className="w-14 h-14 rounded-2xl p-1.5 bg-[#02100a] border border-emerald-400/60 shadow-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={configForm.appIconUrl || '/icon.svg'}
                        alt="iOS Icon"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-emerald-200/75">iPhone / iPad</span>
                  </div>

                  {/* Preview 3: Desktop Taskbar / Chrome */}
                  <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#041d13]/60 border border-emerald-800">
                    <div className="w-14 h-14 rounded-xl p-1.5 bg-[#02100a] border border-amber-400/60 shadow-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={configForm.appIconUrl || '/icon.svg'}
                        alt="Desktop Icon"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-emerald-200/75">PC / Desktop</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-200/75 leading-relaxed font-mono">
                  * Gambar otomatis dinormalisasi ke rasio 1:1 (512x512) dengan margin aman 15% agar logo tidak terpotong saat dipasang di HP.
                </p>
              </div>

              {/* Upload & URL Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">
                    Unggah Ikon Baru (PNG / JPG / SVG)
                  </label>
                  <label className="w-full py-2.5 px-3 rounded-xl bg-[#072c1e] hover:bg-slate-750 border border-emerald-800 hover:border-emerald-500 text-slate-200 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group">
                    <Upload className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Pilih File Ikon dari Komputer / HP</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleUploadAppIcon}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-emerald-200/75 font-mono mt-1">
                    Rekomendasi resolusi: <strong className="text-emerald-300">192×192</strong> atau <strong className="text-emerald-300">512×512 piksel</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">
                    Atau Masukkan URL Ikon Kustom
                  </label>
                  <input
                    type="text"
                    value={configForm.appIconUrl || ''}
                    onChange={(e) => setConfigForm({ ...configForm, appIconUrl: e.target.value })}
                    placeholder="/icon.svg atau https://..."
                    className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, appIconUrl: '/icon.svg' })}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-mono"
                >
                  ↺ Reset ke Ikon Bawaan Al-Maliki
                </button>
                <button
                  type="button"
                  onClick={() => {
                    storageService.updateSystemConfig({ ...configForm });
                    syncPWAIdentity(configForm);
                    onConfigUpdated();
                    setSaveSuccessMsg('Ikon PWA dan manifest berhasil disinkronkan secara instan!');
                    setTimeout(() => setSaveSuccessMsg(''), 4500);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md font-mono flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Terapkan Ikon Sekarang
                </button>
              </div>
            </div>

            {/* PANEL 2: IDENTITAS APLIKASI PWA & WARNA SISTEM */}
            <div className="p-5 rounded-2xl bg-[#041d13]/90 border border-emerald-800/80 space-y-4 shadow-md hover-rainbow-edge">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between font-mono">
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Identitas PWA & Warna Sistem
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/30 font-mono">
                  MANIFEST READY
                </span>
              </h4>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">
                    Nama Lengkap Aplikasi (Title Bar & Splash Screen)
                  </label>
                  <input
                    type="text"
                    value={configForm.namaAplikasi || ''}
                    onChange={(e) => setConfigForm({ ...configForm, namaAplikasi: e.target.value })}
                    placeholder="KEAMANAN SANTRI AL-MALIKI"
                    className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-emerald-200/75 font-mono mt-0.5 block">
                    Nama resmi saat aplikasi dibuka atau dipasang.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">
                    Nama Pendek Aplikasi (Ikon Layar Utama HP / Desktop)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={configForm.namaPendekAplikasi || ''}
                    onChange={(e) => setConfigForm({ ...configForm, namaPendekAplikasi: e.target.value })}
                    placeholder="AL-MALIKI"
                    className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-emerald-200/75 font-mono mt-0.5 block">
                    Maksimal 12-14 karakter agar teks tidak terpotong titik-titik di HP.
                  </span>
                </div>

                {/* Theme & Background Color Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-black/60 rounded-xl border border-emerald-800 space-y-1.5">
                    <label className="block text-[10px] font-bold text-emerald-100/90 uppercase font-mono">
                      Warna Tema Toolbar (Theme Color)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={configForm.themeColor || '#02100a'}
                        onChange={(e) => setConfigForm({ ...configForm, themeColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-emerald-800 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={configForm.themeColor || '#02100a'}
                        onChange={(e) => setConfigForm({ ...configForm, themeColor: e.target.value })}
                        className="w-full px-2 py-1 bg-black border border-emerald-800 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl border border-emerald-800 space-y-1.5">
                    <label className="block text-[10px] font-bold text-emerald-100/90 uppercase font-mono">
                      Warna Latar Splash (Background)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={configForm.backgroundColor || '#02100a'}
                        onChange={(e) => setConfigForm({ ...configForm, backgroundColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-emerald-800 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={configForm.backgroundColor || '#02100a'}
                        onChange={(e) => setConfigForm({ ...configForm, backgroundColor: e.target.value })}
                        className="w-full px-2 py-1 bg-black border border-emerald-800 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Note on PWA Cache */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 font-mono leading-relaxed">
                  <strong>Catatan Sinkronisasi PWA:</strong> Perubahan langsung aktif di peramban web. Untuk aplikasi yang sudah diinstal di layar utama perangkat, browser memperbarui ikon saat update background service worker atau pengguna dapat menghapus dan memasang ulang aplikasi jika ingin melihat perubahan secara instan.
                </div>
              </div>
            </div>

            {/* PANEL 3: PENGATURAN LOGO WEBSITE UTAMA */}
            <div className="p-5 rounded-2xl bg-[#041d13]/90 border border-emerald-800/80 space-y-4 hover-rainbow-edge transition-all shadow-md">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between font-mono">
                <span className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-400" />
                  Logo Website &amp; Dashboard Login
                </span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 font-mono">
                  WEBSITE LOGO
                </span>
              </h4>

              <div className="flex items-center gap-4 p-3 bg-black/60 rounded-xl border border-emerald-800">
                <div className="relative shrink-0 w-16 h-16 rounded-[22%] border-2 border-amber-400 shadow-xl overflow-hidden bg-[#02100a]">
                  <img
                    src={
                      !configForm.logoUrl ||
                      configForm.logoUrl.includes('2026-11-11-7ffd46ad') ||
                      configForm.logoUrl.includes('2026-11-14-03361e24') ||
                      configForm.logoUrl.includes('logo_pesantren_almaliki')
                        ? '/logo-fit.png'
                        : configForm.logoUrl
                    }
                    alt="Logo Website Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover scale-[1.03]"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Pratinjau Logo Website Aktif
                  </p>
                  <p className="text-[11px] text-emerald-200/75">
                    Otomatis sinkron ke <span className="text-emerald-300 font-semibold">Header Bar</span>, <span className="text-emerald-300 font-semibold">Dashboard Utama</span>, dan <span className="text-emerald-300 font-semibold">Layar Login</span>. Logo Tab Keamanan &amp; Surat Perizinan diatur terpisah di <span className="text-amber-300 font-semibold">Option Panel Tab Keamanan</span>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">URL Logo Website Baru</label>
                <input
                  type="text"
                  value={configForm.logoUrl}
                  onChange={(e) => setConfigForm({ ...configForm, logoUrl: e.target.value })}
                  placeholder="https://... atau path gambar logo"
                  className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Unggah Logo Website dari Komputer / HP</label>
                <label className="w-full py-2.5 px-3 rounded-xl bg-[#072c1e] hover:bg-[#0b422d] border border-emerald-800 hover:border-emerald-500 text-slate-200 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">Pilih File Logo (PNG/JPG/WEBP)</span>
                  <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
                </label>
              </div>

              <div className="pt-2 border-t border-emerald-800 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, logoUrl: 'https://cdn.phototourl.com/member/2026-11-14-03361e24-6ae4-4db0-bdad-b98af1797f52.png' })}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-mono"
                >
                  ↺ Reset ke Logo Bawaan Al-Maliki
                </button>
              </div>
            </div>

            {/* PANEL 4: PENGATURAN LATAR BELAKANG (WALLPAPER LAYAR KOMANDO) */}
            <div className="p-5 rounded-2xl bg-[#041d13]/90 border border-emerald-800/80 space-y-4 hover-rainbow-edge shadow-md">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Palette className="w-4 h-4 text-red-500" />
                Latar Belakang (Wallpaper Layar Komando)
              </h4>

              <div className="relative h-24 rounded-xl overflow-hidden border border-emerald-800">
                <img
                  src={configForm.bgUrl}
                  alt="Background Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs font-mono text-white font-bold">
                  Pratinjau Wallpaper (Opasitas {configForm.bgOpacity}%)
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">URL Latar Belakang Baru</label>
                <input
                  type="text"
                  value={configForm.bgUrl}
                  onChange={(e) => setConfigForm({ ...configForm, bgUrl: e.target.value })}
                  placeholder="https://... atau path gambar wallpaper"
                  className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Unggah Wallpaper Gambar Lokal</label>
                <label className="w-full py-2 px-3 rounded-xl bg-[#072c1e] hover:bg-zinc-750 border border-emerald-800 text-emerald-100/90 text-xs flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Pilih Gambar Wallpaper dari Komputer</span>
                  <input type="file" accept="image/*" onChange={handleUploadBg} className="hidden" />
                </label>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-emerald-100/90 mb-1 font-mono">
                  <span>Intensitas Opasitas Wallpaper</span>
                  <span className="text-yellow-400 font-bold">{configForm.bgOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={configForm.bgOpacity}
                  onChange={(e) => setConfigForm({ ...configForm, bgOpacity: parseInt(e.target.value) || 30 })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-emerald-800 flex items-center gap-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, bgUrl: '/src/assets/images/tactical_hq_background_1794052517484.jpg' })}
                  className="text-amber-400 hover:underline cursor-pointer text-[11px]"
                >
                  Preset: Tactical HQ
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, bgUrl: '/src/assets/images/pos_keamanan_gate_1794050743446.jpg' })}
                  className="text-yellow-400 hover:underline cursor-pointer text-[11px]"
                >
                  Preset: Pos Gerbang
                </button>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between pt-4 border-t border-emerald-800 flex-wrap gap-3">
            <span className="text-xs text-emerald-200/75 font-mono">
              * Perubahan tersimpan permanen di database konfigurasi sistem utama.
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              Simpan Seluruh Pengaturan Logo, Ikon & Visual PWA
            </button>
          </div>
        </form>
      )}

      {/* Layout Surat Perizinan & Surat Sanksi dikelola secara independen di Option Panel Tab Keamanan */}

      {/* SUB-TAB 5: EDITOR 15 SURAT SEKRETARIS */}
      {activeSubTab === 'surat_sekretaris_config' && (() => {
        const secCfg: SuratSekretarisConfig = configForm.suratSekretarisConfig || INITIAL_SURAT_SEKRETARIS_CONFIG;
        const activeTpl = secCfg.templates[selectedKodeSuratEdit] || INITIAL_SURAT_SEKRETARIS_CONFIG.templates[selectedKodeSuratEdit];
        const updateSecCfg = (patch: Partial<SuratSekretarisConfig>) => {
          setConfigForm((prev) => ({
            ...prev,
            suratSekretarisConfig: {
              ...(prev.suratSekretarisConfig || INITIAL_SURAT_SEKRETARIS_CONFIG),
              ...patch,
            },
          }));
        };
        const updateTplField = (field: keyof typeof activeTpl, val: string) => {
          updateSecCfg({
            templates: {
              ...secCfg.templates,
              [selectedKodeSuratEdit]: {
                ...activeTpl,
                [field]: val,
              },
            },
          });
        };

        return (
          <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-[#d4af37]/30 space-y-6">
            <div>
              <h3 className="text-sm font-black text-[#f4f9f5] uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#e5c158]" />
                Editor Kop Surat, Penomoran &amp; 15 Template Surat Sekretaris
              </h3>
              <p className="text-xs text-[#d1e7da] mt-1">
                Sesuaikan Kop Surat Pondok, format nomor otomatis, penandatangan resmi, serta isi template untuk ke-15 jenis surat Sekretaris.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Kop Nama Yayasan</label>
                <input
                  type="text"
                  value={secCfg.kopNamaYayasan}
                  onChange={(e) => updateSecCfg({ kopNamaYayasan: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                />
              </div>
              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Kop Nama Pondok</label>
                <input
                  type="text"
                  value={secCfg.kopNamaPondok}
                  onChange={(e) => updateSecCfg({ kopNamaPondok: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                />
              </div>
              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Sub-Instansi (Sekretariat)</label>
                <input
                  type="text"
                  value={secCfg.kopSubInstansi}
                  onChange={(e) => updateSecCfg({ kopSubInstansi: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                />
              </div>
              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Format Nomor Surat ({`{NOMOR},{KODE},{ROMAN},{TAHUN}`})</label>
                <input
                  type="text"
                  value={secCfg.formatNomorSurat}
                  onChange={(e) => updateSecCfg({ formatNomorSurat: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#e5c158] font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#d1e7da] font-semibold mb-1">Alamat &amp; Kontak Kop Surat</label>
                <input
                  type="text"
                  value={secCfg.kopAlamatKontak}
                  onChange={(e) => updateSecCfg({ kopAlamatKontak: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                />
              </div>
              <div>
                <label className="block text-[#e5c158] font-bold mb-1">Link URL Logo 1 (Sebelah Kiri Kop Surat)</label>
                <input
                  type="text"
                  value={secCfg.kopLogoUrl}
                  onChange={(e) => updateSecCfg({ kopLogoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/40 rounded-xl text-[#f4f9f5] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#e5c158] font-bold mb-1">Link URL Logo 2 (Sebelah Kanan Kop Surat)</label>
                <input
                  type="text"
                  value={secCfg.kopLogoKananUrl || ''}
                  onChange={(e) => updateSecCfg({ kopLogoKananUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/40 rounded-xl text-[#f4f9f5] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Kota Terbit Surat</label>
                <input
                  type="text"
                  value={secCfg.kotaTerbit}
                  onChange={(e) => updateSecCfg({ kotaTerbit: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                />
              </div>
              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Nama &amp; Jabatan Penandatangan 1 (Sekretaris)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={secCfg.jabatanPenandatangan}
                    onChange={(e) => updateSecCfg({ jabatanPenandatangan: e.target.value })}
                    className="px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  />
                  <input
                    type="text"
                    value={secCfg.namaPenandatangan}
                    onChange={(e) => updateSecCfg({ namaPenandatangan: e.target.value })}
                    className="px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Nama &amp; Jabatan Penandatangan 2 (Mengetahui)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={secCfg.jabatanPenandatangan2}
                    onChange={(e) => updateSecCfg({ jabatanPenandatangan2: e.target.value })}
                    className="px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  />
                  <input
                    type="text"
                    value={secCfg.namaPenandatangan2}
                    onChange={(e) => updateSecCfg({ namaPenandatangan2: e.target.value })}
                    className="px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#e5c158] font-bold mb-1">Link URL Gambar Tanda Tangan Digital 1 (Sekretaris)</label>
                <input
                  type="text"
                  placeholder="https://... atau data:image/..."
                  value={secCfg.ttdUrl1 || ''}
                  onChange={(e) => updateSecCfg({ ttdUrl1: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/40 rounded-xl text-[#f4f9f5] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#e5c158] font-bold mb-1">Link URL Gambar Tanda Tangan Digital 2 (Ketua Pondok)</label>
                <input
                  type="text"
                  placeholder="https://... atau data:image/..."
                  value={secCfg.ttdUrl2 || ''}
                  onChange={(e) => updateSecCfg({ ttdUrl2: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/40 rounded-xl text-[#f4f9f5] font-mono"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="inline-flex items-center gap-2 text-[#f4f9f5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secCfg.tampilkanPenandatangan2}
                    onChange={(e) => updateSecCfg({ tampilkanPenandatangan2: e.target.checked })}
                  />
                  <span>Tampilkan Penandatangan 2</span>
                </label>
                <label className="inline-flex items-center gap-2 text-[#f4f9f5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secCfg.tampilkanStempel}
                    onChange={(e) => updateSecCfg({ tampilkanStempel: e.target.checked })}
                  />
                  <span>Stempel Pondok</span>
                </label>
                <label className="inline-flex items-center gap-2 text-[#f4f9f5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secCfg.tampilkanBismillah}
                    onChange={(e) => updateSecCfg({ tampilkanBismillah: e.target.checked })}
                  />
                  <span>Tampilkan Bismillah</span>
                </label>
              </div>
            </div>

            {/* Template Selector & Editor for 15 Letter Types */}
            <div className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/30 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-[#e5c158] uppercase">Edit Template Isi 15 Jenis Surat</span>
                <select
                  value={selectedKodeSuratEdit}
                  onChange={(e) => setSelectedKodeSuratEdit(e.target.value as KodeJenisSurat)}
                  className="px-3 py-2 bg-[#06281c] border border-[#d4af37]/40 rounded-xl text-[#f4f9f5] font-bold"
                >
                  {(Object.keys(secCfg.templates) as KodeJenisSurat[]).map((kode) => (
                    <option key={kode} value={kode}>
                      {kode} — {secCfg.templates[kode].namaJenis}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#d1e7da] mb-1">Judul Default Surat</label>
                  <input
                    type="text"
                    value={activeTpl.judulDefault}
                    onChange={(e) => updateTplField('judulDefault', e.target.value)}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/25 rounded-xl text-[#f4f9f5]"
                  />
                </div>
                <div>
                  <label className="block text-[#d1e7da] mb-1">Salam Pembuka</label>
                  <input
                    type="text"
                    value={activeTpl.salamPembuka}
                    onChange={(e) => updateTplField('salamPembuka', e.target.value)}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/25 rounded-xl text-[#f4f9f5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#d1e7da] mb-1">Kalimat Pembuka</label>
                <textarea
                  rows={2}
                  value={activeTpl.kalimatPembuka}
                  onChange={(e) => updateTplField('kalimatPembuka', e.target.value)}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/25 rounded-xl text-[#f4f9f5]"
                />
              </div>

              <div>
                <label className="block text-[#d1e7da] mb-1">Isi Template Default ({activeTpl.kode})</label>
                <textarea
                  rows={5}
                  value={activeTpl.isiTemplate}
                  onChange={(e) => updateTplField('isiTemplate', e.target.value)}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/25 rounded-xl text-[#f4f9f5] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#d1e7da] mb-1">Kalimat Penutup</label>
                <textarea
                  rows={2}
                  value={activeTpl.kalimatPenutup}
                  onChange={(e) => updateTplField('kalimatPenutup', e.target.value)}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/25 rounded-xl text-[#f4f9f5]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="luxury-gold-btn px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
                Simpan Pengaturan Surat Sekretaris
              </button>
            </div>
          </form>
        );
      })()}

      {/* SUB-TAB 6: INPUT & HAPUS SANTRI LANGSUNG DARI OPTION PANEL */}
      {activeSubTab === 'santri_crud' && (
        <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-4 hover-rainbow-edge">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Users className="w-4 h-4 text-emerald-400" />
                Manajemen Data Santri Manual (Admin Master Control)
              </h3>
              <p className="text-xs text-emerald-200/75 mt-1 font-mono">
                Admin dapat menginput, memperbarui, dan menghapus berkas santri langsung dari Option Panel
              </p>
            </div>

            <button
              onClick={() => {
                setEditingSantri(null);
                setSantriForm({
                  nis: `20240${Math.floor(1000 + Math.random() * 9000)}`,
                  nama: '',
                  gender: 'putra',
                  kelas: '1 Wustho (Tsanawiyah)',
                  kamar: 'K-01 (Imam Nafi\')',
                  asrama: 'Asrama Putra Sunan Giri',
                  alamat: 'Karawang',
                  namaWali: '',
                  noWaWali: '0812',
                  jarakRumahKm: 15,
                  status: 'Aktif',
                  poinPelanggaran: 0,
                  foto: '',
                });
                setIsSantriModalOpen(true);
              }}
              className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all cursor-pointer shadow-xl self-start sm:self-auto border border-amber-300/60 hover-rainbow-edge"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Input Santri Baru</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama, NIS, atau kelas..."
              value={searchSantri}
              onChange={(e) => setSearchSantri(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs bg-[#02100a]/90 border border-emerald-800/80 rounded-2xl text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-400 font-mono shadow-inner transition-all hover-rainbow-edge"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-emerald-800/80">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-emerald-100/90 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">NIS & Santri</th>
                  <th className="px-4 py-3.5">Gender</th>
                  <th className="px-4 py-3.5">Kelas & Kamar</th>
                  <th className="px-4 py-3.5">Wali & WhatsApp</th>
                  <th className="px-4 py-3.5">Poin Disiplin</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Kelola Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/60 bg-[#02100a]/40 font-mono">
                {filteredSantri.map((s) => (
                  <tr key={s.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {s.foto ? (
                          <img
                            src={s.foto}
                            alt={s.nama}
                            className="w-8 h-8 rounded-full object-cover border border-amber-400/60 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#072c1e] border border-amber-400/60 shadow-xs shrink-0 flex items-center justify-center text-amber-400">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate max-w-[150px]">{s.nama}</div>
                          <div className="text-[10px] font-mono text-emerald-200/75">NIS: {s.nis}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-[11px] font-mono">
                      {s.gender === 'putra' ? 'Banin (Putra)' : 'Banat (Putri)'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{s.kelas}</div>
                      <div className="text-[10px] text-emerald-200/75">{s.kamar}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-200">{s.namaWali}</div>
                      <div className="text-[10px] font-mono text-emerald-400">{s.noWaWali}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-yellow-400">
                      {s.poinPelanggaran} Poin
                    </td>
                    <td className="px-4 py-3 text-[11px] font-semibold text-emerald-400">
                      {s.status}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingSantri(s);
                          setSantriForm({ ...s });
                          setIsSantriModalOpen(true);
                        }}
                        className="p-1.5 text-emerald-200/75 hover:text-yellow-400 hover:bg-[#072c1e] rounded-lg cursor-pointer"
                        title="Edit Data Santri"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus santri ${s.nama} (${s.nis}) dari database pusat?`)) {
                            storageService.deleteSantri(s.id);
                            onConfigUpdated();
                          }
                        }}
                        className="p-1.5 text-emerald-200/75 hover:text-red-400 hover:bg-[#072c1e] rounded-lg cursor-pointer"
                        title="Hapus Santri"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: INPUT & HAPUS DEWAN KEAMANAN LANGSUNG DARI OPTION PANEL */}
      {activeSubTab === 'dewan_crud' && (
        <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-4 hover-rainbow-edge">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Manajemen Personil Dewan Keamanan Manual
              </h3>
              <p className="text-xs text-emerald-200/75 mt-1 font-mono">
                Admin dapat mendaftarkan personil baru, mengatur divisi pos, atau menghapus personil dari database
              </p>
            </div>

            <button
              onClick={() => {
                setEditingDewan(null);
                setDewanForm({
                  nrp: `KAMTIB-${Math.floor(100 + Math.random() * 900)}`,
                  nama: '',
                  jabatan: 'Anggota Keamanan',
                  divisi: 'Pos Gerbang Utama',
                  noWa: '0812',
                  alamat: 'Komplek Asatidz Al-Maliki',
                  statusKeaktifan: 'Aktif',
                  foto: '',
                  jadwalPiket: [{ hari: 'Senin', shift: 'Pagi (06.00 - 14.00)', pos: 'Pos Gerbang Utama' }],
                });
                setIsDewanModalOpen(true);
              }}
              className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all cursor-pointer shadow-xl self-start sm:self-auto border border-amber-300/60 hover-rainbow-edge"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Input Personil Keamanan</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              placeholder="Cari personil keamanan berdasarkan nama atau NRP..."
              value={searchDewan}
              onChange={(e) => setSearchDewan(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs bg-[#02100a]/90 border border-emerald-800/80 rounded-2xl text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-400 font-mono shadow-inner transition-all hover-rainbow-edge"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-emerald-800/80">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-emerald-100/90 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Personil Keamanan</th>
                  <th className="px-4 py-3.5">Jabatan</th>
                  <th className="px-4 py-3.5">Divisi Penugasan</th>
                  <th className="px-4 py-3.5">No. WhatsApp</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Kelola Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/60 bg-[#02100a]/40 font-mono">
                {filteredDewan.map((d) => (
                  <tr key={d.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-xs">{d.nama}</div>
                      <div className="text-[10px] font-mono text-emerald-200/75">NRP: {d.nrp}</div>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{d.jabatan}</td>
                    <td className="px-4 py-3 text-amber-400 font-mono">{d.divisi}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{d.noWa}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-emerald-400">● {d.statusKeaktifan}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingDewan(d);
                          setDewanForm({ ...d });
                          setIsDewanModalOpen(true);
                        }}
                        className="p-1.5 text-emerald-200/75 hover:text-yellow-400 hover:bg-[#072c1e] rounded-lg cursor-pointer"
                        title="Edit Data Personil"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus personil ${d.nama} dari dewan keamanan?`)) {
                            storageService.deleteDewanKeamanan(d.id);
                            onConfigUpdated();
                          }
                        }}
                        className="p-1.5 text-emerald-200/75 hover:text-red-400 hover:bg-[#072c1e] rounded-lg cursor-pointer"
                        title="Hapus Personil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: RBAC USER ACCOUNTS MANAGEMENT */}
      {activeSubTab === 'rbac' && (
        <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-4 hover-rainbow-edge">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Daftar Personil & Kredensial Hak Akses RBAC
              </h3>
              <p className="text-xs text-emerald-200/75 mt-1 font-mono">
                Atur hak akses login, kata sandi, NRP, jabatan, dan kewenangan personil keamanan
              </p>
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormData({
                  username: '',
                  password: '',
                  pin: `${Math.floor(100000 + Math.random() * 900000)}`,
                  nama: '',
                  role: 'anggota_keamanan',
                  nrp: `KAMTIB-${Math.floor(100 + Math.random() * 900)}`,
                  jabatan: 'Petugas Keamanan & Disiplin',
                  divisi: 'Patroli & Intelijen',
                  genderAccess: 'all',
                  noWa: '0812',
                  alamat: 'Komplek Ponpes Salaf Al-Maliki',
                  avatar: '',
                  statusAktif: true,
                });
                setIsUserModalOpen(true);
              }}
              className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all cursor-pointer shadow-xl border border-amber-300/60 hover-rainbow-edge"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>Tambah Akun Login Personil</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-emerald-800/80">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-emerald-100/90 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Personil</th>
                  <th className="px-4 py-3.5">PIN 6 Digit & Kredensial</th>
                  <th className="px-4 py-3.5">Peran / Role</th>
                  <th className="px-4 py-3.5">Divisi & Otoritas</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/60 bg-[#02100a]/40 font-mono">
                {usersList.map((u) => {
                  const isAdmin = u.role === 'admin';
                  return (
                    <tr key={u.id} className="table-row-rainbow transition-all cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-emerald-800" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#072c1e] border border-emerald-800 flex items-center justify-center text-amber-400">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-xs">{u.nama}</p>
                            <p className="text-[10px] font-mono text-emerald-200/75">NRP: {u.nrp || '-'} · WA: {u.noWa || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs space-y-1">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f9e29c] font-black text-[11px]">
                            PIN: {u.pin || '111111'}
                          </span>
                        </div>
                        <div className="text-[11px]">
                          User: <strong className="text-amber-400">{u.username}</strong> · Pass: <strong className="text-yellow-400">{u.password || '••••••••'}</strong>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isAdmin ? 'bg-amber-400/20 text-yellow-300 border border-amber-400/40' : 'bg-emerald-600/20 text-amber-400 border border-emerald-600/40'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-emerald-200/75 mt-0.5">{u.jabatan}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-[11px]">{u.divisi}</p>
                        <p className="text-[10px] text-emerald-300/60 font-mono capitalize">Wilayah: {u.genderAccess}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold ${u.statusAktif ? 'text-emerald-400' : 'text-red-400'}`}>
                          {u.statusAktif ? '● Aktif' : '○ Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserFormData({ ...u });
                            setIsUserModalOpen(true);
                          }}
                          className="p-1.5 text-emerald-200/75 hover:text-yellow-400 hover:bg-[#072c1e] rounded-lg cursor-pointer"
                          title="Ubah Data & Password"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus akun ${u.nama}?`)) {
                                storageService.deleteUser(u.id);
                                onConfigUpdated();
                              }
                            }}
                            className="p-1.5 text-emerald-200/75 hover:text-red-400 hover:bg-[#072c1e] rounded-lg cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: DATABASE BACKUP & MASTER RESTORE */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          {/* Real-time Central Cloud Sync Telemetry Banner */}
          <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-500/40 shadow-2xl bg-gradient-to-r from-[#02100a] via-[#041d13] to-emerald-950/60 hover-rainbow-edge space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 glow-gold">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40">
                      SINGLE DATABASE ARCHITECTURE
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide mt-1">
                    Sinkronisasi Realtime Multi-Platform (Laptop, PWA HP, AI Studio)
                  </h3>
                  <p className="text-xs text-emerald-200/75 font-mono">
                    ID Database: <span className="text-amber-300 font-bold">ai-studio-simkamtibpondokp-0ca6cfda-fbeb-4a4d-91e1-25f2c74e35be</span> · Project: <span className="text-emerald-300 font-bold">gold-card-583d0</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setSaveSuccessMsg('Menyinkronkan data dengan Database Pusat Firestore...');
                  const ok = await storageService.forcePullFromCloud();
                  if (ok) {
                    setSaveSuccessMsg('Data berhasil ditarik dan disinkronkan langsung dari Database Pusat Firestore.');
                    onConfigUpdated();
                  } else {
                    setSaveSuccessMsg('Koneksi lokal aktif, sinkronisasi cloud siap.');
                  }
                  setTimeout(() => setSaveSuccessMsg(''), 4000);
                }}
                className="tactile-interactive inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 rounded-xl transition-all shadow-lg cursor-pointer border border-emerald-300"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                <span>Tarik Data Terbaru (Force Pull)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#02100a]/80 border border-emerald-800">
                <span className="text-emerald-200/75 text-[10px] block">STATUS KONEKSI</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  TERHUBUNG KE FIRESTORE
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#02100a]/80 border border-emerald-800">
                <span className="text-emerald-200/75 text-[10px] block">PLATFORM TERKONEKSI</span>
                <span className="font-bold text-emerald-300 mt-0.5 block">
                  Laptop / PWA HP / AI Studio
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#02100a]/80 border border-emerald-800">
                <span className="text-emerald-200/75 text-[10px] block">METODE SINKRONISASI</span>
                <span className="font-bold text-amber-300 mt-0.5 block">
                  Bi-Directional onSnapshot (Realtime)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-4 hover-rainbow-edge card-3d-floating">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Download className="w-4 h-4 text-amber-400" />
                Cadangkan Seluruh Basis Data Pusat
              </h3>
              <p className="text-xs text-emerald-200/75 leading-relaxed font-mono">
                Mengekspor seluruh tabel data santri, personil RBAC, arsip perizinan, tata tertib, kasus pelanggaran, dan riwayat audit log ke file JSON tunggal.
              </p>
              <button
                onClick={() => {
                  const json = storageService.exportFullBackup();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `backup_pusat_sim_kamtib_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="tactile-interactive w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl border border-amber-300/60"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Unduh Master Backup JSON</span>
              </button>
            </div>

            <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-4 hover-rainbow-edge card-3d-floating">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Upload className="w-4 h-4 text-emerald-400" />
                Pulihkan Basis Data dari Master JSON
              </h3>
              <p className="text-xs text-emerald-200/75 leading-relaxed font-mono">
                Memulihkan konfigurasi sistem, akun pengguna RBAC, dan rekam jejak santri dari arsip JSON cadangan terenkripsi ke database pusat.
              </p>
              <label className="tactile-interactive w-full py-3 px-4 rounded-2xl bg-[#041d13]/90 hover:bg-[#072c1e] border border-emerald-800/80 text-white font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl hover-rainbow-edge">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Pilih Berkas JSON Cadangan</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      const content = evt.target?.result as string;
                      const ok = await storageService.importFullBackup(content);
                      if (ok) {
                        alert('Alhamdulillah, seluruh data berhasil disinkronkan kembali ke database pusat.');
                        onConfigUpdated();
                      } else {
                        alert('File JSON tidak valid.');
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Santri Modal (Input/Edit) */}
      {isSantriModalOpen && (
        <div 
          onClick={() => setIsSantriModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[92vh] flex flex-col metallic-glass-card border border-emerald-800/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-emerald-800 bg-gradient-to-r from-[#02100a] via-[#041d13] to-[#02100a]">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Users className="w-4 h-4 text-emerald-400" />
                {editingSantri ? 'Ubah Data Santri' : 'Input Santri Baru'}
              </h3>
              <button 
                onClick={() => setIsSantriModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-[#072c1e]/80 text-emerald-200/75 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveSantri} className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 text-xs font-mono">
              
              {/* SECTION: FOTO SANTRI (URL LINK & FILE UPLOAD) */}
              <div className="p-3.5 bg-[#02100a]/90 border border-emerald-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-mono">
                    Foto Profil Santri (Link URL / Berkas)
                  </span>
                  <span className="text-[9px] text-emerald-200/75 font-mono">
                    Otomatis Sinkron
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  {/* Photo Preview Box */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-md shrink-0 bg-[#041d13] flex items-center justify-center text-amber-400">
                    {santriForm.foto ? (
                      <img
                        src={santriForm.foto}
                        alt="Pratinjau Foto Santri"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div>
                      <input
                        type="url"
                        placeholder="Tempelkan URL Foto: https://..."
                        value={santriForm.foto || ''}
                        onChange={(e) => setSantriForm({ ...santriForm, foto: e.target.value })}
                        className="w-full px-3 py-2 bg-[#041d13] border border-emerald-800/80 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <label className="px-2.5 py-1 bg-[#072c1e] hover:bg-[#0b422d] text-emerald-100/90 rounded-lg cursor-pointer transition-colors border border-emerald-800 font-sans">
                        <span>Pilih Berkas Foto</span>
                        <input type="file" accept="image/*" onChange={handleUploadSantriFoto} className="hidden" />
                      </label>
                      {santriForm.foto && (
                        <button
                          type="button"
                          onClick={() => setSantriForm({ ...santriForm, foto: '' })}
                          className="px-2.5 py-1 bg-[#072c1e] hover:bg-[#0b422d] text-red-400 hover:text-red-300 rounded-lg cursor-pointer transition-colors border border-emerald-800"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* NIS & Nama */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">NIS Santri</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: 20240182"
                    value={santriForm.nis || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, nis: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap santri"
                    value={santriForm.nama || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>
              </div>

              {/* Gender & Kelas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Jenis Kelamin</label>
                  <select
                    value={santriForm.gender || 'putra'}
                    onChange={(e) => setSantriForm({ ...santriForm, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="putra">Santri Putra (Banin)</option>
                    <option value="putri">Santri Putri (Banat)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Tingkatan / Kelas</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: 1 Wustho / 2 Ulya"
                    value={santriForm.kelas || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, kelas: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>
              </div>

              {/* Kamar & Asrama */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Kamar Santri</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: K-01 (Imam Nafi')"
                    value={santriForm.kamar || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, kamar: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Asrama</label>
                  <input
                    type="text"
                    placeholder="Misal: Asrama Putra Sunan Giri"
                    value={santriForm.asrama || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, asrama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>
              </div>

              {/* Wali & No WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama wali santri"
                    value={santriForm.namaWali || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, namaWali: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={santriForm.noWaWali || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, noWaWali: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Alamat Asal & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Alamat Asal Santri</label>
                  <input
                    type="text"
                    placeholder="Kota / Kab Asal"
                    value={santriForm.alamat || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, alamat: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Status Santri</label>
                  <select
                    value={santriForm.status || 'Aktif'}
                    onChange={(e) => setSantriForm({ ...santriForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Aktif">Aktif di Pondok</option>
                    <option value="Sakit">Sedang Sakit / Istirahat</option>
                    <option value="Cuti">Cuti / Izin Pulang</option>
                    <option value="Diskors">Diskors</option>
                    <option value="Alumni">Alumni / Mutasi</option>
                  </select>
                </div>
              </div>

              {/* Poin Pelanggaran */}
              <div>
                <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Poin Pelanggaran Awal</label>
                <input
                  type="number"
                  min="0"
                  value={santriForm.poinPelanggaran || 0}
                  onChange={(e) => setSantriForm({ ...santriForm, poinPelanggaran: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => setIsSantriModalOpen(false)}
                  className="px-4 py-2 text-emerald-200/75 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  {editingSantri ? 'Simpan Perubahan' : 'Tambah Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dewan Modal (Input/Edit) */}
      {isDewanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg metallic-glass-card border border-emerald-800/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-emerald-800 bg-gradient-to-r from-[#02100a] via-[#041d13] to-[#02100a]">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                {editingDewan ? 'Ubah Personil Dewan Keamanan' : 'Input Personil Keamanan Baru'}
              </h3>
              <button 
                onClick={() => setIsDewanModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-[#072c1e]/80 text-emerald-200/75 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDewan} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">NRP Personil</label>
                  <input
                    type="text"
                    required
                    value={dewanForm.nrp}
                    onChange={(e) => setDewanForm({ ...dewanForm, nrp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={dewanForm.nama}
                    onChange={(e) => setDewanForm({ ...dewanForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={dewanForm.jabatan}
                    onChange={(e) => setDewanForm({ ...dewanForm, jabatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Divisi Penugasan</label>
                  <select
                    value={dewanForm.divisi}
                    onChange={(e) => setDewanForm({ ...dewanForm, divisi: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="Biro Komando Pusat">Biro Komando Pusat</option>
                    <option value="Pos Gerbang Utama">Pos Gerbang Utama</option>
                    <option value="Patroli & Intelijen">Patroli & Intelijen</option>
                    <option value="Keamanan Banin (Putra)">Keamanan Banin (Putra)</option>
                    <option value="Keamanan Banat (Putri)">Keamanan Banat (Putri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">No. WhatsApp Personil</label>
                <input
                  type="text"
                  required
                  value={dewanForm.noWa}
                  onChange={(e) => setDewanForm({ ...dewanForm, noWa: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => setIsDewanModalOpen(false)}
                  className="px-4 py-2 text-emerald-200/75 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan Personil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RBAC User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg metallic-glass-card border border-emerald-800/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-emerald-800 bg-gradient-to-r from-[#02100a] via-[#041d13] to-[#02100a]">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <KeyRound className="w-4 h-4 text-amber-400" />
                {editingUser ? 'Perbarui Kredensial Personil' : 'Tambah Personil RBAC Baru'}
              </h3>
              <button 
                onClick={() => setIsUserModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-[#072c1e]/80 text-emerald-200/75 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs font-mono max-h-[82vh] overflow-y-auto">
              <div className="p-3.5 rounded-2xl bg-[#02120b] border border-[#d4af37]/40 space-y-1.5">
                <label className="block text-[#f9e29c] font-bold uppercase text-[10px] tracking-wider">
                  Kode PIN 6 Digit (Login Lock Screen iPhone)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="Contoh: 222222"
                  value={userFormData.pin || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-2.5 bg-[#041d13] border border-[#d4af37]/60 rounded-xl text-[#f9e29c] font-mono text-base font-black tracking-[0.35em] focus:outline-none focus:border-[#f9e29c]"
                />
                <p className="text-[10px] text-emerald-200/75">
                  Digunakan untuk login langsung melalui layar kunci 6 digit. Wajib 6 angka.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Kata Sandi (Password)</label>
                  <input
                    type="text"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Lengkap Personil</label>
                  <input
                    type="text"
                    required
                    value={userFormData.nama}
                    onChange={(e) => setUserFormData({ ...userFormData, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Jabatan Resmi</label>
                  <input
                    type="text"
                    required
                    value={userFormData.jabatan || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, jabatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Peran Akses (RBAC Role)</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="admin">Admin (Super Administrator)</option>
                    <option value="ketua_pondok">Ketua Pondok (Pimpinan)</option>
                    <option value="sekretaris">Sekretaris Pondok</option>
                    <option value="bendahara">Bendahara Pondok</option>
                    <option value="perlengkapan">Bagian Perlengkapan</option>
                    <option value="ketua_keamanan">Ketua Keamanan</option>
                    <option value="anggota_keamanan">Anggota Keamanan</option>
                    <option value="petugas_gerbang">Petugas Pos Gerbang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Otoritas Wilayah</label>
                  <select
                    value={userFormData.genderAccess}
                    onChange={(e) => setUserFormData({ ...userFormData, genderAccess: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="all">Semua (Putra & Putri)</option>
                    <option value="putra">Khusus Santri Putra (Banin)</option>
                    <option value="putri">Khusus Santri Putri (Banat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={userFormData.noWa || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, noWa: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/90 font-bold uppercase text-[10px] tracking-wider mb-1">Nomor Registrasi (NRP)</label>
                  <input
                    type="text"
                    required
                    value={userFormData.nrp}
                    onChange={(e) => setUserFormData({ ...userFormData, nrp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-emerald-200/75 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan Akun & PIN 6 Digit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
