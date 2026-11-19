import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpenCheck,
  LayoutDashboard,
  Inbox,
  ClipboardCheck,
  Award,
  UserCheck,
  Sliders,
  Download,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  Reply,
  Users,
  Search,
  KeyRound,
  UserCircle,
  Lock,
  Upload,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  UserAccount,
  SystemConfig,
  Santri,
  PesanKoordinasi,
  BalasanKoordinasi,
  PrioritasKoordinasi,
  MurotilTingkatan,
  MurotilKelompok,
  MurotilAbsensiSantri,
  StatusAbsensiMurotil,
  MurotilSetoranHafalan,
  JenisSetoranMurotil,
  PredikatSetoranMurotil,
  MurotilAbsensiPj,
  StatusAbsensiPjMurotil,
  MurotilConfig,
} from '../types';
import { INITIAL_MUROTIL_CONFIG } from '../data/seedData';
import { storageService } from '../services/storageService';
import { downloadWordDocument } from '../utils/wordExport';
import { PusatInformasiSection } from './PusatInformasiSection';
import {
  BarChart3D,
  KpiStatCard3D,
  LineChart3D,
  PieChart3D,
} from './Charts3D';

export type MurotilSubTab =
  | 'dashboard_murotil'
  | 'kotak_masuk'
  | 'absensi_santri'
  | 'setoran_hafalan'
  | 'absensi_pj'
  | 'option_murotil';

interface MurotilTahfidzPanelProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  santriList: Santri[];
  usersList: UserAccount[];
  koordinasiList: PesanKoordinasi[];
  initialSubTab?: string;
  onProfileUpdated?: (updatedUser: UserAccount) => void;
}

const VALID_TABS: MurotilSubTab[] = [
  'dashboard_murotil',
  'kotak_masuk',
  'absensi_santri',
  'setoran_hafalan',
  'absensi_pj',
  'option_murotil',
];

function normalizeSubTab(raw?: string): MurotilSubTab {
  if (raw && VALID_TABS.includes(raw as MurotilSubTab)) {
    return raw as MurotilSubTab;
  }
  return 'dashboard_murotil';
}

const TINGKATAN_COLORS = [
  '#10b981',
  '#d4af37',
  '#38bdf8',
  '#a78bfa',
  '#fb923c',
  '#f472b6',
];

export const MurotilTahfidzPanel: React.FC<MurotilTahfidzPanelProps> = ({
  currentUser,
  systemConfig,
  santriList,
  usersList,
  koordinasiList,
  initialSubTab,
  onProfileUpdated,
}) => {
  const todayWib = useMemo(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    []
  );

  const [activeTab, setActiveTab] = useState<MurotilSubTab>(normalizeSubTab(initialSubTab));

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(normalizeSubTab(initialSubTab));
    }
  }, [initialSubTab]);

  // Extract persisted Murotil data from live Cloud Firestore SystemConfig
  const tingkatanList: MurotilTingkatan[] = useMemo(
    () =>
      (Array.isArray(systemConfig.murotilTingkatanList)
        ? systemConfig.murotilTingkatanList
        : []
      )
        .slice()
        .sort((a, b) => a.urutan - b.urutan),
    [systemConfig.murotilTingkatanList]
  );

  const kelompokList: MurotilKelompok[] = useMemo(
    () =>
      Array.isArray(systemConfig.murotilKelompokList)
        ? systemConfig.murotilKelompokList
        : [],
    [systemConfig.murotilKelompokList]
  );

  const absensiSantriList: MurotilAbsensiSantri[] = useMemo(
    () =>
      Array.isArray(systemConfig.murotilAbsensiSantriList)
        ? systemConfig.murotilAbsensiSantriList
        : [],
    [systemConfig.murotilAbsensiSantriList]
  );

  const setoranList: MurotilSetoranHafalan[] = useMemo(
    () =>
      Array.isArray(systemConfig.murotilSetoranList)
        ? systemConfig.murotilSetoranList
        : [],
    [systemConfig.murotilSetoranList]
  );

  const absensiPjList: MurotilAbsensiPj[] = useMemo(
    () =>
      Array.isArray(systemConfig.murotilAbsensiPjList)
        ? systemConfig.murotilAbsensiPjList
        : [],
    [systemConfig.murotilAbsensiPjList]
  );

  const murotilConfig: MurotilConfig = useMemo(
    () => ({
      ...INITIAL_MUROTIL_CONFIG,
      ...(systemConfig.murotilConfig || {}),
      sesiList: systemConfig.murotilConfig?.sesiList?.length
        ? systemConfig.murotilConfig.sesiList
        : INITIAL_MUROTIL_CONFIG.sesiList,
    }),
    [systemConfig.murotilConfig]
  );

  const isAdminOrKetua = currentUser.role === 'admin' || currentUser.role === 'ketua_pondok';
  const isPengurusMurotil = currentUser.role === 'pengurus_murotil';

  // Determine kelompok(s) assigned to current user
  const myAssignedKelompok = useMemo(() => {
    const idSet = new Set(currentUser.murotilKelompokIds || []);
    return kelompokList.filter(
      (k) => idSet.has(k.id) || k.penanggungJawabUserId === currentUser.id
    );
  }, [kelompokList, currentUser]);

  // Visible kelompoks for the active user
  const accessibleKelompok = useMemo(() => {
    if (isAdminOrKetua || murotilConfig.allowPengurusLihatSemuaKelompok) {
      return kelompokList;
    }
    if (isPengurusMurotil && myAssignedKelompok.length > 0) {
      return myAssignedKelompok;
    }
    return kelompokList;
  }, [
    isAdminOrKetua,
    isPengurusMurotil,
    murotilConfig.allowPengurusLihatSemuaKelompok,
    myAssignedKelompok,
    kelompokList,
  ]);

  const [scopeMode, setScopeMode] = useState<'my_groups' | 'all_groups'>(
    isPengurusMurotil && myAssignedKelompok.length > 0 ? 'my_groups' : 'all_groups'
  );

  const dashboardKelompok = useMemo(() => {
    if (scopeMode === 'my_groups' && myAssignedKelompok.length > 0) {
      return myAssignedKelompok;
    }
    return accessibleKelompok;
  }, [scopeMode, myAssignedKelompok, accessibleKelompok]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const persistMurotilUpdate = (patch: Partial<SystemConfig>, successText?: string) => {
    storageService.updateSystemConfig(patch);
    if (successText) {
      showToast(successText);
    }
  };

  // =========================================================================
  // 1. STATE: ABSENSI SANTRI PER KELOMPOK & REKAPAN
  // =========================================================================
  const [absensiTanggal, setAbsensiTanggal] = useState<string>(todayWib);
  const [absensiSesi, setAbsensiSesi] = useState<string>(
    murotilConfig.sesiList[0] || "Ba'da Subuh"
  );
  const [absensiKelompokFilter, setAbsensiKelompokFilter] = useState<string>('all');
  const [rekapPeriode, setRekapPeriode] = useState<'semua' | 'bulan_ini' | 'hari_ini'>('semua');

  const activeAbsensiKelompokList = useMemo(() => {
    const base = accessibleKelompok.filter((k) => k.statusAktif);
    if (absensiKelompokFilter === 'all') return base;
    return base.filter((k) => k.id === absensiKelompokFilter);
  }, [accessibleKelompok, absensiKelompokFilter]);

  const handleSetSantriAbsensi = (
    kelompok: MurotilKelompok,
    santri: Santri,
    status: StatusAbsensiMurotil,
    catatanOverride?: string
  ) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const existingIdx = absensiSantriList.findIndex(
      (a) =>
        a.tanggal === absensiTanggal &&
        a.sesi === absensiSesi &&
        a.kelompokId === kelompok.id &&
        a.santriId === santri.id
    );
    const updatedList = [...absensiSantriList];
    const nextRecord: MurotilAbsensiSantri = {
      id: existingIdx >= 0 ? updatedList[existingIdx].id : `mabs_${Date.now()}_${santri.id}`,
      tanggal: absensiTanggal,
      sesi: absensiSesi,
      kelompokId: kelompok.id,
      tingkatanId: kelompok.tingkatanId,
      santriId: santri.id,
      santriNama: santri.nama,
      santriNis: santri.nis,
      status,
      catatan:
        catatanOverride !== undefined
          ? catatanOverride
          : existingIdx >= 0
            ? updatedList[existingIdx].catatan || ''
            : '',
      pencatatNama: currentUser.nama,
      updatedAt: `${absensiTanggal} ${nowTime} WIB`,
    };
    if (existingIdx >= 0) {
      updatedList[existingIdx] = nextRecord;
    } else {
      updatedList.unshift(nextRecord);
    }
    persistMurotilUpdate({ murotilAbsensiSantriList: updatedList });
  };

  const handleHadirkanSemuaKelompok = (kelompok: MurotilKelompok) => {
    const members = santriList.filter((s) => kelompok.santriIds.includes(s.id));
    if (members.length === 0) return;
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    let updatedList = [...absensiSantriList];
    members.forEach((san) => {
      const idx = updatedList.findIndex(
        (a) =>
          a.tanggal === absensiTanggal &&
          a.sesi === absensiSesi &&
          a.kelompokId === kelompok.id &&
          a.santriId === san.id
      );
      const rec: MurotilAbsensiSantri = {
        id: idx >= 0 ? updatedList[idx].id : `mabs_${Date.now()}_${san.id}`,
        tanggal: absensiTanggal,
        sesi: absensiSesi,
        kelompokId: kelompok.id,
        tingkatanId: kelompok.tingkatanId,
        santriId: san.id,
        santriNama: san.nama,
        santriNis: san.nis,
        status: 'Hadir',
        catatan: idx >= 0 ? updatedList[idx].catatan || 'Hadir' : 'Hadir',
        pencatatNama: currentUser.nama,
        updatedAt: `${absensiTanggal} ${nowTime} WIB`,
      };
      if (idx >= 0) {
        updatedList[idx] = rec;
      } else {
        updatedList.unshift(rec);
      }
    });
    persistMurotilUpdate(
      { murotilAbsensiSantriList: updatedList },
      `Seluruh santri pada ${kelompok.namaKelompok} ditandai HADIR (${absensiTanggal} · ${absensiSesi}).`
    );
  };

  // Cumulative Attendance Recap rows per santri in visible groups
  const rekapAbsensiRows = useMemo(() => {
    const monthPrefix = absensiTanggal.slice(0, 7);
    const filteredRecords = absensiSantriList.filter((a) => {
      if (rekapPeriode === 'hari_ini') return a.tanggal === absensiTanggal;
      if (rekapPeriode === 'bulan_ini') return a.tanggal.startsWith(monthPrefix);
      return true;
    });

    const rows: {
      kelompokId: string;
      kelompokNama: string;
      tingkatanNama: string;
      pjNama: string;
      santriId: string;
      nis: string;
      nama: string;
      kelas: string;
      hadir: number;
      izin: number;
      sakit: number;
      alpha: number;
      total: number;
      persenHadir: number;
    }[] = [];

    activeAbsensiKelompokList.forEach((klp) => {
      const tkt = tingkatanList.find((t) => t.id === klp.tingkatanId);
      const members = santriList.filter((s) => klp.santriIds.includes(s.id));
      members.forEach((san) => {
        const recs = filteredRecords.filter(
          (r) => r.kelompokId === klp.id && r.santriId === san.id
        );
        const hadir = recs.filter((r) => r.status === 'Hadir').length;
        const izin = recs.filter((r) => r.status === 'Izin').length;
        const sakit = recs.filter((r) => r.status === 'Sakit').length;
        const alpha = recs.filter((r) => r.status === 'Alpha').length;
        const total = recs.length;
        const persenHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;
        rows.push({
          kelompokId: klp.id,
          kelompokNama: klp.namaKelompok,
          tingkatanNama: tkt?.nama || '-',
          pjNama: klp.penanggungJawabNama,
          santriId: san.id,
          nis: san.nis,
          nama: san.nama,
          kelas: san.kelas,
          hadir,
          izin,
          sakit,
          alpha,
          total,
          persenHadir,
        });
      });
    });

    return rows;
  }, [
    absensiSantriList,
    absensiTanggal,
    rekapPeriode,
    activeAbsensiKelompokList,
    tingkatanList,
    santriList,
  ]);

  const handleDownloadRekapAbsensiWord = () => {
    const periodeLabel =
      rekapPeriode === 'hari_ini'
        ? `Tanggal ${absensiTanggal}`
        : rekapPeriode === 'bulan_ini'
          ? `Bulan ${absensiTanggal.slice(0, 7)}`
          : 'Semua Periode Tersimpan';

    downloadWordDocument({
      filename: `Rekapan_Absensi_Murotil_${absensiTanggal}.doc`,
      title: 'REKAPAN ABSENSI SANTRI MUROTILIL QUR\'AN & TAHFIDZ',
      subtitle: `${murotilConfig.namaUnit} · Periode: ${periodeLabel}`,
      namaPondok: systemConfig.namaPondok,
      alamatPondok: systemConfig.alamatPondok,
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      penandatanganNama: murotilConfig.koordinatorNama || currentUser.nama,
      penandatanganJabatan: murotilConfig.koordinatorJabatan || 'Koordinator Murotilil Qur\'an',
      summaryLines: [
        `Total Santri Terdata: ${rekapAbsensiRows.length} Santri`,
        `Total Hadir: ${rekapAbsensiRows.reduce((s, r) => s + r.hadir, 0)} · Izin: ${rekapAbsensiRows.reduce((s, r) => s + r.izin, 0)} · Sakit: ${rekapAbsensiRows.reduce((s, r) => s + r.sakit, 0)} · Alpha: ${rekapAbsensiRows.reduce((s, r) => s + r.alpha, 0)}`,
        murotilConfig.catatanLaporanWord,
      ],
      columns: [
        { header: 'No', width: '4%', align: 'center' },
        { header: 'Kelompok & Tingkatan', width: '20%' },
        { header: 'NIS', width: '10%' },
        { header: 'Nama Santri', width: '19%' },
        { header: 'Ustadz/ah PJ', width: '15%' },
        { header: 'Hadir', width: '6%', align: 'center' },
        { header: 'Izin', width: '6%', align: 'center' },
        { header: 'Sakit', width: '6%', align: 'center' },
        { header: 'Alpha', width: '6%', align: 'center' },
        { header: '% Hadir', width: '8%', align: 'center' },
      ],
      rows: rekapAbsensiRows.map((r, idx) => [
        String(idx + 1),
        `${r.kelompokNama}\n(${r.tingkatanNama})`,
        r.nis,
        r.nama,
        r.pjNama,
        String(r.hadir),
        String(r.izin),
        String(r.sakit),
        String(r.alpha),
        `${r.persenHadir}%`,
      ]),
    });
    showToast('File Word (.doc) Rekapan Absensi Santri Murotil berhasil diunduh.');
  };

  // =========================================================================
  // 2. STATE: SETORAN HAFALAN SANTRI (6 TINGKATAN & KELOMPOK)
  // =========================================================================
  const [selectedTingkatanId, setSelectedTingkatanId] = useState<string>(
    tingkatanList[0]?.id || 'tkt_1'
  );
  const [selectedSetoranKelompokId, setSelectedSetoranKelompokId] = useState<string>('all');

  const activeTingkatan = useMemo(
    () => tingkatanList.find((t) => t.id === selectedTingkatanId) || tingkatanList[0],
    [tingkatanList, selectedTingkatanId]
  );

  const kelompokInTingkatan = useMemo(
    () => accessibleKelompok.filter((k) => k.tingkatanId === activeTingkatan?.id),
    [accessibleKelompok, activeTingkatan]
  );

  useEffect(() => {
    if (
      selectedSetoranKelompokId !== 'all' &&
      !kelompokInTingkatan.some((k) => k.id === selectedSetoranKelompokId)
    ) {
      setSelectedSetoranKelompokId(kelompokInTingkatan[0]?.id || 'all');
    }
  }, [kelompokInTingkatan, selectedSetoranKelompokId]);

  const [setoranForm, setSetoranForm] = useState<{
    kelompokId: string;
    santriId: string;
    tanggal: string;
    jenisSetoran: JenisSetoranMurotil;
    juz: string;
    surahAyat: string;
    nilai: PredikatSetoranMurotil;
    catatan: string;
  }>({
    kelompokId: kelompokInTingkatan[0]?.id || '',
    santriId: '',
    tanggal: todayWib,
    jenisSetoran: 'Ziyadah (Hafalan Baru)',
    juz: activeTingkatan?.juzOptions[0] || 'Juz 30',
    surahAyat: '',
    nilai: 'Mumtaz (A)',
    catatan: '',
  });

  useEffect(() => {
    const defaultKlp =
      selectedSetoranKelompokId !== 'all'
        ? kelompokInTingkatan.find((k) => k.id === selectedSetoranKelompokId) || kelompokInTingkatan[0]
        : kelompokInTingkatan[0];
    setSetoranForm((prev) => ({
      ...prev,
      kelompokId: defaultKlp?.id || '',
      santriId: defaultKlp?.santriIds[0] || '',
      juz: activeTingkatan?.juzOptions[0] || activeTingkatan?.targetJuz || 'Juz 30',
    }));
  }, [activeTingkatan, kelompokInTingkatan, selectedSetoranKelompokId]);

  const setoranFormKelompokObj = useMemo(
    () =>
      kelompokList.find((k) => k.id === setoranForm.kelompokId) || kelompokInTingkatan[0] || null,
    [kelompokList, setoranForm.kelompokId, kelompokInTingkatan]
  );

  const setoranFormSantriOptions = useMemo(() => {
    if (!setoranFormKelompokObj) return [];
    return santriList.filter((s) => setoranFormKelompokObj.santriIds.includes(s.id));
  }, [setoranFormKelompokObj, santriList]);

  const handleSaveSetoran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setoranFormKelompokObj || !setoranForm.santriId || !setoranForm.surahAyat.trim()) {
      showToast('Pilih Kelompok, Santri, serta isi Surah & Ayat hafalan terlebih dahulu.', 'error');
      return;
    }
    const san = santriList.find((s) => s.id === setoranForm.santriId);
    if (!san) return;

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem: MurotilSetoranHafalan = {
      id: `mset_${Date.now()}`,
      tanggal: setoranForm.tanggal,
      tingkatanId: activeTingkatan.id,
      kelompokId: setoranFormKelompokObj.id,
      santriId: san.id,
      santriNama: san.nama,
      santriNis: san.nis,
      jenisSetoran: setoranForm.jenisSetoran,
      juz: setoranForm.juz,
      surahAyat: setoranForm.surahAyat.trim(),
      nilai: setoranForm.nilai,
      pengujiNama: setoranFormKelompokObj.penanggungJawabNama || currentUser.nama,
      catatan: setoranForm.catatan.trim(),
      createdAt: `${setoranForm.tanggal} ${nowTime} WIB`,
    };

    persistMurotilUpdate(
      { murotilSetoranList: [newItem, ...setoranList] },
      `Setoran hafalan "${san.nama}" (${newItem.surahAyat}) berhasil dicatat!`
    );
    setSetoranForm((prev) => ({ ...prev, surahAyat: '', catatan: '' }));
  };

  const filteredSetoranHistory = useMemo(() => {
    const allowedIds = new Set(accessibleKelompok.map((k) => k.id));
    return setoranList.filter((s) => {
      if (!allowedIds.has(s.kelompokId)) return false;
      if (s.tingkatanId !== activeTingkatan?.id) return false;
      if (selectedSetoranKelompokId !== 'all' && s.kelompokId !== selectedSetoranKelompokId) {
        return false;
      }
      return true;
    });
  }, [setoranList, accessibleKelompok, activeTingkatan, selectedSetoranKelompokId]);

  const handleDownloadSetoranWord = () => {
    downloadWordDocument({
      filename: `Laporan_Setoran_Hafalan_${activeTingkatan?.nama.replace(/\s+/g, '_')}_${todayWib}.doc`,
      title: `LAPORAN SETORAN HAFALAN SANTRI — ${activeTingkatan?.nama.toUpperCase()}`,
      subtitle: `Target Hafalan: ${activeTingkatan?.targetJuz} · ${murotilConfig.namaUnit}`,
      namaPondok: systemConfig.namaPondok,
      alamatPondok: systemConfig.alamatPondok,
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      penandatanganNama: murotilConfig.koordinatorNama || currentUser.nama,
      penandatanganJabatan: murotilConfig.koordinatorJabatan || 'Koordinator Murotilil Qur\'an',
      summaryLines: [
        `Tingkatan Aktif: ${activeTingkatan?.nama} (${activeTingkatan?.targetJuz})`,
        `Total Setoran Tercatat: ${filteredSetoranHistory.length} Setoran`,
      ],
      columns: [
        { header: 'No', width: '5%', align: 'center' },
        { header: 'Tanggal', width: '11%' },
        { header: 'Kelompok', width: '16%' },
        { header: 'Santri', width: '18%' },
        { header: 'Jenis & Juz', width: '14%' },
        { header: 'Surah & Ayat', width: '16%' },
        { header: 'Nilai', width: '10%', align: 'center' },
        { header: 'Penguji', width: '10%' },
      ],
      rows: filteredSetoranHistory.map((s, idx) => {
        const klp = kelompokList.find((k) => k.id === s.kelompokId);
        return [
          String(idx + 1),
          s.tanggal,
          klp?.namaKelompok || '-',
          `${s.santriNama}\n(${s.santriNis})`,
          `${s.jenisSetoran}\n${s.juz}`,
          s.surahAyat,
          s.nilai,
          s.pengujiNama,
        ];
      }),
    });
    showToast('File Word (.doc) Rekap Setoran Hafalan berhasil diunduh.');
  };

  // =========================================================================
  // 3. STATE: ABSENSI USTADZ & USTADZAH PENANGGUNG JAWAB KELOMPOK
  // =========================================================================
  const [pjTanggal, setPjTanggal] = useState<string>(todayWib);
  const [pjSesi, setPjSesi] = useState<string>(murotilConfig.sesiList[0] || "Ba'da Subuh");
  const [pjBadalDraft, setPjBadalDraft] = useState<Record<string, string>>({});
  const [pjCatatanDraft, setPjCatatanDraft] = useState<Record<string, string>>({});

  const handleSetPjAbsensi = (
    kelompok: MurotilKelompok,
    status: StatusAbsensiPjMurotil
  ) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const idx = absensiPjList.findIndex(
      (a) =>
        a.tanggal === pjTanggal &&
        a.sesi === pjSesi &&
        a.kelompokId === kelompok.id
    );
    const updated = [...absensiPjList];
    const rec: MurotilAbsensiPj = {
      id: idx >= 0 ? updated[idx].id : `mpj_${Date.now()}_${kelompok.id}`,
      tanggal: pjTanggal,
      sesi: pjSesi,
      kelompokId: kelompok.id,
      namaKelompok: kelompok.namaKelompok,
      tingkatanId: kelompok.tingkatanId,
      userId: kelompok.penanggungJawabUserId,
      namaPengurus: kelompok.penanggungJawabNama,
      status,
      penggantiBadal:
        pjBadalDraft[kelompok.id] !== undefined
          ? pjBadalDraft[kelompok.id]
          : idx >= 0
            ? updated[idx].penggantiBadal || ''
            : '',
      jamHadir: status === 'Hadir' ? `${nowTime} WIB` : '-',
      catatan:
        pjCatatanDraft[kelompok.id] !== undefined
          ? pjCatatanDraft[kelompok.id]
          : idx >= 0
            ? updated[idx].catatan || ''
            : '',
      pencatatNama: currentUser.nama,
      updatedAt: `${pjTanggal} ${nowTime} WIB`,
    };
    if (idx >= 0) {
      updated[idx] = rec;
    } else {
      updated.unshift(rec);
    }
    persistMurotilUpdate(
      { murotilAbsensiPjList: updated },
      `Absensi PJ "${kelompok.penanggungJawabNama}" (${kelompok.namaKelompok}) disimpan: ${status}.`
    );
  };

  const rekapPjRows = useMemo(() => {
    return accessibleKelompok.map((klp) => {
      const tkt = tingkatanList.find((t) => t.id === klp.tingkatanId);
      const recs = absensiPjList.filter((r) => r.kelompokId === klp.id);
      const hadir = recs.filter((r) => r.status === 'Hadir').length;
      const izin = recs.filter((r) => r.status === 'Izin').length;
      const sakit = recs.filter((r) => r.status === 'Sakit').length;
      const badal = recs.filter((r) => r.status === 'Badal / Tugas Luar').length;
      const total = recs.length;
      const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
      return {
        kelompokId: klp.id,
        namaKelompok: klp.namaKelompok,
        tingkatanNama: tkt?.nama || '-',
        namaPengurus: klp.penanggungJawabNama,
        hadir,
        izin,
        sakit,
        badal,
        total,
        persen,
      };
    });
  }, [accessibleKelompok, tingkatanList, absensiPjList]);

  const handleDownloadAbsensiPjWord = () => {
    downloadWordDocument({
      filename: `Rekapan_Absensi_Ustadz_PJ_Murotil_${pjTanggal}.doc`,
      title: 'REKAPAN ABSENSI USTADZ & USTADZAH PENANGGUNG JAWAB MUROTIL',
      subtitle: `${murotilConfig.namaUnit} · Tanggal Acuan: ${pjTanggal}`,
      namaPondok: systemConfig.namaPondok,
      alamatPondok: systemConfig.alamatPondok,
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      penandatanganNama: murotilConfig.koordinatorNama || currentUser.nama,
      penandatanganJabatan: murotilConfig.koordinatorJabatan || 'Koordinator Murotilil Qur\'an',
      columns: [
        { header: 'No', width: '5%', align: 'center' },
        { header: 'Ustadz / Ustadzah PJ', width: '24%' },
        { header: 'Kelompok & Tingkatan', width: '27%' },
        { header: 'Hadir', width: '8%', align: 'center' },
        { header: 'Izin', width: '8%', align: 'center' },
        { header: 'Sakit', width: '8%', align: 'center' },
        { header: 'Badal', width: '8%', align: 'center' },
        { header: '% Hadir', width: '12%', align: 'center' },
      ],
      rows: rekapPjRows.map((r, idx) => [
        String(idx + 1),
        r.namaPengurus,
        `${r.namaKelompok}\n(${r.tingkatanNama})`,
        String(r.hadir),
        String(r.izin),
        String(r.sakit),
        String(r.badal),
        `${r.persen}%`,
      ]),
    });
    showToast('File Word (.doc) Rekapan Absensi Ustadz/Ustadzah PJ berhasil diunduh.');
  };

  // =========================================================================
  // 4. STATE: KOTAK MASUK & KOORDINASI PENGURUS MUROTIL
  // =========================================================================
  const [kordSearch, setKordSearch] = useState('');
  const [kordForm, setKordForm] = useState<{
    tujuan: string;
    judul: string;
    prioritas: PrioritasKoordinasi;
    isi: string;
  }>({
    tujuan: 'pengurus_murotil',
    judul: '',
    prioritas: 'Penting',
    isi: '',
  });
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const murotilKoordinasiList = useMemo(() => {
    const q = kordSearch.trim().toLowerCase();
    return koordinasiList.filter((m) => {
      const relevant =
        m.tujuan === 'pengurus_murotil' ||
        m.tujuan === 'murotil' ||
        m.tujuan === 'semua_pengurus' ||
        m.pengirimRole === 'pengurus_murotil' ||
        (m.judul || '').toLowerCase().includes('murotil') ||
        (m.judul || '').toLowerCase().includes('tahfidz') ||
        m.tujuan === 'ketua_pondok' ||
        m.tujuan === 'admin';
      if (!relevant) return false;
      if (!q) return true;
      return (
        (m.judul || '').toLowerCase().includes(q) ||
        (m.isi || '').toLowerCase().includes(q) ||
        (m.pengirimNama || '').toLowerCase().includes(q)
      );
    });
  }, [koordinasiList, kordSearch]);

  const handleSendMurotilKoordinasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kordForm.judul.trim() || !kordForm.isi.trim()) {
      showToast('Judul dan isi pesan koordinasi wajib diisi.', 'error');
      return;
    }
    const now = new Date();
    const waktuStr =
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB (' +
      todayWib +
      ')';
    const msg: PesanKoordinasi = {
      id: `krd_mrt_${Date.now()}`,
      nomorTiket: `MRT-${Math.floor(1000 + Math.random() * 9000)}`,
      judul: `[MUROTIL & TAHFIDZ] ${kordForm.judul.trim()}`,
      isi: kordForm.isi.trim(),
      prioritas: kordForm.prioritas,
      kategori: 'Laporan Keamanan',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan || 'Pengurus Murotilil Qur\'an',
      pengirimAvatar: currentUser.avatar || '',
      tujuan: kordForm.tujuan,
      waktu: waktuStr,
      tanggal: todayWib,
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    };
    storageService.saveKoordinasi(msg);
    setKordForm({ tujuan: 'pengurus_murotil', judul: '', prioritas: 'Penting', isi: '' });
    showToast('Pesan koordinasi Murotil berhasil dikirim.');
  };

  const handleReplyMurotilKoordinasi = (msg: PesanKoordinasi) => {
    const text = (replyDraft[msg.id] || '').trim();
    if (!text) return;
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const reply: BalasanKoordinasi = {
      id: `bal_${Date.now()}`,
      pesanId: msg.id,
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan,
      isi: text,
      waktu: `${nowTime} WIB`,
    };
    storageService.markKoordinasiAsRead(msg.id, currentUser.id);
    storageService.balasKoordinasi(msg.id, reply);
    setReplyDraft((prev) => ({ ...prev, [msg.id]: '' }));
    setReplyTargetId(null);
    showToast('Tanggapan koordinasi terkirim.');
  };

  // =========================================================================
  // 5. DASHBOARD ANALYTICS & INLINE BIODATA EDIT
  // =========================================================================
  const dashboardStats = useMemo(() => {
    const klpIds = new Set(dashboardKelompok.map((k) => k.id));
    const uniqueSantri = new Set<string>();
    dashboardKelompok.forEach((k) => k.santriIds.forEach((id) => uniqueSantri.add(id)));

    const scopedAbsensiSantri = absensiSantriList.filter((a) => klpIds.has(a.kelompokId));
    const totalAbsSantri = scopedAbsensiSantri.length;
    const hadirSantri = scopedAbsensiSantri.filter((a) => a.status === 'Hadir').length;
    const pctHadirSantri =
      totalAbsSantri > 0 ? Math.round((hadirSantri / totalAbsSantri) * 100) : 100;

    // Kehadiran pengurus yang bersangkutan (atau kelompok scope)
    const scopedAbsensiPj = absensiPjList.filter((a) => {
      if (isPengurusMurotil && scopeMode === 'my_groups') {
        return a.userId === currentUser.id || klpIds.has(a.kelompokId);
      }
      return klpIds.has(a.kelompokId);
    });
    const totalAbsPj = scopedAbsensiPj.length;
    const hadirPj = scopedAbsensiPj.filter((a) => a.status === 'Hadir').length;
    const pctHadirPj = totalAbsPj > 0 ? Math.round((hadirPj / totalAbsPj) * 100) : 100;

    const scopedSetoran = setoranList.filter((s) => klpIds.has(s.kelompokId));

    return {
      totalKelompok: dashboardKelompok.length,
      totalSantri: uniqueSantri.size,
      pctHadirSantri,
      hadirSantri,
      totalAbsSantri,
      pctHadirPj,
      hadirPj,
      totalAbsPj,
      totalSetoran: scopedSetoran.length,
    };
  }, [
    dashboardKelompok,
    absensiSantriList,
    absensiPjList,
    setoranList,
    isPengurusMurotil,
    scopeMode,
    currentUser.id,
  ]);

  // Chart 1: Grafik Kehadiran Santri Murotil & Kehadiran Pengurus Bersangkutan per Tanggal
  const chartKehadiranTimeline = useMemo(() => {
    const klpIds = new Set(dashboardKelompok.map((k) => k.id));
    const dateSet = new Set<string>();
    absensiSantriList.forEach((a) => {
      if (klpIds.has(a.kelompokId)) dateSet.add(a.tanggal);
    });
    absensiPjList.forEach((p) => {
      if (klpIds.has(p.kelompokId)) dateSet.add(p.tanggal);
    });
    const sortedDates = Array.from(dateSet).sort().slice(-7);

    return sortedDates.map((tgl) => {
      const sRecs = absensiSantriList.filter(
        (a) => a.tanggal === tgl && klpIds.has(a.kelompokId)
      );
      const pRecs = absensiPjList.filter(
        (p) =>
          p.tanggal === tgl &&
          (isPengurusMurotil && scopeMode === 'my_groups'
            ? p.userId === currentUser.id || klpIds.has(p.kelompokId)
            : klpIds.has(p.kelompokId))
      );
      const sHadir = sRecs.filter((r) => r.status === 'Hadir').length;
      const sTidakHadir = sRecs.filter((r) => r.status !== 'Hadir').length;
      const pHadir = pRecs.filter((r) => r.status === 'Hadir').length;
      const santriPct = sRecs.length > 0 ? Math.round((sHadir / sRecs.length) * 100) : 0;
      const pjPct = pRecs.length > 0 ? Math.round((pHadir / pRecs.length) * 100) : 0;

      return {
        tanggal: tgl.slice(5), // MM-DD
        hadirSantri: sHadir,
        izinAlphaSantri: sTidakHadir,
        persenSantri: santriPct,
        persenPengurus: pjPct,
        hadirPengurus: pHadir,
      };
    });
  }, [
    dashboardKelompok,
    absensiSantriList,
    absensiPjList,
    isPengurusMurotil,
    scopeMode,
    currentUser.id,
  ]);

  // Chart 2: Grafik Setoran Hafalan per Tingkatan (1-6)
  const chartSetoranPerTingkatan = useMemo(() => {
    const klpIds = new Set(dashboardKelompok.map((k) => k.id));
    return tingkatanList.map((tkt) => {
      const items = setoranList.filter(
        (s) => s.tingkatanId === tkt.id && klpIds.has(s.kelompokId)
      );
      return {
        nama: `Tkt ${tkt.urutan}`,
        target: tkt.targetJuz,
        ziyadah: items.filter((i) => i.jenisSetoran.startsWith('Ziyadah')).length,
        murajaah: items.filter((i) => i.jenisSetoran.startsWith('Murajaah')).length,
        tasmi: items.filter((i) => i.jenisSetoran.startsWith('Tasmi')).length,
        total: items.length,
      };
    });
  }, [tingkatanList, setoranList, dashboardKelompok]);

  // Chart 3: Pie Predikat Setoran Hafalan
  const chartPredikatPie = useMemo(() => {
    const klpIds = new Set(dashboardKelompok.map((k) => k.id));
    const items = setoranList.filter((s) => klpIds.has(s.kelompokId));
    const counts = [
      {
        name: 'Mumtaz (A)',
        value: items.filter((i) => i.nilai === 'Mumtaz (A)').length,
        color: '#10b981',
      },
      {
        name: 'Jayyid Jiddan (B+)',
        value: items.filter((i) => i.nilai === 'Jayyid Jiddan (B+)').length,
        color: '#d4af37',
      },
      {
        name: 'Jayyid (B)',
        value: items.filter((i) => i.nilai === 'Jayyid (B)').length,
        color: '#38bdf8',
      },
      {
        name: 'Mengulang (C)',
        value: items.filter((i) => i.nilai === 'Maqbul / Mengulang (C)').length,
        color: '#f97316',
      },
    ];
    return counts.filter((c) => c.value > 0);
  }, [setoranList, dashboardKelompok]);

  // Inline Biodata State at bottom of Murotil Dashboard
  const [bioForm, setBioForm] = useState({
    nama: currentUser.nama || '',
    jabatan: currentUser.jabatan || '',
    noWa: currentUser.noWa || '',
    alamat: currentUser.alamat || '',
    pin: currentUser.pin || '900001',
    password: currentUser.password || '',
    avatar: currentUser.avatar || '',
  });

  useEffect(() => {
    setBioForm({
      nama: currentUser.nama || '',
      jabatan: currentUser.jabatan || '',
      noWa: currentUser.noWa || '',
      alamat: currentUser.alamat || '',
      pin: currentUser.pin || '900001',
      password: currentUser.password || '',
      avatar: currentUser.avatar || '',
    });
  }, [currentUser]);

  const handleSaveInlineBiodata = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = bioForm.pin.replace(/\D/g, '').slice(0, 6);
    const updated: UserAccount = {
      ...currentUser,
      nama: bioForm.nama.trim() || currentUser.nama,
      jabatan: bioForm.jabatan.trim() || currentUser.jabatan,
      noWa: bioForm.noWa.trim() || currentUser.noWa,
      alamat: bioForm.alamat.trim() || currentUser.alamat,
      pin: cleanPin.length === 6 ? cleanPin : currentUser.pin || '900001',
      password: bioForm.password.trim() || currentUser.password,
      avatar: bioForm.avatar,
    };
    storageService.saveUser(updated);
    onProfileUpdated?.(updated);
    showToast('Biodata & kredensial pengurus Murotil berhasil diperbarui.');
  };

  // =========================================================================
  // 6. STATE: OPTION PANEL MUROTIL (TABS: LOGIN PENGURUS, KELOMPOK, TINGKATAN, PENGATURAN)
  // =========================================================================
  const [optionSection, setOptionSection] = useState<
    'login_pengurus' | 'kelompok_santri' | 'tingkatan' | 'pengaturan_unit'
  >('login_pengurus');

  // A. Login Pengurus Murotil & Kelompok Assignment
  const murotilUsers = useMemo(
    () => usersList.filter((u) => u.role === 'pengurus_murotil'),
    [usersList]
  );
  const [editingPengurusId, setEditingPengurusId] = useState<string | null>(null);
  const [pengurusForm, setPengurusForm] = useState<{
    nama: string;
    username: string;
    password: string;
    pin: string;
    jabatan: string;
    noWa: string;
    genderAccess: 'all' | 'putra' | 'putri';
    murotilKelompokIds: string[];
    statusAktif: boolean;
  }>({
    nama: '',
    username: '',
    password: '',
    pin: String(Math.floor(100000 + Math.random() * 900000)),
    jabatan: 'Pengurus Murotilil Qur\'an & Tahfidz',
    noWa: '0812',
    genderAccess: 'all',
    murotilKelompokIds: [],
    statusAktif: true,
  });

  const resetPengurusForm = () => {
    setEditingPengurusId(null);
    setPengurusForm({
      nama: '',
      username: '',
      password: '',
      pin: String(Math.floor(100000 + Math.random() * 900000)),
      jabatan: 'Pengurus Murotilil Qur\'an & Tahfidz',
      noWa: '0812',
      genderAccess: 'all',
      murotilKelompokIds: [],
      statusAktif: true,
    });
  };

  const handleSavePengurusMurotil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengurusForm.nama.trim() || !pengurusForm.username.trim()) {
      showToast('Nama Pengurus dan Username wajib diisi.', 'error');
      return;
    }
    const cleanPin = pengurusForm.pin.replace(/\D/g, '').slice(0, 6);
    const existing = editingPengurusId
      ? usersList.find((u) => u.id === editingPengurusId)
      : undefined;
    const savedUser: UserAccount = {
      id: existing ? existing.id : `usr_murotil_${Date.now()}`,
      username: pengurusForm.username.trim().toLowerCase(),
      password: pengurusForm.password.trim() || existing?.password || 'murotil123',
      pin: cleanPin.length === 6 ? cleanPin : existing?.pin || '900001',
      nama: pengurusForm.nama.trim(),
      role: 'pengurus_murotil',
      nrp: existing?.nrp || `MRT-${String(murotilUsers.length + 1).padStart(3, '0')}`,
      jabatan: pengurusForm.jabatan.trim() || 'Pengurus Murotilil Qur\'an & Tahfidz',
      divisi: 'Murotilil Qur\'an & Tahfidz',
      genderAccess: pengurusForm.genderAccess,
      noWa: pengurusForm.noWa.trim() || '0812',
      alamat: existing?.alamat || 'Komplek Tahfidz Al-Maliki, Karawang',
      avatar: existing?.avatar || '',
      statusAktif: pengurusForm.statusAktif,
      murotilKelompokIds: pengurusForm.murotilKelompokIds,
    };
    storageService.saveUser(savedUser);

    // Sync penanggungJawabUserId on selected kelompoks so everything aligns
    const assignedSet = new Set(pengurusForm.murotilKelompokIds);
    const syncedKelompoks = kelompokList.map((klp) => {
      if (assignedSet.has(klp.id)) {
        return {
          ...klp,
          penanggungJawabUserId: savedUser.id,
          penanggungJawabNama: savedUser.nama,
        };
      }
      if (klp.penanggungJawabUserId === savedUser.id && !assignedSet.has(klp.id)) {
        return {
          ...klp,
          penanggungJawabUserId: undefined,
        };
      }
      return klp;
    });
    persistMurotilUpdate(
      { murotilKelompokList: syncedKelompoks },
      `Akun login "${savedUser.nama}" & penugasan ${pengurusForm.murotilKelompokIds.length} kelompok berhasil disimpan!`
    );
    resetPengurusForm();
  };

  // B. Kelompok & Santri Editor
  const [editingKelompokId, setEditingKelompokId] = useState<string | null>(null);
  const [kelompokForm, setKelompokForm] = useState<{
    kodeKelompok: string;
    namaKelompok: string;
    tingkatanId: string;
    gender: 'putra' | 'putri' | 'campuran';
    penanggungJawabNama: string;
    penanggungJawabUserId: string;
    jadwalWaktu: string;
    lokasi: string;
    santriIds: string[];
    statusAktif: boolean;
  }>({
    kodeKelompok: `KLP-${String(kelompokList.length + 1).padStart(2, '0')}`,
    namaKelompok: '',
    tingkatanId: tingkatanList[0]?.id || 'tkt_1',
    gender: 'putra',
    penanggungJawabNama: '',
    penanggungJawabUserId: '',
    jadwalWaktu: "Ba'da Subuh & Ba'da Maghrib",
    lokasi: "Masjid Jami' Al-Maliki",
    santriIds: [],
    statusAktif: true,
  });

  const resetKelompokForm = () => {
    setEditingKelompokId(null);
    setKelompokForm({
      kodeKelompok: `KLP-${String(kelompokList.length + 1).padStart(2, '0')}`,
      namaKelompok: '',
      tingkatanId: tingkatanList[0]?.id || 'tkt_1',
      gender: 'putra',
      penanggungJawabNama: '',
      penanggungJawabUserId: '',
      jadwalWaktu: "Ba'da Subuh & Ba'da Maghrib",
      lokasi: "Masjid Jami' Al-Maliki",
      santriIds: [],
      statusAktif: true,
    });
  };

  const handleSaveKelompok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelompokForm.namaKelompok.trim()) {
      showToast('Nama Kelompok wajib diisi.', 'error');
      return;
    }
    const matchedUser = murotilUsers.find((u) => u.id === kelompokForm.penanggungJawabUserId);
    const pjNama =
      kelompokForm.penanggungJawabNama.trim() ||
      matchedUser?.nama ||
      'Ustadz/Ustadzah Pembina';
    const nextId = editingKelompokId || `klp_${Date.now()}`;
    const newKlp: MurotilKelompok = {
      id: nextId,
      kodeKelompok:
        kelompokForm.kodeKelompok.trim() || `KLP-${String(kelompokList.length + 1).padStart(2, '0')}`,
      namaKelompok: kelompokForm.namaKelompok.trim(),
      tingkatanId: kelompokForm.tingkatanId,
      gender: kelompokForm.gender,
      penanggungJawabNama: pjNama,
      penanggungJawabUserId: kelompokForm.penanggungJawabUserId || undefined,
      santriIds: kelompokForm.santriIds,
      jadwalWaktu: kelompokForm.jadwalWaktu.trim() || "Ba'da Subuh",
      lokasi: kelompokForm.lokasi.trim() || 'Majelis Tahfidz',
      statusAktif: kelompokForm.statusAktif,
    };

    const nextList = editingKelompokId
      ? kelompokList.map((k) => (k.id === editingKelompokId ? newKlp : k))
      : [...kelompokList, newKlp];

    // Also link user's murotilKelompokIds if user selected
    if (matchedUser) {
      const nextIds = Array.from(new Set([...(matchedUser.murotilKelompokIds || []), nextId]));
      storageService.saveUser({ ...matchedUser, murotilKelompokIds: nextIds });
    }

    persistMurotilUpdate(
      { murotilKelompokList: nextList },
      `Kelompok "${newKlp.namaKelompok}" (${newKlp.santriIds.length} santri) berhasil disimpan!`
    );
    resetKelompokForm();
  };

  // C. Tingkatan Editor (6 Tingkatan)
  const [tingkatanDraft, setTingkatanDraft] = useState<MurotilTingkatan[]>(tingkatanList);
  useEffect(() => {
    setTingkatanDraft(tingkatanList);
  }, [tingkatanList]);

  // D. Unit Config Editor
  const [unitConfigDraft, setUnitConfigDraft] = useState<MurotilConfig>(murotilConfig);
  const [sesiInputStr, setSesiInputStr] = useState<string>(murotilConfig.sesiList.join(', '));
  useEffect(() => {
    setUnitConfigDraft(murotilConfig);
    setSesiInputStr(murotilConfig.sesiList.join(', '));
  }, [murotilConfig]);

  const unreadMurotilCount = useMemo(
    () =>
      murotilKoordinasiList.filter((m) => !(m.dibacaOleh || []).includes(currentUser.id)).length,
    [murotilKoordinasiList, currentUser.id]
  );

  const navButtons: {
    id: MurotilSubTab;
    label: string;
    shortDesc: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard_murotil', label: 'Dashboard', shortDesc: 'Ringkasan & Grafik', icon: LayoutDashboard },
    {
      id: 'kotak_masuk',
      label: 'Kotak Masuk',
      shortDesc: 'Info & Koordinasi',
      icon: Inbox,
      badge: unreadMurotilCount,
    },
    { id: 'absensi_santri', label: 'Absensi Santri', shortDesc: 'Harian & Rekap Word', icon: ClipboardCheck },
    { id: 'setoran_hafalan', label: 'Setoran Hafalan', shortDesc: '6 Tingkatan & Juz', icon: Award },
    { id: 'absensi_pj', label: 'Absensi PJ', shortDesc: 'Ustadz/ah Pengurus', icon: UserCheck },
    { id: 'option_murotil', label: 'Option Panel', shortDesc: 'Akun, Kelompok & Sesi', icon: Sliders },
  ];

  return (
    <div className="space-y-4">
      {/* HEADER MODULE BANNER + NAVIGATION BAR */}
      <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/75 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-emerald-950 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-lg shrink-0">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                  Bidang Al-Qur&apos;an &amp; Tahfidz
                </span>
                {myAssignedKelompok.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-mono font-semibold text-emerald-200">
                    PJ: {myAssignedKelompok.map((k) => k.kodeKelompok).join(', ')}
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-xl font-black text-white tracking-tight truncate mt-0.5">
                Murotilil Qur&apos;an &amp; Tahfidz
              </h1>
              <p className="text-[11px] text-emerald-100/75 truncate">
                {murotilConfig.namaUnit} · 6 Tingkatan Hafalan · Rekap Word Otomatis
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {myAssignedKelompok.length > 0 && (
              <div className="inline-flex p-1 rounded-xl bg-[#041A13]/90 border border-emerald-500/30">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setScopeMode('my_groups')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    scopeMode === 'my_groups'
                      ? 'bg-[#D4AF37] text-[#041A13] shadow'
                      : 'text-emerald-100/80 hover:text-white'
                  }`}
                >
                  Kelompok Saya ({myAssignedKelompok.length})
                </motion.button>
                {(isAdminOrKetua || murotilConfig.allowPengurusLihatSemuaKelompok) && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setScopeMode('all_groups')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      scopeMode === 'all_groups'
                        ? 'bg-[#D4AF37] text-[#041A13] shadow'
                        : 'text-emerald-100/80 hover:text-white'
                    }`}
                  >
                    Semua ({kelompokList.length})
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CLEAN 6-TAB SEGMENTED GRID */}
        <div className="mt-4 pt-3.5 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {navButtons.map((btn) => {
            const Icon = btn.icon;
            const active = activeTab === btn.id;
            return (
              <motion.button
                whileTap={{ scale: 0.97 }}
                key={btn.id}
                type="button"
                onClick={() => setActiveTab(btn.id)}
                className={`relative px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-2.5 ${
                  active
                    ? 'bg-gradient-to-br from-[#D4AF37] to-[#b58922] text-[#041A13] border-[#f3d266] shadow-[0_6px_18px_rgba(212,175,55,0.28)]'
                    : 'bg-[#041A13]/75 text-emerald-100 hover:text-white border-emerald-500/20 hover:border-emerald-400/45 hover:bg-emerald-900/40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-[#041A13]/15 text-[#041A13]'
                      : 'bg-emerald-900/60 text-[#10B981]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold truncate leading-tight">{btn.label}</div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      active ? 'text-[#041A13]/75 font-semibold' : 'text-emerald-200/65'
                    }`}
                  >
                    {btn.shortDesc}
                  </div>
                </div>
                {btn.badge !== undefined && btn.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 ${
                      active ? 'bg-[#041A13] text-[#D4AF37]' : 'bg-[#D4AF37] text-[#041A13]'
                    }`}
                  >
                    {btn.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
              : 'bg-emerald-950/90 border-[#D4AF37]/50 text-emerald-100'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: DASHBOARD UTAMA PENGURUS MUROTIL                               */}
      {/* ===================================================================== */}
      {activeTab === 'dashboard_murotil' && (
        <div className="space-y-4">
          {/* LAYER 1: 4 COMPACT 3D GLASS KPI TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiStatCard3D
              label="Santri Binaan"
              value={dashboardStats.totalSantri}
              tone="silver"
              trendText={`${dashboardStats.totalKelompok} Kelompok`}
              trendPercent={dashboardStats.totalKelompok > 0 ? 100 : 0}
              subtitle={dashboardKelompok.map((k) => k.kodeKelompok).join(', ') || 'Belum ada kelompok'}
              icon={<Users className="w-4 h-4 text-[#D4AF37]" />}
            />

            <KpiStatCard3D
              label="Hadir Santri"
              value={dashboardStats.pctHadirSantri}
              suffix="%"
              tone="emerald"
              trendText={`${dashboardStats.hadirSantri}/${dashboardStats.totalAbsSantri}`}
              trendPercent={dashboardStats.pctHadirSantri >= 80 ? dashboardStats.pctHadirSantri : -Math.max(1, 100 - dashboardStats.pctHadirSantri)}
              subtitle="Akumulasi absensi aktif"
              icon={<ClipboardCheck className="w-4 h-4 text-[#10B981]" />}
            />

            <KpiStatCard3D
              label="Hadir Pengurus"
              value={dashboardStats.pctHadirPj}
              suffix="%"
              tone="gold"
              trendText={`${dashboardStats.hadirPj}/${dashboardStats.totalAbsPj}`}
              trendPercent={dashboardStats.pctHadirPj >= 80 ? dashboardStats.pctHadirPj : -Math.max(1, 100 - dashboardStats.pctHadirPj)}
              subtitle={isPengurusMurotil ? currentUser.nama : 'Seluruh Ustadz & Ustadzah PJ'}
              icon={<UserCheck className="w-4 h-4 text-[#D4AF37]" />}
            />

            <KpiStatCard3D
              label="Total Setoran"
              value={dashboardStats.totalSetoran}
              tone="sky"
              trendText="6 Tingkatan"
              trendPercent={dashboardStats.totalSetoran > 0 ? 18.5 : 0}
              subtitle="Ziyadah, Murajaah & Tasmi'"
              icon={<Award className="w-4 h-4 text-sky-400" />}
            />
          </div>

          {/* LAYER 2: KELOMPOK BINAAN & AKSI CEPAT (DIATAS GRAFIK AGAR MUDAH DIOPERASIKAN) */}
          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-500/20 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Kelompok Binaan Aktif ({dashboardKelompok.length})
                </h3>
                <p className="text-[11px] text-emerald-100/75">
                  Pilih langsung kelompok untuk mengisi Absensi Santri atau mencatat Setoran Hafalan
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setActiveTab('absensi_pj')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/70 border border-emerald-500/35 text-xs font-bold text-emerald-100 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Absensi PJ</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setActiveTab('absensi_santri')}
                  className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/45 text-xs font-bold text-[#D4AF37] cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Semua Absensi</span>
                </motion.button>
              </div>
            </div>

            {dashboardKelompok.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-100/70">
                Belum ada kelompok yang ditugaskan. Tambahkan melalui tab Option Panel.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {dashboardKelompok.map((klp) => {
                  const tkt = tingkatanList.find((t) => t.id === klp.tingkatanId);
                  const klpSetoranCount = setoranList.filter((s) => s.kelompokId === klp.id).length;
                  return (
                    <div
                      key={klp.id}
                      className="rounded-2xl bg-[#041A13]/85 border border-emerald-500/25 p-4 flex flex-col justify-between gap-3 hover:border-[#D4AF37]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[10px] font-mono font-bold text-[#D4AF37]">
                              {klp.kodeKelompok}
                            </span>
                            <span className="text-[10px] font-mono text-[#10B981] font-bold">
                              {tkt?.targetJuz || '-'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5 truncate">
                            {klp.namaKelompok}
                          </h4>
                          <p className="text-[11px] text-emerald-100/75 truncate">
                            PJ: {klp.penanggungJawabNama}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/30 text-[11px] font-mono text-emerald-100 font-bold shrink-0 tabular-nums">
                          {klp.santriIds.length} Santri
                        </span>
                      </div>

                      <div className="text-[11px] text-emerald-200/75 font-mono flex items-center justify-between border-t border-emerald-500/15 pt-2">
                        <span className="truncate">{klp.jadwalWaktu}</span>
                        <span className="shrink-0 tabular-nums">{klpSetoranCount} Setoran</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => {
                            setAbsensiKelompokFilter(klp.id);
                            setActiveTab('absensi_santri');
                          }}
                          className="py-2 px-2.5 rounded-xl bg-emerald-600/85 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Absensi</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => {
                            setSelectedTingkatanId(klp.tingkatanId);
                            setSelectedSetoranKelompokId(klp.id);
                            setActiveTab('setoran_hafalan');
                          }}
                          className="py-2 px-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5c24a] text-[#041A13] text-[11px] font-extrabold cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Setoran</span>
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LAYER 3: GRAFIK 3D KEHADIRAN & SETORAN HAFALAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="kpi-glass-3d rounded-2xl p-4 sm:p-5 space-y-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Grafik 3D Kehadiran Santri &amp; Pengurus
                </h3>
                <p className="text-[11px] text-emerald-100/75">
                  Tren persentase kehadiran harian santri binaan dan Ustadz/Ustadzah PJ
                </p>
              </div>
              <LineChart3D
                data={chartKehadiranTimeline}
                xKey="tanggal"
                height={235}
                yDomain={[0, 100]}
                yUnit="%"
                tooltipUnit="%"
                subtitle="Kehadiran Murotil & Tahfidz"
                series={[
                  { key: 'persenSantri', label: 'Kehadiran Santri (%)', color: '#10B981', accentColor: '#6ee7b7' },
                  { key: 'persenPengurus', label: 'Kehadiran Pengurus PJ (%)', color: '#D4AF37', accentColor: '#fef08a' },
                ]}
              />
            </div>

            <div className="kpi-glass-3d rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Grafik 3D Setoran (6 Tingkatan)
                </h3>
                <p className="text-[11px] text-emerald-100/75">
                  Distribusi Ziyadah, Murajaah &amp; Tasmi&apos; per tingkatan
                </p>
              </div>
              <BarChart3D
                data={chartSetoranPerTingkatan}
                xKey="nama"
                stacked={true}
                height={210}
                unit=" setoran"
                series={[
                  { key: 'ziyadah', label: 'Ziyadah', color: '#10B981' },
                  { key: 'murajaah', label: 'Murajaah', color: '#D4AF37' },
                  { key: 'tasmi', label: "Tasmi'", color: '#38bdf8' },
                ]}
              />
              {chartPredikatPie.length > 0 && (
                <div className="mt-2 pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center gap-3">
                  <div className="shrink-0">
                    <PieChart3D
                      data={chartPredikatPie.map((entry) => ({
                        name: entry.name,
                        value: entry.value,
                        color: entry.color,
                      }))}
                      size={112}
                      innerRadiusRatio={0.48}
                      depth={10}
                      unit=" setoran"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono justify-center sm:justify-start">
                    {chartPredikatPie.map((c) => (
                      <span
                        key={c.name}
                        className="px-2 py-0.5 rounded-md bg-[#041A13]/85 border border-emerald-500/25 text-emerald-100"
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}: <strong>{c.value}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LAYER 4: EDIT BIODATA & AKSES OPTION PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <form
              onSubmit={handleSaveInlineBiodata}
              className="lg:col-span-8 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-3">
                  {bioForm.avatar ? (
                    <img
                      src={bioForm.avatar}
                      alt={bioForm.nama}
                      className="w-10 h-10 rounded-xl object-cover border border-[#D4AF37]/50 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#041A13] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                      <UserCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">
                      Biodata Pengurus Murotil
                    </h3>
                    <p className="text-[11px] text-emerald-100/75">
                      Perbarui profil, WhatsApp, PIN 6 digit &amp; kata sandi akun Anda
                    </p>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-[#041A13] border border-[#D4AF37]/40 text-[11px] font-bold text-[#D4AF37] hover:text-white cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setBioForm((prev) => ({
                          ...prev,
                          avatar: String(ev.target?.result || ''),
                        }));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={bioForm.nama}
                    onChange={(e) => setBioForm({ ...bioForm, nama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={bioForm.jabatan}
                    onChange={(e) => setBioForm({ ...bioForm, jabatan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    value={bioForm.noWa}
                    onChange={(e) => setBioForm({ ...bioForm, noWa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#D4AF37] mb-1">
                    PIN 6 Digit
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={bioForm.pin}
                    onChange={(e) =>
                      setBioForm({ ...bioForm, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-[#D4AF37]/40 text-[#D4AF37] font-mono font-bold tracking-widest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                    Kata Sandi
                  </label>
                  <input
                    type="text"
                    value={bioForm.password}
                    onChange={(e) => setBioForm({ ...bioForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                    Alamat / Asrama
                  </label>
                  <input
                    type="text"
                    value={bioForm.alamat}
                    onChange={(e) => setBioForm({ ...bioForm, alamat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Biodata</span>
                </motion.button>
              </div>
            </form>

            {/* OPTION PANEL QUICK ACCESS CARD */}
            <div className="lg:col-span-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-[#D4AF37]/35 p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/45 flex items-center justify-center text-[#D4AF37]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Option Panel Murotil
                  </h3>
                </div>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Kelola akun login pengurus per kelompok, anggota santri, 6 tingkatan hafalan, serta sesi waktu &amp; format laporan Word.
                </p>
              </div>

              <div className="space-y-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => {
                    setOptionSection('login_pengurus');
                    setActiveTab('option_murotil');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#e5c24a] text-[#041A13] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Login Pengurus Per Kelompok</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => {
                    setOptionSection('kelompok_santri');
                    setActiveTab('option_murotil');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#041A13]/85 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#D4AF37]" />
                  <span>Kelompok, Santri &amp; 6 Tingkatan</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: KOTAK MASUK & KOORDINASI PENGURUS MUROTIL                      */}
      {/* ===================================================================== */}
      {activeTab === 'kotak_masuk' && (
        <div className="space-y-4">
          <PusatInformasiSection viewerLabel="Divisi Murotilil Qur'an & Tahfidz" />

          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-[#D4AF37]" />
                  <span>Kotak Masuk &amp; Koordinasi Pengurus Murotil</span>
                </h2>
                <p className="text-xs text-emerald-100/75 mt-0.5">
                  Koordinasi antar pengurus Murotil, Ustadz/ah PJ, Ketua Pondok, Sekretaris &amp; divisi terkait
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={kordSearch}
                  onChange={(e) => setKordSearch(e.target.value)}
                  placeholder="Cari pesan koordinasi..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Form Kirim Koordinasi */}
            <form
              onSubmit={handleSendMurotilKoordinasi}
              className="p-3.5 sm:p-4 rounded-2xl bg-[#041A13]/85 border border-emerald-500/25 space-y-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <select
                  value={kordForm.tujuan}
                  onChange={(e) => setKordForm({ ...kordForm, tujuan: e.target.value })}
                  className="sm:col-span-4 px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-xs text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="pengurus_murotil">Tujuan: Sesama Pengurus Murotil</option>
                  <option value="ketua_pondok">Tujuan: Ketua Pondok</option>
                  <option value="sekretaris">Tujuan: Divisi Sekretaris</option>
                  <option value="bendahara">Tujuan: Divisi Bendahara</option>
                  <option value="perlengkapan">Tujuan: Divisi Perlengkapan</option>
                  <option value="semua_dewan">Tujuan: Divisi Keamanan</option>
                  <option value="admin">Tujuan: Admin Pusat</option>
                </select>
                <input
                  type="text"
                  placeholder="Judul koordinasi / laporan kelompok..."
                  value={kordForm.judul}
                  onChange={(e) => setKordForm({ ...kordForm, judul: e.target.value })}
                  className="sm:col-span-5 px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <select
                  value={kordForm.prioritas}
                  onChange={(e) =>
                    setKordForm({ ...kordForm, prioritas: e.target.value as PrioritasKoordinasi })
                  }
                  className="sm:col-span-3 px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-xs text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Normal">Prioritas: Normal</option>
                  <option value="Penting">Prioritas: Penting</option>
                  <option value="Mendesak">Prioritas: Mendesak</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Tulis pesan koordinasi, jadwal badal kelompok, atau kendala hafalan santri..."
                  value={kordForm.isi}
                  onChange={(e) => setKordForm({ ...kordForm, isi: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Koordinasi</span>
                </motion.button>
              </div>
            </form>

            {/* Tabel Pesan Koordinasi */}
            <div className="overflow-x-auto rounded-2xl border border-emerald-500/25">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-[#D4AF37] border-b border-emerald-500/25">
                  <tr>
                    <th className="py-2.5 px-3.5">Tiket &amp; Waktu</th>
                    <th className="py-2.5 px-3.5">Pengirim</th>
                    <th className="py-2.5 px-3.5">Isi Koordinasi &amp; Balasan</th>
                    <th className="py-2.5 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/45">
                  {murotilKoordinasiList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-emerald-100/65">
                        Belum ada pesan koordinasi Murotil. Kirim pesan pertama melalui form di atas.
                      </td>
                    </tr>
                  ) : (
                    murotilKoordinasiList.map((msg) => {
                      const isRead = (msg.dibacaOleh || []).includes(currentUser.id);
                      const isReplying = replyTargetId === msg.id;
                      return (
                        <React.Fragment key={msg.id}>
                          <tr className={!isRead ? 'bg-emerald-900/35' : 'hover:bg-emerald-900/20'}>
                            <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap align-top">
                              <div className="flex items-center gap-1.5 font-bold text-[#D4AF37]">
                                {!isRead && <span className="w-2 h-2 rounded-full bg-[#10B981]" />}
                                <span>{msg.nomorTiket}</span>
                              </div>
                              <div className="text-[10px] text-emerald-100/70">{msg.waktu}</div>
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/30 text-[10px] text-emerald-100">
                                {msg.prioritas}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 align-top whitespace-nowrap">
                              <div className="font-bold text-white">{msg.pengirimNama}</div>
                              <div className="text-[11px] text-emerald-100/75">
                                {msg.pengirimJabatan || msg.pengirimRole}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 align-top min-w-[240px]">
                              <div className="font-bold text-white">{msg.judul}</div>
                              <p className="text-emerald-100/85 mt-1 whitespace-pre-line">{msg.isi}</p>
                              {(msg.balasan || []).length > 0 && (
                                <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-[#D4AF37]/50">
                                  {msg.balasan.map((b) => (
                                    <div key={b.id} className="text-[11px] bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                                      <span className="font-bold text-[#D4AF37]">{b.pengirimNama}</span>{' '}
                                      <span className="text-emerald-200/70 font-mono text-[10px]">({b.waktu})</span>
                                      <p className="text-emerald-100 mt-0.5">{b.isi}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap align-top space-x-1">
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => {
                                  if (!isRead) storageService.markKoordinasiAsRead(msg.id, currentUser.id);
                                  setReplyTargetId(isReplying ? null : msg.id);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#041A13] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Reply className="w-3 h-3" />
                                <span>{isReplying ? 'Tutup' : 'Balas'}</span>
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => {
                                  storageService.deleteKoordinasi(msg.id);
                                  showToast('Pesan koordinasi dihapus.');
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/90 text-rose-200 border border-rose-500/40 cursor-pointer"
                                title="Hapus Pesan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </td>
                          </tr>
                          {isReplying && (
                            <tr className="bg-emerald-950/80">
                              <td colSpan={4} className="p-3">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder={`Tulis balasan untuk ${msg.pengirimNama}...`}
                                    value={replyDraft[msg.id] || ''}
                                    onChange={(e) =>
                                      setReplyDraft((prev) => ({ ...prev, [msg.id]: e.target.value }))
                                    }
                                    className="flex-1 px-3 py-2 rounded-xl bg-[#041A13] border border-[#D4AF37]/45 text-xs text-white focus:outline-none"
                                  />
                                  <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    type="button"
                                    onClick={() => handleReplyMurotilKoordinasi(msg)}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                                  >
                                    Kirim Balasan
                                  </motion.button>
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ABSENSI SANTRI PER KELOMPOK (TABEL) + REKAPAN WORD             */}
      {/* ===================================================================== */}
      {activeTab === 'absensi_santri' && (
        <div className="space-y-4">
          {/* FILTER BAR */}
          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Absensi Santri Per Kelompok</span>
                </h2>
                <p className="text-[11px] text-emerald-100/75 mt-0.5">
                  Pilih tanggal, sesi waktu &amp; kelompok untuk menandai kehadiran santri secara cepat
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="date"
                  value={absensiTanggal}
                  onChange={(e) => setAbsensiTanggal(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <select
                  value={absensiSesi}
                  onChange={(e) => setAbsensiSesi(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-xs text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  {murotilConfig.sesiList.map((s) => (
                    <option key={s} value={s}>
                      Sesi: {s}
                    </option>
                  ))}
                </select>
                <select
                  value={absensiKelompokFilter}
                  onChange={(e) => setAbsensiKelompokFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-xs text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Semua Kelompok ({accessibleKelompok.length})</option>
                  {accessibleKelompok.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.namaKelompok}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TABEL ABSENSI PER KELOMPOK */}
          {activeAbsensiKelompokList.map((klp) => {
            const tkt = tingkatanList.find((t) => t.id === klp.tingkatanId);
            const members = santriList.filter((s) => klp.santriIds.includes(s.id));

            return (
              <div
                key={klp.id}
                className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 overflow-hidden shadow-xl"
              >
                <div className="px-4 py-3 bg-[#041A13]/75 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-2.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[10px] font-mono font-bold text-[#D4AF37]">
                        {klp.kodeKelompok}
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-white">{klp.namaKelompok}</h3>
                      <span className="text-[11px] font-mono text-[#10B981] font-semibold">
                        · {tkt?.targetJuz}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100/75 mt-0.5">
                      PJ: <strong className="text-white">{klp.penanggungJawabNama}</strong> · {klp.lokasi}
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => handleHadirkanSemuaKelompok(klp)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Hadir Semua ({members.length})</span>
                  </motion.button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-emerald-200/80 border-b border-emerald-500/20">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">NIS</th>
                        <th className="py-2.5 px-3">Nama Santri</th>
                        <th className="py-2.5 px-3">Kelas / Kamar</th>
                        <th className="py-2.5 px-3">Kehadiran ({absensiTanggal})</th>
                        <th className="py-2.5 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/40">
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-emerald-100/65">
                            Belum ada santri terdaftar pada kelompok ini. Tambahkan via Option Panel.
                          </td>
                        </tr>
                      ) : (
                        members.map((san, idx) => {
                          const rec = absensiSantriList.find(
                            (a) =>
                              a.tanggal === absensiTanggal &&
                              a.sesi === absensiSesi &&
                              a.kelompokId === klp.id &&
                              a.santriId === san.id
                          );
                          const currentStatus = rec?.status;

                          return (
                            <tr key={san.id} className="hover:bg-emerald-900/25">
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-200/80 tabular-nums">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#D4AF37] whitespace-nowrap">
                                {san.nis}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                                {san.nama}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-100/75 whitespace-nowrap">
                                {san.kelas} · {san.kamar}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="inline-flex rounded-xl p-0.5 bg-[#041A13]/90 border border-emerald-500/25 gap-1">
                                  {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as StatusAbsensiMurotil[]).map(
                                    (st) => {
                                      const isSelected = currentStatus === st;
                                      const activeClass =
                                        st === 'Hadir'
                                          ? 'bg-[#10B981] text-[#041A13] shadow'
                                          : st === 'Izin'
                                            ? 'bg-sky-400 text-slate-950 shadow'
                                            : st === 'Sakit'
                                              ? 'bg-amber-400 text-slate-950 shadow'
                                              : 'bg-rose-500 text-white shadow';
                                      return (
                                        <motion.button
                                          whileTap={{ scale: 0.97 }}
                                          key={st}
                                          type="button"
                                          onClick={() => handleSetSantriAbsensi(klp, san, st)}
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                            isSelected
                                              ? activeClass
                                              : 'text-emerald-100/75 hover:text-white hover:bg-emerald-900/40'
                                          }`}
                                        >
                                          {st}
                                        </motion.button>
                                      );
                                    }
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 min-w-[150px]">
                                <input
                                  type="text"
                                  placeholder="Catatan sesi..."
                                  value={rec?.catatan || ''}
                                  onChange={(e) =>
                                    handleSetSantriAbsensi(
                                      klp,
                                      san,
                                      currentStatus || 'Hadir',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#041A13]/90 border border-emerald-500/25 text-[11px] text-white focus:outline-none focus:border-[#D4AF37]"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* TABEL REKAPAN ABSENSI DI BAWAHNYA + DOWNLOAD WORD */}
          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-[#D4AF37]/35 p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3.5">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  Rekapan Absensi Santri Murotil
                </h3>
                <p className="text-[11px] text-emerald-100/75 mt-0.5">
                  Akumulasi Hadir, Izin, Sakit, Alpha &amp; Persentase Kehadiran per santri (siap unduh Word)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex p-1 rounded-xl bg-[#041A13]/90 border border-emerald-500/25">
                  {[
                    { id: 'semua', label: 'Semua' },
                    { id: 'bulan_ini', label: 'Bulan Ini' },
                    { id: 'hari_ini', label: 'Hari Ini' },
                  ].map((p) => (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      key={p.id}
                      type="button"
                      onClick={() => setRekapPeriode(p.id as any)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        rekapPeriode === p.id
                          ? 'bg-[#D4AF37] text-[#041A13]'
                          : 'text-emerald-100/80 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleDownloadRekapAbsensiWord}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Word (.doc)</span>
                </motion.button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-emerald-500/25">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-[#D4AF37] border-b border-emerald-500/20">
                  <tr>
                    <th className="py-2.5 px-3 text-center">No</th>
                    <th className="py-2.5 px-3">Kelompok &amp; Tingkatan</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3">Nama Santri</th>
                    <th className="py-2.5 px-3">PJ Kelompok</th>
                    <th className="py-2.5 px-3 text-center">Hadir</th>
                    <th className="py-2.5 px-3 text-center">Izin</th>
                    <th className="py-2.5 px-3 text-center">Sakit</th>
                    <th className="py-2.5 px-3 text-center">Alpha</th>
                    <th className="py-2.5 px-3 text-center">% Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/40 tabular-nums">
                  {rekapAbsensiRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-emerald-100/65">
                        Belum ada data santri pada kelompok yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    rekapAbsensiRows.map((row, idx) => (
                      <tr key={`${row.kelompokId}-${row.santriId}`} className="hover:bg-emerald-900/25">
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-200/80">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{row.kelompokNama}</div>
                          <div className="text-[10px] text-emerald-200/75">{row.tingkatanNama}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#D4AF37]">{row.nis}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{row.nama}</td>
                        <td className="py-2.5 px-3 text-emerald-100/80">{row.pjNama}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#10B981]">
                          {row.hadir}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-300">
                          {row.izin}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                          {row.sakit}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-400">
                          {row.alpha}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/35 font-mono font-bold text-emerald-100">
                            {row.persenHadir}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SETORAN HAFALAN SANTRI (6 TINGKATAN & KELOMPOK)                */}
      {/* ===================================================================== */}
      {activeTab === 'setoran_hafalan' && (
        <div className="space-y-4">
          {/* 6 TINGKATAN COMPACT SELECTOR + KELOMPOK FILTER */}
          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  <span>Setoran Hafalan — 6 Tingkatan</span>
                </h2>
                <p className="text-[11px] text-emerald-100/75 mt-0.5">
                  Pilih tingkatan &amp; kelompok lalu catat setoran Ziyadah, Murajaah, atau Tasmi&apos;
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleDownloadSetoranWord}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Word (.doc)</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {tingkatanList.map((tkt, idx) => {
                const active = tkt.id === activeTingkatan?.id;
                const countGroups = accessibleKelompok.filter(
                  (k) => k.tingkatanId === tkt.id
                ).length;
                const color = TINGKATAN_COLORS[idx % TINGKATAN_COLORS.length];
                return (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={tkt.id}
                    type="button"
                    onClick={() => {
                      setSelectedTingkatanId(tkt.id);
                      setSelectedSetoranKelompokId('all');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-900/75 border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.22)]'
                        : 'bg-[#041A13]/80 border-emerald-500/20 hover:border-[#D4AF37]/45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                        style={{
                          backgroundColor: `${color}22`,
                          color,
                          border: `1px solid ${color}55`,
                        }}
                      >
                        Tkt {tkt.urutan}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-100/75 tabular-nums">
                        {countGroups} Klp
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-white mt-1.5 truncate">
                      {tkt.targetJuz}
                    </div>
                    <div className="text-[10px] text-emerald-100/70 truncate mt-0.5">
                      {tkt.nama}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* FILTER KELOMPOK DALAM TINGKATAN */}
            <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-emerald-500/20">
              <span className="text-[11px] font-mono text-[#D4AF37] uppercase font-bold">
                Kelompok:
              </span>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setSelectedSetoranKelompokId('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  selectedSetoranKelompokId === 'all'
                    ? 'bg-[#D4AF37] text-[#041A13]'
                    : 'bg-[#041A13]/90 text-emerald-100 border border-emerald-500/25 hover:border-[#D4AF37]/45'
                }`}
              >
                Semua ({kelompokInTingkatan.length})
              </motion.button>
              {kelompokInTingkatan.map((klp) => (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  key={klp.id}
                  type="button"
                  onClick={() => setSelectedSetoranKelompokId(klp.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    selectedSetoranKelompokId === klp.id
                      ? 'bg-[#10B981] text-[#041A13]'
                      : 'bg-[#041A13]/90 text-emerald-100 border border-emerald-500/25 hover:border-[#10B981]/50'
                  }`}
                >
                  {klp.namaKelompok}
                </motion.button>
              ))}
            </div>
          </div>

          {/* SPLIT WORKSPACE: FORM SETORAN (4 COL) + RIWAYAT SETORAN (8 COL) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <form
              onSubmit={handleSaveSetoran}
              className="xl:col-span-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-3.5"
            >
              <div className="border-b border-emerald-500/20 pb-3">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Input Setoran Baru</span>
                </h3>
                <p className="text-[11px] text-emerald-100/70 mt-0.5">
                  {activeTingkatan?.nama} ({activeTingkatan?.targetJuz})
                </p>
              </div>

              {kelompokInTingkatan.length === 0 ? (
                <p className="text-xs text-amber-300">
                  Belum ada kelompok yang Anda tanggungjawabi pada tingkatan ini. Atur di Option Panel.
                </p>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Kelompok
                    </label>
                    <select
                      value={setoranForm.kelompokId}
                      onChange={(e) => {
                        const nextKlp = kelompokInTingkatan.find((k) => k.id === e.target.value);
                        setSetoranForm({
                          ...setoranForm,
                          kelompokId: e.target.value,
                          santriId: nextKlp?.santriIds[0] || '',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                    >
                      {kelompokInTingkatan.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.namaKelompok}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Nama Santri
                    </label>
                    <select
                      value={setoranForm.santriId}
                      onChange={(e) => setSetoranForm({ ...setoranForm, santriId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                    >
                      {setoranFormSantriOptions.length === 0 ? (
                        <option value="">Belum ada santri di kelompok ini</option>
                      ) : (
                        setoranFormSantriOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} ({s.nis})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={setoranForm.tanggal}
                        onChange={(e) => setSetoranForm({ ...setoranForm, tanggal: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Juz
                      </label>
                      <select
                        value={setoranForm.juz}
                        onChange={(e) => setSetoranForm({ ...setoranForm, juz: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                      >
                        {(activeTingkatan?.juzOptions || [activeTingkatan?.targetJuz || 'Juz 30']).map(
                          (j) => (
                            <option key={j} value={j}>
                              {j}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Jenis Setoran
                      </label>
                      <select
                        value={setoranForm.jenisSetoran}
                        onChange={(e) =>
                          setSetoranForm({
                            ...setoranForm,
                            jenisSetoran: e.target.value as JenisSetoranMurotil,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="Ziyadah (Hafalan Baru)">Ziyadah</option>
                        <option value="Murajaah (Mengulang)">Murajaah</option>
                        <option value="Tasmi (Ujian Juz)">Tasmi&apos;</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Predikat
                      </label>
                      <select
                        value={setoranForm.nilai}
                        onChange={(e) =>
                          setSetoranForm({
                            ...setoranForm,
                            nilai: e.target.value as PredikatSetoranMurotil,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-[#10B981] font-bold focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="Mumtaz (A)">Mumtaz (A)</option>
                        <option value="Jayyid Jiddan (B+)">Jayyid Jiddan (B+)</option>
                        <option value="Jayyid (B)">Jayyid (B)</option>
                        <option value="Maqbul / Mengulang (C)">Mengulang (C)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Surah &amp; Ayat
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: QS. An-Naba' (1–40)"
                      value={setoranForm.surahAyat}
                      onChange={(e) => setSetoranForm({ ...setoranForm, surahAyat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Catatan Tajwid / Fashohah
                    </label>
                    <input
                      type="text"
                      placeholder="Opsional..."
                      value={setoranForm.catatan}
                      onChange={(e) => setSetoranForm({ ...setoranForm, catatan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Setoran Hafalan</span>
                  </motion.button>
                </div>
              )}
            </form>

            {/* TABEL RIWAYAT SETORAN */}
            <div className="xl:col-span-8 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 overflow-hidden shadow-xl">
              <div className="px-4 py-3.5 bg-[#041A13]/75 border-b border-emerald-500/20 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                    Riwayat Setoran — {activeTingkatan?.nama}
                  </h3>
                  <p className="text-[11px] text-emerald-100/70">
                    Total {filteredSetoranHistory.length} catatan hafalan tersimpan
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-[#D4AF37] border-b border-emerald-500/20">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Kelompok</th>
                      <th className="py-2.5 px-3">Santri</th>
                      <th className="py-2.5 px-3">Jenis &amp; Juz</th>
                      <th className="py-2.5 px-3">Surah &amp; Ayat</th>
                      <th className="py-2.5 px-3">Nilai</th>
                      <th className="py-2.5 px-3">Penguji</th>
                      <th className="py-2.5 px-3 text-right">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/40">
                    {filteredSetoranHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-emerald-100/65">
                          Belum ada setoran tercatat pada tingkatan &amp; kelompok ini.
                        </td>
                      </tr>
                    ) : (
                      filteredSetoranHistory.map((item) => {
                        const klp = kelompokList.find((k) => k.id === item.kelompokId);
                        return (
                          <tr key={item.id} className="hover:bg-emerald-900/25">
                            <td className="py-2.5 px-3 font-mono text-emerald-100/85 whitespace-nowrap">
                              {item.tanggal}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#D4AF37]">
                              {klp?.kodeKelompok || klp?.namaKelompok || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{item.santriNama}</div>
                              <div className="text-[10px] font-mono text-emerald-200/70">
                                {item.santriNis}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#10B981]">{item.juz}</div>
                              <div className="text-[10px] text-emerald-100/75">{item.jenisSetoran}</div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white">{item.surahAyat}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/35 font-mono font-bold text-[#10B981] text-[11px] whitespace-nowrap">
                                {item.nilai}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-white font-semibold">{item.pengujiNama}</div>
                              {item.catatan && (
                                <div className="text-[11px] text-emerald-100/75">{item.catatan}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => {
                                  persistMurotilUpdate(
                                    {
                                      murotilSetoranList: setoranList.filter((s) => s.id !== item.id),
                                    },
                                    'Catatan setoran dihapus.'
                                  );
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/90 text-rose-200 border border-rose-500/40 cursor-pointer"
                                title="Hapus Setoran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: ABSENSI USTADZ & USTADZAH PENANGGUNG JAWAB KELOMPOK            */}
      {/* ===================================================================== */}
      {activeTab === 'absensi_pj' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Absensi Ustadz &amp; Ustadzah Penanggung Jawab</span>
                </h2>
                <p className="text-[11px] text-emerald-100/75 mt-0.5">
                  Catat kehadiran pengurus atau badal penanggung jawab per kelompok murotil
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={pjTanggal}
                  onChange={(e) => setPjTanggal(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <select
                  value={pjSesi}
                  onChange={(e) => setPjSesi(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#041A13]/90 border border-emerald-500/30 text-xs text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  {murotilConfig.sesiList.map((s) => (
                    <option key={s} value={s}>
                      Sesi: {s}
                    </option>
                  ))}
                </select>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleDownloadAbsensiPjWord}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Word PJ (.doc)</span>
                </motion.button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-emerald-500/25">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-[#D4AF37] border-b border-emerald-500/20">
                  <tr>
                    <th className="py-2.5 px-3 text-center">No</th>
                    <th className="py-2.5 px-3">Ustadz / Ustadzah PJ</th>
                    <th className="py-2.5 px-3">Kelompok &amp; Tingkatan</th>
                    <th className="py-2.5 px-3">Kehadiran ({pjTanggal})</th>
                    <th className="py-2.5 px-3">Badal / Pengganti</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/40">
                  {accessibleKelompok.map((klp, idx) => {
                    const tkt = tingkatanList.find((t) => t.id === klp.tingkatanId);
                    const rec = absensiPjList.find(
                      (a) =>
                        a.tanggal === pjTanggal &&
                        a.sesi === pjSesi &&
                        a.kelompokId === klp.id
                    );
                    const statusNow = rec?.status;

                    return (
                      <tr key={klp.id} className="hover:bg-emerald-900/25">
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-200/80 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{klp.penanggungJawabNama}</div>
                          <div className="text-[10px] font-mono text-emerald-200/75">
                            {rec?.jamHadir ? `Masuk: ${rec.jamHadir}` : klp.jadwalWaktu}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#D4AF37]">{klp.namaKelompok}</div>
                          <div className="text-[10px] text-emerald-100/75">{tkt?.nama}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="inline-flex flex-wrap rounded-xl p-0.5 bg-[#041A13]/90 border border-emerald-500/25 gap-1">
                            {(
                              ['Hadir', 'Izin', 'Sakit', 'Badal / Tugas Luar'] as StatusAbsensiPjMurotil[]
                            ).map((st) => {
                              const selected = statusNow === st;
                              return (
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  key={st}
                                  type="button"
                                  onClick={() => handleSetPjAbsensi(klp, st)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                    selected
                                      ? st === 'Hadir'
                                        ? 'bg-[#10B981] text-[#041A13] shadow'
                                        : 'bg-[#D4AF37] text-[#041A13] shadow'
                                      : 'text-emerald-100/75 hover:text-white hover:bg-emerald-900/40'
                                  }`}
                                >
                                  {st}
                                </motion.button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 min-w-[140px]">
                          <input
                            type="text"
                            placeholder="Nama badal..."
                            value={pjBadalDraft[klp.id] ?? rec?.penggantiBadal ?? ''}
                            onChange={(e) =>
                              setPjBadalDraft((prev) => ({ ...prev, [klp.id]: e.target.value }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#041A13]/90 border border-emerald-500/25 text-[11px] text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </td>
                        <td className="py-2.5 px-3 min-w-[150px]">
                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={pjCatatanDraft[klp.id] ?? rec?.catatan ?? ''}
                            onChange={(e) =>
                              setPjCatatanDraft((prev) => ({ ...prev, [klp.id]: e.target.value }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#041A13]/90 border border-emerald-500/25 text-[11px] text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* REKAPAN ABSENSI USTADZ & USTADZAH PJ */}
          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              Rekapan Kehadiran Ustadz &amp; Ustadzah PJ
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-emerald-500/25">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-[#D4AF37] border-b border-emerald-500/20">
                  <tr>
                    <th className="py-2.5 px-3 text-center">No</th>
                    <th className="py-2.5 px-3">Ustadz / Ustadzah PJ</th>
                    <th className="py-2.5 px-3">Kelompok</th>
                    <th className="py-2.5 px-3 text-center">Hadir</th>
                    <th className="py-2.5 px-3 text-center">Izin</th>
                    <th className="py-2.5 px-3 text-center">Sakit</th>
                    <th className="py-2.5 px-3 text-center">Badal</th>
                    <th className="py-2.5 px-3 text-center">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/40 tabular-nums">
                  {rekapPjRows.map((r, idx) => (
                    <tr key={r.kelompokId} className="hover:bg-emerald-900/25">
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-200/80">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{r.namaPengurus}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[#D4AF37] font-bold">{r.namaKelompok}</span>{' '}
                        <span className="text-[10px] text-emerald-200/75">({r.tingkatanNama})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#10B981]">
                        {r.hadir}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-300">
                        {r.izin}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                        {r.sakit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-300">
                        {r.badal}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/35 font-mono font-bold text-emerald-100">
                          {r.persen}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: OPTION PANEL MUROTILIL QUR'AN (LOGIN PER KELOMPOK & SEMUA FITUR)*/}
      {/* ===================================================================== */}
      {activeTab === 'option_murotil' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#D4AF37]" />
                  <span>Option Panel Murotilil Qur&apos;an</span>
                </h2>
                <p className="text-[11px] text-emerald-100/75 mt-0.5">
                  Kelola akun login pengurus per kelompok, anggota santri, 6 tingkatan hafalan &amp; pengaturan sesi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { id: 'login_pengurus', label: 'Login Pengurus', icon: KeyRound },
                { id: 'kelompok_santri', label: 'Kelompok & Santri', icon: Users },
                { id: 'tingkatan', label: '6 Tingkatan Hafalan', icon: Sparkles },
                { id: 'pengaturan_unit', label: 'Unit, Sesi & Word', icon: Sliders },
              ].map((s) => {
                const Icon = s.icon;
                const active = optionSection === s.id;
                return (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={s.id}
                    type="button"
                    onClick={() => setOptionSection(s.id as any)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                      active
                        ? 'bg-[#D4AF37] text-[#041A13] border-[#f3d266] shadow'
                        : 'bg-[#041A13]/85 text-emerald-100 border-emerald-500/25 hover:border-[#D4AF37]/45 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* SUB-SECTION 1: LOGIN PENGURUS SESUAI KELOMPOK YANG DITANGGUNGJAWABI */}
            {optionSection === 'login_pengurus' && (
              <div className="space-y-4 pt-1">
                <form
                  onSubmit={handleSavePengurusMurotil}
                  className="p-4 rounded-2xl bg-[#041A13]/85 border border-emerald-500/25 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black text-[#D4AF37] uppercase">
                      {editingPengurusId
                        ? 'Edit Akun & Kelompok Tanggung Jawab'
                        : 'Tambah Akun Login Pengurus Murotil'}
                    </h3>
                    {editingPengurusId && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={resetPengurusForm}
                        className="text-xs text-emerald-200 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Batal Edit</span>
                      </motion.button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Nama Ustadz / Ustadzah
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Cth: Ustadz Hafidz Al-Manshur"
                        value={pengurusForm.nama}
                        onChange={(e) => setPengurusForm({ ...pengurusForm, nama: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Jabatan
                      </label>
                      <input
                        type="text"
                        placeholder="Pengurus Murotil Kelompok 1"
                        value={pengurusForm.jabatan}
                        onChange={(e) =>
                          setPengurusForm({ ...pengurusForm, jabatan: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        No. WhatsApp
                      </label>
                      <input
                        type="text"
                        value={pengurusForm.noWa}
                        onChange={(e) => setPengurusForm({ ...pengurusForm, noWa: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Username Login
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="murotil.klp1"
                        value={pengurusForm.username}
                        onChange={(e) =>
                          setPengurusForm({ ...pengurusForm, username: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-[#D4AF37] font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Password Login
                      </label>
                      <input
                        type="text"
                        placeholder="murotil123"
                        value={pengurusForm.password}
                        onChange={(e) =>
                          setPengurusForm({ ...pengurusForm, password: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-amber-200 font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#D4AF37] mb-1">
                          PIN 6 Digit
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={pengurusForm.pin}
                          onChange={(e) =>
                            setPengurusForm({
                              ...pengurusForm,
                              pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-[#D4AF37]/45 text-[#D4AF37] font-mono font-black tracking-widest focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                          Otoritas
                        </label>
                        <select
                          value={pengurusForm.genderAccess}
                          onChange={(e) =>
                            setPengurusForm({
                              ...pengurusForm,
                              genderAccess: e.target.value as 'all' | 'putra' | 'putri',
                            })
                          }
                          className="w-full px-2.5 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none"
                        >
                          <option value="all">Semua</option>
                          <option value="putra">Putra</option>
                          <option value="putri">Putri</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PILIH KELOMPOK YANG DITANGGUNGJAWABI */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono uppercase text-[#D4AF37] font-bold">
                      Kelompok Tanggung Jawab ({pengurusForm.murotilKelompokIds.length} Dipilih):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {kelompokList.map((klp) => {
                        const checked = pengurusForm.murotilKelompokIds.includes(klp.id);
                        const tkt = tingkatanList.find((t) => t.id === klp.tingkatanId);
                        return (
                          <label
                            key={klp.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                              checked
                                ? 'bg-emerald-900/75 border-[#D4AF37] text-white'
                                : 'bg-emerald-950/70 border-emerald-500/20 text-emerald-100/80'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...pengurusForm.murotilKelompokIds, klp.id]
                                  : pengurusForm.murotilKelompokIds.filter((id) => id !== klp.id);
                                setPengurusForm({ ...pengurusForm, murotilKelompokIds: next });
                              }}
                              className="mt-0.5 accent-[#D4AF37]"
                            />
                            <div>
                              <div className="font-bold">{klp.namaKelompok}</div>
                              <div className="text-[10px] text-emerald-200/75">
                                {tkt?.targetJuz} · {klp.santriIds.length} Santri
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {editingPengurusId ? 'Simpan Perubahan Akun' : 'Buat Akun Pengurus'}
                      </span>
                    </motion.button>
                  </div>
                </form>

                {/* TABEL DAFTAR AKUN LOGIN PENGURUS MUROTIL */}
                <div className="overflow-x-auto rounded-2xl border border-emerald-500/25">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-[#D4AF37] border-b border-emerald-500/20">
                      <tr>
                        <th className="py-2.5 px-3.5">Pengurus &amp; Jabatan</th>
                        <th className="py-2.5 px-3.5">PIN 6 Digit</th>
                        <th className="py-2.5 px-3.5">Username &amp; Sandi</th>
                        <th className="py-2.5 px-3.5">Kelompok Tanggung Jawab</th>
                        <th className="py-2.5 px-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/40">
                      {murotilUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-emerald-100/65">
                            Belum ada akun Pengurus Murotil. Tambahkan melalui form di atas.
                          </td>
                        </tr>
                      ) : (
                        murotilUsers.map((u) => {
                          const assigned = kelompokList.filter((k) =>
                            (u.murotilKelompokIds || []).includes(k.id)
                          );
                          return (
                            <tr key={u.id} className="hover:bg-emerald-900/25">
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-white">{u.nama}</div>
                                <div className="text-[11px] text-emerald-100/75">{u.jabatan}</div>
                              </td>
                              <td className="py-3 px-3.5 font-mono font-black text-[#D4AF37]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                                  <Lock className="w-3 h-3" />
                                  {u.pin || '900001'}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 font-mono">
                                <div className="text-[#D4AF37] font-bold">@{u.username}</div>
                                <div className="text-emerald-100/85 text-[11px]">
                                  Sandi: {u.password || 'murotil123'}
                                </div>
                              </td>
                              <td className="py-3 px-3.5">
                                {assigned.length === 0 ? (
                                  <span className="text-amber-300/80 text-[11px]">
                                    Semua / Belum ditentukan
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {assigned.map((klp) => (
                                      <span
                                        key={klp.id}
                                        className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/35 text-emerald-100 text-[10px] font-bold"
                                      >
                                        {klp.namaKelompok}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1">
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  type="button"
                                  onClick={() => {
                                    setEditingPengurusId(u.id);
                                    setPengurusForm({
                                      nama: u.nama,
                                      username: u.username,
                                      password: u.password || '',
                                      pin: u.pin || '900001',
                                      jabatan: u.jabatan,
                                      noWa: u.noWa,
                                      genderAccess: u.genderAccess,
                                      murotilKelompokIds: u.murotilKelompokIds || [],
                                      statusAktif: u.statusAktif,
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  type="button"
                                  onClick={() => {
                                    storageService.deleteUser(u.id);
                                    showToast(`Akun "${u.nama}" dihapus.`);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-950/90 text-rose-200 border border-rose-500/40 cursor-pointer"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
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

            {/* SUB-SECTION 2: KELOMPOK, PJ & ANGGOTA SANTRI */}
            {optionSection === 'kelompok_santri' && (
              <div className="space-y-4 pt-1">
                <form
                  onSubmit={handleSaveKelompok}
                  className="p-4 rounded-2xl bg-[#041A13]/85 border border-emerald-500/25 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black text-[#D4AF37] uppercase">
                      {editingKelompokId ? 'Edit Kelompok & Anggota Santri' : 'Tambah Kelompok Murotil Baru'}
                    </h3>
                    {editingKelompokId && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={resetKelompokForm}
                        className="text-xs text-emerald-200 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Batal Edit</span>
                      </motion.button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Kode Kelompok
                      </label>
                      <input
                        type="text"
                        value={kelompokForm.kodeKelompok}
                        onChange={(e) =>
                          setKelompokForm({ ...kelompokForm, kodeKelompok: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-[#D4AF37] font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Nama Kelompok
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Cth: Kelompok 1 (Putra - Juz 30)"
                        value={kelompokForm.namaKelompok}
                        onChange={(e) =>
                          setKelompokForm({ ...kelompokForm, namaKelompok: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Tingkatan Hafalan (1–6)
                      </label>
                      <select
                        value={kelompokForm.tingkatanId}
                        onChange={(e) =>
                          setKelompokForm({ ...kelompokForm, tingkatanId: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                      >
                        {tingkatanList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nama} ({t.targetJuz})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Akun Pengurus PJ (Opsional)
                      </label>
                      <select
                        value={kelompokForm.penanggungJawabUserId}
                        onChange={(e) => {
                          const u = murotilUsers.find((x) => x.id === e.target.value);
                          setKelompokForm({
                            ...kelompokForm,
                            penanggungJawabUserId: e.target.value,
                            penanggungJawabNama: u ? u.nama : kelompokForm.penanggungJawabNama,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="">-- Pilih Akun Login PJ --</option>
                        {murotilUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nama} (@{u.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Nama Ustadz / Ustadzah PJ
                      </label>
                      <input
                        type="text"
                        placeholder="Nama Ustadz / Ustadzah PJ"
                        value={kelompokForm.penanggungJawabNama}
                        onChange={(e) =>
                          setKelompokForm({
                            ...kelompokForm,
                            penanggungJawabNama: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                        Lokasi Majelis
                      </label>
                      <input
                        type="text"
                        value={kelompokForm.lokasi}
                        onChange={(e) => setKelompokForm({ ...kelompokForm, lokasi: e.target.value })}
                        placeholder="Masjid / Majelis Tahfidz..."
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* PILIH ANGGOTA SANTRI */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono uppercase text-[#D4AF37] font-bold">
                      Anggota Santri Kelompok ({kelompokForm.santriIds.length} Dipilih):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                      {santriList.map((s) => {
                        const checked = kelompokForm.santriIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'bg-emerald-900/75 border-[#D4AF37] text-white'
                                : 'bg-emerald-950/70 border-emerald-500/20 text-emerald-100/80'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...kelompokForm.santriIds, s.id]
                                  : kelompokForm.santriIds.filter((id) => id !== s.id);
                                setKelompokForm({ ...kelompokForm, santriIds: next });
                              }}
                              className="accent-[#D4AF37]"
                            />
                            <div className="min-w-0">
                              <div className="font-bold truncate">{s.nama}</div>
                              <div className="text-[10px] font-mono text-emerald-200/75">
                                {s.nis} · {s.gender}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingKelompokId ? 'Simpan Perubahan Kelompok' : 'Simpan Kelompok'}</span>
                    </motion.button>
                  </div>
                </form>

                {/* DAFTAR KELOMPOK */}
                <div className="overflow-x-auto rounded-2xl border border-emerald-500/25">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#041A13]/90 text-[10px] font-mono uppercase text-[#D4AF37] border-b border-emerald-500/20">
                      <tr>
                        <th className="py-2.5 px-3">Kode &amp; Nama Kelompok</th>
                        <th className="py-2.5 px-3">Tingkatan</th>
                        <th className="py-2.5 px-3">Ustadz/ah PJ</th>
                        <th className="py-2.5 px-3">Santri</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/15 bg-[#041A13]/40">
                      {kelompokList.map((klp) => {
                        const tkt = tingkatanList.find((t) => t.id === klp.tingkatanId);
                        return (
                          <tr key={klp.id} className="hover:bg-emerald-900/25">
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-mono text-[#D4AF37] font-bold">
                                {klp.kodeKelompok}
                              </span>
                              <div className="font-bold text-white">{klp.namaKelompok}</div>
                              <div className="text-[10px] text-emerald-200/75">{klp.lokasi}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#10B981]">{tkt?.nama}</div>
                              <div className="text-[10px] text-emerald-100/75">{tkt?.targetJuz}</div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {klp.penanggungJawabNama}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#D4AF37] tabular-nums">
                              {klp.santriIds.length} Santri
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => {
                                  setEditingKelompokId(klp.id);
                                  setKelompokForm({
                                    kodeKelompok: klp.kodeKelompok,
                                    namaKelompok: klp.namaKelompok,
                                    tingkatanId: klp.tingkatanId,
                                    gender: klp.gender,
                                    penanggungJawabNama: klp.penanggungJawabNama,
                                    penanggungJawabUserId: klp.penanggungJawabUserId || '',
                                    jadwalWaktu: klp.jadwalWaktu,
                                    lokasi: klp.lokasi,
                                    santriIds: klp.santriIds,
                                    statusAktif: klp.statusAktif,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-[11px] font-bold cursor-pointer"
                              >
                                Edit
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => {
                                  persistMurotilUpdate(
                                    {
                                      murotilKelompokList: kelompokList.filter((k) => k.id !== klp.id),
                                    },
                                    `Kelompok "${klp.namaKelompok}" dihapus.`
                                  );
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/90 text-rose-200 border border-rose-500/40 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-SECTION 3: EDIT 6 TINGKATAN HAFALAN */}
            {optionSection === 'tingkatan' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tingkatanDraft.map((tkt, idx) => (
                    <div
                      key={tkt.id}
                      className="p-4 rounded-2xl bg-[#041A13]/85 border border-emerald-500/25 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/45 text-[10px] font-mono font-bold text-[#D4AF37]">
                          Tingkatan {tkt.urutan}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-emerald-200/80 mb-1">
                          Nama Tingkatan
                        </label>
                        <input
                          type="text"
                          value={tkt.nama}
                          onChange={(e) => {
                            const next = [...tingkatanDraft];
                            next[idx] = { ...tkt, nama: e.target.value };
                            setTingkatanDraft(next);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white font-bold focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono text-emerald-200/80 mb-1">
                            Target Juz
                          </label>
                          <input
                            type="text"
                            value={tkt.targetJuz}
                            onChange={(e) => {
                              const next = [...tingkatanDraft];
                              next[idx] = { ...tkt, targetJuz: e.target.value };
                              setTingkatanDraft(next);
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-emerald-200/80 mb-1">
                            Pilihan Juz
                          </label>
                          <input
                            type="text"
                            value={tkt.juzOptions.join(', ')}
                            onChange={(e) => {
                              const next = [...tingkatanDraft];
                              next[idx] = {
                                ...tkt,
                                juzOptions: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              };
                              setTingkatanDraft(next);
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-emerald-200/80 mb-1">
                          Deskripsi
                        </label>
                        <input
                          type="text"
                          value={tkt.deskripsi}
                          onChange={(e) => {
                            const next = [...tingkatanDraft];
                            next[idx] = { ...tkt, deskripsi: e.target.value };
                            setTingkatanDraft(next);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-emerald-100 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() =>
                      persistMurotilUpdate(
                        { murotilTingkatanList: tingkatanDraft },
                        'Konfigurasi 6 Tingkatan Hafalan berhasil disimpan!'
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan 6 Tingkatan</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* SUB-SECTION 4: PENGATURAN UNIT, SESI & LAPORAN WORD */}
            {optionSection === 'pengaturan_unit' && (
              <div className="p-4 rounded-2xl bg-[#041A13]/85 border border-emerald-500/25 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Nama Unit Murotil &amp; Tahfidz
                    </label>
                    <input
                      type="text"
                      value={unitConfigDraft.namaUnit}
                      onChange={(e) =>
                        setUnitConfigDraft({ ...unitConfigDraft, namaUnit: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Nama Koordinator (TTD Laporan Word)
                    </label>
                    <input
                      type="text"
                      value={unitConfigDraft.koordinatorNama}
                      onChange={(e) =>
                        setUnitConfigDraft({ ...unitConfigDraft, koordinatorNama: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Jabatan Penandatangan Laporan
                    </label>
                    <input
                      type="text"
                      value={unitConfigDraft.koordinatorJabatan}
                      onChange={(e) =>
                        setUnitConfigDraft({
                          ...unitConfigDraft,
                          koordinatorJabatan: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Daftar Sesi Waktu (Pisahkan dengan koma)
                    </label>
                    <input
                      type="text"
                      value={sesiInputStr}
                      onChange={(e) => setSesiInputStr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-[#D4AF37] font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-emerald-200/80 mb-1">
                      Catatan Kaki Laporan Word
                    </label>
                    <input
                      type="text"
                      value={unitConfigDraft.catatanLaporanWord}
                      onChange={(e) =>
                        setUnitConfigDraft({
                          ...unitConfigDraft,
                          catatanLaporanWord: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/30 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/75 border border-emerald-500/25 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unitConfigDraft.allowPengurusLihatSemuaKelompok}
                    onChange={(e) =>
                      setUnitConfigDraft({
                        ...unitConfigDraft,
                        allowPengurusLihatSemuaKelompok: e.target.checked,
                      })
                    }
                    className="accent-[#D4AF37]"
                  />
                  <span className="text-emerald-100">
                    Izinkan Pengurus Murotil melihat data kelompok lain selain kelompok tanggung jawabnya
                  </span>
                </label>

                <div className="flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      const nextSesi = sesiInputStr
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      persistMurotilUpdate(
                        {
                          murotilConfig: {
                            ...unitConfigDraft,
                            sesiList:
                              nextSesi.length > 0 ? nextSesi : INITIAL_MUROTIL_CONFIG.sesiList,
                          },
                        },
                        'Pengaturan unit Murotilil Qur\'an berhasil disimpan!'
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Unit</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
