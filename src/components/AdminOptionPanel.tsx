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
  GraduationCap
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { SystemConfig, UserAccount, UserRole, Santri, DewanKeamanan, Gender, SuratIzinLayoutConfig, SuratSanksiLayoutConfig } from '../types';

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
  const [activeSubTab, setActiveSubTab] = useState<'control' | 'visual' | 'surat_layout' | 'surat_sanksi_layout' | 'santri_crud' | 'dewan_crud' | 'rbac' | 'database'>('control');
  const [configForm, setConfigForm] = useState<SystemConfig>(systemConfig);
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
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
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
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    jadwalPiket: [{ hari: 'Senin', shift: 'Pagi (06.00 - 14.00)', pos: 'Pos Gerbang Utama' }],
  });

  // Modals for RBAC User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<UserAccount>>({
    username: '',
    password: '',
    nama: '',
    role: 'anggota_keamanan',
    nrp: '',
    jabatan: 'Petugas Keamanan',
    divisi: 'Pos Gerbang Utama',
    genderAccess: 'all',
    noWa: '0812',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    statusAktif: true,
  });

  // Save Config & Visual Options
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSystemConfig(configForm);
    setSaveSuccessMsg('Konfigurasi Option Panel dan penyesuaian visual berhasil disimpan.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    onConfigUpdated();
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

  // Santri Handlers
  const handleSaveSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriForm.nis || !santriForm.nama) return;

    const saved: Santri = {
      id: editingSantri ? editingSantri.id : `san_${Date.now()}`,
      nis: santriForm.nis,
      nama: santriForm.nama,
      foto: santriForm.foto || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      gender: santriForm.gender as Gender,
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
      foto: dewanForm.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
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

    const saved: UserAccount = {
      id: editingUser ? editingUser.id : `usr_${Date.now()}`,
      username: userFormData.username.trim().toLowerCase(),
      password: userFormData.password || 'kamtib123',
      nama: userFormData.nama,
      role: userFormData.role as UserRole,
      nrp: userFormData.nrp || `SECOP-${Math.floor(10 + Math.random() * 90)}`,
      jabatan: userFormData.jabatan || 'Personil Keamanan',
      divisi: userFormData.divisi || 'Komando Pusat',
      genderAccess: userFormData.genderAccess as any,
      noWa: userFormData.noWa || '08123456789',
      avatar: userFormData.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      statusAktif: userFormData.statusAktif ?? true,
    };

    storageService.saveUser(saved);
    setIsUserModalOpen(false);
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

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 glow-cyan">
                Master Security Options Panel
              </span>
              <span className="text-[10px] font-mono text-slate-500">· Central Architecture Node</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <Sliders className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              Option Panel Komando Pusat & Kendali Manual Sistem
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Pusat administrasi manual: kustomisasi visual (logo/background), CRUD santri & personil, RBAC credentials, dan konfigurasi gerbang
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-mono shadow-inner glow-cyan">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-cyan-300 font-bold tracking-wide">DATABASE PUSAT: AKTIF</span>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-xl font-mono">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Sub-Tabs Navigation - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs shadow-lg font-mono">
        {[
          { key: 'control', label: '1. Pengaturan Operasional Gerbang' },
          { key: 'visual', label: '2. Edit Logo & Background Aplikasi' },
          { key: 'surat_layout', label: '3. Editor Layout Surat Izin Digital' },
          { key: 'surat_sanksi_layout', label: '4. Editor Layout Surat Pelanggaran & Sanksi' },
          { key: 'santri_crud', label: `5. Input & Hapus Santri (${santriList.length})` },
          { key: 'dewan_crud', label: `6. Input & Hapus Dewan Keamanan (${dewanList.length})` },
          { key: 'rbac', label: `7. Akun RBAC & Password (${usersList.length})` },
          { key: 'database', label: '8. Master Backup Database' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`tactile-interactive px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === tab.key
                ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: OPERASIONAL GERBANG & FITUR */}
      {activeSubTab === 'control' && (
        <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Konfigurasi Parameter Operasional Manual
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Nyalakan atau matikan fitur pengawasan gerbang dan toleransi secara instan
              </p>
            </div>
            <span className="text-[10px] font-mono text-yellow-400">ADMIN CONTROL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Penegakan Gerbang Ketat */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start justify-between gap-4 tactile-interactive">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Penegakan Gerbang Ketat (Strict Gate Enforcement)</p>
                <p className="text-[11px] text-zinc-400">Santri mutlak dilarang check-out tanpa surat izin digital yang telah disetujui.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={configForm.gerbangStrictEnforcement}
                  onChange={(e) => setConfigForm({ ...configForm, gerbangStrictEnforcement: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Auto Generate Pelanggaran Keterlambatan */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start justify-between gap-4 tactile-interactive">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Pencatatan Otomatis Pelanggaran Keterlambatan</p>
                <p className="text-[11px] text-zinc-400">Saat santri tiba di gerbang melebihi batas waktu, otomatis diterbitkan berkas pelanggaran.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={configForm.autoGenerateViolationOnLate}
                  onChange={(e) => setConfigForm({ ...configForm, autoGenerateViolationOnLate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400" />
              </label>
            </div>

            {/* Toleransi Waktu */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 tactile-interactive">
              <label className="block text-xs font-bold text-white">Toleransi Waktu Keterlambatan (Menit)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={configForm.toleransiKeterlambatanMenit}
                onChange={(e) => setConfigForm({ ...configForm, toleransiKeterlambatanMenit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Kuota Izin Harian */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 tactile-interactive">
              <label className="block text-xs font-bold text-white">Batas Kuota Izin Santri Harian</label>
              <input
                type="number"
                min="5"
                max="200"
                value={configForm.kuotaIzinHarian}
                onChange={(e) => setConfigForm({ ...configForm, kuotaIzinHarian: parseInt(e.target.value) || 35 })}
                className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
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
                    : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                }`}
              >
                {configForm.modeOperasiDarurat ? 'NONAKTIFKAN LOCKDOWN' : 'AKTIFKAN LOCKDOWN DARURAT'}
              </button>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Simpan Pengaturan Operasional
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: EDIT LOGO & LATAR BELAKANG APLIKASI */}
      {activeSubTab === 'visual' && (
        <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
              <Palette className="w-4 h-4 text-yellow-400" />
              Kustomisasi Logo & Latar Belakang Aplikasi
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Ganti lambang pondok pesantren dan visual wallpaper latar belakang aplikasi secara real-time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* 1. Pengaturan Logo */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 hover-rainbow-edge transition-all shadow-md">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between font-mono">
                <span className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  Logo Resmi Pondok Pesantren
                </span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  REALTIME SYNC
                </span>
              </h4>

              <div className="flex items-center gap-4 p-3 bg-black/60 rounded-xl border border-slate-800">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-400 via-amber-400 to-blue-500 opacity-60 blur-xs" />
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
                  <p className="text-[11px] text-slate-400">
                    Otomatis sinkron ke <span className="text-cyan-300 font-semibold">Sidebar</span>, <span className="text-cyan-300 font-semibold">Header Bar</span>, <span className="text-cyan-300 font-semibold">Layar Login</span>, <span className="text-cyan-300 font-semibold">Kartu Santri (KTS)</span>, dan <span className="text-cyan-300 font-semibold">Kop Surat Izin</span>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">URL Logo Baru (Link Eksternal atau Path)</label>
                <input
                  type="text"
                  value={configForm.logoUrl}
                  onChange={(e) => setConfigForm({ ...configForm, logoUrl: e.target.value })}
                  placeholder="https://... atau path gambar logo"
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Unggah Logo dari Komputer / HP</label>
                <label className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">Pilih File Logo (PNG/JPG/WEBP)</span>
                  <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, logoUrl: '/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg' })}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-mono"
                >
                  ↺ Reset ke Logo Bawaan Al-Maliki
                </button>
                <button
                  type="button"
                  onClick={() => {
                    storageService.updateSystemConfig({ ...configForm });
                    onConfigUpdated();
                    setSaveSuccessMsg('Logo pesantren berhasil diperbarui ke seluruh sistem!');
                    setTimeout(() => setSaveSuccessMsg(''), 4000);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-cyan-950 font-mono"
                >
                  Terapkan Logo Sekarang
                </button>
              </div>
            </div>

            {/* 2. Pengaturan Latar Belakang (Background Wallpaper) */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 tactile-interactive">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-red-500" />
                Latar Belakang (Wallpaper Layar)
              </h4>

              <div className="relative h-24 rounded-xl overflow-hidden border border-zinc-700">
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
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">URL Latar Belakang Baru</label>
                <input
                  type="text"
                  value={configForm.bgUrl}
                  onChange={(e) => setConfigForm({ ...configForm, bgUrl: e.target.value })}
                  placeholder="https://... atau path gambar wallpaper"
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Unggah Wallpaper Gambar Lokal</label>
                <label className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-300 text-xs flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Pilih Gambar Wallpaper dari Komputer</span>
                  <input type="file" accept="image/*" onChange={handleUploadBg} className="hidden" />
                </label>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-300 mb-1 font-mono">
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

              <div className="pt-2 border-t border-zinc-800 flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, bgUrl: '/src/assets/images/tactical_hq_background_1794052517484.jpg' })}
                  className="text-blue-400 hover:underline cursor-pointer text-[11px]"
                >
                  Preset: Tactical HQ Room
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setConfigForm({ ...configForm, bgUrl: '/src/assets/images/pos_keamanan_gate_1794050743446.jpg' })}
                  className="text-yellow-400 hover:underline cursor-pointer text-[11px]"
                >
                  Preset: Pos Gerbang Pesantren
                </button>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Simpan Perubahan Visual Logo & Background
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: EDITOR LAYOUT SURAT IZIN DIGITAL RESMI */}
      {activeSubTab === 'surat_layout' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30 glow-gold">
                    DOCUMENT ENGINE
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">· Official Digital Permit Layout Customizer</span>
                </div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Editor Layout & Format Dokumen Surat Izin Digital
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
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
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-mono font-bold cursor-pointer transition-all"
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
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>A. Kop Surat & Identitas Lembaga</span>
                  </h4>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Teks Bismillah (Kaligrafi / Arab)</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, teksBismillah: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Nama Lembaga di Kop</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.kopNamaInstansi || configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, kopNamaInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Instansi / Bagian Keamanan</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.kopSubInstansi || 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, kopSubInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Alamat & Nomor Kontak Hotline di Kop</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, kopAlamatKontak: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 2. Judul Dokumen & Redaksi Pembuka */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>B. Judul Dokumen & Kalimat Pernyataan</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Judul Surat</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.judulSurat || 'SURAT KETERANGAN IZIN KELUAR / PULANG'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, judulSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Format Nomor Surat</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.formatNomorSurat || 'IZIN/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, formatNomorSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Kalimat Mukaddimah / Pembuka</label>
                    <textarea
                      rows={2}
                      value={configForm.suratIzinLayout?.kalimatPembuka || 'Pengurus Dewan Keamanan Pondok Pesantren Salaf Al-Maliki dengan ini menerangkan bahwa santri yang tercantum di bawah ini telah mendapatkan izin resmi dengan ketentuan sebagai berikut:'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, kalimatPembuka: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 3. Ketentuan Santri di Luar Pondok */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>C. Butir Ketentuan & Tata Tertib</span>
                  </h4>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-mono">Ketentuan Poin 1 (Adab & Ibadah):</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.ketentuanPoin1 || 'Wajib menjaga akhlaqul karimah, adab santri, dan shalat lima waktu berjamaah.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, ketentuanPoin1: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-mono">Ketentuan Poin 2 (Prosedur Gerbang):</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.ketentuanPoin2 || 'Menunjukkan surat izin ini kepada Petugas Gerbang saat keluar dan kembali.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, ketentuanPoin2: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-mono">Ketentuan Poin 3 (Disiplin Waktu & Takzir):</label>
                    <input
                      type="text"
                      value={configForm.suratIzinLayout?.ketentuanPoin3 || 'Wajib kembali tepat waktu. Keterlambatan tanpa keterangan akan dikenakan takzir edukatif.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratIzinLayout: { ...prev.suratIzinLayout, ketentuanPoin3: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 4. Tanda Tangan & Pengesahan */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>D. Pejabat Pengesah & Tanda Tangan</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Kota Penerbitan Surat</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.kotaTerbit || 'Karawang'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, kotaTerbit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Jabatan Penandatangan</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.jabatanPenandatangan || 'Ketua Dewan Keamanan'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, jabatanPenandatangan: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Nama Tanda Tangan (Singkat)</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.namaPenandatangan || 'Abdul Rohman'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, namaPenandatangan: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Nama Terang & Gelar Lengkap</label>
                      <input
                        type="text"
                        value={configForm.suratIzinLayout?.gelarPenandatangan || 'Ustadz Abdul Rohman, S.Pd.I'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, gelarPenandatangan: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer font-mono">
                      <input
                        type="checkbox"
                        checked={configForm.suratIzinLayout?.tampilkanStempelSah !== false}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratIzinLayout: { ...prev.suratIzinLayout, tampilkanStempelSah: e.target.checked }
                        }))}
                        className="rounded border-slate-700 accent-amber-400 cursor-pointer"
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
                        className="rounded border-slate-700 accent-amber-400 cursor-pointer"
                      />
                      <span>Tampilkan QR Code Verifikasi</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Real-time Live Letter Preview (Right Column 5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    Live Preview Dokumen Cetak
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Format A4 Resmi</span>
                </div>

                <div className="bg-white border-2 border-slate-700/80 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-2xl text-[10px] leading-relaxed font-sans overflow-hidden">
                  
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
                      <p className="font-serif italic text-blue-900 font-bold py-1">Kang Miftah</p>
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

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Sinkronisasi Otomatis
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Format layout ini akan langsung diterapkan saat pengurus maupun admin menekan tombol "Cetak Surat Izin" di dashboard.
                  </p>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
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
          <form onSubmit={handleSaveConfig} className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-6 hover-rainbow-edge">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-400/10 text-amber-300 border border-amber-400/30 glow-gold">
                    SANCTION DOCUMENT ENGINE
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">· Official Violation & Educational Sanction Customizer</span>
                </div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Editor Layout & Format Dokumen Surat Pelanggaran & Sanksi Edukatif
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
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
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-mono font-bold cursor-pointer transition-all"
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
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>A. Judul Surat & Format Penomoran</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Judul Dokumen Surat</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.judulSurat || 'SURAT PELANGGARAN DAN SANKSI EDUKATIF'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, judulSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Format Nomor Surat</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.formatNomorSurat || 'SNK/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, formatNomorSurat: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Kop Surat & Logo Pondok */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>B. Kop Surat & Identitas Pondok</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Teks Bismillah (Arab / Kaligrafi)</label>
                    <input
                      type="text"
                      value={configForm.suratSanksiLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, teksBismillah: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Nama Lembaga Pondok</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.kopNamaInstansi || configForm.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, kopNamaInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Sub-Bagian / Divisi</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.kopSubInstansi || 'DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, kopSubInstansi: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Alamat & Kontak di Kop</label>
                    <input
                      type="text"
                      value={configForm.suratSanksiLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, kopAlamatKontak: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 3. Isi Redaksi & Format Kalimat Surat */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>C. Isi Redaksi & Kalimat Surat</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Kalimat Pembuka Sidang Qanun</label>
                    <textarea
                      rows={2}
                      value={configForm.suratSanksiLayout?.kalimatPembuka || 'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri Pondok Pesantren Salaf Al-Maliki, dengan ini diterbitkan Surat Pelanggaran dan Penetapan Sanksi Edukatif kepada santri:'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, kalimatPembuka: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Kalimat Pengantar Hukuman / Takzir Edukatif</label>
                    <textarea
                      rows={2}
                      value={configForm.suratSanksiLayout?.formatKalimatHukuman || 'Santri yang bersangkutan diwajibkan menyelesaikan takzir edukatif dan pembinaan ibadah/keilmuan sebagai berikut:'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, formatKalimatHukuman: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Pesan Edukasi & Prinsip Pembinaan (Tanpa Kekerasan)</label>
                    <textarea
                      rows={2}
                      value={configForm.suratSanksiLayout?.pesanEdukasi || 'Sanksi ini bersifat edukatif dan pembinaan ruhiyah semata tanpa kekerasan fisik. Santri wajib menyelesaikan dan menyetorkan tugas pembinaan sebelum batas waktu yang telah ditentukan.'}
                      onChange={(e) => setConfigForm(prev => ({
                        ...prev,
                        suratSanksiLayout: { ...prev.suratSanksiLayout, pesanEdukasi: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 4. Kolom Identitas yang Ditampilkan */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>D. Kolom Identitas Santri yang Ditampilkan</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
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

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
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

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
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

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
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

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
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

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
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
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>E. Kolom Tanda Tangan & Pejabat Pengesah</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Jumlah Kolom Tanda Tangan</label>
                      <select
                        value={configForm.suratSanksiLayout?.jumlahTandaTangan || 3}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, jumlahTandaTangan: Number(e.target.value) as any }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value={2}>2 Kolom (Dewan Keamanan & Ketua Pondok)</option>
                        <option value={3}>3 Kolom (Santri, Dewan Keamanan & Ketua Pondok)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Kota Terbit</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.kotaTerbit || 'Karawang'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, kotaTerbit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Pejabat 2: Dewan Keamanan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Jabatan Pejabat Keamanan</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.jabatanPihak2 || 'Petugas / Dewan Keamanan'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, jabatanPihak2: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Nama & Gelar Pejabat Keamanan</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.namaPihak2 || 'Ustadz Abdul Rohman, S.Pd.I'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, namaPihak2: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Pejabat 3: Ketua Pondok */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Jabatan Pimpinan Pondok</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.jabatanPihak3 || 'Ketua Pondok Pesantren'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, jabatanPihak3: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 font-mono">Nama & Gelar Ketua Pondok</label>
                      <input
                        type="text"
                        value={configForm.suratSanksiLayout?.namaPihak3 || 'K.H. Syarifuddin Malik'}
                        onChange={(e) => setConfigForm(prev => ({
                          ...prev,
                          suratSanksiLayout: { ...prev.suratSanksiLayout, namaPihak3: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white pt-2">
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
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
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
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
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

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Penerapan Aman & Akuntabel
                  </p>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Perubahan pengaturan layout ini akan langsung diterapkan pada surat sanksi berikutnya secara otomatis, tanpa mengubah arsip surat lama yang sudah diterbitkan.
                  </p>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
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

      {/* SUB-TAB 5: INPUT & HAPUS SANTRI LANGSUNG DARI OPTION PANEL */}
      {activeSubTab === 'santri_crud' && (
        <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4 hover-rainbow-edge">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Users className="w-4 h-4 text-cyan-400" />
                Manajemen Data Santri Manual (Admin Master Control)
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
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
                  foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
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
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama, NIS, atau kelas..."
              value={searchSantri}
              onChange={(e) => setSearchSantri(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono shadow-inner transition-all hover-rainbow-edge"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
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
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {filteredSantri.map((s) => (
                  <tr key={s.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-xs">{s.nama}</div>
                      <div className="text-[10px] font-mono text-zinc-400">NIS: {s.nis}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-[11px] font-mono">
                      {s.gender === 'putra' ? 'Banin (Putra)' : 'Banat (Putri)'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{s.kelas}</div>
                      <div className="text-[10px] text-zinc-400">{s.kamar}</div>
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
                        className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
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
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
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
        <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4 hover-rainbow-edge">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Manajemen Personil Dewan Keamanan Manual
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
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
                  foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
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
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Cari personil keamanan berdasarkan nama atau NRP..."
              value={searchDewan}
              onChange={(e) => setSearchDewan(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono shadow-inner transition-all hover-rainbow-edge"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Personil Keamanan</th>
                  <th className="px-4 py-3.5">Jabatan</th>
                  <th className="px-4 py-3.5">Divisi Penugasan</th>
                  <th className="px-4 py-3.5">No. WhatsApp</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Kelola Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {filteredDewan.map((d) => (
                  <tr key={d.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-xs">{d.nama}</div>
                      <div className="text-[10px] font-mono text-zinc-400">NRP: {d.nrp}</div>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{d.jabatan}</td>
                    <td className="px-4 py-3 text-blue-400 font-mono">{d.divisi}</td>
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
                        className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
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
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
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
        <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4 hover-rainbow-edge">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Daftar Personil & Kredensial Hak Akses RBAC
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Atur hak akses login, kata sandi, NRP, jabatan, dan kewenangan personil keamanan
              </p>
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormData({
                  username: '',
                  password: '',
                  nama: '',
                  role: 'anggota_keamanan',
                  nrp: `KAMTIB-${Math.floor(100 + Math.random() * 900)}`,
                  jabatan: 'Petugas Keamanan & Disiplin',
                  divisi: 'Patroli & Intelijen',
                  genderAccess: 'all',
                  noWa: '0812',
                  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
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

          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Personil</th>
                  <th className="px-4 py-3.5">Username & Password</th>
                  <th className="px-4 py-3.5">Peran / Role</th>
                  <th className="px-4 py-3.5">Divisi & Otoritas</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {usersList.map((u) => {
                  const isAdmin = u.role === 'admin';
                  return (
                    <tr key={u.id} className="table-row-rainbow transition-all cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-zinc-700" />
                          <div>
                            <p className="font-bold text-white text-xs">{u.nama}</p>
                            <p className="text-[10px] font-mono text-zinc-400">NRP: {u.nrp || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <div>User: <strong className="text-blue-400">{u.username}</strong></div>
                        <div>Pass: <strong className="text-yellow-400">{u.password || '••••••••'}</strong></div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isAdmin ? 'bg-amber-400/20 text-yellow-300 border border-amber-400/40' : 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{u.jabatan}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-[11px]">{u.divisi}</p>
                        <p className="text-[10px] text-zinc-500 font-mono capitalize">Wilayah: {u.genderAccess}</p>
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
                          className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
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
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4 hover-rainbow-edge card-3d-floating">
            <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
              <Download className="w-4 h-4 text-amber-400" />
              Cadangkan Seluruh Basis Data Pusat
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
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

          <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-4 hover-rainbow-edge card-3d-floating">
            <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
              <Upload className="w-4 h-4 text-cyan-400" />
              Pulihkan Basis Data dari Master JSON
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Memulihkan konfigurasi sistem, akun pengguna RBAC, dan rekam jejak santri dari arsip JSON cadangan terenkripsi.
            </p>
            <label className="tactile-interactive w-full py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl hover-rainbow-edge">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Pilih Berkas JSON Cadangan</span>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const content = evt.target?.result as string;
                    if (storageService.importFullBackup(content)) {
                      alert('Alhamdulillah, seluruh data berhasil disinkronkan kembali.');
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
      )}

      {/* Santri Modal (Input/Edit) */}
      {isSantriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Users className="w-4 h-4 text-cyan-400" />
                {editingSantri ? 'Ubah Data Santri' : 'Input Santri Baru'}
              </h3>
              <button 
                onClick={() => setIsSantriModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSantri} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">NIS Santri</label>
                  <input
                    type="text"
                    required
                    value={santriForm.nis}
                    onChange={(e) => setSantriForm({ ...santriForm, nis: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={santriForm.nama}
                    onChange={(e) => setSantriForm({ ...santriForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Jenis Kelamin</label>
                  <select
                    value={santriForm.gender}
                    onChange={(e) => setSantriForm({ ...santriForm, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="putra">Santri Putra (Banin)</option>
                    <option value="putri">Santri Putri (Banat)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Tingkatan / Kelas</label>
                  <input
                    type="text"
                    required
                    value={santriForm.kelas}
                    onChange={(e) => setSantriForm({ ...santriForm, kelas: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Kamar & Asrama</label>
                  <input
                    type="text"
                    required
                    value={santriForm.kamar}
                    onChange={(e) => setSantriForm({ ...santriForm, kamar: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Wali Santri</label>
                  <input
                    type="text"
                    required
                    value={santriForm.namaWali}
                    onChange={(e) => setSantriForm({ ...santriForm, namaWali: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    required
                    value={santriForm.noWaWali}
                    onChange={(e) => setSantriForm({ ...santriForm, noWaWali: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Poin Pelanggaran</label>
                  <input
                    type="number"
                    min="0"
                    value={santriForm.poinPelanggaran}
                    onChange={(e) => setSantriForm({ ...santriForm, poinPelanggaran: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSantriModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dewan Modal (Input/Edit) */}
      {isDewanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                {editingDewan ? 'Ubah Personil Dewan Keamanan' : 'Input Personil Keamanan Baru'}
              </h3>
              <button 
                onClick={() => setIsDewanModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDewan} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">NRP Personil</label>
                  <input
                    type="text"
                    required
                    value={dewanForm.nrp}
                    onChange={(e) => setDewanForm({ ...dewanForm, nrp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={dewanForm.nama}
                    onChange={(e) => setDewanForm({ ...dewanForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={dewanForm.jabatan}
                    onChange={(e) => setDewanForm({ ...dewanForm, jabatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Divisi Penugasan</label>
                  <select
                    value={dewanForm.divisi}
                    onChange={(e) => setDewanForm({ ...dewanForm, divisi: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
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
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">No. WhatsApp Personil</label>
                <input
                  type="text"
                  required
                  value={dewanForm.noWa}
                  onChange={(e) => setDewanForm({ ...dewanForm, noWa: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDewanModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
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
          <div className="w-full max-w-lg metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <KeyRound className="w-4 h-4 text-amber-400" />
                {editingUser ? 'Perbarui Kredensial Personil' : 'Tambah Personil RBAC Baru'}
              </h3>
              <button 
                onClick={() => setIsUserModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Kata Sandi (Password)</label>
                  <input
                    type="text"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Lengkap Personil</label>
                  <input
                    type="text"
                    required
                    value={userFormData.nama}
                    onChange={(e) => setUserFormData({ ...userFormData, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Nomor Registrasi (NRP)</label>
                  <input
                    type="text"
                    required
                    value={userFormData.nrp}
                    onChange={(e) => setUserFormData({ ...userFormData, nrp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Peran Akses (RBAC Role)</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="admin">Admin (Super Administrator)</option>
                    <option value="ketua_keamanan">Ketua Keamanan</option>
                    <option value="anggota_keamanan">Anggota Keamanan</option>
                    <option value="petugas_gerbang">Petugas Pos Gerbang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Otoritas Wilayah</label>
                  <select
                    value={userFormData.genderAccess}
                    onChange={(e) => setUserFormData({ ...userFormData, genderAccess: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="all">Semua (Putra & Putri)</option>
                    <option value="putra">Khusus Santri Putra (Banin)</option>
                    <option value="putri">Khusus Santri Putri (Banat)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
