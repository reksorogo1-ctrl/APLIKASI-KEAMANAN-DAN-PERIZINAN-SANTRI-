import React, { useState, useMemo } from 'react';
import {
  Search,
  GraduationCap,
  ShieldCheck,
  Phone,
  ChevronDown,
  ChevronUp,
  User,
  Plus,
  Upload,
  Download,
  CreditCard,
  Edit3,
  Trash2,
  X,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { Santri, UserAccount, Perizinan, Pelanggaran, Gender } from '../types';
import { createWhatsAppUrl } from '../services/waService';
import { storageService } from '../services/storageService';

interface SantriPerKelasProps {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  currentUser: UserAccount;
  currentGenderScope?: 'all' | 'putra' | 'putri';
  onNavigateToPermitWithSantri: (santri: Santri) => void;
  onNavigateToPelanggaranWithSantri: (santri: Santri) => void;
}

const DEFAULT_CLASSES = [
  '1 Wustho (Tsanawiyah)',
  '2 Wustho (Tsanawiyah)',
  '3 Wustho (Tsanawiyah)',
  '1 Ulya (Aliyah)',
  '2 Ulya (Aliyah)',
  '3 Ulya (Aliyah)',
  "Tahfidz Al-Qur'an",
];

export const SantriPerKelas: React.FC<SantriPerKelasProps> = ({
  santriList,
  perizinanList,
  currentUser,
  currentGenderScope = 'all',
  onNavigateToPermitWithSantri,
  onNavigateToPelanggaranWithSantri,
}) => {
  const systemConfig = storageService.getSystemConfig();
  const [selectedGender, setSelectedGender] = useState<'all' | 'putra' | 'putri'>(
    currentGenderScope
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKelas, setExpandedKelas] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Modal Administrasi Data Santri (Kolaborasi dari Data Santri)
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [cardPreviewSantri, setCardPreviewSantri] = useState<Santri | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Santri>>({
    nis: '',
    nama: '',
    foto: '',
    gender: 'putra',
    kelas: '1 Ulya (Aliyah)',
    kamar: "K-01 (Imam Nafi')",
    asrama: 'Asrama Putra Sunan Giri',
    alamat: '',
    namaWali: '',
    noWaWali: '',
    jarakRumahKm: 10,
    status: 'Aktif',
    poinPelanggaran: 0,
  });

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Gabungkan daftar kelas baku + kelas tambahan jika ada pada data santri
  const classesList = useMemo(() => {
    const extra = Array.from(
      new Set(santriList.map((s) => s.kelas).filter((k) => k && !DEFAULT_CLASSES.includes(k)))
    );
    return [...DEFAULT_CLASSES, ...extra];
  }, [santriList]);

  // Filter santri sesuai pencarian, gender, dan status keaktifan
  const filteredSantriAll = useMemo(() => {
    return santriList.filter((s) => {
      if (selectedGender !== 'all' && s.gender !== selectedGender) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.nama.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.kamar.toLowerCase().includes(q) ||
          s.namaWali.toLowerCase().includes(q) ||
          s.kelas.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [santriList, selectedGender, selectedStatus, searchQuery]);

  // Group santri by class (Format Santri Kelas)
  const groupedSantri = useMemo(() => {
    const map: Record<string, Santri[]> = {};
    classesList.forEach((cls) => {
      map[cls] = [];
    });
    filteredSantriAll.forEach((s) => {
      if (!map[s.kelas]) map[s.kelas] = [];
      map[s.kelas].push(s);
    });
    return map;
  }, [classesList, filteredSantriAll]);

  const openAddModal = () => {
    setEditingSantri(null);
    setFormData({
      nis: `20260${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      foto: '',
      gender: selectedGender === 'putri' ? 'putri' : 'putra',
      kelas: '1 Ulya (Aliyah)',
      kamar: selectedGender === 'putri' ? 'K-01 (Sayyidah Khadijah)' : "K-01 (Imam Nafi')",
      asrama:
        selectedGender === 'putri' ? 'Asrama Putri Siti Khadijah' : 'Asrama Putra Sunan Giri',
      alamat: '',
      namaWali: '',
      noWaWali: '0812',
      jarakRumahKm: 15,
      status: 'Aktif',
      poinPelanggaran: 0,
      tglMasuk: new Date().toISOString().split('T')[0],
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (santri: Santri) => {
    setEditingSantri(santri);
    setFormData({ ...santri });
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nis) return;

    const savedSantri: Santri = {
      id: editingSantri ? editingSantri.id : `san_${Date.now()}`,
      nis: formData.nis || '',
      nama: formData.nama || '',
      foto: formData.foto || '',
      gender: (formData.gender as Gender) || 'putra',
      kelas: formData.kelas || '1 Ulya (Aliyah)',
      kamar: formData.kamar || 'K-01',
      asrama: formData.asrama || 'Asrama Utama',
      alamat: formData.alamat || 'Karawang, Jawa Barat',
      namaWali: formData.namaWali || 'Wali Santri',
      noWaWali: formData.noWaWali || '081234567890',
      jarakRumahKm: Number(formData.jarakRumahKm) || 10,
      status: (formData.status as Santri['status']) || 'Aktif',
      poinPelanggaran: Number(formData.poinPelanggaran) || 0,
      tglMasuk: formData.tglMasuk || new Date().toISOString().split('T')[0],
    };

    storageService.saveSantri(savedSantri);
    setIsAddEditOpen(false);
    notify(
      editingSantri
        ? `Data santri "${savedSantri.nama}" berhasil diperbarui.`
        : `Santri baru "${savedSantri.nama}" berhasil ditambahkan.`
    );
  };

  const handleDelete = (id: string) => {
    const target = santriList.find((s) => s.id === id);
    storageService.deleteSantri(id);
    setDeleteConfirmId(null);
    notify(`Data santri "${target?.nama || ''}" telah dihapus.`);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'NIS',
      'Nama',
      'Gender',
      'Kelas',
      'Kamar',
      'Asrama',
      'Alamat',
      'Nama Wali',
      'No WA Wali',
      'Jarak (KM)',
      'Status',
      'Poin Pelanggaran',
    ];
    const rows = filteredSantriAll.map((s) => [
      s.id,
      `"${s.nis}"`,
      `"${s.nama}"`,
      s.gender,
      `"${s.kelas}"`,
      `"${s.kamar}"`,
      `"${s.asrama}"`,
      `"${s.alamat}"`,
      `"${s.namaWali}"`,
      `"${s.noWaWali}"`,
      s.jarakRumahKm,
      s.status,
      s.poinPelanggaran,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `data_santri_kelas_almaliki_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Berhasil mengekspor ${filteredSantriAll.length} data santri ke CSV.`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 5) {
          const newSantri: Santri = {
            id: `san_imp_${Date.now()}_${i}`,
            nis: parts[1] || `2026${Math.floor(1000 + Math.random() * 9000)}`,
            nama: parts[2] || 'Santri Baru',
            foto: '',
            gender: (parts[3]?.toLowerCase() === 'putri' ? 'putri' : 'putra') as Gender,
            kelas: parts[4] || '1 Wustho (Tsanawiyah)',
            kamar: parts[5] || 'K-01',
            asrama: parts[6] || 'Asrama Santri',
            alamat: parts[7] || 'Jawa Barat',
            namaWali: parts[8] || 'Wali Santri',
            noWaWali: parts[9] || '081234567890',
            jarakRumahKm: parseInt(parts[10]) || 20,
            status: 'Aktif',
            poinPelanggaran: 0,
            tglMasuk: new Date().toISOString().split('T')[0],
          };
          storageService.saveSantri(newSantri);
          count++;
        }
      }
      notify(`Berhasil mengimpor ${count} data santri ke dalam sistem.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Header Petugas & Sinkronisasi + Aksi Data Santri */}
      <div className="p-5 rounded-3xl metallic-glass-card shadow-2xl relative overflow-hidden hover-rainbow-edge">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-600" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500 via-amber-400 to-emerald-600 opacity-60 blur-xs" />
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.nama}
                  className="relative w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
                />
              ) : (
                <div className="relative w-16 h-16 rounded-2xl border-2 border-amber-400 bg-[#041d13] shadow-xl flex items-center justify-center text-amber-400">
                  <User className="w-8 h-8" />
                </div>
              )}
              <span className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-emerald-600 text-white shadow-md border-2 border-slate-950">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  DATA SANTRI &amp; KELAS TERPADU
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/35">
                  TOTAL: {santriList.length} SANTRI ({filteredSantriAll.length} DITAMPILKAN)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase font-sans">
                {currentUser.nama} · {currentUser.jabatan}
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-emerald-200/80 font-mono flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  {currentUser.noWa}
                </span>
                <span>·</span>
                <span>
                  Wilayah:{' '}
                  <strong className="text-white capitalize">
                    {currentUser.genderAccess === 'all' ? 'Banin & Banat' : currentUser.genderAccess}
                  </strong>
                </span>
                <span>·</span>
                <span className="text-emerald-300">Tersinkron Data Sekretaris &amp; Pusat</span>
              </div>
            </div>
          </div>

          {/* Tombol Kolaborasi Data Santri: Impor, Ekspor & Tambah */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold text-slate-200 bg-[#041d13]/90 hover:bg-[#072c1e] border border-emerald-800/80 rounded-xl transition-all cursor-pointer shadow-md">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Impor CSV</span>
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>

            <button
              onClick={handleExportCSV}
              className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold text-slate-200 bg-[#041d13]/90 hover:bg-[#072c1e] border border-emerald-800/80 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={openAddModal}
              className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-xl cursor-pointer border border-amber-300/60"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Tambah Santri</span>
            </button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-[#d4af37]/60 text-emerald-100 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#f3d266]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Toolbar: Search, Gender Filter, Status Filter & Toggle Semua Kelas */}
      <div className="p-4 metallic-glass-card border border-emerald-800/80 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xl hover-rainbow-edge">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-emerald-200/75" />
            <input
              type="text"
              placeholder="Cari nama santri, NIS, kamar, wali, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-400 font-mono transition-all"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-400 font-mono"
          >
            <option value="all">Semua Status Santri</option>
            <option value="Aktif">Aktif</option>
            <option value="Sakit">Sakit</option>
            <option value="Cuti">Cuti</option>
            <option value="Diskors">Diskors</option>
            <option value="Alumni">Alumni</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#041d13]/90 rounded-xl border border-emerald-800">
            <button
              onClick={() => setSelectedGender('all')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                selectedGender === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-200/75 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedGender('putra')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                selectedGender === 'putra'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Putra (Banin)
            </button>
            <button
              onClick={() => setSelectedGender('putri')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                selectedGender === 'putri'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              Putri (Banat)
            </button>
          </div>

          <button
            onClick={() => setExpandedKelas(expandedKelas === 'none' ? null : 'none')}
            className="px-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#03160f] border border-emerald-800 text-emerald-200 hover:text-white cursor-pointer"
          >
            {expandedKelas === 'none' ? 'Buka Semua Kelas' : 'Tutup Semua'}
          </button>
        </div>
      </div>

      {/* Classes Accordion / Cards List (Format Santri Kelas + Fitur Lengkap Data Santri) */}
      <div className="space-y-4">
        {classesList.map((kelasName) => {
          const list = groupedSantri[kelasName] || [];
          const isExpanded = expandedKelas === null || expandedKelas === kelasName;
          const totalOut = list.filter((s) =>
            perizinanList.some((p) => p.santriId === s.id && p.status === 'Sedang Keluar')
          ).length;
          const totalLate = list.filter((s) =>
            perizinanList.some((p) => p.santriId === s.id && p.status === 'Terlambat')
          ).length;

          return (
            <div
              key={kelasName}
              className="rounded-3xl metallic-glass-card border border-emerald-800/80 shadow-2xl overflow-hidden transition-all hover-rainbow-edge"
            >
              {/* Class Header Strip */}
              <div
                onClick={() => setExpandedKelas(expandedKelas === kelasName ? 'none' : kelasName)}
                className="px-6 py-4 bg-gradient-to-r from-[#02100a] via-[#041d13] to-[#02100a] cursor-pointer flex items-center justify-between gap-4 border-b border-emerald-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/40 shadow-inner">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans tracking-wide">
                      <span>{kelasName}</span>
                      <span className="text-xs font-mono text-amber-300 font-semibold">
                        ({list.length} Santri)
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-200/75 font-mono">
                      Data induk santri, perizinan, kedisiplinan &amp; kartu tanda santri
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {totalOut > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-gold">
                      {totalOut} Izin di Luar
                    </span>
                  )}
                  {totalLate > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-red-600/20 text-red-400 border border-red-500/40 animate-pulse glow-red">
                      {totalLate} Terlambat
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-emerald-200/75" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-emerald-200/75" />
                  )}
                </div>
              </div>

              {/* Class Body: Santri Grid */}
              {isExpanded && (
                <div className="p-5">
                  {list.length === 0 ? (
                    <p className="text-xs text-emerald-200/75 text-center py-6 font-mono">
                      Tidak ada santri di kelas ini yang sesuai kriteria filter.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map((santri) => {
                        const activePermit = perizinanList.find(
                          (p) =>
                            p.santriId === santri.id &&
                            (p.status === 'Sedang Keluar' ||
                              p.status === 'Disetujui' ||
                              p.status === 'Terlambat')
                        );

                        return (
                          <div
                            key={santri.id}
                            className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 hover:border-[#d4af37]/50 transition-all flex flex-col justify-between space-y-3 shadow-md hover-rainbow-edge"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                {santri.foto ? (
                                  <img
                                    src={santri.foto}
                                    alt={santri.nama}
                                    className="w-12 h-12 rounded-xl object-cover border border-amber-400/40 shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-[#072c1e] border border-amber-400/40 shrink-0 shadow-sm flex items-center justify-center text-amber-400">
                                    <User className="w-6 h-6" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                                    {santri.nama}
                                  </h4>
                                  <p className="text-[10px] font-mono text-emerald-200/75">
                                    NIS: {santri.nis} ·{' '}
                                    <span className="text-emerald-100/90">
                                      {santri.gender === 'putra' ? 'Banin' : 'Banat'}
                                    </span>
                                  </p>
                                  <p className="text-[10px] text-emerald-300/70 truncate mt-0.5">
                                    {santri.kamar} · {santri.asrama}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                  santri.status === 'Aktif'
                                    ? 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40'
                                    : santri.status === 'Diskors'
                                    ? 'text-red-300 bg-red-950/70 border-red-500/40'
                                    : 'text-amber-300 bg-amber-950/60 border-amber-500/40'
                                }`}
                              >
                                {santri.status}
                              </span>
                            </div>

                            {/* Status, Domisili & Points Strip */}
                            <div className="space-y-1.5 pt-2 border-t border-emerald-800/80 text-[11px] font-mono">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-emerald-300/60 text-[10px]">Poin Disiplin: </span>
                                  <span
                                    className={`font-bold ${
                                      santri.poinPelanggaran > 15
                                        ? 'text-red-400'
                                        : santri.poinPelanggaran > 0
                                        ? 'text-yellow-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {santri.poinPelanggaran} Poin
                                  </span>
                                </div>

                                {activePermit ? (
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    {activePermit.status}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-300/60">Di Asrama</span>
                                )}
                              </div>
                              <div className="text-[10px] text-emerald-200/70 truncate font-sans">
                                Domisili: {santri.alamat} ({santri.jarakRumahKm} km)
                              </div>
                            </div>

                            {/* Guardian & Contact */}
                            <div className="text-[10px] text-emerald-200/75 flex items-center justify-between gap-2">
                              <span className="truncate">Wali: {santri.namaWali}</span>
                              <button
                                onClick={() => {
                                  const text = `Assalamu'alaikum Wr. Wb. Bpk/Ibu ${santri.namaWali}, terkait ananda ${santri.nama} di Pondok Pesantren Salaf Al-Maliki...`;
                                  window.open(createWhatsAppUrl(santri.noWaWali, text), '_blank');
                                }}
                                className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold cursor-pointer shrink-0"
                              >
                                {santri.noWaWali}
                              </button>
                            </div>

                            {/* Action Buttons: Kolaborasi Santri Kelas + Data Santri */}
                            <div className="pt-2 border-t border-emerald-800/80 space-y-1.5">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => onNavigateToPermitWithSantri(santri)}
                                  className="py-1.5 px-2 text-[10px] font-semibold text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-colors cursor-pointer text-center truncate"
                                >
                                  Buat Izin
                                </button>
                                <button
                                  onClick={() => onNavigateToPelanggaranWithSantri(santri)}
                                  className="py-1.5 px-2 text-[10px] font-semibold text-red-300 bg-red-950/70 hover:bg-red-900 border border-red-800 rounded-lg transition-colors cursor-pointer text-center truncate"
                                >
                                  Catat Takzir
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                <button
                                  onClick={() => setCardPreviewSantri(santri)}
                                  className="py-1 px-2 text-[10px] font-semibold text-emerald-200 bg-[#03160f] hover:bg-[#072c1e] border border-emerald-800 rounded-lg cursor-pointer inline-flex items-center justify-center gap-1"
                                  title="Cetak Kartu Tanda Santri (KTS)"
                                >
                                  <CreditCard className="w-3 h-3 text-amber-300" />
                                  <span>KTS</span>
                                </button>
                                <button
                                  onClick={() => openEditModal(santri)}
                                  className="py-1 px-2 text-[10px] font-semibold text-emerald-200 bg-[#03160f] hover:bg-[#072c1e] border border-emerald-800 rounded-lg cursor-pointer inline-flex items-center justify-center gap-1"
                                  title="Edit Data Santri"
                                >
                                  <Edit3 className="w-3 h-3 text-emerald-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(santri.id)}
                                  className="py-1 px-2 text-[10px] font-semibold text-rose-300 bg-[#03160f] hover:bg-rose-950/60 border border-rose-900/60 rounded-lg cursor-pointer inline-flex items-center justify-center gap-1"
                                  title="Hapus Data Santri"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Santri */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                {editingSantri ? 'Perbarui Data Santri' : 'Tambah Santri Baru'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Nomor Induk Santri (NIS)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Nama Lengkap Santri
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Muhammad Al-Fatih"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="putra">Santri Putra (Banin)</option>
                    <option value="putri">Santri Putri (Banat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Tingkatan / Kelas
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Kamar Asrama</label>
                  <input
                    type="text"
                    required
                    value={formData.kamar}
                    onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                    placeholder="Contoh: K-01 (Imam Nafi')"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Nama Asrama / Blok
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.asrama}
                    onChange={(e) => setFormData({ ...formData, asrama: e.target.value })}
                    placeholder="Contoh: Asrama Putra Sunan Giri"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Nama Wali Santri
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaWali}
                    onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                    placeholder="Contoh: H. Hendra Gunawan"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Nomor WhatsApp Wali
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noWaWali}
                    onChange={(e) => setFormData({ ...formData, noWaWali: e.target.value })}
                    placeholder="Contoh: 081288997766"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Jarak Rumah ke Pondok (KM)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.jarakRumahKm}
                    onChange={(e) =>
                      setFormData({ ...formData, jarakRumahKm: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Diskors">Diskors</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">
                  Alamat Asal Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Dusun, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Data Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white">Konfirmasi Hapus Santri</h4>
            <p className="text-xs text-neutral-300">
              Apakah Anda yakin ingin menghapus data santri ini? Seluruh riwayat perizinan dan kedisiplinan yang terkait akan terpengaruh.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Santri ID Card Modal (KTS - Kartu Tanda Santri) */}
      {cardPreviewSantri && (
        <div className="surat-print-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="surat-print-modal w-full max-w-md bg-neutral-900 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl">
            <div className="no-print flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950">
              <span className="text-xs font-bold text-amber-300">
                Pratinjau Kartu Tanda Santri (KTS)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 rounded-lg cursor-pointer"
                  title="Cetak Kartu"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCardPreviewSantri(null)}
                  className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="surat-print-sheet p-6">
              <div className="w-full rounded-2xl bg-gradient-to-br from-emerald-950 via-neutral-900 to-emerald-900 border-2 border-amber-400/80 p-5 shadow-2xl relative overflow-hidden text-neutral-100">
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
                  <img
                    src={
                      systemConfig.logoUrl ||
                      '/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg'
                    }
                    alt=""
                    className="w-48 h-48 object-contain"
                  />
                </div>

                <div className="flex items-center gap-3 border-b border-amber-500/40 pb-3 mb-4">
                  <img
                    src={
                      systemConfig.logoUrl ||
                      '/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg'
                    }
                    alt="Logo"
                    className="w-10 h-10 rounded-full border border-amber-400 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-tight">
                      KARTU TANDA SANTRI (KTS)
                    </h4>
                    <p className="text-[10px] text-emerald-300">
                      {systemConfig.namaPondok || 'Pondok Pesantren Salaf Al-Maliki'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  {cardPreviewSantri.foto ? (
                    <img
                      src={cardPreviewSantri.foto}
                      alt={cardPreviewSantri.nama}
                      className="w-20 h-24 object-cover rounded-xl border-2 border-amber-400/80 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-xl border-2 border-amber-400/80 bg-[#041d13] shadow-md shrink-0 flex items-center justify-center text-amber-400">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                  <div className="space-y-1 text-xs">
                    <p className="text-sm font-bold text-white leading-tight">
                      {cardPreviewSantri.nama}
                    </p>
                    <p className="text-[11px] font-mono text-amber-300">
                      NIS: {cardPreviewSantri.nis}
                    </p>
                    <p className="text-[10px] text-neutral-300">
                      Kelas: {cardPreviewSantri.kelas}
                    </p>
                    <p className="text-[10px] text-neutral-300">
                      Kamar: {cardPreviewSantri.kamar}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate max-w-[170px]">
                      Asal: {cardPreviewSantri.alamat}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-neutral-400 font-semibold tracking-widest">
                    |||| | ||||| || |||||| ||||
                  </span>
                  <span className="text-emerald-400 font-bold uppercase">Santri Resmi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
