import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Send,
  ArrowDownUp,
  ShoppingCart,
  Inbox,
  Printer,
  FileSignature,
  Building2,
  Trash2,
  Download,
  Sliders,
  Edit3,
  Save,
  X,
  Search,
  History,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  QrCode,
  Phone,
  Clock,
  Check,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  BarangInventaris,
  PeminjamanBarang,
  PengajuanDivisi,
  UserAccount,
  SystemConfig,
  Santri,
  MutasiBarang,
  PesanKoordinasi,
  ArsipSurat,
  DataFasilitasGedung,
  FasilitasItemGedung,
  PerlengkapanConfig,
  EvaluasiKepengurusan,
  BarangPeminjamanItem,
  PeminjamanPerlengkapan,
  PengaturanSuratPerlengkapan,
  StatusPeminjamanPerlengkapan,
} from '../types';
import { storageService } from '../services/storageService';
import {
  DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN,
  createPeminjamanPerlengkapan,
  deletePeminjamanPerlengkapan,
  formatWaktuIndonesiaNow,
  subscribePeminjamanPerlengkapan,
  subscribePengaturanSuratPerlengkapan,
  updateStatusPeminjamanPerlengkapan,
} from '../services/peminjamanPerlengkapanService';
import { openPrintWindow } from '../utils/printDocument';
import { downloadWordDocument } from '../utils/wordExport';
import { DivisiKotakMasuk } from './DivisiKotakMasuk';
import { PieChart3D } from './Charts3D';
import { computeRealtimePondokAnalytics } from '../utils/realtimeAnalytics';
import { INITIAL_PERLENGKAPAN_CONFIG } from '../data/seedData';
import { SuratPeminjamanPerlengkapanModal } from './SuratPeminjamanPerlengkapanModal';
import { ScanQRPengembalianModal } from './ScanQRPengembalianModal';
import { OptionPanelSuratPerlengkapanModal } from './OptionPanelSuratPerlengkapanModal';

export type PerlengkapanSubTab =
  | 'kotak_masuk'
  | 'inventaris'
  | 'barang_masuk_keluar'
  | 'peminjaman'
  | 'pengajuan_pembelian'
  | 'kamar_santri'
  | 'data_fasilitas'
  | 'rusak_perbaikan'
  | 'option_perlengkapan';

interface PerlengkapanPanelProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  santriList?: Santri[];
  barangInventaris: BarangInventaris[];
  peminjamanBarang: PeminjamanBarang[];
  pengajuanDivisi: PengajuanDivisi[];
  koordinasiList?: PesanKoordinasi[];
  evaluasiKepengurusan?: EvaluasiKepengurusan[];
  initialSubTab?: PerlengkapanSubTab;
}

function normalizePerlengkapanSubTab(tab?: PerlengkapanSubTab): PerlengkapanSubTab {
  if (!tab) return 'inventaris';
  if (tab === 'data_fasilitas') return 'kamar_santri';
  if (tab === 'peminjaman') return 'barang_masuk_keluar';
  return tab;
}

export const PerlengkapanPanel: React.FC<PerlengkapanPanelProps> = ({
  currentUser,
  systemConfig,
  santriList = [],
  barangInventaris,
  peminjamanBarang,
  pengajuanDivisi,
  koordinasiList = [],
  evaluasiKepengurusan = [],
  initialSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<PerlengkapanSubTab>(() =>
    normalizePerlengkapanSubTab(initialSubTab)
  );

  const perlengkapanKpi = useMemo(() => {
    return computeRealtimePondokAnalytics({
      santriList,
      perizinanList: [],
      pelanggaranList: [],
      transaksiKeuangan: [],
      arsipSurat: [],
      barangInventaris,
      peminjamanBarang,
      agendaPengurus: [],
      evaluasiKepengurusan,
      pengajuanDivisi,
      koordinasiList,
      systemConfig,
    }).divisions.perlengkapan;
  }, [
    santriList,
    barangInventaris,
    peminjamanBarang,
    evaluasiKepengurusan,
    pengajuanDivisi,
    koordinasiList,
    systemConfig,
  ]);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(normalizePerlengkapanSubTab(initialSubTab));
    }
  }, [initialSubTab]);

  const [toastMsg, setToastMsg] = useState('');
  const notifyToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Form Inventaris Baru
  const [formBarang, setFormBarang] = useState<Partial<BarangInventaris>>({
    kodeBarang: `INV-MLK-${String(barangInventaris.length + 1).padStart(3, '0')}`,
    namaBarang: '',
    kategori: 'Elektronik',
    jumlah: 10,
    stokMinimal: 3,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasi: 'Gudang Perlengkapan',
    penanggungJawab: currentUser.nama,
    tanggalPerolehan: new Date().toISOString().split('T')[0],
    nilaiPerolehan: 1000000,
    catatan: '',
  });

  // Form Barang Masuk (Bagian Atas)
  const [masukForm, setMasukForm] = useState({
    barangId: barangInventaris[0]?.id || '',
    jumlah: 1,
    tanggal: new Date().toISOString().split('T')[0],
    petugas: currentUser.nama,
    keterangan: '',
  });
  const [filterMasukBulan, setFilterMasukBulan] = useState('ALL');
  const [searchMasuk, setSearchMasuk] = useState('');

  const effectiveMasukBarangId = useMemo(() => {
    if (masukForm.barangId && barangInventaris.some((b) => b.id === masukForm.barangId)) {
      return masukForm.barangId;
    }
    return barangInventaris[0]?.id || '';
  }, [masukForm.barangId, barangInventaris]);

  // Form Barang Keluar / Dipinjam (Bagian Bawah)
  const [keluarInputMode, setKeluarInputMode] = useState<
    'keluar' | 'pinjam_internal' | 'ajukan_sekretaris'
  >('keluar');
  const [keluarForm, setKeluarForm] = useState({
    barangId: barangInventaris[0]?.id || '',
    jumlah: 1,
    tanggal: new Date().toISOString().split('T')[0],
    petugas: currentUser.nama,
    keterangan: '',
  });
  const [filterKeluarBulan, setFilterKeluarBulan] = useState('ALL');
  const [searchKeluar, setSearchKeluar] = useState('');
  const [searchPinjam, setSearchPinjam] = useState('');
  const [filterPinjamStatus, setFilterPinjamStatus] = useState<
    'ALL' | 'Dipinjam' | 'Dikembalikan' | 'Terlambat'
  >('ALL');

  const effectiveKeluarBarangId = useMemo(() => {
    if (keluarForm.barangId && barangInventaris.some((b) => b.id === keluarForm.barangId)) {
      return keluarForm.barangId;
    }
    return barangInventaris[0]?.id || '';
  }, [keluarForm.barangId, barangInventaris]);

  // Form Peminjaman Barang Internal
  const [pinjamForm, setPinjamForm] = useState<Partial<PeminjamanBarang>>({
    barangId: barangInventaris[0]?.id || '',
    jumlahPinjam: 1,
    peminjamNama: '',
    peminjamBagian: 'Pendidikan & Taklim',
    noWaPeminjam: '0812',
    tanggalPinjam: new Date().toISOString().split('T')[0],
    batasKembali: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    keperluan: '',
  });

  const effectivePinjamBarangId = useMemo(() => {
    if (pinjamForm.barangId && barangInventaris.some((b) => b.id === pinjamForm.barangId)) {
      return pinjamForm.barangId;
    }
    return barangInventaris[0]?.id || '';
  }, [pinjamForm.barangId, barangInventaris]);

  // Form Pengajuan Peminjaman Barang (Kirim Otomatis ke Sekretaris untuk Cetak Surat)
  const [pengajuanPinjamForm, setPengajuanPinjamForm] = useState({
    namaBarang: '',
    pinjamKe: '',
    mulai: new Date().toISOString().split('T')[0],
    batasAkhir: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    jumlah: 1,
    keperluan: '',
  });

  // ========================================================
  // SISTEM PEMINJAMAN BARANG PERLENGKAPAN (REAL-TIME FIREBASE)
  // Verifikasi Ketua Pondok + QR Code Pengembalian + Option Panel Format Surat
  // ========================================================
  const [peminjamanCloudList, setPeminjamanCloudList] = useState<PeminjamanPerlengkapan[]>([]);
  const [pengaturanSuratPerlengkapan, setPengaturanSuratPerlengkapan] =
    useState<PengaturanSuratPerlengkapan>(DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN);
  const [isLoadingCloudPeminjaman, setIsLoadingCloudPeminjaman] = useState(true);
  const [isSubmittingPeminjamanCloud, setIsSubmittingPeminjamanCloud] = useState(false);
  const [processingVerifikasiId, setProcessingVerifikasiId] = useState<string | null>(null);
  const [confirmDeleteCloudId, setConfirmDeleteCloudId] = useState<string | null>(null);
  const [cloudSearchQuery, setCloudSearchQuery] = useState('');
  const [cloudStatusFilter, setCloudStatusFilter] = useState<
    'ALL' | StatusPeminjamanPerlengkapan
  >('ALL');
  const [catatanVerifikasiMap, setCatatanVerifikasiMap] = useState<Record<string, string>>({});

  const [isScanQRModalOpen, setIsScanQRModalOpen] = useState(false);
  const [isOptionSuratModalOpen, setIsOptionSuratModalOpen] = useState(false);
  const [selectedSuratPeminjaman, setSelectedSuratPeminjaman] =
    useState<PeminjamanPerlengkapan | null>(null);

  const createEmptyRincianRow = (): BarangPeminjamanItem => ({
    id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    namaBarang: '',
    jumlah: 1,
    satuan: 'Unit',
    kondisiAwal: 'Baik / Normal',
  });

  const [cloudPinjamForm, setCloudPinjamForm] = useState({
    namaPeminjam: '',
    statusDivisiKamar: '',
    nomorHp: '',
    tanggalPinjam: new Date().toISOString().split('T')[0],
    estimasiTanggalKembali: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    keperluan: '',
  });
  const [rincianBarangRows, setRincianBarangRows] = useState<BarangPeminjamanItem[]>([
    {
      id: 'row_init_1',
      namaBarang: '',
      jumlah: 1,
      satuan: 'Unit',
      kondisiAwal: 'Baik / Normal',
    },
  ]);

  useEffect(() => {
    const unsubPinjam = subscribePeminjamanPerlengkapan(
      (items) => {
        setPeminjamanCloudList(items);
        setIsLoadingCloudPeminjaman(false);
      },
      (errMsg) => {
        setIsLoadingCloudPeminjaman(false);
        notifyToast(`Gagal memuat data peminjaman real-time: ${errMsg}`);
      }
    );
    const unsubSuratCfg = subscribePengaturanSuratPerlengkapan(
      (cfg) => {
        setPengaturanSuratPerlengkapan(cfg);
      },
      () => {}
    );
    return () => {
      unsubPinjam();
      unsubSuratCfg();
    };
  }, []);

  // Konfigurasi Perlengkapan & Data Fasilitas Per Gedung
  const perlengkapanCfg: PerlengkapanConfig = useMemo(
    () => ({
      ...INITIAL_PERLENGKAPAN_CONFIG,
      ...(systemConfig.perlengkapanConfig || {}),
      kategoriInventaris:
        systemConfig.perlengkapanConfig?.kategoriInventaris?.length
          ? systemConfig.perlengkapanConfig.kategoriInventaris
          : INITIAL_PERLENGKAPAN_CONFIG.kategoriInventaris,
      satuanList:
        systemConfig.perlengkapanConfig?.satuanList?.length
          ? systemConfig.perlengkapanConfig.satuanList
          : INITIAL_PERLENGKAPAN_CONFIG.satuanList,
    }),
    [systemConfig.perlengkapanConfig]
  );

  const fasilitasGedungList: DataFasilitasGedung[] = useMemo(
    () =>
      Array.isArray(systemConfig.fasilitasGedungList)
        ? systemConfig.fasilitasGedungList
        : [],
    [systemConfig.fasilitasGedungList]
  );

  // State Tambah Fasilitas per Gedung
  const [newFasilitasMap, setNewFasilitasMap] = useState<
    Record<
      string,
      {
        namaFasilitas: string;
        jumlah: number;
        satuan: string;
        kondisi: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
        keterangan: string;
      }
    >
  >({});

  // Draft editing inline pada Data Fasilitas & Gedung
  const [editingGedungId, setEditingGedungId] = useState<string | null>(null);
  const [editingGedungNama, setEditingGedungNama] = useState('');
  const [filterGedungId, setFilterGedungId] = useState<string>('ALL');
  const [fasilitasDraftMap, setFasilitasDraftMap] = useState<
    Record<string, Partial<FasilitasItemGedung>>
  >({});

  // State Option Panel Perlengkapan
  const [optionSection, setOptionSection] = useState<
    | 'gedung_fasilitas'
    | 'pengaturan_umum'
    | 'edit_inventaris'
    | 'edit_mutasi'
    | 'edit_peminjaman_pengajuan'
  >('gedung_fasilitas');

  const [newGedungForm, setNewGedungForm] = useState({
    namaGedung: '',
    kategoriGedung: 'Asrama / Gedung',
    penanggungJawab: currentUser.nama,
    isiTemplateContoh: true,
  });

  const [optGedungDrafts, setOptGedungDrafts] = useState<
    Record<string, { namaGedung: string; kategoriGedung: string; penanggungJawab: string }>
  >({});

  const [cfgForm, setCfgForm] = useState({
    namaUnitPerlengkapan: perlengkapanCfg.namaUnitPerlengkapan || '',
    kepalaPerlengkapan: perlengkapanCfg.kepalaPerlengkapan || '',
    jabatanKepala: perlengkapanCfg.jabatanKepala || '',
    kategoriText: (perlengkapanCfg.kategoriInventaris || []).join(', '),
    satuanText: (perlengkapanCfg.satuanList || []).join(', '),
  });

  useEffect(() => {
    setCfgForm({
      namaUnitPerlengkapan: perlengkapanCfg.namaUnitPerlengkapan || '',
      kepalaPerlengkapan: perlengkapanCfg.kepalaPerlengkapan || '',
      jabatanKepala: perlengkapanCfg.jabatanKepala || '',
      kategoriText: (perlengkapanCfg.kategoriInventaris || []).join(', '),
      satuanText: (perlengkapanCfg.satuanList || []).join(', '),
    });
  }, [perlengkapanCfg]);

  // Draft maps untuk edit semua fitur di Option Panel Perlengkapan
  const [optInvDrafts, setOptInvDrafts] = useState<Record<string, Partial<BarangInventaris>>>({});
  const [optMutasiDrafts, setOptMutasiDrafts] = useState<Record<string, Partial<MutasiBarang>>>({});
  const [optPinjamDrafts, setOptPinjamDrafts] = useState<Record<string, Partial<PeminjamanBarang>>>({});
  const [optPengajuanDrafts, setOptPengajuanDrafts] = useState<Record<string, Partial<PengajuanDivisi>>>({});

  // Form Pengajuan Pembelian Barang (Terhubung Ketua Pondok & Bendahara)
  const [pengadaanForm, setPengadaanForm] = useState({
    judul: '',
    deskripsi: '',
    nominalEstimasi: 2500000,
  });

  // Deteksi Barang Hampir Habis (jumlah <= stokMinimal)
  const stokKritisList = useMemo(() => {
    return barangInventaris.filter((b) => b.jumlah <= (b.stokMinimal ?? 3));
  }, [barangInventaris]);

  // Handlers

  const handleSimpanInventaris = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBarang.namaBarang) return;
    const item: BarangInventaris = {
      id: `inv_${Date.now()}`,
      kodeBarang: formBarang.kodeBarang || `INV-${Date.now().toString().slice(-4)}`,
      namaBarang: formBarang.namaBarang,
      kategori: (formBarang.kategori as any) || 'Elektronik',
      jumlah: Number(formBarang.jumlah) || 1,
      stokMinimal: Number(formBarang.stokMinimal) || 2,
      satuan: formBarang.satuan || 'Unit',
      kondisi: (formBarang.kondisi as any) || 'Baik',
      lokasi: formBarang.lokasi || 'Gudang Pusat',
      penanggungJawab: formBarang.penanggungJawab || currentUser.nama,
      tanggalPerolehan: formBarang.tanggalPerolehan || new Date().toISOString().split('T')[0],
      nilaiPerolehan: Number(formBarang.nilaiPerolehan) || 0,
      catatan: formBarang.catatan || '',
    };
    storageService.saveBarangInventaris(item);
    setToastMsg(`Barang inventaris "${item.namaBarang}" berhasil disimpan!`);
    setTimeout(() => setToastMsg(''), 4000);
    setFormBarang({ ...formBarang, namaBarang: '', catatan: '' });
  };

  const handleSimpanBarangMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    const target = barangInventaris.find((b) => b.id === effectiveMasukBarangId);
    const qty = Math.max(0, Number(masukForm.jumlah) || 0);
    if (!target) {
      notifyToast('Pilih barang inventaris terlebih dahulu sebelum mencatat barang masuk.');
      return;
    }
    if (qty <= 0) {
      notifyToast('Jumlah barang masuk harus lebih dari 0.');
      return;
    }

    const petugasNama = masukForm.petugas.trim() || currentUser.nama;
    const keteranganText =
      masukForm.keterangan.trim() || 'Penambahan stok masuk Gudang Perlengkapan';

    const mutasi: MutasiBarang = {
      id: `mut_${Date.now()}`,
      barangId: target.id,
      namaBarang: target.namaBarang,
      tanggal: masukForm.tanggal || new Date().toISOString().split('T')[0],
      tipe: 'Masuk',
      jumlah: qty,
      satuan: target.satuan,
      keterangan: keteranganText,
      petugas: petugasNama,
    };

    storageService.updateSystemConfig({
      mutasiBarangList: [mutasi, ...(systemConfig.mutasiBarangList || [])],
    });

    const newQty = target.jumlah + qty;
    storageService.saveBarangInventaris({ ...target, jumlah: newQty });

    notifyToast(
      `Barang Masuk (+${mutasi.jumlah} ${target.satuan} ${target.namaBarang}) tercatat! Stok: ${target.jumlah} -> ${newQty} ${target.satuan}.`
    );
    setMasukForm((prev) => ({
      ...prev,
      barangId: target.id,
      jumlah: 1,
      keterangan: '',
    }));
  };

  const handleSimpanBarangKeluar = (e: React.FormEvent) => {
    e.preventDefault();
    const target = barangInventaris.find((b) => b.id === effectiveKeluarBarangId);
    const qty = Math.max(0, Number(keluarForm.jumlah) || 0);
    if (!target) {
      notifyToast('Pilih barang inventaris terlebih dahulu sebelum mencatat barang keluar.');
      return;
    }
    if (qty <= 0) {
      notifyToast('Jumlah barang keluar harus lebih dari 0.');
      return;
    }
    if (qty > target.jumlah) {
      notifyToast(
        `Stok "${target.namaBarang}" tidak mencukupi (tersisa ${target.jumlah} ${target.satuan}).`
      );
      return;
    }

    const petugasNama = keluarForm.petugas.trim() || currentUser.nama;
    const keteranganText =
      keluarForm.keterangan.trim() || 'Pengeluaran barang dari Gudang Perlengkapan';

    const mutasi: MutasiBarang = {
      id: `mut_${Date.now()}`,
      barangId: target.id,
      namaBarang: target.namaBarang,
      tanggal: keluarForm.tanggal || new Date().toISOString().split('T')[0],
      tipe: 'Keluar',
      jumlah: qty,
      satuan: target.satuan,
      keterangan: keteranganText,
      petugas: petugasNama,
    };

    storageService.updateSystemConfig({
      mutasiBarangList: [mutasi, ...(systemConfig.mutasiBarangList || [])],
    });

    const newQty = Math.max(0, target.jumlah - qty);
    storageService.saveBarangInventaris({ ...target, jumlah: newQty });

    notifyToast(
      `Barang Keluar (-${mutasi.jumlah} ${target.satuan} ${target.namaBarang}) tercatat! Stok: ${target.jumlah} -> ${newQty} ${target.satuan}.`
    );
    setKeluarForm((prev) => ({
      ...prev,
      barangId: target.id,
      jumlah: 1,
      keterangan: '',
    }));
  };

  const handleSimpanPeminjaman = (e: React.FormEvent) => {
    e.preventDefault();
    const target = barangInventaris.find((b) => b.id === effectivePinjamBarangId);
    if (!target || !pinjamForm.peminjamNama) return;
    const item: PeminjamanBarang = {
      id: `pjm_${Date.now()}`,
      kodePeminjaman: `PJM-${Date.now().toString().slice(-5)}`,
      barangId: target.id,
      namaBarang: target.namaBarang,
      jumlahPinjam: Number(pinjamForm.jumlahPinjam) || 1,
      peminjamNama: pinjamForm.peminjamNama,
      peminjamBagian: pinjamForm.peminjamBagian || 'Pengurus',
      noWaPeminjam: pinjamForm.noWaPeminjam || '0812',
      tanggalPinjam: pinjamForm.tanggalPinjam || new Date().toISOString().split('T')[0],
      batasKembali: pinjamForm.batasKembali || new Date().toISOString().split('T')[0],
      status: 'Dipinjam',
      petugasNama: currentUser.nama,
      keperluan: pinjamForm.keperluan || '-',
    };
    storageService.savePeminjamanBarang(item);
    notifyToast(`Peminjaman "${target.namaBarang}" oleh ${item.peminjamNama} berhasil dicatat!`);
    setPinjamForm({ ...pinjamForm, barangId: target.id, peminjamNama: '', keperluan: '' });
  };

  // PENGAJUAN PEMINJAMAN BARANG -> OTOMATIS MASUK KE NOTIFIKASI & DAFTAR PERMINTAAN SURAT SEKRETARIS
  const handleAjukanPeminjamanKeSekretaris = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengajuanPinjamForm.namaBarang || !pengajuanPinjamForm.pinjamKe) return;

    const kodePjm = `PJM-EXT-${Date.now().toString().slice(-5)}`;
    const newPinjam: PeminjamanBarang = {
      id: `pjm_req_${Date.now()}`,
      kodePeminjaman: kodePjm,
      barangId: 'external_req',
      namaBarang: pengajuanPinjamForm.namaBarang,
      jumlahPinjam: Number(pengajuanPinjamForm.jumlah) || 1,
      peminjamNama: `${currentUser.nama} (Pinjam ke: ${pengajuanPinjamForm.pinjamKe})`,
      peminjamBagian: 'Divisi Perlengkapan Pondok',
      noWaPeminjam: currentUser.noWa || '081288990011',
      tanggalPinjam: pengajuanPinjamForm.mulai,
      batasKembali: pengajuanPinjamForm.batasAkhir,
      status: 'Dipinjam',
      petugasNama: currentUser.nama,
      keperluan: `Pinjam ke ${pengajuanPinjamForm.pinjamKe} — ${pengajuanPinjamForm.keperluan || 'Operasional Pondok'}`,
    };
    storageService.savePeminjamanBarang(newPinjam);

    // 1. Buat draf Surat Peminjaman (SPp) otomatis di Arsip Surat Sekretaris agar langsung siap dicetak
    const nomorSurat = `${String(Date.now()).slice(-3)}/SPp/SEK-MLK/${new Date().getFullYear()}`;
    const draftSurat: ArsipSurat = {
      id: `srt_pjm_${Date.now()}`,
      arah: 'Keluar',
      nomorSurat,
      kodeJenis: 'SPp',
      namaJenis: 'Surat Peminjaman Barang / Fasilitas',
      tanggalSurat: new Date().toISOString().split('T')[0],
      lampiran: '-',
      perihal: `Permohonan Peminjaman ${pengajuanPinjamForm.namaBarang} (${pengajuanPinjamForm.jumlah} Unit)`,
      tujuanAtauPengirim: pengajuanPinjamForm.pinjamKe,
      isiSurat: `Sehubungan dengan kegiatan operasional Pondok Pesantren Salaf Al-Maliki, bersama surat ini Divisi Perlengkapan mengajukan permohonan peminjaman barang berupa: ${pengajuanPinjamForm.namaBarang} (${pengajuanPinjamForm.jumlah} Unit) kepada ${pengajuanPinjamForm.pinjamKe}, terhitung mulai tanggal ${pengajuanPinjamForm.mulai} sampai dengan batas akhir pengembalian tanggal ${pengajuanPinjamForm.batasAkhir}. Keperluan: ${pengajuanPinjamForm.keperluan || 'Kegiatan Pesantren'}.`,
      namaPenandatangan: systemConfig.sekretarisNama || 'Ust. Ahmad Fauzi, M.Pd.',
      jabatanPenandatangan: 'Sekretaris Pondok Pesantren Salaf Al-Maliki',
      dibuatOleh: currentUser.nama,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Resmi / Terbit',
    };
    storageService.saveArsipSurat(draftSurat);

    // 2. Kirim ke Kotak Masuk & Pesan (Koordinasi) Sekretaris Pondok
    storageService.saveKoordinasi({
      id: `krd_pjm_${Date.now()}`,
      nomorTiket: `PJM-SRT-${Math.floor(100 + Math.random() * 900)}`,
      waktu: new Date().toLocaleString('id-ID'),
      tanggal: new Date().toLocaleString('id-ID'),
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: 'Kepala Divisi Perlengkapan',
      tujuan: 'Sekretaris Pondok',
      kategori: 'Kendala & Kebutuhan',
      prioritas: 'Penting',
      judul: `[PERMINTAAN CETAK SURAT PEMINJAMAN] ${pengajuanPinjamForm.namaBarang} ke ${pengajuanPinjamForm.pinjamKe}`,
      isi: `Mohon diterbitkan & dicetak Surat Peminjaman Barang Resmi.\n• Nama Barang: ${pengajuanPinjamForm.namaBarang} (${pengajuanPinjamForm.jumlah} Unit)\n• Pinjam Ke: ${pengajuanPinjamForm.pinjamKe}\n• Tanggal Mulai: ${pengajuanPinjamForm.mulai}\n• Batas Akhir: ${pengajuanPinjamForm.batasAkhir}\n• Keperluan: ${pengajuanPinjamForm.keperluan || 'Operasional Pondok'}\n• Nomor Surat Otomatis: ${nomorSurat}`,
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    });

    // 3. Tambahkan Notifikasi Real-time untuk Dashboard Sekretaris
    storageService.addNotification({
      judul: `Pengajuan Surat Peminjaman: ${pengajuanPinjamForm.namaBarang}`,
      pesan: `Divisi Perlengkapan (${currentUser.nama}) mengajukan surat peminjaman "${pengajuanPinjamForm.namaBarang}" ke ${pengajuanPinjamForm.pinjamKe} (${pengajuanPinjamForm.mulai} s/d ${pengajuanPinjamForm.batasAkhir}). Siap dicetak di Dashboard Sekretaris!`,
      tipe: 'info',
      linkMenu: 'sekretaris',
    });

    setToastMsg(
      `Pengajuan peminjaman "${pengajuanPinjamForm.namaBarang}" ke "${pengajuanPinjamForm.pinjamKe}" berhasil dikirim ke Notifikasi & Daftar Permintaan Surat Sekretaris!`
    );
    setTimeout(() => setToastMsg(''), 5000);
    setPengajuanPinjamForm({
      ...pengajuanPinjamForm,
      namaBarang: '',
      pinjamKe: '',
      keperluan: '',
    });
  };

  // CETAK SURAT PEMINJAMAN BARANG LANGSUNG (A4)
  const handleCetakSuratPeminjaman = (p: PeminjamanBarang) => {
    const html = `
      <div style="font-family: 'Times New Roman', Georgia, serif; padding: 28px; color: #000; max-width: 780px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 4px double #000; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 18pt; font-weight: 900; text-transform: uppercase;">${systemConfig.kopSuratBaris1 || 'PONDOK PESANTREN SALAF AL-MALIKI'}</h1>
          <h2 style="margin: 4px 0; font-size: 13pt; font-weight: 700; text-transform: uppercase;">${perlengkapanCfg.namaUnitPerlengkapan || 'DIVISI PERLENGKAPAN, INVENTARIS & SARANA PRASARANA'}</h2>
          <p style="margin: 0; font-size: 10pt;">${systemConfig.alamatKopSurat || 'Jl. Pesantren Luhur No. 99, Karawang'}</p>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 14pt; text-decoration: underline; font-weight: bold;">SURAT BUKTI & PERMOHONAN PEMINJAMAN BARANG</h3>
          <p style="margin: 4px 0; font-size: 10.5pt;">Nomor Kode Peminjaman: <strong>${p.kodePeminjaman}</strong></p>
        </div>

        <p style="font-size: 11pt; line-height: 1.6;">
          Yang bertanda tangan di bawah ini, Pengurus Divisi Perlengkapan Pondok Pesantren Salaf Al-Maliki menerangkan rincian peminjaman barang/inventaris sebagai berikut:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt;">
          <tr>
            <td style="padding: 8px; border: 1px solid #000; width: 35%; font-weight: bold;">Nama Barang / Inventaris</td>
            <td style="padding: 8px; border: 1px solid #000;"><strong>${p.namaBarang}</strong> (${p.jumlahPinjam} Unit)</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Peminjam / Tujuan Pinjam</td>
            <td style="padding: 8px; border: 1px solid #000;">${p.peminjamNama} (${p.peminjamBagian})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Tanggal Mulai Pinjam</td>
            <td style="padding: 8px; border: 1px solid #000;">${p.tanggalPinjam}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Batas Akhir Pengembalian</td>
            <td style="padding: 8px; border: 1px solid #000;">${p.batasKembali}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Status Peminjaman</td>
            <td style="padding: 8px; border: 1px solid #000;">${p.status}${p.tanggalAktualKembali ? ` (Dikembalikan: ${p.tanggalAktualKembali})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">Keperluan</td>
            <td style="padding: 8px; border: 1px solid #000;">${p.keperluan}</td>
          </tr>
        </table>

        <p style="font-size: 11pt; line-height: 1.6;">
          Demikian surat bukti peminjaman barang ini diterbitkan agar dipergunakan sebagaimana mestinya dan wajib dijaga keutuhan serta dikembalikan tepat pada waktunya.
        </p>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11pt;">
          <div style="text-align: center; width: 220px;">
            <p>Peminjam / Penerima,</p>
            <div style="height: 65px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">${p.peminjamNama}</p>
          </div>
          <div style="text-align: center; width: 240px;">
            <p>${systemConfig.kotaInstansi || 'Karawang'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="font-weight: bold;">${perlengkapanCfg.jabatanKepala || 'Kepala Divisi Perlengkapan'},</p>
            <div style="height: 55px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">${perlengkapanCfg.kepalaPerlengkapan || currentUser.nama}</p>
          </div>
        </div>
      </div>
    `;
    openPrintWindow(`Surat_Peminjaman_${p.kodePeminjaman}`, html);
  };

  const handleKembalikanPinjaman = (pjm: PeminjamanBarang) => {
    storageService.savePeminjamanBarang({
      ...pjm,
      status: 'Dikembalikan',
      tanggalAktualKembali: new Date().toISOString().split('T')[0],
    });
    setToastMsg(`Barang "${pjm.namaBarang}" telah dikembalikan oleh ${pjm.peminjamNama}!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // ========================================================
  // HANDLERS PEMINJAMAN BARANG PERLENGKAPAN (FIREBASE REAL-TIME)
  // ========================================================
  const handleAddRincianBarangRow = () => {
    setRincianBarangRows((prev) => [...prev, createEmptyRincianRow()]);
  };

  const handleRemoveRincianBarangRow = (rowId: string) => {
    setRincianBarangRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev));
  };

  const handleUpdateRincianBarangRow = (
    rowId: string,
    patch: Partial<BarangPeminjamanItem>
  ) => {
    setRincianBarangRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
    );
  };

  const handleSubmitPeminjamanCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = rincianBarangRows.filter((r) => r.namaBarang.trim() !== '');
    if (
      !cloudPinjamForm.namaPeminjam.trim() ||
      !cloudPinjamForm.statusDivisiKamar.trim() ||
      !cloudPinjamForm.nomorHp.trim()
    ) {
      notifyToast('Mohon lengkapi Nama Peminjam, Status/Divisi/Kamar, dan Nomor HP.');
      return;
    }
    if (validItems.length === 0) {
      notifyToast('Mohon isi minimal 1 baris Nama Barang pada Daftar Rincian Barang.');
      return;
    }

    setIsSubmittingPeminjamanCloud(true);
    try {
      const created = await createPeminjamanPerlengkapan({
        namaPeminjam: cloudPinjamForm.namaPeminjam,
        statusDivisiKamar: cloudPinjamForm.statusDivisiKamar,
        nomorHp: cloudPinjamForm.nomorHp,
        tanggalPinjam: cloudPinjamForm.tanggalPinjam,
        estimasiTanggalKembali: cloudPinjamForm.estimasiTanggalKembali,
        daftarBarang: validItems,
        keperluan: cloudPinjamForm.keperluan,
        dibuatOleh: currentUser.nama,
        existingCount: peminjamanCloudList.length,
      });

      storageService.addNotification({
        judul: `Pengajuan Peminjaman Perlengkapan: ${created.namaPeminjam}`,
        pesan: `${created.namaPeminjam} (${created.statusDivisiKamar}) mengajukan peminjaman ${created.daftarBarang.length} jenis barang. Menunggu Verifikasi / ACC Ketua Pondok.`,
        tipe: 'warning',
        linkMenu: 'ketua_pondok',
      });

      storageService.addLog(
        'Ajukan Peminjaman Perlengkapan',
        `Pengajuan peminjaman ${created.nomorSurat} atas nama ${created.namaPeminjam} (${created.daftarBarang.length} jenis barang) tersimpan ke Firebase Cloud dengan status Menunggu Verifikasi Ketua Pondok.`,
        'admin'
      );

      setCloudPinjamForm({
        namaPeminjam: '',
        statusDivisiKamar: '',
        nomorHp: '',
        tanggalPinjam: new Date().toISOString().split('T')[0],
        estimasiTanggalKembali: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        keperluan: '',
      });
      setRincianBarangRows([createEmptyRincianRow()]);
      notifyToast(
        `Pengajuan peminjaman "${created.namaPeminjam}" berhasil dikirim! Status: Menunggu Acc Ketua Pondok.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notifyToast(`Gagal menyimpan pengajuan peminjaman: ${msg}`);
    } finally {
      setIsSubmittingPeminjamanCloud(false);
    }
  };

  const handleVerifikasiKetuaPondok = async (
    item: PeminjamanPerlengkapan,
    keputusan: 'Disetujui' | 'Ditolak'
  ) => {
    setProcessingVerifikasiId(item.id);
    try {
      const waktuVerifikasi = formatWaktuIndonesiaNow();
      const catatan = catatanVerifikasiMap[item.id]?.trim();
      await updateStatusPeminjamanPerlengkapan(item.id, {
        status: keputusan,
        diverifikasiOleh: currentUser.nama || 'Ketua Pondok',
        waktuVerifikasi,
        catatanVerifikasi:
          catatan ||
          (keputusan === 'Disetujui'
            ? 'Disetujui untuk peminjaman inventaris pondok.'
            : 'Ditolak oleh Ketua Pondok.'),
      });

      storageService.addLog(
        `${keputusan === 'Disetujui' ? 'ACC' : 'Tolak'} Peminjaman Perlengkapan`,
        `Ketua Pondok (${currentUser.nama}) ${keputusan.toLowerCase()} peminjaman ${item.nomorSurat} atas nama ${item.namaPeminjam}.`,
        'admin'
      );

      notifyToast(
        keputusan === 'Disetujui'
          ? `Peminjaman ${item.namaPeminjam} telah DISETUJUI! Tombol Cetak Surat Peminjaman kini aktif.`
          : `Pengajuan peminjaman ${item.namaPeminjam} ditolak.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notifyToast(`Gagal memproses verifikasi: ${msg}`);
    } finally {
      setProcessingVerifikasiId(null);
    }
  };

  const handleDeleteCloudPeminjaman = async (item: PeminjamanPerlengkapan) => {
    try {
      await deletePeminjamanPerlengkapan(item.id);
      setConfirmDeleteCloudId(null);
      notifyToast(`Data peminjaman "${item.namaPeminjam}" (${item.nomorSurat}) dihapus.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notifyToast(`Gagal menghapus peminjaman: ${msg}`);
    }
  };

  const cloudPinjamStats = useMemo(() => {
    let menunggu = 0;
    let disetujui = 0;
    let dikembalikan = 0;
    let ditolak = 0;
    peminjamanCloudList.forEach((p) => {
      if (p.status === 'Menunggu Verifikasi Ketua Pondok') menunggu += 1;
      else if (p.status === 'Disetujui') disetujui += 1;
      else if (p.status === 'Sudah Dikembalikan') dikembalikan += 1;
      else if (p.status === 'Ditolak') ditolak += 1;
    });
    return { menunggu, disetujui, dikembalikan, ditolak };
  }, [peminjamanCloudList]);

  const filteredCloudPeminjaman = useMemo(() => {
    const q = cloudSearchQuery.trim().toLowerCase();
    return peminjamanCloudList.filter((p) => {
      if (cloudStatusFilter !== 'ALL' && p.status !== cloudStatusFilter) return false;
      if (q) {
        const hay = [
          p.nomorSurat,
          p.namaPeminjam,
          p.statusDivisiKamar,
          p.nomorHp,
          p.keperluan || '',
          ...p.daftarBarang.map((b) => b.namaBarang),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [peminjamanCloudList, cloudSearchQuery, cloudStatusFilter]);

  // ========================================================
  // HANDLERS DATA FASILITAS PER GEDUNG & OPTION PANEL
  // ========================================================
  const updateFasilitasGedungList = (nextList: DataFasilitasGedung[]) => {
    storageService.updateSystemConfig({ fasilitasGedungList: nextList });
  };

  const handleSimpanNamaGedungInline = (gedungId: string) => {
    const namaBaru = editingGedungNama.trim();
    if (!namaBaru) {
      setEditingGedungId(null);
      return;
    }
    const nextList = fasilitasGedungList.map((g) =>
      g.id === gedungId ? { ...g, namaGedung: namaBaru } : g
    );
    updateFasilitasGedungList(nextList);
    setEditingGedungId(null);
    notifyToast(`Nama gedung berhasil diperbarui menjadi "${namaBaru}".`);
  };

  const handleTambahFasilitasKeGedung = (gedungId: string) => {
    const draft = newFasilitasMap[gedungId] || {
      namaFasilitas: '',
      jumlah: 1,
      satuan: perlengkapanCfg.satuanList?.[0] || 'Unit',
      kondisi: 'Baik' as const,
      keterangan: '',
    };
    const nama = draft.namaFasilitas.trim();
    if (!nama) {
      notifyToast('Nama fasilitas wajib diisi sebelum ditambahkan.');
      return;
    }
    const newItem: FasilitasItemGedung = {
      id: `fas_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      namaFasilitas: nama,
      jumlah: Math.max(0, Number(draft.jumlah) || 0),
      satuan: draft.satuan || 'Unit',
      kondisi: draft.kondisi || 'Baik',
      keterangan: draft.keterangan?.trim() || '',
    };
    const nextList = fasilitasGedungList.map((g) =>
      g.id === gedungId
        ? { ...g, daftarFasilitas: [...g.daftarFasilitas, newItem] }
        : g
    );
    updateFasilitasGedungList(nextList);
    setNewFasilitasMap((prev) => ({
      ...prev,
      [gedungId]: {
        namaFasilitas: '',
        jumlah: 1,
        satuan: draft.satuan || 'Unit',
        kondisi: 'Baik',
        keterangan: '',
      },
    }));
    notifyToast(`Fasilitas "${newItem.namaFasilitas}" (${newItem.jumlah} ${newItem.satuan}) ditambahkan.`);
  };

  const handleUpdateFasilitasItem = (
    gedungId: string,
    itemId: string,
    patch: Partial<FasilitasItemGedung>
  ) => {
    const nextList = fasilitasGedungList.map((g) =>
      g.id === gedungId
        ? {
            ...g,
            daftarFasilitas: g.daftarFasilitas.map((f) =>
              f.id === itemId ? { ...f, ...patch } : f
            ),
          }
        : g
    );
    updateFasilitasGedungList(nextList);
  };

  const handleHapusFasilitasItem = (gedungId: string, itemId: string, namaFasilitas: string) => {
    const nextList = fasilitasGedungList.map((g) =>
      g.id === gedungId
        ? { ...g, daftarFasilitas: g.daftarFasilitas.filter((f) => f.id !== itemId) }
        : g
    );
    updateFasilitasGedungList(nextList);
    notifyToast(`Fasilitas "${namaFasilitas}" telah dihapus.`);
  };

  const handleTambahGedungBaru = (e: React.FormEvent) => {
    e.preventDefault();
    const nama = newGedungForm.namaGedung.trim();
    if (!nama) return;
    const nowId = Date.now();
    const defaultItems: FasilitasItemGedung[] = newGedungForm.isiTemplateContoh
      ? [
          { id: `fas_${nowId}_1`, namaFasilitas: 'Lampu LED', jumlah: 10, satuan: 'Unit', kondisi: 'Baik', keterangan: 'Penerangan gedung' },
          { id: `fas_${nowId}_2`, namaFasilitas: 'Sound System', jumlah: 1, satuan: 'Set', kondisi: 'Baik', keterangan: 'Audio gedung' },
          { id: `fas_${nowId}_3`, namaFasilitas: 'Microphone', jumlah: 2, satuan: 'Unit', kondisi: 'Baik', keterangan: 'Mikrofon kegiatan' },
        ]
      : [];
    const newGedung: DataFasilitasGedung = {
      id: `gdg_${nowId}`,
      namaGedung: nama,
      kategoriGedung: newGedungForm.kategoriGedung.trim() || 'Gedung Pondok',
      penanggungJawab: newGedungForm.penanggungJawab.trim() || currentUser.nama,
      daftarFasilitas: defaultItems,
    };
    updateFasilitasGedungList([...fasilitasGedungList, newGedung]);
    setNewGedungForm({
      namaGedung: '',
      kategoriGedung: 'Asrama / Gedung',
      penanggungJawab: currentUser.nama,
      isiTemplateContoh: true,
    });
    notifyToast(`Gedung "${newGedung.namaGedung}" berhasil ditambahkan.`);
  };

  const handleSimpanEditGedungOption = (gedung: DataFasilitasGedung) => {
    const draft = optGedungDrafts[gedung.id];
    if (!draft) return;
    const nextNama = (draft.namaGedung ?? gedung.namaGedung).trim();
    if (!nextNama) {
      notifyToast('Nama gedung tidak boleh kosong.');
      return;
    }
    const nextList = fasilitasGedungList.map((g) =>
      g.id === gedung.id
        ? {
            ...g,
            namaGedung: nextNama,
            kategoriGedung: (draft.kategoriGedung ?? g.kategoriGedung ?? '').trim(),
            penanggungJawab: (draft.penanggungJawab ?? g.penanggungJawab ?? '').trim(),
          }
        : g
    );
    updateFasilitasGedungList(nextList);
    setOptGedungDrafts((prev) => {
      const next = { ...prev };
      delete next[gedung.id];
      return next;
    });
    notifyToast(`Data gedung "${nextNama}" berhasil disimpan.`);
  };

  const handleHapusGedung = (gedungId: string, namaGedung: string) => {
    const nextList = fasilitasGedungList.filter((g) => g.id !== gedungId);
    updateFasilitasGedungList(nextList);
    if (filterGedungId === gedungId) {
      setFilterGedungId('ALL');
    }
    notifyToast(`Gedung "${namaGedung}" beserta daftar fasilitasnya telah dihapus.`);
  };

  const handleDownloadFasilitasWord = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalJenisAll = fasilitasGedungList.reduce((acc, g) => acc + g.daftarFasilitas.length, 0);
    const totalUnitAll = fasilitasGedungList.reduce(
      (acc, g) => acc + g.daftarFasilitas.reduce((s, f) => s + (Number(f.jumlah) || 0), 0),
      0
    );
    const totalBaikAll = fasilitasGedungList.reduce(
      (acc, g) => acc + g.daftarFasilitas.filter((f) => f.kondisi === 'Baik').length,
      0
    );
    const totalPerbaikanAll = totalJenisAll - totalBaikAll;

    const rows: string[][] = fasilitasGedungList.map((g, idx) => {
      const totalUnit = g.daftarFasilitas.reduce((s, f) => s + (Number(f.jumlah) || 0), 0);
      const baikCount = g.daftarFasilitas.filter((f) => f.kondisi === 'Baik').length;
      const masalahCount = g.daftarFasilitas.length - baikCount;
      const rincianFasilitas =
        g.daftarFasilitas.length > 0
          ? g.daftarFasilitas
              .map(
                (f, i) =>
                  `${i + 1}. ${f.namaFasilitas}: ${f.jumlah} ${f.satuan} [${f.kondisi}]${
                    f.keterangan ? ` (${f.keterangan})` : ''
                  }`
              )
              .join('\n')
          : 'Belum ada data fasilitas tercatat.';

      return [
        String(idx + 1),
        g.namaGedung,
        `${g.kategoriGedung || '-'}\nPJ: ${g.penanggungJawab || '-'}`,
        `${g.daftarFasilitas.length} Jenis`,
        `${totalUnit} Unit`,
        rincianFasilitas,
        `Baik: ${baikCount} jenis\nPerlu Perhatian: ${masalahCount} jenis`,
      ];
    });

    rows.push([
      '-',
      'TOTAL KESELURUHAN PONDOK',
      `${fasilitasGedungList.length} Gedung Terdaftar`,
      `${totalJenisAll} Jenis`,
      `${totalUnitAll} Unit`,
      'Rekap seluruh fasilitas di semua gedung pondok pesantren.',
      `Baik: ${totalBaikAll} · Perhatian: ${totalPerbaikanAll}`,
    ]);

    downloadWordDocument({
      filename: `Data_Fasilitas_Per_Gedung_${todayStr}.doc`,
      title: 'LAPORAN DATA FASILITAS PER GEDUNG & RINGKASAN SARPRAS',
      subtitle: `${perlengkapanCfg.namaUnitPerlengkapan || 'DIVISI PERLENGKAPAN, INVENTARIS & SARANA PRASARANA'}`,
      namaPondok: systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
      alamatPondok:
        systemConfig.alamatPondok ||
        'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      penandatanganNama: perlengkapanCfg.kepalaPerlengkapan || currentUser.nama,
      penandatanganJabatan: perlengkapanCfg.jabatanKepala || 'Kepala Divisi Perlengkapan',
      summaryLines: [
        `Jumlah Gedung Terdata: ${fasilitasGedungList.length} Gedung`,
        `Total Jenis Fasilitas Tercatat: ${totalJenisAll} Jenis (${totalUnitAll} Total Unit)`,
        `Kondisi Fasilitas: ${totalBaikAll} Baik · ${totalPerbaikanAll} Perlu Perbaikan / Rusak`,
      ],
      columns: [
        { header: 'No', width: '5%', align: 'center' },
        { header: 'Nama Gedung', width: '17%' },
        { header: 'Kategori & PJ', width: '15%' },
        { header: 'Jml Jenis', width: '9%', align: 'center' },
        { header: 'Total Unit', width: '9%', align: 'center' },
        { header: 'Daftar Semua Fasilitas & Jumlah', width: '32%' },
        { header: 'Kondisi', width: '13%' },
      ],
      rows,
    });
    notifyToast('File Word (.doc) Data Fasilitas berhasil diunduh.');
  };

  const handleDownloadWordPerGedung = (gedung: DataFasilitasGedung) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalUnitGedung = gedung.daftarFasilitas.reduce(
      (s, f) => s + (Number(f.jumlah) || 0),
      0
    );
    const baikCount = gedung.daftarFasilitas.filter((f) => f.kondisi === 'Baik').length;
    const perbaikanCount = gedung.daftarFasilitas.filter(
      (f) => f.kondisi === 'Perlu Perbaikan'
    ).length;
    const rusakCount = gedung.daftarFasilitas.filter((f) => f.kondisi === 'Rusak').length;

    const rows: string[][] =
      gedung.daftarFasilitas.length > 0
        ? [
            ...gedung.daftarFasilitas.map((f, idx) => [
              String(idx + 1),
              f.namaFasilitas,
              String(Number(f.jumlah) || 0),
              f.satuan || 'Unit',
              f.kondisi,
              f.keterangan?.trim() || '-',
            ]),
            [
              '-',
              `TOTAL KESELURUHAN (${gedung.namaGedung.toUpperCase()})`,
              String(totalUnitGedung),
              `${gedung.daftarFasilitas.length} Jenis`,
              `Baik: ${baikCount} | Perbaikan: ${perbaikanCount} | Rusak: ${rusakCount}`,
              'Rekapitulasi aset fasilitas gedung',
            ],
          ]
        : [['-', 'Belum ada fasilitas tercatat di gedung ini', '0', '-', '-', '-']];

    const safeSlug = (gedung.namaGedung || 'Gedung')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    downloadWordDocument({
      filename: `Fasilitas_${safeSlug}_${todayStr}.doc`,
      title: `DATA FASILITAS & SARPRAS — ${gedung.namaGedung.toUpperCase()}`,
      subtitle: `${perlengkapanCfg.namaUnitPerlengkapan || 'DIVISI PERLENGKAPAN, INVENTARIS & SARANA PRASARANA'}`,
      namaPondok: systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
      alamatPondok:
        systemConfig.alamatPondok ||
        'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      penandatanganNama:
        gedung.penanggungJawab || perlengkapanCfg.kepalaPerlengkapan || currentUser.nama,
      penandatanganJabatan: `Penanggung Jawab ${gedung.namaGedung}`,
      summaryLines: [
        `Nama Gedung / Lokasi: ${gedung.namaGedung} (${gedung.kategoriGedung || 'Umum'})`,
        `Penanggung Jawab Gedung: ${gedung.penanggungJawab || perlengkapanCfg.kepalaPerlengkapan || currentUser.nama}`,
        `Jumlah Jenis Fasilitas: ${gedung.daftarFasilitas.length} Jenis · Total Kuantitas: ${totalUnitGedung} Unit`,
        `Rincian Kondisi: ${baikCount} Baik · ${perbaikanCount} Perlu Perbaikan · ${rusakCount} Rusak`,
      ],
      columns: [
        { header: 'No', width: '6%', align: 'center' },
        { header: 'Nama Fasilitas / Sarpras', width: '30%' },
        { header: 'Jumlah', width: '10%', align: 'center' },
        { header: 'Satuan', width: '12%', align: 'center' },
        { header: 'Kondisi', width: '16%', align: 'center' },
        { header: 'Keterangan / Catatan', width: '26%' },
      ],
      rows,
    });
    notifyToast(`File Word (.doc) fasilitas "${gedung.namaGedung}" berhasil diunduh.`);
  };

  const handleSimpanPengaturanUmumPerlengkapan = (e: React.FormEvent) => {
    e.preventDefault();
    const kategoriList = cfgForm.kategoriText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const satuanList = cfgForm.satuanText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    storageService.updateSystemConfig({
      perlengkapanConfig: {
        namaUnitPerlengkapan:
          cfgForm.namaUnitPerlengkapan.trim() || INITIAL_PERLENGKAPAN_CONFIG.namaUnitPerlengkapan,
        kepalaPerlengkapan:
          cfgForm.kepalaPerlengkapan.trim() || INITIAL_PERLENGKAPAN_CONFIG.kepalaPerlengkapan,
        jabatanKepala: cfgForm.jabatanKepala.trim() || INITIAL_PERLENGKAPAN_CONFIG.jabatanKepala,
        kategoriInventaris:
          kategoriList.length > 0 ? kategoriList : INITIAL_PERLENGKAPAN_CONFIG.kategoriInventaris,
        satuanList: satuanList.length > 0 ? satuanList : INITIAL_PERLENGKAPAN_CONFIG.satuanList,
      },
    });
    notifyToast('Pengaturan Umum & Kop Unit Perlengkapan berhasil disimpan.');
  };

  const handleSimpanEditInventarisOption = (b: BarangInventaris) => {
    const draft = optInvDrafts[b.id];
    if (!draft) return;
    const updated: BarangInventaris = {
      ...b,
      namaBarang: (draft.namaBarang ?? b.namaBarang).trim() || b.namaBarang,
      kategori: (draft.kategori ?? b.kategori) as BarangInventaris['kategori'],
      jumlah: Math.max(0, Number(draft.jumlah ?? b.jumlah) || 0),
      stokMinimal: Math.max(0, Number(draft.stokMinimal ?? b.stokMinimal ?? 3) || 0),
      satuan: (draft.satuan ?? b.satuan).trim() || b.satuan,
      kondisi: (draft.kondisi ?? b.kondisi) as BarangInventaris['kondisi'],
      lokasi: (draft.lokasi ?? b.lokasi).trim() || b.lokasi,
    };
    storageService.saveBarangInventaris(updated);
    setOptInvDrafts((prev) => {
      const next = { ...prev };
      delete next[b.id];
      return next;
    });
    notifyToast(`Data inventaris "${updated.namaBarang}" berhasil diperbarui.`);
  };

  const handleSimpanEditMutasiOption = (m: MutasiBarang) => {
    const draft = optMutasiDrafts[m.id];
    if (!draft) return;
    const updatedList = (systemConfig.mutasiBarangList || []).map((item) =>
      item.id === m.id
        ? {
            ...item,
            tanggal: draft.tanggal ?? item.tanggal,
            tipe: (draft.tipe ?? item.tipe) as 'Masuk' | 'Keluar',
            jumlah: Math.max(1, Number(draft.jumlah ?? item.jumlah) || 1),
            petugas: (draft.petugas ?? item.petugas).trim() || item.petugas,
            keterangan: (draft.keterangan ?? item.keterangan).trim() || item.keterangan,
          }
        : item
    );
    storageService.updateSystemConfig({ mutasiBarangList: updatedList });
    setOptMutasiDrafts((prev) => {
      const next = { ...prev };
      delete next[m.id];
      return next;
    });
    notifyToast(`Data mutasi "${m.namaBarang}" berhasil diperbarui.`);
  };

  const handleHapusMutasiOption = (id: string, namaBarang: string) => {
    const updatedList = (systemConfig.mutasiBarangList || []).filter((item) => item.id !== id);
    storageService.updateSystemConfig({ mutasiBarangList: updatedList });
    notifyToast(`Riwayat mutasi "${namaBarang}" telah dihapus.`);
  };

  const handleSimpanEditPeminjamanOption = (p: PeminjamanBarang) => {
    const draft = optPinjamDrafts[p.id];
    if (!draft) return;
    const updated: PeminjamanBarang = {
      ...p,
      namaBarang: (draft.namaBarang ?? p.namaBarang).trim() || p.namaBarang,
      jumlahPinjam: Math.max(1, Number(draft.jumlahPinjam ?? p.jumlahPinjam) || 1),
      peminjamNama: (draft.peminjamNama ?? p.peminjamNama).trim() || p.peminjamNama,
      batasKembali: draft.batasKembali ?? p.batasKembali,
      status: (draft.status ?? p.status) as PeminjamanBarang['status'],
      keperluan: (draft.keperluan ?? p.keperluan).trim() || p.keperluan,
    };
    storageService.savePeminjamanBarang(updated);
    setOptPinjamDrafts((prev) => {
      const next = { ...prev };
      delete next[p.id];
      return next;
    });
    notifyToast(`Data peminjaman "${updated.namaBarang}" berhasil diperbarui.`);
  };

  const handleSimpanEditPengajuanOption = (pgj: PengajuanDivisi) => {
    const draft = optPengajuanDrafts[pgj.id];
    if (!draft) return;
    const updated: PengajuanDivisi = {
      ...pgj,
      judul: (draft.judul ?? pgj.judul).trim() || pgj.judul,
      deskripsi: (draft.deskripsi ?? pgj.deskripsi).trim() || pgj.deskripsi,
      nominalEstimasi: Math.max(0, Number(draft.nominalEstimasi ?? pgj.nominalEstimasi ?? 0) || 0),
    };
    storageService.savePengajuanDivisi(updated);
    setOptPengajuanDrafts((prev) => {
      const next = { ...prev };
      delete next[pgj.id];
      return next;
    });
    notifyToast(`Pengajuan pembelian "${updated.judul}" berhasil diperbarui.`);
  };

  const handleSimpanPengajuanPembelian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengadaanForm.judul) return;
    storageService.savePengajuanDivisi({
      id: `pgj_${Date.now()}`,
      nomorPengajuan: `PRL-BUY-${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toISOString().split('T')[0],
      divisi: 'Perlengkapan',
      jenisPengajuan: 'Pengadaan Barang',
      judul: pengadaanForm.judul,
      deskripsi: pengadaanForm.deskripsi,
      nominalEstimasi: Number(pengadaanForm.nominalEstimasi) || 0,
      pengajuNama: currentUser.nama,
      status: 'Menunggu Persetujuan',
    });
    notifyToast(`Pengajuan pembelian "${pengadaanForm.judul}" berhasil dikirim ke Ketua Pondok & Bendahara!`);
    setPengadaanForm({ judul: '', deskripsi: '', nominalEstimasi: 2500000 });
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const barangByIdMap = useMemo(() => {
    const map = new Map<string, BarangInventaris>();
    barangInventaris.forEach((b) => map.set(b.id, b));
    return map;
  }, [barangInventaris]);

  const filteredMasukList = useMemo(() => {
    const all = (systemConfig.mutasiBarangList || []).filter((m) => m.tipe === 'Masuk');
    const q = searchMasuk.trim().toLowerCase();
    return all.filter((m) => {
      if (filterMasukBulan !== 'ALL' && (m.tanggal || '').slice(0, 7) !== filterMasukBulan) {
        return false;
      }
      if (q) {
        const barangMeta = barangByIdMap.get(m.barangId);
        const hay = [
          m.namaBarang,
          m.petugas,
          m.keterangan,
          m.tanggal,
          barangMeta?.kodeBarang || '',
          barangMeta?.kategori || '',
          barangMeta?.lokasi || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [systemConfig.mutasiBarangList, filterMasukBulan, searchMasuk, barangByIdMap]);

  const filteredKeluarList = useMemo(() => {
    const all = (systemConfig.mutasiBarangList || []).filter((m) => m.tipe === 'Keluar');
    const q = searchKeluar.trim().toLowerCase();
    return all.filter((m) => {
      if (filterKeluarBulan !== 'ALL' && (m.tanggal || '').slice(0, 7) !== filterKeluarBulan) {
        return false;
      }
      if (q) {
        const barangMeta = barangByIdMap.get(m.barangId);
        const hay = [
          m.namaBarang,
          m.petugas,
          m.keterangan,
          m.tanggal,
          barangMeta?.kodeBarang || '',
          barangMeta?.kategori || '',
          barangMeta?.lokasi || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [systemConfig.mutasiBarangList, filterKeluarBulan, searchKeluar, barangByIdMap]);

  const filteredPeminjamanList = useMemo(() => {
    const q = searchPinjam.trim().toLowerCase();
    return peminjamanBarang.filter((p) => {
      if (filterPinjamStatus !== 'ALL' && p.status !== filterPinjamStatus) {
        return false;
      }
      if (q) {
        const hay = [
          p.kodePeminjaman,
          p.namaBarang,
          p.peminjamNama,
          p.peminjamBagian,
          p.keperluan,
          p.tanggalPinjam,
          p.batasKembali,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [peminjamanBarang, filterPinjamStatus, searchPinjam]);

  const mutasiSummaryStats = useMemo(() => {
    const all = systemConfig.mutasiBarangList || [];
    let totalMasukUnit = 0;
    let totalMasukTx = 0;
    let totalKeluarUnit = 0;
    let totalKeluarTx = 0;
    all.forEach((m) => {
      const qty = Number(m.jumlah) || 0;
      if (m.tipe === 'Masuk') {
        totalMasukUnit += qty;
        totalMasukTx += 1;
      } else {
        totalKeluarUnit += qty;
        totalKeluarTx += 1;
      }
    });
    const aktifPinjam = peminjamanBarang.filter((p) => p.status === 'Dipinjam').length;
    const selesaiPinjam = peminjamanBarang.filter((p) => p.status === 'Dikembalikan').length;
    return {
      totalMasukUnit,
      totalMasukTx,
      totalKeluarUnit,
      totalKeluarTx,
      aktifPinjam,
      selesaiPinjam,
    };
  }, [systemConfig.mutasiBarangList, peminjamanBarang]);

  const handleDownloadMutasiByTipeWord = (tipe: 'Masuk' | 'Keluar') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const list = tipe === 'Masuk' ? filteredMasukList : filteredKeluarList;
    const bulanFilter = tipe === 'Masuk' ? filterMasukBulan : filterKeluarBulan;
    const totalUnit = list.reduce((s, m) => s + (Number(m.jumlah) || 0), 0);

    const rows: string[][] =
      list.length > 0
        ? [
            ...list.map((m, idx) => {
              const meta = barangByIdMap.get(m.barangId);
              return [
                String(idx + 1),
                m.tanggal || '-',
                meta ? `${m.namaBarang} (${meta.kodeBarang})` : m.namaBarang,
                `${tipe === 'Masuk' ? '+' : '-'}${m.jumlah} ${m.satuan}`,
                m.petugas || '-',
                m.keterangan || '-',
              ];
            }),
            [
              '-',
              bulanFilter === 'ALL' ? 'Semua Periode' : bulanFilter,
              `TOTAL BARANG ${tipe.toUpperCase()} (${list.length} Transaksi)`,
              `${tipe === 'Masuk' ? '+' : '-'}${totalUnit} Unit`,
              '-',
              `Rekap riwayat barang ${tipe.toLowerCase()}`,
            ],
          ]
        : [['-', '-', `Belum ada data barang ${tipe.toLowerCase()}`, '-', '-', '-']];

    downloadWordDocument({
      filename: `Riwayat_Barang_${tipe}_${todayStr}.doc`,
      title: `LAPORAN RIWAYAT BARANG ${tipe.toUpperCase()} INVENTARIS`,
      subtitle: `${perlengkapanCfg.namaUnitPerlengkapan || 'DIVISI PERLENGKAPAN, INVENTARIS & SARANA PRASARANA'}`,
      namaPondok: systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
      alamatPondok:
        systemConfig.alamatPondok ||
        'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
      kotaInstansi: systemConfig.kotaInstansi || 'Karawang',
      penandatanganNama: perlengkapanCfg.kepalaPerlengkapan || currentUser.nama,
      penandatanganJabatan: perlengkapanCfg.jabatanKepala || 'Kepala Divisi Perlengkapan',
      summaryLines: [
        `Kategori Laporan: Riwayat Barang ${tipe}`,
        `Periode Filter: ${bulanFilter === 'ALL' ? 'Semua Bulan' : bulanFilter}`,
        `Total Transaksi: ${list.length} Kali · Total Kuantitas: ${tipe === 'Masuk' ? '+' : '-'}${totalUnit} Unit`,
      ],
      columns: [
        { header: 'No', width: '6%', align: 'center' },
        { header: 'Tanggal', width: '13%', align: 'center' },
        { header: 'Nama Barang', width: '27%' },
        { header: 'Jumlah', width: '14%', align: 'center' },
        { header: 'Petugas', width: '17%' },
        { header: 'Keterangan', width: '23%' },
      ],
      rows,
    });
    notifyToast(`File Word (.doc) Riwayat Barang ${tipe} berhasil diunduh.`);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER PERLENGKAPAN */}
      <div className="flex flex-col gap-4 bg-[#041d14]/95 border border-[#d4af37]/40 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266] shrink-0">
              <Package className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                DASHBOARD PERLENGKAPAN, INVENTARIS &amp; DATA FASILITAS
              </span>
              <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight mt-1">
                Manajemen Inventaris, Keluar Masuk, Peminjaman QR, Pengadaan &amp; Data Fasilitas
              </h1>
              <p className="text-xs text-emerald-200/75">
                Terintegrasi Real-Time Firebase · Verifikasi Ketua Pondok &amp; Scan QR Pengembalian
              </p>
            </div>
          </div>

          {/* Tombol Aksi Pojok Kanan Atas: Scan QR Pengembalian & Option Panel Format Surat */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsScanQRModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#02120a] font-extrabold text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>Scan QR Pengembalian Barang</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOptionSuratModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#02100a] hover:bg-[#06281c] border border-[#d4af37]/60 text-[#f3d266] font-extrabold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>⚙️ Option Panel Format Surat</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigasi Perlengkapan */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
          {[
            { id: 'kotak_masuk', label: `Kotak Masuk (${koordinasiList.length})` },
            { id: 'inventaris', label: `Inventaris (${barangInventaris.length})` },
            {
              id: 'barang_masuk_keluar',
              label: `Barang Masuk & Keluar${
                cloudPinjamStats.menunggu > 0 ? ` (${cloudPinjamStats.menunggu} ACC)` : ''
              }`,
            },
            { id: 'pengajuan_pembelian', label: 'Pengajuan Pembelian' },
            { id: 'kamar_santri', label: 'Data Fasilitas' },
            { id: 'option_perlengkapan', label: 'Option Panel Perlengkapan' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PerlengkapanSubTab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === t.id ||
                (t.id === 'kamar_santri' && activeTab === 'data_fasilitas')
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] shadow-md'
                  : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
              }`}
            >
              {t.id === 'option_perlengkapan' && <Sliders className="w-3.5 h-3.5" />}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grafik 3D Pie Chart Indikator Kinerja Perlengkapan Real-Time (Sinkron Dashboard Utama) */}
      <div className="kpi-glass-3d rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="shrink-0">
          <PieChart3D
            data={[
              { name: 'Kinerja Perlengkapan', value: perlengkapanKpi.score, color: perlengkapanKpi.color },
              { name: 'Ruang Optimasi', value: Math.max(1, 100 - perlengkapanKpi.score), color: '#093827' },
            ]}
            size={136}
            innerRadiusRatio={0.5}
            depth={12}
            centerValue={perlengkapanKpi.score}
            centerSuffix="%"
            centerLabel={perlengkapanKpi.ratingLabel.toUpperCase()}
            centerTone={perlengkapanKpi.score >= 90 ? 'gold' : 'emerald'}
            unit="%"
          />
        </div>
        <div className="space-y-1 text-center sm:text-left min-w-0">
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 text-[10px] font-mono font-bold uppercase">
            SINKRON REAL-TIME DASHBOARD UTAMA &amp; KETUA PONDOK
          </span>
          <h2 className="text-sm font-extrabold text-white uppercase">
            Indikator Penilaian {perlengkapanKpi.title}
          </h2>
          <p className="text-xs text-emerald-200/80">{perlengkapanKpi.subtitle}</p>
          <p className="text-[11px] font-mono text-[#f3d266] bg-[#02100a]/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 inline-block">
            {perlengkapanKpi.detail}
          </p>
        </div>
      </div>

      {/* PERINGATAN OTOMATIS STOK MINIMAL HAMPIR HABIS */}
      {stokKritisList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-300 uppercase">
                Peringatan Stok Minimal ({stokKritisList.length} Barang Hampir Habis / Kritis)
              </h3>
              <p className="text-xs text-amber-100/85">
                {stokKritisList
                  .map((b) => `${b.namaBarang} (Sisa: ${b.jumlah} ${b.satuan}, Min: ${b.stokMinimal ?? 3})`)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pengajuan_pembelian')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#02120a] font-bold text-xs cursor-pointer shrink-0"
          >
            Ajukan Pembelian Sekarang
          </button>
        </div>
      )}

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/95 border border-[#d4af37] text-emerald-100 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#f3d266]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB KOTAK MASUK & PESAN LINTAS DIVISI */}
      {activeTab === 'kotak_masuk' && (
        <DivisiKotakMasuk
          currentUser={currentUser}
          koordinasiList={koordinasiList}
          viewerDivision="Perlengkapan"
        />
      )}

      {/* TAB 1: DAFTAR INVENTARIS & PERINGATAN STOK MINIMAL */}
      {activeTab === 'inventaris' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSimpanInventaris}
            className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Tambah Barang Inventaris Baru
            </h2>
            <input
              type="text"
              required
              placeholder="Nama Barang / Aset..."
              value={formBarang.namaBarang}
              onChange={(e) => setFormBarang({ ...formBarang, namaBarang: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Kategori Barang
                </label>
                <select
                  value={formBarang.kategori || perlengkapanCfg.kategoriInventaris?.[0] || 'Elektronik'}
                  onChange={(e) => setFormBarang({ ...formBarang, kategori: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  {(perlengkapanCfg.kategoriInventaris || INITIAL_PERLENGKAPAN_CONFIG.kategoriInventaris || []).map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Satuan
                </label>
                <select
                  value={formBarang.satuan || perlengkapanCfg.satuanList?.[0] || 'Unit'}
                  onChange={(e) => setFormBarang({ ...formBarang, satuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  {(perlengkapanCfg.satuanList || INITIAL_PERLENGKAPAN_CONFIG.satuanList || []).map((sat) => (
                    <option key={sat} value={sat}>
                      {sat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Jumlah Stok
                </label>
                <input
                  type="number"
                  value={formBarang.jumlah}
                  onChange={(e) => setFormBarang({ ...formBarang, jumlah: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-amber-300 mb-1">
                  Batas Stok Minimal
                </label>
                <input
                  type="number"
                  value={formBarang.stokMinimal}
                  onChange={(e) => setFormBarang({ ...formBarang, stokMinimal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={formBarang.kondisi}
                onChange={(e) => setFormBarang({ ...formBarang, kondisi: e.target.value as any })}
                className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                <option value="Baik">Kondisi Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
              <input
                type="text"
                placeholder="Lokasi Penempatan..."
                value={formBarang.lokasi}
                onChange={(e) => setFormBarang({ ...formBarang, lokasi: e.target.value })}
                className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Simpan ke Daftar Inventaris
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Inventaris Pondok (Nama Barang, Jumlah, Kondisi, Lokasi)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                    <th className="py-3 px-3">Nama Barang & Kode</th>
                    <th className="py-3 px-3">Jumlah & Stok Min</th>
                    <th className="py-3 px-3">Kondisi</th>
                    <th className="py-3 px-3">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {barangInventaris.map((b) => {
                    const isLow = b.jumlah <= (b.stokMinimal ?? 3);
                    return (
                      <tr key={b.id} className="hover:bg-[#06281c]/50">
                        <td className="py-3 px-3 font-bold text-white">
                          {b.namaBarang}
                          <span className="block text-[10px] font-mono text-emerald-400">
                            {b.kodeBarang} · {b.kategori}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-white font-bold">
                            {b.jumlah} {b.satuan}
                          </span>
                          <span className="block text-[10px] text-emerald-300/75">
                            Stok Min: {b.stokMinimal ?? 3}
                          </span>
                          {isLow && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                              ⚠ HAMPIR HABIS
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              b.kondisi === 'Baik'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {b.kondisi}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-emerald-200">{b.lokasi}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BARANG MASUK & KELUAR (TERPISAH ATAS: BARANG MASUK | BAWAH: BARANG KELUAR ATAU DIPINJAM) */}
      {(activeTab === 'barang_masuk_keluar' || activeTab === 'peminjaman') && (() => {
        const selectedMasukBarang = barangInventaris.find((b) => b.id === effectiveMasukBarangId);
        const qtyMasuk = Math.max(0, Number(masukForm.jumlah) || 0);
        const stokMasukNow = selectedMasukBarang ? Number(selectedMasukBarang.jumlah) || 0 : 0;
        const estimasiMasukAkhir = stokMasukNow + qtyMasuk;

        const selectedKeluarBarang = barangInventaris.find((b) => b.id === effectiveKeluarBarangId);
        const qtyKeluar = Math.max(0, Number(keluarForm.jumlah) || 0);
        const stokKeluarNow = selectedKeluarBarang ? Number(selectedKeluarBarang.jumlah) || 0 : 0;
        const stokKeluarMin = selectedKeluarBarang ? Number(selectedKeluarBarang.stokMinimal ?? 3) : 3;
        const estimasiKeluarAkhir = stokKeluarNow - qtyKeluar;
        const isKeluarStokKurang = qtyKeluar > stokKeluarNow;
        const isKeluarAkanKritis =
          !isKeluarStokKurang && selectedKeluarBarang && estimasiKeluarAkhir <= stokKeluarMin;

        const selectedPinjamBarang = barangInventaris.find((b) => b.id === effectivePinjamBarangId);

        const totalFilteredMasukUnit = filteredMasukList.reduce(
          (s, m) => s + (Number(m.jumlah) || 0),
          0
        );
        const totalFilteredKeluarUnit = filteredKeluarList.reduce(
          (s, m) => s + (Number(m.jumlah) || 0),
          0
        );

        const quickMasukChips = [
          'Pembelian / Pengadaan Baru',
          'Pengembalian ke Gudang',
          'Hibah / Wakaf Pondok',
          'Penyesuaian Stok Opname (+)',
        ];
        const quickKeluarChips = [
          'Distribusi ke Asrama / Kamar',
          'Keperluan Kegiatan Pondok',
          'Dipakai Pos Keamanan / Kantor',
          'Barang Rusak / Afkir',
        ];

        return (
          <div className="space-y-8">
            {/* Strip KPI Ringkas Gabungan Barang Masuk, Keluar & Dipinjam */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-500/40 p-4 shadow-lg">
                <p className="text-[10px] font-mono uppercase text-emerald-300 tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Total Barang Masuk</span>
                </p>
                <p className="text-2xl font-extrabold text-emerald-300 font-mono tabular-nums mt-1">
                  +{mutasiSummaryStats.totalMasukUnit}
                </p>
                <p className="text-[11px] text-emerald-200/75 mt-0.5">
                  {mutasiSummaryStats.totalMasukTx} Transaksi Masuk
                </p>
              </div>
              <div className="rounded-2xl bg-[#041d14]/95 border border-rose-500/40 p-4 shadow-lg">
                <p className="text-[10px] font-mono uppercase text-rose-300 tracking-wider flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Total Barang Keluar</span>
                </p>
                <p className="text-2xl font-extrabold text-rose-300 font-mono tabular-nums mt-1">
                  -{mutasiSummaryStats.totalKeluarUnit}
                </p>
                <p className="text-[11px] text-emerald-200/75 mt-0.5">
                  {mutasiSummaryStats.totalKeluarTx} Transaksi Keluar
                </p>
              </div>
              <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/45 p-4 shadow-lg">
                <p className="text-[10px] font-mono uppercase text-[#f3d266] tracking-wider flex items-center gap-1">
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Sedang Dipinjam</span>
                </p>
                <p className="text-2xl font-extrabold text-[#f3d266] font-mono tabular-nums mt-1">
                  {mutasiSummaryStats.aktifPinjam}
                </p>
                <p className="text-[11px] text-emerald-200/75 mt-0.5">
                  Peminjaman aktif belum kembali
                </p>
              </div>
              <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/50 p-4 shadow-lg">
                <p className="text-[10px] font-mono uppercase text-emerald-300 tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Peminjaman Selesai</span>
                </p>
                <p className="text-2xl font-extrabold text-white font-mono tabular-nums mt-1">
                  {mutasiSummaryStats.selesaiPinjam}
                </p>
                <p className="text-[11px] text-emerald-200/75 mt-0.5">
                  Total {peminjamanBarang.length} data peminjaman
                </p>
              </div>
            </div>

            {/* ================================================================= */}
            {/* BAGIAN ATAS: KHUSUS INPUT BARANG MASUK & TABEL BARANG MASUK       */}
            {/* ================================================================= */}
            <section className="rounded-3xl bg-[#031a12]/90 border-2 border-emerald-500/40 p-5 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                      BAGIAN ATAS · PENCATATAN STOK MASUK
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Input Barang Masuk &amp; Tabel Riwayat Barang Masuk
                    </h2>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-600/50 text-emerald-300 text-xs font-mono font-bold self-start sm:self-center">
                  Filter Aktif: +{totalFilteredMasukUnit} Unit ({filteredMasukList.length} Data)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* FORM INPUT BARANG MASUK */}
                <form
                  onSubmit={handleSimpanBarangMasuk}
                  className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-emerald-500/40 p-4 sm:p-5 shadow-xl space-y-3.5"
                >
                  <div className="flex items-center justify-between border-b border-emerald-800/70 pb-2.5">
                    <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Form Input Barang Masuk (+)</span>
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      1. Pilih Barang Inventaris
                    </label>
                    <select
                      value={effectiveMasukBarangId}
                      onChange={(e) => setMasukForm({ ...masukForm, barangId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-700/80 focus:border-emerald-400 text-xs text-white font-semibold focus:outline-none"
                    >
                      {barangInventaris.length === 0 ? (
                        <option value="">Belum ada barang di inventaris</option>
                      ) : (
                        barangInventaris.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.namaBarang} — Stok: {b.jumlah} {b.satuan} ({b.lokasi})
                          </option>
                        ))
                      )}
                    </select>

                    {selectedMasukBarang && (
                      <div className="mt-2 rounded-xl bg-[#02100a] border border-emerald-800/80 p-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-white truncate">
                            {selectedMasukBarang.namaBarang}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300/80 shrink-0">
                            {selectedMasukBarang.kodeBarang}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="rounded-lg bg-[#041d14] p-1.5">
                            <span className="block text-[9px] font-mono uppercase text-emerald-300/75">
                              Stok Saat Ini
                            </span>
                            <span className="text-xs font-extrabold font-mono text-white">
                              {stokMasukNow} {selectedMasukBarang.satuan}
                            </span>
                          </div>
                          <div className="rounded-lg bg-emerald-950/70 border border-emerald-500/45 p-1.5">
                            <span className="block text-[9px] font-mono uppercase text-emerald-300">
                              Stok Setelah Masuk
                            </span>
                            <span className="text-xs font-extrabold font-mono text-emerald-300">
                              {estimasiMasukAkhir} {selectedMasukBarang.satuan}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono uppercase text-emerald-300">
                        2. Jumlah Masuk ({selectedMasukBarang?.satuan || 'Unit'})
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 5, 10].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setMasukForm((prev) => ({ ...prev, jumlah: preset }))}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border cursor-pointer ${
                              Number(masukForm.jumlah) === preset
                                ? 'bg-emerald-500 text-[#02120a] border-emerald-300'
                                : 'bg-[#02100a] text-emerald-200 border-emerald-800 hover:border-emerald-500'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMasukForm((prev) => ({
                            ...prev,
                            jumlah: Math.max(1, (Number(prev.jumlah) || 1) - 1),
                          }))
                        }
                        className="w-9 h-9 rounded-xl bg-[#02100a] hover:bg-emerald-900 border border-emerald-800 text-white font-extrabold text-sm cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={masukForm.jumlah}
                        onChange={(e) =>
                          setMasukForm({ ...masukForm, jumlah: Math.max(0, Number(e.target.value)) })
                        }
                        className="flex-1 px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-600/50 text-sm text-emerald-300 font-mono font-extrabold text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMasukForm((prev) => ({
                            ...prev,
                            jumlah: Math.max(1, (Number(prev.jumlah) || 0) + 1),
                          }))
                        }
                        className="w-9 h-9 rounded-xl bg-[#02100a] hover:bg-emerald-900 border border-emerald-800 text-white font-extrabold text-sm cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        3. Tanggal Masuk
                      </label>
                      <input
                        type="date"
                        required
                        value={masukForm.tanggal}
                        onChange={(e) => setMasukForm({ ...masukForm, tanggal: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        4. Petugas Penerima
                      </label>
                      <input
                        type="text"
                        required
                        value={masukForm.petugas}
                        onChange={(e) => setMasukForm({ ...masukForm, petugas: e.target.value })}
                        placeholder="Nama Petugas..."
                        className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase text-emerald-300">
                      5. Keterangan Barang Masuk
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {quickMasukChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setMasukForm((prev) => ({ ...prev, keterangan: chip }))}
                          className={`px-2 py-0.5 rounded-lg text-[10px] border cursor-pointer ${
                            masukForm.keterangan === chip
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                              : 'bg-[#02100a] border-emerald-800/80 text-emerald-200/75 hover:text-white'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Asal barang / catatan masuk..."
                      value={masukForm.keterangan}
                      onChange={(e) => setMasukForm({ ...masukForm, keterangan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedMasukBarang || qtyMasuk <= 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#02120a] font-extrabold text-xs shadow-lg cursor-pointer disabled:opacity-45 flex items-center justify-center gap-1.5"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Simpan Barang Masuk (+) &amp; Tambah Stok</span>
                  </button>
                </form>

                {/* TABEL BARANG MASUK */}
                <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/50 p-4 sm:p-5 shadow-xl space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-800/70 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-300" />
                        <span>Tabel Riwayat Barang Masuk</span>
                      </h3>
                      <p className="text-[11px] text-emerald-200/75">
                        Menampilkan khusus seluruh barang yang masuk ke gudang inventaris.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadMutasiByTipeWord('Masuk')}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Word Masuk (.doc)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-7 relative">
                      <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari barang masuk, petugas, keterangan..."
                        value={searchMasuk}
                        onChange={(e) => setSearchMasuk(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-5 flex items-center gap-1.5">
                      <input
                        type="month"
                        value={filterMasukBulan === 'ALL' ? '' : filterMasukBulan}
                        onChange={(e) => setFilterMasukBulan(e.target.value || 'ALL')}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-[#f3d266] font-mono"
                      />
                      {(filterMasukBulan !== 'ALL' || searchMasuk.trim() !== '') && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterMasukBulan('ALL');
                            setSearchMasuk('');
                          }}
                          className="p-2 rounded-xl bg-[#03160f] border border-emerald-800 text-emerald-200 cursor-pointer"
                          title="Reset Filter Masuk"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-emerald-800/70 bg-[#03160f]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-emerald-300 bg-[#02100a]">
                          <th className="py-2.5 px-3 text-center w-10">No</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 min-w-[170px]">Nama Barang &amp; Lokasi</th>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">Jumlah Masuk</th>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">Stok Kini</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Petugas</th>
                          <th className="py-2.5 px-3 min-w-[150px]">Keterangan</th>
                          <th className="py-2.5 px-3 text-right w-14">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-900/50">
                        {filteredMasukList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 px-4 text-center text-emerald-200/70">
                              Belum ada data barang masuk sesuai filter. Catat melalui form Barang Masuk di sebelah kiri.
                            </td>
                          </tr>
                        ) : (
                          filteredMasukList.map((m, idx) => {
                            const meta = barangByIdMap.get(m.barangId);
                            return (
                              <tr
                                key={m.id}
                                className="hover:bg-[#06281c]/60 odd:bg-[#03160f] even:bg-[#02120c]/60 align-middle"
                              >
                                <td className="py-2.5 px-3 text-center font-mono text-emerald-300/80">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[#f3d266] whitespace-nowrap">
                                  {m.tanggal}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-white">{m.namaBarang}</div>
                                  {meta && (
                                    <div className="text-[10px] font-mono text-emerald-300/75">
                                      {meta.kodeBarang} · {meta.lokasi}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-mono font-extrabold tabular-nums text-[11px]">
                                    +{m.jumlah} {m.satuan}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-emerald-100 whitespace-nowrap tabular-nums">
                                  {meta ? `${meta.jumlah} ${meta.satuan}` : '-'}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-emerald-200 whitespace-nowrap">
                                  {m.petugas}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-200/85 leading-snug">
                                  {m.keterangan || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleHapusMutasiOption(m.id, m.namaBarang)}
                                    className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/35 cursor-pointer"
                                    title="Hapus Riwayat Masuk"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            </section>

            {/* ======================================================================== */}
            {/* BAGIAN BAWAH: KHUSUS INPUT & TABEL BARANG KELUAR ATAU DIPINJAM           */}
            {/* ======================================================================== */}
            <section className="rounded-3xl bg-[#031a12]/90 border-2 border-[#d4af37]/45 p-5 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3d266] font-bold">
                      BAGIAN BAWAH · BARANG KELUAR &amp; PEMINJAMAN BARANG
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Input &amp; Tabel Barang Keluar atau Dipinjam
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                    Keluar: -{totalFilteredKeluarUnit} Unit ({filteredKeluarList.length})
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3d266] font-bold">
                    Dipinjam: {mutasiSummaryStats.aktifPinjam} Aktif
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* KOLOM KIRI: INPUT BARANG KELUAR ATAU DIPINJAM (3 MODE TERPADU) */}
                <div className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-4 sm:p-5 shadow-xl space-y-4">
                  <div className="space-y-2 border-b border-emerald-800/70 pb-3">
                    <h3 className="text-xs font-extrabold text-[#f3d266] uppercase tracking-wider">
                      Pilih Jenis Penginputan Bagian Bawah
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#02100a] border border-emerald-800/80">
                      <button
                        type="button"
                        onClick={() => setKeluarInputMode('keluar')}
                        className={`py-2 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          keluarInputMode === 'keluar'
                            ? 'bg-rose-600 text-white shadow'
                            : 'text-emerald-200/75 hover:text-white'
                        }`}
                      >
                        Keluar (-)
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeluarInputMode('pinjam_internal')}
                        className={`py-2 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          keluarInputMode === 'pinjam_internal'
                            ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] shadow'
                            : 'text-emerald-200/75 hover:text-white'
                        }`}
                      >
                        Dipinjam
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeluarInputMode('ajukan_sekretaris')}
                        className={`py-2 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          keluarInputMode === 'ajukan_sekretaris'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-emerald-200/75 hover:text-white'
                        }`}
                      >
                        Ajukan Surat
                      </button>
                    </div>
                  </div>

                  {/* MODE 1: FORM INPUT BARANG KELUAR (-) */}
                  {keluarInputMode === 'keluar' && (
                    <form onSubmit={handleSimpanBarangKeluar} className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-rose-300 mb-1">
                          1. Pilih Barang yang Keluar
                        </label>
                        <select
                          value={effectiveKeluarBarangId}
                          onChange={(e) =>
                            setKeluarForm({ ...keluarForm, barangId: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-700/80 focus:border-rose-400 text-xs text-white font-semibold focus:outline-none"
                        >
                          {barangInventaris.length === 0 ? (
                            <option value="">Belum ada barang di inventaris</option>
                          ) : (
                            barangInventaris.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.namaBarang} — Stok: {b.jumlah} {b.satuan} ({b.lokasi})
                              </option>
                            ))
                          )}
                        </select>

                        {selectedKeluarBarang && (
                          <div className="mt-2 rounded-xl bg-[#02100a] border border-emerald-800/80 p-2.5 space-y-2">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-bold text-white truncate">
                                {selectedKeluarBarang.namaBarang}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-300/80 shrink-0">
                                Min: {stokKeluarMin} {selectedKeluarBarang.satuan}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="rounded-lg bg-[#041d14] p-1.5">
                                <span className="block text-[9px] font-mono uppercase text-emerald-300/75">
                                  Stok Tersedia
                                </span>
                                <span className="text-xs font-extrabold font-mono text-white">
                                  {stokKeluarNow} {selectedKeluarBarang.satuan}
                                </span>
                              </div>
                              <div
                                className={`rounded-lg p-1.5 border ${
                                  isKeluarStokKurang
                                    ? 'bg-rose-950/80 border-rose-500/60'
                                    : isKeluarAkanKritis
                                      ? 'bg-amber-950/70 border-amber-500/50'
                                      : 'bg-[#041d14] border-rose-500/35'
                                }`}
                              >
                                <span className="block text-[9px] font-mono uppercase text-rose-200/85">
                                  Sisa Setelah Keluar
                                </span>
                                <span
                                  className={`text-xs font-extrabold font-mono ${
                                    isKeluarStokKurang
                                      ? 'text-rose-300'
                                      : isKeluarAkanKritis
                                        ? 'text-amber-300'
                                        : 'text-[#f3d266]'
                                  }`}
                                >
                                  {isKeluarStokKurang
                                    ? 'Stok Kurang!'
                                    : `${estimasiKeluarAkhir} ${selectedKeluarBarang.satuan}`}
                                </span>
                              </div>
                            </div>
                            {isKeluarStokKurang && (
                              <p className="text-[11px] text-rose-300 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  Jumlah keluar ({qtyKeluar}) melebihi stok ({stokKeluarNow}).
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-mono uppercase text-rose-300">
                            2. Jumlah Keluar ({selectedKeluarBarang?.satuan || 'Unit'})
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 5, 10].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  setKeluarForm((prev) => ({ ...prev, jumlah: preset }))
                                }
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border cursor-pointer ${
                                  Number(keluarForm.jumlah) === preset
                                    ? 'bg-rose-500 text-white border-rose-300'
                                    : 'bg-[#02100a] text-emerald-200 border-emerald-800 hover:border-rose-400'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setKeluarForm((prev) => ({
                                ...prev,
                                jumlah: Math.max(1, (Number(prev.jumlah) || 1) - 1),
                              }))
                            }
                            className="w-9 h-9 rounded-xl bg-[#02100a] hover:bg-rose-950 border border-emerald-800 text-white font-extrabold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            required
                            value={keluarForm.jumlah}
                            onChange={(e) =>
                              setKeluarForm({
                                ...keluarForm,
                                jumlah: Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-[#03160f] border border-rose-500/45 text-sm text-rose-300 font-mono font-extrabold text-center focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setKeluarForm((prev) => ({
                                ...prev,
                                jumlah: Math.max(1, (Number(prev.jumlah) || 0) + 1),
                              }))
                            }
                            className="w-9 h-9 rounded-xl bg-[#02100a] hover:bg-emerald-900 border border-emerald-800 text-white font-extrabold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-rose-300 mb-1">
                            3. Tanggal Keluar
                          </label>
                          <input
                            type="date"
                            required
                            value={keluarForm.tanggal}
                            onChange={(e) =>
                              setKeluarForm({ ...keluarForm, tanggal: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-rose-300 mb-1">
                            4. Petugas Pencatat
                          </label>
                          <input
                            type="text"
                            required
                            value={keluarForm.petugas}
                            onChange={(e) =>
                              setKeluarForm({ ...keluarForm, petugas: e.target.value })
                            }
                            placeholder="Nama Petugas..."
                            className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono uppercase text-rose-300">
                          5. Keterangan / Tujuan Keluar
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {quickKeluarChips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() =>
                                setKeluarForm((prev) => ({ ...prev, keterangan: chip }))
                              }
                              className={`px-2 py-0.5 rounded-lg text-[10px] border cursor-pointer ${
                                keluarForm.keterangan === chip
                                  ? 'bg-rose-500/25 border-rose-400 text-rose-200 font-bold'
                                  : 'bg-[#02100a] border-emerald-800/80 text-emerald-200/75 hover:text-white'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Tujuan distribusi / catatan keluar..."
                          value={keluarForm.keterangan}
                          onChange={(e) =>
                            setKeluarForm({ ...keluarForm, keterangan: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedKeluarBarang || isKeluarStokKurang || qtyKeluar <= 0}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs shadow-lg cursor-pointer disabled:opacity-45 flex items-center justify-center gap-1.5"
                      >
                        <TrendingDown className="w-4 h-4" />
                        <span>Simpan Barang Keluar (-) &amp; Kurangi Stok</span>
                      </button>
                    </form>
                  )}

                  {/* MODE 2: FORM INPUT BARANG DIPINJAM (INTERNAL) */}
                  {keluarInputMode === 'pinjam_internal' && (
                    <form onSubmit={handleSimpanPeminjaman} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#f3d266] mb-1">
                          Pilih Barang yang Dipinjam
                        </label>
                        <select
                          value={effectivePinjamBarangId}
                          onChange={(e) =>
                            setPinjamForm({ ...pinjamForm, barangId: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-semibold"
                        >
                          {barangInventaris.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.namaBarang} (Tersedia: {b.jumlah} {b.satuan})
                            </option>
                          ))}
                        </select>
                        {selectedPinjamBarang && (
                          <p className="text-[10px] font-mono text-emerald-300/80 mt-1">
                            Lokasi: {selectedPinjamBarang.lokasi} · Stok Tersedia:{' '}
                            {selectedPinjamBarang.jumlah} {selectedPinjamBarang.satuan}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Nama Peminjam (Siapa) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nama peminjam / penanggung jawab..."
                          value={pinjamForm.peminjamNama}
                          onChange={(e) =>
                            setPinjamForm({ ...pinjamForm, peminjamNama: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Bagian / Divisi
                          </label>
                          <input
                            type="text"
                            value={pinjamForm.peminjamBagian}
                            onChange={(e) =>
                              setPinjamForm({ ...pinjamForm, peminjamBagian: e.target.value })
                            }
                            placeholder="Divisi / Kamar..."
                            className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Jumlah Unit
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={pinjamForm.jumlahPinjam}
                            onChange={(e) =>
                              setPinjamForm({
                                ...pinjamForm,
                                jumlahPinjam: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Tanggal Pinjam
                          </label>
                          <input
                            type="date"
                            value={pinjamForm.tanggalPinjam}
                            onChange={(e) =>
                              setPinjamForm({ ...pinjamForm, tanggalPinjam: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Batas Kembali
                          </label>
                          <input
                            type="date"
                            value={pinjamForm.batasKembali}
                            onChange={(e) =>
                              setPinjamForm({ ...pinjamForm, batasKembali: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Keperluan Peminjaman..."
                        value={pinjamForm.keperluan}
                        onChange={(e) =>
                          setPinjamForm({ ...pinjamForm, keperluan: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                      />

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs cursor-pointer shadow-lg"
                      >
                        Catat Peminjaman Barang (Dipinjam)
                      </button>
                    </form>
                  )}

                  {/* MODE 3: AJUKAN PEMINJAMAN KE SEKRETARIS (OTOMATIS CETAK SURAT) */}
                  {keluarInputMode === 'ajukan_sekretaris' && (
                    <form onSubmit={handleAjukanPeminjamanKeSekretaris} className="space-y-3">
                      <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                        Data pengajuan otomatis masuk ke Notifikasi &amp; Arsip Surat (SPp) pada{' '}
                        <strong>Dashboard Sekretaris</strong> agar siap dicetak.
                      </p>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Nama Barang *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Sound System / Tenda..."
                          value={pengajuanPinjamForm.namaBarang}
                          onChange={(e) =>
                            setPengajuanPinjamForm({
                              ...pengajuanPinjamForm,
                              namaBarang: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Pinjam Ke (Instansi / Pihak) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: DKM Masjid Agung / Desa..."
                          value={pengajuanPinjamForm.pinjamKe}
                          onChange={(e) =>
                            setPengajuanPinjamForm({
                              ...pengajuanPinjamForm,
                              pinjamKe: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Mulai
                          </label>
                          <input
                            type="date"
                            required
                            value={pengajuanPinjamForm.mulai}
                            onChange={(e) =>
                              setPengajuanPinjamForm({
                                ...pengajuanPinjamForm,
                                mulai: e.target.value,
                              })
                            }
                            className="w-full px-2 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-[11px] text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Batas
                          </label>
                          <input
                            type="date"
                            required
                            value={pengajuanPinjamForm.batasAkhir}
                            onChange={(e) =>
                              setPengajuanPinjamForm({
                                ...pengajuanPinjamForm,
                                batasAkhir: e.target.value,
                              })
                            }
                            className="w-full px-2 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-[11px] text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Unit
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={pengajuanPinjamForm.jumlah}
                            onChange={(e) =>
                              setPengajuanPinjamForm({
                                ...pengajuanPinjamForm,
                                jumlah: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Keperluan Acara / Operasional..."
                        value={pengajuanPinjamForm.keperluan}
                        onChange={(e) =>
                          setPengajuanPinjamForm({
                            ...pengajuanPinjamForm,
                            keperluan: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Pengajuan Pinjam ke Sekretaris</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* KOLOM KANAN: TABEL BARANG KELUAR & TABEL BARANG DIPINJAM */}
                <div className="lg:col-span-8 space-y-5">
                  {/* TABEL 2A: TABEL RIWAYAT BARANG KELUAR (-) */}
                  <div className="rounded-2xl bg-[#041d14]/95 border border-rose-500/35 p-4 sm:p-5 shadow-xl space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-800/70 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-rose-300" />
                          <span>Tabel Riwayat Barang Keluar (-)</span>
                        </h3>
                        <p className="text-[11px] text-emerald-200/75">
                          Menampilkan khusus barang yang keluar / terpakai dari gudang inventaris.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadMutasiByTipeWord('Keluar')}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Word Keluar (.doc)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-7 relative">
                        <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari barang keluar, petugas, keterangan..."
                          value={searchKeluar}
                          onChange={(e) => setSearchKeluar(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-5 flex items-center gap-1.5">
                        <input
                          type="month"
                          value={filterKeluarBulan === 'ALL' ? '' : filterKeluarBulan}
                          onChange={(e) => setFilterKeluarBulan(e.target.value || 'ALL')}
                          className="flex-1 px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-[#f3d266] font-mono"
                        />
                        {(filterKeluarBulan !== 'ALL' || searchKeluar.trim() !== '') && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilterKeluarBulan('ALL');
                              setSearchKeluar('');
                            }}
                            className="p-2 rounded-xl bg-[#03160f] border border-emerald-800 text-emerald-200 cursor-pointer"
                            title="Reset Filter Keluar"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-emerald-800/70 bg-[#03160f]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-rose-300 bg-[#02100a]">
                            <th className="py-2.5 px-3 text-center w-10">No</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                            <th className="py-2.5 px-3 min-w-[170px]">Nama Barang &amp; Lokasi</th>
                            <th className="py-2.5 px-3 text-center whitespace-nowrap">Jumlah Keluar</th>
                            <th className="py-2.5 px-3 text-center whitespace-nowrap">Stok Kini</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Petugas</th>
                            <th className="py-2.5 px-3 min-w-[150px]">Keterangan</th>
                            <th className="py-2.5 px-3 text-right w-14">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-900/50">
                          {filteredKeluarList.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 px-4 text-center text-emerald-200/70">
                                Belum ada data barang keluar sesuai filter. Catat melalui mode Keluar (-) di sebelah kiri.
                              </td>
                            </tr>
                          ) : (
                            filteredKeluarList.map((m, idx) => {
                              const meta = barangByIdMap.get(m.barangId);
                              return (
                                <tr
                                  key={m.id}
                                  className="hover:bg-[#06281c]/60 odd:bg-[#03160f] even:bg-[#02120c]/60 align-middle"
                                >
                                  <td className="py-2.5 px-3 text-center font-mono text-emerald-300/80">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[#f3d266] whitespace-nowrap">
                                    {m.tanggal}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-white">{m.namaBarang}</div>
                                    {meta && (
                                      <div className="text-[10px] font-mono text-emerald-300/75">
                                        {meta.kodeBarang} · {meta.lokasi}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/40 font-mono font-extrabold tabular-nums text-[11px]">
                                      -{m.jumlah} {m.satuan}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-emerald-100 whitespace-nowrap tabular-nums">
                                    {meta ? `${meta.jumlah} ${meta.satuan}` : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-emerald-200 whitespace-nowrap">
                                    {m.petugas}
                                  </td>
                                  <td className="py-2.5 px-3 text-emerald-200/85 leading-snug">
                                    {m.keterangan || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleHapusMutasiOption(m.id, m.namaBarang)}
                                      className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/35 cursor-pointer"
                                      title="Hapus Riwayat Keluar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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

                  {/* TABEL 2B: TABEL BARANG DIPINJAM (PEMINJAMAN INTERNAL & SURAT SEKRETARIS) */}
                  <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-4 sm:p-5 shadow-xl space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-800/70 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                          <FileSignature className="w-4 h-4 text-[#f3d266]" />
                          <span>Tabel Daftar Barang Dipinjam ({filteredPeminjamanList.length})</span>
                        </h3>
                        <p className="text-[11px] text-emerald-200/75">
                          Daftar barang yang sedang dipinjam maupun sudah dikembalikan beserta tombol Cetak Surat.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-7 relative">
                        <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari kode, nama barang, peminjam, keperluan..."
                          value={searchPinjam}
                          onChange={(e) => setSearchPinjam(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <select
                          value={filterPinjamStatus}
                          onChange={(e) =>
                            setFilterPinjamStatus(e.target.value as any)
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-semibold"
                        >
                          <option value="ALL">Semua Status ({peminjamanBarang.length})</option>
                          <option value="Dipinjam">
                            Sedang Dipinjam ({mutasiSummaryStats.aktifPinjam})
                          </option>
                          <option value="Dikembalikan">
                            Sudah Dikembalikan ({mutasiSummaryStats.selesaiPinjam})
                          </option>
                          <option value="Terlambat">Terlambat</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-emerald-800/70 bg-[#03160f]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02100a]">
                            <th className="py-2.5 px-3 text-center w-10">No</th>
                            <th className="py-2.5 px-3 min-w-[165px]">Barang &amp; Kode</th>
                            <th className="py-2.5 px-3 min-w-[175px]">Peminjam &amp; Keperluan</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Jadwal Pinjam</th>
                            <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                            <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi &amp; Surat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-900/50">
                          {filteredPeminjamanList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 px-4 text-center text-emerald-200/70">
                                Belum ada data barang dipinjam sesuai filter.
                              </td>
                            </tr>
                          ) : (
                            filteredPeminjamanList.map((p, idx) => (
                              <tr
                                key={p.id}
                                className="hover:bg-[#06281c]/60 odd:bg-[#03160f] even:bg-[#02120c]/60 align-middle"
                              >
                                <td className="py-2.5 px-3 text-center font-mono text-emerald-300/80">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-block px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] text-[10px] font-mono font-bold mb-1">
                                    {p.kodePeminjaman}
                                  </span>
                                  <div className="font-bold text-white">
                                    {p.namaBarang}{' '}
                                    <span className="text-[#f3d266] font-mono">
                                      ({p.jumlahPinjam} Unit)
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-emerald-200">
                                    {p.peminjamNama}
                                  </div>
                                  <div className="text-[11px] text-emerald-300/75">
                                    {p.peminjamBagian} · {p.keperluan}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                                  <div className="text-[#f3d266]">Pinjam: {p.tanggalPinjam}</div>
                                  <div className="text-emerald-200/80">Batas: {p.batasKembali}</div>
                                  {p.tanggalAktualKembali && (
                                    <div className="text-emerald-300">
                                      Kembali: {p.tanggalAktualKembali}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                                      p.status === 'Dikembalikan'
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                        : p.status === 'Terlambat'
                                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleCetakSuratPeminjaman(p)}
                                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow"
                                      title="Cetak Surat Peminjaman"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Surat</span>
                                    </button>
                                    {p.status === 'Dipinjam' && (
                                      <button
                                        type="button"
                                        onClick={() => handleKembalikanPinjaman(p)}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                                      >
                                        Dikembalikan
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* SISTEM PEMINJAMAN BARANG RESMI BERBASIS VERIFIKASI KETUA PONDOK,   */}
              {/* QR CODE PENGEMBALIAN & OPTION PANEL FORMAT SURAT (FIREBASE CLOUD) */}
              {/* ================================================================= */}
              <div className="mt-6 pt-6 border-t-2 border-[#d4af37]/35 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/45 text-[#f3d266] text-[10px] font-mono font-bold uppercase tracking-wider">
                      SINKRON REAL-TIME FIREBASE · PEMINJAMAN RESMI &amp; QR PENGEMBALIAN
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                      Sistem Peminjaman Barang Perlengkapan (Verifikasi Ketua Pondok &amp; QR Code)
                    </h3>
                    <p className="text-xs text-emerald-200/80">
                      Ajukan peminjaman multi-barang, ACC oleh Ketua Pondok, cetak surat resmi ber-QR, dan verifikasi pengembalian via Scan QR.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsScanQRModalOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#02120a] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>Scan QR Pengembalian Barang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOptionSuratModalOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-[#02100a] hover:bg-[#06281c] border border-[#d4af37]/60 text-[#f3d266] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 shrink-0" />
                      <span>⚙️ Option Panel Format Surat</span>
                    </button>
                  </div>
                </div>

                {/* Status Ringkas Peminjaman Real-Time */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-3">
                    <p className="text-[10px] font-mono uppercase text-amber-300">
                      Menunggu Acc Ketua
                    </p>
                    <p className="text-xl font-extrabold font-mono text-amber-300 tabular-nums mt-0.5">
                      {cloudPinjamStats.menunggu}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-950/50 border border-emerald-500/40 p-3">
                    <p className="text-[10px] font-mono uppercase text-emerald-300">
                      Disetujui (Siap Cetak)
                    </p>
                    <p className="text-xl font-extrabold font-mono text-emerald-300 tabular-nums mt-0.5">
                      {cloudPinjamStats.disetujui}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-sky-950/45 border border-sky-500/40 p-3">
                    <p className="text-[10px] font-mono uppercase text-sky-300">
                      Sudah Dikembalikan
                    </p>
                    <p className="text-xl font-extrabold font-mono text-sky-300 tabular-nums mt-0.5">
                      {cloudPinjamStats.dikembalikan}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-950/40 border border-rose-500/40 p-3">
                    <p className="text-[10px] font-mono uppercase text-rose-300">Ditolak</p>
                    <p className="text-xl font-extrabold font-mono text-rose-300 tabular-nums mt-0.5">
                      {cloudPinjamStats.ditolak}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* FORM AJUKAN PEMINJAMAN BARANG (MULTI-BARIS) */}
                  <form
                    onSubmit={handleSubmitPeminjamanCloud}
                    className="xl:col-span-5 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/50 p-4 sm:p-5 shadow-xl space-y-3.5"
                  >
                    <div className="border-b border-emerald-800/70 pb-2.5">
                      <h4 className="text-sm font-extrabold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                        <FileSignature className="w-4 h-4 shrink-0" />
                        <span>Form Ajukan Peminjaman Barang</span>
                      </h4>
                      <p className="text-[11px] text-emerald-200/75 mt-0.5">
                        Status awal otomatis Menunggu Verifikasi Ketua Pondok &amp; tersinkronisasi real-time.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        Nama Peminjam *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap peminjam..."
                        value={cloudPinjamForm.namaPeminjam}
                        onChange={(e) =>
                          setCloudPinjamForm({ ...cloudPinjamForm, namaPeminjam: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 focus:border-[#d4af37] text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Status / Divisi / Kamar *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Cth: Santri Kamar Al-Falah / Div. Acara"
                          value={cloudPinjamForm.statusDivisiKamar}
                          onChange={(e) =>
                            setCloudPinjamForm({
                              ...cloudPinjamForm,
                              statusDivisiKamar: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 focus:border-[#d4af37] text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Nomor HP / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0812xxxxxxxx"
                          value={cloudPinjamForm.nomorHp}
                          onChange={(e) =>
                            setCloudPinjamForm({ ...cloudPinjamForm, nomorHp: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 focus:border-[#d4af37] text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Tanggal Pinjam *
                        </label>
                        <input
                          type="date"
                          required
                          value={cloudPinjamForm.tanggalPinjam}
                          onChange={(e) =>
                            setCloudPinjamForm({
                              ...cloudPinjamForm,
                              tanggalPinjam: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-rose-300 mb-1">
                          Estimasi Tanggal Kembali *
                        </label>
                        <input
                          type="date"
                          required
                          value={cloudPinjamForm.estimasiTanggalKembali}
                          onChange={(e) =>
                            setCloudPinjamForm({
                              ...cloudPinjamForm,
                              estimasiTanggalKembali: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        Keperluan / Keterangan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Cth: Kegiatan Haflah / Pengajian Bulanan..."
                        value={cloudPinjamForm.keperluan}
                        onChange={(e) =>
                          setCloudPinjamForm({ ...cloudPinjamForm, keperluan: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white focus:outline-none"
                      />
                    </div>

                    {/* DAFTAR RINCIAN BARANG DINAMIS */}
                    <div className="rounded-2xl bg-[#02100a] border border-emerald-800/80 p-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-mono uppercase font-bold text-[#f3d266]">
                          Daftar Rincian Barang ({rincianBarangRows.length} Baris) *
                        </label>
                        <button
                          type="button"
                          onClick={handleAddRincianBarangRow}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Barang</span>
                        </button>
                      </div>

                      <datalist id="perlengkapan-inventaris-datalist">
                        {barangInventaris.map((inv) => (
                          <option key={inv.id} value={inv.namaBarang} />
                        ))}
                      </datalist>

                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                        {rincianBarangRows.map((row, idx) => (
                          <div
                            key={row.id}
                            className="p-2.5 rounded-xl bg-[#041d14] border border-emerald-800/70 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                                Barang #{idx + 1}
                              </span>
                              {rincianBarangRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRincianBarangRow(row.id)}
                                  className="text-rose-300 hover:text-rose-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus Baris</span>
                                </button>
                              )}
                            </div>

                            <input
                              type="text"
                              required
                              list="perlengkapan-inventaris-datalist"
                              placeholder="Pilih atau ketik nama barang..."
                              value={row.namaBarang}
                              onChange={(e) => {
                                const val = e.target.value;
                                const matched = barangInventaris.find(
                                  (b) => b.namaBarang.toLowerCase() === val.trim().toLowerCase()
                                );
                                handleUpdateRincianBarangRow(row.id, {
                                  namaBarang: val,
                                  ...(matched ? { satuan: matched.satuan } : {}),
                                });
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white"
                            />

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[9px] font-mono text-emerald-300/80 mb-0.5">
                                  Jumlah
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={row.jumlah}
                                  onChange={(e) =>
                                    handleUpdateRincianBarangRow(row.id, {
                                      jumlah: Math.max(1, Number(e.target.value) || 1),
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-mono text-center"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-emerald-300/80 mb-0.5">
                                  Satuan/Unit
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={row.satuan}
                                  onChange={(e) =>
                                    handleUpdateRincianBarangRow(row.id, {
                                      satuan: e.target.value,
                                    })
                                  }
                                  placeholder="Unit/Set"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-emerald-300/80 mb-0.5">
                                  Kondisi Awal
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={row.kondisiAwal}
                                  onChange={(e) =>
                                    handleUpdateRincianBarangRow(row.id, {
                                      kondisiAwal: e.target.value,
                                    })
                                  }
                                  placeholder="Baik"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPeminjamanCloud}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold text-xs shadow-lg cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isSubmittingPeminjamanCloud ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>
                        {isSubmittingPeminjamanCloud
                          ? 'Mengirim ke Firebase...'
                          : 'Ajukan Peminjaman (Verifikasi Ketua Pondok)'}
                      </span>
                    </button>
                  </form>

                  {/* DAFTAR VERIFIKASI KETUA PONDOK & STATUS PEMINJAMAN REAL-TIME */}
                  <div className="xl:col-span-7 rounded-2xl bg-[#041d14]/95 border border-emerald-700/50 p-4 sm:p-5 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-800/70 pb-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#f3d266]" />
                          <span>
                            Panel Verifikasi Ketua Pondok &amp; Daftar Peminjaman ({filteredCloudPeminjaman.length})
                          </span>
                        </h4>
                        <p className="text-[11px] text-emerald-200/75 mt-0.5">
                          Tombol Cetak Surat hanya muncul setelah Ketua Pondok menekan Verifikasi / ACC.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-7 relative">
                        <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama peminjam, divisi/kamar, nomor surat, barang..."
                          value={cloudSearchQuery}
                          onChange={(e) => setCloudSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <select
                          value={cloudStatusFilter}
                          onChange={(e) =>
                            setCloudStatusFilter(
                              e.target.value as 'ALL' | StatusPeminjamanPerlengkapan
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-semibold"
                        >
                          <option value="ALL">
                            Semua Status ({peminjamanCloudList.length})
                          </option>
                          <option value="Menunggu Verifikasi Ketua Pondok">
                            Menunggu Acc Ketua Pondok ({cloudPinjamStats.menunggu})
                          </option>
                          <option value="Disetujui">
                            Disetujui ({cloudPinjamStats.disetujui})
                          </option>
                          <option value="Sudah Dikembalikan">
                            Sudah Dikembalikan ({cloudPinjamStats.dikembalikan})
                          </option>
                          <option value="Ditolak">
                            Ditolak ({cloudPinjamStats.ditolak})
                          </option>
                        </select>
                      </div>
                    </div>

                    {isLoadingCloudPeminjaman ? (
                      <div className="py-10 text-center text-emerald-200/80 flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#f3d266]" />
                        <span className="text-xs font-mono">
                          Menghubungkan sinkronisasi real-time Firebase...
                        </span>
                      </div>
                    ) : filteredCloudPeminjaman.length === 0 ? (
                      <div className="py-10 px-4 text-center rounded-2xl bg-[#03160f] border border-emerald-900/70 text-emerald-200/70 text-xs">
                        Belum ada pengajuan peminjaman barang pada filter ini. Silakan ajukan melalui form di sebelah kiri.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredCloudPeminjaman.map((item) => {
                          const isPending =
                            item.status === 'Menunggu Verifikasi Ketua Pondok';
                          const isApproved = item.status === 'Disetujui';
                          const isReturned = item.status === 'Sudah Dikembalikan';
                          const isRejected = item.status === 'Ditolak';
                          const isBusy = processingVerifikasiId === item.id;

                          return (
                            <div
                              key={item.id}
                              className={`rounded-2xl p-4 border transition-all space-y-3 ${
                                isPending
                                  ? 'bg-amber-950/20 border-amber-500/50'
                                  : isApproved
                                    ? 'bg-emerald-950/35 border-emerald-500/50'
                                    : isReturned
                                      ? 'bg-sky-950/25 border-sky-500/45'
                                      : 'bg-rose-950/20 border-rose-500/45'
                              }`}
                            >
                              {/* Top Row: Nomor Surat + Status Badge */}
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-[#02100a] border border-[#d4af37]/40 text-[#f3d266] text-[10px] font-mono font-bold">
                                      {item.nomorSurat}
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-300/75">
                                      ID: {item.id}
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-extrabold text-white mt-1">
                                    {item.namaPeminjam}{' '}
                                    <span className="text-xs font-semibold text-emerald-200">
                                      ({item.statusDivisiKamar})
                                    </span>
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200/80 mt-0.5">
                                    <span className="inline-flex items-center gap-1 font-mono">
                                      <Phone className="w-3 h-3 text-[#f3d266]" />
                                      {item.nomorHp}
                                    </span>
                                    <span className="font-mono">
                                      Pinjam: <strong className="text-white">{item.tanggalPinjam}</strong>
                                    </span>
                                    <span className="font-mono">
                                      Est. Kembali:{' '}
                                      <strong className="text-amber-300">
                                        {item.estimasiTanggalKembali}
                                      </strong>
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[11px] font-extrabold">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Menunggu Acc Ketua Pondok</span>
                                    </span>
                                  )}
                                  {isApproved && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-[11px] font-extrabold">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Disetujui Ketua Pondok</span>
                                    </span>
                                  )}
                                  {isReturned && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-200 border border-sky-400/50 text-[11px] font-extrabold">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Sudah Dikembalikan</span>
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[11px] font-extrabold">
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Ditolak</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {item.keperluan && (
                                <p className="text-[11px] text-emerald-100/85 bg-[#02100a]/70 px-3 py-1.5 rounded-lg border border-emerald-900/70">
                                  Keperluan: {item.keperluan}
                                </p>
                              )}

                              {/* Daftar Rincian Barang */}
                              <div className="rounded-xl bg-[#02100a]/90 border border-emerald-900/70 p-2.5 space-y-1">
                                <p className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                                  Rincian Barang ({item.daftarBarang.length} Item):
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {item.daftarBarang.map((brg, bIdx) => (
                                    <div
                                      key={brg.id || bIdx}
                                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#041d14] border border-emerald-800/50 text-[11px]"
                                    >
                                      <span className="font-bold text-white truncate">
                                        {bIdx + 1}. {brg.namaBarang}
                                      </span>
                                      <span className="font-mono text-[#f3d266] shrink-0">
                                        {brg.jumlah} {brg.satuan} · {brg.kondisiAwal}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Info Verifikasi / Pengembalian */}
                              {(item.diverifikasiOleh || item.waktuKembali) && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-emerald-200/85">
                                  {item.diverifikasiOleh && (
                                    <span>
                                      Verifikasi: <strong className="text-white">{item.diverifikasiOleh}</strong>
                                      {item.waktuVerifikasi ? ` (${item.waktuVerifikasi})` : ''}
                                    </span>
                                  )}
                                  {item.waktuKembali && (
                                    <span className="text-sky-300 font-bold">
                                      Waktu Kembali: {item.waktuKembali}
                                      {item.petugasPengembalian
                                        ? ` · Petugas: ${item.petugasPengembalian}`
                                        : ''}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Action Bar: Pending -> Verifikasi/ACC & Tolak (NO PRINT BUTTON!); Approved -> Cetak Surat Peminjaman! */}
                              <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2">
                                {isPending && (
                                  <div className="flex-1 min-w-[200px] flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Catatan Ketua Pondok (opsional)..."
                                      value={catatanVerifikasiMap[item.id] || ''}
                                      onChange={(e) =>
                                        setCatatanVerifikasiMap((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-[11px] text-white focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        void handleVerifikasiKetuaPondok(item, 'Disetujui')
                                      }
                                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#02120a] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                      {isBusy ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      )}
                                      <span>Verifikasi / ACC Ketua Pondok</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        void handleVerifikasiKetuaPondok(item, 'Ditolak')
                                      }
                                      className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Tolak</span>
                                    </button>
                                  </div>
                                )}

                                {isApproved && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSuratPeminjaman(item)}
                                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#02120a] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                                    >
                                      <Printer className="w-4 h-4" />
                                      <span>Cetak Surat Peminjaman</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIsScanQRModalOpen(true)}
                                      className="px-3 py-2 rounded-xl bg-[#02100a] hover:bg-[#06281c] border border-emerald-500/50 text-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                      <span>Scan QR Kembali</span>
                                    </button>
                                  </div>
                                )}

                                {isReturned && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSuratPeminjaman(item)}
                                    className="px-3.5 py-2 rounded-xl bg-[#02100a] hover:bg-[#06281c] border border-sky-500/45 text-sky-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Lihat Arsip Surat</span>
                                  </button>
                                )}

                                {/* Hapus Data */}
                                <div className="ml-auto flex items-center gap-1.5">
                                  {confirmDeleteCloudId === item.id ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteCloudPeminjaman(item)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                                      >
                                        Ya, Hapus
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteCloudId(null)}
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-[11px] font-bold cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteCloudId(item.id)}
                                      className="p-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/35 cursor-pointer"
                                      title="Hapus Pengajuan Peminjaman"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      })()}

      {/* TAB 4: PENGAJUAN PEMBELIAN BARANG (TERHUBUNG KETUA PONDOK & BENDAHARA) */}
      {activeTab === 'pengajuan_pembelian' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSimpanPengajuanPembelian}
            className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#f3d266]" />
              Ajukan Pembelian Barang ke Ketua Pondok & Bendahara
            </h2>
            <input
              type="text"
              required
              placeholder="Judul Pengajuan Pembelian..."
              value={pengadaanForm.judul}
              onChange={(e) => setPengadaanForm({ ...pengadaanForm, judul: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <textarea
              rows={3}
              required
              placeholder="Rincian spesifikasi & jumlah barang yang diajukan..."
              value={pengadaanForm.deskripsi}
              onChange={(e) => setPengadaanForm({ ...pengadaanForm, deskripsi: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <input
              type="number"
              required
              placeholder="Estimasi Biaya (Rp)..."
              value={pengadaanForm.nominalEstimasi}
              onChange={(e) =>
                setPengadaanForm({ ...pengadaanForm, nominalEstimasi: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Kirim Pengajuan ke Ketua Pondok & Bendahara
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Status Pengajuan Pembelian Barang (Persetujuan Ketua Pondok & Pencairan Bendahara)
            </h2>
            <div className="space-y-3">
              {pengajuanDivisi
                .filter((p) => p.divisi === 'Perlengkapan' || p.jenisPengajuan === 'Pengadaan Barang')
                .map((pgj) => (
                  <div
                    key={pgj.id}
                    className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#f3d266] font-bold">
                        {pgj.nomorPengajuan} · {pgj.tanggal}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                        Status: {pgj.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{pgj.judul}</h3>
                    <p className="text-xs text-emerald-100/80">{pgj.deskripsi}</p>
                    {pgj.nominalEstimasi ? (
                      <p className="text-xs font-mono font-bold text-[#f3d266]">
                        Estimasi Anggaran: {formatRupiah(pgj.nominalEstimasi)}
                      </p>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATA FASILITAS PER GEDUNG (FORMAT TABEL + EDITABLE + RINGKASAN + DOWNLOAD WORD) */}
      {(activeTab === 'kamar_santri' || activeTab === 'data_fasilitas') && (() => {
        const displayedGedungList =
          filterGedungId === 'ALL'
            ? fasilitasGedungList
            : fasilitasGedungList.filter((g) => g.id === filterGedungId);

        const totalJenisAll = fasilitasGedungList.reduce(
          (acc, g) => acc + g.daftarFasilitas.length,
          0
        );
        const totalUnitAll = fasilitasGedungList.reduce(
          (acc, g) =>
            acc + g.daftarFasilitas.reduce((s, f) => s + (Number(f.jumlah) || 0), 0),
          0
        );
        const totalBaikAll = fasilitasGedungList.reduce(
          (acc, g) => acc + g.daftarFasilitas.filter((f) => f.kondisi === 'Baik').length,
          0
        );
        const totalPerhatianAll = totalJenisAll - totalBaikAll;

        return (
          <div className="space-y-6">
            {/* Header Bar Data Fasilitas + Download Word + Kelola Gedung di Option Panel */}
            <div className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/45 p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#f3d266]" />
                  <span>Data Fasilitas Per Gedung ({fasilitasGedungList.length} Gedung)</span>
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Format tabel per gedung. Jumlah, kondisi, nama fasilitas, maupun nama gedung dapat diedit langsung, ditambah, atau dihapus.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterGedungId}
                  onChange={(e) => setFilterGedungId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-700/60 text-xs text-white font-semibold"
                >
                  <option value="ALL">Semua Gedung ({fasilitasGedungList.length})</option>
                  {fasilitasGedungList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.namaGedung}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleDownloadFasilitasWord}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File Word (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOptionSection('gedung_fasilitas');
                    setActiveTab('option_perlengkapan');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#03160f] hover:bg-[#073021] text-[#f3d266] border border-[#d4af37]/45 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tambah / Edit / Hapus Gedung</span>
                </button>
              </div>
            </div>

            {/* Tabel Data Fasilitas Per Gedung */}
            {displayedGedungList.length === 0 ? (
              <div className="rounded-3xl bg-[#041d14]/95 border border-emerald-800/70 p-8 text-center space-y-3">
                <p className="text-sm text-emerald-200/80">
                  Belum ada data gedung terdaftar. Tambahkan gedung melalui <strong>Option Panel Perlengkapan</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOptionSection('gedung_fasilitas');
                    setActiveTab('option_perlengkapan');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buka Option Panel &amp; Tambah Gedung</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedGedungList.map((gedung) => {
                  const totalUnitGedung = gedung.daftarFasilitas.reduce(
                    (sum, f) => sum + (Number(f.jumlah) || 0),
                    0
                  );
                  const baikGedung = gedung.daftarFasilitas.filter((f) => f.kondisi === 'Baik').length;
                  const perbaikanGedung = gedung.daftarFasilitas.filter(
                    (f) => f.kondisi === 'Perlu Perbaikan'
                  ).length;
                  const rusakGedung = gedung.daftarFasilitas.filter(
                    (f) => f.kondisi === 'Rusak'
                  ).length;
                  const addDraft = newFasilitasMap[gedung.id] || {
                    namaFasilitas: '',
                    jumlah: 1,
                    satuan: perlengkapanCfg.satuanList?.[0] || 'Unit',
                    kondisi: 'Baik' as const,
                    keterangan: '',
                  };
                  const isEditingName = editingGedungId === gedung.id;

                  return (
                    <div
                      key={gedung.id}
                      className="rounded-3xl bg-[#041d14]/95 border border-emerald-700/50 p-5 shadow-xl space-y-4"
                    >
                      {/* Header Gedung (Nama Gedung Editable + Download Word Per Gedung) */}
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-emerald-800/70 pb-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3d266]">
                            <Building2 className="w-4 h-4" />
                          </div>
                          {isEditingName ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingGedungNama}
                                onChange={(e) => setEditingGedungNama(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSimpanNamaGedungInline(gedung.id);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-[#d4af37] text-xs font-bold text-white"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSimpanNamaGedungInline(gedung.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGedungId(null)}
                                className="p-1.5 rounded-xl bg-rose-950/70 text-rose-300 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-extrabold text-white">
                                {gedung.namaGedung}
                              </h3>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGedungId(gedung.id);
                                  setEditingGedungNama(gedung.namaGedung);
                                }}
                                className="px-2 py-1 rounded-lg bg-[#03160f] hover:bg-[#073021] text-[#f3d266] border border-[#d4af37]/35 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                title="Edit Nama Gedung"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit Nama</span>
                              </button>
                            </div>
                          )}
                          {gedung.kategoriGedung && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[10px] font-mono">
                              {gedung.kategoriGedung}
                            </span>
                          )}
                          {gedung.penanggungJawab && (
                            <span className="text-[11px] text-emerald-200/75">
                              PJ: <strong className="text-emerald-100">{gedung.penanggungJawab}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-[#03160f] border border-emerald-800 text-emerald-200">
                            {gedung.daftarFasilitas.length} Jenis
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3d266] font-bold">
                            Total: {totalUnitGedung} Unit
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                            Baik: {baikGedung}
                          </span>
                          {(perbaikanGedung > 0 || rusakGedung > 0) && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/45 text-amber-300">
                              Perhatian: {perbaikanGedung + rusakGedung}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadWordPerGedung(gedung)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold text-[11px] font-sans inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                            title={`Download File Word Fasilitas ${gedung.namaGedung}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Word</span>
                          </button>
                        </div>
                      </div>

                      {/* Form Cepat Tambah Fasilitas di Gedung Ini */}
                      <div className="p-3 rounded-2xl bg-[#03160f] border border-emerald-800/60 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-mono uppercase text-[#f3d266] mb-1">
                            Tambah Fasilitas Baru
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Lampu LED, Sound, Microphone..."
                            value={addDraft.namaFasilitas}
                            onChange={(e) =>
                              setNewFasilitasMap((prev) => ({
                                ...prev,
                                [gedung.id]: { ...addDraft, namaFasilitas: e.target.value },
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleTambahFasilitasKeGedung(gedung.id);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Jumlah
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={addDraft.jumlah}
                            onChange={(e) =>
                              setNewFasilitasMap((prev) => ({
                                ...prev,
                                [gedung.id]: { ...addDraft, jumlah: Number(e.target.value) },
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Satuan
                          </label>
                          <select
                            value={addDraft.satuan}
                            onChange={(e) =>
                              setNewFasilitasMap((prev) => ({
                                ...prev,
                                [gedung.id]: { ...addDraft, satuan: e.target.value },
                              }))
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white"
                          >
                            {(perlengkapanCfg.satuanList || ['Unit', 'Set', 'Buah']).map((sat) => (
                              <option key={sat} value={sat}>
                                {sat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                            Kondisi
                          </label>
                          <select
                            value={addDraft.kondisi}
                            onChange={(e) =>
                              setNewFasilitasMap((prev) => ({
                                ...prev,
                                [gedung.id]: { ...addDraft, kondisi: e.target.value as any },
                              }))
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white"
                          >
                            <option value="Baik">Baik</option>
                            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                            <option value="Rusak">Rusak</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={() => handleTambahFasilitasKeGedung(gedung.id)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs inline-flex items-center justify-center gap-1 cursor-pointer shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>

                      {/* Tabel Fasilitas Gedung Ini */}
                      <div className="overflow-x-auto rounded-2xl border border-emerald-800/60 bg-[#03160f]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02100a]">
                              <th className="py-2.5 px-3 text-center w-12">No</th>
                              <th className="py-2.5 px-3 min-w-[190px]">Nama Fasilitas</th>
                              <th className="py-2.5 px-3 w-44 text-center">Jumlah (Editable)</th>
                              <th className="py-2.5 px-3 w-28">Satuan</th>
                              <th className="py-2.5 px-3 w-40">Kondisi</th>
                              <th className="py-2.5 px-3 min-w-[170px]">Keterangan</th>
                              <th className="py-2.5 px-3 text-right w-24">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-900/50">
                            {gedung.daftarFasilitas.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-6 px-4 text-center text-emerald-200/65">
                                  Belum ada fasilitas di {gedung.namaGedung}. Gunakan form di atas untuk menambahkan fasilitas.
                                </td>
                              </tr>
                            ) : (
                              gedung.daftarFasilitas.map((item, idx) => {
                                const draft = fasilitasDraftMap[item.id] || {};
                                const namaVal = draft.namaFasilitas ?? item.namaFasilitas;
                                const jumlahVal =
                                  draft.jumlah !== undefined ? draft.jumlah : item.jumlah;
                                const ketVal = draft.keterangan ?? (item.keterangan || '');

                                return (
                                  <tr
                                    key={item.id}
                                    className="hover:bg-[#06281c]/55 odd:bg-[#03160f] even:bg-[#02120c]/60 align-middle"
                                  >
                                    <td className="py-2.5 px-3 text-center font-mono text-emerald-300 tabular-nums">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        value={namaVal}
                                        onChange={(e) =>
                                          setFasilitasDraftMap((prev) => ({
                                            ...prev,
                                            [item.id]: { ...prev[item.id], namaFasilitas: e.target.value },
                                          }))
                                        }
                                        onBlur={() => {
                                          if (
                                            draft.namaFasilitas !== undefined &&
                                            draft.namaFasilitas.trim() &&
                                            draft.namaFasilitas.trim() !== item.namaFasilitas
                                          ) {
                                            handleUpdateFasilitasItem(gedung.id, item.id, {
                                              namaFasilitas: draft.namaFasilitas.trim(),
                                            });
                                            notifyToast('Nama fasilitas diperbarui.');
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            (e.target as HTMLInputElement).blur();
                                          }
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800/80 focus:border-[#d4af37] text-xs font-bold text-white focus:outline-none"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextQty = Math.max(0, (Number(item.jumlah) || 0) - 1);
                                            setFasilitasDraftMap((prev) => ({
                                              ...prev,
                                              [item.id]: { ...prev[item.id], jumlah: nextQty },
                                            }));
                                            handleUpdateFasilitasItem(gedung.id, item.id, { jumlah: nextQty });
                                          }}
                                          className="w-7 h-7 rounded-lg bg-[#02100a] hover:bg-rose-950 text-emerald-200 hover:text-rose-200 border border-emerald-800 font-bold cursor-pointer"
                                          title="Kurangi 1"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min={0}
                                          value={jumlahVal}
                                          onChange={(e) => {
                                            const nextNum = Math.max(0, Number(e.target.value) || 0);
                                            setFasilitasDraftMap((prev) => ({
                                              ...prev,
                                              [item.id]: { ...prev[item.id], jumlah: nextNum },
                                            }));
                                          }}
                                          onBlur={() => {
                                            if (
                                              draft.jumlah !== undefined &&
                                              Number(draft.jumlah) !== item.jumlah
                                            ) {
                                              handleUpdateFasilitasItem(gedung.id, item.id, {
                                                jumlah: Math.max(0, Number(draft.jumlah) || 0),
                                              });
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              (e.target as HTMLInputElement).blur();
                                            }
                                          }}
                                          className="w-16 px-2 py-1.5 rounded-lg bg-[#02100a] border border-[#d4af37]/40 focus:border-[#f3d266] text-xs font-mono font-bold text-[#f3d266] text-center focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextQty = (Number(item.jumlah) || 0) + 1;
                                            setFasilitasDraftMap((prev) => ({
                                              ...prev,
                                              [item.id]: { ...prev[item.id], jumlah: nextQty },
                                            }));
                                            handleUpdateFasilitasItem(gedung.id, item.id, { jumlah: nextQty });
                                          }}
                                          className="w-7 h-7 rounded-lg bg-[#02100a] hover:bg-emerald-900 text-emerald-200 hover:text-white border border-emerald-800 font-bold cursor-pointer"
                                          title="Tambah 1"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">
                                      <select
                                        value={item.satuan}
                                        onChange={(e) =>
                                          handleUpdateFasilitasItem(gedung.id, item.id, {
                                            satuan: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-emerald-100"
                                      >
                                        {Array.from(
                                          new Set([
                                            ...(perlengkapanCfg.satuanList || ['Unit', 'Set', 'Buah']),
                                            item.satuan,
                                          ])
                                        ).map((sat) => (
                                          <option key={sat} value={sat}>
                                            {sat}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="py-2 px-3">
                                      <select
                                        value={item.kondisi}
                                        onChange={(e) =>
                                          handleUpdateFasilitasItem(gedung.id, item.id, {
                                            kondisi: e.target.value as FasilitasItemGedung['kondisi'],
                                          })
                                        }
                                        className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold ${
                                          item.kondisi === 'Baik'
                                            ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300'
                                            : item.kondisi === 'Perlu Perbaikan'
                                              ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                                              : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                                        }`}
                                      >
                                        <option value="Baik">Baik</option>
                                        <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                                        <option value="Rusak">Rusak</option>
                                      </select>
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        placeholder="Catatan kondisi..."
                                        value={ketVal}
                                        onChange={(e) =>
                                          setFasilitasDraftMap((prev) => ({
                                            ...prev,
                                            [item.id]: { ...prev[item.id], keterangan: e.target.value },
                                          }))
                                        }
                                        onBlur={() => {
                                          if (
                                            draft.keterangan !== undefined &&
                                            draft.keterangan !== (item.keterangan || '')
                                          ) {
                                            handleUpdateFasilitasItem(gedung.id, item.id, {
                                              keterangan: draft.keterangan.trim(),
                                            });
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            (e.target as HTMLInputElement).blur();
                                          }
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800/70 focus:border-[#d4af37] text-xs text-emerald-100 focus:outline-none"
                                      />
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleHapusFasilitasItem(gedung.id, item.id, item.namaFasilitas)
                                        }
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/75 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                        title="Hapus Fasilitas"
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
                          {gedung.daftarFasilitas.length > 0 && (
                            <tfoot>
                              <tr className="border-t border-emerald-800/80 bg-[#02100a] text-[11px] font-bold">
                                <td className="py-2.5 px-3 text-center font-mono text-[#f3d266]">∑</td>
                                <td className="py-2.5 px-3 text-emerald-100">
                                  Total {gedung.namaGedung} ({gedung.daftarFasilitas.length} Jenis)
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-[#f3d266] tabular-nums">
                                  {totalUnitGedung} Unit
                                </td>
                                <td className="py-2.5 px-3 text-emerald-300/75" colSpan={2}>
                                  <span className="text-emerald-300">Baik: {baikGedung}</span>
                                  {perbaikanGedung > 0 && (
                                    <span className="text-amber-300 ml-2.5">
                                      Perbaikan: {perbaikanGedung}
                                    </span>
                                  )}
                                  {rusakGedung > 0 && (
                                    <span className="text-rose-300 ml-2.5">Rusak: {rusakGedung}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right" colSpan={2}>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadWordPerGedung(gedung)}
                                    className="text-[11px] text-[#f3d266] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Ekspor Word {gedung.namaGedung}</span>
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
            )}

            {/* TABEL RINGKASAN DAFTAR SEMUA FASILITAS DI SETIAP GEDUNG */}
            <div className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/50 p-5 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#d4af37]/25 pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#f3d266]" />
                    <span>Tabel Ringkasan Daftar Semua Fasilitas di Setiap Gedung</span>
                  </h3>
                  <p className="text-xs text-emerald-200/75 mt-0.5">
                    Rekapitulasi terstruktur per gedung lengkap dengan kelayakan kondisi dan unduh dokumen Word per gedung maupun keseluruhan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadFasilitasWord}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Ringkasan Semua Gedung (.doc)</span>
                </button>
              </div>

              {/* Strip KPI Ringkas Rekap Sarpras */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-[#03160f] border border-emerald-800/70 px-3.5 py-2.5">
                  <span className="block text-[10px] font-mono uppercase text-emerald-300/80">
                    Total Gedung
                  </span>
                  <span className="text-lg font-extrabold font-mono text-white tabular-nums">
                    {fasilitasGedungList.length} Gedung
                  </span>
                </div>
                <div className="rounded-2xl bg-[#03160f] border border-emerald-800/70 px-3.5 py-2.5">
                  <span className="block text-[10px] font-mono uppercase text-emerald-300/80">
                    Total Jenis Fasilitas
                  </span>
                  <span className="text-lg font-extrabold font-mono text-white tabular-nums">
                    {totalJenisAll} Jenis
                  </span>
                </div>
                <div className="rounded-2xl bg-[#03160f] border border-[#d4af37]/40 px-3.5 py-2.5">
                  <span className="block text-[10px] font-mono uppercase text-[#f3d266]">
                    Total Kuantitas Unit
                  </span>
                  <span className="text-lg font-extrabold font-mono text-[#f3d266] tabular-nums">
                    {totalUnitAll} Unit
                  </span>
                </div>
                <div className="rounded-2xl bg-[#03160f] border border-emerald-700/60 px-3.5 py-2.5">
                  <span className="block text-[10px] font-mono uppercase text-emerald-300">
                    Kelayakan Kondisi Baik
                  </span>
                  <span className="text-lg font-extrabold font-mono text-emerald-300 tabular-nums">
                    {totalJenisAll > 0 ? Math.round((totalBaikAll / totalJenisAll) * 100) : 100}%{' '}
                    <span className="text-xs font-normal text-emerald-200/75">
                      ({totalBaikAll}/{totalJenisAll})
                    </span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/30 bg-[#03160f]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#d4af37]/30 text-[#f3d266] uppercase text-[10px] font-mono bg-[#02100a]">
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3 min-w-[175px]">Gedung &amp; Penanggung Jawab</th>
                      <th className="py-3 px-3 text-center w-28 whitespace-nowrap">Jenis &amp; Unit</th>
                      <th className="py-3 px-3 min-w-[300px]">Daftar Fasilitas &amp; Jumlah</th>
                      <th className="py-3 px-3 w-44 whitespace-nowrap">Status Kondisi</th>
                      <th className="py-3 px-3 text-center w-36 whitespace-nowrap">Download Word</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50">
                    {fasilitasGedungList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-4 text-center text-emerald-200/70">
                          Belum ada data gedung untuk diringkas.
                        </td>
                      </tr>
                    ) : (
                      fasilitasGedungList.map((g, idx) => {
                        const totalUnit = g.daftarFasilitas.reduce(
                          (s, f) => s + (Number(f.jumlah) || 0),
                          0
                        );
                        const baikCount = g.daftarFasilitas.filter((f) => f.kondisi === 'Baik').length;
                        const perbaikanCount = g.daftarFasilitas.filter(
                          (f) => f.kondisi === 'Perlu Perbaikan'
                        ).length;
                        const rusakCount = g.daftarFasilitas.filter(
                          (f) => f.kondisi === 'Rusak'
                        ).length;
                        const pctBaik =
                          g.daftarFasilitas.length > 0
                            ? Math.round((baikCount / g.daftarFasilitas.length) * 100)
                            : 100;

                        return (
                          <tr
                            key={g.id}
                            className="hover:bg-[#06281c]/55 odd:bg-[#03160f] even:bg-[#02120c]/60 align-top"
                          >
                            <td className="py-3.5 px-3 text-center font-mono text-emerald-300 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-3 space-y-1">
                              <div className="font-extrabold text-white text-xs sm:text-sm">
                                {g.namaGedung}
                              </div>
                              <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[10px] font-mono">
                                {g.kategoriGedung || 'Gedung'}
                              </div>
                              <div className="text-[11px] text-emerald-200/75">
                                PJ: <span className="text-emerald-100">{g.penanggungJawab || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <div className="text-sm font-mono font-extrabold text-[#f3d266] tabular-nums">
                                {totalUnit} Unit
                              </div>
                              <div className="text-[11px] font-mono text-emerald-200/80 mt-0.5 tabular-nums">
                                {g.daftarFasilitas.length} Jenis
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              {g.daftarFasilitas.length === 0 ? (
                                <span className="text-emerald-200/60 italic">Belum ada fasilitas</span>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {g.daftarFasilitas.map((f) => (
                                    <div
                                      key={f.id}
                                      className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg border text-[11px] ${
                                        f.kondisi === 'Baik'
                                          ? 'bg-[#02100a] border-emerald-800/80 text-emerald-100'
                                          : f.kondisi === 'Perlu Perbaikan'
                                            ? 'bg-amber-950/50 border-amber-500/45 text-amber-200'
                                            : 'bg-rose-950/50 border-rose-500/45 text-rose-200'
                                      }`}
                                    >
                                      <span className="truncate font-medium">{f.namaFasilitas}</span>
                                      <strong className="font-mono text-[#f3d266] shrink-0 tabular-nums">
                                        {f.jumlah} {f.satuan}
                                      </strong>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap text-[11px] font-mono space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-emerald-300">Baik: {baikCount}</span>
                                <span className="text-white font-bold">{pctBaik}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#02100a] overflow-hidden border border-emerald-900">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-[#d4af37]"
                                  style={{ width: `${pctBaik}%` }}
                                />
                              </div>
                              {(perbaikanCount > 0 || rusakCount > 0) && (
                                <div className="flex flex-wrap gap-1.5 text-[10px]">
                                  {perbaikanCount > 0 && (
                                    <span className="text-amber-300">Perbaikan: {perbaikanCount}</span>
                                  )}
                                  {rusakCount > 0 && (
                                    <span className="text-rose-300">Rusak: {rusakCount}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDownloadWordPerGedung(g)}
                                className="px-3 py-1.5 rounded-xl bg-[#02100a] hover:bg-[#d4af37] text-[#f3d266] hover:text-[#02120a] border border-[#d4af37]/50 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                title={`Download File Word untuk ${g.namaGedung}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Word (.doc)</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {fasilitasGedungList.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-[#d4af37]/40 bg-[#02100a] font-bold text-xs">
                        <td className="py-3 px-3 text-center font-mono text-[#f3d266]">∑</td>
                        <td className="py-3 px-3 text-[#f3d266]">
                          TOTAL KESELURUHAN ({fasilitasGedungList.length} GEDUNG)
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          <div className="text-[#f3d266]">{totalUnitAll} Unit</div>
                          <div className="text-[10px] text-white font-normal">{totalJenisAll} Jenis</div>
                        </td>
                        <td className="py-3 px-3 text-emerald-200/85">
                          Seluruh fasilitas tercatat pada semua gedung pondok pesantren
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]" colSpan={2}>
                          <span className="text-emerald-300">Baik: {totalBaikAll}</span>
                          {totalPerhatianAll > 0 && (
                            <span className="text-amber-300 ml-2.5">
                              Perhatian: {totalPerhatianAll}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 6: OPTION PANEL PERLENGKAPAN (KELOLA GEDUNG, UNIT, INVENTARIS, MUTASI, PEMINJAMAN & PENGAJUAN) */}
      {activeTab === 'option_perlengkapan' && (
        <div className="space-y-6">
          {/* Header & Sub-Navigasi Option Panel Perlengkapan */}
          <div className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/50 p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-800/70 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#f3d266]" />
                  <span>Option Panel Perlengkapan — Pengaturan &amp; Edit Semua Fitur</span>
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Tambah, ubah nama, kurangi, atau hapus Gedung Fasilitas, serta edit seluruh data Inventaris, Keluar Masuk Barang, Peminjaman, dan Pengajuan Pembelian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('kamar_santri')}
                className="px-3.5 py-2 rounded-xl bg-[#03160f] hover:bg-[#073021] text-emerald-200 border border-emerald-700/60 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Building2 className="w-3.5 h-3.5 text-[#f3d266]" />
                <span>Kembali ke Data Fasilitas</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'gedung_fasilitas', label: `1. Kelola Gedung & Fasilitas (${fasilitasGedungList.length})` },
                { id: 'pengaturan_umum', label: '2. Unit, Kategori & Kop Surat' },
                { id: 'edit_inventaris', label: `3. Edit Inventaris (${barangInventaris.length})` },
                { id: 'edit_mutasi', label: `4. Edit Keluar Masuk (${(systemConfig.mutasiBarangList || []).length})` },
                { id: 'edit_peminjaman_pengajuan', label: '5. Edit Peminjaman & Pengajuan' },
              ].map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setOptionSection(sec.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    optionSection === sec.id
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] border-[#f3d266] shadow-md'
                      : 'bg-[#03160f] text-emerald-200 hover:text-white border-emerald-800'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: KELOLA GEDUNG & DATA FASILITAS (TAMBAH, EDIT NAMA, HAPUS/KURANGI GEDUNG) */}
          {optionSection === 'gedung_fasilitas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleTambahGedungBaru}
                className="lg:col-span-4 rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/45 p-5 shadow-xl space-y-3 h-fit"
              >
                <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Tambah Gedung Baru</span>
                </h3>
                <p className="text-[11px] text-emerald-200/75">
                  Tambahkan gedung baru (misal: Gedung E, Gedung Tahfidz, Dapur Umum, dll).
                </p>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Nama Gedung *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gedung E (Asrama Tahfidz)"
                    value={newGedungForm.namaGedung}
                    onChange={(e) =>
                      setNewGedungForm({ ...newGedungForm, namaGedung: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Kategori Gedung
                  </label>
                  <input
                    type="text"
                    placeholder="Asrama Putra / Madrasah / Aula"
                    value={newGedungForm.kategoriGedung}
                    onChange={(e) =>
                      setNewGedungForm({ ...newGedungForm, kategoriGedung: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Penanggung Jawab Gedung
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Ustadz / Pengurus..."
                    value={newGedungForm.penanggungJawab}
                    onChange={(e) =>
                      setNewGedungForm({ ...newGedungForm, penanggungJawab: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-emerald-100 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newGedungForm.isiTemplateContoh}
                    onChange={(e) =>
                      setNewGedungForm({ ...newGedungForm, isiTemplateContoh: e.target.checked })
                    }
                    className="rounded border-emerald-700"
                  />
                  <span>Isi template awal (Lampu LED, Sound, Microphone)</span>
                </label>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs cursor-pointer shadow-lg"
                >
                  + Tambahkan Gedung ke Data Fasilitas
                </button>
              </form>

              <div className="lg:col-span-8 rounded-3xl bg-[#041d14]/95 border border-emerald-700/50 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Edit Nama Gedung / Kurangi / Hapus Gedung ({fasilitasGedungList.length})
                    </h3>
                    <p className="text-[11px] text-emerald-200/75">
                      Ubah nama gedung, kategori, atau penanggung jawab lalu klik Simpan, atau klik Hapus Gedung untuk mengurangi gedung.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-emerald-800/60 bg-[#03160f]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02100a]">
                        <th className="py-2.5 px-3 text-center w-10">No</th>
                        <th className="py-2.5 px-3 min-w-[190px]">Nama Gedung (Editable)</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Kategori</th>
                        <th className="py-2.5 px-3 min-w-[150px]">Penanggung Jawab</th>
                        <th className="py-2.5 px-3 text-center">Fasilitas</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Simpan / Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/50">
                      {fasilitasGedungList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 px-4 text-center text-emerald-200/70">
                            Tidak ada gedung terdaftar. Tambahkan gedung baru menggunakan form di samping.
                          </td>
                        </tr>
                      ) : (
                        fasilitasGedungList.map((g, idx) => {
                          const draft = optGedungDrafts[g.id] || {
                            namaGedung: g.namaGedung,
                            kategoriGedung: g.kategoriGedung || '',
                            penanggungJawab: g.penanggungJawab || '',
                          };
                          const hasChange = Boolean(optGedungDrafts[g.id]);
                          const totalUnit = g.daftarFasilitas.reduce(
                            (s, f) => s + (Number(f.jumlah) || 0),
                            0
                          );
                          return (
                            <tr key={g.id} className="hover:bg-[#06281c]/55 align-middle">
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-300">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={draft.namaGedung}
                                  onChange={(e) =>
                                    setOptGedungDrafts((prev) => ({
                                      ...prev,
                                      [g.id]: { ...draft, namaGedung: e.target.value },
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 focus:border-[#d4af37] text-xs font-bold text-white focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={draft.kategoriGedung}
                                  onChange={(e) =>
                                    setOptGedungDrafts((prev) => ({
                                      ...prev,
                                      [g.id]: { ...draft, kategoriGedung: e.target.value },
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 focus:border-[#d4af37] text-xs text-emerald-100 focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={draft.penanggungJawab}
                                  onChange={(e) =>
                                    setOptGedungDrafts((prev) => ({
                                      ...prev,
                                      [g.id]: { ...draft, penanggungJawab: e.target.value },
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 focus:border-[#d4af37] text-xs text-emerald-100 focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-[11px] text-[#f3d266] whitespace-nowrap">
                                {g.daftarFasilitas.length} jenis ({totalUnit} unit)
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={!hasChange}
                                    onClick={() => handleSimpanEditGedungOption(g)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                      hasChange
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        : 'bg-emerald-950/60 text-emerald-500/60 cursor-not-allowed'
                                    }`}
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleHapusGedung(g.id, g.namaGedung)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    title="Hapus Gedung"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
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
            </div>
          )}

          {/* SECTION 2: PENGATURAN UMUM UNIT, KATEGORI & KOP SURAT PERLENGKAPAN */}
          {optionSection === 'pengaturan_umum' && (
            <form
              onSubmit={handleSimpanPengaturanUmumPerlengkapan}
              className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/45 p-6 shadow-xl space-y-4 max-w-3xl"
            >
              <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                Pengaturan Identitas Unit, Penandatangan &amp; Master Kategori/Satuan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Nama Unit Perlengkapan (Untuk Kop Surat Peminjaman &amp; Laporan Word)
                  </label>
                  <input
                    type="text"
                    value={cfgForm.namaUnitPerlengkapan}
                    onChange={(e) =>
                      setCfgForm({ ...cfgForm, namaUnitPerlengkapan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Nama Kepala / Penanggung Jawab Perlengkapan
                  </label>
                  <input
                    type="text"
                    value={cfgForm.kepalaPerlengkapan}
                    onChange={(e) =>
                      setCfgForm({ ...cfgForm, kepalaPerlengkapan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Jabatan Penandatangan
                  </label>
                  <input
                    type="text"
                    value={cfgForm.jabatanKepala}
                    onChange={(e) =>
                      setCfgForm({ ...cfgForm, jabatanKepala: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Daftar Kategori Inventaris (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={cfgForm.kategoriText}
                    onChange={(e) =>
                      setCfgForm({ ...cfgForm, kategoriText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Daftar Satuan Barang &amp; Fasilitas (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={cfgForm.satuanText}
                    onChange={(e) =>
                      setCfgForm({ ...cfgForm, satuanText: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Umum Perlengkapan</span>
              </button>
            </form>
          )}

          {/* SECTION 3: EDIT & HAPUS DATA INVENTARIS */}
          {optionSection === 'edit_inventaris' && (
            <div className="rounded-3xl bg-[#041d14]/95 border border-emerald-700/50 p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit &amp; Kelola Semua Data Barang Inventaris ({barangInventaris.length})
                </h3>
                <p className="text-xs text-emerald-200/75 mt-0.5">
                  Ubah nama barang, kategori, stok, batas stok minimal, satuan, kondisi, atau lokasi lalu klik Simpan.
                </p>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-emerald-800/60 bg-[#03160f]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02100a]">
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3 min-w-[170px]">Nama Barang</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 w-20 text-center">Stok</th>
                      <th className="py-2.5 px-3 w-20 text-center">Min</th>
                      <th className="py-2.5 px-3 w-24">Satuan</th>
                      <th className="py-2.5 px-3">Kondisi</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Lokasi</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50">
                    {barangInventaris.map((b) => {
                      const d = optInvDrafts[b.id] || {};
                      const dirty = Boolean(optInvDrafts[b.id]);
                      return (
                        <tr key={b.id} className="hover:bg-[#06281c]/55">
                          <td className="py-2 px-3 font-mono text-[11px] text-[#f3d266] whitespace-nowrap">
                            {b.kodeBarang}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={d.namaBarang ?? b.namaBarang}
                              onChange={(e) =>
                                setOptInvDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...prev[b.id], namaBarang: e.target.value },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={d.kategori ?? b.kategori}
                              onChange={(e) =>
                                setOptInvDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...prev[b.id], kategori: e.target.value as any },
                                }))
                              }
                              className="px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-emerald-100"
                            >
                              {Array.from(
                                new Set([
                                  ...(perlengkapanCfg.kategoriInventaris || []),
                                  b.kategori,
                                ])
                              ).map((kat) => (
                                <option key={kat} value={kat}>
                                  {kat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              value={d.jumlah !== undefined ? d.jumlah : b.jumlah}
                              onChange={(e) =>
                                setOptInvDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...prev[b.id], jumlah: Number(e.target.value) },
                                }))
                              }
                              className="w-16 px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-mono text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              value={d.stokMinimal !== undefined ? d.stokMinimal : (b.stokMinimal ?? 3)}
                              onChange={(e) =>
                                setOptInvDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...prev[b.id], stokMinimal: Number(e.target.value) },
                                }))
                              }
                              className="w-16 px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-amber-300 font-mono text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={d.satuan ?? b.satuan}
                              onChange={(e) =>
                                setOptInvDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...prev[b.id], satuan: e.target.value },
                                }))
                              }
                              className="w-20 px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={d.kondisi ?? b.kondisi}
                              onChange={(e) =>
                                setOptInvDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...prev[b.id], kondisi: e.target.value as any },
                                }))
                              }
                              className="px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white"
                            >
                              <option value="Baik">Baik</option>
                              <option value="Rusak Ringan">Rusak Ringan</option>
                              <option value="Rusak Berat">Rusak Berat</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={d.lokasi ?? b.lokasi}
                              onChange={(e) =>
                                setOptInvDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...prev[b.id], lokasi: e.target.value },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-emerald-100"
                            />
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={!dirty}
                                onClick={() => handleSimpanEditInventarisOption(b)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                  dirty
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-emerald-950/60 text-emerald-500/60 cursor-not-allowed'
                                }`}
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  storageService.deleteBarangInventaris(b.id);
                                  notifyToast(`Barang inventaris "${b.namaBarang}" telah dihapus.`);
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/75 hover:bg-rose-900 text-rose-200 border border-rose-500/40 cursor-pointer"
                                title="Hapus Inventaris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: EDIT & HAPUS KELUAR MASUK BARANG */}
          {optionSection === 'edit_mutasi' && (
            <div className="rounded-3xl bg-[#041d14]/95 border border-emerald-700/50 p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit &amp; Kelola Riwayat Keluar Masuk Barang ({(systemConfig.mutasiBarangList || []).length})
                </h3>
                <p className="text-xs text-emerald-200/75 mt-0.5">
                  Perbaiki tanggal, jenis mutasi, jumlah, petugas, atau keterangan mutasi barang.
                </p>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-emerald-800/60 bg-[#03160f]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02100a]">
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Barang</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3 w-20 text-center">Jumlah</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Petugas</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Keterangan</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50">
                    {(systemConfig.mutasiBarangList || []).map((m) => {
                      const d = optMutasiDrafts[m.id] || {};
                      const dirty = Boolean(optMutasiDrafts[m.id]);
                      return (
                        <tr key={m.id} className="hover:bg-[#06281c]/55">
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={d.tanggal ?? m.tanggal}
                              onChange={(e) =>
                                setOptMutasiDrafts((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], tanggal: e.target.value },
                                }))
                              }
                              className="px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-[#f3d266] font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-white">{m.namaBarang}</td>
                          <td className="py-2 px-3">
                            <select
                              value={d.tipe ?? m.tipe}
                              onChange={(e) =>
                                setOptMutasiDrafts((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], tipe: e.target.value as any },
                                }))
                              }
                              className="px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white"
                            >
                              <option value="Masuk">Masuk</option>
                              <option value="Keluar">Keluar</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={1}
                              value={d.jumlah !== undefined ? d.jumlah : m.jumlah}
                              onChange={(e) =>
                                setOptMutasiDrafts((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], jumlah: Number(e.target.value) },
                                }))
                              }
                              className="w-16 px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-mono text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={d.petugas ?? m.petugas}
                              onChange={(e) =>
                                setOptMutasiDrafts((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], petugas: e.target.value },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-emerald-100"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={d.keterangan ?? m.keterangan}
                              onChange={(e) =>
                                setOptMutasiDrafts((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], keterangan: e.target.value },
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-emerald-100"
                            />
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={!dirty}
                                onClick={() => handleSimpanEditMutasiOption(m)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                  dirty
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-emerald-950/60 text-emerald-500/60 cursor-not-allowed'
                                }`}
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHapusMutasiOption(m.id, m.namaBarang)}
                                className="p-1.5 rounded-lg bg-rose-950/75 hover:bg-rose-900 text-rose-200 border border-rose-500/40 cursor-pointer"
                                title="Hapus Riwayat Mutasi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: EDIT & HAPUS PEMINJAMAN BARANG DAN PENGAJUAN PEMBELIAN */}
          {optionSection === 'edit_peminjaman_pengajuan' && (
            <div className="space-y-6">
              {/* Peminjaman Barang */}
              <div className="rounded-3xl bg-[#041d14]/95 border border-emerald-700/50 p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit &amp; Kelola Data Peminjaman Barang ({peminjamanBarang.length})
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-emerald-800/60 bg-[#03160f]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02100a]">
                        <th className="py-2.5 px-3">Kode</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Nama Barang</th>
                        <th className="py-2.5 px-3 w-20 text-center">Jml</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Peminjam / Tujuan</th>
                        <th className="py-2.5 px-3">Batas Kembali</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/50">
                      {peminjamanBarang.map((p) => {
                        const d = optPinjamDrafts[p.id] || {};
                        const dirty = Boolean(optPinjamDrafts[p.id]);
                        return (
                          <tr key={p.id} className="hover:bg-[#06281c]/55">
                            <td className="py-2 px-3 font-mono text-[11px] text-[#f3d266] whitespace-nowrap">
                              {p.kodePeminjaman}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={d.namaBarang ?? p.namaBarang}
                                onChange={(e) =>
                                  setOptPinjamDrafts((prev) => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], namaBarang: e.target.value },
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-semibold"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={1}
                                value={d.jumlahPinjam !== undefined ? d.jumlahPinjam : p.jumlahPinjam}
                                onChange={(e) =>
                                  setOptPinjamDrafts((prev) => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], jumlahPinjam: Number(e.target.value) },
                                  }))
                                }
                                className="w-16 px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-mono text-center"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={d.peminjamNama ?? p.peminjamNama}
                                onChange={(e) =>
                                  setOptPinjamDrafts((prev) => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], peminjamNama: e.target.value },
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-emerald-100"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={d.batasKembali ?? p.batasKembali}
                                onChange={(e) =>
                                  setOptPinjamDrafts((prev) => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], batasKembali: e.target.value },
                                  }))
                                }
                                className="px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-mono"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={d.status ?? p.status}
                                onChange={(e) =>
                                  setOptPinjamDrafts((prev) => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], status: e.target.value as any },
                                  }))
                                }
                                className="px-2 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white"
                              >
                                <option value="Dipinjam">Dipinjam</option>
                                <option value="Dikembalikan">Dikembalikan</option>
                                <option value="Terlambat">Terlambat</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={!dirty}
                                  onClick={() => handleSimpanEditPeminjamanOption(p)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                    dirty
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                      : 'bg-emerald-950/60 text-emerald-500/60 cursor-not-allowed'
                                  }`}
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    storageService.deletePeminjamanBarang(p.id);
                                    notifyToast(`Data peminjaman "${p.namaBarang}" telah dihapus.`);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-950/75 hover:bg-rose-900 text-rose-200 border border-rose-500/40 cursor-pointer"
                                  title="Hapus Peminjaman"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pengajuan Pembelian Barang */}
              <div className="rounded-3xl bg-[#041d14]/95 border border-emerald-700/50 p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit &amp; Kelola Pengajuan Pembelian Perlengkapan
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-emerald-800/60 bg-[#03160f]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#02100a]">
                        <th className="py-2.5 px-3">Nomor</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Judul Pengajuan</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Deskripsi</th>
                        <th className="py-2.5 px-3 w-36">Estimasi (Rp)</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/50">
                      {pengajuanDivisi
                        .filter((p) => p.divisi === 'Perlengkapan' || p.jenisPengajuan === 'Pengadaan Barang')
                        .map((pgj) => {
                          const d = optPengajuanDrafts[pgj.id] || {};
                          const dirty = Boolean(optPengajuanDrafts[pgj.id]);
                          return (
                            <tr key={pgj.id} className="hover:bg-[#06281c]/55">
                              <td className="py-2 px-3 font-mono text-[11px] text-[#f3d266] whitespace-nowrap">
                                {pgj.nomorPengajuan}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={d.judul ?? pgj.judul}
                                  onChange={(e) =>
                                    setOptPengajuanDrafts((prev) => ({
                                      ...prev,
                                      [pgj.id]: { ...prev[pgj.id], judul: e.target.value },
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-white font-semibold"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={d.deskripsi ?? pgj.deskripsi}
                                  onChange={(e) =>
                                    setOptPengajuanDrafts((prev) => ({
                                      ...prev,
                                      [pgj.id]: { ...prev[pgj.id], deskripsi: e.target.value },
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-emerald-100"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    d.nominalEstimasi !== undefined
                                      ? d.nominalEstimasi
                                      : (pgj.nominalEstimasi ?? 0)
                                  }
                                  onChange={(e) =>
                                    setOptPengajuanDrafts((prev) => ({
                                      ...prev,
                                      [pgj.id]: {
                                        ...prev[pgj.id],
                                        nominalEstimasi: Number(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-32 px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-xs text-[#f3d266] font-mono"
                                />
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-emerald-300">
                                {pgj.status}
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={!dirty}
                                    onClick={() => handleSimpanEditPengajuanOption(pgj)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                                      dirty
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        : 'bg-emerald-950/60 text-emerald-500/60 cursor-not-allowed'
                                    }`}
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      storageService.deletePengajuanDivisi(pgj.id);
                                      notifyToast(`Pengajuan "${pgj.judul}" telah dihapus.`);
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-950/75 hover:bg-rose-900 text-rose-200 border border-rose-500/40 cursor-pointer"
                                    title="Hapus Pengajuan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PREVIEW & CETAK SURAT PEMINJAMAN PERLENGKAPAN A4 + QR CODE */}
      <SuratPeminjamanPerlengkapanModal
        pinjam={selectedSuratPeminjaman}
        systemConfig={systemConfig}
        pengaturanSurat={pengaturanSuratPerlengkapan}
        onClose={() => setSelectedSuratPeminjaman(null)}
        onOpenOptionPanel={() => {
          setIsOptionSuratModalOpen(true);
        }}
      />

      {/* MODAL SCAN QR PENGEMBALIAN BARANG (html5-qrcode) */}
      <ScanQRPengembalianModal
        isOpen={isScanQRModalOpen}
        onClose={() => setIsScanQRModalOpen(false)}
        currentUser={currentUser}
        peminjamanList={peminjamanCloudList}
        onSuccessReturned={(returned) => {
          notifyToast(
            `Barang milik ${returned.namaPeminjam} telah tercatat dikembalikan (${returned.waktuKembali}).`
          );
        }}
      />

      {/* MODAL OPTION PANEL FORMAT & LAYOUT SURAT PEMINJAMAN */}
      <OptionPanelSuratPerlengkapanModal
        isOpen={isOptionSuratModalOpen}
        onClose={() => setIsOptionSuratModalOpen(false)}
        pengaturanSurat={pengaturanSuratPerlengkapan}
        onSaved={(saved) => {
          setPengaturanSuratPerlengkapan(saved);
          notifyToast('Format & layout surat peminjaman berhasil disimpan permanen ke Firebase.');
        }}
      />
    </div>
  );
};
