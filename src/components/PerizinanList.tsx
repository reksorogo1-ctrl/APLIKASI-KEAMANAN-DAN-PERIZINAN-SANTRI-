import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Ban,
  Radio,
  DoorOpen,
  Filter
} from 'lucide-react';
import { Perizinan, Santri, StatusIzin, JenisIzin, UserAccount, Pelanggaran } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { 
  getWIBDateTime, 
  hitungKeterlambatanWIB, 
  getTanggalPenangguhanWIB, 
  isSantriSuspended 
} from '../utils/timeUtils';

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
}) => {
  // Live Real-Time WIB Clock
  const [wibTime, setWibTime] = useState(getWIBDateTime());
  useEffect(() => {
    const timer = setInterval(() => {
      setWibTime(getWIBDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter & Search State for Active Table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedJenisTab, setSelectedJenisTab] = useState<string>('all');

  // Filter & Search State for Rekapitulasi Table
  const [searchRekap, setSearchRekap] = useState<string>('');
  const [filterRekapStatus, setFilterRekapStatus] = useState<'all' | 'Sudah Kembali' | 'Terlambat'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Selesai / Santri Kembali Confirmation Modal
  const [selesaiModalIzin, setSelesaiModalIzin] = useState<Perizinan | null>(null);
  const [durasiSuspensiHari, setDurasiSuspensiHari] = useState<number>(7);

  // Form State for new permit request (synchronized with real-time WIB)
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [formData, setFormData] = useState({
    jenisIzin: 'Izin Keluar' as JenisIzin,
    tglKeluar: wibTime.dateStr,
    jamKeluar: wibTime.timeStr,
    tglKembali: wibTime.dateStr,
    jamKembali: '18:00',
    alasan: '',
    tujuan: '',
    namaPenjemput: '',
    noWaPenjemput: '',
    hubunganPenjemput: 'Orang Tua / Wali',
  });

  // Check if selected santri is currently suspended
  const selectedSantri = useMemo(() => {
    return santriList.find(s => s.id === selectedSantriId);
  }, [santriList, selectedSantriId]);

  const isSelectedSantriSuspended = useMemo(() => {
    if (!selectedSantri) return false;
    return isSantriSuspended(selectedSantri.suspendIzinHingga);
  }, [selectedSantri]);

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

  const openAddPermitModal = () => {
    const currentWIB = getWIBDateTime();
    setFormData({
      jenisIzin: 'Izin Keluar',
      tglKeluar: currentWIB.dateStr,
      jamKeluar: currentWIB.timeStr,
      tglKembali: currentWIB.dateStr,
      jamKembali: '18:00',
      alasan: '',
      tujuan: '',
      namaPenjemput: '',
      noWaPenjemput: '',
      hubunganPenjemput: 'Orang Tua / Wali',
    });
    setSelectedSantriId('');
    setIsAddModalOpen(true);
  };

  const handleCreatePermit = (e: React.FormEvent) => {
    e.preventDefault();
    const santri = santriList.find(s => s.id === selectedSantriId);
    if (!santri) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }

    // DISCIPLINARY ENFORCEMENT: Block permit creation if santri is suspended
    if (isSantriSuspended(santri.suspendIzinHingga)) {
      alert(`PENGURUS KAMTIB: Santri ${santri.nama} sedang dalam masa penangguhan izin keluar hingga tanggal ${santri.suspendIzinHingga} akibat keterlambatan perizinan sebelumnya. Permohonan izin diblokir otomatis oleh sistem.`);
      return;
    }

    const currentWIB = getWIBDateTime();
    const counter = perizinanList.length + 1;
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const currentRoman = romanMonths[currentWIB.nowWIB.getMonth()];

    const newPermit: Perizinan = {
      id: `iz_${Date.now()}`,
      nomorIzin: `IZIN/MALIKI/${currentWIB.nowWIB.getFullYear()}/${currentRoman}/${counter.toString().padStart(3, '0')}`,
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
      tglPengajuan: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
      petugasPencatat: currentUser.nama,
      riwayatPersetujuan: [
        {
          role: currentUser.role,
          nama: currentUser.nama,
          tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
          status: 'Setuju',
          catatan: `Permohonan izin diinput langsung oleh pengurus ${currentUser.nama}`,
        }
      ],
    };

    storageService.savePerizinan(newPermit);
    storageService.addLog(
      'Pengajuan Izin',
      `Izin diajukan oleh pengurus ${currentUser.nama} untuk santri ${santri.nama} (${formData.jenisIzin}) - Waktu WIB: ${currentWIB.timeStr}`,
      'izin'
    );
    storageService.addNotification({
      judul: 'Pengajuan Izin Baru Masuk',
      pesan: `Permohonan izin diajukan oleh pengurus ${currentUser.nama} (${currentUser.jabatan}) untuk santri ${santri.nama} (${santri.kelas}) tujuan ${formData.tujuan}. Terkonfigurasi langsung ke database pusat admin secara real-time WIB.`,
      tipe: 'info',
      linkMenu: 'perizinan',
    });

    setIsAddModalOpen(false);
  };

  // Multistage Approval: Step 1 Verifikasi (by Anggota Keamanan)
  const handleVerifikasi = (izin: Perizinan) => {
    const currentWIB = getWIBDateTime();
    const updated: Perizinan = {
      ...izin,
      status: 'Diverifikasi',
      riwayatPersetujuan: [
        ...izin.riwayatPersetujuan,
        {
          role: 'Biro Keamanan',
          nama: currentUser.nama,
          tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
          status: 'Setuju',
          catatan: 'Dokumen dan alasan telah diverifikasi kelengkapannya.',
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Verifikasi Izin', `Memverifikasi berkas izin ${izin.nomorIzin} (WIB: ${currentWIB.timeStr})`, 'izin');
  };

  // Multistage Approval: Step 2 Final Approval (by Ketua Keamanan / Ketua Pondok / Admin)
  const handleSetujui = (izin: Perizinan) => {
    const currentWIB = getWIBDateTime();
    const updated: Perizinan = {
      ...izin,
      status: 'Disetujui',
      disetujuiOleh: currentUser.nama,
      riwayatPersetujuan: [
        ...izin.riwayatPersetujuan,
        {
          role: currentUser.role === 'admin' ? 'Super Admin' : 'Ketua Keamanan',
          nama: currentUser.nama,
          tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
          status: 'Setuju',
          catatan: 'Disetujui. Harap menjaga marwah pesantren dan kembali sesuai batas waktu.',
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Persetujuan Izin', `Menyetujui surat izin ${izin.nomorIzin} oleh ${currentUser.nama}`, 'izin');
    
    // Auto add notification to pengurus and admin
    storageService.addNotification({
      judul: `Izin Disetujui: ${izin.santriNama}`,
      pesan: `Permohonan izin untuk ${izin.santriNama} telah disetujui oleh ${currentUser.nama}. Surat perizinan digital resmi otomatis terbuka untuk dicetak dan masuk radar monitoring.`,
      tipe: 'success',
      linkMenu: 'perizinan',
      noWaTujuan: izin.noWaPenjemput,
      waPesanTemplate: WhatsAppTemplates.izinDisetujui(updated),
    });

    // Otomatis munculkan surat izin digital untuk langsung dicetak
    onViewSuratIzin(updated);
  };

  // Tandai Berangkat / Keluar Gerbang
  const handleTandaiKeluar = (izin: Perizinan) => {
    const currentWIB = getWIBDateTime();
    const updated: Perizinan = {
      ...izin,
      status: 'Sedang Keluar',
      actualKeluar: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
      petugasKeluar: currentUser.nama,
      riwayatPersetujuan: [
        ...izin.riwayatPersetujuan,
        {
          role: 'Biro Keamanan',
          nama: currentUser.nama,
          tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
          status: 'Setuju',
          catatan: `Santri telah melintasi pos gerbang keluar pada ${currentWIB.timeStr} WIB.`,
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Mutasi Gerbang', `Santri ${izin.santriNama} keluar pondok pada ${currentWIB.timeStr} WIB`, 'gerbang');
  };

  // Reject with reason - triggers "Harap menghubungi ketua pondok" notification
  const handleTolak = () => {
    if (!rejectionModalId) return;
    const target = perizinanList.find(i => i.id === rejectionModalId);
    if (!target) return;

    const currentWIB = getWIBDateTime();
    const updated: Perizinan = {
      ...target,
      status: 'Ditolak',
      catatanPenolakan: rejectionReason ? `Harap menghubungi ketua pondok (${rejectionReason})` : 'Harap menghubungi ketua pondok',
      riwayatPersetujuan: [
        ...target.riwayatPersetujuan,
        {
          role: currentUser.role,
          nama: currentUser.nama,
          tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
          status: 'Tolak',
          catatan: rejectionReason || 'Harap menghubungi ketua pondok',
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Penolakan Izin', `Menolak perizinan ${target.nomorIzin}: Harap menghubungi ketua pondok`, 'izin');
    
    storageService.addNotification({
      judul: `Izin Ditolak: ${target.santriNama}`,
      pesan: `Harap menghubungi ketua pondok. Pengajuan perizinan santri ${target.santriNama} (${target.nomorIzin}) telah ditolak.`,
      tipe: 'danger',
      linkMenu: 'perizinan',
    });

    setRejectionModalId(null);
    setRejectionReason('');
  };

  // =========================================================================
  // CORE FEATURE: SYSTEM TOMBOL "SELESAI / SANTRI KEMBALI"
  // (Menggantikan sistem QR Code check-in dengan kalkulasi real-time WIB presisi)
  // =========================================================================
  const handleKonfirmasiSelesaiSubmit = () => {
    if (!selesaiModalIzin) return;
    const currentWIB = getWIBDateTime();

    // Hitung keterlambatan terhadap batas tglKembali dan jamKembali
    const lateCalc = hitungKeterlambatanWIB(
      selesaiModalIzin.tglKembali,
      selesaiModalIzin.jamKembali,
      currentWIB.dateStr,
      currentWIB.timeStr
    );

    const isLate = lateCalc.isTerlambat;
    const diffMinutes = lateCalc.menitKeterlambatan;

    if (isLate) {
      // 1. Tanggal penangguhan sanksi
      const suspendUntil = getTanggalPenangguhanWIB(durasiSuspensiHari);

      // 2. Update status perizinan menjadi 'Terlambat'
      const updatedIzin: Perizinan = {
        ...selesaiModalIzin,
        status: 'Terlambat',
        actualKembali: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
        petugasKembali: currentUser.nama,
        menitKeterlambatan: diffMinutes,
        riwayatPersetujuan: [
          ...selesaiModalIzin.riwayatPersetujuan,
          {
            role: 'Biro Keamanan',
            nama: currentUser.nama,
            tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
            status: 'Setuju',
            catatan: `Santri kembali TERLAMBAT ${diffMinutes} menit. Sanksi penangguhan izin s/d ${suspendUntil}. Otomatis masuk catatan pelanggaran.`,
          }
        ]
      };
      storageService.savePerizinan(updatedIzin);

      // 3. Otomatis buat data pelanggaran dan masukkan ke tab Pencatatan Insiden Pelanggaran
      const poinSanksi = diffMinutes > 120 ? 25 : (diffMinutes > 30 ? 15 : 10);
      const tingkatSanksi = diffMinutes > 120 ? 'Berat' : (diffMinutes > 30 ? 'Sedang' : 'Ringan');

      const newPelanggaran: Pelanggaran = {
        id: `pel_late_${Date.now()}`,
        kodePelanggaran: `PEL-LATE-${currentWIB.nowWIB.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        santriId: selesaiModalIzin.santriId,
        santriNama: selesaiModalIzin.santriNama,
        santriNis: selesaiModalIzin.santriNis,
        santriGender: selesaiModalIzin.santriGender,
        tanggal: currentWIB.dateStr,
        waktu: currentWIB.timeStr,
        tataTertibId: 'tt_kamtib_late_izin',
        jenisPelanggaran: `Keterlambatan Kepulangan Izin Keluar (+${diffMinutes} Menit)`,
        kategori: tingkatSanksi,
        poin: poinSanksi,
        kronologi: `Santri kembali ke pondok melewati batas waktu resmi (${selesaiModalIzin.tglKembali} ${selesaiModalIzin.jamKembali} WIB). Tiba di pos kamtib pada ${currentWIB.dateStr} ${currentWIB.timeStr} WIB (Terlambat ${diffMinutes} menit / ${lateCalc.jamKeterlambatan} jam). Nomor Surat: ${selesaiModalIzin.nomorIzin}. Sanksi disiplin: Izin keluar ditangguhkan hingga ${suspendUntil}.`,
        lokasi: 'Pos Gerbang Keamanan Pondok Pesantren',
        namaPetugasPelapor: currentUser.nama,
        statusVerifikasi: 'Terverifikasi'
      };
      storageService.savePelanggaran(newPelanggaran);

      // 4. Otomatis tangguhkan izin keluar santri
      storageService.suspendSantri(
        selesaiModalIzin.santriId,
        suspendUntil,
        `Keterlambatan izin keluar ${diffMinutes} menit (Surat: ${selesaiModalIzin.nomorIzin}). Tanggal kembali aktual: ${currentWIB.dateStr} ${currentWIB.timeStr} WIB.`
      );

      // 5. Notifikasi ke seluruh dashboard Admin & Pengurus
      storageService.addNotification({
        judul: `Keterlambatan Izin: ${selesaiModalIzin.santriNama} (+${diffMinutes} Menit)`,
        pesan: `Santri ${selesaiModalIzin.santriNama} (${selesaiModalIzin.santriKelas}) kembali terlambat ${diffMinutes} menit pada ${currentWIB.timeStr} WIB. Otomatis masuk Catatan Insiden Pelanggaran (+${poinSanksi} poin) dan perizinan keluar ditangguhkan hingga ${suspendUntil}.`,
        tipe: 'danger',
        linkMenu: 'pelanggaran',
      });
      storageService.addLog(
        'Check-In Terlambat',
        `Santri ${selesaiModalIzin.santriNama} kembali terlambat ${diffMinutes} menit. Otomatis tercatat di Pelanggaran & Izin ditangguhkan hingga ${suspendUntil}.`,
        'gerbang'
      );
    } else {
      // Tepat waktu / Lebih awal -> Status: 'Sudah Kembali'
      const updatedIzin: Perizinan = {
        ...selesaiModalIzin,
        status: 'Sudah Kembali',
        actualKembali: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
        petugasKembali: currentUser.nama,
        menitKeterlambatan: 0,
        riwayatPersetujuan: [
          ...selesaiModalIzin.riwayatPersetujuan,
          {
            role: 'Biro Keamanan',
            nama: currentUser.nama,
            tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
            status: 'Setuju',
            catatan: `Santri kembali TEPAT WAKTU pada ${currentWIB.timeStr} WIB. Perizinan selesai dan masuk ke rekapitulasi riwayat.`,
          }
        ]
      };
      storageService.savePerizinan(updatedIzin);

      storageService.addNotification({
        judul: `Perizinan Selesai: ${selesaiModalIzin.santriNama}`,
        pesan: `Santri ${selesaiModalIzin.santriNama} telah kembali ke pondok tepat waktu pada ${currentWIB.timeStr} WIB. Status perizinan selesai dan otomatis terekap ke tabel riwayat.`,
        tipe: 'success',
        linkMenu: 'perizinan',
      });
      storageService.addLog(
        'Check-In Selesai',
        `Santri ${selesaiModalIzin.santriNama} kembali tepat waktu (${currentWIB.timeStr} WIB). Data terekap rapi.`,
        'gerbang'
      );
    }

    setSelesaiModalIzin(null);
  };

  // Direct WA to Guardian
  const handleKirimWA = (izin: Perizinan) => {
    const text = WhatsAppTemplates.izinDisetujui(izin);
    const url = createWhatsAppUrl(izin.noWaPenjemput, text);
    window.open(url, '_blank');
  };

  // =========================================================================
  // DATA SPLITTING:
  // 1. Active Permits (Diajukan, Diverifikasi, Disetujui, Sedang Keluar)
  // 2. Completed / Recorded Permits (Sudah Kembali, Terlambat)
  // =========================================================================
  const activePermits = useMemo(() => {
    return perizinanList.filter(izin => {
      const isActiveStatus = 
        izin.status === 'Diajukan' || 
        izin.status === 'Diverifikasi' || 
        izin.status === 'Disetujui' || 
        izin.status === 'Sedang Keluar';
      
      if (!isActiveStatus) return false;
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
  }, [perizinanList, selectedStatusTab, selectedJenisTab, searchQuery]);

  const rekapitulasiPermits = useMemo(() => {
    return perizinanList.filter(izin => {
      const isRekapStatus = izin.status === 'Sudah Kembali' || izin.status === 'Terlambat';
      if (!isRekapStatus) return false;

      if (filterRekapStatus !== 'all' && izin.status !== filterRekapStatus) return false;

      if (searchRekap.trim()) {
        const q = searchRekap.toLowerCase();
        const matchName = izin.santriNama.toLowerCase().includes(q);
        const matchNis = izin.santriNis.toLowerCase().includes(q);
        const matchNomor = izin.nomorIzin.toLowerCase().includes(q);
        const matchTujuan = izin.tujuan.toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchNomor && !matchTujuan) return false;
      }
      return true;
    });
  }, [perizinanList, filterRekapStatus, searchRekap]);

  // Rekap Statistics
  const rekapStats = useMemo(() => {
    const totalRekap = perizinanList.filter(i => i.status === 'Sudah Kembali' || i.status === 'Terlambat');
    const tepatWaktu = totalRekap.filter(i => i.status === 'Sudah Kembali');
    const terlambat = totalRekap.filter(i => i.status === 'Terlambat');
    const santriSuspendedCount = santriList.filter(s => isSantriSuspended(s.suspendIzinHingga)).length;
    return {
      total: totalRekap.length,
      tepatWaktu: tepatWaktu.length,
      terlambat: terlambat.length,
      santriSuspendedCount
    };
  }, [perizinanList, santriList]);

  const canVerify = currentUser.role === 'anggota_keamanan' || currentUser.role === 'ketua_keamanan' || currentUser.role === 'admin';
  const canApprove = currentUser.role === 'ketua_keamanan' || currentUser.role === 'admin';

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* 1. HEADER UTAMA & SINKRONISASI REAL-TIME WIB (ASIA/JAKARTA)               */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 metallic-glass-card p-6 rounded-3xl border border-slate-800/80 shadow-2xl hover-rainbow-edge">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 glow-cyan uppercase tracking-wider">
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              SISTEM PERIZINAN DISIPLIN SANTRI
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              SISTEM TOMBOL SELESAI & AUTO-REKAP
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sans">
            Administrasi Permohonan Izin Santri
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
            Verifikasi izin berjenjang, tombol kepulangan santri real-time WIB, audit otomatis keterlambatan, dan sanksi penangguhan perizinan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Real-time WIB Live Badge */}
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shrink-0">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-300">
                  WAKTU SERVER REAL-TIME (WIB)
                </span>
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-amber-300 tracking-wider">
                {wibTime.timeWithSeconds} <span className="text-xs text-cyan-400 font-sans">WIB</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                {wibTime.dateStr} · Asia/Jakarta
              </div>
            </div>
          </div>

          <button
            onClick={openAddPermitModal}
            className="tactile-interactive inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all shadow-xl shadow-amber-500/25 cursor-pointer border border-amber-300/60 active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Buat Pengajuan Izin</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABEL 1: PERMOHONAN & PERIZINAN BERJALAN (AKTIF)                      */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                Daftar Permohonan & Izin Berjalan (Aktif)
                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-blue-600 text-white font-bold">
                  {activePermits.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Izin yang sedang diajukan, diverifikasi, disetujui, dan santri yang sedang berada di luar pondok.
              </p>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatusTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Aktif ({activePermits.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('Diajukan')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatusTab === 'Diajukan'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diajukan
            </button>
            <button
              onClick={() => setSelectedStatusTab('Diverifikasi')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatusTab === 'Diverifikasi'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diverifikasi
            </button>
            <button
              onClick={() => setSelectedStatusTab('Disetujui')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatusTab === 'Disetujui'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Disetujui
            </button>
            <button
              onClick={() => setSelectedStatusTab('Sedang Keluar')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatusTab === 'Sedang Keluar'
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sedang Keluar
            </button>
          </div>
        </div>

        {/* Search Input for Active Table */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari permohonan aktif: nama santri, NIS, nomor izin, atau tujuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
          />
        </div>

        {/* Active Permits Table */}
        <div className="metallic-glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Santri / Identitas</th>
                  <th className="px-4 py-3.5">Jenis & Tujuan</th>
                  <th className="px-4 py-3.5">Waktu Rencana Keluar - Batas Kembali (WIB)</th>
                  <th className="px-4 py-3.5">Penanggung Jawab / Otoritas</th>
                  <th className="px-4 py-3.5">Status Izin</th>
                  <th className="px-5 py-3.5 text-right">Aksi & Tombol Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {activePermits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-mono text-xs">
                      Tidak ada permohonan izin aktif yang sedang berlangsung saat ini.
                    </td>
                  </tr>
                ) : (
                  activePermits.map((izin) => {
                    const isSedangKeluar = izin.status === 'Sedang Keluar';
                    const isDisetujui = izin.status === 'Disetujui';

                    return (
                      <tr key={izin.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-white text-sm font-sans flex items-center gap-2">
                            <span>{izin.santriNama}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              izin.santriGender === 'putra' 
                                ? 'bg-blue-950 text-blue-300 border border-blue-500/30' 
                                : 'bg-pink-950 text-pink-300 border border-pink-500/30'
                            }`}>
                              {izin.santriGender === 'putra' ? 'Banin' : 'Banat'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            NIS: {izin.santriNis} · Kelas {izin.santriKelas} ({izin.santriKamar})
                          </div>
                          <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                            No. Izin: {izin.nomorIzin}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-bold text-cyan-300 text-xs block font-mono">
                            {izin.jenisIzin}
                          </span>
                          <span className="text-slate-300 text-xs mt-0.5 block line-clamp-1">
                            Tujuan: {izin.tujuan}
                          </span>
                          <span className="text-slate-400 text-[10px] line-clamp-1 italic">
                            &quot;{izin.alasan}&quot;
                          </span>
                        </td>

                        <td className="px-4 py-4 font-mono text-[11px]">
                          <div className="text-slate-300">
                            <span className="text-slate-500 text-[10px] block">Rencana Keluar:</span>
                            {izin.tglKeluar} · {izin.jamKeluar} WIB
                          </div>
                          <div className="text-amber-300 mt-1 font-bold">
                            <span className="text-slate-500 text-[10px] block">Batas Waktu Kembali:</span>
                            {izin.tglKembali} · {izin.jamKembali} WIB
                          </div>
                          {izin.actualKeluar && (
                            <div className="text-cyan-400 text-[10px] mt-0.5">
                              Aktual Keluar: {izin.actualKeluar}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Pengaju:</span>
                            <span className="text-white font-bold font-sans">
                              {izin.petugasPencatat || 'Pengurus Keamanan'}
                            </span>
                          </div>
                          <div className="mt-1 pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400 text-[10px] block">Penyetujui:</span>
                            <span className={izin.disetujuiOleh ? "text-emerald-400 font-bold font-sans" : "text-slate-500 italic text-[10px]"}>
                              {izin.disetujuiOleh || (izin.status === 'Disetujui' ? 'Ketua Keamanan' : 'Menunggu Approval')}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {izin.status === 'Diajukan' && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-mono font-bold">
                              Diajukan
                            </span>
                          )}
                          {izin.status === 'Diverifikasi' && (
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold">
                              Diverifikasi
                            </span>
                          )}
                          {izin.status === 'Disetujui' && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                              Disetujui (Surat Terbit)
                            </span>
                          )}
                          {izin.status === 'Sedang Keluar' && (
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                              Sedang di Luar
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Approval Actions */}
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

                          {/* Tombol Tandai Keluar Gerbang jika sudah disetujui */}
                          {isDisetujui && (
                            <button
                              onClick={() => handleTandaiKeluar(izin)}
                              className="tactile-interactive inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono font-bold text-cyan-200 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-xl cursor-pointer"
                              title="Tandai Santri Melewati Pos Gerbang Keluar"
                            >
                              <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Tandai Keluar</span>
                            </button>
                          )}

                          {/* ======================================================= */}
                          {/* TOMBOL UTAMA: "SELESAI / SANTRI KEMBALI"                 */}
                          {/* ======================================================= */}
                          {(isDisetujui || isSedangKeluar) && (
                            <button
                              onClick={() => {
                                setDurasiSuspensiHari(7);
                                setSelesaiModalIzin(izin);
                              }}
                              className="tactile-interactive inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl transition-all shadow-lg shadow-emerald-500/30 cursor-pointer border border-emerald-300 glow-cyan active:scale-95"
                              title="Klik untuk menyelesaikan perizinan setelah santri kembali"
                            >
                              <CheckCircle2 className="w-4 h-4 text-slate-950" />
                              <span>Selesai / Santri Kembali</span>
                            </button>
                          )}

                          {/* Print Official Letter */}
                          {(isDisetujui || isSedangKeluar) && (
                            <button
                              onClick={() => onViewSuratIzin(izin)}
                              className="tactile-interactive inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono font-bold text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 rounded-xl cursor-pointer"
                              title="Cetak Surat Izin Resmi"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-300" />
                              <span>Cetak</span>
                            </button>
                          )}

                          {/* Share WhatsApp */}
                          <button
                            onClick={() => handleKirimWA(izin)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Kirim Info WhatsApp ke Wali"
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
      </div>

      {/* ========================================================================= */}
      {/* 3. TABEL 2: REKAPITULASI RIWAYAT PERIZINAN SANTRI (SELESAI & TERLAMBAT)    */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4 border-t-2 border-slate-800">
        
        {/* Section Header & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                  DATABASE REKAPITULASI PERIZINAN SANTRI
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
                Tabel Rekapan Riwayat Perizinan Santri (Selesai & Terlambat)
              </h2>
              <p className="text-xs text-slate-400">
                Data perizinan otomatis masuk dan terekap di tabel ini setelah tombol Selesai diklik atau santri terdeteksi terlambat.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Rekapan</span>
              <span className="text-base font-black font-mono text-white tabular-nums">
                {rekapStats.total}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-[10px] font-mono text-emerald-400 block uppercase">Tepat Waktu</span>
              <span className="text-base font-black font-mono text-emerald-300 tabular-nums">
                {rekapStats.tepatWaktu}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40">
              <span className="text-[10px] font-mono text-red-400 block uppercase">Terlambat</span>
              <span className="text-base font-black font-mono text-red-400 tabular-nums">
                {rekapStats.terlambat}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40">
              <span className="text-[10px] font-mono text-purple-300 block uppercase">Santri Suspensi</span>
              <span className="text-base font-black font-mono text-purple-300 tabular-nums">
                {rekapStats.santriSuspendedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Search for Rekapitulasi Table */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pada rekapan: nama santri, NIS, nomor izin, atau alasan..."
              value={searchRekap}
              onChange={(e) => setSearchRekap(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setFilterRekapStatus('all')}
              className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-center cursor-pointer transition-all ${
                filterRekapStatus === 'all'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({rekapStats.total})
            </button>
            <button
              onClick={() => setFilterRekapStatus('Sudah Kembali')}
              className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-center cursor-pointer transition-all ${
                filterRekapStatus === 'Sudah Kembali'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Tepat Waktu ({rekapStats.tepatWaktu})
            </button>
            <button
              onClick={() => setFilterRekapStatus('Terlambat')}
              className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-center cursor-pointer transition-all ${
                filterRekapStatus === 'Terlambat'
                  ? 'bg-red-600/30 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              Terlambat ({rekapStats.terlambat})
            </button>
          </div>
        </div>

        {/* Rekapitulasi Table */}
        <div className="metallic-glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Nomor Izin & Tgl Pengajuan</th>
                  <th className="px-4 py-3.5">Santri / Identitas</th>
                  <th className="px-4 py-3.5">Jenis & Tujuan</th>
                  <th className="px-4 py-3.5">Batas Kembali (WIB)</th>
                  <th className="px-4 py-3.5">Aktual Kembali (WIB)</th>
                  <th className="px-4 py-3.5">Status Kepulangan</th>
                  <th className="px-4 py-3.5">Sanksi Disiplin</th>
                  <th className="px-5 py-3.5 text-right">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {rekapitulasiPermits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-mono text-xs">
                      Belum ada data perizinan santri yang selesai atau terekap.
                    </td>
                  </tr>
                ) : (
                  rekapitulasiPermits.map((izin) => {
                    const isLate = izin.status === 'Terlambat';
                    const targetSantri = santriList.find(s => s.id === izin.santriId);
                    const isSuspended = targetSantri && isSantriSuspended(targetSantri.suspendIzinHingga);

                    return (
                      <tr key={izin.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-4 font-mono">
                          <span className="text-cyan-400 font-bold block text-xs">
                            {izin.nomorIzin}
                          </span>
                          <span className="text-slate-400 text-[10px] mt-0.5 block">
                            Diajukan: {izin.tglPengajuan}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-bold text-white text-sm">
                            {izin.santriNama}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            NIS: {izin.santriNis} · Kelas {izin.santriKelas} ({izin.santriKamar})
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-bold text-white text-xs block font-mono">
                            {izin.jenisIzin}
                          </span>
                          <span className="text-slate-300 text-xs mt-0.5 block line-clamp-1">
                            Tujuan: {izin.tujuan}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-mono text-[11px] text-amber-300">
                          {izin.tglKembali}
                          <div className="text-[10px] text-slate-400">
                            Pukul: {izin.jamKembali} WIB
                          </div>
                        </td>

                        <td className="px-4 py-4 font-mono text-[11px]">
                          {izin.actualKembali ? (
                            <div className="text-white font-bold">
                              {izin.actualKembali}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">-</span>
                          )}
                          {izin.petugasKembali && (
                            <div className="text-[10px] text-slate-400">
                              Petugas: {izin.petugasKembali}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {isLate ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/80 text-red-300 font-mono font-black text-[11px] shadow-md shadow-red-950/50">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                TERLAMBAT (+{izin.menitKeterlambatan || 0} mnt)
                              </span>
                              <span className="block text-[10px] text-red-400 font-mono">
                                Masuk Catatan Pelanggaran
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 font-mono font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Sudah Kembali (Tepat Waktu)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 font-mono text-[11px]">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/80 text-purple-300 text-[10px] font-bold">
                              <Ban className="w-3 h-3 text-purple-400" />
                              Ditangguhkan s/d {targetSantri?.suspendIzinHingga}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">
                              Status Normal
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onViewSuratIzin(izin)}
                            className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-md cursor-pointer border border-amber-300/60"
                            title="Cetak Salinan Surat Izin Digital"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-950" />
                            <span>Cetak Surat</span>
                          </button>

                          <button
                            onClick={() => handleKirimWA(izin)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Hubungi Wali WhatsApp"
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
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL KONFIRMASI: TOMBOL SELESAI / SANTRI KEMBALI                     */}
      {/* ========================================================================= */}
      {selesaiModalIzin && (() => {
        const currentWIB = getWIBDateTime();
        const lateCalc = hitungKeterlambatanWIB(
          selesaiModalIzin.tglKembali,
          selesaiModalIzin.jamKembali,
          currentWIB.dateStr,
          currentWIB.timeStr
        );
        const isLate = lateCalc.isTerlambat;
        const diffMinutes = lateCalc.menitKeterlambatan;
        const suspendUntilPreview = getTanggalPenangguhanWIB(durasiSuspensiHari);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8">
              
              <div className={`p-5 flex items-center justify-between border-b ${
                isLate ? 'bg-red-950/80 border-red-500/60 text-red-100' : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-100'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isLate ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
                    {isLate ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase font-sans">
                      {isLate ? 'Deteksi Keterlambatan Kepulangan' : 'Konfirmasi Selesai & Santri Kembali'}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-300">
                      Waktu Kepulangan Aktual Tersinkronisasi Real-Time (WIB)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelesaiModalIzin(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-mono">
                
                {/* Data Santri Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-[10px]">IDENTITAS SANTRI</span>
                    <span className="text-cyan-400 font-bold">{selesaiModalIzin.nomorIzin}</span>
                  </div>
                  <div className="text-base font-bold text-white font-sans">
                    {selesaiModalIzin.santriNama}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    NIS: {selesaiModalIzin.santriNis} · Kelas {selesaiModalIzin.santriKelas} ({selesaiModalIzin.santriKamar})
                  </div>
                  <div className="text-slate-300 text-[11px] mt-1">
                    Keperluan: <span className="text-amber-300">{selesaiModalIzin.jenisIzin}</span> tujuan {selesaiModalIzin.tujuan}
                  </div>
                </div>

                {/* Perbandingan Waktu Real-Time WIB */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40">
                    <span className="text-slate-400 text-[10px] block uppercase">Batas Waktu Kembali</span>
                    <div className="text-amber-300 font-bold text-sm mt-0.5">
                      {selesaiModalIzin.jamKembali} WIB
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {selesaiModalIzin.tglKembali}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    isLate ? 'bg-red-950/60 border-red-500/60 text-red-200' : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                  }`}>
                    <span className="text-[10px] block uppercase font-bold">Waktu Aktual Kembali (WIB)</span>
                    <div className="font-bold text-sm mt-0.5 text-white">
                      {currentWIB.timeStr} WIB
                    </div>
                    <div className="text-[10px] opacity-80">
                      {currentWIB.dateStr}
                    </div>
                  </div>
                </div>

                {/* Status Evaluation Box */}
                {isLate ? (
                  <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 text-red-200 space-y-2.5 shadow-xl glow-red">
                    <div className="flex items-center gap-2 font-bold text-sm text-red-100">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <span>SANTRI TERDETEKSI TERLAMBAT +{diffMinutes} MENIT ({lateCalc.jamKeterlambatan} JAM)</span>
                    </div>
                    <p className="text-[11px] text-red-300 leading-relaxed font-sans">
                      Sesuai peraturan tata tertib Kamtib, santri yang terlambat otomatis dicatat pada tab <span className="font-bold underline text-white">Pencatatan Insiden Pelanggaran</span> dan dikenakan <span className="font-bold underline text-white">Penangguhan Izin Keluar</span>.
                    </p>

                    <div>
                      <label className="block text-[11px] text-red-200 font-bold mb-1">
                        Pilihan Durasi Penangguhan Izin Keluar:
                      </label>
                      <select
                        value={durasiSuspensiHari}
                        onChange={(e) => setDurasiSuspensiHari(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-red-500/70 rounded-xl text-white font-mono focus:outline-none"
                      >
                        <option value={7}>7 Hari (1 Minggu) - Berlaku s/d {getTanggalPenangguhanWIB(7)}</option>
                        <option value={14}>14 Hari (2 Minggu) - Berlaku s/d {getTanggalPenangguhanWIB(14)}</option>
                        <option value={30}>30 Hari (1 Bulan) - Berlaku s/d {getTanggalPenangguhanWIB(30)}</option>
                      </select>
                    </div>

                    <div className="text-[10px] text-amber-300 pt-1 border-t border-red-800/80">
                      Izin keluar santri akan diblokir otomatis oleh sistem hingga tanggal: <span className="font-bold underline text-white">{suspendUntilPreview}</span>.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 space-y-1.5 shadow-lg">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>SANTRI KEMBALI TEPAT WAKTU (SESUAI SOP)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Perizinan ini akan ditandai sebagai selesai (<span className="text-emerald-300 font-bold">Sudah Kembali</span>) dan otomatis masuk ke tabel rekapan riwayat perizinan santri.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelesaiModalIzin(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleKonfirmasiSelesaiSubmit}
                    className={`tactile-interactive px-5 py-2.5 font-black text-xs font-mono tracking-wider rounded-xl cursor-pointer shadow-xl transition-all ${
                      isLate
                        ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border border-emerald-300'
                    }`}
                  >
                    {isLate ? 'Simpan Terlambat & Terapkan Sanksi' : 'Konfirmasi Selesai & Rekap'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 5. MODAL FORMULIR PENGAJUAN PERIZINAN BARU                                */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                Formulir Pengajuan Perizinan Santri (Real-Time WIB)
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
                      NRP: {currentUser.nrp || 'KAMTIB-OFF'} · Tersinkronisasi Real-Time ({wibTime.timeStr} WIB)
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ADMIN SYNC
                </span>
              </div>

              {/* Santri Selector */}
              <div>
                <label className="block text-neutral-400 font-medium mb-1">
                  Pilih Santri yang Mengajukan Perizinan
                </label>
                <select
                  required
                  value={selectedSantriId}
                  onChange={(e) => handleSantriSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Cari / Pilih Santri --</option>
                  {santriList.map((s) => {
                    const isSusp = isSantriSuspended(s.suspendIzinHingga);
                    return (
                      <option key={s.id} value={s.id}>
                        {isSusp ? `[⛔ DITANGGUHKAN s/d ${s.suspendIzinHingga}] ` : ''}
                        {s.nama} ({s.nis} - {s.kelas} - {s.gender === 'putra' ? 'Putra' : 'Putri'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* WARNING BANNER: If selected santri is currently suspended */}
              {isSelectedSantriSuspended && selectedSantri && (
                <div className="p-4 rounded-2xl bg-red-950 border-2 border-red-500 text-red-200 shadow-xl glow-red space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-red-100 text-xs">
                    <Ban className="w-4 h-4 text-red-400 shrink-0" />
                    <span>PERINGATAN SANKSI DISIPLIN: SANTRI SEDANG DALAM PENANGGUHAN IZIN!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-300 font-sans">
                    Santri <strong className="text-white">{selectedSantri.nama}</strong> ({selectedSantri.nis}) sedang dalam masa penangguhan izin keluar hingga tanggal <strong className="text-amber-300 underline">{selectedSantri.suspendIzinHingga}</strong> akibat keterlambatan perizinan sebelumnya.
                  </p>
                  <div className="text-[10px] text-red-400 font-mono italic">
                    Alasan: {selectedSantri.alasanSuspensi || 'Keterlambatan perizinan santri'}
                  </div>
                </div>
              )}

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
                    placeholder="Contoh: Rumah / RSUD / Pasar"
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
                  <label className="block text-neutral-400 font-medium mb-1">Jam Keluar (WIB)</label>
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
                  <label className="block text-neutral-400 font-medium mb-1">Jam Maksimal Kembali (WIB)</label>
                  <input
                    type="time"
                    required
                    value={formData.jamKembali}
                    onChange={(e) => setFormData({ ...formData, jamKembali: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Nama Penjemput / Wali</label>
                  <input
                    type="text"
                    required
                    value={formData.namaPenjemput}
                    onChange={(e) => setFormData({ ...formData, namaPenjemput: e.target.value })}
                    placeholder="Nama penjemput"
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
                    placeholder="Contoh: Orang Tua Kandung"
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
                  disabled={isSelectedSantriSuspended}
                  className={`px-5 py-2 font-bold font-mono rounded-xl cursor-pointer shadow-lg transition-all ${
                    isSelectedSantriSuspended
                      ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-500/25'
                  }`}
                >
                  {isSelectedSantriSuspended ? 'Santri Sedang Ditangguhkan' : 'Ajukan Permohonan Izin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL PENOLAKAN IZIN                                                    */}
      {/* ========================================================================= */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
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
