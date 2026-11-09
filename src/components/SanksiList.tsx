import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  CheckCircle2, 
  Share2, 
  X, 
  Sparkles,
  BookOpen,
  Award,
  FileText,
  Printer,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';
import { Sanksi, Pelanggaran, StatusSanksi, Santri, UserAccount } from '../types';
import { storageService } from '../services/storageService';
import { createWhatsAppUrl } from '../services/waService';
import { SuratSanksiModal } from './SuratSanksiModal';

interface SanksiListProps {
  sanksiList: Sanksi[];
  pelanggaranList: Pelanggaran[];
  santriList: Santri[];
  currentUser: UserAccount;
  preSelectedPelanggaran?: Pelanggaran | null;
  onClearPreSelectedPelanggaran?: () => void;
}

export const SanksiList: React.FC<SanksiListProps> = ({
  sanksiList,
  pelanggaranList,
  santriList,
  currentUser,
  preSelectedPelanggaran,
  onClearPreSelectedPelanggaran,
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(!!preSelectedPelanggaran);
  const [editingSanksi, setEditingSanksi] = useState<Sanksi | null>(null);
  const [selectedSanksiForSurat, setSelectedSanksiForSurat] = useState<Sanksi | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [selectedPelanggaranId, setSelectedPelanggaranId] = useState<string>(
    preSelectedPelanggaran ? preSelectedPelanggaran.id : ''
  );
  const [formData, setFormData] = useState({
    bentukSanksi: 'Menghafal Nadzom Al-Imrithi bait 1-30 bin-nadhar di hadapan Ustadz Pembimbing',
    tanggalPenetapan: todayStr,
    tanggalTargetSelesai: nextWeekStr,
    batasMaksimal: `${nextWeekStr} 17:00 WIB`,
    petugasPenetap: currentUser.nama,
    ustadzPembina: 'Ustadz Ridwan Malik',
    status: 'Belum Dikerjakan' as StatusSanksi,
    catatanPembinaan: 'Santri berkomitmen menyelesaikan tugas pembinaan secara istiqomah.',
  });

  const educationalSanctionPresets = [
    'Menghafal Nadzom Al-Imrithi bait 1-30 di hadapan Ustadz Pembimbing',
    'Menghafal Nadzom Alfiyah Ibnu Malik bait 1-20 dan menyetor hafalan ba\'da Subuh',
    'Khidmah membersihkan serambi dan tempat wudhu Masjid Jami\' selama 3 hari',
    'Membaca Al-Qur\'an Juz 30 (Juz \'Amma) bin-nadhar di serambi masjid',
    'Menulis makna gandul bahasa pegon kitab Ta\'lim Muta\'allim sebanyak 5 lembar',
    'Piket kebersihan lingkungan asrama santri ba\'da Ashar selama 1 pekan',
  ];

  const handleOpenAdd = () => {
    setSelectedPelanggaranId('');
    setFormData({
      bentukSanksi: educationalSanctionPresets[0],
      tanggalPenetapan: todayStr,
      tanggalTargetSelesai: nextWeekStr,
      batasMaksimal: `${nextWeekStr} 17:00 WIB`,
      petugasPenetap: currentUser.nama,
      ustadzPembina: 'Ustadz Ridwan Malik',
      status: 'Belum Dikerjakan',
      catatanPembinaan: '',
    });
    setIsAddModalOpen(true);
  };

  const getHariName = (dateStr: string) => {
    try {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const d = new Date(dateStr);
      return days[d.getDay()] || 'Senin';
    } catch {
      return 'Senin';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const pel = pelanggaranList.find(p => p.id === selectedPelanggaranId) || preSelectedPelanggaran;
    if (!pel) {
      alert('Pilih catatan pelanggaran terkait.');
      return;
    }

    const santriObj = santriList.find(s => s.id === pel.santriId);
    const systemCfg = storageService.getSystemConfig();

    const saved: Sanksi = {
      id: editingSanksi ? editingSanksi.id : `san_k_${Date.now()}`,
      kodeSanksi: editingSanksi ? editingSanksi.kodeSanksi : `SNK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customNomorSurat: editingSanksi?.customNomorSurat || `SNK/MALIKI/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${Math.floor(100 + Math.random() * 900)}`,
      pelanggaranId: pel.id,
      santriId: pel.santriId,
      santriNama: pel.santriNama,
      santriNis: pel.santriNis,
      santriGender: pel.santriGender,
      santriKelas: santriObj?.kelas || '1 Ulya (Aliyah)',
      santriKamar: santriObj?.kamar || 'Kamar Asrama',
      jenisPelanggaran: pel.jenisPelanggaran,
      pelanggaranTanggal: pel.tanggal || formData.tanggalPenetapan,
      pelanggaranHari: getHariName(pel.tanggal || formData.tanggalPenetapan),
      kronologi: pel.kronologi || '',
      bentukSanksi: formData.bentukSanksi,
      tanggalPenetapan: formData.tanggalPenetapan,
      petugasPenetap: formData.petugasPenetap,
      petugasPencatat: currentUser.nama,
      tanggalTargetSelesai: formData.tanggalTargetSelesai,
      batasMaksimal: formData.batasMaksimal || `${formData.tanggalTargetSelesai} 17:00 WIB`,
      status: formData.status,
      ustadzPembina: formData.ustadzPembina,
      catatanPembinaan: formData.catatanPembinaan,
      snapshotLayout: systemCfg.suratSanksiLayout, // Freeze layout snapshot for this letter
    };

    storageService.saveSanksi(saved);

    // Link sanksiId back to pelanggaran
    const updatedPel = { ...pel, sanksiId: saved.id };
    storageService.savePelanggaran(updatedPel);

    setIsAddModalOpen(false);
    if (onClearPreSelectedPelanggaran) onClearPreSelectedPelanggaran();

    // Automatically prompt preview modal for the newly generated letter!
    setSelectedSanksiForSurat(saved);
  };

  const handleMarkCompleted = (sanksi: Sanksi) => {
    const updated: Sanksi = {
      ...sanksi,
      status: 'Selesai',
      tanggalAktualSelesai: todayStr,
      catatanPembinaan: `${sanksi.catatanPembinaan ? sanksi.catatanPembinaan + ' · ' : ''}Telah menyelesaikan tugas takzir edukatif dengan baik pada ${todayStr}.`,
    };
    storageService.saveSanksi(updated);
    storageService.addLog(
      'Penyelesaian Takzir',
      `Santri ${sanksi.santriNama} telah menuntaskan sanksi edukatif: ${sanksi.bentukSanksi}`,
      'sanksi'
    );
  };

  const handleSendWA = (sanksi: Sanksi) => {
    const santri = santriList.find(s => s.id === sanksi.santriId);
    const targetWa = santri ? santri.noWaWali : '08123456789';
    const text = `*PONDOK PESANTREN SALAF AL-MALIKI*
*Laporan Pembinaan & Takzir Edukatif Santri*
Nomor: ${sanksi.customNomorSurat || sanksi.kodeSanksi}
───────────────────────────
Assalamu'alaikum Wr. Wb.

Yth. Orang Tua / Wali dari ananda *${sanksi.santriNama}* (${sanksi.santriNis}),
Kelas: ${sanksi.santriKelas || santri?.kelas || '-'}

Menginformasikan tindak lanjut pembinaan santri:
📌 *Pelanggaran*: ${sanksi.jenisPelanggaran}
📖 *Bentuk Sanksi Edukatif*: ${sanksi.bentukSanksi}
⏰ *Batas Maksimal Pengumpulan*: ${sanksi.batasMaksimal || sanksi.tanggalTargetSelesai}
👤 *Ustadz Pembina*: ${sanksi.ustadzPembina}
📌 *Status*: ${sanksi.status}

Sanksi ini berfokus pada hafalan dan khidmah ibadah guna menumbuhkan ketakwaan santri. Mohon doa restu orang tua.

Wassalamu'alaikum Wr. Wb.`;
    window.open(createWhatsAppUrl(targetWa, text), '_blank');
  };

  const filtered = sanksiList.filter(item => {
    if (selectedStatusTab !== 'all' && item.status !== selectedStatusTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.santriNama.toLowerCase().includes(q) ||
        item.santriNis.toLowerCase().includes(q) ||
        item.bentukSanksi.toLowerCase().includes(q) ||
        item.kodeSanksi.toLowerCase().includes(q) ||
        (item.santriKelas && item.santriKelas.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 glow-cyan">
                Takzir Edukatif & Pembinaan Karakter
              </span>
              <span className="text-[10px] font-mono text-slate-500">· Islamic Educational Sanctions & Auto Letter Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <GraduationCap className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              Rekapitulasi Pelanggaran & Sanksi Edukatif Santri
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Penetapan takzir mendidik (hafalan nadzom, khidmah ibadah, tilawah Al-Qur'an), bebas kekerasan dan dilengkapi Surat Pelanggaran Otomatis
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all shadow-xl cursor-pointer self-start sm:self-auto border border-amber-300/60 hover-rainbow-edge"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tetapkan Sanksi Edukatif</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Status - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs shadow-lg font-mono">
        <button
          onClick={() => setSelectedStatusTab('all')}
          className={`tactile-interactive px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedStatusTab === 'all'
              ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Semua Pembinaan ({sanksiList.length})</span>
        </button>
        <button
          onClick={() => setSelectedStatusTab('Belum Dikerjakan')}
          className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Belum Dikerjakan'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 rainbow-active-border glow-red'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          Belum Dikerjakan
        </button>
        <button
          onClick={() => setSelectedStatusTab('Sedang Berjalan')}
          className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Sedang Berjalan'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          Sedang Menjalani
        </button>
        <button
          onClick={() => setSelectedStatusTab('Selesai')}
          className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Selesai'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rainbow-active-border glow-cyan'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          Tuntas / Selesai
        </button>
      </div>

      {/* Search Input - 3D Styled */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
        <input
          type="text"
          placeholder="Cari nama santri, NIS, kelas, kode sanksi, atau bentuk pembinaan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-xs bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono shadow-inner transition-all hover-rainbow-edge"
        />
      </div>

      {/* SANKSI EDUKATIF RECAPITULATION TABLE (EXACT REQUESTED COLUMNS) */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover-rainbow-edge track-scroll-box">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="px-4 py-4 text-center w-12">Nomor</th>
                <th className="px-5 py-4">Nama Santri</th>
                <th className="px-4 py-4">Kelas</th>
                <th className="px-5 py-4">Jenis Pelanggaran</th>
                <th className="px-4 py-4">Tanggal Pelanggaran</th>
                <th className="px-5 py-4">Jenis Sanksi atau Hukuman</th>
                <th className="px-4 py-4">Petugas Pencatat</th>
                <th className="px-4 py-4">Status Pelaksanaan</th>
                <th className="px-5 py-4 text-right">Aksi Detail & Cetak Surat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 font-mono">
                    Tidak ada catatan sanksi pembinaan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const santriObj = santriList.find(s => s.id === item.santriId);
                  const displayKelas = item.santriKelas || santriObj?.kelas || '-';
                  const displayTglPelanggaran = item.pelanggaranTanggal || item.tanggalPenetapan;
                  const displayPetugas = item.petugasPencatat || item.petugasPenetap;

                  return (
                    <tr key={item.id} className="table-row-rainbow transition-all hover:bg-slate-900/60">
                      {/* 1. Nomor */}
                      <td className="px-4 py-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* 2. Nama Santri */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-white font-sans text-sm tracking-wide">
                          {item.santriNama}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          NIS: <span className="text-cyan-300">{item.santriNis}</span>
                        </div>
                        <div className="text-[9px] text-amber-400 font-mono font-bold mt-0.5">
                          {item.customNomorSurat || item.kodeSanksi}
                        </div>
                      </td>

                      {/* 3. Kelas */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded bg-blue-950/70 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
                          {displayKelas}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {item.santriGender === 'putra' ? 'Banin' : 'Banat'}
                        </div>
                      </td>

                      {/* 4. Jenis Pelanggaran */}
                      <td className="px-5 py-4 font-sans">
                        <div className="text-slate-200 max-w-xs font-medium leading-relaxed">
                          {item.jenisPelanggaran}
                        </div>
                        {item.kronologi && (
                          <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5 font-sans">
                            {item.kronologi}
                          </div>
                        )}
                      </td>

                      {/* 5. Tanggal Pelanggaran */}
                      <td className="px-4 py-4 whitespace-nowrap text-slate-300">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{displayTglPelanggaran}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.pelanggaranHari || 'Senin'}
                        </div>
                      </td>

                      {/* 6. Jenis Sanksi atau Hukuman */}
                      <td className="px-5 py-4">
                        <div className="text-amber-300 font-semibold max-w-sm font-sans leading-relaxed">
                          {item.bentukSanksi}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Batas: <span className="text-rose-400 font-bold">{item.batasMaksimal || item.tanggalTargetSelesai}</span>
                        </div>
                      </td>

                      {/* 7. Petugas Pencatat */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-slate-200 font-medium font-sans flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{displayPetugas}</span>
                        </div>
                        <div className="text-[10px] text-cyan-300/70 font-mono mt-0.5">
                          Pembina: {item.ustadzPembina}
                        </div>
                      </td>

                      {/* 8. Status Pelaksanaan Sanksi */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-block font-bold px-2.5 py-1 rounded-xl border text-[11px] ${
                          item.status === 'Selesai'
                            ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40 glow-cyan'
                            : item.status === 'Sedang Berjalan'
                            ? 'text-amber-300 bg-amber-500/15 border-amber-400/40 glow-gold'
                            : 'text-rose-300 bg-rose-500/15 border-rose-500/40 glow-red'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* 9. Aksi Detail dan Cetak Surat */}
                      <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                        {/* Tombol Cetak / Pratinjau Surat Otomatis */}
                        <button
                          onClick={() => setSelectedSanksiForSurat(item)}
                          className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all cursor-pointer shadow-md border border-blue-400/40"
                          title="Buka Pratinjau, Edit, dan Cetak Surat Pelanggaran & Sanksi Edukatif"
                        >
                          <Printer className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Surat & Cetak</span>
                        </button>

                        {item.status !== 'Selesai' && (
                          <button
                            onClick={() => handleMarkCompleted(item)}
                            className="tactile-interactive px-2.5 py-1.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl transition-all cursor-pointer shadow-md border border-emerald-300/60"
                            title="Tandai sanksi telah diselesaikan santri"
                          >
                            Tuntas
                          </button>
                        )}

                        <button
                          onClick={() => handleSendWA(item)}
                          className="tactile-interactive p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/30"
                          title="Kirim Surat / Laporan ke WA Wali Santri"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sanksi Modal - 3D Styled */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                Penetapan Sanksi Edukatif & Penerbitan Surat Otomatis
              </h3>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  if (onClearPreSelectedPelanggaran) onClearPreSelectedPelanggaran();
                }} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Pilih Berkas Pelanggaran Santri
                </label>
                <select
                  required
                  value={selectedPelanggaranId}
                  onChange={(e) => setSelectedPelanggaranId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih Kasus Pelanggaran Terdaftar --</option>
                  {pelanggaranList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.santriNama} ({p.santriNis}) - {p.jenisPelanggaran} ({p.kategori})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Pilih Preset Sanksi Mendidik
                </label>
                <div className="grid grid-cols-1 gap-1.5 mb-2">
                  {educationalSanctionPresets.slice(0, 3).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, bentukSanksi: preset })}
                      className="tactile-interactive text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 text-slate-300 text-[11px] cursor-pointer hover:border-amber-400/40 transition-colors hover-rainbow-edge"
                    >
                      • {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={2}
                  value={formData.bentukSanksi}
                  onChange={(e) => setFormData({ ...formData, bentukSanksi: e.target.value })}
                  placeholder="Ketik bentuk takzir edukatif secara mendetail..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Tanggal Penetapan Sanksi
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalPenetapan}
                    onChange={(e) => setFormData({ ...formData, tanggalPenetapan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Batas Maksimal Pengumpulan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.batasMaksimal}
                    onChange={(e) => setFormData({ ...formData, batasMaksimal: e.target.value })}
                    placeholder="Contoh: 15 November 2026, 17:00 WIB"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Ustadz Pembina / Penerima Setoran
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ustadzPembina}
                    onChange={(e) => setFormData({ ...formData, ustadzPembina: e.target.value })}
                    placeholder="Nama ustadz pembina"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Status Pelaksanaan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Catatan Pembinaan / Pesan untuk Santri
                </label>
                <textarea
                  rows={2}
                  value={formData.catatanPembinaan}
                  onChange={(e) => setFormData({ ...formData, catatanPembinaan: e.target.value })}
                  placeholder="Catatan perkembangan atau motivasi..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Surat Pelanggaran & Sanksi Edukatif akan otomatis diterbitkan dan siap langsung dicetak atau dikirim via WhatsApp.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    if (onClearPreSelectedPelanggaran) onClearPreSelectedPelanggaran();
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan & Terbitkan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Surat Sanksi Modal (Preview, Edit, Print, PDF) */}
      <SuratSanksiModal
        sanksi={selectedSanksiForSurat}
        santriList={santriList}
        onClose={() => setSelectedSanksiForSurat(null)}
        onSanksiUpdated={(updated) => {
          setSelectedSanksiForSurat(updated);
        }}
      />

    </div>
  );
};
