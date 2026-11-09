import React, { useState } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Printer, 
  Share2, 
  X, 
  Check, 
  Calendar, 
  AlertCircle,
  FileText,
  User,
  MapPin,
  QrCode,
  ScanLine
} from 'lucide-react';
import { Perizinan, Santri, StatusIzin, JenisIzin, UserAccount } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';

interface PerizinanListProps {
  perizinanList: Perizinan[];
  santriList: Santri[];
  currentUser: UserAccount;
  onViewSuratIzin: (izin: Perizinan) => void;
  onOpenQRScanner?: () => void;
}

export const PerizinanList: React.FC<PerizinanListProps> = ({
  perizinanList,
  santriList,
  currentUser,
  onViewSuratIzin,
  onOpenQRScanner,
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedJenisTab, setSelectedJenisTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Form State for new permit request
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [formData, setFormData] = useState({
    jenisIzin: 'Izin Keluar' as JenisIzin,
    tglKeluar: todayStr,
    jamKeluar: '09:00',
    tglKembali: todayStr,
    jamKembali: '16:00',
    alasan: '',
    tujuan: '',
    namaPenjemput: '',
    noWaPenjemput: '',
    hubunganPenjemput: 'Orang Tua / Wali',
  });

  const handleSantriSelect = (santriId: string) => {
    setSelectedSantriId(santriId);
    const santri = santriList.find(s => s.id === santriId);
    if (santri) {
      setFormData(prev => ({
        ...prev,
        namaPenjemput: santri.namaWali,
        noWaPenjemput: santri.noWaWali,
      }));
    }
  };

  const handleCreatePermit = (e: React.FormEvent) => {
    e.preventDefault();
    const santri = santriList.find(s => s.id === selectedSantriId);
    if (!santri) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }

    const counter = perizinanList.length + 1;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const currentRoman = romanMonths[now.getMonth()];

    const newPermit: Perizinan = {
      id: `iz_${Date.now()}`,
      nomorIzin: `IZIN/MALIKI/${now.getFullYear()}/${currentRoman}/${counter.toString().padStart(3, '0')}`,
      santriId: santri.id,
      santriNama: santri.nama,
      santriNis: santri.nis,
      santriGender: santri.gender,
      santriKelas: santri.kelas,
      santriKamar: santri.kamar,
      jenisIzin: formData.jenisIzin,
      tglKeluar: formData.tglKeluar,
      jamKeluar: formData.jamKeluar,
      tglKembali: formData.tglKembali,
      jamKembali: formData.jamKembali,
      alasan: formData.alasan,
      tujuan: formData.tujuan,
      namaPenjemput: formData.namaPenjemput,
      noWaPenjemput: formData.noWaPenjemput,
      hubunganPenjemput: formData.hubunganPenjemput,
      status: 'Diajukan',
      tglPengajuan: `${todayStr} ${timeStr}`,
      petugasPencatat: currentUser.nama,
      riwayatPersetujuan: [
        {
          role: currentUser.role,
          nama: currentUser.nama,
          tanggal: `${todayStr} ${timeStr}`,
          status: 'Setuju',
          catatan: `Permohonan izin diinput manual oleh pengurus ${currentUser.nama}`,
        }
      ],
    };

    storageService.savePerizinan(newPermit);
    storageService.addLog(
      'Pengajuan Izin',
      `Izin diajukan oleh pengurus ${currentUser.nama} untuk santri ${santri.nama} (${formData.jenisIzin})`,
      'izin'
    );
    storageService.addNotification({
      judul: 'Pengajuan Izin Baru Masuk',
      pesan: `Permohonan izin diajukan oleh pengurus ${currentUser.nama} (${currentUser.jabatan}) untuk santri ${santri.nama} (${santri.kelas}) tujuan ${formData.tujuan}. Terkonfigurasi langsung ke database pusat admin.`,
      tipe: 'info',
      linkMenu: 'perizinan',
    });

    setIsAddModalOpen(false);
  };

  // Multistage Approval: Step 1 Verifikasi (by Anggota Keamanan)
  const handleVerifikasi = (izin: Perizinan) => {
    const updated: Perizinan = {
      ...izin,
      status: 'Diverifikasi',
      riwayatPersetujuan: [
        ...izin.riwayatPersetujuan,
        {
          role: 'Biro Keamanan',
          nama: currentUser.nama,
          tanggal: new Date().toLocaleString('id-ID'),
          status: 'Setuju',
          catatan: 'Dokumen dan alasan telah diverifikasi kelengkapannya.',
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Verifikasi Izin', `Memverifikasi berkas izin ${izin.nomorIzin}`, 'izin');
  };

  // Multistage Approval: Step 2 Final Approval (by Ketua Keamanan / Ketua Pondok / Admin)
  const handleSetujui = (izin: Perizinan) => {
    const updated: Perizinan = {
      ...izin,
      status: 'Disetujui',
      disetujuiOleh: currentUser.nama,
      riwayatPersetujuan: [
        ...izin.riwayatPersetujuan,
        {
          role: currentUser.role === 'admin' ? 'Super Admin' : 'Ketua Keamanan',
          nama: currentUser.nama,
          tanggal: new Date().toLocaleString('id-ID'),
          status: 'Setuju',
          catatan: 'Disetujui. Harap menjaga marwah dan kembali sesuai batas waktu.',
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Persetujuan Izin', `Menyetujui surat izin ${izin.nomorIzin} oleh ${currentUser.nama}`, 'izin');
    
    // Auto add notification to pengurus and admin
    storageService.addNotification({
      judul: `Izin Disetujui: ${izin.santriNama}`,
      pesan: `Permohonan izin untuk ${izin.santriNama} telah disetujui oleh ${currentUser.nama}. Surat perizinan digital resmi dengan QR code otomatis terbuka untuk dicetak.`,
      tipe: 'success',
      linkMenu: 'perizinan',
      noWaTujuan: izin.noWaPenjemput,
      waPesanTemplate: WhatsAppTemplates.izinDisetujui(updated),
    });

    // Otomatis munculkan surat izin digital ber-QR code untuk langsung dicetak
    onViewSuratIzin(updated);
  };

  // Reject with reason - triggers "Harap menghubungi ketua pondok" notification
  const handleTolak = () => {
    if (!rejectionModalId) return;
    const target = perizinanList.find(i => i.id === rejectionModalId);
    if (!target) return;

    const updated: Perizinan = {
      ...target,
      status: 'Ditolak',
      catatanPenolakan: rejectionReason ? `Harap menghubungi ketua pondok (${rejectionReason})` : 'Harap menghubungi ketua pondok',
      riwayatPersetujuan: [
        ...target.riwayatPersetujuan,
        {
          role: currentUser.role,
          nama: currentUser.nama,
          tanggal: new Date().toLocaleString('id-ID'),
          status: 'Tolak',
          catatan: rejectionReason || 'Harap menghubungi ketua pondok',
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Penolakan Izin', `Menolak perizinan ${target.nomorIzin}: Harap menghubungi ketua pondok`, 'izin');
    
    // Required notification for rejection on pengurus dashboard
    storageService.addNotification({
      judul: `Izin Ditolak: ${target.santriNama}`,
      pesan: `Harap menghubungi ketua pondok. Pengajuan perizinan santri ${target.santriNama} (${target.nomorIzin}) telah ditolak.`,
      tipe: 'danger',
      linkMenu: 'perizinan',
    });

    setRejectionModalId(null);
    setRejectionReason('');
  };

  // Direct WA to Guardian
  const handleKirimWA = (izin: Perizinan) => {
    const text = WhatsAppTemplates.izinDisetujui(izin);
    const url = createWhatsAppUrl(izin.noWaPenjemput, text);
    window.open(url, '_blank');
  };

  // Filtering
  const filteredList = perizinanList.filter((izin) => {
    if (selectedStatusTab !== 'all' && izin.status !== selectedStatusTab) return false;
    if (selectedJenisTab !== 'all' && izin.jenisIzin !== selectedJenisTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = izin.santriNama.toLowerCase().includes(q);
      const matchNis = izin.santriNis.toLowerCase().includes(q);
      const matchNomor = izin.nomorIzin.toLowerCase().includes(q);
      const matchTujuan = izin.tujuan.toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchNomor && !matchTujuan) return false;
    }
    return true;
  });

  const getStatusBadge = (status: StatusIzin) => {
    switch (status) {
      case 'Diajukan':
        return <span className="text-amber-400 font-semibold">Diajukan</span>;
      case 'Diverifikasi':
        return <span className="text-blue-400 font-semibold">Diverifikasi</span>;
      case 'Disetujui':
        return <span className="text-emerald-400 font-semibold">Disetujui</span>;
      case 'Ditolak':
        return <span className="text-red-400 font-semibold">Ditolak</span>;
      case 'Sedang Keluar':
        return <span className="text-amber-300 font-semibold">Sedang di Luar</span>;
      case 'Sudah Kembali':
        return <span className="text-teal-400 font-semibold">Sudah Kembali</span>;
      case 'Terlambat':
        return <span className="text-rose-400 font-semibold">Terlambat</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Toolbar - 3D Styled */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 metallic-glass-card p-6 rounded-3xl border border-slate-800/80 shadow-2xl hover-rainbow-edge">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 glow-cyan uppercase tracking-wider">
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              ACCESS CLEARANCE PERMITS
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              AUDIT MUTASI KELUAR-MASUK
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 uppercase font-sans">
            Administrasi Perizinan Santri
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Pengajuan berjenjang, verifikasi keamanan, penerbitan surat izin digital QR Code resmi terenkripsi
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl transition-all shadow-xl shadow-emerald-500/25 cursor-pointer border border-emerald-300/60 glow-cyan"
            >
              <ScanLine className="w-4 h-4 text-slate-950" />
              <span>Pindai QR Check-In</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-xl shadow-amber-500/25 cursor-pointer border border-amber-300/60"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Buat Pengajuan Izin</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Status - 3D Styled */}
      <div className="flex items-center gap-1.5 p-1.5 metallic-glass-card border border-slate-800/80 rounded-2xl overflow-x-auto text-xs shadow-lg hover-rainbow-edge">
        <button
          onClick={() => setSelectedStatusTab('all')}
          className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Semua Izin ({perizinanList.length})
        </button>
        <button
          onClick={() => setSelectedStatusTab('Diajukan')}
          className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Diajukan'
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 glow-gold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Menunggu Verifikasi
        </button>
        <button
          onClick={() => setSelectedStatusTab('Diverifikasi')}
          className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Diverifikasi'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 glow-cyan shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Siap Disetujui
        </button>
        <button
          onClick={() => setSelectedStatusTab('Disetujui')}
          className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Disetujui'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Disetujui (Surat Terbit)
        </button>
        <button
          onClick={() => setSelectedStatusTab('Sedang Keluar')}
          className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Sedang Keluar'
              ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 shadow-md glow-blue'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sedang di Luar
        </button>
        <button
          onClick={() => setSelectedStatusTab('Terlambat')}
          className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Terlambat'
              ? 'bg-red-600/20 text-red-400 border border-red-500/40 animate-pulse glow-red shadow-md'
              : 'text-red-400 hover:text-red-300'
          }`}
        >
          Terlambat
        </button>
        <button
          onClick={() => setSelectedStatusTab('Sudah Kembali')}
          className={`px-3.5 py-1.5 rounded-xl font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStatusTab === 'Sudah Kembali'
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Selesai / Kembali
        </button>
      </div>

      {/* Search & Filter Bar - 3D Styled */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 metallic-glass-card p-3 rounded-2xl border border-slate-800/80 shadow-xl hover-rainbow-edge">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, nomor izin, atau tujuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
          />
        </div>

        <select
          value={selectedJenisTab}
          onChange={(e) => setSelectedJenisTab(e.target.value)}
          className="px-3.5 py-2 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 font-mono transition-all"
        >
          <option value="all">Semua Jenis Izin</option>
          <option value="Izin Keluar">Izin Keluar (1 Hari)</option>
          <option value="Izin Pulang">Izin Pulang (Beberapa Hari)</option>
          <option value="Izin Berobat">Izin Berobat</option>
          <option value="Izin Keperluan Keluarga">Izin Keperluan Keluarga</option>
          <option value="Izin Tugas/Lomba">Izin Tugas / Lomba</option>
        </select>
      </div>

      {/* Table - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover-rainbow-edge">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Santri & Nomor Izin</th>
                <th className="px-4 py-3.5">Jenis & Tujuan</th>
                <th className="px-4 py-3.5">Jadwal Izin</th>
                <th className="px-4 py-3.5">Pengurus (Pengaju & Pengizin)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Persetujuan & Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada arsip perizinan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((izin) => {
                  const canVerify = currentUser.role === 'admin' || currentUser.role === 'anggota_keamanan' || currentUser.role === 'ketua_keamanan';
                  const canApprove = currentUser.role === 'admin' || currentUser.role === 'ketua_keamanan';

                  return (
                    <tr key={izin.id} className="table-row-rainbow transition-all cursor-pointer">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white tracking-wide font-sans">{izin.santriNama}</div>
                        <div className="text-[11px] text-slate-400">
                          NIS: <span className="text-cyan-300">{izin.santriNis}</span> · {izin.santriKelas}
                        </div>
                        <div className="text-[10px] text-amber-300/90 font-mono mt-0.5">
                          {izin.nomorIzin}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-[11px]">
                          {izin.jenisIzin}
                        </span>
                        <div className="text-[11px] text-slate-200 mt-1">{izin.tujuan}</div>
                        <div className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                          {izin.alasan}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px]">
                        <div>
                          Keluar: <span className="text-slate-200">{izin.tglKeluar} [{izin.jamKeluar}]</span>
                        </div>
                        <div>
                          Kembali: <span className="text-red-400 font-bold">{izin.tglKembali} [{izin.jamKembali}]</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Diajukan oleh:</span>
                          <span className="text-white font-bold font-sans flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            {izin.petugasPencatat || 'Pengurus Keamanan'}
                          </span>
                        </div>
                        <div className="mt-1 pt-1 border-t border-slate-800/80">
                          <span className="text-slate-400 text-[10px] block">Disetujui oleh:</span>
                          <span className={izin.disetujuiOleh ? "text-emerald-400 font-bold font-sans flex items-center gap-1.5" : "text-slate-500 italic text-[10px]"}>
                            {izin.disetujuiOleh ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                {izin.disetujuiOleh}
                              </>
                            ) : (izin.status === 'Disetujui' ? 'Ketua Keamanan' : 'Menunggu Approval')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(izin.status)}
                        {izin.status === 'Ditolak' && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-red-950/90 border border-red-500/80 text-red-300 text-[10px] font-bold flex items-center gap-1 shadow-md shadow-red-950/50 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>Harap menghubungi ketua pondok</span>
                          </div>
                        )}
                        {izin.catatanPenolakan && izin.status !== 'Ditolak' && (
                          <p className="text-[10px] text-red-400 mt-0.5 max-w-[140px] truncate" title={izin.catatanPenolakan}>
                            Ket: {izin.catatanPenolakan}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Approval Stage Actions */}
                        {izin.status === 'Diajukan' && canVerify && (
                          <button
                            onClick={() => handleVerifikasi(izin)}
                            className="tactile-interactive px-3 py-1.5 text-[11px] font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md cursor-pointer border border-blue-400/40"
                          >
                            Verifikasi
                          </button>
                        )}

                        {izin.status === 'Diverifikasi' && canApprove && (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleSetujui(izin)}
                              className="tactile-interactive px-3 py-1.5 text-[11px] font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl transition-all shadow-md cursor-pointer border border-emerald-300/60"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => setRejectionModalId(izin.id)}
                              className="tactile-interactive px-2.5 py-1.5 text-[11px] font-mono font-bold text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-800 rounded-xl transition-all cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        )}

                        {/* Direct Print Digital Permit Button from Pengurus Dashboard */}
                        {(izin.status === 'Disetujui' || izin.status === 'Sedang Keluar' || izin.status === 'Sudah Kembali' || izin.status === 'Terlambat') && (
                          <button
                            onClick={() => onViewSuratIzin(izin)}
                            className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-md cursor-pointer border border-amber-300/60"
                            title="Cetak Surat Izin Digital Resmi"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-950" />
                            <span>Cetak Surat Izin</span>
                          </button>
                        )}

                        {/* Share WA */}
                        <button
                          onClick={() => handleKirimWA(izin)}
                          className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/40"
                          title="Kirim ke WhatsApp Wali"
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

      {/* Add Permit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                Formulir Pengajuan Perizinan Santri
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePermit} className="p-6 space-y-4 text-xs font-mono">
              
              {/* Petugas Pengaju Sync Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-950/70 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <p className="font-bold text-white font-sans text-xs">
                      Petugas Pengaju: <span className="text-amber-300">{currentUser.nama}</span> ({currentUser.jabatan})
                    </p>
                    <p className="text-[10px] text-cyan-300 font-mono mt-0.5">
                      NRP: {currentUser.nrp || 'KAMTIB-OFF'} · Terkonfigurasi langsung ke Database Pusat Admin
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ADMIN SYNC
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Pilih Santri yang Mengajukan</label>
                <select
                  required
                  value={selectedSantriId}
                  onChange={(e) => handleSantriSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Cari / Pilih Santri --</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nis} - {s.kelas} - {s.gender === 'putra' ? 'Putra' : 'Putri'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Jenis Perizinan</label>
                  <select
                    value={formData.jenisIzin}
                    onChange={(e) => setFormData({ ...formData, jenisIzin: e.target.value as JenisIzin })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Izin Keluar">Izin Keluar (1 Hari)</option>
                    <option value="Izin Pulang">Izin Pulang (Beberapa Hari)</option>
                    <option value="Izin Berobat">Izin Berobat / Medis</option>
                    <option value="Izin Keperluan Keluarga">Izin Keperluan Keluarga</option>
                    <option value="Izin Tugas/Lomba">Izin Tugas / Lomba Pesantren</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Tujuan Lokasi</label>
                  <input
                    type="text"
                    required
                    value={formData.tujuan}
                    onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
                    placeholder="Contoh: Rumah / RSUD Karawang / Pasar"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Tanggal Mulai Keluar</label>
                  <input
                    type="date"
                    required
                    value={formData.tglKeluar}
                    onChange={(e) => setFormData({ ...formData, tglKeluar: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Jam Keluar</label>
                  <input
                    type="time"
                    required
                    value={formData.jamKeluar}
                    onChange={(e) => setFormData({ ...formData, jamKeluar: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Tanggal Batas Kembali</label>
                  <input
                    type="date"
                    required
                    value={formData.tglKembali}
                    onChange={(e) => setFormData({ ...formData, tglKembali: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Jam Maksimal Kembali</label>
                  <input
                    type="time"
                    required
                    value={formData.jamKembali}
                    onChange={(e) => setFormData({ ...formData, jamKembali: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Nama Penjemput / Pendamping</label>
                  <input
                    type="text"
                    required
                    value={formData.namaPenjemput}
                    onChange={(e) => setFormData({ ...formData, namaPenjemput: e.target.value })}
                    placeholder="Nama orang yang menjemput"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Hubungan Penjemput</label>
                  <input
                    type="text"
                    required
                    value={formData.hubunganPenjemput}
                    onChange={(e) => setFormData({ ...formData, hubunganPenjemput: e.target.value })}
                    placeholder="Contoh: Ayah Kandung / Pengurus"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Nomor WhatsApp Penjemput / Wali</label>
                <input
                  type="text"
                  required
                  value={formData.noWaPenjemput}
                  onChange={(e) => setFormData({ ...formData, noWaPenjemput: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Alasan Lengkap Perizinan</label>
                <textarea
                  required
                  rows={2}
                  value={formData.alasan}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                  placeholder="Jelaskan kebutuhan santri secara rinci..."
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer"
                >
                  Ajukan Permohonan Izin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Alasan Penolakan Izin
            </h4>
            <p className="text-xs text-neutral-300">
              Tuliskan alasan penolakan agar tercatat dalam riwayat persetujuan santri.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Jadwal bertabrakan dengan ujian madrasah / berkas belum lengkap"
              className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-red-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalId(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleTolak}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
