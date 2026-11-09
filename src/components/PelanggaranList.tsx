import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Share2, 
  Trash2, 
  X, 
  GraduationCap, 
  ShieldAlert,
  FileWarning
} from 'lucide-react';
import { Pelanggaran, Santri, TataTertib, UserAccount } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';

interface PelanggaranListProps {
  pelanggaranList: Pelanggaran[];
  santriList: Santri[];
  tataTertibList: TataTertib[];
  currentUser: UserAccount;
  onOpenSanksiModalForPelanggaran?: (pel: Pelanggaran) => void;
}

export const PelanggaranList: React.FC<PelanggaranListProps> = ({
  pelanggaranList,
  santriList,
  tataTertibList,
  currentUser,
  onOpenSanksiModalForPelanggaran,
}) => {
  const [selectedTingkat, setSelectedTingkat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [formData, setFormData] = useState({
    tanggal: todayStr,
    waktu: timeStr,
    kronologi: '',
    lokasi: 'Area Pondok Pesantren',
    namaPetugasPelapor: currentUser.nama,
    buktiUrl: '',
  });

  const handleRuleSelect = (ruleId: string) => {
    setSelectedRuleId(ruleId);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const santri = santriList.find(s => s.id === selectedSantriId);
    const rule = tataTertibList.find(r => r.id === selectedRuleId);

    if (!santri || !rule) {
      alert('Pilih santri dan jenis tata tertib yang dilanggar.');
      return;
    }

    const newPelanggaran: Pelanggaran = {
      id: `pel_${Date.now()}`,
      kodePelanggaran: `PEL-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      santriId: santri.id,
      santriNama: santri.nama,
      santriNis: santri.nis,
      santriGender: santri.gender,
      tanggal: formData.tanggal,
      waktu: formData.waktu,
      tataTertibId: rule.id,
      jenisPelanggaran: rule.deskripsi,
      kategori: rule.tingkat,
      poin: rule.poin,
      kronologi: formData.kronologi,
      lokasi: formData.lokasi,
      buktiUrl: formData.buktiUrl || undefined,
      namaPetugasPelapor: formData.namaPetugasPelapor,
      statusVerifikasi: 'Terverifikasi',
    };

    storageService.savePelanggaran(newPelanggaran);

    // Notification
    storageService.addNotification({
      judul: `Pelanggaran Tercatat: ${santri.nama}`,
      pesan: `Tercatat pelanggaran "${rule.deskripsi}" (${rule.tingkat} - ${rule.poin} poin).`,
      tipe: 'warning',
      linkMenu: 'pelanggaran',
      noWaTujuan: santri.noWaWali,
      waPesanTemplate: WhatsAppTemplates.pelanggaranSanksi(newPelanggaran),
    });

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus catatan pelanggaran ini? Poin santri akan dikurangi sesuai bobot.')) {
      storageService.deletePelanggaran(id);
    }
  };

  const handleSendWA = (pel: Pelanggaran) => {
    const santri = santriList.find(s => s.id === pel.santriId);
    const targetWa = santri ? santri.noWaWali : '08123456789';
    const text = WhatsAppTemplates.pelanggaranSanksi(pel);
    window.open(createWhatsAppUrl(targetWa, text), '_blank');
  };

  const filtered = pelanggaranList.filter(item => {
    if (selectedTingkat !== 'all' && item.kategori !== selectedTingkat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.santriNama.toLowerCase().includes(q) ||
        item.santriNis.toLowerCase().includes(q) ||
        item.jenisPelanggaran.toLowerCase().includes(q) ||
        item.kodePelanggaran.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30 glow-red">
                Incident Register & Case Dossier
              </span>
              <span className="text-[10px] font-mono text-slate-500">· Security Log</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <AlertTriangle className="w-6 h-6 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              Pencatatan Pelanggaran Kedisiplinan
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Dokumentasi kasus indisipliner, akumulasi poin takzir, dan kronologi investigasi lapangan
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all shadow-xl cursor-pointer self-start sm:self-auto border border-amber-300/60 hover-rainbow-edge"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Catat Kasus Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Tingkat - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs shadow-lg font-mono">
        <button
          onClick={() => setSelectedTingkat('all')}
          className={`tactile-interactive px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedTingkat === 'all'
              ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <FileWarning className="w-3.5 h-3.5" />
          <span>Semua Kasus ({pelanggaranList.length})</span>
        </button>
        <button
          onClick={() => setSelectedTingkat('Ringan')}
          className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedTingkat === 'Ringan'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rainbow-active-border glow-cyan'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          Pelanggaran Ringan
        </button>
        <button
          onClick={() => setSelectedTingkat('Sedang')}
          className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedTingkat === 'Sedang'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          Pelanggaran Sedang
        </button>
        <button
          onClick={() => setSelectedTingkat('Berat')}
          className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedTingkat === 'Berat'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 rainbow-active-border glow-red'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          Pelanggaran Berat
        </button>
      </div>

      {/* Search Input - 3D Styled */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-rose-400" />
        <input
          type="text"
          placeholder="Cari santri, NIS, kode kasus, atau jenis pelanggaran..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-xs bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono shadow-inner transition-all hover-rainbow-edge"
        />
      </div>

      {/* Table Container - 3D Metallic Glass */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover-rainbow-edge">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="px-6 py-4">Santri & Kode Kasus</th>
                <th className="px-4 py-4">Jenis Pelanggaran & Kronologi</th>
                <th className="px-4 py-4">Waktu & Lokasi</th>
                <th className="px-4 py-4">Tingkat & Poin</th>
                <th className="px-4 py-4">Pelapor</th>
                <th className="px-6 py-4 text-right">Tindakan Pembinaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-mono">
                    Tidak ada catatan pelanggaran yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white font-sans text-sm">{item.santriNama}</div>
                      <div className="text-[11px] text-slate-400">
                        NIS: <span className="text-cyan-300">{item.santriNis}</span> · {item.santriGender === 'putra' ? 'Banin' : 'Banat'}
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono font-bold mt-0.5">
                        {item.kodePelanggaran}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-100 max-w-sm font-sans">{item.jenisPelanggaran}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5 font-sans">
                        "{item.kronologi}"
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[11px]">
                      <div className="text-slate-300 font-semibold">{item.tanggal} · {item.waktu} WIB</div>
                      <div className="text-[10px] text-cyan-400/80">{item.lokasi}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded-lg border text-[11px] ${
                        item.kategori === 'Berat'
                          ? 'text-rose-300 bg-rose-500/10 border-rose-500/30 glow-red'
                          : item.kategori === 'Sedang'
                          ? 'text-amber-300 bg-amber-400/10 border-amber-400/30 glow-gold'
                          : 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30 glow-cyan'
                      }`}>
                        {item.kategori} (+{item.poin} Poin)
                      </span>
                    </td>
                    <td className="px-4 py-4 font-sans">
                      <div className="text-slate-200 font-medium">{item.namaPetugasPelapor}</div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">{item.statusVerifikasi}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {onOpenSanksiModalForPelanggaran && (
                        <button
                          onClick={() => onOpenSanksiModalForPelanggaran(item)}
                          className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all cursor-pointer shadow-md border border-amber-300/60"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Beri Sanksi</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleSendWA(item)}
                        className="tactile-interactive p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/30"
                        title="Kirim Laporan WA ke Wali"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="tactile-interactive p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/30"
                        title="Hapus"
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

      {/* Add Pelanggaran Modal - 3D Styled */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Pencatatan Kasus Pelanggaran Santri
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Pilih Santri yang Melanggar</label>
                <select
                  required
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nis} - {s.kelas} - {s.gender === 'putra' ? 'Putra' : 'Putri'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Pilih Pasal Tata Tertib yang Dilanggar</label>
                <select
                  required
                  value={selectedRuleId}
                  onChange={(e) => handleRuleSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih Jenis Pelanggaran --</option>
                  {tataTertibList.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.kode}] {r.deskripsi} ({r.tingkat} - {r.poin} Poin)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Tanggal Kejadian</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Waktu Kejadian (WIB)</label>
                  <input
                    type="time"
                    required
                    value={formData.waktu}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Tempat / Lokasi Kejadian</label>
                  <input
                    type="text"
                    required
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    placeholder="Contoh: Kamar Asrama K-03 / Area Gerbang"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Petugas Pelapor</label>
                  <input
                    type="text"
                    required
                    value={formData.namaPetugasPelapor}
                    onChange={(e) => setFormData({ ...formData, namaPetugasPelapor: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Kronologi Kejadian</label>
                <textarea
                  required
                  rows={3}
                  value={formData.kronologi}
                  onChange={(e) => setFormData({ ...formData, kronologi: e.target.value })}
                  placeholder="Ceritakan kronologi singkat saat pelanggaran ditemukan atau dilaporkan..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan Catatan Pelanggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
