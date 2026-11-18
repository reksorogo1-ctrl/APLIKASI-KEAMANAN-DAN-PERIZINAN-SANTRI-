import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  FileText,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  Search,
  Users,
} from 'lucide-react';
import { AgendaPengurus, NotulenRapat, PusatInformasiItem, SystemConfig } from '../types';
import { storageService } from '../services/storageService';

type PusatInformasiFilter = 'semua' | 'pengumuman' | 'undangan' | 'kalender' | 'notulensi';

interface PusatInformasiSectionProps {
  viewerLabel?: string;
  defaultOpen?: boolean;
}

interface UnifiedInfoEntry {
  id: string;
  jenis: 'Pengumuman' | 'Undangan Masuk' | 'Update Kalender' | 'Notulensi Rapat';
  judul: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  ringkasan: string;
  detailLengkap: string;
  sumber: string;
  prioritas?: 'Normal' | 'Penting' | 'Mendesak' | string;
  authorityNote: string;
  extraMeta?: string;
}

const JENIS_BADGE: Record<UnifiedInfoEntry['jenis'], string> = {
  Pengumuman: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
  'Undangan Masuk': 'bg-sky-500/20 text-sky-200 border-sky-400/50',
  'Update Kalender': 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
  'Notulensi Rapat': 'bg-purple-500/20 text-purple-200 border-purple-400/50',
};

export const PusatInformasiSection: React.FC<PusatInformasiSectionProps> = ({
  viewerLabel = 'Pengurus Pondok',
  defaultOpen = true,
}) => {
  const [sysConfig, setSysConfig] = useState<SystemConfig>(() => storageService.getSystemConfig());
  const [agendaList, setAgendaList] = useState<AgendaPengurus[]>(() =>
    storageService.getAgendaPengurus()
  );
  const [activeFilter, setActiveFilter] = useState<PusatInformasiFilter>('semua');
  const [search, setSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncLatest = () => {
      setSysConfig(storageService.getSystemConfig());
      setAgendaList(storageService.getAgendaPengurus());
    };
    syncLatest();
    const unsub = storageService.subscribe(syncLatest);
    return () => unsub();
  }, []);

  const pusatList: PusatInformasiItem[] = sysConfig.pusatInformasiList || [];
  const notulenList: NotulenRapat[] = sysConfig.notulenRapatList || [];

  const pengumumanEntries: UnifiedInfoEntry[] = useMemo(
    () =>
      pusatList
        .filter((i) => i.kategori === 'Pengumuman')
        .map((i) => ({
          id: i.id,
          jenis: 'Pengumuman',
          judul: i.judul,
          tanggal: i.tanggal || '-',
          waktu: i.waktu || '-',
          tempat: i.tempat || '-',
          ringkasan: i.isi,
          detailLengkap: i.isi,
          sumber: i.pengirim || 'Admin Pusat',
          prioritas: i.prioritas || 'Penting',
          authorityNote: 'Dikelola melalui Option Panel Admin',
          extraMeta: i.targetDivisi ? `Sasaran: ${i.targetDivisi}` : undefined,
        })),
    [pusatList]
  );

  const undanganEntries: UnifiedInfoEntry[] = useMemo(
    () =>
      pusatList
        .filter((i) => i.kategori === 'Undangan Masuk')
        .map((i) => ({
          id: i.id,
          jenis: 'Undangan Masuk',
          judul: i.judul,
          tanggal: i.tanggal || '-',
          waktu: i.waktu || '-',
          tempat: i.tempat || '-',
          ringkasan: i.isi,
          detailLengkap: i.isi,
          sumber: i.pengirim || 'Tamu / Pengasuh / Eksternal',
          prioritas: i.prioritas || 'Penting',
          authorityNote: 'Dikelola melalui Option Panel Admin',
          extraMeta: i.targetDivisi ? `Undangan untuk: ${i.targetDivisi}` : undefined,
        })),
    [pusatList]
  );

  const kalenderEntries: UnifiedInfoEntry[] = useMemo(
    () =>
      agendaList.map((ag) => ({
        id: ag.id,
        jenis: 'Update Kalender',
        judul: ag.judul,
        tanggal: ag.tanggal || '-',
        waktu: ag.waktu || '-',
        tempat: ag.tempat || '-',
        ringkasan: ag.catatan || `Kegiatan ${ag.kategori || 'Pondok'} (${ag.status})`,
        detailLengkap: [
          `Status: ${ag.status}`,
          `Divisi Terkait: ${ag.divisiTerkait}`,
          ag.penanggungJawab ? `Penanggung Jawab: ${ag.penanggungJawab}` : '',
          ag.catatan ? `Keterangan: ${ag.catatan}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        sumber: ag.penanggungJawab || ag.dibuatOleh || 'Admin Pusat',
        prioritas: ag.status === 'Berlangsung' ? 'Mendesak' : 'Normal',
        authorityNote: 'Dikelola melalui Option Panel Admin',
        extraMeta: `${ag.kategori || 'Kalender Pondok'} · ${ag.divisiTerkait}`,
      })),
    [agendaList]
  );

  const notulenEntries: UnifiedInfoEntry[] = useMemo(
    () =>
      notulenList.map((nt) => ({
        id: nt.id,
        jenis: 'Notulensi Rapat',
        judul: nt.judulRapat,
        tanggal: nt.tanggal || '-',
        waktu: nt.waktu || '-',
        tempat: nt.tempat || '-',
        ringkasan:
          nt.agendaBahasan && nt.agendaBahasan !== '-'
            ? nt.agendaBahasan
            : nt.hasilKeputusan,
        detailLengkap: [
          `Pimpinan Rapat: ${nt.pimpinanRapat}`,
          `Yang Hadir: ${nt.pesertaHadir || `${nt.jumlahPeserta} Pengurus`}`,
          `Inti Pembahasan: ${nt.agendaBahasan || '-'}`,
          `Hasil Keputusan:\n${nt.hasilKeputusan}`,
          `Notulis: ${nt.notulis}`,
        ].join('\n'),
        sumber: `Notulis: ${nt.notulis}`,
        prioritas: 'Penting',
        authorityNote: 'Dikelola oleh Sekretaris (Tab Sekretaris → Notulensi & Rapat)',
        extraMeta: nt.pesertaHadir ? `Hadir: ${nt.pesertaHadir}` : `${nt.jumlahPeserta} Peserta`,
      })),
    [notulenList]
  );

  const allEntries = useMemo(() => {
    const combined = [
      ...pengumumanEntries,
      ...undanganEntries,
      ...kalenderEntries,
      ...notulenEntries,
    ];
    return combined.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [pengumumanEntries, undanganEntries, kalenderEntries, notulenEntries]);

  const filteredEntries = useMemo(() => {
    const byTab =
      activeFilter === 'semua'
        ? allEntries
        : activeFilter === 'pengumuman'
        ? pengumumanEntries
        : activeFilter === 'undangan'
        ? undanganEntries
        : activeFilter === 'kalender'
        ? kalenderEntries
        : notulenEntries;

    const q = search.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter(
      (item) =>
        item.judul.toLowerCase().includes(q) ||
        item.detailLengkap.toLowerCase().includes(q) ||
        item.sumber.toLowerCase().includes(q) ||
        item.tempat.toLowerCase().includes(q) ||
        item.jenis.toLowerCase().includes(q)
    );
  }, [
    activeFilter,
    allEntries,
    pengumumanEntries,
    undanganEntries,
    kalenderEntries,
    notulenEntries,
    search,
  ]);

  const toggleExpandItem = (id: string) => {
    setExpandedItemIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/45 shadow-xl overflow-hidden">
      {/* Header Pusat Informasi */}
      <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-[#072d1f] via-[#041d14] to-[#03160f] border-b border-[#d4af37]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/45 text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Pusat Informasi Terpadu · {viewerLabel}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 text-[10px] font-mono inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Tampilan Baca Saja (Sinkron Otomatis)
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-white mt-1.5 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#f3d266] shrink-0" />
            <span>
              Pusat Informasi: Update Kalender, Pengumuman, Undangan Masuk &amp; Notulensi Rapat
            </span>
          </h3>
          <p className="text-[11px] text-emerald-200/80 mt-0.5">
            Update Kalender, Pengumuman, &amp; Undangan Masuk dikelola khusus melalui{' '}
            <strong className="text-[#f3d266]">Option Panel Admin</strong> · Notulensi Rapat
            dikelola oleh <strong className="text-purple-300">Sekretaris (Tab Notulensi &amp; Rapat)</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="px-3.5 py-2 rounded-xl bg-[#03160f] hover:bg-[#06281c] border border-[#d4af37]/40 text-xs font-bold text-[#f3d266] inline-flex items-center gap-1.5 cursor-pointer shrink-0 self-start lg:self-auto"
        >
          <span>{isExpanded ? 'Ringkas Pusat Informasi' : `Buka Pusat Informasi (${allEntries.length})`}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Ringkasan 4 Kategori + Filter Tabs */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          {[
            {
              key: 'semua' as const,
              label: 'Semua Info',
              count: allEntries.length,
              icon: Bell,
              accent: 'text-[#f3d266]',
            },
            {
              key: 'pengumuman' as const,
              label: 'Pengumuman',
              count: pengumumanEntries.length,
              icon: Megaphone,
              accent: 'text-amber-300',
            },
            {
              key: 'undangan' as const,
              label: 'Undangan Masuk',
              count: undanganEntries.length,
              icon: Mail,
              accent: 'text-sky-300',
            },
            {
              key: 'kalender' as const,
              label: 'Update Kalender',
              count: kalenderEntries.length,
              icon: Calendar,
              accent: 'text-emerald-300',
            },
            {
              key: 'notulensi' as const,
              label: 'Notulensi Rapat',
              count: notulenEntries.length,
              icon: ClipboardList,
              accent: 'text-purple-300',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveFilter(tab.key);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-[#083222] border-[#d4af37] shadow-md'
                    : 'bg-[#03160f]/90 border-emerald-800/70 hover:border-[#d4af37]/45'
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-[11px] font-bold flex items-center gap-1.5 ${tab.accent}`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-200/70 mt-0.5">
                    {tab.key === 'notulensi'
                      ? 'Sekretaris'
                      : tab.key === 'semua'
                      ? 'Terpadu'
                      : 'Panel Admin'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[#02100a] border border-emerald-700/60 text-xs font-mono font-extrabold text-white tabular-nums shrink-0">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pengumuman, undangan masuk, update kalender, atau notulensi rapat..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800/80 text-xs text-white placeholder-emerald-200/45 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Tabel Daftar Informasi */}
            <div className="overflow-x-auto rounded-2xl border border-emerald-800/80 bg-[#03160f]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-800/80 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02110b]">
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Kategori</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Tanggal &amp; Tempat</th>
                    <th className="py-2.5 px-3.5">Judul &amp; Rincian Informasi</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Sumber &amp; Otoritas Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/55">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-emerald-200/65">
                        Belum ada data pada kategori informasi yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((item) => {
                      const isDetailOpen = Boolean(expandedItemIds[item.id]);
                      return (
                        <tr key={`${item.jenis}_${item.id}`} className="hover:bg-[#06281c]/45 align-top">
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${JENIS_BADGE[item.jenis]}`}
                            >
                              {item.jenis === 'Pengumuman' && <Megaphone className="w-3 h-3" />}
                              {item.jenis === 'Undangan Masuk' && <Mail className="w-3 h-3" />}
                              {item.jenis === 'Update Kalender' && <Calendar className="w-3 h-3" />}
                              {item.jenis === 'Notulensi Rapat' && <FileText className="w-3 h-3" />}
                              <span>{item.jenis}</span>
                            </span>
                            {item.prioritas && (
                              <div className="mt-1 text-[10px] font-mono text-emerald-300/80">
                                Prioritas: {item.prioritas}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] tabular-nums">
                            <div className="text-[#f3d266] font-bold">{item.tanggal}</div>
                            {item.waktu && item.waktu !== '-' && (
                              <div className="text-emerald-200/80 inline-flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                <span>{item.waktu}</span>
                              </div>
                            )}
                            {item.tempat && item.tempat !== '-' && (
                              <div className="text-emerald-300/75 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                                <span className="truncate max-w-[160px]" title={item.tempat}>
                                  {item.tempat}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3.5 min-w-[260px] max-w-xl">
                            <div className="font-bold text-white">{item.judul}</div>
                            {item.extraMeta && (
                              <div className="text-[11px] text-emerald-300/90 mt-0.5 inline-flex items-center gap-1">
                                <Users className="w-3 h-3 shrink-0" />
                                <span>{item.extraMeta}</span>
                              </div>
                            )}
                            <p className="text-xs text-emerald-100/85 mt-1 whitespace-pre-line leading-relaxed">
                              {isDetailOpen ? item.detailLengkap : item.ringkasan}
                            </p>
                            {item.detailLengkap !== item.ringkasan && (
                              <button
                                type="button"
                                onClick={() => toggleExpandItem(item.id)}
                                className="mt-1 text-[11px] font-bold text-[#f3d266] hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isDetailOpen ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Ringkas</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>Lihat Detail Lengkap</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="font-semibold text-white">{item.sumber}</div>
                            <div className="text-[10px] font-mono text-emerald-300/75 mt-1">
                              {item.authorityNote}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
