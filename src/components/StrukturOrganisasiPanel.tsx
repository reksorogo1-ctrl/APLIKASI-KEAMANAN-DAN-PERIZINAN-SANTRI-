import React, { useMemo, useState } from 'react';
import {
  Network,
  Plus,
  Edit3,
  Trash2,
  Search,
  Phone,
  Building2,
  X,
  CheckCircle2,
  Save,
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

const LEVEL_BADGE: Record<1 | 2 | 3 | 4, string> = {
  1: 'Pengasuh',
  2: 'Pimpinan Pondok',
  3: 'Kepala Divisi',
  4: 'Staf / Anggota',
};

const DIVISI_META: Record<
  DivisiPondok,
  {
    subtitle: string;
    defaultLevel: 1 | 2 | 3 | 4;
    nrpPrefix: string;
    jabatanPlaceholder: string;
    tupoksiPlaceholder: string;
    kolomTugasLabel: string;
  }
> = {
  'Pengasuh & Majelis': {
    subtitle: 'Dewan Pengasuh, Pembina Rohani & Majelis Syuro Pondok',
    defaultLevel: 1,
    nrpPrefix: 'PENGASUH',
    jabatanPlaceholder: 'Cth: Pengasuh Utama / Dewan Penasihat',
    tupoksiPlaceholder: 'Bimbingan ruhani, fatwa, & kebijakan tertinggi...',
    kolomTugasLabel: 'Amanah & Bimbingan',
  },
  'Ketua Pondok': {
    subtitle: 'Pimpinan Harian, Wakil Ketua & Koordinator Umum Kepengurusan',
    defaultLevel: 2,
    nrpPrefix: 'KTP',
    jabatanPlaceholder: 'Cth: Ketua Pondok / Wakil Ketua Pondok',
    tupoksiPlaceholder: 'Koordinasi lintas divisi & evaluasi kinerja...',
    kolomTugasLabel: 'Mandat Kepemimpinan',
  },
  Sekretaris: {
    subtitle: 'Persuratan Resmi, Buku Induk Santri, Notulensi Rapat & Kearsipan',
    defaultLevel: 3,
    nrpPrefix: 'SEK',
    jabatanPlaceholder: 'Cth: Sekretaris I / Staf Kearsipan & Surat',
    tupoksiPlaceholder: 'Penomoran surat, notulen rapat, & arsip...',
    kolomTugasLabel: 'Bidang Kesekretariatan',
  },
  Bendahara: {
    subtitle: 'Pengelolaan Kas Pondok, Syahriyah Santri, Uang Saku & Anggaran',
    defaultLevel: 3,
    nrpPrefix: 'BND',
    jabatanPlaceholder: 'Cth: Bendahara Umum / Kasir Syahriyah',
    tupoksiPlaceholder: 'Pembukuan kas, syahriyah, & laporan keuangan...',
    kolomTugasLabel: 'Bidang Keuangan',
  },
  Perlengkapan: {
    subtitle: 'Inventaris Aset, Data Fasilitas Gedung, Peminjaman & Pemeliharaan',
    defaultLevel: 3,
    nrpPrefix: 'PRL',
    jabatanPlaceholder: 'Cth: Kadiv Perlengkapan / Teknisi Sarpras',
    tupoksiPlaceholder: 'Inventaris gedung, lampu, audio, & perbaikan...',
    kolomTugasLabel: 'Bidang Sarpras & Aset',
  },
  Keamanan: {
    subtitle: 'Dewan Keamanan, Pos Gerbang, Perizinan Santri & Penegakan Qanun',
    defaultLevel: 3,
    nrpPrefix: 'KAMTIB',
    jabatanPlaceholder: 'Cth: Ketua Keamanan / Petugas Pos Gerbang',
    tupoksiPlaceholder: 'Kontrol gerbang, perizinan, & takzir edukatif...',
    kolomTugasLabel: 'Sektor & Tugas Kamtib',
  },
  'Pendidikan & Taklim': {
    subtitle: 'Kurikulum Madrasah Diniyah, Pengajian Kitab Kuning & Evaluasi Taklim',
    defaultLevel: 3,
    nrpPrefix: 'TAKLIM',
    jabatanPlaceholder: 'Cth: Koordinator Taklim / Musyrif Kitab',
    tupoksiPlaceholder: 'Jadwal ngaji kitab, musyawarah, & imtihan...',
    kolomTugasLabel: 'Bidang Pengajaran & Kitab',
  },
};

export const StrukturOrganisasiPanel: React.FC<StrukturOrganisasiPanelProps> = ({
  strukturList,
  currentUser,
}) => {
  const canEdit =
    currentUser.role === 'admin' ||
    currentUser.role === 'ketua_pondok' ||
    currentUser.role === 'sekretaris';
  const [search, setSearch] = useState('');
  const [filterDivisi, setFilterDivisi] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<StrukturOrganisasiNode | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // State input cepat per baris tabel masing-masing divisi
  const [quickRows, setQuickRows] = useState<
    Record<
      string,
      {
        jabatan: string;
        namaPengurus: string;
        level: 1 | 2 | 3 | 4;
        tupoksi: string;
        noWa: string;
        periode: string;
      }
    >
  >({});

  // State edit inline langsung di dalam tabel per divisi
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<Partial<StrukturOrganisasiNode>>({});

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

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const getQuickRow = (divisi: DivisiPondok) => {
    const existingCount = strukturList.filter((n) => n.divisi === divisi).length;
    const defaultLevel: 1 | 2 | 3 | 4 =
      existingCount === 0 ? DIVISI_META[divisi].defaultLevel : 4;
    return (
      quickRows[divisi] || {
        jabatan: '',
        namaPengurus: '',
        level: defaultLevel,
        tupoksi: '',
        noWa: '0812',
        periode: '2026–2027',
      }
    );
  };

  const updateQuickRow = (
    divisi: DivisiPondok,
    patch: Partial<{
      jabatan: string;
      namaPengurus: string;
      level: 1 | 2 | 3 | 4;
      tupoksi: string;
      noWa: string;
      periode: string;
    }>
  ) => {
    const cur = getQuickRow(divisi);
    setQuickRows((prev) => ({
      ...prev,
      [divisi]: { ...cur, ...patch },
    }));
  };

  const filteredNodes = useMemo(() => {
    return strukturList
      .filter((n) => {
        if (filterDivisi !== 'all' && n.divisi !== filterDivisi) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            n.jabatan.toLowerCase().includes(q) ||
            n.namaPengurus.toLowerCase().includes(q) ||
            n.divisi.toLowerCase().includes(q) ||
            n.tupoksi.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.level - b.level || a.urutan - b.urutan);
  }, [strukturList, search, filterDivisi]);

  const groupedByDivisi = useMemo(() => {
    const targetDivisiList =
      filterDivisi === 'all'
        ? DIVISI_OPTIONS
        : DIVISI_OPTIONS.filter((d) => d === filterDivisi);

    return targetDivisiList
      .map((divisi) => ({
        divisi,
        meta: DIVISI_META[divisi],
        nodes: filteredNodes.filter((n) => n.divisi === divisi),
      }))
      .filter((g) => {
        if (search.trim()) return g.nodes.length > 0;
        return true;
      });
  }, [filteredNodes, filterDivisi, search]);

  const openAdd = (presetDivisi: DivisiPondok = 'Sekretaris') => {
    const existingCount = strukturList.filter((n) => n.divisi === presetDivisi).length;
    const defaultLevel: 1 | 2 | 3 | 4 =
      existingCount === 0 ? DIVISI_META[presetDivisi].defaultLevel : 4;
    const prefix = DIVISI_META[presetDivisi].nrpPrefix || 'ORG';

    setEditingNode(null);
    setForm({
      jabatan: '',
      namaPengurus: '',
      nrp: `${prefix}-${String(existingCount + 1).padStart(3, '0')}`,
      divisi: presetDivisi,
      level: defaultLevel,
      periode: '2026–2027',
      noWa: '0812',
      tupoksi: '',
      statusAktif: true,
      urutan: strukturList.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleSaveTableQuickRow = (divisi: DivisiPondok) => {
    const row = getQuickRow(divisi);
    if (!row.namaPengurus.trim() || !row.jabatan.trim()) {
      notify(`Lengkapi Nama Pengurus & Jabatan terlebih dahulu untuk Divisi ${divisi}.`);
      return;
    }
    const existingCount = strukturList.filter((n) => n.divisi === divisi).length;
    const prefix = DIVISI_META[divisi].nrpPrefix || 'ORG';
    const saved: StrukturOrganisasiNode = {
      id: `org_${Date.now()}`,
      jabatan: row.jabatan.trim(),
      namaPengurus: row.namaPengurus.trim(),
      nrp: `${prefix}-${String(existingCount + 1).padStart(3, '0')}`,
      divisi,
      level: row.level,
      periode: row.periode.trim() || '2026–2027',
      noWa: row.noWa.trim() || '-',
      tupoksi: row.tupoksi.trim() || `Pelaksana tugas divisi ${divisi}.`,
      statusAktif: true,
      urutan: strukturList.length + 1,
    };
    storageService.saveStrukturNode(saved);
    setQuickRows((prev) => ({
      ...prev,
      [divisi]: {
        jabatan: '',
        namaPengurus: '',
        level: 4,
        tupoksi: '',
        noWa: '0812',
        periode: row.periode || '2026–2027',
      },
    }));
    notify(`"${saved.namaPengurus}" (${saved.jabatan}) ditambahkan ke tabel Divisi ${divisi}.`);
  };

  const startInlineEdit = (node: StrukturOrganisasiNode) => {
    setInlineEditId(node.id);
    setInlineEditData({ ...node });
  };

  const saveInlineEdit = (orig: StrukturOrganisasiNode) => {
    const updated: StrukturOrganisasiNode = {
      ...orig,
      jabatan: (inlineEditData.jabatan ?? orig.jabatan).trim() || orig.jabatan,
      namaPengurus:
        (inlineEditData.namaPengurus ?? orig.namaPengurus).trim() || orig.namaPengurus,
      level: (Number(inlineEditData.level ?? orig.level) as 1 | 2 | 3 | 4) || orig.level,
      tupoksi: (inlineEditData.tupoksi ?? orig.tupoksi).trim() || '-',
      noWa: (inlineEditData.noWa ?? orig.noWa).trim() || '-',
      periode: (inlineEditData.periode ?? orig.periode).trim() || '2026–2027',
      statusAktif: inlineEditData.statusAktif ?? orig.statusAktif,
    };
    storageService.saveStrukturNode(updated);
    setInlineEditId(null);
    notify(`Data "${updated.namaPengurus}" pada tabel ${updated.divisi} berhasil diperbarui.`);
  };

  const handleSaveModal = (e: React.FormEvent) => {
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
    notify(
      editingNode
        ? `Data struktur "${saved.namaPengurus}" berhasil diperbarui.`
        : `Pengurus "${saved.namaPengurus}" berhasil ditambahkan ke divisi ${saved.divisi}.`
    );
  };

  return (
    <div className="space-y-5 font-sans">
      {/* div:nth-of-type(1) - Header */}
      <div className="luxury-3d-card rounded-2xl p-5 border border-[#d4af37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#e5c158] text-xs font-mono uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>Tabel Struktur Kepengurusan Per Divisi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#f4f9f5]">
            Struktur Organisasi Pondok Pesantren Salaf Al-Maliki
          </h1>
          <p className="text-xs text-[#8eb5a0] mt-1">
            Masa Khidmah 2026–2027 · Total {strukturList.length} pejabat aktif · Input langsung di
            masing-masing tabel divisi
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() =>
              openAdd(filterDivisi !== 'all' ? (filterDivisi as DivisiPondok) : 'Sekretaris')
            }
            className="tactile-interactive luxury-gold-btn px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jabatan (Modal)</span>
          </button>
        )}
      </div>

      {/* div:nth-of-type(2) - Filters */}
      <div className="luxury-3d-card rounded-2xl p-3.5 border border-[#d4af37]/20 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pengurus, jabatan, tupoksi, atau divisi..."
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
            <option value="all">Semua Divisi ({strukturList.length})</option>
            {DIVISI_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} ({strukturList.filter((n) => n.divisi === d).length})
              </option>
            ))}
          </select>
        </div>

        {toastMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-[#d4af37]/50 text-emerald-100 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#f3d266] shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>

      {/* div:nth-of-type(3) - Format TABEL PER DIVISI dengan input langsung di tabel */}
      <div className="space-y-5">
        {groupedByDivisi.map((group) => {
          const quickRow = getQuickRow(group.divisi);

          return (
            <div
              key={group.divisi}
              className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/30 shadow-xl overflow-hidden"
            >
              {/* Header Blok Divisi */}
              <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#062a1d] via-[#041d14] to-[#03160f] border-b border-[#d4af37]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/45 flex items-center justify-center text-[#f3d266] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">
                        Tabel Divisi {group.divisi}
                      </h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40 tabular-nums">
                        {group.nodes.length} Pengurus
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8eb5a0]">{group.meta.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Tabel Pengurus Khusus Divisi Ini */}
              <div className="overflow-x-auto bg-[#03160f]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#d4af37]/30 text-[#f3d266] uppercase text-[10px] font-mono bg-[#02110b]">
                      <th className="py-2.5 px-3 text-center w-10">No</th>
                      <th className="py-2.5 px-3 min-w-[165px]">Jabatan &amp; Level</th>
                      <th className="py-2.5 px-3 min-w-[165px]">Nama Pengurus</th>
                      <th className="py-2.5 px-3 min-w-[230px]">{group.meta.kolomTugasLabel}</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[125px]">No. WhatsApp</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[115px]">
                        Periode &amp; Status
                      </th>
                      {canEdit && (
                        <th className="py-2.5 px-3 text-right whitespace-nowrap w-28">Aksi</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#d4af37]/15">
                    {group.nodes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canEdit ? 7 : 6}
                          className="py-5 px-4 text-center text-xs text-emerald-200/70"
                        >
                          Belum ada pengurus terdaftar di tabel Divisi {group.divisi}.
                          {canEdit ? ' Silakan langsung ketik pada baris input di bawah tabel ini.' : ''}
                        </td>
                      </tr>
                    ) : (
                      group.nodes.map((node, idx) => {
                        const isInlineEditing = canEdit && inlineEditId === node.id;

                        if (isInlineEditing) {
                          return (
                            <tr key={node.id} className="bg-[#072e20]/80 align-top">
                              <td className="py-2.5 px-3 text-center font-mono text-[#f3d266] font-bold">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-2.5 space-y-1.5">
                                <input
                                  type="text"
                                  value={inlineEditData.jabatan ?? ''}
                                  onChange={(e) =>
                                    setInlineEditData({ ...inlineEditData, jabatan: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-[#d4af37]/50 text-xs text-white focus:outline-none"
                                />
                                <select
                                  value={inlineEditData.level ?? node.level}
                                  onChange={(e) =>
                                    setInlineEditData({
                                      ...inlineEditData,
                                      level: Number(e.target.value) as 1 | 2 | 3 | 4,
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded-lg bg-[#02100a] border border-emerald-700 text-[11px] text-emerald-200"
                                >
                                  <option value={1}>Level 1 - Pengasuh</option>
                                  <option value={2}>Level 2 - Pimpinan Pondok</option>
                                  <option value={3}>Level 3 - Kepala Divisi</option>
                                  <option value={4}>Level 4 - Staf / Anggota</option>
                                </select>
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="text"
                                  value={inlineEditData.namaPengurus ?? ''}
                                  onChange={(e) =>
                                    setInlineEditData({
                                      ...inlineEditData,
                                      namaPengurus: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-[#d4af37]/50 text-xs text-white font-semibold focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <textarea
                                  rows={2}
                                  value={inlineEditData.tupoksi ?? ''}
                                  onChange={(e) =>
                                    setInlineEditData({ ...inlineEditData, tupoksi: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-700 text-xs text-white focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="text"
                                  value={inlineEditData.noWa ?? ''}
                                  onChange={(e) =>
                                    setInlineEditData({ ...inlineEditData, noWa: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-700 text-xs text-white font-mono focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-2.5 space-y-1.5">
                                <input
                                  type="text"
                                  value={inlineEditData.periode ?? ''}
                                  onChange={(e) =>
                                    setInlineEditData({ ...inlineEditData, periode: e.target.value })
                                  }
                                  className="w-full px-2 py-1 rounded-lg bg-[#02100a] border border-emerald-700 text-[11px] text-white font-mono"
                                />
                                <label className="inline-flex items-center gap-1.5 text-[11px] text-emerald-200 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={inlineEditData.statusAktif ?? true}
                                    onChange={(e) =>
                                      setInlineEditData({
                                        ...inlineEditData,
                                        statusAktif: e.target.checked,
                                      })
                                    }
                                  />
                                  <span>Aktif</span>
                                </label>
                              </td>
                              <td className="py-2 px-2.5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => saveInlineEdit(node)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#f3d266] text-[#02120a] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    title="Simpan Perubahan"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInlineEditId(null)}
                                    className="p-1.5 rounded-lg bg-[#03160f] text-emerald-200 hover:text-white border border-emerald-700 cursor-pointer"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={node.id} className="hover:bg-[#06281c]/55 align-top">
                            <td className="py-3 px-3 text-center font-mono text-emerald-300 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-[#f3d266]">{node.jabatan}</div>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#06281c] border border-[#d4af37]/30 text-[10px] font-mono text-emerald-200">
                                {LEVEL_BADGE[node.level]} · {node.nrp || 'AL-MALIKI'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-white">{node.namaPengurus}</div>
                            </td>
                            <td className="py-3 px-3 text-[#d1e7da] leading-relaxed">
                              {node.tupoksi}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-emerald-200 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#d4af37]" />
                                {node.noWa}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                              <div
                                className={
                                  node.statusAktif
                                    ? 'text-emerald-400 font-bold'
                                    : 'text-rose-400 font-bold'
                                }
                              >
                                {node.statusAktif ? '● Aktif' : '○ Nonaktif'}
                              </div>
                              <div className="text-emerald-300/75 text-[10px]">{node.periode}</div>
                            </td>
                            {canEdit && (
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startInlineEdit(node)}
                                    className="p-1.5 rounded-lg bg-[#06281c] border border-[#d4af37]/30 text-[#d1e7da] hover:text-[#f3d266] cursor-pointer"
                                    title="Edit di Tabel"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      storageService.deleteStrukturNode(node.id);
                                      notify(`Pengurus "${node.namaPengurus}" dihapus dari struktur.`);
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-500/35 text-rose-200 hover:text-white cursor-pointer"
                                    title="Hapus Jabatan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {/* Baris Input Cepat Langsung Per Divisi di Bagian Bawah Tabel */}
                  {canEdit && (
                    <tfoot>
                      <tr className="bg-[#052419]/90 border-t-2 border-[#d4af37]/35 align-middle">
                        <td className="py-2.5 px-3 text-center text-[#f3d266] font-mono font-bold">
                          +
                        </td>
                        <td className="py-2.5 px-2.5 space-y-1">
                          <input
                            type="text"
                            placeholder={group.meta.jabatanPlaceholder}
                            value={quickRow.jabatan}
                            onChange={(e) =>
                              updateQuickRow(group.divisi, { jabatan: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-700/80 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:border-[#d4af37]"
                          />
                          <select
                            value={quickRow.level}
                            onChange={(e) =>
                              updateQuickRow(group.divisi, {
                                level: Number(e.target.value) as 1 | 2 | 3 | 4,
                              })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-[#02100a] border border-emerald-800 text-[10px] text-emerald-200 focus:outline-none"
                          >
                            <option value={1}>Level 1 - Pengasuh</option>
                            <option value={2}>Level 2 - Pimpinan Pondok</option>
                            <option value={3}>Level 3 - Kepala Divisi</option>
                            <option value={4}>Level 4 - Staf / Anggota</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <input
                            type="text"
                            placeholder={`Nama Pengurus ${group.divisi}...`}
                            value={quickRow.namaPengurus}
                            onChange={(e) =>
                              updateQuickRow(group.divisi, { namaPengurus: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveTableQuickRow(group.divisi);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-700/80 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:border-[#d4af37]"
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
                          <input
                            type="text"
                            placeholder={group.meta.tupoksiPlaceholder}
                            value={quickRow.tupoksi}
                            onChange={(e) =>
                              updateQuickRow(group.divisi, { tupoksi: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-700/80 text-xs text-white placeholder-emerald-200/40 focus:outline-none focus:border-[#d4af37]"
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
                          <input
                            type="text"
                            placeholder="0812..."
                            value={quickRow.noWa}
                            onChange={(e) =>
                              updateQuickRow(group.divisi, { noWa: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-700/80 text-xs text-white font-mono placeholder-emerald-200/40 focus:outline-none focus:border-[#d4af37]"
                          />
                        </td>
                        <td className="py-2.5 px-2.5">
                          <input
                            type="text"
                            placeholder="2026–2027"
                            value={quickRow.periode}
                            onChange={(e) =>
                              updateQuickRow(group.divisi, { periode: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-700/80 text-xs text-white font-mono placeholder-emerald-200/40 focus:outline-none focus:border-[#d4af37]"
                          />
                        </td>
                        <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSaveTableQuickRow(group.divisi)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f3d266] hover:brightness-105 text-[#02120a] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer shadow"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Lengkap */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg luxury-3d-card rounded-2xl border border-[#d4af37]/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#d4af37]/25 bg-[#031810]">
              <h3 className="text-sm font-bold text-[#f4f9f5]">
                {editingNode
                  ? 'Edit Pejabat Struktur Organisasi'
                  : 'Tambah Jabatan Struktur Organisasi'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#06281c] text-[#d1e7da] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5 text-xs">
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
                  <label className="block text-[#d1e7da] font-semibold mb-1">
                    Jabatan Struktur
                  </label>
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
                    onChange={(e) =>
                      setForm({ ...form, level: Number(e.target.value) as 1 | 2 | 3 | 4 })
                    }
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5]"
                  >
                    <option value={1}>1 - Pengasuh</option>
                    <option value={2}>2 - Ketua Pondok</option>
                    <option value={3}>3 - Kepala Divisi</option>
                    <option value={4}>4 - Staf/Anggota</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">
                    No. WA / Kontak
                  </label>
                  <input
                    type="text"
                    value={form.noWa || ''}
                    onChange={(e) => setForm({ ...form, noWa: e.target.value })}
                    className="w-full px-3 py-2 bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#d1e7da] font-semibold mb-1">
                  Tugas Pokok &amp; Fungsi (Tupoksi)
                </label>
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
