import React, { useMemo, useState } from 'react';
import {
  Network,
  Plus,
  Edit3,
  Trash2,
  Search,
  User,
  Phone,
  Crown,
  X,
} from 'lucide-react';
import { DivisiPondok, StrukturOrganisasiNode, UserAccount } from '../types';
import { storageService } from '../services/storageService';

interface StrukturOrganisasiPanelProps {
  strukturList: StrukturOrganisasiNode[];
  currentUser: UserAccount;
}

const DIVISI_OPTIONS: DivisiPondok[] = [
  'Pengasuh & Majelis',
  'Ketua Pondok',
  'Sekretaris',
  'Bendahara',
  'Perlengkapan',
  'Keamanan',
  'Pendidikan & Taklim',
];

const LEVEL_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Level 1 · Dewan Pengasuh & Majelis Masyayikh',
  2: 'Level 2 · Pimpinan Eksekutif (Ketua Pondok)',
  3: 'Level 3 · Kepala Divisi & Koordinator Bagian',
  4: 'Level 4 · Staf Pelaksana & Anggota Divisi',
};

export const StrukturOrganisasiPanel: React.FC<StrukturOrganisasiPanelProps> = ({
  strukturList,
  currentUser,
}) => {
  const canEdit = currentUser.role === 'admin' || currentUser.role === 'ketua_pondok' || currentUser.role === 'sekretaris';
  const [search, setSearch] = useState('');
  const [filterDivisi, setFilterDivisi] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<StrukturOrganisasiNode | null>(null);
  const [form, setForm] = useState<Partial<StrukturOrganisasiNode>>({
    jabatan: '',
    namaPengurus: '',
    nrp: '',
    divisi: 'Sekretaris',
    level: 3,
    periode: '2026–2027',
    noWa: '0812',
    tupoksi: '',
    statusAktif: true,
    urutan: 1,
  });

  const filteredNodes = useMemo(() => {
    return strukturList
      .filter((n) => {
        if (filterDivisi !== 'all' && n.divisi !== filterDivisi) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            n.jabatan.toLowerCase().includes(q) ||
            n.namaPengurus.toLowerCase().includes(q) ||
            n.divisi.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.level - b.level || a.urutan - b.urutan);
  }, [strukturList, search, filterDivisi]);

  const groupedByLevel = useMemo(() => {
    const levels: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
    return levels
      .map((lvl) => ({
        level: lvl,
        label: LEVEL_LABELS[lvl],
        nodes: filteredNodes.filter((n) => n.level === lvl),
      }))
      .filter((g) => g.nodes.length > 0);
  }, [filteredNodes]);

  const openAdd = () => {
    setEditingNode(null);
    setForm({
      jabatan: '',
      namaPengurus: '',
      nrp: `ORG-${Math.floor(100 + Math.random() * 900)}`,
      divisi: 'Sekretaris',
      level: 3,
      periode: '2026–2027',
      noWa: '0812',
      tupoksi: '',
      statusAktif: true,
      urutan: strukturList.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEdit = (node: StrukturOrganisasiNode) => {
    setEditingNode(node);
    setForm({ ...node });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jabatan || !form.namaPengurus) return;
    const saved: StrukturOrganisasiNode = {
      id: editingNode ? editingNode.id : `org_${Date.now()}`,
      jabatan: form.jabatan.trim(),
      namaPengurus: form.namaPengurus.trim(),
      nrp: form.nrp || '-',
      divisi: (form.divisi as DivisiPondok) || 'Ketua Pondok',
      level: (Number(form.level) as 1 | 2 | 3 | 4) || 3,
      periode: form.periode || '2026–2027',
      noWa: form.noWa || '-',
      tupoksi: form.tupoksi || '-',
      statusAktif: form.statusAktif ?? true,
      urutan: Number(form.urutan) || 1,
    };
    storageService.saveStrukturNode(saved);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="luxury-3d-card rounded-2xl p-5 border border-[#d4af37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#e5c158] text-xs font-mono uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>Bagan Hierarki Kepengurusan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#f4f9f5]">
            Struktur Organisasi Pondok Pesantren Salaf Al-Maliki
          </h1>
          <p className="text-xs text-[#8eb5a0] mt-1">
            Masa Khidmah 2026–2027 · Total {strukturList.length} pejabat struktur aktif
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openAdd}
            className="tactile-interactive luxury-gold-btn px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jabatan Struktur</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="luxury-3d-card rounded-2xl p-3.5 border border-[#d4af37]/20 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pengurus, jabatan, atau divisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#031810] border border-[#d4af37]/25 rounded-xl text-xs text-[#f4f9f5] placeholder-[#8e7a64] focus:outline-none focus:border-[#d4af37]"
          />
        </div>
        <select
          value={filterDivisi}
          onChange={(e) => setFilterDivisi(e.target.value)}
          className="px-3.5 py-2.5 bg-[#031810] border border-[#d4af37]/25 rounded-xl text-xs text-[#f4f9f5] focus:outline-none focus:border-[#d4af37]"
        >
          <option value="all">Semua Divisi</option>
          {DIVISI_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Visual Hierarchy Tree */}
      <div className="space-y-6">
        {groupedByLevel.map((group) => (
          <div key={group.level} className="space-y-3">
            <div className="flex items-center gap-2.5 px-1">
              <Crown className="w-4 h-4 text-[#e5c158] shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#e5c158]">
                {group.label}
              </h2>
              <div className="flex-1 h-px bg-[#d4af37]/25" />
            </div>

            <div
              className={`grid gap-3.5 ${
                group.level === 1
                  ? 'grid-cols-1 max-w-xl mx-auto'
                  : group.level === 2
                    ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {group.nodes.map((node) => (
                <div
                  key={node.id}
                  className={`luxury-3d-card rounded-2xl p-4 border transition-all ${
                    group.level <= 2 ? 'border-[#d4af37]/55' : 'border-[#d4af37]/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#06281c] border border-[#d4af37]/45 flex items-center justify-center text-[#e5c158] shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37] block">
                          {node.divisi} · {node.nrp || 'AL-MALIKI'}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#f4f9f5] truncate">
                          {node.namaPengurus}
                        </h3>
                        <p className="text-xs font-semibold text-[#e5c158] truncate">{node.jabatan}</p>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(node)}
                          className="p-1.5 rounded-lg bg-[#1d140f] text-[#d1e7da] hover:text-[#e5c158] cursor-pointer"
                          title="Edit Jabatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => storageService.deleteStrukturNode(node.id)}
                          className="p-1.5 rounded-lg bg-[#1d140f] text-[#d1e7da] hover:text-rose-400 cursor-pointer"
                          title="Hapus Jabatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#d1e7da] mt-3 leading-relaxed border-t border-[#d4af37]/15 pt-2.5">
                    {node.tupoksi}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8eb5a0] mt-3 pt-2 border-t border-[#d4af37]/10">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#d4af37]" />
                      {node.noWa}
                    </span>
                    <span className={node.statusAktif ? 'text-emerald-400' : 'text-rose-400'}>
                      {node.statusAktif ? '● Aktif' : '○ Nonaktif'} · {node.periode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg luxury-3d-card rounded-2xl border border-[#d4af37]/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#d4af37]/25 bg-[#031810]">
              <h3 className="text-sm font-bold text-[#f4f9f5]">
                {editingNode ? 'Edit Pejabat Struktur Organisasi' : 'Tambah Jabatan Struktur Organisasi'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#06281c] text-[#d1e7da] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Nama Pengurus</label>
                  <input
                    type="text"
                    required
                    value={form.namaPengurus || ''}
                    onChange={(e) => setForm({ ...form, namaPengurus: e.target.value })}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  />
                </div>
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Jabatan Struktur</label>
                  <input
                    type="text"
                    required
                    value={form.jabatan || ''}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Divisi</label>
                  <select
                    value={form.divisi}
                    onChange={(e) => setForm({ ...form, divisi: e.target.value as DivisiPondok })}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  >
                    {DIVISI_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Level Hierarki</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  >
                    <option value={1}>1 - Pengasuh</option>
                    <option value={2}>2 - Ketua Pondok</option>
                    <option value={3}>3 - Kepala Divisi</option>
                    <option value={4}>4 - Staf/Anggota</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">No. WA / Kontak</label>
                  <input
                    type="text"
                    value={form.noWa || ''}
                    onChange={(e) => setForm({ ...form, noWa: e.target.value })}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">Tugas Pokok &amp; Fungsi (Tupoksi)</label>
                <textarea
                  rows={3}
                  value={form.tupoksi || ''}
                  onChange={(e) => setForm({ ...form, tupoksi: e.target.value })}
                  className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#d4af37]/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#d1e7da] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="luxury-gold-btn px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Simpan Struktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
