import React, { useState } from 'react';
import { 
  DoorOpen, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  ShieldX, 
  Send, 
  User, 
  FileText,
  Eye,
  Check
} from 'lucide-react';
import { Perizinan, Santri, UserAccount, Pelanggaran } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { RadarMonitoringPerizinan } from './RadarMonitoringPerizinan';

interface GateScannerProps {
  perizinanList: Perizinan[];
  santriList: Santri[];
  currentUser: UserAccount;
  onViewSuratIzin: (izin: Perizinan) => void;
}

export const GateScanner: React.FC<GateScannerProps> = ({
  perizinanList,
  santriList,
  currentUser,
  onViewSuratIzin,
}) => {
  const [activeTab, setActiveTab] = useState<'checkout' | 'checkin'>('checkout');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPermitForAction, setSelectedPermitForAction] = useState<Perizinan | null>(null);
  const [documentationPhoto, setDocumentationPhoto] = useState<string>('');
  const [gateOfficerName, setGateOfficerName] = useState<string>(
    currentUser.role === 'petugas_gerbang' ? currentUser.nama : 'Kang Deden Suherman'
  );
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');
  const [showRadar, setShowRadar] = useState<boolean>(true);

  // Search results for Check-Out (Looks for approved permits ready for departure)
  const approvedPermits = perizinanList.filter(p => p.status === 'Disetujui');
  const searchedSantri = santriList.filter(s => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
  });

  // Santri currently outside (Ready for Check-In)
  const outsidePermits = perizinanList.filter(p => p.status === 'Sedang Keluar' || p.status === 'Terlambat');

  const handleSelectSantriForCheckout = (santri: Santri) => {
    // Check if santri has an approved permit
    const activePermit = approvedPermits.find(p => p.santriId === santri.id);
    if (!activePermit) {
      alert(`PERINGATAN POS GERBANG: Santri ${santri.nama} (${santri.nis}) TIDAK MEMILIKI SURAT IZIN AKTIF YANG DISETUJUI. Santri dilarang meninggalkan area pondok!`);
      return;
    }
    setSelectedPermitForAction(activePermit);
  };

  // Perform Check-Out
  const handleConfirmCheckout = (izin: Perizinan) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    const actualDeparture = `${dateStr} ${timeStr}`;

    const updated: Perizinan = {
      ...izin,
      status: 'Sedang Keluar',
      actualKeluar: actualDeparture,
      petugasKeluar: gateOfficerName,
      fotoKeluar: documentationPhoto || undefined,
    };

    storageService.savePerizinan(updated);
    storageService.addLog(
      'Check-Out Pos Gerbang',
      `Santri ${izin.santriNama} (${izin.santriNis}) resmi keluar gerbang. Petugas: ${gateOfficerName}`,
      'gerbang'
    );
    
    // Auto alert notification
    storageService.addNotification({
      judul: `Santri Keluar Gerbang: ${izin.santriNama}`,
      pesan: `Telah meninggalkan pondok pada pukul ${timeStr} WIB menuju ${izin.tujuan}. Batas kembali: ${izin.tglKembali} ${izin.jamKembali} WIB.`,
      tipe: 'info',
      linkMenu: 'monitoring',
      noWaTujuan: izin.noWaPenjemput,
      waPesanTemplate: WhatsAppTemplates.santriCheckOut(izin, actualDeparture, gateOfficerName),
    });

    setActionSuccessMessage(`Check-out berhasil dicatat untuk ${izin.santriNama} pada pukul ${timeStr} WIB.`);
    setSelectedPermitForAction(null);
    setDocumentationPhoto('');
  };

  // Perform Check-In
  const handleConfirmCheckin = (izin: Perizinan) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    const actualArrival = `${dateStr} ${timeStr}`;

    // Calculate tardiness
    // Deadline:
    const deadlineString = `${izin.tglKembali}T${izin.jamKembali}:00`;
    const deadlineDate = new Date(deadlineString);
    const diffMs = now.getTime() - deadlineDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const isLate = diffMinutes > 0;

    const updated: Perizinan = {
      ...izin,
      status: isLate ? 'Terlambat' : 'Sudah Kembali',
      actualKembali: actualArrival,
      petugasKembali: gateOfficerName,
      fotoKembali: documentationPhoto || undefined,
      menitKeterlambatan: isLate ? diffMinutes : 0,
    };

    storageService.savePerizinan(updated);
    storageService.addLog(
      'Check-In Pos Gerbang',
      `Santri ${izin.santriNama} kembali ke pondok pukul ${timeStr} WIB (${isLate ? `Terlambat ${diffMinutes} menit` : 'Tepat Waktu'})`,
      'gerbang'
    );

    // If late, auto-generate disciplinary record prompt
    if (isLate) {
      const pel: Pelanggaran = {
        id: `pel_late_${Date.now()}`,
        kodePelanggaran: `PEL-LATE-${Date.now().toString().slice(-4)}`,
        santriId: izin.santriId,
        santriNama: izin.santriNama,
        santriNis: izin.santriNis,
        santriGender: izin.santriGender,
        tanggal: dateStr,
        waktu: timeStr,
        tataTertibId: 'tt_004',
        jenisPelanggaran: `Terlambat kembali ke pondok selama ${diffMinutes} menit dari jadwal izin (${izin.jamKembali} WIB).`,
        kategori: 'Ringan',
        poin: 5,
        kronologi: `Santri keluar izin ${izin.jenisIzin} tujuan ${izin.tujuan}. Jadwal kepulangan maksimal ${izin.jamKembali} WIB, namun baru kembali ke Pos Gerbang pukul ${timeStr} WIB.`,
        lokasi: 'Pos Gerbang Utama Al-Maliki',
        namaPetugasPelapor: gateOfficerName,
        statusVerifikasi: 'Terverifikasi',
      };
      storageService.savePelanggaran(pel);

      storageService.addNotification({
        judul: `Santri Kembali TERLAMBAT: ${izin.santriNama}`,
        pesan: `Santri tiba di gerbang pukul ${timeStr} WIB (Terlambat ${diffMinutes} menit). Otomatis dicatat dalam berkas kedisiplinan.`,
        tipe: 'danger',
        linkMenu: 'pelanggaran',
        noWaTujuan: izin.noWaPenjemput,
        waPesanTemplate: WhatsAppTemplates.santriCheckIn(izin, actualArrival, `Terlambat ${diffMinutes} Menit`),
      });

      setActionSuccessMessage(`Check-in dicatat. PERHATIAN: ${izin.santriNama} TERLAMBAT ${diffMinutes} menit. Otomatis masuk catatan pelanggaran kedisiplinan.`);
    } else {
      storageService.addNotification({
        judul: `Santri Kembali Tepat Waktu: ${izin.santriNama}`,
        pesan: `Alhamdulillah santri telah kembali ke pondok pesantren dengan selamat pada pukul ${timeStr} WIB.`,
        tipe: 'success',
        linkMenu: 'pos_gerbang',
        noWaTujuan: izin.noWaPenjemput,
        waPesanTemplate: WhatsAppTemplates.santriCheckIn(izin, actualArrival, 'Tepat Waktu (Disiplin)'),
      });
      setActionSuccessMessage(`Alhamdulillah, check-in berhasil dicatat untuk ${izin.santriNama} (Tepat Waktu).`);
    }

    setSelectedPermitForAction(null);
    setDocumentationPhoto('');
  };

  const handleSimulatePhoto = () => {
    // Simulate real webcam capture at the gate
    setDocumentationPhoto('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Gate Officer Info - 3D Styled */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 metallic-glass-card p-6 rounded-3xl border border-slate-800/80 shadow-2xl hover-rainbow-edge">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 glow-cyan uppercase tracking-wider">
              <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />
              SENTRY PORTAL GATEWAY
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              PORTAL SCANNER READY
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase font-sans">
            Pos Gerbang Keamanan (Pencatatan Keluar-Masuk)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Pemeriksaan surat izin digital QR Code resmi, verifikasi hak keluar, dan pencatatan kepulangan santri
          </p>
        </div>

        {/* Officer on Duty input */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-mono shadow-inner hover-rainbow-edge">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400">Petugas Jaga:</span>
          <input
            type="text"
            value={gateOfficerName}
            onChange={(e) => setGateOfficerName(e.target.value)}
            className="bg-transparent font-bold text-amber-300 focus:outline-none border-b border-cyan-500/50 max-w-[140px] font-sans"
          />
        </div>
      </div>

      {/* Sentry Radar Controller HUD (Medium Size) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Live Sentry Radar Control & Monitoring Perizinan (Ukuran Sedang)
            </span>
          </div>
          <button
            onClick={() => setShowRadar(!showRadar)}
            className="text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer"
          >
            {showRadar ? 'Sembunyikan Radar' : 'Tampilkan Radar'}
          </button>
        </div>

        {showRadar && (
          <RadarMonitoringPerizinan
            perizinanList={perizinanList}
            onViewSuratIzin={onViewSuratIzin}
            size="medium"
          />
        )}
      </div>

      {/* Success banner if any */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center justify-between text-xs shadow-xl hover-rainbow-edge">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage('')} className="text-emerald-400 hover:text-white cursor-pointer font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* Mode Selector Tabs: CHECK-OUT (Keluar) vs CHECK-IN (Kembali) - 3D Styled */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setActiveTab('checkout');
            setSelectedPermitForAction(null);
          }}
          className={`tactile-interactive p-5 rounded-3xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xl hover-rainbow-edge ${
            activeTab === 'checkout'
              ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-950 border-amber-400/60 text-white rainbow-active-border'
              : 'metallic-glass-card border-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <ArrowRight className={`w-4 h-4 ${activeTab === 'checkout' ? 'text-amber-400' : 'text-slate-500'}`} />
              <h3 className="text-sm font-black uppercase font-sans tracking-wide">1. Check-Out Santri (Keluar Gerbang)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Verifikasi surat izin aktif sebelum santri diizinkan melewati portal
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/40 glow-gold">
            {approvedPermits.length} Izin Siap
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('checkin');
            setSelectedPermitForAction(null);
          }}
          className={`tactile-interactive p-5 rounded-3xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xl hover-rainbow-edge ${
            activeTab === 'checkin'
              ? 'bg-gradient-to-r from-cyan-500/20 via-slate-900 to-slate-950 border-cyan-400/60 text-white rainbow-active-border'
              : 'metallic-glass-card border-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <ArrowLeft className={`w-4 h-4 ${activeTab === 'checkin' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <h3 className="text-sm font-black uppercase font-sans tracking-wide">2. Check-In Santri (Kembali Masuk)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Pencatatan waktu kedatangan dan deteksi otomatis keterlambatan
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40 glow-cyan">
            {outsidePermits.length} Di Luar
          </span>
        </button>
      </div>

      {/* TAB 1: CHECK-OUT SECTION */}
      {activeTab === 'checkout' && (
        <div className="space-y-6">
          
          {/* Santri Lookup & Permit Validator - 3D Styled */}
          <div className="p-6 metallic-glass-card border border-slate-800/80 rounded-3xl space-y-4 shadow-xl hover-rainbow-edge">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-sans">
              <Search className="w-4 h-4 text-cyan-400" />
              Cari Santri atau Pindai Kartu Santri (Access Verification)
            </h2>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik NIS atau Nama Santri untuk verifikasi izin gerbang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
              />
            </div>

            {/* Quick Match List */}
            {searchQuery.trim() && (
              <div className="border border-slate-700/80 rounded-2xl bg-slate-950 p-3 space-y-2 max-h-60 overflow-y-auto shadow-inner font-mono">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hasil Pencarian Santri:</p>
                {searchedSantri.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">Santri tidak ditemukan.</p>
                ) : (
                  searchedSantri.map((s) => {
                    const permit = approvedPermits.find(p => p.santriId === s.id);
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-600 transition-colors hover-rainbow-edge shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <img src={s.foto} alt="" className="w-9 h-9 rounded-xl object-cover border border-amber-400/40" />
                          <div>
                            <p className="font-bold text-white font-sans">{s.nama}</p>
                            <p className="text-[11px] text-slate-400">NIS: <span className="text-cyan-300">{s.nis}</span> · {s.kelas}</p>
                          </div>
                        </div>

                        {permit ? (
                          <button
                            onClick={() => setSelectedPermitForAction(permit)}
                            className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-md border border-amber-300/60"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Izin Sah · Proses Check-Out</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-red-300 bg-red-950/80 border border-red-800 rounded-xl">
                            <ShieldX className="w-3.5 h-3.5 text-red-400" />
                            <span>Tidak Ada Izin Aktif</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* List of All Santri with Approved Permits Ready to Leave - 3D Styled */}
          <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover-rainbow-edge">
            <div className="px-6 py-4.5 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Daftar Surat Izin Sah yang Telah Disetujui (Siap Check-Out)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Santri dalam daftar ini memiliki surat resmi yang sah dan diizinkan keluar portal
                </p>
              </div>
              <span className="text-xs font-mono text-amber-300 font-bold px-2.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30">
                {approvedPermits.length} Santri Siap
              </span>
            </div>

            {approvedPermits.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-mono">
                Tidak ada surat izin yang berstatus disetujui untuk saat ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Santri</th>
                      <th className="px-4 py-3.5">Nomor & Jenis Izin</th>
                      <th className="px-4 py-3.5">Tujuan & Alasan</th>
                      <th className="px-4 py-3.5">Batas Kembali</th>
                      <th className="px-4 py-3.5">Penjemput</th>
                      <th className="px-6 py-3.5 text-right">Tindakan Gerbang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                    {approvedPermits.map((izin) => (
                      <tr key={izin.id} className="table-row-rainbow transition-all cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white font-sans">{izin.santriNama}</div>
                          <div className="text-[11px] text-slate-400">
                            NIS: <span className="text-cyan-300">{izin.santriNis}</span> · {izin.santriKelas}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-[11px]">
                            {izin.jenisIzin}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">{izin.nomorIzin}</div>
                        </td>
                        <td className="px-4 py-4 font-sans">
                          <div className="text-slate-200 font-medium">{izin.tujuan}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{izin.alasan}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-red-400 font-bold tabular-nums">{izin.jamKembali} WIB</span>
                          <div className="text-[10px] text-slate-400">{izin.tglKembali}</div>
                        </td>
                        <td className="px-4 py-4 font-sans">
                          <div className="text-slate-200">{izin.namaPenjemput}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">{izin.noWaPenjemput}</div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => onViewSuratIzin(izin)}
                            className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-cyan-500/40"
                            title="Periksa Surat Izin Resmi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedPermitForAction(izin)}
                            className="tactile-interactive px-3.5 py-1.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all cursor-pointer shadow-md border border-amber-300/60"
                          >
                            Proses Keluar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: CHECK-IN SECTION (Santri Kembali) */}
      {/* TAB 2: CHECK-IN SECTION (Santri Kembali) */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover-rainbow-edge">
            <div className="px-6 py-4.5 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans tracking-wide">
                  <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  Santri yang Sedang di Luar Pondok (Menunggu Kepulangan)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Klik "Catat Kedatangan" saat santri melapor di pos gerbang
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-300 font-bold px-2.5 py-0.5 rounded-lg bg-emerald-400/10 border border-emerald-400/30 glow-cyan">
                {outsidePermits.length} Santri di Luar
              </span>
            </div>

            {outsidePermits.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-mono">
                Tidak ada santri yang sedang berada di luar area pondok saat ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Santri</th>
                      <th className="px-4 py-3.5">Waktu Keluar Gerbang</th>
                      <th className="px-4 py-3.5">Jadwal Batas Kembali</th>
                      <th className="px-4 py-3.5">Penjemput</th>
                      <th className="px-4 py-3.5">Status Saat Ini</th>
                      <th className="px-6 py-3.5 text-right">Tindakan Kedatangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                    {outsidePermits.map((izin) => (
                      <tr key={izin.id} className="table-row-rainbow transition-all cursor-pointer">
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-white font-sans">{izin.santriNama}</div>
                          <div className="text-[11px] text-slate-400">
                            NIS: <span className="text-cyan-300">{izin.santriNis}</span> · {izin.santriKelas}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums text-slate-200">
                          {izin.actualKeluar || `${izin.tglKeluar} ${izin.jamKeluar}`}
                          <div className="text-[10px] text-slate-400">Petugas: {izin.petugasKeluar || '-'}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-red-400 font-bold">{izin.jamKembali} WIB</span>
                          <div className="text-[10px] text-slate-400">{izin.tglKembali}</div>
                        </td>
                        <td className="px-4 py-3.5 font-sans">
                          <div className="text-slate-200">{izin.namaPenjemput}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">{izin.noWaPenjemput}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {izin.status === 'Terlambat' ? (
                            <span className="text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                              Terlambat ({izin.menitKeterlambatan || 30} menit)
                            </span>
                          ) : (
                            <span className="text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                              Sedang di Luar
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedPermitForAction(izin)}
                            className="tactile-interactive px-3.5 py-1.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl transition-all cursor-pointer shadow-md border border-emerald-300/60"
                          >
                            Catat Kedatangan (Check-In)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Confirmation Modal (for Check-Out or Check-In) */}
      {selectedPermitForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <DoorOpen className="w-4 h-4 text-amber-400" />
                {activeTab === 'checkout' ? 'Konfirmasi Keluar Gerbang (Check-Out)' : 'Konfirmasi Kedatangan Masuk (Check-In)'}
              </h3>
              <button 
                onClick={() => setSelectedPermitForAction(null)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              {/* Santri Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm font-sans">{selectedPermitForAction.santriNama}</span>
                  <span className="text-amber-400 font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                    NIS: {selectedPermitForAction.santriNis}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-2 border-t border-slate-800">
                  <p>Kelas: <span className="text-cyan-300 font-semibold">{selectedPermitForAction.santriKelas}</span></p>
                  <p>Kamar: <span className="text-white">{selectedPermitForAction.santriKamar}</span></p>
                  <p>Jenis: <strong className="text-amber-300">{selectedPermitForAction.jenisIzin}</strong></p>
                  <p>Batas: <strong className="text-rose-400">{selectedPermitForAction.tglKembali} {selectedPermitForAction.jamKembali} WIB</strong></p>
                  <p className="col-span-2 font-sans">Tujuan: <span className="text-slate-200">{selectedPermitForAction.tujuan}</span></p>
                  <p className="col-span-2">Penjemput: <span className="text-slate-200 font-sans">{selectedPermitForAction.namaPenjemput}</span> (<span className="text-emerald-400">{selectedPermitForAction.noWaPenjemput}</span>)</p>
                </div>
              </div>

              {/* Photo Documentation Feature */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider">Dokumentasi Foto Santri / Penjemput di Gerbang</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSimulatePhoto}
                    className="tactile-interactive inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer hover-rainbow-edge"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Ambil Foto Snapshot Pos Gerbang</span>
                  </button>

                  {documentationPhoto && (
                    <div className="flex items-center gap-2.5">
                      <img src={documentationPhoto} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-400 shadow-md" />
                      <span className="text-[11px] text-emerald-400 font-bold">Foto siap terlampir</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPermitForAction(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>

                {activeTab === 'checkout' ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmCheckout(selectedPermitForAction)}
                    className="tactile-interactive px-5 py-2 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                  >
                    Simpan Check-Out (Buka Portal)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmCheckin(selectedPermitForAction)}
                    className="tactile-interactive px-5 py-2 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl cursor-pointer shadow-lg border border-emerald-300/60"
                  >
                    Simpan Check-In (Santri Masuk)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
