import React, { useMemo, useState } from 'react';
import {
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ClipboardCheck,
  FileText,
  Wallet,
  Package,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Send,
  AlertCircle,
  TrendingUp,
  Printer,
  Users,
  Target,
  MessageSquare,
  Award,
  Activity,
  Sliders,
  Inbox,
  Save,
  Download,
  Reply,
  History,
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  GlowingDot,
  GlowingActiveDot,
  LuxuryChartTooltip,
} from './LuxuryChartComponents';
import {
  AgendaPengurus,
  EvaluasiKepengurusan,
  PengajuanDivisi,
  ArsipSurat,
  TransaksiKeuangan,
  BarangInventaris,
  Perizinan,
  Pelanggaran,
  Santri,
  UserAccount,
  DivisiPondok,
  SystemConfig,
  StrukturOrganisasiNode,
  DewanKeamanan,
  PesanKoordinasi,
  ProgramKerja,
  IzinPengurus,
  NotulenRapat
} from '../types';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';
import { downloadWordDocument } from '../utils/wordExport';

interface KetuaPondokDashboardProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  arsipSurat: ArsipSurat[];
  transaksiKeuangan: TransaksiKeuangan[];
  barangInventaris: BarangInventaris[];
  agendaPengurus: AgendaPengurus[];
  evaluasiKepengurusan: EvaluasiKepengurusan[];
  pengajuanDivisi: PengajuanDivisi[];
  strukturList: StrukturOrganisasiNode[];
  dewanList: DewanKeamanan[];
  koordinasiList: PesanKoordinasi[];
  initialSubTab?:
    | 'ringkasan'
    | 'persetujuan'
    | 'pengurus_piket'
    | 'proker'
    | 'evaluasi_rapat'
    | 'sk_koordinasi'
    | 'laporan_bulanan'
    | 'option_ketua_pondok'
    | 'kotak_masuk'
    | 'evaluasi';
}

type KetuaPondokTab =
  | 'ringkasan'
  | 'persetujuan'
  | 'pengurus_piket'
  | 'proker'
  | 'evaluasi_rapat'
  | 'sk_koordinasi'
  | 'laporan_bulanan'
  | 'option_ketua_pondok';

function normalizeKetuaTab(tab?: string): KetuaPondokTab {
  if (tab === 'kotak_masuk') return 'sk_koordinasi';
  if (tab === 'evaluasi') return 'evaluasi_rapat';
  if (
    tab === 'ringkasan' ||
    tab === 'persetujuan' ||
    tab === 'pengurus_piket' ||
    tab === 'proker' ||
    tab === 'evaluasi_rapat' ||
    tab === 'sk_koordinasi' ||
    tab === 'laporan_bulanan' ||
    tab === 'option_ketua_pondok'
  ) {
    return tab;
  }
  return 'sk_koordinasi';
}

type DivisiUtama = 'Sekretaris' | 'Bendahara' | 'Perlengkapan' | 'Keamanan';
type DivisiPesanKey = DivisiUtama | 'Admin & Pimpinan';

const DIVISI_PESAN_META: {
  key: DivisiPesanKey;
  label: string;
  tujuanValue: string;
  accentClass: string;
}[] = [
  {
    key: 'Sekretaris',
    label: 'Divisi Sekretaris',
    tujuanValue: 'sekretaris',
    accentClass: 'text-[#f3d266] border-[#d4af37]/40 bg-[#d4af37]/10',
  },
  {
    key: 'Bendahara',
    label: 'Divisi Bendahara',
    tujuanValue: 'bendahara',
    accentClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  },
  {
    key: 'Perlengkapan',
    label: 'Divisi Perlengkapan & Sarpras',
    tujuanValue: 'perlengkapan',
    accentClass: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  },
  {
    key: 'Keamanan',
    label: 'Divisi Keamanan & Ketertiban',
    tujuanValue: 'semua_dewan',
    accentClass: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  },
  {
    key: 'Admin & Pimpinan',
    label: 'Admin & Pimpinan Pondok',
    tujuanValue: 'admin',
    accentClass: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
  },
];

const DIVISI_PENGAJUAN_LIST: DivisiUtama[] = ['Sekretaris', 'Bendahara', 'Perlengkapan', 'Keamanan'];

function resolveDivisiPesan(msg: PesanKoordinasi): DivisiPesanKey {
  const role = (msg.pengirimRole || '').toLowerCase();
  const jabatan = (msg.pengirimJabatan || '').toLowerCase();
  const tujuan = (msg.tujuan || '').toLowerCase();
  const judul = (msg.judul || '').toLowerCase();

  if (role === 'sekretaris' || jabatan.includes('sekretaris')) return 'Sekretaris';
  if (role === 'bendahara' || jabatan.includes('bendahara')) return 'Bendahara';
  if (role === 'perlengkapan' || jabatan.includes('perlengkapan') || jabatan.includes('sarpras')) return 'Perlengkapan';
  if (
    role === 'ketua_keamanan' ||
    role === 'anggota_keamanan' ||
    role === 'petugas_gerbang' ||
    jabatan.includes('keamanan') ||
    jabatan.includes('kamtib') ||
    jabatan.includes('gerbang') ||
    jabatan.includes('patroli')
  ) {
    return 'Keamanan';
  }
  if (tujuan.includes('sekretaris') || judul.includes('sekretaris')) return 'Sekretaris';
  if (tujuan.includes('bendahara') || judul.includes('bendahara')) return 'Bendahara';
  if (tujuan.includes('perlengkapan') || judul.includes('perlengkapan') || judul.includes('sarpras')) return 'Perlengkapan';
  if (tujuan.includes('keamanan') || tujuan.includes('dewan')) return 'Keamanan';
  return 'Admin & Pimpinan';
}

function ringkasPoinPesan(text: string, maxLen = 95): string {
  const cleaned = (text || '')
    .replace(/\[INSTRUKSI KETUA PONDOK\]\s*/gi, '')
    .replace(/^Tujuan:\s*[^\n]+\n*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '-';
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] || cleaned;
  const target = firstSentence.length >= 22 ? firstSentence : cleaned;
  return target.length > maxLen ? `${target.slice(0, maxLen - 1).trim()}…` : target;
}

export const KetuaPondokDashboard: React.FC<KetuaPondokDashboardProps> = ({
  currentUser,
  systemConfig,
  santriList,
  perizinanList,
  pelanggaranList,
  arsipSurat,
  transaksiKeuangan,
  barangInventaris,
  agendaPengurus,
  evaluasiKepengurusan,
  pengajuanDivisi,
  strukturList,
  dewanList,
  koordinasiList,
  initialSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<KetuaPondokTab>(normalizeKetuaTab(initialSubTab));

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(normalizeKetuaTab(initialSubTab));
    }
  }, [initialSubTab]);

  // State Persetujuan Divisi
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({});
  const [riwayatPengajuanFilter, setRiwayatPengajuanFilter] = useState<'Semua' | DivisiUtama>('Semua');

  // State Kotak Masuk & Tanggapan per Divisi
  const [replyingMsgId, setReplyingMsgId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [quickComposeDivisi, setQuickComposeDivisi] = useState<DivisiPesanKey | null>(null);
  const [quickComposeText, setQuickComposeText] = useState<Record<string, { judul: string; isi: string }>>({});
  const [confirmDeleteAllMsg, setConfirmDeleteAllMsg] = useState(false);

  // State Program Kerja Baru
  const [prokerForm, setProkerForm] = useState<Partial<ProgramKerja>>({
    divisi: 'Sekretaris',
    namaProgram: '',
    target: '',
    progresPersen: 75,
    penanggungJawab: '',
    tenggat: new Date().toISOString().split('T')[0],
    status: 'Berjalan',
  });

  // State Izin Pengurus Baru
  const [izinPengurusForm, setIzinPengurusForm] = useState<Partial<IzinPengurus>>({
    namaPengurus: '',
    jabatan: '',
    divisi: 'Sekretaris',
    keperluan: '',
    tglMulai: new Date().toISOString().split('T')[0],
    tglSelesai: new Date().toISOString().split('T')[0],
    penggantiPiket: '',
  });

  // State Evaluasi Kinerja
  const [evalForm, setEvalForm] = useState<Partial<EvaluasiKepengurusan>>({
    tanggal: new Date().toISOString().split('T')[0],
    divisi: 'Sekretaris',
    judul: '',
    catatanEvaluasi: '',
    tindakLanjut: '',
    nilaiKinerja: 'Sangat Baik',
  });

  // State Pesan Koordinasi / Instruksi Ketua Pondok
  const [instruksiForm, setInstruksiForm] = useState({
    judul: '',
    tujuan: 'Seluruh Pengurus Divisi',
    prioritas: 'Penting' as 'Normal' | 'Penting' | 'Mendesak',
    isi: '',
  });

  // State Options Panel Ketua Pondok
  const [optionSubSection, setOptionSubSection] = useState<
    'identitas' | 'proker' | 'evaluasi_notulen' | 'pengurus_piket' | 'persetujuan_agenda'
  >('identitas');
  const [kpSavedMsg, setKpSavedMsg] = useState('');
  const notifySaved = (msg: string) => {
    setKpSavedMsg(msg);
    setTimeout(() => setKpSavedMsg(''), 3500);
  };

  const [kpIdentitasForm, setKpIdentitasForm] = useState({
    namaPondok: systemConfig.namaPondok || 'Pondok Pesantren Salaf Al-Maliki',
    namaPimpinan: systemConfig.namaPimpinan || 'KH. Ahmad Fauzi Al-Maliki',
    kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
    alamatPondok: systemConfig.alamatPondok || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
  });

  React.useEffect(() => {
    setKpIdentitasForm({
      namaPondok: systemConfig.namaPondok || 'Pondok Pesantren Salaf Al-Maliki',
      namaPimpinan: systemConfig.namaPimpinan || 'KH. Ahmad Fauzi Al-Maliki',
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      alamatPondok: systemConfig.alamatPondok || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
    });
  }, [systemConfig.namaPondok, systemConfig.namaPimpinan, systemConfig.kotaInstansi, systemConfig.alamatPondok]);

  const [notulenForm, setNotulenForm] = useState<Partial<NotulenRapat>>({
    judulRapat: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '20:00 WIB',
    tempat: 'Aula Utama Pondok',
    pimpinanRapat: currentUser.nama,
    jumlahPeserta: 12,
    agendaBahasan: '',
    hasilKeputusan: '',
    notulis: 'Sekretaris Umum',
  });

  const [pengurusForm, setPengurusForm] = useState({
    nip: '',
    nama: '',
    gender: 'ustadz' as 'ustadz' | 'ustadzah',
    jabatan: '',
    divisi: 'Ketua Pondok' as DivisiPondok,
    bidangKitab: '',
    jadwalPiket: '',
    noWa: '0812',
  });

  const [editingProkerId, setEditingProkerId] = useState<string | null>(null);
  const [editProkerData, setEditProkerData] = useState<Partial<ProgramKerja>>({});

  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [editEvalData, setEditEvalData] = useState<Partial<EvaluasiKepengurusan>>({});

  const [editingNotulenId, setEditingNotulenId] = useState<string | null>(null);
  const [editNotulenData, setEditNotulenData] = useState<Partial<NotulenRapat>>({});

  const [editingUstadzId, setEditingUstadzId] = useState<string | null>(null);
  const [editUstadzData, setEditUstadzData] = useState<Record<string, any>>({});

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // 1. Ringkasan Semua Bagian & Grafik Line Chart Kinerja Pengurus + Kedisiplinan Santri
  const executiveMetrics = useMemo(() => {
    const pemasukan = transaksiKeuangan.filter(t => t.tipe === 'Pemasukan').reduce((a, b) => a + b.nominal, 0);
    const pengeluaran = transaksiKeuangan.filter(t => t.tipe === 'Pengeluaran').reduce((a, b) => a + b.nominal, 0);
    const saldoKas = pemasukan - pengeluaran;

    const prokerList = systemConfig.programKerjaList || [];
    const avgKinerja = prokerList.length > 0
      ? Math.round(prokerList.reduce((acc, p) => acc + p.progresPersen, 0) / prokerList.length)
      : 90;
    const kinerjaBulanLalu = 85;
    const kinerjaDiff = avgKinerja - kinerjaBulanLalu;

    const penaltyDisiplin = Math.min(22, pelanggaranList.length * 2 + perizinanList.filter(p => p.status === 'Terlambat').length * 2);
    const disiplinBulanIni = Math.max(76, 98 - penaltyDisiplin);
    const disiplinBulanLalu = 89;
    const disiplinDiff = disiplinBulanIni - disiplinBulanLalu;

    const kinerjaChartData = [
      { minggu: 'Pekan 1', bulanLalu: 82, bulanIni: 86 },
      { minggu: 'Pekan 2', bulanLalu: 84, bulanIni: 89 },
      { minggu: 'Pekan 3', bulanLalu: 86, bulanIni: 91 },
      { minggu: 'Pekan 4', bulanLalu: kinerjaBulanLalu, bulanIni: avgKinerja },
    ];

    const disiplinChartData = [
      { minggu: 'Pekan 1', bulanLalu: 88, bulanIni: 92 },
      { minggu: 'Pekan 2', bulanLalu: 87, bulanIni: 94 },
      { minggu: 'Pekan 3', bulanLalu: 90, bulanIni: 93 },
      { minggu: 'Pekan 4', bulanLalu: disiplinBulanLalu, bulanIni: disiplinBulanIni },
    ];

    return {
      pemasukan,
      pengeluaran,
      saldoKas,
      avgKinerja,
      kinerjaBulanLalu,
      kinerjaDiff,
      disiplinBulanIni,
      disiplinBulanLalu,
      disiplinDiff,
      kinerjaChartData,
      disiplinChartData,
    };
  }, [transaksiKeuangan, systemConfig.programKerjaList, pelanggaranList.length, perizinanList]);

  // Handlers Persetujuan
  const handleKeputusanPengajuan = (item: PengajuanDivisi, status: PengajuanDivisi['status']) => {
    storageService.savePengajuanDivisi({
      ...item,
      status,
      catatanKetua: catatanMap[item.id] || item.catatanKetua || `Diputuskan ${status} oleh Ketua Pondok.`,
      diputuskanOleh: currentUser.nama,
      tanggalKeputusan: new Date().toISOString().split('T')[0],
    });
  };

  const handleKeputusanIzinSantri = (izin: Perizinan, disetujui: boolean) => {
    storageService.savePerizinan({
      ...izin,
      status: disetujui ? 'Disetujui' : 'Ditolak',
      disetujuiOleh: currentUser.nama,
      riwayatPersetujuan: [
        ...(izin.riwayatPersetujuan || []),
        {
          role: 'Ketua Pondok',
          nama: currentUser.nama,
          tanggal: new Date().toISOString().split('T')[0],
          status: disetujui ? 'Setuju' : 'Tolak',
          catatan: disetujui ? 'Disetujui Ketua Pondok' : 'Ditolak Ketua Pondok',
        },
      ],
    });
  };

  const handleKeputusanIzinPengurus = (id: string, status: 'Disetujui' | 'Ditolak') => {
    const list = [...(systemConfig.izinPengurusList || [])];
    const updated = list.map(ip => (ip.id === id ? { ...ip, status } : ip));
    storageService.updateSystemConfig({ izinPengurusList: updated });
  };

  const handleTambahIzinPengurus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!izinPengurusForm.namaPengurus || !izinPengurusForm.keperluan) return;
    const item: IzinPengurus = {
      id: `izp_${Date.now()}`,
      namaPengurus: izinPengurusForm.namaPengurus,
      jabatan: izinPengurusForm.jabatan || 'Pengurus Pondok',
      divisi: izinPengurusForm.divisi || 'Umum',
      keperluan: izinPengurusForm.keperluan,
      tglMulai: izinPengurusForm.tglMulai || new Date().toISOString().split('T')[0],
      tglSelesai: izinPengurusForm.tglSelesai || new Date().toISOString().split('T')[0],
      penggantiPiket: izinPengurusForm.penggantiPiket || '-',
      status: 'Menunggu',
    };
    storageService.updateSystemConfig({
      izinPengurusList: [item, ...(systemConfig.izinPengurusList || [])],
    });
    setIzinPengurusForm({ ...izinPengurusForm, namaPengurus: '', keperluan: '', penggantiPiket: '' });
  };

  // Handlers Program Kerja
  const handleTambahProker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prokerForm.namaProgram || !prokerForm.target) return;
    const pct = Math.min(100, Math.max(0, Number(prokerForm.progresPersen) || 50));
    const isComplete = pct >= 100;
    const newProker: ProgramKerja = {
      id: `prk_${Date.now()}`,
      divisi: (prokerForm.divisi as any) || 'Sekretaris',
      namaProgram: prokerForm.namaProgram,
      target: prokerForm.target,
      progresPersen: pct,
      penanggungJawab: prokerForm.penanggungJawab || currentUser.nama,
      tenggat: prokerForm.tenggat || new Date().toISOString().split('T')[0],
      status: isComplete ? 'Tercapai' : 'Berjalan',
      tanggalTercapai: isComplete ? new Date().toISOString().split('T')[0] : undefined,
    };
    storageService.updateSystemConfig({
      programKerjaList: [newProker, ...(systemConfig.programKerjaList || [])],
    });
    setProkerForm({ ...prokerForm, namaProgram: '', target: '' });
    notifySaved(
      isComplete
        ? `Program Kerja "${newProker.namaProgram}" (100%) otomatis masuk ke Tabel Riwayat Program Kerja.`
        : `Program Kerja "${newProker.namaProgram}" berhasil ditambahkan.`
    );
  };

  const handleUpdateProkerProgress = (id: string, progresPersen: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let targetName = '';
    const updated = (systemConfig.programKerjaList || []).map(p => {
      if (p.id !== id) return p;
      targetName = p.namaProgram;
      const isComplete = progresPersen >= 100;
      return {
        ...p,
        progresPersen,
        status: (isComplete ? 'Tercapai' : 'Berjalan') as ProgramKerja['status'],
        tanggalTercapai: isComplete ? (p.tanggalTercapai || todayStr) : undefined,
      };
    });
    storageService.updateSystemConfig({ programKerjaList: updated });
    if (progresPersen >= 100 && targetName) {
      notifySaved(`Program Kerja "${targetName}" telah terealisasi 100% dan otomatis masuk ke Tabel Riwayat Program Kerja dan Target.`);
    }
  };

  const handleDeleteProker = (id: string, namaProgram?: string) => {
    const updated = (systemConfig.programKerjaList || []).filter(p => p.id !== id);
    storageService.updateSystemConfig({ programKerjaList: updated });
    notifySaved(`Riwayat Program Kerja "${namaProgram || 'terpilih'}" berhasil dihapus.`);
  };

  const handleDownloadRiwayatProkerWord = (riwayatList: ProgramKerja[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    downloadWordDocument({
      filename: `Riwayat_Program_Kerja_Target_${todayStr}.doc`,
      title: 'RIWAYAT PROGRAM KERJA & TARGET TEREALISASI (100%)',
      subtitle: `Laporan Realisasi Program Kerja Kepengurusan (${riwayatList.length} Program Tercapai 100%)`,
      namaPondok: systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
      alamatPondok:
        systemConfig.alamatPondok ||
        'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      penandatanganNama: currentUser.nama,
      penandatanganJabatan: currentUser.jabatan || 'Ketua Pondok Pesantren',
      summaryLines: [
        `Total Program Kerja Terealisasi 100%: ${riwayatList.length} program`,
        `Tanggal Ekspor Dokumen: ${todayStr}`,
      ],
      columns: [
        { header: 'No', width: '5%', align: 'center' },
        { header: 'Divisi Pelaksana', width: '15%' },
        { header: 'Nama Program Kerja', width: '25%' },
        { header: 'Indikator Target Capaian', width: '25%' },
        { header: 'Penanggung Jawab', width: '15%' },
        { header: 'Tenggat & Tercapai', width: '10%', align: 'center' },
        { header: 'Realisasi', width: '5%', align: 'center' },
      ],
      rows: riwayatList.map((pk, idx) => [
        String(idx + 1),
        pk.divisi,
        pk.namaProgram,
        pk.target,
        pk.penanggungJawab,
        `Tenggat: ${pk.tenggat}\nTercapai: ${pk.tanggalTercapai || pk.tenggat}`,
        `${pk.progresPersen}%`,
      ]),
    });
    notifySaved('File Word (.doc) Riwayat Program Kerja & Target berhasil diunduh.');
  };

  // Handler Evaluasi Kinerja
  const handleSaveEvaluasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalForm.judul || !evalForm.catatanEvaluasi) return;
    storageService.saveEvaluasiKepengurusan({
      id: `evl_${Date.now()}`,
      tanggal: evalForm.tanggal || new Date().toISOString().split('T')[0],
      divisi: (evalForm.divisi as any) || 'Umum',
      judul: evalForm.judul,
      catatanEvaluasi: evalForm.catatanEvaluasi,
      tindakLanjut: evalForm.tindakLanjut || '-',
      nilaiKinerja: (evalForm.nilaiKinerja as any) || 'Baik',
      penulisNama: currentUser.nama,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setEvalForm({ ...evalForm, judul: '', catatanEvaluasi: '', tindakLanjut: '' });
  };

  // Handler Kirim Pesan Koordinasi ke Pengurus
  const handleKirimInstruksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruksiForm.judul || !instruksiForm.isi) return;
    const msg: PesanKoordinasi = {
      id: `krd_${Date.now()}`,
      nomorTiket: `KTP-MSG-${Math.floor(1000 + Math.random() * 9000)}`,
      judul: `[INSTRUKSI KETUA PONDOK] ${instruksiForm.judul}`,
      isi: `Tujuan: ${instruksiForm.tujuan}\n\n${instruksiForm.isi}`,
      prioritas: instruksiForm.prioritas,
      kategori: 'Instruksi Admin',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan,
      tujuan: 'semua_dewan',
      waktu: new Date().toLocaleString('id-ID') + ' WIB',
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    };
    storageService.saveKoordinasi(msg);
    setInstruksiForm({ judul: '', tujuan: 'Seluruh Pengurus Divisi', prioritas: 'Penting', isi: '' });
  };

  // Handler Cetak Laporan Bulanan Ketua Pondok
  const handlePrintLaporanBulanan = () => {
    openPrintWindow('ketua-laporan-bulanan-print', `Laporan_Eksekutif_Bulanan_Ketua_Pondok_AlMaliki`);
  };

  const izinPulangPending = perizinanList.filter(
    p => p.status === 'Diajukan' || p.status === 'Diverifikasi'
  );
  const pengajuanDanaList = pengajuanDivisi.filter(p => p.jenisPengajuan === 'Pengajuan Anggaran');
  const pengajuanBarangList = pengajuanDivisi.filter(p => p.jenisPengajuan === 'Pengadaan Barang');
  const izinPengurusList = systemConfig.izinPengurusList || [];
  const skDanPengumumanList = arsipSurat.filter(s => s.kodeJenis === 'SK' || s.kodeJenis === 'SPb');

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER KETUA PONDOK */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#041d14]/95 border border-[#d4af37]/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266]">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                EXECUTIVE COMMAND CENTER
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
              Dashboard Eksekutif Ketua Pondok Pesantren
            </h1>
            <p className="text-xs text-emerald-200/75">
              Monitoring lintas bagian (Sekretaris, Bendahara, Perlengkapan, Keamanan), persetujuan terpadu, evaluasi kinerja, SK, & laporan bulanan
            </p>
          </div>
        </div>

        {/* Navigasi Sub-Tab Ketua Pondok */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
          {[
            { id: 'sk_koordinasi', label: 'Kotak Masuk & Pesan (SK)' },
            { id: 'persetujuan', label: `Persetujuan (${pengajuanDivisi.filter(p => p.status === 'Menunggu Persetujuan').length + izinPulangPending.length})` },
            { id: 'evaluasi_rapat', label: 'Evaluasi Kinerja & Rapat' },
            { id: 'proker', label: 'Program Kerja & Target' },
            { id: 'pengurus_piket', label: 'Daftar Pengurus & Piket' },
            { id: 'laporan_bulanan', label: 'Cetak Laporan Bulanan' },
            { id: 'option_ketua_pondok', label: 'Options Panel Ketua Pondok' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as KetuaPondokTab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] shadow-md'
                  : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
              }`}
            >
              {t.id === 'option_ketua_pondok' && <Sliders className="w-3.5 h-3.5" />}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: RINGKASAN SEMUA BAGIAN & GRAFIK LINE CHART KINERJA + KEDISIPLINAN */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-6">
          {/* Ringkasan Semua Bagian dalam Satu Layar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-emerald-500/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">1. Bagian Keuangan</span>
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-emerald-400 font-mono">{formatRupiah(executiveMetrics.saldoKas)}</p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                Masuk: {formatRupiah(executiveMetrics.pemasukan)} · Keluar: {formatRupiah(executiveMetrics.pengeluaran)}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#f3d266]">2. Bagian Sekretaris</span>
                <FileText className="w-5 h-5 text-[#f3d266]" />
              </div>
              <p className="text-lg font-black text-white font-mono">{arsipSurat.length} Dokumen Surat</p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                {arsipSurat.filter(s => s.status === 'Resmi / Terbit').length} Surat Resmi Terbit · {(systemConfig.notulenRapatList || []).length} Notulen Rapat
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-amber-500/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">3. Bagian Keamanan</span>
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                {perizinanList.filter(p => p.status === 'Sedang Keluar').length} Izin Aktif
              </p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                {perizinanList.filter(p => p.status === 'Terlambat').length} Terlambat · {pelanggaranList.length} Catatan Pelanggaran
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-emerald-500/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">4. Bagian Inventaris</span>
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                {barangInventaris.reduce((a, b) => a + b.jumlah, 0)} Unit Aset
              </p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                {barangInventaris.filter(b => b.kondisi === 'Baik').length} Jenis Baik · {barangInventaris.filter(b => b.kondisi !== 'Baik').length} Perlu Perbaikan
              </p>
            </div>
          </div>

          {/* 2 Grafik Line Chart: Kinerja Pengurus & Kedisiplinan Santri (Bulan Ini vs Bulan Lalu) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Grafik Line Chart Kinerja Pengurus
                  </h2>
                  <p className="text-xs text-emerald-200/70">Perbandingan Bulan Ini vs Bulan Lalu</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-400 font-mono">{executiveMetrics.avgKinerja}%</p>
                  <p className="text-[10px] font-mono text-emerald-300">
                    {executiveMetrics.kinerjaDiff >= 0 ? `+${executiveMetrics.kinerjaDiff}%` : `${executiveMetrics.kinerjaDiff}%`} vs Bulan Lalu ({executiveMetrics.kinerjaBulanLalu}%)
                  </p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={executiveMetrics.kinerjaChartData}
                    margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                  >
                    <defs>
                      <filter id="glowExecKinerja" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="execKinerjaLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="55%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#f3d266" />
                      </linearGradient>
                      <linearGradient id="execKinerjaArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="execKinerjaAreaPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                    <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                    <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                    <Tooltip
                      content={<LuxuryChartTooltip unit="%" subtitle="Indeks Kinerja Pengurus" />}
                      cursor={{ stroke: '#34d399', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
                      fill="url(#execKinerjaAreaPrev)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1400}
                    />
                    <Area
                      type="monotone"
                      dataKey="bulanIni"
                      name="Bulan Ini (%)"
                      fill="url(#execKinerjaArea)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1600}
                    />
                    <Line
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
                      stroke="#d4af37"
                      strokeWidth={2.2}
                      strokeDasharray="5 5"
                      dot={<GlowingDot color="#d4af37" accentColor="#f3d266" />}
                      activeDot={<GlowingActiveDot color="#d4af37" accentColor="#ffffff" />}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="bulanIni"
                      name="Bulan Ini (%)"
                      stroke="url(#execKinerjaLine)"
                      strokeWidth={3.5}
                      filter="url(#glowExecKinerja)"
                      dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                      activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                      isAnimationActive={true}
                      animationDuration={1700}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#f3d266]" />
                    Grafik Line Chart Kedisiplinan Santri
                  </h2>
                  <p className="text-xs text-emerald-200/70">Perbandingan Bulan Ini vs Bulan Lalu</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#f3d266] font-mono">{executiveMetrics.disiplinBulanIni}%</p>
                  <p className="text-[10px] font-mono text-emerald-300">
                    {executiveMetrics.disiplinDiff >= 0 ? `+${executiveMetrics.disiplinDiff}%` : `${executiveMetrics.disiplinDiff}%`} vs Bulan Lalu ({executiveMetrics.disiplinBulanLalu}%)
                  </p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={executiveMetrics.disiplinChartData}
                    margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                  >
                    <defs>
                      <filter id="glowExecDisiplin" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="execDisiplinLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f3d266" />
                        <stop offset="50%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient id="execDisiplinArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity={0.38} />
                        <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="execDisiplinAreaPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                    <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                    <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                    <Tooltip
                      content={<LuxuryChartTooltip unit="%" subtitle="Indeks Kedisiplinan Santri" />}
                      cursor={{ stroke: '#f3d266', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
                      fill="url(#execDisiplinAreaPrev)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1400}
                    />
                    <Area
                      type="monotone"
                      dataKey="bulanIni"
                      name="Bulan Ini (%)"
                      fill="url(#execDisiplinArea)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1600}
                    />
                    <Line
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
                      stroke="#34d399"
                      strokeWidth={2.2}
                      strokeDasharray="5 5"
                      dot={<GlowingDot color="#34d399" accentColor="#a7f3d0" />}
                      activeDot={<GlowingActiveDot color="#34d399" accentColor="#ffffff" />}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="bulanIni"
                      name="Bulan Ini (%)"
                      stroke="url(#execDisiplinLine)"
                      strokeWidth={3.5}
                      filter="url(#glowExecDisiplin)"
                      dot={<GlowingDot color="#d4af37" accentColor="#34d399" />}
                      activeDot={<GlowingActiveDot color="#d4af37" accentColor="#f3d266" />}
                      isAnimationActive={true}
                      animationDuration={1700}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSETUJUAN TERPADU (GRAFIK LINE CHART KEDISIPLINAN SANTRI, IZIN PENGURUS, IZIN SANTRI PULANG, PENGAJUAN DANA, PENGAJUAN BARANG) */}
      {activeTab === 'persetujuan' && (
        <div className="space-y-6">
          {/* Grafik Line Chart Kedisiplinan Santri & Perbandingan Bulan Ini vs Bulan Lalu */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#f3d266]" />
                  Grafik Line Chart Kedisiplinan Santri (Indikator Persetujuan Izin)
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Persentase kepatuhan santri dan perbandingan Bulan Ini vs Bulan Lalu sebagai dasar pertimbangan persetujuan izin
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[#f3d266] font-mono">{executiveMetrics.disiplinBulanIni}%</p>
                <p className="text-[10px] font-mono text-emerald-300">
                  {executiveMetrics.disiplinDiff >= 0 ? `+${executiveMetrics.disiplinDiff}%` : `${executiveMetrics.disiplinDiff}%`} dari Bulan Lalu ({executiveMetrics.disiplinBulanLalu}%)
                </p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={executiveMetrics.disiplinChartData}
                  margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
                >
                  <defs>
                    <filter id="glowKpDisiplin" x="-25%" y="-25%" width="150%" height="150%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="kpDisiplinLineCurr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f3d266" />
                      <stop offset="50%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="kpDisiplinAreaCurr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.38} />
                      <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="kpDisiplinAreaPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                  <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                  <Tooltip
                    content={<LuxuryChartTooltip unit="%" subtitle="Indeks Kedisiplinan Santri" />}
                    cursor={{ stroke: '#f3d266', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kedisiplinan Bulan Lalu (%)"
                    fill="url(#kpDisiplinAreaPrev)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                  <Area
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kedisiplinan Bulan Ini (%)"
                    fill="url(#kpDisiplinAreaCurr)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1600}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kedisiplinan Bulan Lalu (%)"
                    stroke="#34d399"
                    strokeWidth={2.2}
                    strokeDasharray="5 5"
                    dot={<GlowingDot color="#34d399" accentColor="#a7f3d0" />}
                    activeDot={<GlowingActiveDot color="#34d399" accentColor="#ffffff" />}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kedisiplinan Bulan Ini (%)"
                    stroke="url(#kpDisiplinLineCurr)"
                    strokeWidth={3.5}
                    filter="url(#glowKpDisiplin)"
                    dot={<GlowingDot color="#d4af37" accentColor="#34d399" />}
                    activeDot={<GlowingActiveDot color="#d4af37" accentColor="#f3d266" />}
                    isAnimationActive={true}
                    animationDuration={1700}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* A. Persetujuan Pengajuan Dana & Pengajuan Barang dari Divisi (Tabel Terpisah per Divisi + Riwayat & Download Word) */}
          {(() => {
            const pendingPengajuan = pengajuanDivisi.filter(
              (p) => p.status === 'Menunggu Persetujuan' || p.status === 'Perlu Revisi'
            );
            const riwayatPengajuanAll = pengajuanDivisi.filter(
              (p) => p.status === 'Disetujui' || p.status === 'Ditolak'
            );
            const riwayatPengajuanFiltered =
              riwayatPengajuanFilter === 'Semua'
                ? riwayatPengajuanAll
                : riwayatPengajuanAll.filter((p) => p.divisi === riwayatPengajuanFilter);

            const handleDownloadRiwayatPengajuanWord = () => {
              const todayStr = new Date().toISOString().split('T')[0];
              const totalDisetujui = riwayatPengajuanFiltered
                .filter((r) => r.status === 'Disetujui')
                .reduce((acc, r) => acc + (r.nominalEstimasi || 0), 0);

              downloadWordDocument({
                filename: `Riwayat_Pengajuan_Divisi_${todayStr}.doc`,
                title: 'RIWAYAT PERSETUJUAN PENGAJUAN DANA & BARANG DIVISI',
                subtitle: `Filter Divisi: ${riwayatPengajuanFilter} · Total ${riwayatPengajuanFiltered.length} Pengajuan Diputuskan`,
                namaPondok: systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
                alamatPondok:
                  systemConfig.alamatPondok ||
                  'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
                kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
                penandatanganNama: currentUser.nama,
                penandatanganJabatan: currentUser.jabatan || 'Ketua Pondok Pesantren',
                summaryLines: [
                  `Total Riwayat Disetujui: ${
                    riwayatPengajuanFiltered.filter((r) => r.status === 'Disetujui').length
                  } pengajuan (${formatRupiah(totalDisetujui)})`,
                  `Total Riwayat Ditolak: ${
                    riwayatPengajuanFiltered.filter((r) => r.status === 'Ditolak').length
                  } pengajuan`,
                ],
                columns: [
                  { header: 'No', width: '5%', align: 'center' },
                  { header: 'Tanggal & Nomor', width: '16%' },
                  { header: 'Divisi & Pengaju', width: '16%' },
                  { header: 'Jenis & Judul Pengajuan', width: '27%' },
                  { header: 'Estimasi Dana', width: '13%', align: 'right' },
                  { header: 'Keputusan & Catatan Ketua', width: '23%' },
                ],
                rows: riwayatPengajuanFiltered.map((item, idx) => [
                  String(idx + 1),
                  `${item.tanggalKeputusan || item.tanggal}\n${item.nomorPengajuan}`,
                  `${item.divisi}\n${item.pengajuNama}`,
                  `[${item.jenisPengajuan}] ${item.judul}\n${ringkasPoinPesan(item.deskripsi, 110)}`,
                  item.nominalEstimasi ? formatRupiah(item.nominalEstimasi) : '-',
                  `${item.status === 'Disetujui' ? 'DITERIMA / DISETUJUI' : 'DITOLAK'}\nCatatan: ${
                    item.catatanKetua || '-'
                  }`,
                ]),
              });
              notifySaved('Tabel Riwayat Pengajuan berhasil diunduh dalam format Word (.doc).');
            };

            return (
              <div className="space-y-6">
                <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/70 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-[#f3d266]" />
                        1. Persetujuan Pengajuan Dana &amp; Pengajuan Barang dari Divisi
                      </h2>
                      <p className="text-xs text-emerald-200/75 mt-0.5">
                        Tabel pengajuan dipisahkan per divisi ({pendingPengajuan.length} menunggu keputusan). Pengajuan yang disetujui atau ditolak otomatis masuk ke Tabel Riwayat Pengajuan di bawah.
                      </p>
                    </div>
                  </div>

                  {/* TABEL PENGAJUAN TERPISAH PER DIVISI */}
                  <div className="space-y-4">
                    {DIVISI_PENGAJUAN_LIST.map((divName) => {
                      const divItems = pendingPengajuan.filter((p) => p.divisi === divName);
                      return (
                        <div
                          key={divName}
                          className="rounded-2xl bg-[#03160f]/95 border border-emerald-800/80 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-[#062419] border-b border-emerald-800/70 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-[#f3d266]">
                                Divisi {divName}
                              </span>
                              <span className="text-[11px] font-mono text-emerald-200/80 tabular-nums">
                                · {divItems.length} pengajuan menunggu
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-emerald-900/70 text-[10px] font-mono uppercase text-emerald-300 bg-[#02110b]">
                                  <th className="py-2.5 px-3.5 whitespace-nowrap">Nomor &amp; Tanggal</th>
                                  <th className="py-2.5 px-3.5 whitespace-nowrap">Jenis &amp; Pengaju</th>
                                  <th className="py-2.5 px-3.5">Rincian Pengajuan</th>
                                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Estimasi Dana</th>
                                  <th className="py-2.5 px-3.5">Catatan Ketua</th>
                                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Keputusan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-900/50 text-xs">
                                {divItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="py-4 px-4 text-center text-emerald-200/60">
                                      Tidak ada pengajuan menunggu persetujuan dari Divisi {divName}.
                                    </td>
                                  </tr>
                                ) : (
                                  divItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#06281c]/45 align-top">
                                      <td className="py-3 px-3.5 font-mono text-[11px] text-emerald-200 whitespace-nowrap tabular-nums">
                                        <div className="font-bold text-[#f3d266]">{item.nomorPengajuan}</div>
                                        <div className="text-emerald-300/75">{item.tanggal}</div>
                                      </td>
                                      <td className="py-3 px-3.5 whitespace-nowrap">
                                        <div className="font-bold text-white">{item.jenisPengajuan}</div>
                                        <div className="text-[11px] text-emerald-200/80">{item.pengajuNama}</div>
                                      </td>
                                      <td className="py-3 px-3.5 min-w-[220px] max-w-md">
                                        <div className="font-bold text-white">{item.judul}</div>
                                        <div className="text-[11px] text-emerald-100/80 mt-0.5">{item.deskripsi}</div>
                                      </td>
                                      <td className="py-3 px-3.5 text-right font-mono font-bold text-[#f3d266] whitespace-nowrap tabular-nums">
                                        {item.nominalEstimasi ? formatRupiah(item.nominalEstimasi) : '-'}
                                      </td>
                                      <td className="py-3 px-3.5 min-w-[170px]">
                                        <input
                                          type="text"
                                          placeholder="Catatan keputusan..."
                                          value={catatanMap[item.id] ?? item.catatanKetua ?? ''}
                                          onChange={(e) => setCatatanMap({ ...catatanMap, [item.id]: e.target.value })}
                                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                                        />
                                      </td>
                                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleKeputusanPengajuan(item, 'Disetujui')}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleKeputusanPengajuan(item, 'Ditolak')}
                                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/85 hover:bg-rose-600 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                                          >
                                            <XCircle className="w-3.5 h-3.5" /> Tolak
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TABEL RIWAYAT PENGAJUAN (OTOMATIS MASUK SETELAH DISETUJUI / DITOLAK + HAPUS + DOWNLOAD WORD) */}
                <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-600/45 p-5 shadow-xl space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-800/70 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-400" />
                        Riwayat Pengajuan Divisi ({riwayatPengajuanAll.length})
                      </h3>
                      <p className="text-xs text-emerald-200/75 mt-0.5">
                        Daftar pengajuan yang telah diterima atau ditolak oleh Ketua Pondok secara otomatis.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap items-center gap-1 bg-[#02100a] p-1 rounded-xl border border-emerald-800/70">
                        {(['Semua', ...DIVISI_PENGAJUAN_LIST] as const).map((divOpt) => (
                          <button
                            key={divOpt}
                            type="button"
                            onClick={() => setRiwayatPengajuanFilter(divOpt)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                              riwayatPengajuanFilter === divOpt
                                ? 'bg-[#d4af37] text-[#02120a]'
                                : 'text-emerald-200 hover:text-white'
                            }`}
                          >
                            {divOpt}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadRiwayatPengajuanWord}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] hover:brightness-105 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Word (.doc)</span>
                      </button>
                    </div>
                  </div>

                  {kpSavedMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{kpSavedMsg}</span>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-2xl border border-emerald-800/70 bg-[#03160f]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-800/80 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02110b]">
                          <th className="py-3 px-3.5 text-center whitespace-nowrap">No</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Tanggal &amp; Nomor</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Divisi &amp; Pengaju</th>
                          <th className="py-3 px-3.5">Inti Pengajuan</th>
                          <th className="py-3 px-3.5 text-right whitespace-nowrap">Estimasi</th>
                          <th className="py-3 px-3.5">Keputusan &amp; Catatan</th>
                          <th className="py-3 px-3.5 text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-900/50 text-xs">
                        {riwayatPengajuanFiltered.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 px-4 text-center text-emerald-200/65">
                              Belum ada riwayat pengajuan yang disetujui atau ditolak.
                            </td>
                          </tr>
                        ) : (
                          riwayatPengajuanFiltered.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-[#06281c]/45 align-top">
                              <td className="py-3 px-3.5 text-center font-mono text-emerald-300 tabular-nums">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap tabular-nums">
                                <div className="text-white font-bold">{item.tanggalKeputusan || item.tanggal}</div>
                                <div className="text-emerald-300/75">{item.nomorPengajuan}</div>
                              </td>
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="font-bold text-[#f3d266]">{item.divisi}</div>
                                <div className="text-[11px] text-emerald-200/80">{item.pengajuNama}</div>
                              </td>
                              <td className="py-3 px-3.5 min-w-[200px] max-w-sm">
                                <div className="font-bold text-white">{item.judul}</div>
                                <div className="text-[11px] text-emerald-100/75 mt-0.5">
                                  {item.jenisPengajuan} · {ringkasPoinPesan(item.deskripsi, 95)}
                                </div>
                              </td>
                              <td className="py-3 px-3.5 text-right font-mono font-bold text-[#f3d266] whitespace-nowrap tabular-nums">
                                {item.nominalEstimasi ? formatRupiah(item.nominalEstimasi) : '-'}
                              </td>
                              <td className="py-3 px-3.5 min-w-[180px]">
                                <div
                                  className={`font-bold text-[11px] ${
                                    item.status === 'Disetujui' ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {item.status === 'Disetujui' ? 'Diterima / Disetujui' : 'Ditolak'}
                                </div>
                                <div className="text-[11px] text-emerald-100/80 mt-0.5">
                                  {item.catatanKetua || '-'}
                                </div>
                                {item.diputuskanOleh && (
                                  <div className="text-[10px] font-mono text-emerald-300/70 mt-0.5">
                                    Oleh: {item.diputuskanOleh}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    storageService.deletePengajuanDivisi(item.id);
                                    notifySaved(`Riwayat pengajuan "${item.judul}" berhasil dihapus.`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/85 hover:bg-rose-900 text-rose-200 border border-rose-500/45 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                  title="Hapus pengajuan dari riwayat"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* B. Persetujuan Izin Santri Pulang & Izin Pengurus */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Izin Santri Pulang */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                2. Persetujuan Izin Santri Pulang / Keluar
              </h2>
              <div className="space-y-3">
                {perizinanList.slice(0, 6).map((iz) => (
                  <div key={iz.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{iz.santriNama}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-[#f3d266] border border-[#d4af37]/30">
                          {iz.jenisIzin}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/75 mt-0.5">{iz.alasan} ({iz.tglKeluar} s/d {iz.tglKembali})</p>
                      <span className="text-[10px] font-mono text-emerald-400">Status: {iz.status}</span>
                    </div>
                    {(iz.status === 'Diajukan' || iz.status === 'Diverifikasi') && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleKeputusanIzinSantri(iz, true)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleKeputusanIzinSantri(iz, false)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Izin Pengurus */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-[#f3d266]" />
                3. Persetujuan Izin Pengurus Pondok
              </h2>

              <form onSubmit={handleTambahIzinPengurus} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#03160f] border border-emerald-800/60">
                <input
                  type="text"
                  placeholder="Nama Pengurus..."
                  value={izinPengurusForm.namaPengurus}
                  onChange={e => setIzinPengurusForm({ ...izinPengurusForm, namaPengurus: e.target.value })}
                  className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Pengganti Piket..."
                  value={izinPengurusForm.penggantiPiket}
                  onChange={e => setIzinPengurusForm({ ...izinPengurusForm, penggantiPiket: e.target.value })}
                  className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Keperluan Izin..."
                  value={izinPengurusForm.keperluan}
                  onChange={e => setIzinPengurusForm({ ...izinPengurusForm, keperluan: e.target.value })}
                  className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
                >
                  + Catat Permohonan Izin Pengurus
                </button>
              </form>

              <div className="space-y-2.5">
                {izinPengurusList.map((ip) => (
                  <div key={ip.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">{ip.namaPengurus} ({ip.divisi})</p>
                      <p className="text-[11px] text-emerald-200/75">{ip.keperluan} · Pengganti: {ip.penggantiPiket}</p>
                      <span className="text-[10px] font-mono text-[#f3d266]">
                        {ip.tglMulai} s/d {ip.tglSelesai} · Status: {ip.status}
                      </span>
                    </div>
                    {ip.status === 'Menunggu' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleKeputusanIzinPengurus(ip.id, 'Disetujui')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleKeputusanIzinPengurus(ip.id, 'Ditolak')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR PENGURUS BESERTA TUGAS (TUPOKSI) DAN JADWAL PIKETNYA */}
      {activeTab === 'pengurus_piket' && (
        <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f3d266]" />
              Daftar Pengurus Pondok, Tugas Pokok (Tupoksi), & Jadwal Piket
            </h2>
            <p className="text-xs text-emerald-200/75">
              Monitoring tanggung jawab setiap personil pengurus dan asatidz di seluruh bagian
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-800/80 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                  <th className="py-3 px-4">Nama Pengurus / Asatidz</th>
                  <th className="py-3 px-4">Jabatan & Divisi</th>
                  <th className="py-3 px-4">Tugas Pokok / Bidang Kitab</th>
                  <th className="py-3 px-4">Jadwal Piket</th>
                  <th className="py-3 px-4">Kontak WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/50 text-xs">
                {(systemConfig.ustadzList || []).map((u) => {
                  const orgNode = strukturList.find(s => s.namaPengurus === u.nama);
                  return (
                    <tr key={u.id} className="hover:bg-[#06281c]/50">
                      <td className="py-3 px-4 font-bold text-white">
                        {u.nama}
                        <span className="block text-[10px] font-mono text-emerald-400">{u.nip}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-100 font-semibold">{u.jabatan}</span>
                        <span className="block text-[10px] font-mono text-[#f3d266]">{u.divisi}</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-100/85 max-w-md">
                        {orgNode ? orgNode.tupoksi : `Pengampu ${u.bidangKitab} & pembinaan santri`}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-300">
                        {u.jadwalPiket}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-200">{u.noWa}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROGRAM KERJA, TARGET, DAN PROGRESNYA */}
      {activeTab === 'proker' && (() => {
        const allProker = systemConfig.programKerjaList || [];
        const activeProkerList = allProker.filter(p => p.progresPersen < 100);
        const riwayatProkerList = allProker.filter(p => p.progresPersen >= 100);

        return (
          <div className="space-y-6">
            {kpSavedMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-[#d4af37]/50 text-xs font-bold text-[#f3d266] flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{kpSavedMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form onSubmit={handleTambahProker} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4 h-fit">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#f3d266]" />
                  Tambah Program Kerja &amp; Target
                </h2>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Divisi Pelaksana</label>
                  <select
                    value={prokerForm.divisi}
                    onChange={e => setProkerForm({ ...prokerForm, divisi: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  >
                    <option value="Sekretaris">Sekretaris</option>
                    <option value="Bendahara">Bendahara</option>
                    <option value="Perlengkapan">Perlengkapan</option>
                    <option value="Keamanan">Keamanan</option>
                    <option value="Pendidikan & Taklim">Pendidikan &amp; Taklim</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Program Kerja</label>
                  <input
                    type="text"
                    required
                    value={prokerForm.namaProgram}
                    onChange={e => setProkerForm({ ...prokerForm, namaProgram: e.target.value })}
                    placeholder="Contoh: Digitalisasi Arsip Surat..."
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Indikator Target Capaian</label>
                  <input
                    type="text"
                    required
                    value={prokerForm.target}
                    onChange={e => setProkerForm({ ...prokerForm, target: e.target.value })}
                    placeholder="Contoh: 100% terdata sebelum akhir semester"
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Penanggung Jawab</label>
                  <input
                    type="text"
                    value={prokerForm.penanggungJawab}
                    onChange={e => setProkerForm({ ...prokerForm, penanggungJawab: e.target.value })}
                    placeholder="Nama Kepala Divisi..."
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Progres Awal (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={prokerForm.progresPersen ?? 50}
                      onChange={e => setProkerForm({ ...prokerForm, progresPersen: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Tenggat</label>
                    <input
                      type="date"
                      value={prokerForm.tenggat || ''}
                      onChange={e => setProkerForm({ ...prokerForm, tenggat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
                >
                  Simpan Program Kerja Baru
                </button>
              </form>

              <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Daftar Program Kerja, Target, &amp; Progres Realisasi ({activeProkerList.length})
                    </h2>
                    <p className="text-xs text-emerald-200/75 mt-0.5">
                      Ketika progres mencapai 100%, program otomatis berpindah ke Tabel Riwayat Program Kerja dan Target di bawah.
                    </p>
                  </div>
                </div>

                {activeProkerList.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#03160f] border border-emerald-800/60 text-center text-xs text-emerald-200/70">
                    Seluruh program kerja telah terealisasi 100% dan tercatat pada Tabel Riwayat di bawah. Tambahkan program baru di sebelah kiri.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProkerList.map((pk) => (
                      <div key={pk.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                            DIVISI {pk.divisi.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            Progres: {pk.progresPersen}% ({pk.status})
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{pk.namaProgram}</h3>
                        <p className="text-xs text-emerald-200/80">Target: {pk.target} · PJ: {pk.penanggungJawab}</p>
                        <div className="w-full h-2.5 rounded-full bg-emerald-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-[#d4af37] transition-all"
                            style={{ width: `${pk.progresPersen}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] font-mono text-emerald-400/75">Tenggat: {pk.tenggat}</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[50, 75, 90, 100].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleUpdateProkerProgress(pk.id, pct)}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                                  pct === 100
                                    ? 'bg-[#d4af37]/25 hover:bg-[#d4af37] text-[#f3d266] hover:text-[#02120a] border-[#d4af37]/55'
                                    : 'bg-[#06281c] hover:bg-[#0b422d] text-emerald-200 border-emerald-700/50'
                                }`}
                              >
                                {pct === 100 ? 'Realisasi 100%' : `Set ${pct}%`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TABEL RIWAYAT PROGRAM KERJA DAN TARGET (OTOMATIS MASUK KETIKA TEREALISASI 100%) */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/45 p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/70 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-[#f3d266]" />
                    <span>Tabel Riwayat Program Kerja dan Target (Terealisasi 100% — {riwayatProkerList.length})</span>
                  </h2>
                  <p className="text-xs text-emerald-200/75 mt-0.5">
                    Program kerja yang telah mencapai realisasi 100% otomatis tercatat di sini dan dapat diunduh sebagai dokumen Word (.doc).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadRiwayatProkerWord(riwayatProkerList)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] hover:brightness-105 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Word (.doc)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-emerald-800/70 bg-[#03160f]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-800/80 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02110b]">
                      <th className="py-3 px-3.5 text-center whitespace-nowrap">No</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Divisi &amp; Penanggung Jawab</th>
                      <th className="py-3 px-3.5">Program Kerja &amp; Target Capaian</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Tenggat &amp; Tgl Tercapai</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap">Realisasi</th>
                      <th className="py-3 px-3.5 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50 text-xs">
                    {riwayatProkerList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 px-4 text-center text-emerald-200/65">
                          Belum ada Program Kerja yang terealisasi 100%. Klik &quot;Realisasi 100%&quot; pada program kerja di atas untuk memasukkannya ke riwayat.
                        </td>
                      </tr>
                    ) : (
                      riwayatProkerList.map((pk, idx) => (
                        <tr key={pk.id} className="hover:bg-[#06281c]/45 align-top">
                          <td className="py-3 px-3.5 text-center font-mono text-emerald-300 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40 font-mono text-[10px] font-bold">
                              {pk.divisi}
                            </span>
                            <div className="text-[11px] text-emerald-100 mt-1 font-semibold">{pk.penanggungJawab}</div>
                          </td>
                          <td className="py-3 px-3.5 min-w-[240px] max-w-md">
                            <div className="font-bold text-white">{pk.namaProgram}</div>
                            <div className="text-[11px] text-emerald-200/80 mt-0.5">Target: {pk.target}</div>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap tabular-nums">
                            <div className="text-emerald-300/80">Tenggat: {pk.tenggat}</div>
                            <div className="text-emerald-400 font-bold mt-0.5">
                              Selesai: {pk.tanggalTercapai || pk.tenggat}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              100% Tercapai
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteProker(pk.id, pk.namaProgram)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/35 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="Hapus Riwayat Program Kerja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 5: EVALUASI KINERJA PENGURUS & CATATAN RAPAT (NOTULEN) */}
      {activeTab === 'evaluasi_rapat' && (
        <div className="space-y-6">
          {/* Grafik Line Chart Kinerja Pengurus & Perbandingan Bulan Ini vs Bulan Lalu */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Grafik Line Chart Kinerja Pengurus & Perbandingan Bulan Ini vs Bulan Lalu
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Persentase capaian program kerja & evaluasi seluruh divisi pengurus
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-400 font-mono">{executiveMetrics.avgKinerja}%</p>
                <p className="text-[10px] font-mono text-emerald-300">
                  {executiveMetrics.kinerjaDiff >= 0 ? `+${executiveMetrics.kinerjaDiff}%` : `${executiveMetrics.kinerjaDiff}%`} dari Bulan Lalu ({executiveMetrics.kinerjaBulanLalu}%)
                </p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={executiveMetrics.kinerjaChartData}
                  margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
                >
                  <defs>
                    <filter id="glowKpKinerja" x="-25%" y="-25%" width="150%" height="150%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="kpKinerjaLineCurr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="55%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f3d266" />
                    </linearGradient>
                    <linearGradient id="kpKinerjaAreaCurr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.42} />
                      <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="kpKinerjaAreaPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                  <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                  <Tooltip
                    content={<LuxuryChartTooltip unit="%" subtitle="Evaluasi Kinerja Pengurus Pondok" />}
                    cursor={{ stroke: '#34d399', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kinerja Bulan Lalu (%)"
                    fill="url(#kpKinerjaAreaPrev)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                  <Area
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kinerja Bulan Ini (%)"
                    fill="url(#kpKinerjaAreaCurr)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1600}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kinerja Bulan Lalu (%)"
                    stroke="#d4af37"
                    strokeWidth={2.2}
                    strokeDasharray="5 5"
                    dot={<GlowingDot color="#d4af37" accentColor="#f3d266" />}
                    activeDot={<GlowingActiveDot color="#d4af37" accentColor="#ffffff" />}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kinerja Bulan Ini (%)"
                    stroke="url(#kpKinerjaLineCurr)"
                    strokeWidth={3.5}
                    filter="url(#glowKpKinerja)"
                    dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                    activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                    isAnimationActive={true}
                    animationDuration={1700}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evaluasi Kinerja Pengurus */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Evaluasi Kinerja Pengurus per Divisi
              </h2>
            <form onSubmit={handleSaveEvaluasi} className="space-y-3 p-3.5 rounded-2xl bg-[#03160f] border border-emerald-800/70">
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={evalForm.divisi}
                  onChange={e => setEvalForm({ ...evalForm, divisi: e.target.value as any })}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
                >
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Perlengkapan">Perlengkapan</option>
                  <option value="Keamanan">Keamanan</option>
                  <option value="Umum">Seluruh Divisi</option>
                </select>
                <select
                  value={evalForm.nilaiKinerja}
                  onChange={e => setEvalForm({ ...evalForm, nilaiKinerja: e.target.value as any })}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
                >
                  <option value="Sangat Baik">Sangat Baik</option>
                  <option value="Baik">Baik</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                </select>
              </div>
              <input
                type="text"
                required
                placeholder="Judul Evaluasi..."
                value={evalForm.judul}
                onChange={e => setEvalForm({ ...evalForm, judul: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
              />
              <textarea
                rows={2}
                required
                placeholder="Catatan Evaluasi & Rekomendasi..."
                value={evalForm.catatanEvaluasi}
                onChange={e => setEvalForm({ ...evalForm, catatanEvaluasi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
              >
                Simpan Evaluasi Kinerja
              </button>
            </form>

            <div className="space-y-2.5">
              {evaluasiKepengurusan.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#f3d266] font-bold">
                      Divisi {ev.divisi} · {ev.tanggal}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                      {ev.nilaiKinerja}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{ev.judul}</p>
                  <p className="text-[11px] text-emerald-100/80">{ev.catatanEvaluasi}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Catatan Rapat (Notulen Rapat) */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Catatan & Notulen Rapat Pleno Pengurus
            </h2>
            <div className="space-y-3">
              {(systemConfig.notulenRapatList || []).map((nt) => (
                <div key={nt.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#f3d266]">
                    <span>{nt.tanggal} · {nt.waktu}</span>
                    <span>{nt.jumlahPeserta} Peserta Hadir</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{nt.judulRapat}</h3>
                  <p className="text-xs text-emerald-200/80">Agenda: {nt.agendaBahasan}</p>
                  <div className="p-3 rounded-xl bg-black/50 border border-emerald-900/70 text-[11px] text-emerald-100 whitespace-pre-line">
                    {nt.hasilKeputusan}
                  </div>
                  <p className="text-[10px] font-mono text-emerald-400">
                    Pimpinan: {nt.pimpinanRapat} · Notulis: {nt.notulis}
                  </p>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* TAB 6: KOTAK MASUK PESAN PER DIVISI, TANGGAPI + ICON KIRIM, RIWAYAT PESAN MASUK, HAPUS & DOWNLOAD WORD */}
      {activeTab === 'sk_koordinasi' && (() => {
        const isMessageResponded = (m: PesanKoordinasi) =>
          m.status === 'Ditindaklanjuti' ||
          Boolean(m.tindakLanjutCatatan && m.tindakLanjutCatatan.trim() !== '') ||
          (m.balasan || []).some(
            (b) => b.pengirimRole === 'ketua_pondok' || b.pengirimId === currentUser.id
          );

        const activeIncomingMessages = koordinasiList.filter((m) => !isMessageResponded(m));
        const riwayatMessages = koordinasiList.filter((m) => isMessageResponded(m));

        const handleKirimTanggapanPesan = (msg: PesanKoordinasi, divLabel: string) => {
          const text = (replyTextMap[msg.id] || '').trim();
          if (!text) return;

          const waktuNow =
            new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

          storageService.tanggapiKoordinasi(
            msg.id,
            {
              id: `bal_${Date.now()}`,
              pesanId: msg.id,
              pengirimId: currentUser.id,
              pengirimNama: currentUser.nama,
              pengirimRole: currentUser.role,
              pengirimJabatan: currentUser.jabatan || 'Ketua Pondok Pesantren',
              pengirimAvatar: currentUser.avatar || '',
              isi: text,
              waktu: waktuNow,
            },
            text
          );

          setReplyTextMap((prev) => ({ ...prev, [msg.id]: '' }));
          setReplyingMsgId(null);
          notifySaved(`Tanggapan dikirim ke ${divLabel} dan otomatis masuk ke Riwayat Pesan Masuk.`);
        };

        const handleKirimPesanKeDivisi = (divMeta: (typeof DIVISI_PESAN_META)[number]) => {
          const draft = quickComposeText[divMeta.key] || { judul: '', isi: '' };
          if (!draft.judul.trim() || !draft.isi.trim()) return;

          const newMsg: PesanKoordinasi = {
            id: `krd_${Date.now()}`,
            nomorTiket: `KTP-${divMeta.key.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
            judul: `[KETUA PONDOK -> ${divMeta.label.toUpperCase()}] ${draft.judul.trim()}`,
            isi: draft.isi.trim(),
            prioritas: 'Penting',
            kategori: 'Instruksi Admin',
            pengirimId: currentUser.id,
            pengirimNama: currentUser.nama,
            pengirimRole: currentUser.role,
            pengirimJabatan: currentUser.jabatan || 'Ketua Pondok Pesantren',
            tujuan: divMeta.tujuanValue,
            waktu: new Date().toLocaleString('id-ID') + ' WIB',
            status: 'Terkirim',
            dibacaOleh: [currentUser.id],
            balasan: [],
          };

          storageService.saveKoordinasi(newMsg);
          setQuickComposeText((prev) => ({ ...prev, [divMeta.key]: { judul: '', isi: '' } }));
          setQuickComposeDivisi(null);
          notifySaved(`Pesan langsung berhasil dikirim ke ${divMeta.label}.`);
        };

        const handleDownloadRiwayatPesanWord = () => {
          const todayStr = new Date().toISOString().split('T')[0];
          downloadWordDocument({
            filename: `Riwayat_Pesan_Masuk_Ketua_Pondok_${todayStr}.doc`,
            title: 'RIWAYAT PESAN MASUK & TANGGAPAN KETUA PONDOK',
            subtitle: `Ringkasan Poin Pesan Lintas Divisi (${riwayatMessages.length} Pesan Ditanggapi)`,
            namaPondok: systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
            alamatPondok:
              systemConfig.alamatPondok ||
              'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
            kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
            penandatanganNama: currentUser.nama,
            penandatanganJabatan: currentUser.jabatan || 'Ketua Pondok Pesantren',
            summaryLines: [
              `Total Pesan Masuk Saat Ini: ${koordinasiList.length} pesan (${activeIncomingMessages.length} menunggu tanggapan, ${riwayatMessages.length} sudah ditanggapi)`,
            ],
            columns: [
              { header: 'No', width: '5%', align: 'center' },
              { header: 'Tanggal & Tiket', width: '16%' },
              { header: 'Divisi & Pengirim', width: '17%' },
              { header: 'Inti Pesan Masuk', width: '31%' },
              { header: 'Inti Tanggapan Ketua Pondok', width: '31%' },
            ],
            rows: riwayatMessages.map((msg, idx) => {
              const divKey = resolveDivisiPesan(msg);
              const ketuaBalasan = [...(msg.balasan || [])]
                .reverse()
                .find((b) => b.pengirimRole === 'ketua_pondok' || b.pengirimId === currentUser.id);
              const rawTanggapan =
                ketuaBalasan?.isi ||
                msg.tindakLanjutCatatan ||
                (msg.balasan && msg.balasan.length > 0 ? msg.balasan[msg.balasan.length - 1].isi : '-');
              return [
                String(idx + 1),
                `${msg.waktu}\n${msg.nomorTiket}`,
                `${divKey}\n${msg.pengirimNama}`,
                `${ringkasPoinPesan(msg.judul, 75)}\nPoin: ${ringkasPoinPesan(msg.isi, 110)}`,
                `${ringkasPoinPesan(rawTanggapan, 115)}\n(${msg.tindakLanjutOleh || ketuaBalasan?.pengirimNama || currentUser.nama})`,
              ];
            }),
          });
          notifySaved('Riwayat Pesan Masuk berhasil diunduh dalam format Word (.doc).');
        };

        const visibleDivisionSections = DIVISI_PESAN_META.filter(
          (meta) =>
            meta.key !== 'Admin & Pimpinan' ||
            activeIncomingMessages.some((m) => resolveDivisiPesan(m) === 'Admin & Pimpinan')
        );

        return (
          <div className="space-y-6">
            {/* HEADER KOTAK MASUK + HAPUS SEMUA PESAN MASUK */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-800/70 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#f3d266]" />
                    Kotak Masuk Pesan &amp; Laporan Lintas Divisi ({koordinasiList.length})
                  </h2>
                  <p className="text-xs text-emerald-200/75 mt-0.5">
                    Tabel pesan dipisahkan untuk setiap divisi. Klik <strong className="text-[#f3d266]">Tanggapi</strong> lalu tekan ikon kirim untuk membalas divisi bersangkutan dan memindahkannya ke Riwayat Pesan Masuk.
                  </p>
                </div>

                {koordinasiList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!confirmDeleteAllMsg ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAllMsg(true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Semua Pesan Masuk ({koordinasiList.length})</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/60 rounded-xl px-2.5 py-1.5">
                        <span className="text-[11px] font-bold text-rose-200">Hapus semua?</span>
                        <button
                          type="button"
                          onClick={() => {
                            storageService.deleteAllKoordinasi();
                            setConfirmDeleteAllMsg(false);
                            setReplyingMsgId(null);
                            notifySaved('Seluruh pesan masuk telah dihapus.');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAllMsg(false)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-200 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {kpSavedMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{kpSavedMsg}</span>
                </div>
              )}

              {/* TABEL PESAN TERPISAH DI SETIAP DIVISI */}
              <div className="space-y-4">
                {visibleDivisionSections.map((divMeta) => {
                  const divMessages = activeIncomingMessages.filter(
                    (m) => resolveDivisiPesan(m) === divMeta.key
                  );
                  const unreadInDiv = divMessages.filter(
                    (m) => !(m.dibacaOleh || []).includes(currentUser.id) && m.status === 'Terkirim'
                  ).length;
                  const isComposingHere = quickComposeDivisi === divMeta.key;
                  const draftHere = quickComposeText[divMeta.key] || { judul: '', isi: '' };

                  return (
                    <div
                      key={divMeta.key}
                      className="rounded-2xl bg-[#03160f]/95 border border-emerald-800/80 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-[#062419] border-b border-emerald-800/70 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${divMeta.accentClass}`}>
                            {divMeta.label}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-200/80 tabular-nums">
                            {divMessages.length} pesan aktif
                            {unreadInDiv > 0 ? ` · ${unreadInDiv} belum dibaca` : ''}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setQuickComposeDivisi(isComposingHere ? null : divMeta.key)
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#f3d266] border border-[#d4af37]/45 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isComposingHere ? 'Tutup Form Pesan' : `Kirim Pesan ke ${divMeta.key}`}</span>
                        </button>
                      </div>

                      {isComposingHere && (
                        <div className="p-3.5 bg-[#041d14] border-b border-emerald-800/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Judul pesan untuk ${divMeta.label}...`}
                            value={draftHere.judul}
                            onChange={(e) =>
                              setQuickComposeText((prev) => ({
                                ...prev,
                                [divMeta.key]: { ...draftHere, judul: e.target.value },
                              }))
                            }
                            className="sm:w-1/3 px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                          <input
                            type="text"
                            placeholder={`Tulis instruksi atau pesan ke ${divMeta.label}...`}
                            value={draftHere.isi}
                            onChange={(e) =>
                              setQuickComposeText((prev) => ({
                                ...prev,
                                [divMeta.key]: { ...draftHere, isi: e.target.value },
                              }))
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                          <button
                            type="button"
                            onClick={() => handleKirimPesanKeDivisi(divMeta)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim</span>
                          </button>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-emerald-900/70 text-[10px] font-mono uppercase text-emerald-300 bg-[#02110b]">
                              <th className="py-2.5 px-3.5 whitespace-nowrap">Tiket &amp; Waktu</th>
                              <th className="py-2.5 px-3.5 whitespace-nowrap">Pengirim</th>
                              <th className="py-2.5 px-3.5">Pesan / Laporan Masuk</th>
                              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Tanggapi &amp; Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-900/50 text-xs">
                            {divMessages.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 px-4 text-center text-emerald-200/60">
                                  Tidak ada pesan baru yang menunggu tanggapan dari {divMeta.label}.
                                </td>
                              </tr>
                            ) : (
                              divMessages.map((msg) => {
                                const isRead =
                                  (msg.dibacaOleh || []).includes(currentUser.id) || msg.status === 'Dibaca';
                                const isReplying = replyingMsgId === msg.id;
                                return (
                                  <React.Fragment key={msg.id}>
                                    <tr className={`${isRead ? 'hover:bg-[#06281c]/40' : 'bg-[#072c1e]/50 hover:bg-[#083525]/60'} align-top`}>
                                      <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap tabular-nums">
                                        <div className="font-bold text-[#f3d266]">{msg.nomorTiket}</div>
                                        <div className="text-emerald-300/75">{msg.waktu}</div>
                                        <div className={`mt-1 text-[10px] font-bold ${isRead ? 'text-emerald-400' : 'text-amber-300'}`}>
                                          {isRead ? 'Sudah Terbaca' : 'Pesan Baru'} · {msg.prioritas}
                                        </div>
                                      </td>
                                      <td className="py-3 px-3.5 whitespace-nowrap">
                                        <div className="font-bold text-white">{msg.pengirimNama}</div>
                                        <div className="text-[11px] text-emerald-200/75">
                                          {msg.pengirimJabatan || msg.pengirimRole}
                                        </div>
                                      </td>
                                      <td className="py-3 px-3.5 min-w-[230px] max-w-lg">
                                        <div className="font-bold text-white">{msg.judul}</div>
                                        <div className="text-xs text-emerald-100/85 whitespace-pre-line mt-0.5">
                                          {msg.isi}
                                        </div>
                                      </td>
                                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!isRead) {
                                                storageService.markKoordinasiAsRead(msg.id, currentUser.id);
                                              }
                                              setReplyingMsgId(isReplying ? null : msg.id);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c24a] text-[#02120a] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                          >
                                            <Reply className="w-3.5 h-3.5" />
                                            <span>{isReplying ? 'Tutup' : 'Tanggapi'}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              storageService.deleteKoordinasi(msg.id);
                                              notifySaved(`Pesan "${msg.judul}" berhasil dihapus.`);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/85 hover:bg-rose-900 text-rose-200 border border-rose-500/45 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                            title="Hapus pesan ini"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Hapus</span>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {isReplying && (
                                      <tr className="bg-[#02120c]">
                                        <td colSpan={4} className="px-4 py-3 border-t border-[#d4af37]/30">
                                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            <span className="text-[11px] font-bold text-[#f3d266] whitespace-nowrap">
                                              Tanggapi ke {divMeta.label}:
                                            </span>
                                            <input
                                              type="text"
                                              autoFocus
                                              placeholder={`Tulis tanggapan untuk ${msg.pengirimNama} (${divMeta.label})...`}
                                              value={replyTextMap[msg.id] || ''}
                                              onChange={(e) =>
                                                setReplyTextMap((prev) => ({ ...prev, [msg.id]: e.target.value }))
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                  e.preventDefault();
                                                  handleKirimTanggapanPesan(msg, divMeta.label);
                                                }
                                              }}
                                              className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-[#d4af37]/50 text-xs text-white focus:outline-none focus:border-[#f3d266]"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleKirimTanggapanPesan(msg, divMeta.label)}
                                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                                              title={`Kirim tanggapan ke ${divMeta.label}`}
                                            >
                                              <Send className="w-3.5 h-3.5" />
                                              <span>Kirim</span>
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

            {/* TABEL RIWAYAT PESAN MASUK (OTOMATIS MASUK SETELAH DITANGGAPI, RINGKAS AMBIL POIN & INTINYA + DOWNLOAD WORD) */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-600/45 p-5 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-800/70 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    Riwayat Pesan Masuk ({riwayatMessages.length})
                  </h2>
                  <p className="text-xs text-emerald-200/75 mt-0.5">
                    Pesan yang sudah ditanggapi otomatis tercatat ringkas (poin dan intinya saja) di tabel ini.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadRiwayatPesanWord}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] hover:brightness-105 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Riwayat Pesan Word (.doc)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-emerald-800/70 bg-[#03160f]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-800/80 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02110b]">
                      <th className="py-3 px-3.5 text-center whitespace-nowrap">No</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Waktu &amp; Tiket</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Divisi &amp; Pengirim</th>
                      <th className="py-3 px-3.5">Poin &amp; Inti Pesan Masuk</th>
                      <th className="py-3 px-3.5">Inti Tanggapan Ketua</th>
                      <th className="py-3 px-3.5 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50 text-xs">
                    {riwayatMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 px-4 text-center text-emerald-200/65">
                          Belum ada riwayat pesan masuk yang selesai ditanggapi.
                        </td>
                      </tr>
                    ) : (
                      riwayatMessages.map((msg, idx) => {
                        const divKey = resolveDivisiPesan(msg);
                        const ketuaBalasan = [...(msg.balasan || [])]
                          .reverse()
                          .find((b) => b.pengirimRole === 'ketua_pondok' || b.pengirimId === currentUser.id);
                        const rawTanggapan =
                          ketuaBalasan?.isi ||
                          msg.tindakLanjutCatatan ||
                          (msg.balasan && msg.balasan.length > 0 ? msg.balasan[msg.balasan.length - 1].isi : '-');

                        return (
                          <tr key={msg.id} className="hover:bg-[#06281c]/45 align-top">
                            <td className="py-3 px-3.5 text-center font-mono text-emerald-300 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap tabular-nums">
                              <div className="text-[#f3d266] font-bold">{msg.nomorTiket}</div>
                              <div className="text-emerald-300/75">{msg.waktu}</div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="font-bold text-white">{divKey}</div>
                              <div className="text-[11px] text-emerald-200/80">{msg.pengirimNama}</div>
                            </td>
                            <td className="py-3 px-3.5 min-w-[200px] max-w-xs">
                              <div className="font-bold text-white">
                                {ringkasPoinPesan(msg.judul, 65)}
                              </div>
                              <div className="text-[11px] text-emerald-100/80 mt-0.5">
                                {ringkasPoinPesan(msg.isi, 95)}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 min-w-[200px] max-w-xs">
                              <div className="text-emerald-300 font-semibold">
                                {ringkasPoinPesan(rawTanggapan, 95)}
                              </div>
                              <div className="text-[10px] font-mono text-emerald-300/70 mt-0.5">
                                Ditanggapi: {msg.tindakLanjutOleh || ketuaBalasan?.pengirimNama || currentUser.nama}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  storageService.deleteKoordinasi(msg.id);
                                  notifySaved(`Riwayat pesan "${msg.nomorTiket}" berhasil dihapus.`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/85 hover:bg-rose-900 text-rose-200 border border-rose-500/45 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                title="Hapus pesan dari riwayat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#f3d266]" />
                  Kirim Pesan Koordinasi / Instruksi ke Pengurus
                </h2>
                <form onSubmit={handleKirimInstruksi} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Tujuan Pengurus / Divisi</label>
                    <select
                      value={instruksiForm.tujuan}
                      onChange={e => setInstruksiForm({ ...instruksiForm, tujuan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                    >
                      <option value="Seluruh Pengurus Divisi">Seluruh Pengurus Divisi</option>
                      <option value="Sekretaris Umum">Sekretaris Umum</option>
                      <option value="Bendahara Umum">Bendahara Umum</option>
                      <option value="Kepala Perlengkapan & Sarpras">Kepala Perlengkapan &amp; Sarpras</option>
                      <option value="Ketua Dewan Keamanan">Ketua Dewan Keamanan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Judul Pesan Koordinasi</label>
                    <input
                      type="text"
                      required
                      value={instruksiForm.judul}
                      onChange={e => setInstruksiForm({ ...instruksiForm, judul: e.target.value })}
                      placeholder="Contoh: Persiapan Audit Akhir Bulan..."
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Isi Instruksi / Koordinasi</label>
                    <textarea
                      rows={3}
                      required
                      value={instruksiForm.isi}
                      onChange={e => setInstruksiForm({ ...instruksiForm, isi: e.target.value })}
                      placeholder="Tuliskan arahan resmi Ketua Pondok..."
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Kirim Pesan Koordinasi
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Arsip Surat Keputusan (SK) &amp; Pengumuman Resmi Pondok
                </h2>
                <div className="space-y-3">
                  {skDanPengumumanList.map((sk) => (
                    <div key={sk.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                          {sk.namaJenis}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300">{sk.nomorSurat} · {sk.tanggalSurat}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{sk.perihal}</h3>
                      <p className="text-xs text-emerald-100/80 line-clamp-3">{sk.isiSurat}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 7: LAPORAN BULANAN YANG BISA DICETAK (A4) */}
      {activeTab === 'laporan_bulanan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#041d14] border border-[#d4af37]/40 rounded-2xl p-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase">Laporan Eksekutif Bulanan Ketua Pondok (Siap Cetak A4)</h2>
              <p className="text-xs text-emerald-200/75">Rekapitulasi menyeluruh kinerja divisi, keuangan, sekretariat, perlengkapan, dan keamanan</p>
            </div>
            <button
              onClick={handlePrintLaporanBulanan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Printer className="w-4 h-4" /> Cetak Laporan Bulanan (A4)
            </button>
          </div>

          <div
            id="ketua-laporan-bulanan-print"
            className="bg-white text-black rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl border border-zinc-300"
          >
            <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
              <h1 className="text-lg font-black uppercase">YAYASAN PENDIDIKAN ISLAM SALAF AL-MALIKI</h1>
              <h2 className="text-xl font-black uppercase">{systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}</h2>
              <p className="text-xs">{systemConfig.alamatPondok || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361'}</p>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-base font-bold uppercase underline">LAPORAN EKSEKUTIF BULANAN KETUA PONDOK PESANTREN</h3>
              <p className="text-xs mt-1">Periode Laporan: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold uppercase mb-1">I. Ringkasan Kinerja &amp; Kedisiplinan</h4>
                <p>1. Indeks Capaian Kinerja Pengurus Bulan Ini: <strong>{executiveMetrics.avgKinerja}%</strong> (Bulan Lalu: {executiveMetrics.kinerjaBulanLalu}%)</p>
                <p>2. Indeks Kedisiplinan Santri Bulan Ini: <strong>{executiveMetrics.disiplinBulanIni}%</strong> (Bulan Lalu: {executiveMetrics.disiplinBulanLalu}%)</p>
                <p>3. Total Santri Aktif: <strong>{santriList.length} Santri</strong> · Total Ustadz/Ustadzah Aktif: <strong>{(systemConfig.ustadzList || []).length} Asatidz</strong></p>
              </div>

              <div>
                <h4 className="font-bold uppercase mb-1">II. Rekapitulasi Kas &amp; Keuangan (Bendahara)</h4>
                <p>1. Total Pemasukan Kas Pondok: <strong>{formatRupiah(executiveMetrics.pemasukan)}</strong></p>
                <p>2. Total Pengeluaran Operasional: <strong>{formatRupiah(executiveMetrics.pengeluaran)}</strong></p>
                <p>3. Saldo Akhir Kas Pondok: <strong>{formatRupiah(executiveMetrics.saldoKas)}</strong></p>
              </div>

              <div>
                <h4 className="font-bold uppercase mb-1">III. Administrasi Sekretariat, Perlengkapan &amp; Keamanan</h4>
                <p>1. Total Arsip Surat Resmi: <strong>{arsipSurat.length} Berkas</strong> ({arsipSurat.filter(s => s.arah === 'Keluar').length} Keluar, {arsipSurat.filter(s => s.arah === 'Masuk').length} Masuk)</p>
                <p>2. Total Inventaris Sarpras: <strong>{barangInventaris.reduce((a, b) => a + b.jumlah, 0)} Unit</strong></p>
                <p>3. Catatan Perizinan &amp; Ketertiban: <strong>{perizinanList.length} Perizinan</strong> · <strong>{pelanggaranList.length} Catatan Pelanggaran</strong></p>
              </div>

              <div className="pt-8 flex justify-end">
                <div className="text-center w-64">
                  <p>{systemConfig.kotaInstansi || 'Karawang'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold mt-1">Ketua Pondok Pesantren Salaf Al-Maliki</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{currentUser.nama}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: OPTIONS PANEL KETUA PONDOK (EDIT SEMUA FITUR PADA TAB KETUA PONDOK) */}
      {activeTab === 'option_ketua_pondok' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-r from-[#072b1d] via-[#041d14] to-[#03150e] border border-[#d4af37]/50 p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#f3d266]" />
                <span>Options Panel Ketua Pondok</span>
              </h2>
              <p className="text-xs text-emerald-200/75 mt-0.5">
                Editor lengkap untuk mengubah seluruh fitur pada tab Ketua Pondok: Identitas &amp; Kop Laporan, Program Kerja, Evaluasi Kinerja &amp; Notulen Rapat, Daftar Pengurus &amp; Piket, serta Persetujuan Divisi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
              {[
                { id: 'identitas', label: '1. Identitas & Kop Laporan' },
                { id: 'proker', label: '2. Edit Program Kerja' },
                { id: 'evaluasi_notulen', label: '3. Edit Evaluasi & Notulen Rapat' },
                { id: 'pengurus_piket', label: '4. Edit Pengurus & Jadwal Piket' },
                { id: 'persetujuan_agenda', label: '5. Edit Persetujuan & Izin' },
              ].map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setOptionSubSection(sec.id as any)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    optionSubSection === sec.id
                      ? 'bg-[#d4af37] text-[#02120a]'
                      : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {kpSavedMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-[#d4af37]/55 text-xs font-bold text-[#f3d266] flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{kpSavedMsg}</span>
            </div>
          )}

          {/* SECTION 1: IDENTITAS & KOP LAPORAN KETUA PONDOK */}
          {optionSubSection === 'identitas' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                storageService.updateSystemConfig({
                  namaPondok: kpIdentitasForm.namaPondok.trim(),
                  namaPimpinan: kpIdentitasForm.namaPimpinan.trim(),
                  kotaInstansi: kpIdentitasForm.kotaInstansi.trim(),
                  alamatPondok: kpIdentitasForm.alamatPondok.trim(),
                });
                notifySaved('Identitas & Kop Laporan Ketua Pondok berhasil diperbarui!');
              }}
              className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4 max-w-3xl"
            >
              <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                Pengaturan Identitas &amp; Kop Laporan Bulanan Ketua Pondok
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Pondok Pesantren</label>
                  <input
                    type="text"
                    required
                    value={kpIdentitasForm.namaPondok}
                    onChange={(e) => setKpIdentitasForm({ ...kpIdentitasForm, namaPondok: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Pimpinan / Pengasuh</label>
                  <input
                    type="text"
                    required
                    value={kpIdentitasForm.namaPimpinan}
                    onChange={(e) => setKpIdentitasForm({ ...kpIdentitasForm, namaPimpinan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Kota Terbit Laporan</label>
                  <input
                    type="text"
                    required
                    value={kpIdentitasForm.kotaInstansi}
                    onChange={(e) => setKpIdentitasForm({ ...kpIdentitasForm, kotaInstansi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Alamat Kop Laporan</label>
                  <input
                    type="text"
                    required
                    value={kpIdentitasForm.alamatPondok}
                    onChange={(e) => setKpIdentitasForm({ ...kpIdentitasForm, alamatPondok: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Kop &amp; Identitas</span>
              </button>
            </form>
          )}

          {/* SECTION 2: EDIT PROGRAM KERJA & TARGET */}
          {optionSubSection === 'proker' && (
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
                <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                  Edit Program Kerja &amp; Target Kepengurusan ({(systemConfig.programKerjaList || []).length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('proker')}
                  className="text-xs font-bold text-emerald-300 hover:text-white cursor-pointer"
                >
                  + Tambah Program di Tab Proker
                </button>
              </div>

              <div className="space-y-3">
                {(systemConfig.programKerjaList || []).map((pk) => {
                  const isEditing = editingProkerId === pk.id;
                  return (
                    <div key={pk.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-3">
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={editProkerData.namaProgram || ''}
                            onChange={(e) => setEditProkerData({ ...editProkerData, namaProgram: e.target.value })}
                            placeholder="Nama Program"
                            className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={editProkerData.target || ''}
                            onChange={(e) => setEditProkerData({ ...editProkerData, target: e.target.value })}
                            placeholder="Target Capaian"
                            className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={editProkerData.penanggungJawab || ''}
                            onChange={(e) => setEditProkerData({ ...editProkerData, penanggungJawab: e.target.value })}
                            placeholder="Penanggung Jawab"
                            className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-700 text-xs text-white"
                          />
                          <select
                            value={editProkerData.divisi || pk.divisi}
                            onChange={(e) => setEditProkerData({ ...editProkerData, divisi: e.target.value as any })}
                            className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-700 text-xs text-white"
                          >
                            <option value="Ketua Pondok">Ketua Pondok</option>
                            <option value="Sekretaris">Sekretaris</option>
                            <option value="Bendahara">Bendahara</option>
                            <option value="Perlengkapan">Perlengkapan</option>
                            <option value="Keamanan">Keamanan</option>
                            <option value="Pendidikan & Taklim">Pendidikan &amp; Taklim</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editProkerData.progresPersen ?? pk.progresPersen}
                            onChange={(e) => setEditProkerData({ ...editProkerData, progresPersen: Number(e.target.value) })}
                            className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-700 text-xs text-white font-mono"
                          />
                          <input
                            type="date"
                            value={editProkerData.tenggat || pk.tenggat}
                            onChange={(e) => setEditProkerData({ ...editProkerData, tenggat: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-700 text-xs text-white font-mono"
                          />
                          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const updated = (systemConfig.programKerjaList || []).map((item) => {
                                  if (item.id !== pk.id) return item;
                                  const nextPct = editProkerData.progresPersen ?? item.progresPersen;
                                  const isComplete = nextPct >= 100;
                                  return {
                                    ...item,
                                    ...editProkerData,
                                    progresPersen: nextPct,
                                    status: (isComplete ? 'Tercapai' : 'Berjalan') as ProgramKerja['status'],
                                    tanggalTercapai: isComplete ? (item.tanggalTercapai || todayStr) : undefined,
                                  };
                                });
                                storageService.updateSystemConfig({ programKerjaList: updated });
                                setEditingProkerId(null);
                                notifySaved(`Program kerja "${editProkerData.namaProgram || pk.namaProgram}" berhasil diperbarui!`);
                              }}
                              className="px-4 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
                            >
                              Simpan Perubahan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProkerId(null)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-200 text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-mono text-[#f3d266]">
                              {pk.divisi} · {pk.progresPersen}% ({pk.status}) · Tenggat {pk.tenggat}
                            </p>
                            <h4 className="text-sm font-bold text-white">{pk.namaProgram}</h4>
                            <p className="text-xs text-emerald-200/80">Target: {pk.target} · PJ: {pk.penanggungJawab}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProkerId(pk.id);
                                setEditProkerData({ ...pk });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#072c1e] hover:bg-[#0b422d] text-[#f3d266] border border-[#d4af37]/40 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (systemConfig.programKerjaList || []).filter((item) => item.id !== pk.id);
                                storageService.updateSystemConfig({ programKerjaList: updated });
                                notifySaved(`Program kerja "${pk.namaProgram}" dihapus.`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: EDIT EVALUASI KINERJA & NOTULEN RAPAT */}
          {optionSubSection === 'evaluasi_notulen' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Edit / Hapus Evaluasi Kinerja */}
              <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                  Edit &amp; Hapus Evaluasi Kinerja ({evaluasiKepengurusan.length})
                </h3>
                <div className="space-y-3">
                  {evaluasiKepengurusan.map((ev) => {
                    const isEditing = editingEvalId === ev.id;
                    return (
                      <div key={ev.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/70 space-y-2">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editEvalData.judul || ''}
                              onChange={(e) => setEditEvalData({ ...editEvalData, judul: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={editEvalData.divisi || ev.divisi}
                                onChange={(e) => setEditEvalData({ ...editEvalData, divisi: e.target.value as any })}
                                className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                              >
                                <option value="Sekretaris">Sekretaris</option>
                                <option value="Bendahara">Bendahara</option>
                                <option value="Perlengkapan">Perlengkapan</option>
                                <option value="Keamanan">Keamanan</option>
                                <option value="Umum">Umum</option>
                              </select>
                              <select
                                value={editEvalData.nilaiKinerja || ev.nilaiKinerja}
                                onChange={(e) => setEditEvalData({ ...editEvalData, nilaiKinerja: e.target.value as any })}
                                className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                              >
                                <option value="Sangat Baik">Sangat Baik</option>
                                <option value="Baik">Baik</option>
                                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                              </select>
                            </div>
                            <textarea
                              rows={2}
                              value={editEvalData.catatanEvaluasi || ''}
                              onChange={(e) => setEditEvalData({ ...editEvalData, catatanEvaluasi: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  storageService.saveEvaluasiKepengurusan({
                                    ...ev,
                                    ...editEvalData,
                                  } as EvaluasiKepengurusan);
                                  setEditingEvalId(null);
                                  notifySaved('Catatan evaluasi kinerja berhasil diperbarui!');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] text-xs font-bold cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingEvalId(null)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-200 text-xs cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#f3d266]">
                              <span>Divisi {ev.divisi} · {ev.tanggal}</span>
                              <span>{ev.nilaiKinerja}</span>
                            </div>
                            <p className="text-xs font-bold text-white">{ev.judul}</p>
                            <p className="text-[11px] text-emerald-200/80">{ev.catatanEvaluasi}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEvalId(ev.id);
                                  setEditEvalData({ ...ev });
                                }}
                                className="px-2.5 py-1 rounded bg-[#072c1e] text-[#f3d266] text-[11px] font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  storageService.deleteEvaluasiKepengurusan(ev.id);
                                  notifySaved('Evaluasi kinerja dihapus.');
                                }}
                                className="px-2.5 py-1 rounded bg-rose-950/80 text-rose-200 text-[11px] font-bold cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tambah / Edit / Hapus Notulen Rapat Pleno */}
              <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Kelola Notulen Rapat Pleno ({(systemConfig.notulenRapatList || []).length})
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!notulenForm.judulRapat || !notulenForm.hasilKeputusan) return;
                    const newNotulen: NotulenRapat = {
                      id: `not_${Date.now()}`,
                      judulRapat: notulenForm.judulRapat,
                      tanggal: notulenForm.tanggal || new Date().toISOString().split('T')[0],
                      waktu: notulenForm.waktu || '20:00 WIB',
                      tempat: notulenForm.tempat || 'Aula Utama Pondok',
                      pimpinanRapat: notulenForm.pimpinanRapat || currentUser.nama,
                      jumlahPeserta: Number(notulenForm.jumlahPeserta) || 10,
                      agendaBahasan: notulenForm.agendaBahasan || '-',
                      hasilKeputusan: notulenForm.hasilKeputusan,
                      notulis: notulenForm.notulis || 'Sekretaris Umum',
                    };
                    storageService.updateSystemConfig({
                      notulenRapatList: [newNotulen, ...(systemConfig.notulenRapatList || [])],
                    });
                    setNotulenForm({ ...notulenForm, judulRapat: '', agendaBahasan: '', hasilKeputusan: '' });
                    notifySaved('Notulen rapat baru berhasil ditambahkan!');
                  }}
                  className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/70 space-y-2.5"
                >
                  <input
                    type="text"
                    required
                    placeholder="Judul Rapat Pleno..."
                    value={notulenForm.judulRapat || ''}
                    onChange={(e) => setNotulenForm({ ...notulenForm, judulRapat: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={notulenForm.tanggal || ''}
                      onChange={(e) => setNotulenForm({ ...notulenForm, tanggal: e.target.value })}
                      className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Waktu (20:00 WIB)"
                      value={notulenForm.waktu || ''}
                      onChange={(e) => setNotulenForm({ ...notulenForm, waktu: e.target.value })}
                      className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Agenda Bahasan..."
                    value={notulenForm.agendaBahasan || ''}
                    onChange={(e) => setNotulenForm({ ...notulenForm, agendaBahasan: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    required
                    placeholder="Hasil Keputusan Rapat..."
                    value={notulenForm.hasilKeputusan || ''}
                    onChange={(e) => setNotulenForm({ ...notulenForm, hasilKeputusan: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
                  >
                    + Tambah Notulen Rapat
                  </button>
                </form>

                <div className="space-y-2.5">
                  {(systemConfig.notulenRapatList || []).map((nt) => {
                    const isEditing = editingNotulenId === nt.id;
                    return (
                      <div key={nt.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/70 space-y-2">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editNotulenData.judulRapat || ''}
                              onChange={(e) => setEditNotulenData({ ...editNotulenData, judulRapat: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                            />
                            <textarea
                              rows={3}
                              value={editNotulenData.hasilKeputusan || ''}
                              onChange={(e) => setEditNotulenData({ ...editNotulenData, hasilKeputusan: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (systemConfig.notulenRapatList || []).map((item) =>
                                    item.id === nt.id ? { ...item, ...editNotulenData } : item
                                  );
                                  storageService.updateSystemConfig({ notulenRapatList: updated });
                                  setEditingNotulenId(null);
                                  notifySaved('Notulen rapat berhasil diperbarui!');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] text-xs font-bold cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNotulenId(null)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-200 text-xs cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[10px] font-mono text-[#f3d266]">{nt.tanggal} · {nt.waktu}</p>
                            <p className="text-xs font-bold text-white">{nt.judulRapat}</p>
                            <p className="text-[11px] text-emerald-100/80 whitespace-pre-line">{nt.hasilKeputusan}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNotulenId(nt.id);
                                  setEditNotulenData({ ...nt });
                                }}
                                className="px-2.5 py-1 rounded bg-[#072c1e] text-[#f3d266] text-[11px] font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (systemConfig.notulenRapatList || []).filter((item) => item.id !== nt.id);
                                  storageService.updateSystemConfig({ notulenRapatList: updated });
                                  notifySaved('Notulen rapat dihapus.');
                                }}
                                className="px-2.5 py-1 rounded bg-rose-950/80 text-rose-200 text-[11px] font-bold cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: EDIT DAFTAR PENGURUS, TUPOKSI & JADWAL PIKET */}
          {optionSubSection === 'pengurus_piket' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!pengurusForm.nama || !pengurusForm.jabatan) return;
                  const newItem = {
                    id: `ust_${Date.now()}`,
                    nip: pengurusForm.nip || `PRS-${Math.floor(100 + Math.random() * 900)}`,
                    nama: pengurusForm.nama,
                    gender: pengurusForm.gender,
                    jabatan: pengurusForm.jabatan,
                    divisi: pengurusForm.divisi,
                    bidangKitab: pengurusForm.bidangKitab || 'Pembinaan Asrama',
                    jadwalPiket: pengurusForm.jadwalPiket || 'Senin & Kamis',
                    noWa: pengurusForm.noWa || '0812',
                    statusAktif: true,
                  };
                  storageService.updateSystemConfig({
                    ustadzList: [newItem, ...(systemConfig.ustadzList || [])],
                  });
                  setPengurusForm({ ...pengurusForm, nip: '', nama: '', jabatan: '', bidangKitab: '', jadwalPiket: '' });
                  notifySaved(`Pengurus "${newItem.nama}" berhasil ditambahkan ke Daftar Pengurus & Piket!`);
                }}
                className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-3 h-fit"
              >
                <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                  Tambah Pengurus / Jadwal Piket
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Nama Pengurus / Ustadz..."
                  value={pengurusForm.nama}
                  onChange={(e) => setPengurusForm({ ...pengurusForm, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Jabatan (Contoh: Ketua Keamanan)"
                  value={pengurusForm.jabatan}
                  onChange={(e) => setPengurusForm({ ...pengurusForm, jabatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <select
                  value={pengurusForm.divisi}
                  onChange={(e) => setPengurusForm({ ...pengurusForm, divisi: e.target.value as DivisiPondok })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  <option value="Ketua Pondok">Ketua Pondok</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Perlengkapan">Perlengkapan</option>
                  <option value="Keamanan">Keamanan</option>
                  <option value="Pendidikan & Taklim">Pendidikan &amp; Taklim</option>
                </select>
                <input
                  type="text"
                  placeholder="Tugas Pokok / Bidang Kitab..."
                  value={pengurusForm.bidangKitab}
                  onChange={(e) => setPengurusForm({ ...pengurusForm, bidangKitab: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Jadwal Piket (Contoh: Senin - Rabu Malam)"
                  value={pengurusForm.jadwalPiket}
                  onChange={(e) => setPengurusForm({ ...pengurusForm, jadwalPiket: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Nomor WA..."
                  value={pengurusForm.noWa}
                  onChange={(e) => setPengurusForm({ ...pengurusForm, noWa: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
                >
                  + Tambah ke Daftar Pengurus
                </button>
              </form>

              <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit Personil Pengurus &amp; Jadwal Piket ({(systemConfig.ustadzList || []).length})
                </h3>
                {(systemConfig.ustadzList || []).map((u) => {
                  const isEditing = editingUstadzId === u.id;
                  return (
                    <div key={u.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2.5">
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={editUstadzData.nama || ''}
                            onChange={(e) => setEditUstadzData({ ...editUstadzData, nama: e.target.value })}
                            placeholder="Nama"
                            className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={editUstadzData.jabatan || ''}
                            onChange={(e) => setEditUstadzData({ ...editUstadzData, jabatan: e.target.value })}
                            placeholder="Jabatan"
                            className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={editUstadzData.jadwalPiket || ''}
                            onChange={(e) => setEditUstadzData({ ...editUstadzData, jadwalPiket: e.target.value })}
                            placeholder="Jadwal Piket"
                            className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={editUstadzData.noWa || ''}
                            onChange={(e) => setEditUstadzData({ ...editUstadzData, noWa: e.target.value })}
                            placeholder="No WA"
                            className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white font-mono"
                          />
                          <input
                            type="text"
                            value={editUstadzData.bidangKitab || ''}
                            onChange={(e) => setEditUstadzData({ ...editUstadzData, bidangKitab: e.target.value })}
                            placeholder="Bidang / Tugas Pokok"
                            className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-700 text-xs text-white"
                          />
                          <div className="sm:col-span-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (systemConfig.ustadzList || []).map((item) =>
                                  item.id === u.id ? { ...item, ...editUstadzData } : item
                                );
                                storageService.updateSystemConfig({ ustadzList: updated });
                                setEditingUstadzId(null);
                                notifySaved(`Data pengurus "${editUstadzData.nama || u.nama}" berhasil diperbarui!`);
                              }}
                              className="px-4 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] text-xs font-bold cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUstadzId(null)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-200 text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-white">{u.nama} · <span className="text-[#f3d266]">{u.jabatan}</span></p>
                            <p className="text-[11px] text-emerald-200/80">
                              Divisi {u.divisi} · Tugas: {u.bidangKitab} · Piket: {u.jadwalPiket} · WA: {u.noWa}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUstadzId(u.id);
                                setEditUstadzData({ ...u });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#072c1e] text-[#f3d266] text-xs font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (systemConfig.ustadzList || []).filter((item) => item.id !== u.id);
                                storageService.updateSystemConfig({ ustadzList: updated });
                                notifySaved(`Data pengurus "${u.nama}" dihapus.`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-200 text-xs font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 5: EDIT & HAPUS PERSETUJUAN DIVISI & IZIN PENGURUS */}
          {optionSubSection === 'persetujuan_agenda' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                  Kelola Data Pengajuan Divisi ({pengajuanDivisi.length})
                </h3>
                {pengajuanDivisi.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/70 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-[#f3d266]">{item.divisi} · {item.status} · {item.tanggal}</p>
                      <p className="text-xs font-bold text-white truncate">{item.judul}</p>
                      <p className="text-[11px] text-emerald-200/75 truncate">{item.deskripsi}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleKeputusanPengajuan(item, 'Disetujui')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          storageService.deletePengajuanDivisi(item.id);
                          notifySaved(`Pengajuan "${item.judul}" dihapus.`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-200 text-[11px] font-bold cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Kelola Data Izin Pengurus ({izinPengurusList.length})
                </h3>
                {izinPengurusList.map((ip) => (
                  <div key={ip.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/70 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{ip.namaPengurus} ({ip.divisi})</p>
                      <p className="text-[11px] text-emerald-200/80">{ip.keperluan} · {ip.tglMulai} s/d {ip.tglSelesai}</p>
                      <p className="text-[10px] font-mono text-[#f3d266]">Status: {ip.status}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ip.status !== 'Disetujui' && (
                        <button
                          type="button"
                          onClick={() => handleKeputusanIzinPengurus(ip.id, 'Disetujui')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Setujui
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = izinPengurusList.filter((item) => item.id !== ip.id);
                          storageService.updateSystemConfig({ izinPengurusList: updated });
                          notifySaved(`Izin pengurus "${ip.namaPengurus}" dihapus.`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-200 text-[11px] font-bold cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
