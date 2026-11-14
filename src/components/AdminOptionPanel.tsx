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
  FileCheck,
  FileText,
  Printer,
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
import { SystemConfig, UserAccount, UserRole, Santri, DewanKeamanan, Gender, SuratIzinLayoutConfig, SuratSanksiLayoutConfig, KodeJenisSurat, SuratSekretarisConfig } from '../types';

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
  const [activeSubTab, setActiveSubTab] = useState<'control' | 'visual' | 'surat_layout' | 'surat_sanksi_layout' | 'surat_sekretaris_config' | 'santri_crud' | 'dewan_crud' | 'rbac' | 'database'>('control');
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

  // Save Config & Visual Options
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSystemConfig(configForm);
    syncPWAIdentity(configForm);
    setSaveSuccessMsg('Konfigurasi sistem, logo resmi, dan identitas PWA berhasil disimpan & disinkronkan!');
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
    key: 'control' | 'visual' | 'surat_layout' | 'surat_sanksi_layout' | 'surat_sekretaris_config' | 'santri_crud' | 'dewan_crud' | 'rbac' | 'database';
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
      categoryLabel: 'Sistem & Visual',
      title: 'Operasional, Gerbang & Berita Dashboard',
      subtitle: 'Kelola Berita & Informasi Terkini di Dashboard Utama, aturan gerbang, dan toleransi waktu.',
      badge: 'OPERASIONAL & BERITA',
      keywords: 'berita informasi pengumuman maklumat dashboard gerbang operasional toleransi terlambat waktu wib',
      icon: Sliders,
    },
    {
      key: 'visual',
      category: 'sistem',
      categoryLabel: 'Sistem & Visual',
      title: 'Identitas Pondok, Logo & PWA',
      subtitle: 'Edit nama pondok, pimpinan, alamat, logo resmi, ikon instalasi PWA, & background.',
      badge: 'BRANDING & PWA',
      keywords: 'logo ikon pwa background nama pondok pimpinan pengasuh warna tema visual',
      icon: Palette,
    },
    {
      key: 'surat_layout',
      category: 'persuratan',
      categoryLabel: 'Format & Persuratan',
      title: 'Layout Surat Izin Santri',
      subtitle: 'Atur kop surat, stempel, QR code, & tanda tangan pada cetak surat izin keluar.',
      badge: 'SURAT IZIN',
      keywords: 'surat izin keluar pulang kop tanda tangan stempel qr cetak',
      icon: FileCheck,
    },
    {
      key: 'surat_sanksi_layout',
      category: 'persuratan',
      categoryLabel: 'Format & Persuratan',
      title: 'Layout Surat Pelanggaran & Sanksi',
      subtitle: 'Atur kop surat, pasal pelanggaran, & otorisasi pada surat pembinaan santri.',
      badge: 'SURAT SANKSI',
      keywords: 'surat sanksi pelanggaran tazir pembinaan skorsing kop tanda tangan',
      icon: Printer,
    },
    {
      key: 'surat_sekretaris_config',
      category: 'persuratan',
      categoryLabel: 'Format & Persuratan',
      title: 'Editor 15 Surat Resmi Sekretaris',
      subtitle: 'Kustomisasi kode klasifikasi, kop, & pejabat penandatangan 15 jenis surat pondok.',
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
      subtitle: 'Kelola akun login seluruh divisi pengurus, password, role, dan otoritas akses.',
      badge: `${usersList.length} AKUN`,
      keywords: 'akun login user password rbac role admin ketua sekretaris bendahara perlengkapan keamanan',
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
    { id: 'all', label: 'Semua Pengaturan', count: optionModules.length },
    { id: 'sistem', label: 'Sistem & Visual PWA', count: 2 },
    { id: 'persuratan', label: 'Format & Persuratan', count: 3 },
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

            {/* PANEL 3: PENGATURAN LOGO RESMI PONDOK PESANTREN */}
            <div className="p-5 rounded-2xl bg-[#041d13]/90 border border-emerald-800/80 space-y-4 hover-rainbow-edge transition-all shadow-md">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between font-mono">
                <span className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-400" />
                  Logo Resmi Pondok Pesantren
                </span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 font-mono">
                  IN-APP LOGO
                </span>
              </h4>

              <div className="flex items-center gap-4 p-3 bg-black/60 rounded-xl border border-emerald-800">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-400 via-amber-400 to-emerald-500 opacity-60 blur-xs" />
                  <img
                    src={configForm.logoUrl || '/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg'}
                    alt="Logo Preview"
                    className="relative w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-xl"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Pratinjau Logo Aktif
                  </p>
                  <p className="text-[11px] text-emerald-200/75">
                    Otomatis sinkron ke <span className="text-emerald-300 font-semibold">Sidebar</span>, <span className="text-emerald-300 font-semibold">Header Bar</span>, <span className="text-emerald-300 font-semibold">Layar Login</span>, dan <span className="text-emerald-300 font-semibold">Kop Surat Resmi</span>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">URL Logo Baru</label>
                <input
                  type="text"
                  value={configForm.logoUrl}
                  onChange={(e) => setConfigForm({ ...configForm, logoUrl: e.target.value })}
                  placeholder="https://... atau path gambar logo"
                  className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Unggah Logo dari Komputer / HP</label>
                <label className="w-full py-2.5 px-3 rounded-xl bg-[#072c1e] hover:bg-[#0b422d] border border-emerald-800 hover:border-emerald-500 text-slate-200 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">Pilih File Logo (PNG/JPG/WEBP)</span>
                  <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
                </label>
              </div>

              <div className="pt-2 border-t border-emerald-800 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, logoUrl: '/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg' })}
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

      {/* SUB-TAB 3: EDITOR LAYOUT SURAT IZIN DIGITAL RESMI */}
      {activeSubTab === 'surat_layout' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30 glow-gold">
                    DOCUMENT ENGINE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300/60">· Official Digital Permit Layout Customizer</span>
                </div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Editor Layout & Format Dokumen Surat Izin Digital
                </h3>
                <p className="text-xs text-emerald-200/75 mt-1 font-mono">
                  Sesuaikan teks kop instansi, kalimat pembuka, ketentuan disiplin santri, penomoran, dan stempel pejabat pengesah
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const defaultLayout: SuratIzinLayoutConfig = {
                      teksBismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                      kopNamaInstansi: configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
                      kopSubInstansi: 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)',
                      kopAlamatKontak: 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800',
                      judulSurat: 'SURAT KETERANGAN IZIN KELUAR / PULANG',
                      formatNomorSurat: 'IZIN/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}',
                      kalimatPembuka: 'Pengurus Dewan Keamanan Pondok Pesantren Salaf Al-Maliki dengan ini menerangkan bahwa santri yang tercantum di bawah ini telah mendapatkan izin resmi dengan ketentuan sebagai berikut:',
                      ketentuanPoin1: 'Wajib menjaga akhlaqul karimah, adab santri, dan shalat lima waktu berjamaah.',
                      ketentuanPoin2: 'Menunjukkan surat izin ini kepada Petugas Gerbang saat keluar dan kembali.',
                      ketentuanPoin3: 'Wajib kembali tepat waktu. Keterlambatan tanpa keterangan akan dikenakan takzir edukatif.',
                      kotaTerbit: 'Karawang',
                      jabatanPenandatangan: 'Ketua Dewan Keamanan',
                      namaPenandatangan: 'Abdul Rohman',
                      gelarPenandatangan: 'Ustadz Abdul Rohman, S.Pd.I',
                      tampilkanStempelSah: true,
                      tampilkanQrCode: true,
                    };
                    setConfigForm(prev => ({ ...prev, suratIzinLayout: defaultLayout }));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#041d13] border border-emerald-800 hover:border-slate-500 text-emerald-100/90 hover:text-white text-xs font-mono font-bold cursor-pointer transition-all"
                >
                  ↺ Reset Bawaan
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2 font-mono font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg border border-amber-300/60 cursor-pointer"
                >
                  Simpan Layout Surat Izin
                </button>
              </div>
            </div>

            {/* Split Grid: Form Editor (Left) & Real-time Live Letter Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Form Controls (Left Column 7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Header & Kop Instansi */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>A. Kop Surat & Identitas Lembaga</span>
                  </h4>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Teks Bismillah (Kaligrafi / Arab)</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, teksBismillah: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Nama Lembaga di Kop</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.kopNamaInstansi || configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, kopNamaInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Instansi / Bagian Keamanan</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.kopSubInstansi || 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, kopSubInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Alamat & Nomor Kontak Hotline di Kop</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, kopAlamatKontak: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 2. Judul Dokumen & Redaksi Pembuka */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>B. Judul Dokumen & Kalimat Pernyataan</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Judul Surat</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.judulSurat || 'SURAT KETERANGAN IZIN KELUAR / PULANG'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, judulSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Format Nomor Surat</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.formatNomorSurat || 'IZIN/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, formatNomorSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Kalimat Mukaddimah / Pembuka</label>
                    <textarea
                      rows={2}
                      value={configForm.suratIzinLayout?.kalimatPembuka || 'Pengurus Dewan Keamanan Pondok Pesantren Salaf Al-Maliki dengan ini menerangkan bahwa santri yang tercantum di bawah ini telah mendapatkan izin resmi dengan ketentuan sebagai berikut:'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, kalimatPembuka: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 3. Ketentuan Santri di Luar Pondok */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>C. Butir Ketentuan & Tata Tertib</span>
                  </h4>

                  <div>
                    <label className="block text-[10px] text-emerald-200/75 mb-1 font-mono">Ketentuan Poin 1 (Adab & Ibadah):</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.ketentuanPoin1 || 'Wajib menjaga akhlaqul karimah, adab santri, dan shalat lima waktu berjamaah.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, ketentuanPoin1: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-200/75 mb-1 font-mono">Ketentuan Poin 2 (Prosedur Gerbang):</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.ketentuanPoin2 || 'Menunjukkan surat izin ini kepada Petugas Gerbang saat keluar dan kembali.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, ketentuanPoin2: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-200/75 mb-1 font-mono">Ketentuan Poin 3 (Disiplin Waktu & Takzir):</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.ketentuanPoin3 || 'Wajib kembali tepat waktu. Keterlambatan tanpa keterangan akan dikenakan takzir edukatif.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, ketentuanPoin3: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 4. Tanda Tangan & Pengesahan */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>D. Pejabat Pengesah & Tanda Tangan</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Kota Penerbitan Surat</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.kotaTerbit || 'Karawang'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, kotaTerbit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Jabatan Penandatangan</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.jabatanPenandatangan || 'Ketua Dewan Keamanan'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, jabatanPenandatangan: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Nama Tanda Tangan (Singkat)</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.namaPenandatangan || 'Abdul Rohman'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, namaPenandatangan: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Nama Terang & Gelar Lengkap</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.gelarPenandatangan || 'Ustadz Abdul Rohman, S.Pd.I'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, gelarPenandatangan: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-800">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer font-mono">
                      <input
                        type="checkbox"
                        checked={configForm.suratIzinLayout?.tampilkanStempelSah !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, tampilkanStempelSah: e.target.checked }
                        }))}
                        className="rounded border-emerald-800 accent-amber-400 cursor-pointer"
                      />
                      <span>Tampilkan Stempel Sah</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer font-mono">
                      <input
                        type="checkbox"
                        checked={configForm.suratIzinLayout?.tampilkanQrCode !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, tampilkanQrCode: e.target.checked }
                        }))}
                        className="rounded border-emerald-800 accent-amber-400 cursor-pointer"
                      />
                      <span>Tampilkan QR Code Verifikasi</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Real-time Live Letter Preview (Right Column 5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Preview Dokumen Cetak
                  </span>
                  <span className="text-[10px] text-emerald-200/75 font-mono">Format A4 Resmi</span>
                </div>

                <div className="bg-white border-2 border-emerald-800/80 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-2xl text-[10px] leading-relaxed font-sans overflow-hidden">
                  
                  {/* Kop Preview */}
                  <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-900 text-center">
                    <img
                      src={configForm.logoUrl || '/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg'}
                      alt=""
                      className="w-10 h-10 object-contain rounded-full border border-amber-500"
                    />
                    <div className="flex-1 px-2 text-center">
                      <p className="font-serif text-emerald-900 text-xs font-semibold">
                        {configForm.suratIzinLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                      </p>
                      <h4 className="font-bold text-emerald-950 uppercase text-[11px] tracking-tight">
                        {configForm.suratIzinLayout?.kopNamaInstansi || configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                      </h4>
                      <p className="text-[9px] text-amber-900 font-medium">
                        {configForm.suratIzinLayout?.kopSubInstansi || 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)'}
                      </p>
                      <p className="text-[8px] text-neutral-500 line-clamp-1">
                        {configForm.suratIzinLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Karawang'}
                      </p>
                    </div>
                  </div>

                  <div className="h-0.5 bg-amber-500 my-1"></div>

                  {/* Title Preview */}
                  <div className="text-center my-2">
                    <p className="font-bold uppercase tracking-wide text-emerald-950 underline underline-offset-2 text-[11px]">
                      {configForm.suratIzinLayout?.judulSurat || 'SURAT KETERANGAN IZIN KELUAR / PULANG'}
                    </p>
                    <p className="text-[9px] text-neutral-500 font-mono">
                      Nomor: IZIN/MALIKI/2026/XI/042
                    </p>
                  </div>

                  {/* Body Preview */}
                  <p className="text-[9px] text-neutral-700 mb-2 leading-normal">
                    {configForm.suratIzinLayout?.kalimatPembuka || 'Pengurus Dewan Keamanan menerangkan bahwa santri telah mendapatkan izin resmi.'}
                  </p>

                  {/* Mock Santri Details */}
                  <div className="bg-amber-50/50 rounded-lg p-2 border border-emerald-900/10 mb-2 text-[9px] space-y-0.5">
                    <div className="flex"><span className="w-20 text-neutral-500">Santri</span><span className="font-semibold text-neutral-900">: Muhammad Zaki Yamani (NIS: 202401)</span></div>
                    <div className="flex"><span className="w-20 text-neutral-500">Kelas & Kamar</span><span>: 1 Ulya · Kamar K-01</span></div>
                    <div className="flex"><span className="w-20 text-neutral-500">Jenis Izin</span><span className="font-semibold text-emerald-800">: Izin Pulang (Keluarga)</span></div>
                  </div>

                  {/* Rules preview */}
                  <div className="bg-neutral-50 p-2 rounded border border-neutral-200 text-[8px] text-neutral-600 mb-3">
                    <p className="font-bold text-neutral-800 mb-0.5">Ketentuan Santri Selama di Luar:</p>
                    <ol className="list-decimal pl-3 space-y-0.5">
                      <li className="line-clamp-1">{configForm.suratIzinLayout?.ketentuanPoin1 || 'Menjaga akhlaqul karimah.'}</li>
                      <li className="line-clamp-1">{configForm.suratIzinLayout?.ketentuanPoin2 || 'Menunjukkan surat izin di gerbang.'}</li>
                      <li className="line-clamp-1">{configForm.suratIzinLayout?.ketentuanPoin3 || 'Kembali tepat waktu.'}</li>
                    </ol>
                  </div>

                  {/* Signatures Preview */}
                  <div className="flex items-end justify-between pt-1 border-t border-neutral-200 text-[9px]">
                    <div className="text-center w-28">
                      <p className="text-[8px] text-neutral-500">Pengurus Pencatat</p>
                      <p className="font-serif italic text-emerald-900 font-bold py-1">Kang Miftah</p>
                      <p className="font-semibold text-neutral-800 underline text-[8px]">Kang Miftahul Falah</p>
                    </div>

                    <div className="text-center w-32">
                      <p className="text-[8px] text-neutral-500">{configForm.suratIzinLayout?.kotaTerbit || 'Karawang'}, {new Date().toLocaleDateString('id-ID')}</p>
                      <p className="text-[8px] font-medium text-neutral-800">{configForm.suratIzinLayout?.jabatanPenandatangan || 'Ketua Dewan Keamanan'}</p>
                      
                      <div className="relative py-1 flex items-center justify-center">
                        {configForm.suratIzinLayout?.tampilkanStempelSah !== false && (
                          <span className="absolute text-[7px] font-bold text-emerald-800/40 uppercase rotate-[-6deg] border border-emerald-600/40 px-1 rounded-xs">
                            TERVERIFIKASI
                          </span>
                        )}
                        <span className="font-serif italic text-emerald-950 font-bold text-[10px] z-10">
                          {configForm.suratIzinLayout?.namaPenandatangan || 'Abdul Rohman'}
                        </span>
                      </div>

                      <p className="font-bold text-neutral-900 underline text-[8px]">
                        {configForm.suratIzinLayout?.gelarPenandatangan || 'Ustadz Abdul Rohman, S.Pd.I'}
                      </p>
                    </div>
                  </div>

                </div>

                <div className="p-3 rounded-xl bg-[#041d13]/90 border border-emerald-800 text-xs text-emerald-100/90 font-mono space-y-1">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Sinkronisasi Otomatis
                  </p>
                  <p className="text-[11px] text-emerald-200/75">
                    Format layout ini akan langsung diterapkan saat pengurus maupun admin menekan tombol "Cetak Surat Izin" di dashboard.
                  </p>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-emerald-800">
              <button
                type="submit"
                className="tactile-interactive px-6 py-2.5 font-bold font-mono text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer border border-amber-300/60"
              >
                Simpan & Terapkan Format Surat Izin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: EDITOR LAYOUT SURAT PELANGGARAN & SANKSI EDUKATIF */}
      {activeSubTab === 'surat_sanksi_layout' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30 glow-gold">
                    SANCTION DOCUMENT ENGINE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300/60">· Official Violation & Educational Sanction Customizer</span>
                </div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Editor Layout & Format Dokumen Surat Pelanggaran & Sanksi Edukatif
                </h3>
                <p className="text-xs text-emerald-200/75 mt-1 font-mono">
                  Sesuaikan kop surat, logo, redaksi kalimat takzir, kolom identitas santri, jumlah tanda tangan pejabat, dan footer pengesahan
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const defaultSanksiLayout: SuratSanksiLayoutConfig = {
                      teksBismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                      kopNamaInstansi: configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
                      kopSubInstansi: 'DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN',
                      kopAlamatKontak: 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800',
                      judulSurat: 'SURAT PELANGGARAN DAN SANKSI EDUKATIF',
                      formatNomorSurat: 'SNK/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}',
                      kalimatPembuka: 'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri Pondok Pesantren Salaf Al-Maliki, dengan ini diterbitkan Surat Pelanggaran dan Penetapan Sanksi Edukatif kepada santri:',
                      tampilkanNis: true,
                      tampilkanKelas: true,
                      tampilkanKamar: true,
                      tampilkanWali: true,
                      tampilkanHariTanggal: true,
                      tampilkanBatasWaktu: true,
                      formatKalimatHukuman: 'Santri yang bersangkutan diwajibkan menyelesaikan takzir edukatif dan pembinaan ibadah/keilmuan sebagai berikut:',
                      pesanEdukasi: 'Sanksi ini bersifat edukatif dan pembinaan ruhiyah semata tanpa kekerasan fisik. Santri wajib menyelesaikan dan menyetorkan tugas pembinaan sebelum batas waktu yang telah ditentukan.',
                      kotaTerbit: 'Karawang',
                      jumlahTandaTangan: 3,
                      posisiTandaTangan: 'sejajar',
                      jabatanPihak1: 'Santri Pelanggar',
                      namaPihak1: 'Santri Bersangkutan',
                      gelarPihak1: '(Tanda Tangan & Komitmen)',
                      jabatanPihak2: 'Petugas / Dewan Keamanan',
                      namaPihak2: 'Ustadz Abdul Rohman, S.Pd.I',
                      gelarPihak2: 'Ketua Dewan Keamanan',
                      jabatanPihak3: 'Ketua Pondok Pesantren',
                      namaPihak3: 'K.H. Syarifuddin Malik',
                      gelarPihak3: 'Pengasuh / Pimpinan Pondok',
                      footerCatatan: 'Dokumen ini sah diterbitkan secara otomatis oleh SIM Kamtib Al-Maliki dan diarsipkan dalam pangkalan data kedisiplinan pondok.',
                      tampilkanStempelSah: true,
                    };
                    setConfigForm(prev => ({ ...prev, suratSanksiLayout: defaultSanksiLayout }));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#041d13] border border-emerald-800 hover:border-slate-500 text-emerald-100/90 hover:text-white text-xs font-mono font-bold cursor-pointer transition-all"
                >
                  ↺ Reset Bawaan
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2 font-mono font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg border border-amber-300/60 cursor-pointer"
                >
                  Simpan Layout Surat Sanksi
                </button>
              </div>
            </div>

            {/* Split Grid: Form Controls (Left 7 cols) & Live Preview (Right 5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Form Controls Column */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Judul & Penomoran */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>A. Judul Surat & Format Penomoran</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Judul Dokumen Surat</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.judulSurat || 'SURAT PELANGGARAN DAN SANKSI EDUKATIF'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, judulSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Format Nomor Surat</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.formatNomorSurat || 'SNK/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, formatNomorSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Kop Surat & Logo Pondok */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>B. Kop Surat & Identitas Pondok</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Teks Bismillah (Arab / Kaligrafi)</label>
                    <input
                      type="text"
                      value={configForm.suratSanksiLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, teksBismillah: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Nama Lembaga Pondok</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.kopNamaInstansi || configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, kopNamaInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Sub-Bagian / Divisi</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.kopSubInstansi || 'DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, kopSubInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Alamat & Kontak di Kop</label>
                    <input
                      type="text"
                      value={configForm.suratSanksiLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, kopAlamatKontak: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 3. Isi Redaksi & Format Kalimat Surat */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>C. Isi Redaksi & Kalimat Surat</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Kalimat Pembuka Sidang Qanun</label>
                    <textarea
                      rows={2}
                      value={configForm.suratSanksiLayout?.kalimatPembuka || 'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri Pondok Pesantren Salaf Al-Maliki, dengan ini diterbitkan Surat Pelanggaran dan Penetapan Sanksi Edukatif kepada santri:'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, kalimatPembuka: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Kalimat Pengantar Hukuman / Takzir Edukatif</label>
                    <textarea
                      rows={2}
                      value={configForm.suratSanksiLayout?.formatKalimatHukuman || 'Santri yang bersangkutan diwajibkan menyelesaikan takzir edukatif dan pembinaan ibadah/keilmuan sebagai berikut:'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, formatKalimatHukuman: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Pesan Edukasi & Prinsip Pembinaan (Tanpa Kekerasan)</label>
                    <textarea
                      rows={2}
                      value={configForm.suratSanksiLayout?.pesanEdukasi || 'Sanksi ini bersifat edukatif dan pembinaan ruhiyah semata tanpa kekerasan fisik. Santri wajib menyelesaikan dan menyetorkan tugas pembinaan sebelum batas waktu yang telah ditentukan.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, pesanEdukasi: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 4. Kolom Identitas yang Ditampilkan */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>D. Kolom Identitas Santri yang Ditampilkan</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 hover:text-white">
                      <input
                        type="checkbox"
                        checked={configForm.suratSanksiLayout?.tampilkanNis !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, tampilkanNis: e.target.checked }
                        }))}
                        className="rounded accent-amber-400"
                      />
                      <span>Tampilkan NIS</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 hover:text-white">
                      <input
                        type="checkbox"
                        checked={configForm.suratSanksiLayout?.tampilkanKelas !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, tampilkanKelas: e.target.checked }
                        }))}
                        className="rounded accent-amber-400"
                      />
                      <span>Tampilkan Kelas</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 hover:text-white">
                      <input
                        type="checkbox"
                        checked={configForm.suratSanksiLayout?.tampilkanKamar !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, tampilkanKamar: e.target.checked }
                        }))}
                        className="rounded accent-amber-400"
                      />
                      <span>Tampilkan Kamar</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 hover:text-white">
                      <input
                        type="checkbox"
                        checked={configForm.suratSanksiLayout?.tampilkanWali !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, tampilkanWali: e.target.checked }
                        }))}
                        className="rounded accent-amber-400"
                      />
                      <span>Nama Orang Tua / Wali</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 hover:text-white">
                      <input
                        type="checkbox"
                        checked={configForm.suratSanksiLayout?.tampilkanHariTanggal !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, tampilkanHariTanggal: e.target.checked }
                        }))}
                        className="rounded accent-amber-400"
                      />
                      <span>Hari & Tgl Kasus</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 hover:text-white">
                      <input
                        type="checkbox"
                        checked={configForm.suratSanksiLayout?.tampilkanBatasWaktu !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, tampilkanBatasWaktu: e.target.checked }
                        }))}
                        className="rounded accent-amber-400"
                      />
                      <span>Batas Waktu Target</span>
                    </label>
                  </div>
                </div>

                {/* 5. Jumlah & Posisi Kolom Tanda Tangan */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>E. Kolom Tanda Tangan & Pejabat Pengesah</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Jumlah Kolom Tanda Tangan</label>
                      <select
                        value={configForm.suratSanksiLayout?.jumlahTandaTangan || 3}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, jumlahTandaTangan: Number(e.target.value) as any }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value={2}>2 Kolom (Dewan Keamanan & Ketua Pondok)</option>
                        <option value={3}>3 Kolom (Santri, Dewan Keamanan & Ketua Pondok)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Kota Terbit</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.kotaTerbit || 'Karawang'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, kotaTerbit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Pejabat 2: Dewan Keamanan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Jabatan Pejabat Keamanan</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.jabatanPihak2 || 'Petugas / Dewan Keamanan'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, jabatanPihak2: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Nama & Gelar Pejabat Keamanan</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.namaPihak2 || 'Ustadz Abdul Rohman, S.Pd.I'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, namaPihak2: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Pejabat 3: Ketua Pondok */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Jabatan Pimpinan Pondok</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.jabatanPihak3 || 'Ketua Pondok Pesantren'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, jabatanPihak3: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-100/90 mb-1 font-mono">Nama & Gelar Ketua Pondok</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.namaPihak3 || 'K.H. Syarifuddin Malik'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, namaPihak3: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-emerald-100/90 hover:text-white pt-2">
                    <input
                      type="checkbox"
                      checked={configForm.suratSanksiLayout?.tampilkanStempelSah !== false}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, tampilkanStempelSah: e.target.checked }
                      }))}
                      className="rounded accent-amber-400"
                    />
                    <span className="font-mono text-xs">Tampilkan Stempel Digital Sah Pondok Pesantren</span>
                  </label>
                </div>

                {/* 6. Footer Catatan */}
                <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>F. Footer atau Keterangan Tambahan</span>
                  </h4>
                  <input
                    type="text"
                    value={configForm.suratSanksiLayout?.footerCatatan || 'Dokumen ini sah diterbitkan secara otomatis oleh SIM Kamtib Al-Maliki dan diarsipkan dalam pangkalan data kedisiplinan pondok.'}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      suratSanksiLayout: { ...prev.suratSanksiLayout, footerCatatan: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-black border border-emerald-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

              </div>

              {/* Live Preview Column (Right 5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-20 bg-amber-50/20 text-neutral-900 rounded-2xl border-2 border-emerald-900/30 p-5 shadow-2xl overflow-hidden font-sans text-[10px] leading-tight">
                  <div className="text-center pb-2 border-b-2 border-emerald-900">
                    <p className="font-serif text-emerald-900 text-xs font-bold">
                      {configForm.suratSanksiLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                    </p>
                    <p className="font-black text-emerald-950 uppercase text-[11px] tracking-tight">
                      {configForm.suratSanksiLayout?.kopNamaInstansi || configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                    </p>
                    <p className="font-bold text-amber-900 text-[8px] uppercase">
                      {configForm.suratSanksiLayout?.kopSubInstansi || 'DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN'}
                    </p>
                    <p className="text-[7px] text-neutral-600 line-clamp-1">
                      {configForm.suratSanksiLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Karawang'}
                    </p>
                  </div>

                  <div className="text-center py-2">
                    <p className="font-black underline uppercase text-[9px]">
                      {configForm.suratSanksiLayout?.judulSurat || 'SURAT PELANGGARAN DAN SANKSI EDUKATIF'}
                    </p>
                    <p className="text-[7px] font-mono text-neutral-600">Nomor: SNK/MALIKI/2026/XI/001</p>
                  </div>

                  <p className="text-[8px] text-neutral-700 italic mb-2 line-clamp-2">
                    {configForm.suratSanksiLayout?.kalimatPembuka || 'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri...'}
                  </p>

                  <div className="bg-white/80 border border-neutral-300 rounded p-2 mb-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-neutral-600">Santri:</span>
                      <span className="font-bold">Ahmad Zaki Mubarak</span>
                    </div>
                    {configForm.suratSanksiLayout?.tampilkanNis !== false && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">NIS:</span>
                        <span className="font-mono">202401001</span>
                      </div>
                    )}
                    {configForm.suratSanksiLayout?.tampilkanKelas !== false && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Kelas:</span>
                        <span>1 Ulya (Aliyah) - Banin</span>
                      </div>
                    )}
                    {configForm.suratSanksiLayout?.tampilkanHariTanggal !== false && (
                      <div className="flex justify-between text-rose-800">
                        <span>Tanggal:</span>
                        <span className="font-bold">Senin, 08 Nov 2026</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-100/60 p-2 rounded border-l-2 border-amber-600 mb-2">
                    <p className="font-bold text-[8px] text-neutral-900">
                      Takzir: Menghafal Nadzom Al-Imrithi bait 1-30
                    </p>
                    <p className="text-[7px] text-rose-800 font-mono font-bold mt-0.5">
                      Batas Pengumpulan: 15 Nov 2026, 17:00 WIB
                    </p>
                  </div>

                  <div className="pt-2 text-right text-[7px] text-neutral-600">
                    {configForm.suratSanksiLayout?.kotaTerbit || 'Karawang'}, {new Date().toISOString().split('T')[0]}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[7px] pt-2">
                    <div>
                      <p className="font-bold">{configForm.suratSanksiLayout?.jabatanPihak2 || 'Dewan Keamanan'}</p>
                      <div className="h-6"></div>
                      <p className="font-bold underline">{configForm.suratSanksiLayout?.namaPihak2 || 'Ustadz Abdul Rohman, S.Pd.I'}</p>
                    </div>
                    <div>
                      <p className="font-bold">{configForm.suratSanksiLayout?.jabatanPihak3 || 'Ketua Pondok'}</p>
                      <div className="h-6"></div>
                      <p className="font-bold underline">{configForm.suratSanksiLayout?.namaPihak3 || 'K.H. Syarifuddin Malik'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-300 mt-2 text-[6px] text-neutral-500 text-center line-clamp-1">
                    {configForm.suratSanksiLayout?.footerCatatan || 'Dokumen sah SIM Kamtib Al-Maliki'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#041d13]/90 border border-emerald-800 text-xs text-emerald-100/90 font-mono space-y-1">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Penerapan Aman & Akuntabel
                  </p>
                  <p className="text-[11px] text-emerald-200/75 font-sans">
                    Perubahan pengaturan layout ini akan langsung diterapkan pada surat sanksi berikutnya secara otomatis, tanpa mengubah arsip surat lama yang sudah diterbitkan.
                  </p>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-emerald-800">
              <button
                type="submit"
                className="tactile-interactive px-6 py-2.5 font-bold font-mono text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer border border-amber-300/60"
              >
                Simpan & Terapkan Format Surat Sanksi
              </button>
            </div>
          </form>
        </div>
      )}

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
              <div className="flex flex-wrap items-center gap-4 pt-4">
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
