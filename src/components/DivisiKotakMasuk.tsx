import React, { useMemo, useState } from 'react';
import {
  Inbox,
  Send,
  Reply,
  Trash2,
  Search,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Clock,
  MessageSquare,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BalasanKoordinasi,
  PesanKoordinasi,
  PrioritasKoordinasi,
  UserAccount,
} from '../types';
import { storageService } from '../services/storageService';
import { PusatInformasiSection } from './PusatInformasiSection';

export type ViewerDivision = 'Sekretaris' | 'Bendahara' | 'Perlengkapan' | 'Keamanan';
export type DivisiBucketKey =
  | 'Ketua Pondok'
  | 'Sekretaris'
  | 'Bendahara'
  | 'Perlengkapan'
  | 'Keamanan'
  | 'Admin Pusat';

interface DivisiKotakMasukProps {
  currentUser: UserAccount;
  koordinasiList: PesanKoordinasi[];
  viewerDivision: ViewerDivision;
  panelTitle?: string;
  panelSubtitle?: string;
}

interface DivisiMeta {
  key: DivisiBucketKey;
  shortLabel: string;
  label: string;
  tujuanValue: string;
  accentClass: string;
}

const DIVISI_META_LIST: DivisiMeta[] = [
  {
    key: 'Ketua Pondok',
    shortLabel: 'Ketua Pondok',
    label: 'Ketua Pondok / Pimpinan',
    tujuanValue: 'ketua_pondok',
    accentClass: 'text-amber-200 border-amber-400/50 bg-amber-500/15',
  },
  {
    key: 'Sekretaris',
    shortLabel: 'Sekretaris',
    label: 'Divisi Sekretaris',
    tujuanValue: 'sekretaris',
    accentClass: 'text-[#f3d266] border-[#d4af37]/45 bg-[#d4af37]/10',
  },
  {
    key: 'Bendahara',
    shortLabel: 'Bendahara',
    label: 'Divisi Bendahara',
    tujuanValue: 'bendahara',
    accentClass: 'text-emerald-300 border-emerald-500/45 bg-emerald-500/10',
  },
  {
    key: 'Perlengkapan',
    shortLabel: 'Perlengkapan',
    label: 'Divisi Perlengkapan & Sarpras',
    tujuanValue: 'perlengkapan',
    accentClass: 'text-sky-300 border-sky-500/45 bg-sky-500/10',
  },
  {
    key: 'Keamanan',
    shortLabel: 'Keamanan',
    label: 'Divisi Keamanan & Ketertiban',
    tujuanValue: 'semua_dewan',
    accentClass: 'text-rose-200 border-rose-500/45 bg-rose-500/10',
  },
  {
    key: 'Admin Pusat',
    shortLabel: 'Admin Pusat',
    label: 'Admin Pusat',
    tujuanValue: 'admin',
    accentClass: 'text-purple-200 border-purple-500/45 bg-purple-500/10',
  },
];

function resolveSenderDivisi(msg: PesanKoordinasi): DivisiBucketKey {
  const role = (msg.pengirimRole || '').toLowerCase();
  const jabatan = (msg.pengirimJabatan || '').toLowerCase();

  if (
    role === 'ketua_pondok' ||
    jabatan.includes('ketua pondok') ||
    jabatan.includes('pengasuh') ||
    jabatan.includes('pimpinan')
  ) {
    return 'Ketua Pondok';
  }
  if (role === 'sekretaris' || jabatan.includes('sekretaris')) return 'Sekretaris';
  if (role === 'bendahara' || jabatan.includes('bendahara')) return 'Bendahara';
  if (
    role === 'perlengkapan' ||
    jabatan.includes('perlengkapan') ||
    jabatan.includes('sarpras')
  ) {
    return 'Perlengkapan';
  }
  if (
    role === 'ketua_keamanan' ||
    role === 'anggota_keamanan' ||
    role === 'petugas_gerbang' ||
    jabatan.includes('keamanan') ||
    jabatan.includes('kamtib') ||
    jabatan.includes('gerbang') ||
    jabatan.includes('patroli') ||
    jabatan.includes('dewan')
  ) {
    return 'Keamanan';
  }
  return 'Admin Pusat';
}

function resolveTargetDivisi(msg: PesanKoordinasi): DivisiBucketKey | null {
  const tujuan = (msg.tujuan || '').toLowerCase();
  const judul = (msg.judul || '').toLowerCase();

  if (tujuan.includes('ketua') || judul.includes('-> ketua pondok')) return 'Ketua Pondok';
  if (tujuan.includes('sekretaris') || judul.includes('-> divisi sekretaris')) return 'Sekretaris';
  if (tujuan.includes('bendahara') || judul.includes('-> divisi bendahara')) return 'Bendahara';
  if (
    tujuan.includes('perlengkapan') ||
    tujuan.includes('sarpras') ||
    judul.includes('-> divisi perlengkapan')
  ) {
    return 'Perlengkapan';
  }
  if (
    tujuan.includes('keamanan') ||
    tujuan.includes('semua_dewan') ||
    tujuan.includes('dewan keamanan') ||
    judul.includes('-> divisi keamanan')
  ) {
    return 'Keamanan';
  }
  if (tujuan === 'admin' || judul.includes('-> admin')) return 'Admin Pusat';
  return null;
}

function resolveMessageBucket(
  msg: PesanKoordinasi,
  viewerDivision: ViewerDivision
): DivisiBucketKey {
  const senderDiv = resolveSenderDivisi(msg);
  if (senderDiv !== viewerDivision) {
    return senderDiv;
  }
  const targetDiv = resolveTargetDivisi(msg);
  if (targetDiv && targetDiv !== viewerDivision) {
    return targetDiv;
  }
  return senderDiv;
}

function isReplyFromDivision(role: string, division: ViewerDivision): boolean {
  const r = (role || '').toLowerCase();
  if (division === 'Sekretaris') return r === 'sekretaris';
  if (division === 'Bendahara') return r === 'bendahara';
  if (division === 'Perlengkapan') return r === 'perlengkapan';
  return r === 'ketua_keamanan' || r === 'anggota_keamanan' || r === 'petugas_gerbang';
}

export const DivisiKotakMasuk: React.FC<DivisiKotakMasukProps> = ({
  currentUser,
  koordinasiList,
  viewerDivision,
  panelTitle,
  panelSubtitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'semua' | 'baru' | 'sudah_dibaca'>('semua');

  const [replyingMsgId, setReplyingMsgId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const [composeDivisiKey, setComposeDivisiKey] = useState<DivisiBucketKey | null>(null);
  const [composeDrafts, setComposeDrafts] = useState<
    Record<string, { judul: string; prioritas: PrioritasKoordinasi; isi: string }>
  >({});

  const [expandedMsgIds, setExpandedMsgIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return koordinasiList.filter((msg) => {
      const isRead = (msg.dibacaOleh || []).includes(currentUser.id);
      if (filterMode === 'baru' && isRead) return false;
      if (filterMode === 'sudah_dibaca' && !isRead) return false;

      if (!q) return true;
      return (
        (msg.judul || '').toLowerCase().includes(q) ||
        (msg.isi || '').toLowerCase().includes(q) ||
        (msg.nomorTiket || '').toLowerCase().includes(q) ||
        (msg.pengirimNama || '').toLowerCase().includes(q) ||
        (msg.pengirimJabatan || '').toLowerCase().includes(q)
      );
    });
  }, [koordinasiList, searchQuery, filterMode, currentUser.id]);

  const unreadTotal = useMemo(
    () => koordinasiList.filter((m) => !(m.dibacaOleh || []).includes(currentUser.id)).length,
    [koordinasiList, currentUser.id]
  );

  const mendesakTotal = useMemo(
    () =>
      koordinasiList.filter(
        (m) => m.prioritas === 'Mendesak' && !(m.dibacaOleh || []).includes(currentUser.id)
      ).length,
    [koordinasiList, currentUser.id]
  );

  const groupedByDivision = useMemo(() => {
    const buckets: Record<DivisiBucketKey, PesanKoordinasi[]> = {
      'Ketua Pondok': [],
      Sekretaris: [],
      Bendahara: [],
      Perlengkapan: [],
      Keamanan: [],
      'Admin Pusat': [],
    };
    for (const msg of filteredMessages) {
      const key = resolveMessageBucket(msg, viewerDivision);
      buckets[key].push(msg);
    }
    return buckets;
  }, [filteredMessages, viewerDivision]);

  const visibleDivisions = useMemo(() => {
    return DIVISI_META_LIST.filter((meta) => {
      if (meta.key === viewerDivision || meta.key === 'Admin Pusat') {
        return groupedByDivision[meta.key].length > 0;
      }
      return true;
    });
  }, [viewerDivision, groupedByDivision]);

  const handleOpenComposeFor = (divKey: DivisiBucketKey) => {
    setComposeDivisiKey((prev) => (prev === divKey ? null : divKey));
    setComposeDrafts((prev) => ({
      ...prev,
      [divKey]: prev[divKey] || { judul: '', prioritas: 'Penting', isi: '' },
    }));
  };

  const handleSendNewToDivision = (divMeta: DivisiMeta) => {
    const draft = composeDrafts[divMeta.key] || { judul: '', prioritas: 'Penting', isi: '' };
    if (!draft.judul.trim() || !draft.isi.trim()) {
      showFeedback(`Judul dan isi pesan untuk ${divMeta.label} wajib diisi.`, 'error');
      return;
    }

    const now = new Date();
    const waktuNow =
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB (' +
      now.toISOString().split('T')[0] +
      ')';
    const prefix = viewerDivision.slice(0, 3).toUpperCase();

    const newMsg: PesanKoordinasi = {
      id: `krd_${Date.now()}`,
      nomorTiket: `${prefix}-${divMeta.key.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      judul: `[${viewerDivision.toUpperCase()} -> ${divMeta.label.toUpperCase()}] ${draft.judul.trim()}`,
      isi: draft.isi.trim(),
      prioritas: draft.prioritas || 'Penting',
      kategori: viewerDivision === 'Keamanan' ? 'Laporan Keamanan' : 'Kendala & Kebutuhan',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan || `Divisi ${viewerDivision}`,
      pengirimAvatar: currentUser.avatar || '',
      tujuan: divMeta.tujuanValue,
      waktu: waktuNow,
      tanggal: now.toISOString().split('T')[0],
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    };

    storageService.saveKoordinasi(newMsg);
    setComposeDrafts((prev) => ({
      ...prev,
      [divMeta.key]: { judul: '', prioritas: 'Penting', isi: '' },
    }));
    setComposeDivisiKey(null);
    showFeedback(`Pesan berhasil dikirim ke ${divMeta.label}.`);
  };

  const handleKirimTanggapan = (msg: PesanKoordinasi, divMeta: DivisiMeta) => {
    const text = (replyTextMap[msg.id] || '').trim();
    if (!text) {
      showFeedback('Isi tanggapan terlebih dahulu sebelum mengirim.', 'error');
      return;
    }

    const now = new Date();
    const waktuNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newReply: BalasanKoordinasi = {
      id: `bal_${Date.now()}`,
      pesanId: msg.id,
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan || `Divisi ${viewerDivision}`,
      pengirimAvatar: currentUser.avatar || '',
      isi: text,
      waktu: waktuNow,
    };

    storageService.markKoordinasiAsRead(msg.id, currentUser.id);
    storageService.balasKoordinasi(msg.id, newReply);

    setReplyTextMap((prev) => ({ ...prev, [msg.id]: '' }));
    setReplyingMsgId(null);
    showFeedback(`Tanggapan berhasil dikirim ke ${divMeta.label}.`);
  };

  return (
    <div className="space-y-5">
      {/* PUSAT INFORMASI TERPADU (KALENDER, PENGUMUMAN, UNDANGAN & NOTULENSI RAPAT) */}
      <PusatInformasiSection viewerLabel={`Divisi ${viewerDivision}`} />

      {/* HEADER & FILTER BAR */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-800/70 pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#f3d266] shrink-0" />
              <span>
                {panelTitle || `Kotak Masuk Pesan Lintas Divisi — ${viewerDivision}`}
              </span>
            </h2>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              {panelSubtitle ||
                'Tabel pesan dipisahkan per divisi agar mudah dibaca. Gunakan tombol Tanggapi dan ikon Kirim untuk membalas atau mengirim pesan ke divisi bersangkutan.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 tabular-nums">
            <span className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-700/60 text-[11px] font-mono text-emerald-200 font-bold">
              Total: {koordinasiList.length}
            </span>
            <span
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold ${
                unreadTotal > 0
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                  : 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
              }`}
            >
              Belum Dibaca: {unreadTotal}
            </span>
            {mendesakTotal > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-[11px] font-mono text-rose-200 font-bold">
                Mendesak: {mendesakTotal}
              </span>
            )}
          </div>
        </div>

        {/* SEARCH & STATUS SEGMENT */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pesan berdasarkan judul, pengirim, nomor tiket, atau isi..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800/80 text-xs text-white placeholder-emerald-200/45 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#02100a] border border-emerald-800/70 shrink-0">
            {[
              { id: 'semua', label: 'Semua Pesan' },
              { id: 'baru', label: `Pesan Baru (${unreadTotal})` },
              { id: 'sudah_dibaca', label: 'Sudah Dibaca' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterMode(opt.id as 'semua' | 'baru' | 'sudah_dibaca')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                  filterMode === opt.id
                    ? 'bg-[#d4af37] text-[#02120a]'
                    : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/45 text-emerald-200'
            }`}
          >
            {feedbackMsg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* TABEL PESAN TERPISAH DI SETIAP DIVISI */}
      <div className="space-y-4">
        {visibleDivisions.map((divMeta) => {
          const divMessages = groupedByDivision[divMeta.key] || [];
          const unreadInDiv = divMessages.filter(
            (m) => !(m.dibacaOleh || []).includes(currentUser.id)
          ).length;
          const isComposingHere = composeDivisiKey === divMeta.key;
          const draftHere = composeDrafts[divMeta.key] || {
            judul: '',
            prioritas: 'Penting' as PrioritasKoordinasi,
            isi: '',
          };

          return (
            <div
              key={divMeta.key}
              className="rounded-2xl bg-[#041d14]/95 border border-emerald-800/80 overflow-hidden shadow-lg"
            >
              {/* DIVISION HEADER */}
              <div className="px-4 py-3 bg-[#062419] border-b border-emerald-800/75 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${divMeta.accentClass}`}
                  >
                    {divMeta.label}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-200/85 tabular-nums">
                    {divMessages.length} pesan
                    {unreadInDiv > 0 ? (
                      <span className="ml-1.5 text-amber-300 font-bold">
                        · {unreadInDiv} pesan baru
                      </span>
                    ) : null}
                  </span>
                </div>

                {divMeta.key !== viewerDivision && (
                  <button
                    type="button"
                    onClick={() => handleOpenComposeFor(divMeta.key)}
                    className="px-3 py-1.5 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#f3d266] border border-[#d4af37]/45 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isComposingHere
                        ? 'Tutup Form Pesan'
                        : `Kirim Pesan ke ${divMeta.shortLabel}`}
                    </span>
                  </button>
                )}
              </div>

              {/* FORM KIRIM PESAN LANGSUNG KE DIVISI BERSANGKUTAN */}
              {isComposingHere && (
                <div className="p-3.5 bg-[#03160f] border-b border-emerald-800/75 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder={`Judul pesan untuk ${divMeta.label}...`}
                      value={draftHere.judul}
                      onChange={(e) =>
                        setComposeDrafts((prev) => ({
                          ...prev,
                          [divMeta.key]: { ...draftHere, judul: e.target.value },
                        }))
                      }
                      className="sm:col-span-9 px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    <select
                      value={draftHere.prioritas}
                      onChange={(e) =>
                        setComposeDrafts((prev) => ({
                          ...prev,
                          [divMeta.key]: {
                            ...draftHere,
                            prioritas: e.target.value as PrioritasKoordinasi,
                          },
                        }))
                      }
                      className="sm:col-span-3 px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-[#f3d266] font-bold focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="Normal">Prioritas: Normal</option>
                      <option value="Penting">Prioritas: Penting</option>
                      <option value="Mendesak">Prioritas: Mendesak</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Tulis pesan, koordinasi, atau permintaan ke ${divMeta.label}...`}
                      value={draftHere.isi}
                      onChange={(e) =>
                        setComposeDrafts((prev) => ({
                          ...prev,
                          [divMeta.key]: { ...draftHere, isi: e.target.value },
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendNewToDivision(divMeta);
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendNewToDivision(divMeta)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim ke {divMeta.shortLabel}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TABEL PESAN */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-900/70 text-[10px] font-mono uppercase text-emerald-300 bg-[#02110b]">
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Tiket &amp; Waktu</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Pengirim &amp; Tujuan</th>
                      <th className="py-2.5 px-3.5">Isi Pesan &amp; Balasan</th>
                      <th className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        Tanggapi &amp; Kirim
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50 text-xs">
                    {divMessages.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-5 px-4 text-center text-emerald-200/60">
                          Belum ada pesan dari atau untuk {divMeta.label}.
                        </td>
                      </tr>
                    ) : (
                      divMessages.map((msg) => {
                        const isRead = (msg.dibacaOleh || []).includes(currentUser.id);
                        const isReplying = replyingMsgId === msg.id;
                        const isOutgoingFromViewer =
                          resolveSenderDivisi(msg) === viewerDivision;
                        const balasanList = msg.balasan || [];
                        const hasDivReplied = balasanList.some(
                          (b) =>
                            b.pengirimId === currentUser.id ||
                            isReplyFromDivision(b.pengirimRole, viewerDivision)
                        );
                        const isExpanded = Boolean(expandedMsgIds[msg.id]);
                        const isLongContent = (msg.isi || '').length > 180;

                        return (
                          <React.Fragment key={msg.id}>
                            <tr
                              className={`align-top transition-colors ${
                                !isRead
                                  ? 'bg-[#072c1e]/55 hover:bg-[#083525]/70'
                                  : 'hover:bg-[#06281c]/40'
                              }`}
                            >
                              {/* TIKET & WAKTU */}
                              <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap tabular-nums">
                                <div className="font-bold text-[#f3d266]">{msg.nomorTiket}</div>
                                <div className="text-emerald-300/75 text-[10px] mt-0.5">
                                  {msg.waktu || msg.tanggal || '-'}
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                  {!isRead ? (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10px] font-bold">
                                      Pesan Baru
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                                      Dibaca
                                    </span>
                                  )}
                                  {msg.prioritas === 'Mendesak' ? (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/45 text-rose-200 text-[10px] font-bold inline-flex items-center gap-0.5">
                                      <AlertOctagon className="w-2.5 h-2.5" />
                                      Mendesak
                                    </span>
                                  ) : msg.prioritas === 'Penting' ? (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-600/45 text-amber-200 text-[10px] font-bold inline-flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      Penting
                                    </span>
                                  ) : null}
                                </div>
                              </td>

                              {/* PENGIRIM & TUJUAN */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="font-bold text-white">{msg.pengirimNama}</div>
                                <div className="text-[11px] text-emerald-200/75">
                                  {msg.pengirimJabatan || msg.pengirimRole}
                                </div>
                                <div className="mt-1 text-[10px] font-mono">
                                  {isOutgoingFromViewer ? (
                                    <span className="text-sky-300">
                                      Terkirim ke: {divMeta.shortLabel}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-300/80">
                                      Tujuan: {msg.tujuan}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* ISI PESAN & BALASAN */}
                              <td className="py-3 px-3.5 min-w-[240px] max-w-xl">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-bold text-white leading-snug">
                                    {msg.judul}
                                  </div>
                                  {hasDivReplied && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold whitespace-nowrap shrink-0">
                                      Sudah Ditanggapi
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={`text-xs text-emerald-100/85 whitespace-pre-line mt-1 ${
                                    !isExpanded && isLongContent ? 'line-clamp-3' : ''
                                  }`}
                                >
                                  {msg.isi}
                                </div>

                                {isLongContent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isRead) {
                                        storageService.markKoordinasiAsRead(
                                          msg.id,
                                          currentUser.id
                                        );
                                      }
                                      setExpandedMsgIds((prev) => ({
                                        ...prev,
                                        [msg.id]: !isExpanded,
                                      }));
                                    }}
                                    className="mt-1 text-[11px] font-bold text-[#f3d266] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        <span>Ringkas Pesan</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        <span>Baca Selengkapnya</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* RIWAYAT BALASAN */}
                                {balasanList.length > 0 && (
                                  <div className="mt-2.5 space-y-1.5 pl-2.5 border-l-2 border-[#d4af37]/45">
                                    {balasanList.map((b) => (
                                      <div
                                        key={b.id}
                                        className="px-2.5 py-1.5 rounded-lg bg-[#02120b] border border-emerald-800/70 text-[11px]"
                                      >
                                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#f3d266]">
                                          <span className="inline-flex items-center gap-1 font-bold">
                                            <CornerDownRight className="w-3 h-3" />
                                            {b.pengirimNama} ({b.pengirimJabatan || b.pengirimRole})
                                          </span>
                                          <span className="text-emerald-300/75 tabular-nums">
                                            {b.waktu}
                                          </span>
                                        </div>
                                        <p className="text-emerald-100 mt-0.5 whitespace-pre-line">
                                          {b.isi}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* TANGGAPI, ICON KIRIM & HAPUS */}
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isRead) {
                                        storageService.markKoordinasiAsRead(
                                          msg.id,
                                          currentUser.id
                                        );
                                      }
                                      setReplyingMsgId(isReplying ? null : msg.id);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c24a] text-[#02120a] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                    title={`Tanggapi pesan dari ${divMeta.label}`}
                                  >
                                    <Reply className="w-3.5 h-3.5" />
                                    <span>{isReplying ? 'Tutup' : 'Tanggapi'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isRead) {
                                        storageService.markKoordinasiAsRead(
                                          msg.id,
                                          currentUser.id
                                        );
                                      }
                                      if (divMeta.key !== viewerDivision) {
                                        setComposeDivisiKey(divMeta.key);
                                      } else {
                                        setReplyingMsgId(msg.id);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                    title={`Kirim pesan baru ke ${divMeta.label}`}
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Kirim</span>
                                  </button>

                                  {confirmDeleteId !== msg.id ? (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(msg.id)}
                                      className="p-1.5 rounded-lg bg-rose-950/85 hover:bg-rose-900 text-rose-200 border border-rose-500/45 cursor-pointer shrink-0"
                                      title="Hapus pesan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <div className="inline-flex items-center gap-1 bg-rose-950 border border-rose-500/60 rounded-lg px-1.5 py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          storageService.deleteKoordinasi(msg.id);
                                          setConfirmDeleteId(null);
                                          if (replyingMsgId === msg.id) setReplyingMsgId(null);
                                          showFeedback(`Pesan "${msg.judul}" dihapus.`);
                                        }}
                                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                                      >
                                        Hapus
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-200 text-[10px] font-bold cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* INLINE TANGGAPAN + ICON KIRIM */}
                            {isReplying && (
                              <tr className="bg-[#02120c]">
                                <td colSpan={4} className="px-4 py-3 border-t border-[#d4af37]/30">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#f3d266] whitespace-nowrap inline-flex items-center gap-1">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Balas ke {divMeta.shortLabel}:</span>
                                    </span>
                                    <input
                                      type="text"
                                      autoFocus
                                      placeholder={`Tulis tanggapan untuk ${msg.pengirimNama} (${divMeta.label})...`}
                                      value={replyTextMap[msg.id] || ''}
                                      onChange={(e) =>
                                        setReplyTextMap((prev) => ({
                                          ...prev,
                                          [msg.id]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleKirimTanggapan(msg, divMeta);
                                        }
                                      }}
                                      className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-[#d4af37]/50 text-xs text-white focus:outline-none focus:border-[#f3d266]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleKirimTanggapan(msg, divMeta)}
                                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                                      title={`Kirim tanggapan ke ${divMeta.label}`}
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Kirim Tanggapan</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
