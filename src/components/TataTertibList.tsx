import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Sparkles,
  ShieldAlert,
  Scale
} from 'lucide-react';
import { TataTertib, TingkatPelanggaran } from '../types';
import { storageService } from '../services/storageService';

interface TataTertibListProps {
  tataTertibList: TataTertib[];
}

export const TataTertibList: React.FC<TataTertibListProps> = ({ tataTertibList }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<TataTertib | null>(null);

  const [formData, setFormData] = useState<Partial<TataTertib>>({
    kode: '',
    kategori: 'Ketertiban Keamanan',
    pasal: 'Pasal 1 Ayat 1',
    deskripsi: '',
    tingkat: 'Ringan',
    poin: 5,
    rekomendasiSanksi: '',
  });

  const categories = [
    'Ubudiyah & Ibadah',
    'Akhlaq & Adab',
    'Ketertiban Keamanan',
    'Larangan Elektronik & Media',
    'Kebersihan & Kesehatan',
  ];

  const filtered = tataTertibList.filter(item => {
    if (selectedCategory !== 'all' && item.kategori !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.kode.toLowerCase().includes(q) ||
        item.pasal.toLowerCase().includes(q) ||
        item.deskripsi.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAdd = () => {
    setEditingItem(null);
    setFormData({
      kode: `RULE-${Math.floor(100 + Math.random() * 900)}`,
      kategori: 'Ketertiban Keamanan',
      pasal: 'Pasal Baru',
      deskripsi: '',
      tingkat: 'Ringan',
      poin: 5,
      rekomendasiSanksi: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: TataTertib) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode || !formData.deskripsi) return;

    const saved: TataTertib = {
      id: editingItem ? editingItem.id : `tt_${Date.now()}`,
      kode: formData.kode || 'TT-00',
      kategori: formData.kategori as any,
      pasal: formData.pasal || 'Pasal 1',
      deskripsi: formData.deskripsi || '',
      tingkat: (formData.tingkat as TingkatPelanggaran) || 'Ringan',
      poin: Number(formData.poin) || 5,
      rekomendasiSanksi: formData.rekomendasiSanksi || '',
    };

    storageService.saveTataTertib(saved);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pasal tata tertib ini?')) {
      storageService.deleteTataTertib(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 glow-cyan">
                Qanun Disiplin & Tata Tertib
              </span>
              <span className="text-[10px] font-mono text-slate-500">· Security Codex v3.0</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <BookOpenCheck className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              Buku Pedoman Tata Tertib & Ketertiban Santri
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Ketentuan qanun kedisiplinan, bobot poin pelanggaran, dan rekomendasi sanksi pembinaan edukatif
            </p>
          </div>

          <button
            onClick={openAdd}
            className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all shadow-xl cursor-pointer self-start sm:self-auto border border-amber-300/60 hover-rainbow-edge"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Pasal Aturan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Category - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs shadow-lg font-mono">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`tactile-interactive px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Semua Kategori ({tataTertibList.length})</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 rainbow-active-border glow-cyan'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input - 3D Styled */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-cyan-400" />
        <input
          type="text"
          placeholder="Cari kode aturan, pasal, atau bunyi tata tertib..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-xs bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono shadow-inner transition-all hover-rainbow-edge"
        />
      </div>

      {/* Grid of Rules Cards - 3D Floating & Rainbow Edge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 hover-rainbow-edge card-3d-floating shadow-xl flex flex-col justify-between space-y-4 group transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/30 glow-gold">
                  {item.kode} · {item.pasal}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                  item.tingkat === 'Berat'
                    ? 'text-red-400 bg-red-950/60 border border-red-500/40 glow-red'
                    : item.tingkat === 'Sedang'
                    ? 'text-amber-400 bg-amber-950/60 border border-amber-500/40 glow-gold'
                    : 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 glow-cyan'
                }`}>
                  {item.tingkat} ({item.poin} Poin)
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/90 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>{item.kategori}</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                {item.deskripsi}
              </p>
            </div>

            {/* Sanksi Rekomendasi */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Rekomendasi Pembinaan Edukatif:
              </p>
              <div className="text-xs text-amber-200/90 font-mono italic bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-inner">
                "{item.rekomendasiSanksi}"
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => openEdit(item)}
                  className="tactile-interactive p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-xl cursor-pointer border border-transparent hover:border-amber-400/30 transition-all"
                  title="Ubah Aturan"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="tactile-interactive p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl cursor-pointer border border-transparent hover:border-rose-500/30 transition-all"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal - 3D Styled */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <BookOpenCheck className="w-4 h-4 text-amber-400" />
                {editingItem ? 'Perbarui Pasal Tata Tertib' : 'Tambah Pasal Tata Tertib Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Kode Aturan</label>
                  <input
                    type="text"
                    required
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Pasal / Ayat</label>
                  <input
                    type="text"
                    required
                    value={formData.pasal}
                    onChange={(e) => setFormData({ ...formData, pasal: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Kategori Aturan</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Tingkat Pelanggaran</label>
                  <select
                    value={formData.tingkat}
                    onChange={(e) => setFormData({ ...formData, tingkat: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Bobot Poin</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.poin}
                    onChange={(e) => setFormData({ ...formData, poin: parseInt(e.target.value) || 5 })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Bunyi Tata Tertib / Larangan</label>
                <textarea
                  required
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Uraikan bunyi aturan qanun pesantren secara jelas..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Rekomendasi Sanksi Edukatif</label>
                <textarea
                  rows={2}
                  value={formData.rekomendasiSanksi}
                  onChange={(e) => setFormData({ ...formData, rekomendasiSanksi: e.target.value })}
                  placeholder="Contoh: Menghafal Nadzom Al-Imrithi bait 1-30 atau khidmah kebersihan masjid"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
