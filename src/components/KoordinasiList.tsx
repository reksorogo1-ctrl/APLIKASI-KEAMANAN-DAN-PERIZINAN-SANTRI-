import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  MessageSquare, 
  Search, 
  Plus, 
  Paperclip, 
  FileText, 
  Image, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Filter, 
  CheckCheck, 
  ChevronRight, 
  X,
  ExternalLink,
  CornerDownRight,
  Sparkles
} from 'lucide-react';
import { 
  PesanKoordinasi, 
  BalasanKoordinasi, 
  PrioritasKoordinasi, 
  StatusKoordinasi, 
  KategoriKoordinasi, 
  UserAccount 
} from '../types';
import { storageService } from '../services/storageService';

interface KoordinasiListProps {
  currentUser: UserAccount;
  koordinasiList: PesanKoordinasi[];
  initialSelectedId?: string | null;
}

export const KoordinasiList: React.FC<KoordinasiListProps> = ({
  currentUser,
  koordinasiList,
  initialSelectedId,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Active selected ticket
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialSelectedId || (koordinasiList.length > 0 ? koordinasiList[0].id : null)
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPrioritas, setFilterPrioritas] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [isTindakLanjutModalOpen, setIsTindakLanjutModalOpen] = useState<boolean>(false);
  const [tindakLanjutNote, setTindakLanjutNote] = useState<string>('');

  // Reply input
  const [replyText, setReplyText] = useState<string>('');
  const [replyAttachmentNama, setReplyAttachmentNama] = useState<string>('');

  // Compose Form Data
  const [composeData, setComposeData] = useState({
    judul: '',
    kategori: (isAdmin ? 'Instruksi Admin' : 'Laporan Keamanan') as KategoriKoordinasi,
    prioritas: 'Normal' as PrioritasKoordinasi,
    isi: '',
    lampiranNama: '',
    lampiranUrl: '',
    lampiranTipe: 'dokumen' as 'dokumen' | 'foto' | 'link',
  });

  // Automatically mark as read when selecting ticket
  useEffect(() => {
    if (selectedTicketId) {
      storageService.markKoordinasiAsRead(selectedTicketId, currentUser.id);
    }
  }, [selectedTicketId, currentUser.id]);

  const selectedTicket = koordinasiList.find(p => p.id === selectedTicketId) || null;

  // Filtered list
  const filteredList = koordinasiList.filter(item => {
    if (filterPrioritas !== 'all' && item.prioritas !== filterPrioritas) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterKategori !== 'all' && item.kategori !== filterKategori) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.judul.toLowerCase().includes(q) ||
        item.isi.toLowerCase().includes(q) ||
        item.nomorTiket.toLowerCase().includes(q) ||
        item.pengirimNama.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = koordinasiList.filter(p => !p.dibacaOleh.includes(currentUser.id)).length;
  const mendesakCount = koordinasiList.filter(p => p.prioritas === 'Mendesak' && p.status !== 'Ditindaklanjuti').length;

  const handleOpenCompose = () => {
    setComposeData({
      judul: '',
      kategori: isAdmin ? 'Instruksi Admin' : 'Laporan Keamanan',
      prioritas: 'Normal',
      isi: '',
      lampiranNama: '',
      lampiranUrl: '',
      lampiranTipe: 'dokumen',
    });
    setIsComposeOpen(true);
  };

  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.judul.trim() || !composeData.isi.trim()) {
      alert('Judul dan isi pesan koordinasi wajib diisi.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const newTicket: PesanKoordinasi = {
      id: `kor_${Date.now()}`,
      nomorTiket: `${isAdmin ? 'DISP-ADM' : 'LAP-DK'}-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      judul: composeData.judul.trim(),
      isi: composeData.isi.trim(),
      prioritas: composeData.prioritas,
      kategori: composeData.kategori,
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan,
      pengirimAvatar: currentUser.avatar,
      tujuan: isAdmin ? 'semua_dewan' : 'admin',
      waktu: `Hari Ini, ${timeStr} WIB (${dateStr})`,
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      lampiranNama: composeData.lampiranNama ? composeData.lampiranNama : undefined,
      lampiranUrl: composeData.lampiranUrl ? composeData.lampiranUrl : (composeData.lampiranNama ? '#' : undefined),
      lampiranTipe: composeData.lampiranTipe,
      balasan: [],
    };

    storageService.saveKoordinasi(newTicket);
    setIsComposeOpen(false);
    setSelectedTicketId(newTicket.id);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newReply: BalasanKoordinasi = {
      id: `bal_${Date.now()}`,
      pesanId: selectedTicket.id,
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan,
      pengirimAvatar: currentUser.avatar,
      isi: replyText.trim(),
      waktu: `Hari Ini, ${timeStr} WIB`,
      lampiranNama: replyAttachmentNama ? replyAttachmentNama : undefined,
      lampiranUrl: replyAttachmentNama ? '#' : undefined,
    };

    storageService.balasKoordinasi(selectedTicket.id, newReply);
    setReplyText('');
    setReplyAttachmentNama('');
  };

  const handleConfirmTindakLanjut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !tindakLanjutNote.trim()) return;

    storageService.tindakLanjutiKoordinasi(selectedTicket.id, tindakLanjutNote.trim(), currentUser.nama);
    setIsTindakLanjutModalOpen(false);
    setTindakLanjutNote('');
  };

  return (
    <div className="space-y-6">
      
      {/* 3D Telemetry Command Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 shadow-2xl metallic-glass-card hover-rainbow-edge p-6">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-400 via-amber-400 to-blue-600 opacity-70" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs glow-cyan uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                KOMUNIKASI INTERNAL TERENKRIPSI
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                {isAdmin ? 'KOMANDO ADMIN & DEWAN KEAMANAN' : 'JALUR PENGURUS KE ADMIN PUSAT'}
              </span>
              {mendesakCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-red-950/90 text-red-300 border border-red-500/60 animate-pulse glow-red">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  {mendesakCount} PESAN MENDESAK
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2 font-sans uppercase">
              Pusat Koordinasi & Disposisi Internal Komando
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-sans max-w-2xl">
              Saluran resmi koordinasi real-time instruksi pimpinan, laporan kejadian darurat, penyampaian kendala patroli pos gerbang, dan tindak lanjut tugas keamanan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCompose}
              className="tactile-interactive inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all shadow-xl cursor-pointer border border-amber-300/60 hover-rainbow-edge"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{isAdmin ? 'Kirim Instruksi Komando' : 'Kirim Laporan ke Admin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 font-mono text-xs hover-rainbow-edge">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tiket, judul pesan, nama pengirim, atau isi disposisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all text-xs"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Prioritas Filter */}
          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
          >
            <option value="all">Semua Prioritas</option>
            <option value="Mendesak">🚨 Mendesak</option>
            <option value="Penting">⚠️ Penting</option>
            <option value="Normal">ℹ️ Normal</option>
          </select>

          {/* Kategori Filter */}
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
          >
            <option value="all">Semua Kategori</option>
            <option value="Instruksi Admin">Instruksi Admin</option>
            <option value="Laporan Keamanan">Laporan Keamanan</option>
            <option value="Kendala & Kebutuhan">Kendala & Kebutuhan</option>
            <option value="Laporan Kejadian">Laporan Kejadian</option>
            <option value="Tanggapan Instruksi">Tanggapan Instruksi</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
          >
            <option value="all">Semua Status</option>
            <option value="Terkirim">Terkirim</option>
            <option value="Dibaca">Dibaca</option>
            <option value="Ditindaklanjuti">Ditindaklanjuti</option>
          </select>

          {(filterPrioritas !== 'all' || filterKategori !== 'all' || filterStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterPrioritas('all');
                setFilterKategori('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Tickets List (Left) & Thread Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIST OF DISPATCH TICKETS (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-400">
            <span>Daftar Disposisi & Laporan ({filteredList.length})</span>
            {unreadCount > 0 && (
              <span className="text-amber-300 font-bold">{unreadCount} Belum Dibaca</span>
            )}
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="metallic-glass-card rounded-2xl p-8 border border-slate-800/80 text-center text-slate-400 text-xs font-mono">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                Tidak ada pesan koordinasi yang sesuai filter pencarian.
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = item.id === selectedTicketId;
                const isUnread = !item.dibacaOleh.includes(currentUser.id);
                const isMendesak = item.prioritas === 'Mendesak';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTicketId(item.id)}
                    className={`tactile-interactive p-4 rounded-2xl border transition-all cursor-pointer relative hover-rainbow-edge shadow-md ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border-cyan-400/80 rainbow-active-border glow-cyan'
                        : isMendesak && item.status !== 'Ditindaklanjuti'
                        ? 'bg-red-950/30 border-red-500/50 hover:bg-slate-900/90'
                        : 'metallic-glass-card border-slate-800/80 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                          item.prioritas === 'Mendesak'
                            ? 'bg-red-600/30 text-red-300 border border-red-500/50 glow-red animate-pulse'
                            : item.prioritas === 'Penting'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 glow-gold'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {item.prioritas === 'Mendesak' ? '🚨 MENDESAK' : item.prioritas === 'Penting' ? '⚠️ PENTING' : 'NORMAL'}
                        </span>
                        <span className="text-slate-400">{item.nomorTiket}</span>
                      </div>

                      {/* Status */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Ditindaklanjuti'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : item.status === 'Dibaca'
                          ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-xs font-sans tracking-wide line-clamp-1 mb-1">
                      {item.judul}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 font-sans mb-3 leading-relaxed">
                      {item.isi}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-semibold truncate max-w-[140px] font-sans">
                          {item.pengirimNama}
                        </span>
                        <span>·</span>
                        <span className="text-cyan-400 truncate max-w-[110px]">
                          {item.kategori}
                        </span>
                      </div>
                      <span className="tabular-nums">{item.waktu.split('(')[0]}</span>
                    </div>

                    {item.balasan.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-300 font-mono">
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span>{item.balasan.length} Tanggapan balasan</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE THREAD & ACTIONS (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[600px] hover-rainbow-edge">
              
              {/* Thread Header Banner */}
              <div className={`p-6 border-b border-slate-800/80 relative overflow-hidden ${
                selectedTicket.prioritas === 'Mendesak'
                  ? 'bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-950'
                  : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2 font-mono text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                      selectedTicket.prioritas === 'Mendesak'
                        ? 'bg-red-600 text-white shadow-md glow-red animate-pulse'
                        : selectedTicket.prioritas === 'Penting'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 glow-gold'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      PRIORITAS: {selectedTicket.prioritas.toUpperCase()}
                    </span>
                    <span className="text-slate-400 font-bold">{selectedTicket.nomorTiket}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-cyan-300 font-semibold">{selectedTicket.kategori}</span>
                  </div>

                  {/* Status Indicator */}
                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                    selectedTicket.status === 'Ditindaklanjuti'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 glow-cyan'
                      : selectedTicket.status === 'Dibaca'
                      ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {selectedTicket.status === 'Ditindaklanjuti' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>STATUS: {selectedTicket.status.toUpperCase()}</span>
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-white font-sans tracking-tight mb-3">
                  {selectedTicket.judul}
                </h2>

                {/* Sender & Timestamp Bar */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  <img
                    src={selectedTicket.pengirimAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                    alt={selectedTicket.pengirimNama}
                    className="w-10 h-10 rounded-xl object-cover border border-amber-400/40 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-sans text-sm">{selectedTicket.pengirimNama}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                        {selectedTicket.pengirimRole.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {selectedTicket.pengirimJabatan || 'Pejabat Keamanan'} · {selectedTicket.waktu}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body Content */}
              <div className="p-6 flex-1 space-y-6">
                
                {/* Main Instruction/Report Text */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-line shadow-inner">
                  {selectedTicket.isi}
                </div>

                {/* Attachment if present */}
                {selectedTicket.lampiranNama && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="font-bold text-white font-sans">{selectedTicket.lampiranNama}</p>
                        <p className="text-[10px] text-slate-400">Lampiran Berkas Koordinasi</p>
                      </div>
                    </div>
                    {selectedTicket.lampiranUrl && selectedTicket.lampiranUrl !== '#' ? (
                      <a
                        href={selectedTicket.lampiranUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Berkas</span>
                      </a>
                    ) : (
                      <span className="px-3 py-1 text-[11px] bg-slate-800 text-slate-300 rounded-lg">
                        Tersimpan di Dokumen Pusat
                      </span>
                    )}
                  </div>
                )}

                {/* Tindak Lanjut Card or Action */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Status Tindak Lanjut & Eksekusi Lapangan
                    </span>

                    {/* Button for Admin to follow up if not yet completed */}
                    {selectedTicket.status !== 'Ditindaklanjuti' && (
                      <button
                        onClick={() => {
                          setTindakLanjutNote('');
                          setIsTindakLanjutModalOpen(true);
                        }}
                        className="tactile-interactive px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 cursor-pointer shadow-md"
                      >
                        Tandai Telah Ditindaklanjuti
                      </button>
                    )}
                  </div>

                  {selectedTicket.status === 'Ditindaklanjuti' ? (
                    <div className="text-xs text-slate-300 font-sans pt-1">
                      <p className="text-emerald-400 font-bold mb-1">
                        ✓ Telah ditindaklanjuti oleh: {selectedTicket.tindakLanjutOleh || 'Admin / Dewan Keamanan'} ({selectedTicket.tindakLanjutWaktu || 'WIB'})
                      </p>
                      <p className="text-slate-300 italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        "{selectedTicket.tindakLanjutCatatan || 'Instruksi telah dikoordinasikan dan diselesaikan di lapangan.'}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono pt-1">
                      Menunggu tindak lanjut resmi atau konfirmasi penyelesaian dari pejabat berwenang.
                    </p>
                  )}
                </div>

                {/* Replies / Tanggapan Thread */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      Riwayat Tanggapan & Balasan ({selectedTicket.balasan.length})
                    </span>
                    <span>Kronologi waktu komunikasi</span>
                  </div>

                  {selectedTicket.balasan.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono italic py-2">
                      Belum ada tanggapan balasan pada tiket koordinasi ini.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTicket.balasan.map((bal) => (
                        <div
                          key={bal.id}
                          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-300 font-sans">{bal.pengirimNama}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {bal.pengirimRole}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{bal.waktu}</span>
                          </div>
                          <p className="text-xs text-slate-200 font-sans leading-relaxed">
                            {bal.isi}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input Box */}
                  <form onSubmit={handleSendReply} className="pt-3 space-y-2">
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Ketik balasan atau tanggapan sebagai ${currentUser.nama}...`}
                        className="w-full px-4 py-2.5 text-xs bg-slate-950/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans shadow-inner transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Lampiran nama berkas/dokumen (opsional)..."
                        value={replyAttachmentNama}
                        onChange={(e) => setReplyAttachmentNama(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 flex-1"
                      />
                      <button
                        type="submit"
                        className="tactile-interactive inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-xl cursor-pointer shadow-md"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        <span>Kirim Balasan</span>
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            </div>
          ) : (
            <div className="metallic-glass-card border border-slate-800/80 rounded-3xl p-12 text-center text-slate-400 text-xs font-mono flex flex-col items-center justify-center min-h-[500px]">
              <Radio className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <p className="font-bold text-slate-300 text-sm mb-1 font-sans">
                Pilih Pesan Koordinasi untuk Menampilkan Detail
              </p>
              <p className="text-slate-500 max-w-sm">
                Klik salah satu tiket pada daftar di sebelah kiri untuk membaca instruksi, melampirkan berkas, atau membalas pesan.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Compose Modal (Admin Instruksi or Dewan Laporan) */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <Radio className="w-4 h-4 text-amber-400" />
                {isAdmin ? 'Penerbitan Instruksi Komando Admin' : 'Pengiriman Laporan / Informasi Dewan Keamanan'}
              </h3>
              <button 
                onClick={() => setIsComposeOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Judul Pesan / Perintah / Laporan
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAdmin ? 'Contoh: Instruksi Pengamanan Malam Imtihan & Jam Malam' : 'Contoh: Laporan Kerusakan Lampu Sektor Barat'}
                  value={composeData.judul}
                  onChange={(e) => setComposeData({ ...composeData, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-sans focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Kategori Komunikasi
                  </label>
                  <select
                    value={composeData.kategori}
                    onChange={(e) => setComposeData({ ...composeData, kategori: e.target.value as KategoriKoordinasi })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    {isAdmin ? (
                      <>
                        <option value="Instruksi Admin">Instruksi Admin</option>
                        <option value="Tanggapan Instruksi">Tanggapan Instruksi</option>
                      </>
                    ) : (
                      <>
                        <option value="Laporan Keamanan">Laporan Keamanan</option>
                        <option value="Kendala & Kebutuhan">Kendala & Kebutuhan</option>
                        <option value="Laporan Kejadian">Laporan Kejadian</option>
                        <option value="Tanggapan Instruksi">Tanggapan Instruksi</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={composeData.prioritas}
                    onChange={(e) => setComposeData({ ...composeData, prioritas: e.target.value as PrioritasKoordinasi })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="Normal">ℹ️ Normal (Operasional Biasa)</option>
                    <option value="Penting">⚠️ Penting (Butuh Perhatian Segera)</option>
                    <option value="Mendesak">🚨 Mendesak (Darurat & Tindakan Kilat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Uraian Lengkap Pesan / Instruksi / Laporan
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ketik instruksi, perincian kejadian, atau kendala lapangan secara mendetail..."
                  value={composeData.isi}
                  onChange={(e) => setComposeData({ ...composeData, isi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-sans focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Nama Lampiran Dokumen / Foto (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Foto_CCTV_Rusak.jpg atau Berita_Acara.pdf"
                    value={composeData.lampiranNama}
                    onChange={(e) => setComposeData({ ...composeData, lampiranNama: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                    Jenis Lampiran
                  </label>
                  <select
                    value={composeData.lampiranTipe}
                    onChange={(e) => setComposeData({ ...composeData, lampiranTipe: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="dokumen">Dokumen PDF / Berkas</option>
                    <option value="foto">Foto Bukti / Kamera Gerbang</option>
                    <option value="link">Tautan Eksternal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Kirim Pesan Koordinasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tindak Lanjut Modal */}
      {isTindakLanjutModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Catatan Tindak Lanjut Tiket
              </h3>
              <button 
                onClick={() => setIsTindakLanjutModalOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTindakLanjut} className="p-6 space-y-4 text-xs font-mono">
              <p className="text-slate-300">
                Tiket: <span className="font-bold text-amber-300">{selectedTicket.nomorTiket}</span> - {selectedTicket.judul}
              </p>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Uraian Tindakan / Solusi yang Dijalankan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Misal: Sarpras telah mengganti lampu sorot pukul 15.00 WIB dan 4 senter telah dibagikan..."
                  value={tindakLanjutNote}
                  onChange={(e) => setTindakLanjutNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-sans focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTindakLanjutModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl cursor-pointer shadow-lg border border-emerald-300/60"
                >
                  Konfirmasi Selesai Ditindaklanjuti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
