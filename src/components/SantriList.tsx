import React, { useState, useMemo } from 'react';
import { 
  Users, 
  User,
  Search, 
  Plus, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  CreditCard, 
  X, 
  Check, 
  Filter, 
  UserCheck, 
  MapPin, 
  Phone, 
  Home, 
  GraduationCap,
  Sparkles,
  Printer
} from 'lucide-react';
import { Santri, Gender } from '../types';
import { storageService } from '../services/storageService';

interface SantriListProps {
  santriList: Santri[];
  currentGenderScope: 'all' | 'putra' | 'putri';
}

export const SantriList: React.FC<SantriListProps> = ({ santriList, currentGenderScope }) => {
  const systemConfig = storageService.getSystemConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'putra' | 'putri'>(currentGenderScope);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [cardPreviewSantri, setCardPreviewSantri] = useState<Santri | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Santri>>({
    nis: '',
    nama: '',
    foto: '',
    gender: 'putra',
    kelas: '1 Ulya (Aliyah)',
    kamar: 'K-01 (Imam Nafi\')',
    asrama: 'Asrama Putra Sunan Giri',
    alamat: '',
    namaWali: '',
    noWaWali: '',
    jarakRumahKm: 10,
    status: 'Aktif',
    poinPelanggaran: 0,
  });

  // Filtered List
  const filteredList = useMemo(() => {
    return santriList.filter((s) => {
      // Gender filter
      if (selectedGender !== 'all' && s.gender !== selectedGender) return false;
      // Status filter
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      // Kelas filter
      if (selectedKelas !== 'all' && s.kelas !== selectedKelas) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = s.nama.toLowerCase().includes(query);
        const matchNis = s.nis.toLowerCase().includes(query);
        const matchWali = s.namaWali.toLowerCase().includes(query);
        const matchKamar = s.kamar.toLowerCase().includes(query);
        if (!matchName && !matchNis && !matchWali && !matchKamar) return false;
      }
      return true;
    });
  }, [santriList, selectedGender, selectedStatus, selectedKelas, searchQuery]);

  const openAddModal = () => {
    setEditingSantri(null);
    setFormData({
      nis: `20240${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      foto: '',
      gender: selectedGender === 'putri' ? 'putri' : 'putra',
      kelas: '1 Ulya (Aliyah)',
      kamar: selectedGender === 'putri' ? 'K-01 (Sayyidah Khadijah)' : 'K-01 (Imam Nafi\')',
      asrama: selectedGender === 'putri' ? 'Asrama Putri Siti Khadijah' : 'Asrama Putra Sunan Giri',
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
      gender: formData.gender as Gender,
      kelas: formData.kelas || '1 Ulya',
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
  };

  const handleDelete = (id: string) => {
    storageService.deleteSantri(id);
    setDeleteConfirmId(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'NIS', 'Nama', 'Gender', 'Kelas', 'Kamar', 'Asrama', 'Alamat', 'Nama Wali', 'No WA Wali', 'Jarak (KM)', 'Status', 'Poin Pelanggaran'];
    const rows = filteredList.map(s => [
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
      s.poinPelanggaran
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_santri_almaliki_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return;

      // parse header and lines
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 5) {
          const newSantri: Santri = {
            id: `san_imp_${Date.now()}_${i}`,
            nis: parts[1] || `2024${Math.floor(1000 + Math.random() * 9000)}`,
            nama: parts[2] || 'Santri Baru',
            foto: '',
            gender: (parts[3]?.toLowerCase() === 'putri' ? 'putri' : 'putra') as Gender,
            kelas: parts[4] || '1 Wustho',
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
      alert(`Berhasil mengimpor ${count} data santri ke dalam sistem.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Toolbar - 3D Styled */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 metallic-glass-card p-6 rounded-3xl border border-slate-800/80 shadow-2xl hover-rainbow-edge">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 glow-cyan uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              REGISTRY DATABASE
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              TOTAL: {santriList.length} SANTRI
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase font-sans">
            Administrasi Data Santri
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Kelola data induk santri putra & putri, biodata wali, status santri, dan kartu identitas digital
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="tactile-interactive inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-md hover-rainbow-edge">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Impor CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            onClick={handleExportCSV}
            className="tactile-interactive inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-md hover-rainbow-edge"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-xl shadow-amber-500/25 cursor-pointer border border-amber-300/60"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Santri</span>
          </button>
        </div>
      </div>

      {/* Filter Bar - 3D Metallic Glass */}
      <div className="p-4 metallic-glass-card border border-slate-800/80 rounded-2xl space-y-3 shadow-xl hover-rainbow-edge">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIS, nama, wali, kamar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
            />
          </div>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value as any)}
            className="px-3.5 py-2 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 font-mono transition-all"
          >
            <option value="all">Semua Kelompok Santri</option>
            <option value="putra">Santri Putra (Banin)</option>
            <option value="putri">Santri Putri (Banat)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 font-mono transition-all"
          >
            <option value="all">Semua Status Santri</option>
            <option value="Aktif">Aktif</option>
            <option value="Cuti">Cuti</option>
            <option value="Diskors">Diskors</option>
            <option value="Alumni">Alumni</option>
          </select>

          {/* Kelas Filter */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 font-mono transition-all"
          >
            <option value="all">Semua Tingkatan Kelas</option>
            <option value="1 Wustho (Tsanawiyah)">1 Wustho (Tsanawiyah)</option>
            <option value="2 Wustho (Tsanawiyah)">2 Wustho (Tsanawiyah)</option>
            <option value="3 Wustho (Tsanawiyah)">3 Wustho (Tsanawiyah)</option>
            <option value="1 Ulya (Aliyah)">1 Ulya (Aliyah)</option>
            <option value="2 Ulya (Aliyah)">2 Ulya (Aliyah)</option>
            <option value="3 Ulya (Aliyah)">3 Ulya (Aliyah)</option>
            <option value="Tahfidz Al-Qur'an">Tahfidz Al-Qur'an</option>
          </select>

        </div>
        
        {/* Results summary count */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
          <span>Menampilkan <strong className="text-amber-300 tabular-nums">{filteredList.length}</strong> santri terdaftar</span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      </div>

      {/* Santri Table - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover-rainbow-edge">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Santri</th>
                <th className="px-4 py-3.5">Kelas & Kamar</th>
                <th className="px-4 py-3.5">Wali & WhatsApp</th>
                <th className="px-4 py-3.5">Domisili / Jarak</th>
                <th className="px-4 py-3.5">Poin Disiplin</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Tidak ditemukan santri yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((santri) => (
                  <tr key={santri.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {santri.foto ? (
                          <img
                            src={santri.foto}
                            alt={santri.nama}
                            className="w-10 h-10 rounded-xl object-cover border border-amber-400/40 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-amber-400/40 shrink-0 shadow-sm flex items-center justify-center text-amber-400">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-xs font-sans tracking-wide">{santri.nama}</div>
                          <div className="text-[11px] text-slate-400">
                            NIS: <span className="text-cyan-300">{santri.nis}</span> · <span className="capitalize">{santri.gender === 'putra' ? 'Banin' : 'Banat'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-200 font-medium font-sans">{santri.kelas}</div>
                      <div className="text-[11px] text-amber-300">{santri.kamar}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{santri.asrama}</div>
                    </td>
                    <td className="px-4 py-4 font-sans">
                      <div className="text-slate-200">{santri.namaWali}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">{santri.noWaWali}</div>
                    </td>
                    <td className="px-4 py-4 font-sans">
                      <div className="text-slate-300 truncate max-w-[150px]">{santri.alamat}</div>
                      <div className="text-[11px] text-amber-300/80 font-mono">{santri.jarakRumahKm} km dari pondok</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-mono tabular-nums font-bold px-2 py-0.5 rounded ${
                        santri.poinPelanggaran > 20 
                          ? 'text-red-400 bg-red-950/60 border border-red-500/40 glow-red' 
                          : santri.poinPelanggaran > 0 
                          ? 'text-amber-400 bg-amber-950/60 border border-amber-500/40 glow-gold' 
                          : 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
                      }`}>
                        {santri.poinPelanggaran} Poin
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                        santri.status === 'Aktif'
                          ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40'
                          : santri.status === 'Diskors'
                          ? 'text-red-300 bg-red-950/60 border-red-500/40 glow-red'
                          : 'text-slate-300 bg-slate-900 border-slate-700'
                      }`}>
                        {santri.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => setCardPreviewSantri(santri)}
                        className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-cyan-500/40"
                        title="Cetak Kartu Tanda Santri (KTS)"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(santri)}
                        className="p-2 text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/40"
                        title="Ubah Data"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(santri.id)}
                        className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/40"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Santri */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                {editingSantri ? 'Perbarui Data Santri' : 'Tambah Santri Baru'}
              </h3>
              <button onClick={() => setIsAddEditOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Nomor Induk Santri (NIS)</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Nama Lengkap Santri</label>
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
                  <label className="block text-neutral-400 font-medium mb-1">Tingkatan / Kelas</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="1 Wustho (Tsanawiyah)">1 Wustho (Tsanawiyah)</option>
                    <option value="2 Wustho (Tsanawiyah)">2 Wustho (Tsanawiyah)</option>
                    <option value="3 Wustho (Tsanawiyah)">3 Wustho (Tsanawiyah)</option>
                    <option value="1 Ulya (Aliyah)">1 Ulya (Aliyah)</option>
                    <option value="2 Ulya (Aliyah)">2 Ulya (Aliyah)</option>
                    <option value="3 Ulya (Aliyah)">3 Ulya (Aliyah)</option>
                    <option value="Tahfidz Al-Qur'an">Tahfidz Al-Qur'an</option>
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
                  <label className="block text-neutral-400 font-medium mb-1">Nama Asrama / Blok</label>
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
                  <label className="block text-neutral-400 font-medium mb-1">Nama Wali Santri</label>
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
                  <label className="block text-neutral-400 font-medium mb-1">Nomor WhatsApp Wali</label>
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
                  <label className="block text-neutral-400 font-medium mb-1">Jarak Rumah ke Pondok (KM)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.jarakRumahKm}
                    onChange={(e) => setFormData({ ...formData, jarakRumahKm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Status Keaktifan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Diskors">Diskors</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Alamat Asal Lengkap</label>
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
              <span className="text-xs font-bold text-amber-300">Pratinjau Kartu Tanda Santri (KTS)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 rounded-lg cursor-pointer"
                  title="Cetak Kartu"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button onClick={() => setCardPreviewSantri(null)} className="p-1 text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual Student ID Card */}
            <div className="surat-print-sheet p-6">
              <div className="w-full rounded-2xl bg-gradient-to-br from-emerald-950 via-neutral-900 to-emerald-900 border-2 border-amber-400/80 p-5 shadow-2xl relative overflow-hidden text-neutral-100">
                {/* Islamic watermark crest */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
                  <img 
                    src={systemConfig.logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"} 
                    alt="" 
                    className="w-48 h-48 object-contain" 
                  />
                </div>

                {/* Card Header */}
                <div className="flex items-center gap-3 border-b border-amber-500/40 pb-3 mb-4">
                  <img
                    src={systemConfig.logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"}
                    alt="Logo"
                    className="w-10 h-10 rounded-full border border-amber-400 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-tight">
                      KARTU TANDA SANTRI (KTS)
                    </h4>
                    <p className="text-[10px] text-emerald-300">
                      {systemConfig.namaPondok || "Pondok Pesantren Salaf Al-Maliki"}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex gap-4 items-center">
                  {cardPreviewSantri.foto ? (
                    <img
                      src={cardPreviewSantri.foto}
                      alt={cardPreviewSantri.nama}
                      className="w-20 h-24 object-cover rounded-xl border-2 border-amber-400/80 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-xl border-2 border-amber-400/80 bg-slate-900 shadow-md shrink-0 flex items-center justify-center text-amber-400">
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

                {/* Card Barcode simulation */}
                <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-neutral-400 font-semibold tracking-widest">
                    |||| | ||||| || |||||| ||||
                  </span>
                  <span className="text-emerald-400 font-bold uppercase">
                    Santri Resmi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
