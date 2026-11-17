import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Send,
  CheckCircle2,
  Sliders,
  Trash2,
  Eye,
  Sparkles,
  FileSignature,
  Inbox,
  Users,
  GraduationCap,
  Calendar,
  Edit3,
  UserPlus,
  Upload,
  Image as ImageIcon,
  Link2,
  RotateCcw,
  User,
  MapPin,
  Phone,
  BookOpen,
  Camera,
  History,
  Save,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  ArsipSurat,
  KodeJenisSurat,
  SuratSekretarisConfig,
  SystemConfig,
  UserAccount,
  Santri,
  DataUstadz,
  NotulenRapat,
  AgendaPengurus,
  PesanKoordinasi,
  Gender,
} from '../types';
import { storageService } from '../services/storageService';
import { INITIAL_SURAT_SEKRETARIS_CONFIG } from '../data/seedData';
import { openPrintWindow } from '../utils/printDocument';
import { downloadSuratSekretarisPDF, loadImageAsDataUrl } from '../utils/pdfGenerator';
import { downloadWordDocument } from '../utils/wordExport';
import { DivisiKotakMasuk } from './DivisiKotakMasuk';
import { ScanSuratModal } from './ScanSuratModal';
import {
  applyPengaturanSuratToConfig,
  convertSignatureFileToBase64,
  resolvePejabatSurat,
  savePengaturanSuratToStorage,
} from '../utils/pengaturanSurat';

interface SekretarisPanelProps {
  arsipSurat?: ArsipSurat[];
  arsipList?: ArsipSurat[];
  systemConfig: SystemConfig;
  currentUser: UserAccount;
  onDataChanged?: () => void;
  santriList?: Santri[];
  agendaPengurus?: AgendaPengurus[];
  agendaList?: AgendaPengurus[];
  koordinasiList?: PesanKoordinasi[];
  initialSubTab?: string;
}

const DAFTAR_15_JENIS_SURAT: { kode: KodeJenisSurat; label: string; kategori: string }[] = [
  { kode: 'SK', label: '1. Surat Keputusan (SK)', kategori: 'Keputusan & Ketetapan' },
  { kode: 'SU', label: '2. Surat Undangan (SU)', kategori: 'Acara & Rapat' },
  { kode: 'SPm', label: '3. Surat Permohonan (SPm)', kategori: 'Eksternal & Bantuan' },
  { kode: 'SPb', label: '4. Surat Pemberitahuan (SPb)', kategori: 'Informasi Resmi' },
  { kode: 'SPp', label: '5. Surat Peminjaman (SPp)', kategori: 'Sarana & Prasarana' },
  { kode: 'SPn', label: '6. Surat Pernyataan (SPn)', kategori: 'Komitmen & Disiplin' },
  { kode: 'SM', label: '7. Surat Mandat (SM)', kategori: 'Perwakilan Resmi' },
  { kode: 'ST', label: '8. Surat Tugas (ST)', kategori: 'Penugasan Pengurus' },
  { kode: 'SKet', label: '9. Surat Keterangan (SKet)', kategori: 'Administrasi Santri' },
  { kode: 'SR', label: '10. Surat Rekomendasi (SR)', kategori: 'Beasiswa & Akademik' },
  { kode: 'SB', label: '11. Surat Balasan (SB)', kategori: 'Tanggapan Surat Masuk' },
  { kode: 'SPPD', label: '12. Surat Perintah Perjalanan Dinas (SPPD)', kategori: 'Dinas Luar' },
  { kode: 'SRT', label: '13. Sertifikat (SRT)', kategori: 'Penghargaan & Syahadah' },
  { kode: 'PK', label: '14. Perjanjian Kerja (PK)', kategori: 'MoU & Kerjasama' },
  { kode: 'SPeng', label: '15. Surat Pengantar (SPeng)', kategori: 'Pengiriman Berkas' },
];

const DAFTAR_KELAS_STANDAR = [
  '1 Ibtida (Ula)',
  '2 Ibtida (Ula)',
  '3 Ibtida (Ula)',
  '1 Wustho (Tsanawiyah)',
  '2 Wustho (Tsanawiyah)',
  '3 Wustho (Tsanawiyah)',
  '1 Ulya (Aliyah)',
  '2 Ulya (Aliyah)',
  '3 Ulya (Aliyah)',
  'Takhassus Kitab & Tahfidz',
];

function getRomanMonth(monthIndex: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[monthIndex] || 'XI';
}

type SekretarisTabKey =
  | 'kotak_masuk'
  | 'buat_surat'
  | 'riwayat_surat'
  | 'data_santri_psb'
  | 'data_ustadz'
  | 'notulen_agenda'
  | 'pengaturan_kop';

function normalizeSekretarisSubTab(subTab?: string): SekretarisTabKey {
  if (!subTab) return 'buat_surat';
  if (subTab === 'arsip_surat') return 'riwayat_surat';
  if (subTab === 'data_santri' || subTab === 'data_santri_psb') return 'data_santri_psb';
  if (subTab === 'format_surat' || subTab === 'pengaturan_kop') return 'pengaturan_kop';
  if (
    subTab === 'kotak_masuk' ||
    subTab === 'buat_surat' ||
    subTab === 'riwayat_surat' ||
    subTab === 'data_ustadz' ||
    subTab === 'notulen_agenda'
  ) {
    return subTab;
  }
  return 'buat_surat';
}

export const SekretarisPanel: React.FC<SekretarisPanelProps> = ({
  arsipSurat,
  arsipList: arsipListProp,
  systemConfig,
  currentUser,
  onDataChanged = () => {},
  santriList = [],
  agendaPengurus,
  agendaList: agendaListProp,
  koordinasiList = [],
  initialSubTab,
}) => {
  const arsipList = arsipSurat || arsipListProp || [];
  const agendaList = agendaPengurus || agendaListProp || [];
  const [activeTab, setActiveTab] = useState<SekretarisTabKey>(() => normalizeSekretarisSubTab(initialSubTab));

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(normalizeSekretarisSubTab(initialSubTab));
    }
  }, [initialSubTab]);

  const suratConfig: SuratSekretarisConfig = useMemo(() => {
    const raw = systemConfig.suratSekretarisConfig;
    const merged: SuratSekretarisConfig = {
      ...INITIAL_SURAT_SEKRETARIS_CONFIG,
      ...(raw || {}),
      kopLogoUrl:
        raw?.kopLogoUrl && !raw.kopLogoUrl.includes('2026-11-11-7ffd46ad')
          ? raw.kopLogoUrl
          : 'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png',
      kopLogoKananUrl:
        raw?.kopLogoKananUrl &&
        raw.kopLogoKananUrl.trim() !== '' &&
        !raw.kopLogoKananUrl.includes('2026-11-11-7ffd46ad')
          ? raw.kopLogoKananUrl
          : 'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg',
      templates: {
        ...INITIAL_SURAT_SEKRETARIS_CONFIG.templates,
        ...(raw?.templates || {}),
      },
    };
    return applyPengaturanSuratToConfig(merged);
  }, [systemConfig.suratSekretarisConfig]);

  const [selectedKode, setSelectedKode] = useState<KodeJenisSurat>('SK');
  const [toastMsg, setToastMsg] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // State Riwayat Surat (Scan Kamera OCR, Surat Masuk & Surat Keluar)
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInitialPreview, setScanInitialPreview] = useState<string | null>(null);
  const uploadFotoInputRef = useRef<HTMLInputElement | null>(null);
  const [showManualMasukForm, setShowManualMasukForm] = useState(false);
  const [manualMasukForm, setManualMasukForm] = useState({
    nomorSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    tujuanAtauPengirim: '',
    perihal: '',
    isiSurat: '',
  });
  const [manualMasukFromScan, setManualMasukFromScan] = useState(false);
  const isiSuratMasukRef = useRef<HTMLTextAreaElement | null>(null);
  const [editingMasukId, setEditingMasukId] = useState<string | null>(null);
  const [editingMasukText, setEditingMasukText] = useState('');

  const handleDirectUploadSuratMasuk = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 768;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const compressedUrl = canvas.toDataURL('image/jpeg', 0.65);
        setScanInitialPreview(compressedUrl);
        setShowScanModal(true);
      };
      img.onerror = () => {
        showToast('Gagal membaca file gambar surat.');
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Generate automatic letter number based on config pattern
  const generateNomorOtomatis = (kode: KodeJenisSurat, cfg: SuratSekretarisConfig = suratConfig): string => {
    const now = new Date();
    const urut = String(arsipList.length + 1).padStart(3, '0');
    const roman = getRomanMonth(now.getMonth());
    const tahun = String(now.getFullYear());
    const kodeKlasifikasi = cfg.templates[kode]?.kodeKlasifikasi || kode;

    return (cfg.formatNomorSurat || '{NOMOR}/{KODE}/PP-ALMALIKI/{ROMAN}/{TAHUN}')
      .replace('{NOMOR}', urut)
      .replace('{KODE}', kodeKlasifikasi)
      .replace('{ROMAN}', roman)
      .replace('{TAHUN}', tahun);
  };

  const defaultTemplate = suratConfig.templates['SK'];
  const [editingSuratId, setEditingSuratId] = useState<string | null>(null);
  const [formSurat, setFormSurat] = useState<Partial<ArsipSurat>>({
    arah: 'Keluar',
    kodeJenis: 'SK',
    namaJenis: defaultTemplate.namaJenis,
    nomorSurat: generateNomorOtomatis('SK'),
    tanggalSurat: new Date().toISOString().split('T')[0],
    lampiran: '-',
    perihal: defaultTemplate.judulDefault,
    tujuanAtauPengirim: 'Seluruh Pengurus & Asatidz Pondok Pesantren Salaf Al-Maliki',
    alamatTujuan: 'Di Tempat',
    salamPembuka: defaultTemplate.salamPembuka,
    kalimatPembuka: defaultTemplate.kalimatPembuka,
    isiSurat: defaultTemplate.isiTemplate,
    penutupSurat: defaultTemplate.kalimatPenutup,
    kotaTerbit: suratConfig.kotaTerbit,
    jabatanPenandatangan: suratConfig.jabatanPenandatangan,
    namaPenandatangan: suratConfig.namaPenandatangan,
    ttdUrl1: suratConfig.ttdUrl1,
    jabatanPenandatangan2: suratConfig.jabatanPenandatangan2,
    namaPenandatangan2: suratConfig.namaPenandatangan2,
    ttdUrl2: suratConfig.ttdUrl2,
    tampilkanPenandatangan2: suratConfig.tampilkanPenandatangan2,
    tembusan: defaultTemplate.catatanKaki || '',
    status: 'Resmi / Terbit',
  });

  // Kop & Format Surat Editor State (Tab Pengaturan Kop & Editor 15 Surat)
  const [kopForm, setKopForm] = useState<SuratSekretarisConfig>(suratConfig);
  const [selectedTemplateEditKode, setSelectedTemplateEditKode] = useState<KodeJenisSurat>('SK');

  useEffect(() => {
    setKopForm(suratConfig);
  }, [suratConfig]);

  // Keep signature & kop defaults synced into formSurat when not editing a specific archive
  useEffect(() => {
    if (!editingSuratId) {
      setFormSurat((prev) => ({
        ...prev,
        kotaTerbit: suratConfig.kotaTerbit,
        jabatanPenandatangan: suratConfig.jabatanPenandatangan,
        namaPenandatangan: suratConfig.namaPenandatangan,
        ttdUrl1: suratConfig.ttdUrl1,
        jabatanPenandatangan2: suratConfig.jabatanPenandatangan2,
        namaPenandatangan2: suratConfig.namaPenandatangan2,
        ttdUrl2: suratConfig.ttdUrl2,
        tampilkanPenandatangan2: suratConfig.tampilkanPenandatangan2,
      }));
    }
  }, [suratConfig, editingSuratId]);

  // Select 15 letter types & populate template automatically
  const handleSelectJenisSurat = (kode: KodeJenisSurat) => {
    setSelectedKode(kode);
    setEditingSuratId(null);
    const tpl = suratConfig.templates[kode] || INITIAL_SURAT_SEKRETARIS_CONFIG.templates[kode];
    setFormSurat({
      arah: 'Keluar',
      kodeJenis: kode,
      namaJenis: tpl.namaJenis,
      nomorSurat: generateNomorOtomatis(kode),
      tanggalSurat: new Date().toISOString().split('T')[0],
      lampiran: '-',
      perihal: tpl.judulDefault,
      tujuanAtauPengirim:
        kode === 'SKet' || kode === 'SR'
          ? 'Pihak Terkait / Wali Santri'
          : 'Bapak/Ibu/Ustadz/Pengurus Pondok Pesantren Salaf Al-Maliki',
      alamatTujuan: 'Di Tempat',
      salamPembuka: tpl.salamPembuka,
      kalimatPembuka: tpl.kalimatPembuka,
      isiSurat: tpl.isiTemplate,
      penutupSurat: tpl.kalimatPenutup,
      kotaTerbit: suratConfig.kotaTerbit,
      jabatanPenandatangan: suratConfig.jabatanPenandatangan,
      namaPenandatangan: suratConfig.namaPenandatangan,
      ttdUrl1: suratConfig.ttdUrl1,
      jabatanPenandatangan2: suratConfig.jabatanPenandatangan2,
      namaPenandatangan2: suratConfig.namaPenandatangan2,
      ttdUrl2: suratConfig.ttdUrl2,
      tampilkanPenandatangan2: suratConfig.tampilkanPenandatangan2,
      tembusan: tpl.catatanKaki || '',
      status: 'Resmi / Terbit',
    });
  };

  const buildCurrentArsipSuratObject = (): ArsipSurat => {
    return {
      id: editingSuratId || `srt_${Date.now()}`,
      arah: (formSurat.arah as 'Keluar' | 'Masuk') || 'Keluar',
      kodeJenis: selectedKode,
      namaJenis: formSurat.namaJenis || suratConfig.templates[selectedKode].namaJenis,
      nomorSurat: formSurat.nomorSurat || generateNomorOtomatis(selectedKode),
      tanggalSurat: formSurat.tanggalSurat || new Date().toISOString().split('T')[0],
      lampiran: formSurat.lampiran || '-',
      perihal: formSurat.perihal || suratConfig.templates[selectedKode].judulDefault,
      tujuanAtauPengirim: formSurat.tujuanAtauPengirim || '-',
      alamatTujuan: formSurat.alamatTujuan || 'Di Tempat',
      salamPembuka: formSurat.salamPembuka || '',
      kalimatPembuka: formSurat.kalimatPembuka || '',
      isiSurat: formSurat.isiSurat || '',
      penutupSurat: formSurat.penutupSurat || '',
      kotaTerbit: formSurat.kotaTerbit || suratConfig.kotaTerbit,
      jabatanPenandatangan: formSurat.jabatanPenandatangan || suratConfig.jabatanPenandatangan,
      namaPenandatangan: formSurat.namaPenandatangan || suratConfig.namaPenandatangan,
      ttdUrl1: formSurat.ttdUrl1 ?? suratConfig.ttdUrl1,
      jabatanPenandatangan2: formSurat.jabatanPenandatangan2 || suratConfig.jabatanPenandatangan2,
      namaPenandatangan2: formSurat.namaPenandatangan2 || suratConfig.namaPenandatangan2,
      ttdUrl2: formSurat.ttdUrl2 ?? suratConfig.ttdUrl2,
      tampilkanPenandatangan2: formSurat.tampilkanPenandatangan2 ?? suratConfig.tampilkanPenandatangan2,
      tembusan: formSurat.tembusan || '',
      status: (formSurat.status as ArsipSurat['status']) || 'Resmi / Terbit',
      dibuatOleh: currentUser.nama,
      createdAt: new Date().toLocaleString('id-ID'),
    };
  };

  const handleSaveArsip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSurat.nomorSurat || !formSurat.perihal || !formSurat.isiSurat) return;

    const item = buildCurrentArsipSuratObject();
    storageService.saveArsipSurat(item);
    onDataChanged();
    setEditingSuratId(item.id);
    showToast(`Surat ${item.nomorSurat} berhasil disimpan ke Arsip Resmi Sekretaris.`);
  };

  const handleLoadArsipToPreview = (srt: ArsipSurat) => {
    setSelectedKode(srt.kodeJenis);
    setEditingSuratId(srt.id);
    setFormSurat({
      ...srt,
      ttdUrl1: srt.ttdUrl1 ?? suratConfig.ttdUrl1,
      ttdUrl2: srt.ttdUrl2 ?? suratConfig.ttdUrl2,
    });
    setActiveTab('buat_surat');
    showToast(`Surat ${srt.nomorSurat} dimuat ke Editor & Pratinjau A4.`);
  };

  const escapeHtml = (str: string) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const buildPrintableSuratHtml = async (
    suratData: Partial<ArsipSurat>,
    cfg: SuratSekretarisConfig,
    kodeSuratAktif: KodeJenisSurat,
    preferLiveConfig = false
  ): Promise<string> => {
    const rawLeftLogo =
      (cfg.kopLogoUrl && !cfg.kopLogoUrl.includes('2026-11-11-7ffd46ad')
        ? cfg.kopLogoUrl
        : 'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png') ||
      '/kop-logo-1.png';
    const rawRightLogo =
      cfg.kopLogoKananUrl &&
      cfg.kopLogoKananUrl.trim() !== '' &&
      !cfg.kopLogoKananUrl.includes('2026-11-11-7ffd46ad')
        ? cfg.kopLogoKananUrl
        : 'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg';

    const pejabat = resolvePejabatSurat(cfg, suratData, preferLiveConfig);
    const showSigner2 = pejabat.tampilkanKetua;
    const rawTtd1 = pejabat.ttdSekretaris;
    const rawTtd2 = pejabat.ttdKetua;

    const [leftLogoData, rightLogoData, ttd1Data, ttd2Data, stempelData] = await Promise.all([
      loadImageAsDataUrl(rawLeftLogo).then((r) => r || loadImageAsDataUrl('/kop-logo-1.png')),
      rawRightLogo
        ? loadImageAsDataUrl(rawRightLogo).then((r) => r || loadImageAsDataUrl('/kop-logo-2.jpg'))
        : Promise.resolve(null),
      rawTtd1 ? loadImageAsDataUrl(rawTtd1) : Promise.resolve(null),
      showSigner2 && rawTtd2 ? loadImageAsDataUrl(rawTtd2) : Promise.resolve(null),
      cfg.tampilkanStempel && cfg.stempelUrl ? loadImageAsDataUrl(cfg.stempelUrl) : Promise.resolve(null),
    ]);

    const logoPx = cfg.ukuranLogoPx || 68;
    const fontSizePt = cfg.ukuranFontSurat === 'kecil' ? '10pt' : cfg.ukuranFontSurat === 'besar' ? '12pt' : '11pt';
    const textAlign = cfg.perataanIsi === 'left' ? 'left' : 'justify';

    const formattedTanggal = (() => {
      if (!suratData.tanggalSurat) return '';
      const d = new Date(suratData.tanggalSurat);
      if (isNaN(d.getTime())) return suratData.tanggalSurat;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    })();

    const isCenteredTitle = ['SK', 'SPn', 'SM', 'ST', 'SKet', 'SR', 'SPPD', 'SRT', 'PK'].includes(kodeSuratAktif);
    const isiHtml = escapeHtml(suratData.isiSurat || '').replace(/\n/g, '<br/>');

    return `
      <div style="font-family: 'Times New Roman', Times, serif; color: #0f172a; background: #ffffff; width: 100%; font-size: ${fontSizePt}; line-height: 1.6;">
        <!-- Kop Surat Resmi 2 Logo -->
        <table style="width: 100%; border-collapse: collapse; border-bottom: 4px double #064e3b; padding-bottom: 10px; margin-bottom: 16px;">
          <tr>
            <td style="width: ${logoPx + 8}px; vertical-align: middle; text-align: left; padding-bottom: 10px;">
              ${leftLogoData ? `<img src="${leftLogoData}" alt="Logo Kiri" style="width: ${logoPx}px; height: ${logoPx}px; object-fit: contain; display: block;" />` : ''}
            </td>
            <td style="vertical-align: middle; text-align: center; padding: 0 8px 10px 8px;">
              ${cfg.tampilkanBismillah ? `<div style="font-size: 12pt; font-weight: 700; color: #064e3b; margin-bottom: 2px;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>` : ''}
              <div style="font-size: 10pt; font-weight: 700; color: #064e3b; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(cfg.kopNamaYayasan)}</div>
              <div style="font-size: 15pt; font-weight: 900; color: #020617; text-transform: uppercase; line-height: 1.2;">${escapeHtml(cfg.kopNamaPondok)}</div>
              <div style="font-size: 10pt; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.04em;">${escapeHtml(cfg.kopSubInstansi)}</div>
              <div style="font-size: 8.5pt; color: #475569; margin-top: 2px; line-height: 1.3;">${escapeHtml(cfg.kopAlamatKontak)}</div>
            </td>
            <td style="width: ${logoPx + 8}px; vertical-align: middle; text-align: right; padding-bottom: 10px;">
              ${rightLogoData ? `<img src="${rightLogoData}" alt="Logo Kanan" style="width: ${logoPx}px; height: ${logoPx}px; object-fit: contain; display: inline-block;" />` : ''}
            </td>
          </tr>
        </table>

        <!-- Nomor, Lampiran, Perihal & Tanggal -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: ${fontSizePt};">
          <tr>
            <td style="vertical-align: top;">
              <div><span style="display: inline-block; width: 78px; font-weight: 600;">Nomor</span>: ${escapeHtml(suratData.nomorSurat || '')}</div>
              <div><span style="display: inline-block; width: 78px; font-weight: 600;">Lampiran</span>: ${escapeHtml(suratData.lampiran || '-')}</div>
              <div><span style="display: inline-block; width: 78px; font-weight: 600;">Perihal</span>: <strong style="text-decoration: underline;">${escapeHtml(suratData.perihal || '')}</strong></div>
            </td>
            ${cfg.posisiTanggal !== 'bawah_kanan' ? `<td style="vertical-align: top; text-align: right; white-space: nowrap;">${escapeHtml(suratData.kotaTerbit || cfg.kotaTerbit)}, ${escapeHtml(formattedTanggal)}</td>` : ''}
          </tr>
        </table>

        <!-- Tujuan Surat -->
        ${suratData.tujuanAtauPengirim ? `
          <div style="margin-bottom: 14px; font-size: ${fontSizePt};">
            <div>Kepada Yth.</div>
            <div style="font-weight: 700;">${escapeHtml(suratData.tujuanAtauPengirim)}</div>
            <div>${escapeHtml(suratData.alamatTujuan || 'Di Tempat')}</div>
          </div>
        ` : ''}

        <!-- Judul Tengah -->
        ${isCenteredTitle ? `
          <div style="text-align: center; margin: 14px 0 16px 0;">
            <div style="font-size: 12.5pt; font-weight: 900; text-transform: uppercase; text-decoration: underline; color: #020617;">${escapeHtml(suratData.perihal || '')}</div>
            <div style="font-family: monospace; font-size: 9.5pt; font-weight: 700; color: #334155; margin-top: 2px;">Nomor: ${escapeHtml(suratData.nomorSurat || '')}</div>
          </div>
        ` : ''}

        <!-- Isi Surat -->
        <div style="text-align: ${textAlign}; font-size: ${fontSizePt};">
          ${suratData.salamPembuka ? `<p style="font-weight: 700; font-style: italic; margin: 0 0 8px 0;">${escapeHtml(suratData.salamPembuka)}</p>` : ''}
          ${suratData.kalimatPembuka ? `<p style="margin: 0 0 10px 0;">${escapeHtml(suratData.kalimatPembuka)}</p>` : ''}
          <div style="margin: 0 0 10px 0; white-space: pre-wrap;">${isiHtml}</div>
          ${suratData.penutupSurat ? `<p style="margin: 0 0 10px 0;">${escapeHtml(suratData.penutupSurat)}</p>` : ''}
        </div>

        <!-- Blok Tanda Tangan & Stempel -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 24px; text-align: center; font-size: ${fontSizePt}; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <tr>
            <td style="width: 50%; vertical-align: bottom; padding: 4px 12px;">
              ${showSigner2 ? `
                <div style="font-size: 9.5pt; color: #475569;">Mengetahui,</div>
                <div style="font-weight: 700;">${escapeHtml(pejabat.jabatanKetua)}</div>
                <div class="surat-ttd-box" style="height: 65px; min-height: 65px; display: flex; align-items: center; justify-content: center; margin: 4px 0;">
                  ${ttd2Data ? `<img src="${ttd2Data}" alt="TTD Ketua Pondok" class="surat-ttd-img" style="height: 65px; max-height: 65px; max-width: 165px; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />` : ''}
                </div>
                <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(pejabat.namaKetua)}</div>
              ` : ''}
            </td>
            <td style="width: 50%; vertical-align: bottom; padding: 4px 12px; position: relative;">
              <div style="font-size: 9.5pt; color: #475569;">${escapeHtml(suratData.kotaTerbit || cfg.kotaTerbit)}, ${escapeHtml(formattedTanggal)}</div>
              <div style="font-weight: 700;">${escapeHtml(pejabat.jabatanSekretaris)}</div>
              <div class="surat-ttd-box" style="height: 65px; min-height: 65px; position: relative; display: flex; align-items: center; justify-content: center; margin: 4px 0;">
                ${cfg.tampilkanStempel ? (
                  stempelData
                    ? `<img src="${stempelData}" alt="Stempel Pondok" style="max-height: 60px; max-width: 85px; object-fit: contain; opacity: 0.85; position: absolute; left: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />`
                    : `<span style="display: inline-block; padding: 2px 7px; border: 2px solid rgba(6,95,70,0.65); color: rgba(6,78,59,0.8); font-size: 7pt; font-family: monospace; font-weight: 700; text-transform: uppercase; border-radius: 4px; transform: rotate(-6deg); position: absolute; left: 6px;">STEMPEL RESMI PONDOK</span>`
                ) : ''}
                ${ttd1Data ? `<img src="${ttd1Data}" alt="TTD Sekretaris" class="surat-ttd-img" style="height: 65px; max-height: 65px; max-width: 165px; object-fit: contain; position: relative; z-index: 2; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />` : ''}
              </div>
              <div style="font-weight: 700; text-decoration: underline;">${escapeHtml(pejabat.namaSekretaris)}</div>
            </td>
          </tr>
        </table>

        <!-- Tembusan / Catatan Kaki -->
        ${suratData.tembusan ? `
          <div style="margin-top: 20px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 9pt; color: #475569;">
            <div style="font-weight: 700;">Tembusan / Catatan:</div>
            <div style="font-style: italic;">${escapeHtml(suratData.tembusan)}</div>
          </div>
        ` : ''}
      </div>
    `;
  };

  const recordSuratKeluarRiwayat = (
    srt: ArsipSurat,
    aksi: 'Dikirim' | 'Dicetak' | 'Didownload PDF' | 'Didownload Word'
  ) => {
    if (srt.arah !== 'Keluar') return;
    const updated: ArsipSurat = {
      ...srt,
      statusRiwayatKeluar: true,
      aksiRiwayatKeluar: aksi,
      waktuRiwayatKeluar: new Date().toLocaleString('id-ID') + ' WIB',
    };
    storageService.saveArsipSurat(updated);
    onDataChanged();
  };

  const handlePrintA4 = async () => {
    try {
      const currentSurat = buildCurrentArsipSuratObject();
      if (currentSurat.arah === 'Keluar') {
        recordSuratKeluarRiwayat(currentSurat, 'Dicetak');
        setEditingSuratId(currentSurat.id);
      }
      const printableHtml = await buildPrintableSuratHtml(currentSurat, suratConfig, selectedKode);
      openPrintWindow(
        `Cetak Surat - ${currentSurat.nomorSurat || 'Sekretariat'}`,
        printableHtml,
        suratConfig.marginSuratMm || 20
      );
    } catch (err) {
      console.error('Print error:', err);
      const el = document.getElementById('sekretaris-surat-a4-print');
      if (el) {
        openPrintWindow(
          `Cetak Surat - ${formSurat.nomorSurat || 'Sekretariat'}`,
          el.outerHTML,
          suratConfig.marginSuratMm || 20
        );
      }
    }
  };

  const handlePrintArsipSurat = async (srt: ArsipSurat) => {
    try {
      if (srt.arah === 'Keluar') {
        recordSuratKeluarRiwayat(srt, 'Dicetak');
      }
      const printableHtml = await buildPrintableSuratHtml(srt, suratConfig, srt.kodeJenis);
      openPrintWindow(
        `Cetak Surat - ${srt.nomorSurat}`,
        printableHtml,
        suratConfig.marginSuratMm || 20
      );
    } catch (err) {
      console.error('Print Arsip error:', err);
      showToast('Gagal menyiapkan pratinjau cetak surat arsip.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const currentSurat = buildCurrentArsipSuratObject();
      if (currentSurat.arah === 'Keluar') {
        recordSuratKeluarRiwayat(currentSurat, 'Didownload PDF');
        setEditingSuratId(currentSurat.id);
      }
      await downloadSuratSekretarisPDF(currentSurat, suratConfig, systemConfig.logoUrl);
      showToast('Dokumen PDF Kertas A4 (lengkap dengan Logo Kop & TTD Digital) berhasil diunduh.');
    } catch (err) {
      console.error('Download PDF error:', err);
      showToast('Gagal mengunduh PDF, silakan coba kembali.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadArsipPdf = async (srt: ArsipSurat) => {
    try {
      setIsDownloadingPdf(true);
      if (srt.arah === 'Keluar') {
        recordSuratKeluarRiwayat(srt, 'Didownload PDF');
      }
      await downloadSuratSekretarisPDF(srt, suratConfig, systemConfig.logoUrl);
      showToast(`PDF Surat ${srt.nomorSurat} berhasil diunduh.`);
    } catch (err) {
      console.error('Download Arsip PDF error:', err);
      showToast('Gagal mengunduh PDF arsip, silakan coba kembali.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handler OCR Scan Kamera Gemini -> Otomatis isi Formulir Surat Masuk (termasuk Latin & Arab)
  const handleScanTranscribed = (transcribedText: string) => {
    const cleanText = transcribedText.trim();
    const lines = cleanText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const nomorMatch = cleanText.match(/(?:nomor|no\.?)\s*[:\-]\s*([^\n]+)/i);
    const pengirimMatch = cleanText.match(/(?:dari|pengirim|atas nama)\s*[:\-]\s*([^\n]+)/i);
    const perihalMatch = cleanText.match(/(?:perihal|hal)\s*[:\-]\s*([^\n]+)/i);

    const masukCount = arsipList.filter((s) => s.arah === 'Masuk').length + 1;
    const detectedNomor =
      nomorMatch?.[1]?.trim() ||
      `SM-SCAN-${String(masukCount).padStart(3, '0')}/${new Date().getFullYear()}`;
    const detectedPerihal =
      perihalMatch?.[1]?.trim() ||
      (
        lines.find((l) => !/^(?:bismillah|assalamu|nomor|no\.|tanggal|بسم)/i.test(l)) ||
        lines[0] ||
        'Surat Masuk Hasil Scan Kamera'
      ).slice(0, 80);
    const detectedPengirim = pengirimMatch?.[1]?.trim() || '';

    setManualMasukForm((prev) => ({
      nomorSurat: detectedNomor,
      tanggalSurat: prev.tanggalSurat || new Date().toISOString().split('T')[0],
      tujuanAtauPengirim: detectedPengirim,
      perihal: detectedPerihal,
      isiSurat: cleanText,
    }));
    setManualMasukFromScan(true);
    setShowManualMasukForm(true);
    setShowScanModal(false);
    setActiveTab('riwayat_surat');
    showToast(
      'Teks surat (Latin/Arab) berhasil diekstrak ke formulir Surat Masuk. Silakan periksa & klik Simpan.'
    );

    setTimeout(() => {
      document
        .getElementById('form-surat-masuk-sekretaris')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      isiSuratMasukRef.current?.focus();
    }, 120);
  };

  const handleSaveManualSuratMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMasukForm.perihal.trim() || !manualMasukForm.isiSurat.trim()) return;

    const masukCount = arsipList.filter((s) => s.arah === 'Masuk').length + 1;
    const newSuratMasuk: ArsipSurat = {
      id: `srt_in_${Date.now()}`,
      arah: 'Masuk',
      kodeJenis: 'SPeng',
      namaJenis: manualMasukFromScan ? 'Surat Masuk (Scan Gemini OCR)' : 'Surat Masuk',
      nomorSurat:
        manualMasukForm.nomorSurat.trim() ||
        `SM-${String(masukCount).padStart(3, '0')}/${new Date().getFullYear()}`,
      tanggalSurat: manualMasukForm.tanggalSurat || new Date().toISOString().split('T')[0],
      lampiran: '-',
      perihal: manualMasukForm.perihal.trim(),
      tujuanAtauPengirim: manualMasukForm.tujuanAtauPengirim.trim() || 'Pengirim Eksternal',
      alamatTujuan: 'Sekretariat Pondok',
      isiSurat: manualMasukForm.isiSurat.trim(),
      status: 'Diarsipkan',
      dibuatOleh: currentUser.nama,
      createdAt: new Date().toLocaleString('id-ID'),
      dikirimKeKetua: false,
      sumberScanKamera: manualMasukFromScan,
      metodeScan: manualMasukFromScan ? 'kamera_ocr' : undefined,
    };

    storageService.saveArsipSurat(newSuratMasuk);
    onDataChanged();
    setManualMasukForm({
      nomorSurat: '',
      tanggalSurat: new Date().toISOString().split('T')[0],
      tujuanAtauPengirim: '',
      perihal: '',
      isiSurat: '',
    });
    setManualMasukFromScan(false);
    setShowManualMasukForm(false);
    showToast(`Surat Masuk ${newSuratMasuk.nomorSurat} berhasil ditambahkan ke Tabel 1.`);
  };

  // Kirim Surat Masuk -> Masuk ke Tab Ketua Pondok (Kotak Masuk Pesan & Laporan) & Riwayat Surat Masuk
  const handleKirimSuratMasukKeKetua = (srt: ArsipSurat) => {
    const waktuNow = new Date().toLocaleString('id-ID') + ' WIB';
    const pesan: PesanKoordinasi = {
      id: `krd_srt_${Date.now()}`,
      nomorTiket: `SEK-IN-${Math.floor(1000 + Math.random() * 9000)}`,
      judul: `[SURAT MASUK] ${srt.perihal} (${srt.nomorSurat})`,
      isi: `Pengirim: ${srt.tujuanAtauPengirim || '-'}\nTanggal Surat: ${srt.tanggalSurat}\nNomor Surat: ${srt.nomorSurat}\n\nIsi Surat:\n${srt.isiSurat}`,
      prioritas: 'Penting',
      kategori: 'Laporan Kejadian',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: 'sekretaris',
      pengirimJabatan: currentUser.jabatan || 'Sekretaris Umum Pondok',
      pengirimAvatar: currentUser.avatar || '',
      tujuan: 'ketua_pondok',
      waktu: waktuNow,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    };

    storageService.saveKoordinasi(pesan);
    storageService.saveArsipSurat({
      ...srt,
      dikirimKeKetua: true,
      waktuKirimKetua: waktuNow,
      status: 'Diarsipkan',
    });
    onDataChanged();
    showToast(
      `Surat Masuk "${srt.perihal}" berhasil dikirim ke Kotak Masuk Ketua Pondok dan masuk ke Riwayat Surat Masuk.`
    );
  };

  // Kirim Surat Keluar -> Masuk ke Riwayat Surat Keluar & notif ke Ketua Pondok
  const handleKirimSuratKeluar = (srt: ArsipSurat) => {
    const waktuNow = new Date().toLocaleString('id-ID') + ' WIB';
    const pesan: PesanKoordinasi = {
      id: `krd_out_${Date.now()}`,
      nomorTiket: `SEK-OUT-${Math.floor(1000 + Math.random() * 9000)}`,
      judul: `[SURAT KELUAR] ${srt.perihal} (${srt.nomorSurat})`,
      isi: `Tujuan: ${srt.tujuanAtauPengirim || '-'}\nTanggal: ${srt.tanggalSurat}\nNomor: ${srt.nomorSurat}\n\nRingkasan Isi:\n${srt.isiSurat}`,
      prioritas: 'Normal',
      kategori: 'Instruksi Admin',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: 'sekretaris',
      pengirimJabatan: currentUser.jabatan || 'Sekretaris Umum Pondok',
      pengirimAvatar: currentUser.avatar || '',
      tujuan: 'ketua_pondok',
      waktu: waktuNow,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    };
    storageService.saveKoordinasi(pesan);
    recordSuratKeluarRiwayat({ ...srt, status: 'Resmi / Terbit' }, 'Dikirim');
    showToast(`Surat Keluar ${srt.nomorSurat} berhasil dikirim dan tercatat di Riwayat Surat Keluar.`);
  };

  const handleDownloadRiwayatMasukWord = (rowsList: ArsipSurat[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    downloadWordDocument({
      filename: `Riwayat_Surat_Masuk_Sekretaris_${todayStr}.doc`,
      title: 'RIWAYAT SURAT MASUK SEKRETARIAT PONDOK',
      subtitle: `Rekapitulasi Surat Masuk yang Diteruskan ke Ketua Pondok (${rowsList.length} Surat)`,
      namaPondok: suratConfig.kopNamaPondok || systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
      alamatPondok: suratConfig.kopAlamatKontak || systemConfig.alamatPondok,
      kotaInstansi: suratConfig.kotaTerbit || 'Karawang',
      penandatanganNama: currentUser.nama,
      penandatanganJabatan: currentUser.jabatan || 'Sekretaris Umum Pondok',
      summaryLines: [`Total Riwayat Surat Masuk: ${rowsList.length} dokumen`],
      columns: [
        { header: 'No', width: '5%', align: 'center' },
        { header: 'Tanggal & Nomor Surat', width: '18%' },
        { header: 'Pengirim & Perihal', width: '24%' },
        { header: 'Isi Surat (Teks Digital)', width: '38%' },
        { header: 'Waktu Kirim Ketua', width: '15%' },
      ],
      rows: rowsList.map((s, idx) => [
        String(idx + 1),
        `${s.tanggalSurat}\n${s.nomorSurat}`,
        `${s.tujuanAtauPengirim || '-'}\nPerihal: ${s.perihal}`,
        s.isiSurat || '-',
        s.waktuKirimKetua || s.createdAt || '-',
      ]),
    });
    showToast('File Word (.doc) Riwayat Surat Masuk berhasil diunduh.');
  };

  const handleDownloadRiwayatKeluarWord = (rowsList: ArsipSurat[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    downloadWordDocument({
      filename: `Riwayat_Surat_Keluar_Sekretaris_${todayStr}.doc`,
      title: 'RIWAYAT SURAT KELUAR SEKRETARIAT PONDOK',
      subtitle: `Rekapitulasi Surat Keluar yang Dikirim, Dicetak, & Diunduh (${rowsList.length} Surat)`,
      namaPondok: suratConfig.kopNamaPondok || systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
      alamatPondok: suratConfig.kopAlamatKontak || systemConfig.alamatPondok,
      kotaInstansi: suratConfig.kotaTerbit || 'Karawang',
      penandatanganNama: currentUser.nama,
      penandatanganJabatan: currentUser.jabatan || 'Sekretaris Umum Pondok',
      summaryLines: [`Total Riwayat Surat Keluar: ${rowsList.length} dokumen`],
      columns: [
        { header: 'No', width: '5%', align: 'center' },
        { header: 'Tanggal & Nomor Surat', width: '20%' },
        { header: 'Jenis & Perihal', width: '25%' },
        { header: 'Tujuan Surat', width: '22%' },
        { header: 'Aktivitas Terakhir', width: '28%' },
      ],
      rows: rowsList.map((s, idx) => [
        String(idx + 1),
        `${s.tanggalSurat}\n${s.nomorSurat}`,
        `${s.kodeJenis} - ${s.perihal}`,
        `${s.tujuanAtauPengirim || '-'}\n${s.alamatTujuan || ''}`,
        `${s.aksiRiwayatKeluar || 'Tercatat'} (${s.waktuRiwayatKeluar || s.createdAt || '-'})`,
      ]),
    });
    showToast('File Word (.doc) Riwayat Surat Keluar berhasil diunduh.');
  };

  const persistPengaturanSurat = (targetCfg: SuratSekretarisConfig = kopForm) => {
    const savedPejabat = savePengaturanSuratToStorage({
      namaKetua: targetCfg.namaPenandatangan2,
      jabatanKetua: targetCfg.jabatanPenandatangan2,
      ttdKetua: targetCfg.ttdUrl2 ?? '',
      namaSekretaris: targetCfg.namaPenandatangan,
      jabatanSekretaris: targetCfg.jabatanPenandatangan,
      ttdSekretaris: targetCfg.ttdUrl1 ?? '',
      tampilkanKetua: targetCfg.tampilkanPenandatangan2,
    });

    const syncedCfg: SuratSekretarisConfig = {
      ...targetCfg,
      pejabatUpdatedAt: savedPejabat.updatedAt,
    };

    setKopForm(syncedCfg);
    setFormSurat((prev) => ({
      ...prev,
      kotaTerbit: syncedCfg.kotaTerbit,
      jabatanPenandatangan: syncedCfg.jabatanPenandatangan,
      namaPenandatangan: syncedCfg.namaPenandatangan,
      ttdUrl1: syncedCfg.ttdUrl1 ?? '',
      jabatanPenandatangan2: syncedCfg.jabatanPenandatangan2,
      namaPenandatangan2: syncedCfg.namaPenandatangan2,
      ttdUrl2: syncedCfg.ttdUrl2 ?? '',
      tampilkanPenandatangan2: syncedCfg.tampilkanPenandatangan2,
    }));

    storageService.updateSystemConfig({
      ...systemConfig,
      suratSekretarisConfig: syncedCfg,
    });
    onDataChanged();
    showToast('Pengaturan Tanda Tangan & Nama Pejabat Berhasil Disimpan!');
  };

  const handleSaveKopConfig = (e: React.FormEvent) => {
    e.preventDefault();
    persistPengaturanSurat(kopForm);
  };

  const handleUploadImageToField = (
    e: React.ChangeEvent<HTMLInputElement>,
    onResult: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        onResult(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSignatureImage = async (
    role: 'ketua' | 'sekretaris',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const base64 = await convertSignatureFileToBase64(file);
      if (!base64) return;
      const updated = {
        ...kopForm,
        ...(role === 'ketua' ? { ttdUrl2: base64 } : { ttdUrl1: base64 }),
      };
      setKopForm(updated);
      savePengaturanSuratToStorage({
        namaKetua: updated.namaPenandatangan2,
        jabatanKetua: updated.jabatanPenandatangan2,
        ttdKetua: updated.ttdUrl2 ?? '',
        namaSekretaris: updated.namaPenandatangan,
        jabatanSekretaris: updated.jabatanPenandatangan,
        ttdSekretaris: updated.ttdUrl1 ?? '',
        tampilkanKetua: updated.tampilkanPenandatangan2,
      });
      setFormSurat((prev) => ({
        ...prev,
        ...(role === 'ketua' ? { ttdUrl2: base64 } : { ttdUrl1: base64 }),
      }));
      showToast(
        role === 'ketua'
          ? 'Gambar Tanda Tangan Ketua Pondok berhasil dikonversi ke Base64 & disimpan!'
          : 'Gambar Tanda Tangan Sekretaris berhasil dikonversi ke Base64 & disimpan!'
      );
    } catch {
      showToast('Gagal memproses gambar tanda tangan. Pastikan format PNG/JPG valid.');
    }
  };

  // -------------------------------------------------------------
  // STATE DATA SANTRI (KELAS, BIODATA LENGKAP, FOTO, WALI & CRUD)
  // -------------------------------------------------------------
  const [searchSantri, setSearchSantri] = useState('');
  const [filterGenderSantri, setFilterGenderSantri] = useState<'all' | Gender>('all');
  const [filterKelasSantri, setFilterKelasSantri] = useState<string>('Semua');
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [showSantriForm, setShowSantriForm] = useState(false);
  const [santriForm, setSantriForm] = useState<Partial<Santri>>({
    nis: `20260${Math.floor(100 + Math.random() * 899)}`,
    nama: '',
    gender: 'putra',
    kelas: '1 Wustho (Tsanawiyah)',
    kamar: 'K-01 (Imam Syafi\'i)',
    asrama: 'Asrama Putra Al-Maliki',
    alamat: '',
    namaWali: '',
    noWaWali: '0812',
    status: 'Aktif',
    kondisiKesehatan: 'Sehat',
    tglMasuk: new Date().toISOString().split('T')[0],
    foto: '',
  });

  // Hitung rekap jumlah santri per kelas secara real-time
  const rekapSantriPerKelas = useMemo(() => {
    const map = new Map<string, { kelas: string; total: number; putra: number; putri: number }>();
    santriList.forEach((s) => {
      const kls = (s.kelas || 'Belum Ditentukan').trim();
      const cur = map.get(kls) || { kelas: kls, total: 0, putra: 0, putri: 0 };
      cur.total += 1;
      if (s.gender === 'putra') cur.putra += 1;
      else cur.putri += 1;
      map.set(kls, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.kelas.localeCompare(b.kelas));
  }, [santriList]);

  const daftarPilihanKelas = useMemo(() => {
    const set = new Set<string>(DAFTAR_KELAS_STANDAR);
    santriList.forEach((s) => {
      if (s.kelas) set.add(s.kelas);
    });
    return Array.from(set);
  }, [santriList]);

  const openTambahSantriBaru = () => {
    setEditingSantri(null);
    setSantriForm({
      nis: `20260${Math.floor(100 + Math.random() * 899)}`,
      nama: '',
      gender: 'putra',
      kelas: filterKelasSantri !== 'Semua' ? filterKelasSantri : '1 Wustho (Tsanawiyah)',
      kamar: 'K-01 (Imam Syafi\'i)',
      asrama: 'Asrama Putra Al-Maliki',
      alamat: '',
      namaWali: '',
      noWaWali: '0812',
      status: 'Aktif',
      kondisiKesehatan: 'Sehat',
      tglMasuk: new Date().toISOString().split('T')[0],
      foto: '',
    });
    setShowSantriForm(true);
  };

  const openEditSantri = (s: Santri) => {
    setEditingSantri(s);
    setSantriForm({ ...s });
    setShowSantriForm(true);
  };

  const handleSaveSantriBaru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriForm.nama?.trim() || !santriForm.nis?.trim()) return;
    const item: Santri = {
      id: editingSantri ? editingSantri.id : `s_${Date.now()}`,
      nis: santriForm.nis.trim(),
      nama: santriForm.nama.trim(),
      foto: santriForm.foto?.trim() || '',
      gender: (santriForm.gender as Gender) || 'putra',
      kelas: santriForm.kelas?.trim() || '1 Wustho (Tsanawiyah)',
      kamar: santriForm.kamar?.trim() || 'K-01',
      asrama:
        santriForm.asrama?.trim() ||
        (santriForm.gender === 'putri' ? 'Asrama Putri Khadijah' : 'Asrama Putra Al-Maliki'),
      alamat: santriForm.alamat?.trim() || 'Karawang',
      namaWali: santriForm.namaWali?.trim() || 'Wali Santri',
      noWaWali: santriForm.noWaWali?.trim() || '0812-',
      jarakRumahKm: editingSantri?.jarakRumahKm || 15,
      status: (santriForm.status as Santri['status']) || 'Aktif',
      kondisiKesehatan: (santriForm.kondisiKesehatan as Santri['kondisiKesehatan']) || 'Sehat',
      poinPelanggaran: editingSantri?.poinPelanggaran || 0,
      tglMasuk: santriForm.tglMasuk || new Date().toISOString().split('T')[0],
    };
    storageService.saveSantri(item);
    onDataChanged();
    setShowSantriForm(false);
    setEditingSantri(null);
    showToast(
      editingSantri
        ? `Data santri ${item.nama} (Kelas ${item.kelas}) berhasil diperbarui & disinkronkan ke Dashboard Utama.`
        : `Santri baru ${item.nama} (Kelas ${item.kelas}) berhasil ditambahkan ke Database Utama.`
    );
  };

  const handleDeleteSantri = (s: Santri) => {
    storageService.deleteSantri(s.id);
    onDataChanged();
    showToast(`Data santri ${s.nama} telah dihapus dari sistem.`);
  };

  // -------------------------------------------------------------
  // STATE DATA USTADZ & USTADZAH + NOTULEN RAPAT
  // -------------------------------------------------------------
  const ustadzList: DataUstadz[] = systemConfig.ustadzList || [];
  const notulenList: NotulenRapat[] = systemConfig.notulenRapatList || [];

  const [ustadzForm, setUstadzForm] = useState<Partial<DataUstadz>>({
    nip: `UST-${ new Date().getFullYear() }-${ String(ustadzList.length + 1).padStart(2, '0') }`,
    nama: '',
    gender: 'ustadz',
    statusMukim: 'Mukim',
    jabatan: 'Pengajar Kitab & Pembina',
    divisi: 'Pendidikan & Taklim',
    bidangKitab: 'Fiqih & Nahwu Shorof',
    noWa: '0812',
    jadwalPiket: 'Senin & Kamis',
    statusAktif: true,
  });

  const handleSaveUstadz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ustadzForm.nama?.trim()) return;
    const item: DataUstadz = {
      id: `ust_${Date.now()}`,
      nip: ustadzForm.nip || `UST-${Date.now().toString().slice(-4)}`,
      nama: ustadzForm.nama.trim(),
      gender: (ustadzForm.gender as 'ustadz' | 'ustadzah') || 'ustadz',
      statusMukim: (ustadzForm.statusMukim as 'Mukim' | 'Laju') || 'Mukim',
      jabatan: ustadzForm.jabatan || 'Asatidz',
      divisi: (ustadzForm.divisi as any) || 'Pendidikan & Taklim',
      bidangKitab: ustadzForm.bidangKitab || 'Kitab Kuning',
      noWa: ustadzForm.noWa || '0812-',
      jadwalPiket: ustadzForm.jadwalPiket || 'Harian',
      statusAktif: true,
    };
    storageService.updateSystemConfig({
      ...systemConfig,
      ustadzList: [item, ...ustadzList],
    });
    onDataChanged();
    setUstadzForm({ ...ustadzForm, nama: '' });
    showToast(`Data ${item.nama} berhasil disimpan ke direktori Ustadz/Ustadzah.`);
  };

  const handleDeleteUstadz = (id: string) => {
    storageService.updateSystemConfig({
      ...systemConfig,
      ustadzList: ustadzList.filter((u) => u.id !== id),
    });
    onDataChanged();
  };

  const [notulenForm, setNotulenForm] = useState<Partial<NotulenRapat>>({
    judulRapat: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '19:30 WIB',
    tempat: 'Aula Utama Pondok',
    pimpinanRapat: 'K.H. Ahmad Faqih Al-Maliki',
    jumlahPeserta: 18,
    pesertaHadir: '',
    agendaBahasan: '',
    hasilKeputusan: '',
    notulis: currentUser.nama,
  });

  const handleSaveNotulen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notulenForm.judulRapat?.trim() || !notulenForm.hasilKeputusan?.trim()) return;
    const pesertaHadirClean = (notulenForm.pesertaHadir || '').trim();
    const item: NotulenRapat = {
      id: `not_${Date.now()}`,
      judulRapat: notulenForm.judulRapat.trim(),
      tanggal: notulenForm.tanggal || new Date().toISOString().split('T')[0],
      waktu: notulenForm.waktu || '19:30 WIB',
      tempat: notulenForm.tempat || 'Aula Pondok',
      pimpinanRapat: notulenForm.pimpinanRapat || 'Ketua Pondok',
      jumlahPeserta: Number(notulenForm.jumlahPeserta) || 15,
      pesertaHadir: pesertaHadirClean || undefined,
      agendaBahasan: notulenForm.agendaBahasan?.trim() || '-',
      hasilKeputusan: notulenForm.hasilKeputusan.trim(),
      notulis: notulenForm.notulis || currentUser.nama,
    };
    storageService.updateSystemConfig({
      ...systemConfig,
      notulenRapatList: [item, ...notulenList],
    });

    // Otomatis bagikan hasil notulen rapat ke setiap pengurus (Kotak Masuk & Notifikasi Dashboard)
    const now = new Date();
    const waktuDistribusi =
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB (' +
      now.toISOString().split('T')[0] +
      ')';
    const pesanNotulen: PesanKoordinasi = {
      id: `krd_notulen_${Date.now()}`,
      nomorTiket: `NTL-${item.tanggal.replace(/-/g, '').slice(2)}-${Math.floor(100 + Math.random() * 900)}`,
      judul: `[NOTULEN RAPAT] ${item.judulRapat} (${item.tanggal})`,
      isi: [
        `Tanggal & Waktu : ${item.tanggal} · ${item.waktu}`,
        `Tempat          : ${item.tempat}`,
        `Pimpinan Rapat  : ${item.pimpinanRapat}`,
        `Yang Hadir      : ${pesertaHadirClean || `${item.jumlahPeserta} Pengurus`}`,
        `Inti Pembahasan : ${item.agendaBahasan}`,
        `Hasil Keputusan :\n${item.hasilKeputusan}`,
        `Notulis         : ${item.notulis}`,
      ].join('\n'),
      prioritas: 'Penting',
      kategori: 'Instruksi Admin',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan:
        currentUser.role === 'sekretaris'
          ? currentUser.jabatan || 'Sekretaris Pondok'
          : 'Sekretaris Pondok',
      pengirimAvatar: currentUser.avatar || '',
      tujuan: 'semua_dewan',
      waktu: waktuDistribusi,
      tanggal: item.tanggal,
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    };
    storageService.saveKoordinasi(pesanNotulen);

    onDataChanged();
    setNotulenForm({
      ...notulenForm,
      judulRapat: '',
      pesertaHadir: '',
      agendaBahasan: '',
      hasilKeputusan: '',
    });
    showToast('Notulen rapat berhasil diarsipkan dan otomatis dibagikan ke Kotak Masuk seluruh pengurus.');
  };

  // Helper untuk merender Kertas A4 (dipakai di Tab Buat Surat dan di Live Preview Editor Format Surat)
  const renderA4PaperPreview = (
    cfg: SuratSekretarisConfig,
    suratData: Partial<ArsipSurat>,
    kodeSuratAktif: KodeJenisSurat,
    elementId?: string,
    preferLiveConfig = false
  ) => {
    const logoSizePx = cfg.ukuranLogoPx || 68;
    const paddingClass =
      cfg.marginSuratMm === 15
        ? 'p-5 sm:p-7'
        : cfg.marginSuratMm === 25
          ? 'p-8 sm:p-14'
          : 'p-6 sm:p-10';
    const fontSizeClass =
      cfg.ukuranFontSurat === 'kecil'
        ? 'text-[11px] leading-[1.55]'
        : cfg.ukuranFontSurat === 'besar'
          ? 'text-[13.5px] leading-[1.7]'
          : 'text-[12px] leading-[1.65]';
    const textAlignClass = cfg.perataanIsi === 'left' ? 'text-left' : 'text-justify';

    const leftLogoSrc =
      (cfg.kopLogoUrl && !cfg.kopLogoUrl.includes('2026-11-11-7ffd46ad')
        ? cfg.kopLogoUrl
        : 'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png') ||
      'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png';
    const rightLogoSrc =
      cfg.kopLogoKananUrl &&
      cfg.kopLogoKananUrl.trim() !== '' &&
      !cfg.kopLogoKananUrl.includes('2026-11-11-7ffd46ad')
        ? cfg.kopLogoKananUrl
        : 'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg';
    const pejabat = resolvePejabatSurat(cfg, suratData, preferLiveConfig);
    const ttd1Src = pejabat.ttdSekretaris;
    const ttd2Src = pejabat.ttdKetua;
    const showSigner2 = pejabat.tampilkanKetua;

    const formattedTanggal = (() => {
      if (!suratData.tanggalSurat) return '';
      const d = new Date(suratData.tanggalSurat);
      if (isNaN(d.getTime())) return suratData.tanggalSurat;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    })();

    return (
      <div
        id={elementId}
        className={`bg-white text-slate-900 rounded-2xl ${paddingClass} shadow-2xl border-2 border-[#d4af37]/50 max-w-[210mm] mx-auto font-serif transition-all`}
      >
        {/* Kop Surat Resmi Pesantren (2 Logo Kiri & Kanan Proporsional) */}
        <div className="border-b-4 border-double border-emerald-900 pb-3.5 mb-5 flex items-center justify-between gap-3">
          <div
            style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
            className="shrink-0 flex items-center justify-center"
          >
            <img
              src={leftLogoSrc}
              alt="Logo Kiri Pondok"
              referrerPolicy="no-referrer"
              style={{ maxWidth: `${logoSizePx}px`, maxHeight: `${logoSizePx}px` }}
              className="w-full h-full object-contain"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = '1';
                  img.src = '/kop-logo-1.png';
                }
              }}
            />
          </div>

          <div className="text-center flex-1 min-w-0 px-1">
            {cfg.tampilkanBismillah && (
              <p className="text-xs font-bold text-emerald-900 mb-0.5">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            )}
            <p className="text-[11px] font-bold tracking-wider text-emerald-900 uppercase">
              {cfg.kopNamaYayasan}
            </p>
            <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-950 uppercase leading-tight">
              {cfg.kopNamaPondok}
            </h2>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              {cfg.kopSubInstansi}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
              {cfg.kopAlamatKontak}
            </p>
          </div>

          {rightLogoSrc ? (
            <div
              style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
              className="shrink-0 flex items-center justify-center"
            >
              <img
                src={rightLogoSrc}
                alt="Logo Kanan Pondok"
                referrerPolicy="no-referrer"
                style={{ maxWidth: `${logoSizePx}px`, maxHeight: `${logoSizePx}px` }}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = '/kop-logo-2.jpg';
                  }
                }}
              />
            </div>
          ) : (
            <div style={{ width: `${logoSizePx}px` }} className="shrink-0 hidden sm:block" />
          )}
        </div>

        {/* Blok Nomor, Lampiran, Perihal & Tanggal */}
        <div className={`flex flex-col sm:flex-row justify-between gap-2 ${fontSizeClass} mb-4`}>
          <div className="space-y-0.5">
            <p>
              <span className="inline-block w-20 font-semibold">Nomor</span>: {suratData.nomorSurat}
            </p>
            <p>
              <span className="inline-block w-20 font-semibold">Lampiran</span>: {suratData.lampiran || '-'}
            </p>
            <p>
              <span className="inline-block w-20 font-semibold">Perihal</span>:{' '}
              <strong className="underline">{suratData.perihal}</strong>
            </p>
          </div>
          {cfg.posisiTanggal !== 'bawah_kanan' && (
            <div className="sm:text-right font-medium shrink-0">
              <p>
                {suratData.kotaTerbit || cfg.kotaTerbit}, {formattedTanggal}
              </p>
            </div>
          )}
        </div>

        {/* Tujuan Surat */}
        {suratData.tujuanAtauPengirim && (
          <div className={`${fontSizeClass} mb-4`}>
            <p>Kepada Yth.</p>
            <p className="font-bold">{suratData.tujuanAtauPengirim}</p>
            <p>{suratData.alamatTujuan || 'Di Tempat'}</p>
          </div>
        )}

        {/* Judul Tengah (Khusus SK, SPn, SM, ST, SKet, SR, SPPD, SRT, PK) */}
        {['SK', 'SPn', 'SM', 'ST', 'SKet', 'SR', 'SPPD', 'SRT', 'PK'].includes(kodeSuratAktif) && (
          <div className="text-center my-4">
            <h4 className="text-sm font-black uppercase underline tracking-wide text-slate-950">
              {suratData.perihal}
            </h4>
            <p className="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
              Nomor: {suratData.nomorSurat}
            </p>
          </div>
        )}

        {/* Isi Surat */}
        <div className={`${fontSizeClass} space-y-3 ${textAlignClass}`}>
          {suratData.salamPembuka && <p className="font-bold italic">{suratData.salamPembuka}</p>}
          {suratData.kalimatPembuka && <p>{suratData.kalimatPembuka}</p>}
          <div className="whitespace-pre-line font-serif text-slate-900 py-1">
            {suratData.isiSurat}
          </div>
          {suratData.penutupSurat && <p>{suratData.penutupSurat}</p>}
        </div>

        {/* Kolom Tanda Tangan & Tanda Tangan Digital (Dinamis dari almaliki_pengaturan_surat) */}
        <div className={`mt-7 pt-3 ${fontSizeClass}`}>
          <div className="grid grid-cols-2 gap-6 text-center items-end">
            {showSigner2 ? (
              <div className="flex flex-col items-center">
                <p className="text-[11px] text-slate-600">Mengetahui,</p>
                <p className="font-bold">{pejabat.jabatanKetua}</p>
                <div
                  style={{ height: '65px', minHeight: '65px' }}
                  className="surat-ttd-box w-full flex items-center justify-center my-1 relative"
                >
                  {ttd2Src && (
                    <img
                      src={ttd2Src}
                      alt="Tanda Tangan Ketua Pondok"
                      referrerPolicy="no-referrer"
                      style={{
                        height: '65px',
                        maxHeight: '65px',
                        maxWidth: '165px',
                        objectFit: 'contain',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact',
                      }}
                      className="surat-ttd-img mx-auto select-none"
                    />
                  )}
                </div>
                <p className="font-bold underline">{pejabat.namaKetua}</p>
              </div>
            ) : (
              <div />
            )}

            <div className="flex flex-col items-center relative">
              <p className="text-[11px] text-slate-600">
                {suratData.kotaTerbit || cfg.kotaTerbit}, {formattedTanggal}
              </p>
              <p className="font-bold">{pejabat.jabatanSekretaris}</p>
              <div
                style={{ height: '65px', minHeight: '65px' }}
                className="surat-ttd-box w-full flex items-center justify-center my-1 relative"
              >
                {cfg.tampilkanStempel && (
                  cfg.stempelUrl ? (
                    <img
                      src={cfg.stempelUrl}
                      alt="Stempel Resmi Pondok"
                      referrerPolicy="no-referrer"
                      style={{
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact',
                      }}
                      className="max-h-16 max-w-[90px] object-contain opacity-80 absolute left-2 sm:left-4 pointer-events-none"
                    />
                  ) : (
                    <span className="inline-block px-2 py-0.5 border-2 border-emerald-800/60 text-emerald-900/75 text-[8px] font-mono font-bold uppercase rounded -rotate-6 absolute left-1 sm:left-3 pointer-events-none">
                      STEMPEL RESMI PONDOK
                    </span>
                  )
                )}
                {ttd1Src && (
                  <img
                    src={ttd1Src}
                    alt="Tanda Tangan Sekretaris"
                    referrerPolicy="no-referrer"
                    style={{
                      height: '65px',
                      maxHeight: '65px',
                      maxWidth: '165px',
                      objectFit: 'contain',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    }}
                    className="surat-ttd-img mx-auto relative z-10 select-none"
                  />
                )}
              </div>
              <p className="font-bold underline">{pejabat.namaSekretaris}</p>
            </div>
          </div>
        </div>

        {/* Tembusan / Catatan Kaki */}
        {suratData.tembusan && (
          <div className="mt-6 pt-2 border-t border-slate-300 text-[10px] text-slate-600">
            <p className="font-bold">Tembusan / Catatan:</p>
            <p className="italic">{suratData.tembusan}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#062a1d] via-[#041d14] to-[#02100a] border border-[#d4af37]/40 p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center shrink-0">
            <FileSignature className="w-6 h-6 text-[#e5c158]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#d4af37]/20 border border-[#d4af37]/40 text-[10px] font-mono font-bold text-[#e5c158] uppercase">
                SEKRETARIAT PUSAT PONDOK
              </span>
              <span className="text-xs font-mono text-emerald-300">
                15 Standar Surat Pesantren · Cetak &amp; PDF A4 Presisi · TTD Digital URL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#f4f9f5] tracking-tight mt-1">
              Sistem Administrasi &amp; Persuratan Sekretaris
            </h1>
            <p className="text-xs sm:text-sm text-[#d1e7da] mt-0.5">
              Penerbitan otomatis 15 jenis surat resmi pesantren, rekap data santri per kelas, dan arsip surat masuk/keluar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 shrink-0">
          <div className="px-3.5 py-2.5 rounded-2xl bg-[#041f15] border border-[#d4af37]/25 text-center">
            <p className="text-[10px] text-[#9ec5b0] uppercase font-semibold">Total Arsip</p>
            <p className="text-lg font-black text-[#f4f9f5] font-mono">{arsipList.length}</p>
          </div>
          <div className="px-3.5 py-2.5 rounded-2xl bg-[#041f15] border border-[#d4af37]/25 text-center">
            <p className="text-[10px] text-[#9ec5b0] uppercase font-semibold">Surat Keluar</p>
            <p className="text-lg font-black text-[#e5c158] font-mono">
              {arsipList.filter((s) => s.arah === 'Keluar').length}
            </p>
          </div>
          <div className="px-3.5 py-2.5 rounded-2xl bg-[#041f15] border border-[#d4af37]/25 text-center">
            <p className="text-[10px] text-[#9ec5b0] uppercase font-semibold">Data Santri</p>
            <p className="text-lg font-black text-emerald-400 font-mono">
              {santriList.length}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#d4af37]/25 pb-3">
        {[
          { key: 'kotak_masuk', label: 'Kotak Masuk & Pesan', icon: Inbox },
          { key: 'buat_surat', label: 'Terbitkan 15 Jenis Surat', icon: Plus },
          { key: 'riwayat_surat', label: `Riwayat Surat (${arsipList.length})`, icon: History },
          { key: 'data_santri_psb', label: `Data Santri per Kelas (${santriList.length})`, icon: Users },
          { key: 'data_ustadz', label: `Data Ustadz & Ustadzah (${ustadzList.length})`, icon: GraduationCap },
          { key: 'notulen_agenda', label: 'Notulen Rapat & Kalender', icon: Calendar },
          { key: 'pengaturan_kop', label: 'Editor Format Surat & TTD Digital', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SekretarisTabKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                active
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] border-[#f3d266] shadow-md'
                  : 'bg-[#052419] text-[#d1e7da] hover:text-white border-[#d4af37]/25'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 border border-emerald-300 text-xs font-extrabold text-white flex items-center gap-2 shadow-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB 0: KOTAK MASUK & PESAN LINTAS DIVISI */}
      {activeTab === 'kotak_masuk' && (
        <DivisiKotakMasuk
          currentUser={currentUser}
          koordinasiList={koordinasiList}
          viewerDivision="Sekretaris"
        />
      )}

      {/* TAB 1: BUAT SURAT OTOMATIS & PRATINJAU A4 */}
      {activeTab === 'buat_surat' && (
        <div className="space-y-6">
          {/* Pilihan Cepat 15 Jenis Surat */}
          <div className="rounded-3xl bg-[#052419]/90 border border-[#d4af37]/30 p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5c158] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Pilih 1 dari 15 Jenis Format Surat Standar Pesantren</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('pengaturan_kop')}
                className="px-3 py-1.5 rounded-xl bg-[#031810] hover:bg-[#083021] text-[#e5c158] border border-[#d4af37]/40 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Atur Kop, Logo &amp; Link TTD Digital</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {DAFTAR_15_JENIS_SURAT.map((j) => {
                const isSelected = selectedKode === j.kode;
                return (
                  <button
                    key={j.kode}
                    type="button"
                    onClick={() => handleSelectJenisSurat(j.kode)}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#0d4a33] to-[#06281c] border-[#d4af37] shadow-md'
                        : 'bg-[#031810]/90 hover:bg-[#072c1e] border-[#d4af37]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#e5c158] font-mono text-[10px] font-bold">
                        {j.kode}
                      </span>
                      <span className="text-[10px] text-[#9ec5b0] truncate ml-1">{j.kategori}</span>
                    </div>
                    <p className="text-xs font-bold text-[#f4f9f5] mt-1.5 leading-snug">{j.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 Kolom: Form Editor Surat & Pratinjau Kertas A4 */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Form Editor (5 cols) */}
            <form
              onSubmit={handleSaveArsip}
              className="xl:col-span-5 rounded-3xl bg-[#052419]/95 border border-[#d4af37]/30 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3">
                <h3 className="text-sm font-bold text-[#f4f9f5] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#e5c158]" />
                  <span>Editor Isi &amp; Metadata Surat ({selectedKode})</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setFormSurat({
                      ...formSurat,
                      nomorSurat: generateNomorOtomatis(selectedKode),
                    })
                  }
                  className="text-[11px] font-mono text-[#e5c158] hover:underline cursor-pointer"
                >
                  Reset Nomor Otomatis
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Arah Surat</label>
                  <select
                    value={formSurat.arah || 'Keluar'}
                    onChange={(e) => setFormSurat({ ...formSurat, arah: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  >
                    <option value="Keluar">Surat Keluar (Resmi Pondok)</option>
                    <option value="Masuk">Registrasi Surat Masuk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    value={formSurat.tanggalSurat || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#d1e7da] font-semibold mb-1">Nomor Surat Resmi</label>
                  <input
                    type="text"
                    required
                    value={formSurat.nomorSurat || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#e5c158] font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#d1e7da] font-semibold mb-1">Perihal / Judul Surat</label>
                  <input
                    type="text"
                    required
                    value={formSurat.perihal || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, perihal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Kepada Yth. / Pengirim</label>
                  <input
                    type="text"
                    value={formSurat.tujuanAtauPengirim || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, tujuanAtauPengirim: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Lampiran &amp; Tempat Tujuan</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Lampiran"
                      value={formSurat.lampiran || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, lampiran: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                    />
                    <input
                      type="text"
                      placeholder="Kota/Tempat"
                      value={formSurat.alamatTujuan || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, alamatTujuan: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#d1e7da] font-semibold mb-1">Kalimat Pembuka</label>
                  <textarea
                    rows={2}
                    value={formSurat.kalimatPembuka || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, kalimatPembuka: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#d1e7da] font-semibold mb-1">Isi Pokok Surat</label>
                  <textarea
                    rows={6}
                    required
                    value={formSurat.isiSurat || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, isiSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5] font-mono text-xs leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#d1e7da] font-semibold mb-1">Kalimat Penutup</label>
                  <textarea
                    rows={2}
                    value={formSurat.penutupSurat || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, penutupSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>

                {/* Pengaturan Cepat Penandatangan & Link TTD Digital pada Surat Ini */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#031810] border border-[#d4af37]/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-[11px] font-bold text-[#e5c158] uppercase flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Pejabat Penandatangan &amp; TTD Digital (Tersinkron Otomatis)</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pengaturan_kop')}
                      className="text-[10px] font-bold text-emerald-300 hover:underline cursor-pointer"
                    >
                      Ubah Pengaturan Permanen &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Jabatan Sekretaris"
                      value={formSurat.jabatanPenandatangan || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, jabatanPenandatangan: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                    />
                    <input
                      type="text"
                      placeholder="Nama Lengkap & Gelar Sekretaris"
                      value={formSurat.namaPenandatangan || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, namaPenandatangan: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Link URL / Base64 Gambar TTD Sekretaris"
                      value={formSurat.ttdUrl1 || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, ttdUrl1: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/30 text-[#e5c158] font-mono text-[11px]"
                    />
                    <label className="px-2.5 py-1.5 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#f3d266] text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0">
                      <Upload className="w-3 h-3" />
                      <span>Upload PNG/JPG</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/*"
                        className="hidden"
                        onChange={(e) => void handleUploadSignatureImage('sekretaris', e)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Jabatan Ketua Pondok"
                      value={formSurat.jabatanPenandatangan2 || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, jabatanPenandatangan2: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                    />
                    <input
                      type="text"
                      placeholder="Nama Lengkap & Gelar Ketua Pondok"
                      value={formSurat.namaPenandatangan2 || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, namaPenandatangan2: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Link URL / Base64 Gambar TTD Ketua Pondok"
                      value={formSurat.ttdUrl2 || ''}
                      onChange={(e) => setFormSurat({ ...formSurat, ttdUrl2: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/30 text-[#e5c158] font-mono text-[11px]"
                    />
                    <label className="px-2.5 py-1.5 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#f3d266] text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0">
                      <Upload className="w-3 h-3" />
                      <span>Upload PNG/JPG</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/*"
                        className="hidden"
                        onChange={(e) => void handleUploadSignatureImage('ketua', e)}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Status Dokumen</label>
                  <select
                    value={formSurat.status || 'Resmi / Terbit'}
                    onChange={(e) => setFormSurat({ ...formSurat, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  >
                    <option value="Resmi / Terbit">Resmi / Terbit</option>
                    <option value="Menunggu TTD">Menunggu TTD Ketua Pondok</option>
                    <option value="Draft">Draft Konsep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Tembusan / Catatan Kaki</label>
                  <input
                    type="text"
                    value={formSurat.tembusan || ''}
                    onChange={(e) => setFormSurat({ ...formSurat, tembusan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingSuratId ? 'Perbarui & Simpan Arsip' : 'Simpan & Terbitkan ke Arsip'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="py-2.5 px-3.5 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 border border-[#d4af37]/40 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#e5c158]" />
                  <span>Cetak A4</span>
                </button>
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={handleDownloadPdf}
                  className="py-2.5 px-3.5 rounded-xl bg-[#031810] hover:bg-[#083021] text-[#e5c158] font-bold text-xs flex items-center gap-1.5 border border-[#d4af37]/40 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
                </button>
              </div>
            </form>

            {/* Live A4 Paper Preview (7 cols) */}
            <div className="xl:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-2 flex-wrap gap-2">
                <span className="text-xs font-bold text-[#e5c158] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Pratinjau Kertas A4 Resmi (Hasil Cetak &amp; PDF Sama Persis)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintA4}
                    className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 border border-[#d4af37]/40 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#e5c158]" />
                    <span>Cetak Printer</span>
                  </button>
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={handleDownloadPdf}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF A4'}</span>
                  </button>
                </div>
              </div>

              {renderA4PaperPreview(suratConfig, formSurat, selectedKode, 'sekretaris-surat-a4-print')}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1B: RIWAYAT SURAT (TABEL 1: SURAT MASUK + SCAN KAMERA OCR + KIRIM KE KETUA PONDOK, TABEL 2: SURAT KELUAR OTOMATIS) */}
      {activeTab === 'riwayat_surat' && (() => {
        const suratMasukAktif = arsipList.filter((s) => s.arah === 'Masuk' && !s.dikirimKeKetua);
        const riwayatSuratMasuk = arsipList.filter((s) => s.arah === 'Masuk' && Boolean(s.dikirimKeKetua));
        const suratKeluarAktif = arsipList.filter((s) => s.arah === 'Keluar' && !s.statusRiwayatKeluar);
        const riwayatSuratKeluar = arsipList.filter((s) => s.arah === 'Keluar' && Boolean(s.statusRiwayatKeluar));

        return (
          <div className="space-y-6">
            {/* TABEL 1: SURAT MASUK + SCAN KAMERA OCR + KIRIM + RIWAYAT SURAT MASUK */}
            <div className="rounded-3xl bg-[#052419]/95 border border-[#d4af37]/40 p-5 space-y-5 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#d4af37]/25 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-[#e5c158]" />
                    <span>Tabel 1: Surat Masuk ({suratMasukAktif.length} Baru)</span>
                  </h2>
                  <p className="text-xs text-[#9ec5b0] mt-0.5">
                    Gunakan tombol Scan Surat untuk memotret surat dengan kamera layar penuh HP/Laptop; Gemini OCR otomatis mengekstrak teks Latin maupun Arab langsung ke kolom formulir Surat Masuk.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScanInitialPreview(null);
                      setShowScanModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer hover:brightness-105"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Surat (Kamera)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => uploadFotoInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-[#042116] hover:bg-[#083524] text-[#f3d266] border border-[#d4af37]/45 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih File / Upload Foto Surat</span>
                  </button>
                  <input
                    ref={uploadFotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDirectUploadSuratMasuk}
                  />
                  <button
                    type="button"
                    onClick={() => setShowManualMasukForm((v) => !v)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#031810] hover:bg-[#083524] text-[#e5c158] border border-[#d4af37]/40 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showManualMasukForm ? 'Tutup Form' : 'Input Formulir Surat Masuk'}</span>
                  </button>
                </div>
              </div>

              {showManualMasukForm && (
                <form
                  id="form-surat-masuk-sekretaris"
                  onSubmit={handleSaveManualSuratMasuk}
                  className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#d4af37]/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#f3d266]">
                        Formulir Surat Masuk
                      </span>
                      {manualMasukFromScan && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Hasil Scan Kamera (Latin &amp; Arab)</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScanModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#052419] hover:bg-[#083524] text-[#e5c158] border border-[#d4af37]/35 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan Ulang Kamera</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[#d1e7da] font-semibold mb-1">Nomor Surat Masuk</label>
                      <input
                        type="text"
                        placeholder="Otomatis jika dikosongkan"
                        value={manualMasukForm.nomorSurat}
                        onChange={(e) =>
                          setManualMasukForm({ ...manualMasukForm, nomorSurat: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#d1e7da] font-semibold mb-1">Tanggal Surat</label>
                      <input
                        type="date"
                        value={manualMasukForm.tanggalSurat}
                        onChange={(e) =>
                          setManualMasukForm({ ...manualMasukForm, tanggalSurat: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#d1e7da] font-semibold mb-1">Pengirim / Instansi</label>
                      <input
                        type="text"
                        placeholder="Nama pengirim atau instansi..."
                        value={manualMasukForm.tujuanAtauPengirim}
                        onChange={(e) =>
                          setManualMasukForm({
                            ...manualMasukForm,
                            tujuanAtauPengirim: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[#d1e7da] font-semibold mb-1">Perihal Surat *</label>
                      <input
                        type="text"
                        required
                        dir="auto"
                        placeholder="Perihal atau inti surat masuk..."
                        value={manualMasukForm.perihal}
                        onChange={(e) =>
                          setManualMasukForm({ ...manualMasukForm, perihal: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[#d1e7da] font-semibold mb-1">
                        Isi Surat (Teks Digital — Mendukung Huruf Latin &amp; Arab) *
                      </label>
                      <textarea
                        ref={isiSuratMasukRef}
                        rows={6}
                        required
                        dir="auto"
                        placeholder="Hasil ekstraksi kamera akan otomatis muncul di sini, atau ketik isi surat masuk..."
                        value={manualMasukForm.isiSurat}
                        onChange={(e) =>
                          setManualMasukForm({ ...manualMasukForm, isiSurat: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5] leading-relaxed"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualMasukForm(false);
                        setManualMasukFromScan(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#052419] text-[#d1e7da] border border-[#d4af37]/30 font-bold text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#03140d] font-bold text-xs cursor-pointer"
                    >
                      Simpan ke Tabel Surat Masuk
                    </button>
                  </div>
                </form>
              )}

              {/* Daftar Surat Masuk Aktif */}
              <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25 bg-[#031810]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#d4af37]/30 text-[#e5c158] uppercase text-[10px] font-mono bg-[#02110b]">
                      <th className="py-3 px-3 text-center whitespace-nowrap">No</th>
                      <th className="py-3 px-3 whitespace-nowrap">Tanggal &amp; Nomor</th>
                      <th className="py-3 px-3 whitespace-nowrap">Pengirim &amp; Perihal</th>
                      <th className="py-3 px-3">Isi Surat (Teks Digital)</th>
                      <th className="py-3 px-3 text-right whitespace-nowrap">Kirim &amp; Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/15">
                    {suratMasukAktif.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 px-4 text-center text-[#9ec5b0]">
                          Belum ada surat masuk baru. Klik &quot;Scan Surat (Kamera)&quot; untuk memindai surat ke bentuk teks digital.
                        </td>
                      </tr>
                    ) : (
                      suratMasukAktif.map((srt, idx) => (
                        <tr key={srt.id} className="hover:bg-[#072e20]/60 align-top">
                          <td className="py-3 px-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono">
                            <div className="text-[#f3d266] font-bold">{srt.nomorSurat}</div>
                            <div className="text-[11px] text-[#9ec5b0]">{srt.tanggalSurat}</div>
                            {srt.sumberScanKamera && (
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                                  {srt.metodeScan === 'google_docs' ? 'GOOGLE DOCS OCR' : 'HASIL SCAN OCR'}
                                </span>
                                {srt.googleDocUrl && (
                                  <a
                                    href={srt.googleDocUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/40 text-[9px] font-bold hover:underline"
                                  >
                                    <span>Docs</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 min-w-[180px] max-w-xs">
                            <div className="font-bold text-white">{srt.perihal}</div>
                            <div className="text-[11px] text-[#d1e7da] mt-0.5">
                              Dari: {srt.tujuanAtauPengirim || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-3 min-w-[260px] max-w-xl">
                            {editingMasukId === srt.id ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={4}
                                  dir="auto"
                                  value={editingMasukText}
                                  onChange={(e) => setEditingMasukText(e.target.value)}
                                  className="w-full px-2.5 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/40 text-[#f4f9f5] text-xs"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      storageService.saveArsipSurat({
                                        ...srt,
                                        isiSurat: editingMasukText,
                                      });
                                      onDataChanged();
                                      setEditingMasukId(null);
                                      showToast('Teks isi surat berhasil diperbarui.');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#d4af37] text-[#03140d] font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Save className="w-3 h-3" />
                                    <span>Simpan Teks</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMasukId(null)}
                                    className="px-2.5 py-1 rounded-lg bg-[#052419] text-[#d1e7da] border border-[#d4af37]/30 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Batal</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div dir="auto" className="whitespace-pre-line text-[#e2f2e9] leading-relaxed max-h-40 overflow-y-auto pr-1">
                                {srt.isiSurat}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleKirimSuratMasukKeKetua(srt)}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-[11px] inline-flex items-center gap-1 shadow cursor-pointer"
                                title="Kirim ke Kotak Masuk Ketua Pondok & Masukkan ke Riwayat"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Kirim</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMasukId(srt.id);
                                  setEditingMasukText(srt.isiSurat || '');
                                }}
                                className="p-1.5 rounded-lg bg-[#052419] hover:bg-[#083524] text-[#e5c158] border border-[#d4af37]/30 cursor-pointer"
                                title="Edit Teks Isi Surat"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  storageService.deleteArsipSurat(srt.id);
                                  onDataChanged();
                                  showToast(`Surat Masuk ${srt.nomorSurat} dihapus.`);
                                }}
                                className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/30 cursor-pointer"
                                title="Hapus Surat Masuk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sub-Tabel Riwayat Surat Masuk (Otomatis terisi setelah dikirim ke Ketua Pondok) */}
              <div className="pt-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4" />
                      <span>Riwayat Surat Masuk Terkirim ke Ketua Pondok ({riwayatSuratMasuk.length})</span>
                    </h3>
                    <p className="text-[11px] text-[#9ec5b0]">
                      Surat masuk yang telah dikirim ke Kotak Masuk Ketua Pondok otomatis masuk ke riwayat ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadRiwayatMasukWord(riwayatSuratMasuk)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-xs inline-flex items-center gap-1.5 shadow cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Word (.doc)</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-emerald-700/40 bg-[#031810]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#d4af37]/30 text-emerald-300 uppercase text-[10px] font-mono bg-[#02110b]">
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">No</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tanggal &amp; Nomor</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Pengirim &amp; Perihal</th>
                        <th className="py-2.5 px-3">Ringkasan Isi Surat</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Status Pengiriman</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/15">
                      {riwayatSuratMasuk.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-5 px-4 text-center text-[#9ec5b0]">
                            Belum ada riwayat surat masuk terkirim. Klik tombol &quot;Kirim&quot; pada Tabel Surat Masuk di atas.
                          </td>
                        </tr>
                      ) : (
                        riwayatSuratMasuk.map((srt, idx) => (
                          <tr key={srt.id} className="hover:bg-[#072e20]/50 align-top">
                            <td className="py-3 px-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                            <td className="py-3 px-3 whitespace-nowrap font-mono">
                              <div className="text-white font-bold">{srt.nomorSurat}</div>
                              <div className="text-[11px] text-[#9ec5b0]">{srt.tanggalSurat}</div>
                            </td>
                            <td className="py-3 px-3 min-w-[170px]">
                              <div className="font-bold text-white">{srt.perihal}</div>
                              <div className="text-[11px] text-[#d1e7da]">{srt.tujuanAtauPengirim || '-'}</div>
                            </td>
                            <td className="py-3 px-3 min-w-[220px] max-w-md">
                              <div dir="auto" className="whitespace-pre-line text-[#d1e7da] line-clamp-3">
                                {srt.isiSurat}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/75 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Terkirim ke Ketua Pondok
                              </span>
                              <div className="text-[10px] font-mono text-[#9ec5b0] mt-1">
                                {srt.waktuKirimKetua || srt.createdAt}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  storageService.deleteArsipSurat(srt.id);
                                  onDataChanged();
                                  showToast(`Riwayat Surat Masuk ${srt.nomorSurat} berhasil dihapus.`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/35 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                title="Hapus Riwayat Surat Masuk"
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

            {/* TABEL 2: SURAT KELUAR + RIWAYAT SURAT KELUAR (OTOMATIS SAAT DIKIRIM / DICETAK / DIDOWNLOAD) */}
            <div className="rounded-3xl bg-[#052419]/95 border border-[#d4af37]/40 p-5 space-y-5 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#d4af37]/25 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-[#e5c158]" />
                    <span>Tabel 2: Surat Keluar &amp; Riwayat Aktivitas ({suratKeluarAktif.length} Draft/Siap · {riwayatSuratKeluar.length} Riwayat)</span>
                  </h2>
                  <p className="text-xs text-[#9ec5b0] mt-0.5">
                    Setiap surat keluar yang dikirim, dicetak, atau diunduh PDF otomatis masuk ke Tabel Riwayat Surat Keluar di bawah ini.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('buat_surat')}
                    className="px-3.5 py-2 rounded-xl bg-[#031810] hover:bg-[#083524] text-[#e5c158] border border-[#d4af37]/40 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Surat Keluar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadRiwayatKeluarWord(riwayatSuratKeluar)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Word (.doc)</span>
                  </button>
                </div>
              </div>

              {/* Surat Keluar Siap Kirim / Cetak / Unduh */}
              {suratKeluarAktif.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-mono uppercase text-[#e5c158] font-bold">
                    Daftar Surat Keluar Siap Kirim / Cetak / Download ({suratKeluarAktif.length})
                  </p>
                  <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25 bg-[#031810]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#d4af37]/30 text-[#e5c158] uppercase text-[10px] font-mono bg-[#02110b]">
                          <th className="py-2.5 px-3 text-center">No</th>
                          <th className="py-2.5 px-3">Nomor &amp; Tanggal</th>
                          <th className="py-2.5 px-3">Perihal &amp; Tujuan</th>
                          <th className="py-2.5 px-3 text-right">Kirim / Cetak / PDF / Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4af37]/15">
                        {suratKeluarAktif.map((srt, idx) => (
                          <tr key={srt.id} className="hover:bg-[#072e20]/60 align-top">
                            <td className="py-3 px-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                            <td className="py-3 px-3 whitespace-nowrap font-mono">
                              <div className="text-[#f3d266] font-bold">{srt.nomorSurat}</div>
                              <div className="text-[11px] text-[#9ec5b0]">
                                {srt.kodeJenis} · {srt.tanggalSurat}
                              </div>
                            </td>
                            <td className="py-3 px-3 min-w-[200px]">
                              <div className="font-bold text-white">{srt.perihal}</div>
                              <div className="text-[11px] text-[#d1e7da]">Kepada: {srt.tujuanAtauPengirim || '-'}</div>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleKirimSuratKeluar(srt)}
                                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Kirim</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintArsipSurat(srt)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-700 text-white border border-[#d4af37]/35 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#e5c158]" />
                                  <span>Cetak</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isDownloadingPdf}
                                  onClick={() => handleDownloadArsipPdf(srt)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 border border-emerald-500/40 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    storageService.deleteArsipSurat(srt.id);
                                    onDataChanged();
                                    showToast(`Surat Keluar ${srt.nomorSurat} dihapus.`);
                                  }}
                                  className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/30 cursor-pointer"
                                  title="Hapus Surat Keluar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tabel Riwayat Surat Keluar */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-mono uppercase text-emerald-300 font-bold flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#e5c158]" />
                  <span>Riwayat Surat Keluar (Dikirim / Dicetak / Didownload — {riwayatSuratKeluar.length})</span>
                </p>
                <div className="overflow-x-auto rounded-2xl border border-emerald-700/40 bg-[#031810]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#d4af37]/30 text-emerald-300 uppercase text-[10px] font-mono bg-[#02110b]">
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">No</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tanggal &amp; Nomor</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Perihal &amp; Tujuan</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Aktivitas Terakhir</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi &amp; Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/15">
                      {riwayatSuratKeluar.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 px-4 text-center text-[#9ec5b0]">
                            Belum ada riwayat surat keluar. Surat keluar akan otomatis masuk ke sini setiap kali dikirim, dicetak A4, atau diunduh PDF.
                          </td>
                        </tr>
                      ) : (
                        riwayatSuratKeluar.map((srt, idx) => (
                          <tr key={srt.id} className="hover:bg-[#072e20]/50 align-top">
                            <td className="py-3 px-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                            <td className="py-3 px-3 whitespace-nowrap font-mono">
                              <div className="text-[#f3d266] font-bold">{srt.nomorSurat}</div>
                              <div className="text-[11px] text-[#9ec5b0]">
                                {srt.kodeJenis} · {srt.tanggalSurat}
                              </div>
                            </td>
                            <td className="py-3 px-3 min-w-[200px] max-w-md">
                              <div className="font-bold text-white">{srt.perihal}</div>
                              <div className="text-[11px] text-[#d1e7da] mt-0.5">
                                Tujuan: {srt.tujuanAtauPengirim || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/75 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                {srt.aksiRiwayatKeluar || 'Tercatat'}
                              </span>
                              <div className="text-[10px] font-mono text-[#9ec5b0] mt-1">
                                {srt.waktuRiwayatKeluar || srt.createdAt}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleLoadArsipToPreview(srt)}
                                  className="px-2 py-1.5 rounded-lg bg-[#052419] hover:bg-[#083524] text-[#e5c158] border border-[#d4af37]/30 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  title="Buka di Pratinjau A4"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Pratinjau</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintArsipSurat(srt)}
                                  className="px-2 py-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-700 text-white border border-[#d4af37]/30 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  title="Cetak Ulang"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#e5c158]" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isDownloadingPdf}
                                  onClick={() => handleDownloadArsipPdf(srt)}
                                  className="px-2 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 border border-emerald-500/40 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                  title="Unduh Ulang PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    storageService.deleteArsipSurat(srt.id);
                                    onDataChanged();
                                    showToast(`Riwayat Surat Keluar ${srt.nomorSurat} berhasil dihapus.`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/35 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  title="Hapus Riwayat Surat Keluar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
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
            </div>
          </div>
        );
      })()}

      {/* TAB 3: DATA SANTRI PER KELAS, BIODATA LENGKAP, FOTO & WALI (TERINTEGRASI DASHBOARD UTAMA) */}
      {activeTab === 'data_santri_psb' && (
        <div className="space-y-6">
          {/* Rekapitulasi Jumlah Santri Sesuai Kelas Masing-Masing */}
          <div className="rounded-3xl bg-[#052419]/95 border border-[#d4af37]/35 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#f4f9f5] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#e5c158]" />
                  <span>Rekapitulasi Jumlah Santri Sesuai Kelas Masing-Masing</span>
                </h3>
                <p className="text-xs text-[#9ec5b0] mt-0.5">
                  Klik salah satu kartu kelas di bawah untuk memfilter daftar santri per kelas. Seluruh perubahan otomatis tersinkron ke Dashboard Admin &amp; Pengurus.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {filterKelasSantri !== 'Semua' && (
                  <button
                    type="button"
                    onClick={() => setFilterKelasSantri('Semua')}
                    className="px-3 py-2 rounded-xl bg-[#031810] text-[#e5c158] border border-[#d4af37]/40 text-xs font-bold cursor-pointer"
                  >
                    Tampilkan Semua Kelas ({santriList.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={openTambahSantriBaru}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Input Manual Santri Baru</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => setFilterKelasSantri('Semua')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  filterKelasSantri === 'Semua'
                    ? 'bg-gradient-to-br from-[#0d4a33] to-[#052419] border-[#d4af37] shadow-lg'
                    : 'bg-[#031810]/90 hover:bg-[#072c1e] border-[#d4af37]/25'
                }`}
              >
                <p className="text-[10px] font-mono uppercase text-[#e5c158] font-bold">Total Seluruh Kelas</p>
                <p className="text-2xl font-black text-white font-mono mt-1">{santriList.length}</p>
                <p className="text-[10px] text-emerald-300 mt-1">
                  Putra: {santriList.filter((s) => s.gender === 'putra').length} · Putri:{' '}
                  {santriList.filter((s) => s.gender === 'putri').length}
                </p>
              </button>

              {rekapSantriPerKelas.map((rk) => {
                const isSelected = filterKelasSantri === rk.kelas;
                return (
                  <button
                    key={rk.kelas}
                    type="button"
                    onClick={() => setFilterKelasSantri(isSelected ? 'Semua' : rk.kelas)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#0d4a33] to-[#052419] border-[#d4af37] shadow-lg'
                        : 'bg-[#031810]/90 hover:bg-[#072c1e] border-[#d4af37]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-[#f4f9f5] truncate">{rk.kelas}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#e5c158] font-mono text-[10px] font-bold">
                        {rk.total} Santri
                      </span>
                    </div>
                    <p className="text-xl font-black text-[#e5c158] font-mono mt-1">{rk.total}</p>
                    <p className="text-[10px] text-[#9ec5b0] mt-0.5">
                      Banin: {rk.putra} · Banat: {rk.putri}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Input / Edit Manual Profil, NIS, Kelas, Alamat, Wali & Foto Santri */}
          {showSantriForm && (
            <form
              onSubmit={handleSaveSantriBaru}
              className="rounded-3xl bg-[#052419]/95 border-2 border-[#d4af37]/60 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-3">
                <h3 className="text-sm font-black text-[#e5c158] uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {editingSantri
                      ? `Edit Biodata Santri: ${editingSantri.nama}`
                      : 'Formulir Input Manual Data Santri Baru'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowSantriForm(false);
                    setEditingSantri(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-red-950/60 text-red-200 text-xs font-bold cursor-pointer"
                >
                  Tutup Form
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Nomor Induk Santri (NIS)</label>
                  <input
                    type="text"
                    required
                    value={santriForm.nis || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, nis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#e5c158] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Nama Lengkap Santri</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap sesuai KK"
                    value={santriForm.nama || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, nama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Gender (Banin / Banat)</label>
                  <select
                    value={santriForm.gender || 'putra'}
                    onChange={(e) => setSantriForm({ ...santriForm, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  >
                    <option value="putra">Santri Putra (Banin)</option>
                    <option value="putri">Santri Putri (Banat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Kelas Pengajian / Madrasah</label>
                  <input
                    type="text"
                    list="daftar-kelas-santri-list"
                    required
                    placeholder="Pilih atau ketik nama kelas"
                    value={santriForm.kelas || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                  <datalist id="daftar-kelas-santri-list">
                    {daftarPilihanKelas.map((k) => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Kamar &amp; Asrama</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Kamar (K-01)"
                      value={santriForm.kamar || ''}
                      onChange={(e) => setSantriForm({ ...santriForm, kamar: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                    />
                    <input
                      type="text"
                      placeholder="Nama Asrama"
                      value={santriForm.asrama || ''}
                      onChange={(e) => setSantriForm({ ...santriForm, asrama: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Status &amp; Kesehatan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={santriForm.status || 'Aktif'}
                      onChange={(e) => setSantriForm({ ...santriForm, status: e.target.value as any })}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                    >
                      <option value="Aktif">Aktif Mondok</option>
                      <option value="Sakit">Sakit / Poskestren</option>
                      <option value="Cuti">Izin Pulang / Cuti</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                    <select
                      value={santriForm.kondisiKesehatan || 'Sehat'}
                      onChange={(e) => setSantriForm({ ...santriForm, kondisiKesehatan: e.target.value as any })}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                    >
                      <option value="Sehat">Sehat</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Rawat Jalan">Rawat Jalan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Nama Wali Santri</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Ayah / Ibu / Wali"
                    value={santriForm.namaWali || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, namaWali: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    required
                    placeholder="0812xxxxxxxx"
                    value={santriForm.noWaWali || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, noWaWali: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#d1e7da] font-semibold mb-1">Alamat Domisili Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Desa/Kelurahan, Kecamatan, Kabupaten"
                    value={santriForm.alamat || ''}
                    onChange={(e) => setSantriForm({ ...santriForm, alamat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[#e5c158] font-bold mb-1">
                    Foto Profil Santri (Link URL Gambar atau Upload File)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      placeholder="Tempel Link URL Foto Santri (https://...) atau gunakan tombol Upload"
                      value={santriForm.foto || ''}
                      onChange={(e) => setSantriForm({ ...santriForm, foto: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/35 text-[#f4f9f5] font-mono"
                    />
                    <label className="px-4 py-2 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/50 text-[#f3d266] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-4 h-4" />
                      <span>Upload Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUploadImageToField(e, (dataUrl) =>
                            setSantriForm((prev) => ({ ...prev, foto: dataUrl }))
                          )
                        }
                      />
                    </label>
                    {santriForm.foto && (
                      <img
                        src={santriForm.foto}
                        alt="Preview Santri"
                        className="w-10 h-10 rounded-xl object-cover border border-[#d4af37]"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingSantri ? 'Simpan Perubahan Data Santri' : 'Simpan Santri Baru ke Database'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tabel Induk Santri */}
          <div className="rounded-3xl bg-[#052419]/95 border border-[#d4af37]/30 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5c158]">
                  Buku Induk Data Santri ({santriList.length} Santri Terdaftar)
                </h3>
                <p className="text-[11px] text-[#9ec5b0]">
                  Menampilkan Foto Profil, Nama, NIS, Kelas, Kamar, Alamat, dan Nama Wali Santri.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama, NIS, kelas, alamat, wali..."
                  value={searchSantri}
                  onChange={(e) => setSearchSantri(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-xs text-[#f4f9f5]"
                />
                <select
                  value={filterKelasSantri}
                  onChange={(e) => setFilterKelasSantri(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-xs text-[#f4f9f5]"
                >
                  <option value="Semua">Semua Kelas</option>
                  {rekapSantriPerKelas.map((rk) => (
                    <option key={rk.kelas} value={rk.kelas}>
                      {rk.kelas} ({rk.total})
                    </option>
                  ))}
                </select>
                <select
                  value={filterGenderSantri}
                  onChange={(e) => setFilterGenderSantri(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-xs text-[#f4f9f5]"
                >
                  <option value="all">Putra &amp; Putri</option>
                  <option value="putra">Putra (Banin)</option>
                  <option value="putri">Putri (Banat)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#041d14] z-10">
                  <tr className="border-b border-[#d4af37]/30 text-[#e5c158] uppercase text-[10px]">
                    <th className="py-2.5 px-2.5">Profil &amp; NIS</th>
                    <th className="py-2.5 px-2.5">Gender</th>
                    <th className="py-2.5 px-2.5">Kelas &amp; Kamar</th>
                    <th className="py-2.5 px-2.5">Nama Wali &amp; WA</th>
                    <th className="py-2.5 px-2.5">Alamat Domisili</th>
                    <th className="py-2.5 px-2.5">Status</th>
                    <th className="py-2.5 px-2.5 text-right">Edit / Hapus / Surat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/15">
                  {santriList
                    .filter((s) => (filterGenderSantri === 'all' ? true : s.gender === filterGenderSantri))
                    .filter((s) => (filterKelasSantri === 'Semua' ? true : s.kelas === filterKelasSantri))
                    .filter(
                      (s) =>
                        !searchSantri.trim() ||
                        s.nama.toLowerCase().includes(searchSantri.toLowerCase()) ||
                        s.nis.toLowerCase().includes(searchSantri.toLowerCase()) ||
                        s.kelas.toLowerCase().includes(searchSantri.toLowerCase()) ||
                        s.namaWali.toLowerCase().includes(searchSantri.toLowerCase()) ||
                        s.alamat.toLowerCase().includes(searchSantri.toLowerCase())
                    )
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-[#072e20]/60">
                        <td className="py-2.5 px-2.5">
                          <div className="flex items-center gap-2.5">
                            {s.foto ? (
                              <img
                                src={s.foto}
                                alt={s.nama}
                                className="w-9 h-9 rounded-xl object-cover border border-[#d4af37]/60 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-[#031810] border border-[#d4af37]/40 flex items-center justify-center text-[#e5c158] shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#f4f9f5]">{s.nama}</p>
                              <p className="text-[10px] font-mono text-[#e5c158]">NIS: {s.nis}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 uppercase text-[10px] font-bold text-[#d1e7da]">
                          {s.gender === 'putra' ? 'Putra' : 'Putri'}
                        </td>
                        <td className="py-2.5 px-2.5 text-[#d1e7da]">
                          <span className="font-semibold text-white">{s.kelas}</span>
                          <p className="text-[10px] text-[#9ec5b0]">
                            Kamar {s.kamar} · {s.asrama}
                          </p>
                        </td>
                        <td className="py-2.5 px-2.5 text-[#d1e7da]">
                          <span className="font-semibold text-white">{s.namaWali}</span>
                          <p className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{s.noWaWali}</span>
                          </p>
                        </td>
                        <td className="py-2.5 px-2.5 text-[#d1e7da]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#e5c158] shrink-0" />
                            <span>{s.alamat}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'Sakit'
                                ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40'
                                : s.status === 'Aktif'
                                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditSantri(s)}
                              className="px-2.5 py-1 rounded-lg bg-[#031810] hover:bg-[#083021] text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectJenisSurat('SKet');
                                setFormSurat((prev) => ({
                                  ...prev,
                                  perihal: 'SURAT KETERANGAN AKTIF MONDOK',
                                  tujuanAtauPengirim: `Wali Santri: ${s.namaWali}`,
                                  isiSurat: `Nama Santri    : ${s.nama}\nNIS            : ${s.nis}\nKelas / Kamar  : ${s.kelas} / ${s.kamar}\nNama Wali      : ${s.namaWali}\nAlamat         : ${s.alamat}\n\nAdalah benar-benar santri aktif yang tercatat dan berdomisili di Pondok Pesantren Salaf Al-Maliki sejak tanggal ${s.tglMasuk} hingga saat ini dengan berkelakuan baik.`,
                                }));
                                setActiveTab('buat_surat');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#e5c158] border border-[#d4af37]/40 text-[10px] font-bold cursor-pointer"
                            >
                              Surat Aktif
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSantri(s)}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 cursor-pointer"
                              title="Hapus Santri"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA USTADZ, USTADZAH & PENGURUS */}
      {activeTab === 'data_ustadz' && (() => {
        const ustadzMukimList = ustadzList.filter((u) => (u.statusMukim || 'Mukim') === 'Mukim');
        const ustadzLajuList = ustadzList.filter((u) => u.statusMukim === 'Laju');
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveUstadz}
                className="lg:col-span-4 rounded-3xl bg-[#052419]/95 border border-[#d4af37]/30 p-5 space-y-3 text-xs"
              >
                <h3 className="text-sm font-bold text-[#e5c158] uppercase tracking-wider">
                  Tambah Data Ustadz / Ustadzah
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap & Gelar"
                  value={ustadzForm.nama || ''}
                  onChange={(e) => setUstadzForm({ ...ustadzForm, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={ustadzForm.gender || 'ustadz'}
                    onChange={(e) => setUstadzForm({ ...ustadzForm, gender: e.target.value as any })}
                    className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  >
                    <option value="ustadz">Ustadz (Putra)</option>
                    <option value="ustadzah">Ustadzah (Putri)</option>
                  </select>
                  <select
                    value={ustadzForm.statusMukim || 'Mukim'}
                    onChange={(e) => setUstadzForm({ ...ustadzForm, statusMukim: e.target.value as any })}
                    className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#e5c158] font-bold"
                  >
                    <option value="Mukim">Status: Mukim</option>
                    <option value="Laju">Status: Laju (PP)</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="NIP / Kode Asatidz"
                  value={ustadzForm.nip || ''}
                  onChange={(e) => setUstadzForm({ ...ustadzForm, nip: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#e5c158] font-mono"
                />
                <input
                  type="text"
                  placeholder="Jabatan Kepengurusan"
                  value={ustadzForm.jabatan || ''}
                  onChange={(e) => setUstadzForm({ ...ustadzForm, jabatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
                <input
                  type="text"
                  placeholder="Bidang Kitab / Mata Pelajaran"
                  value={ustadzForm.bidangKitab || ''}
                  onChange={(e) => setUstadzForm({ ...ustadzForm, bidangKitab: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="No. WhatsApp"
                    value={ustadzForm.noWa || ''}
                    onChange={(e) => setUstadzForm({ ...ustadzForm, noWa: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                  <input
                    type="text"
                    placeholder="Jadwal Piket / Mengajar"
                    value={ustadzForm.jadwalPiket || ''}
                    onChange={(e) => setUstadzForm({ ...ustadzForm, jadwalPiket: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-bold text-xs cursor-pointer"
                >
                  Simpan Data Ustadz/Ustadzah
                </button>
              </form>

              <div className="lg:col-span-8 rounded-3xl bg-[#052419]/95 border border-[#d4af37]/30 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5c158]">
                  Direktori Ustadz, Ustadzah &amp; Jadwal Tugas ({ustadzList.length} Personil)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ustadzList.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/25 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#e5c158] font-mono text-[10px] font-bold">
                            {u.nip}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-300">
                            {u.gender === 'ustadz' ? 'Ustadz' : 'Ustadzah'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-200">
                            {u.statusMukim || 'Mukim'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#f4f9f5] mt-1">{u.nama}</h4>
                        <p className="text-xs text-[#e5c158] font-medium">{u.jabatan}</p>
                        <p className="text-[11px] text-[#d1e7da] mt-1">Kitab/Bidang: {u.bidangKitab}</p>
                        <p className="text-[10px] text-[#9ec5b0] font-mono mt-1">
                          Jadwal: {u.jadwalPiket} · WA: {u.noWa}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteUstadz(u.id)}
                        className="p-1.5 rounded-lg bg-red-950/60 text-red-300 hover:bg-red-900 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2 KOLOM TABEL DI BAWAHNYA: TABEL 1 USTADZ & USTADZAH MUKIM, TABEL 2 USTADZ & USTADZAH LAJU */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Tabel 1: Ustadz & Ustadzah Mukim */}
              <div className="rounded-3xl bg-[#052419]/95 border border-emerald-500/40 p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                      <span>Tabel 1: Ustadz &amp; Ustadzah Mukim ({ustadzMukimList.length})</span>
                    </h3>
                    <p className="text-[11px] text-[#9ec5b0] mt-0.5">
                      Tenaga pengajar dan pengurus yang bermukim di lingkungan pondok.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                    MUKIM
                  </span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-emerald-800/50 bg-[#031810]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-800/60 text-emerald-300 uppercase text-[10px] font-mono bg-[#02110b]">
                        <th className="py-2.5 px-3 text-center">No</th>
                        <th className="py-2.5 px-3">Nama &amp; NIP</th>
                        <th className="py-2.5 px-3">Jabatan &amp; Kitab</th>
                        <th className="py-2.5 px-3">Jadwal &amp; WA</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/50">
                      {ustadzMukimList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 px-3 text-center text-[#9ec5b0]">
                            Belum ada data Ustadz/Ustadzah Mukim.
                          </td>
                        </tr>
                      ) : (
                        ustadzMukimList.map((u, idx) => (
                          <tr key={u.id} className="hover:bg-[#072e20]/60 align-top">
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{u.nama}</div>
                              <div className="text-[10px] font-mono text-[#e5c158]">
                                {u.nip} · {u.gender === 'ustadz' ? 'Ustadz' : 'Ustadzah'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-emerald-200">{u.jabatan}</div>
                              <div className="text-[11px] text-[#9ec5b0]">{u.bidangKitab}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[#d1e7da]">
                              <div>{u.jadwalPiket}</div>
                              <div className="text-[10px] text-emerald-300">{u.noWa}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteUstadz(u.id)}
                                className="p-1.5 rounded-lg bg-red-950/60 text-red-300 hover:bg-red-900 cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabel 2: Ustadz & Ustadzah Laju */}
              <div className="rounded-3xl bg-[#052419]/95 border border-[#d4af37]/40 p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#e5c158]" />
                      <span>Tabel 2: Ustadz &amp; Ustadzah Laju ({ustadzLajuList.length})</span>
                    </h3>
                    <p className="text-[11px] text-[#9ec5b0] mt-0.5">
                      Tenaga pengajar dan asatidz pulang-pergi (Laju / PP).
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3d266] font-mono text-[10px] font-bold">
                    LAJU (PP)
                  </span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25 bg-[#031810]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#d4af37]/30 text-[#e5c158] uppercase text-[10px] font-mono bg-[#02110b]">
                        <th className="py-2.5 px-3 text-center">No</th>
                        <th className="py-2.5 px-3">Nama &amp; NIP</th>
                        <th className="py-2.5 px-3">Jabatan &amp; Kitab</th>
                        <th className="py-2.5 px-3">Jadwal &amp; WA</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/15">
                      {ustadzLajuList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 px-3 text-center text-[#9ec5b0]">
                            Belum ada data Ustadz/Ustadzah Laju.
                          </td>
                        </tr>
                      ) : (
                        ustadzLajuList.map((u, idx) => (
                          <tr key={u.id} className="hover:bg-[#072e20]/60 align-top">
                            <td className="py-2.5 px-3 text-center font-mono text-[#e5c158]">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{u.nama}</div>
                              <div className="text-[10px] font-mono text-[#e5c158]">
                                {u.nip} · {u.gender === 'ustadz' ? 'Ustadz' : 'Ustadzah'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#f3d266]">{u.jabatan}</div>
                              <div className="text-[11px] text-[#9ec5b0]">{u.bidangKitab}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[#d1e7da]">
                              <div>{u.jadwalPiket}</div>
                              <div className="text-[10px] text-emerald-300">{u.noWa}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteUstadz(u.id)}
                                className="p-1.5 rounded-lg bg-red-950/60 text-red-300 hover:bg-red-900 cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        );
      })()}

      {/* TAB 5: NOTULEN RAPAT & KALENDER KEGIATAN PONDOK */}
      {activeTab === 'notulen_agenda' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveNotulen}
              className="lg:col-span-5 rounded-3xl bg-[#052419]/95 border border-[#d4af37]/30 p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-[#e5c158] uppercase tracking-wider">
                Catat Notulen Rapat Pengurus
              </h3>
              <p className="text-[11px] text-[#9ec5b0]">
                Setelah disimpan, notulen rapat otomatis dibagikan ke Kotak Masuk &amp; Notifikasi Dashboard seluruh pengurus.
              </p>
              <input
                type="text"
                required
                placeholder="Judul Rapat / Musyawarah"
                value={notulenForm.judulRapat || ''}
                onChange={(e) => setNotulenForm({ ...notulenForm, judulRapat: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={notulenForm.tanggal || ''}
                  onChange={(e) => setNotulenForm({ ...notulenForm, tanggal: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
                <input
                  type="text"
                  placeholder="Waktu (19:30 WIB)"
                  value={notulenForm.waktu || ''}
                  onChange={(e) => setNotulenForm({ ...notulenForm, waktu: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tempat Rapat"
                  value={notulenForm.tempat || ''}
                  onChange={(e) => setNotulenForm({ ...notulenForm, tempat: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
                <input
                  type="text"
                  placeholder="Pimpinan Rapat"
                  value={notulenForm.pimpinanRapat || ''}
                  onChange={(e) => setNotulenForm({ ...notulenForm, pimpinanRapat: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#e5c158] mb-1">
                  Peserta / Pengurus yang Hadir
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Tulis siapa saja yang hadir (contoh: Ketua Pondok, Sekretaris, Bendahara, Perlengkapan, Ketua Keamanan...)"
                  value={notulenForm.pesertaHadir || ''}
                  onChange={(e) => setNotulenForm({ ...notulenForm, pesertaHadir: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Inti / Pokok Bahasan Rapat..."
                value={notulenForm.agendaBahasan || ''}
                onChange={(e) => setNotulenForm({ ...notulenForm, agendaBahasan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
              />
              <textarea
                rows={4}
                required
                placeholder="Hasil Keputusan Musyawarah..."
                value={notulenForm.hasilKeputusan || ''}
                onChange={(e) => setNotulenForm({ ...notulenForm, hasilKeputusan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-bold text-xs cursor-pointer"
              >
                Simpan &amp; Bagikan Notulen Rapat ke Pengurus
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-3xl bg-[#052419]/95 border border-[#d4af37]/30 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5c158]">
                  Buku Notulen Rapat &amp; Kalender Agenda Pondok
                </h3>
                {notulenList.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/25 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#f4f9f5]">{n.judulRapat}</span>
                      <span className="text-[10px] font-mono text-[#e5c158] shrink-0">
                        {n.tanggal} · {n.waktu}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9ec5b0]">
                      Pimpinan: {n.pimpinanRapat} · Tempat: {n.tempat}
                    </p>
                    {n.pesertaHadir && (
                      <p className="text-[11px] text-emerald-300">
                        <strong>Yang Hadir:</strong> {n.pesertaHadir}
                      </p>
                    )}
                    <p className="text-xs text-[#d1e7da] bg-[#052419] p-2.5 rounded-xl border border-[#d4af37]/15 whitespace-pre-line">
                      <strong>Keputusan:</strong> {n.hasilKeputusan}
                    </p>
                  </div>
                ))}
                {agendaList.slice(0, 4).map((ag) => (
                  <div key={ag.id} className="p-3 rounded-xl bg-[#031810]/70 border border-emerald-500/25 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-emerald-200">{ag.judul}</p>
                      <p className="text-[10px] text-[#9ec5b0]">
                        {ag.tempat} · Divisi: {ag.divisiTerkait}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[#e5c158]">{ag.tanggal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABEL RIWAYAT NOTULENSI (CUKUP INTI PEMBAHASAN SAJA) */}
          <div className="rounded-3xl bg-[#052419]/95 border border-[#d4af37]/40 p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-[#e5c158]" />
                  <span>Tabel Riwayat Notulensi Rapat ({notulenList.length})</span>
                </h3>
                <p className="text-[11px] text-[#9ec5b0] mt-0.5">
                  Ringkasan inti pembahasan dari setiap rapat yang telah dilaksanakan.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25 bg-[#031810]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#d4af37]/30 text-[#e5c158] uppercase text-[10px] font-mono bg-[#02110b]">
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3 whitespace-nowrap w-36">Tanggal</th>
                    <th className="py-2.5 px-3 w-1/3">Judul Rapat</th>
                    <th className="py-2.5 px-3">Inti Pembahasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4af37]/15">
                  {notulenList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-[#9ec5b0]">
                        Belum ada riwayat notulensi rapat.
                      </td>
                    </tr>
                  ) : (
                    notulenList.map((n, idx) => (
                      <tr key={n.id} className="hover:bg-[#072e20]/60 align-top">
                        <td className="py-3 px-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono text-[#e5c158] whitespace-nowrap">
                          {n.tanggal}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">{n.judulRapat}</td>
                        <td className="py-3 px-3 text-[#d1e7da] whitespace-pre-line">
                          {n.agendaBahasan && n.agendaBahasan !== '-' ? n.agendaBahasan : n.hasilKeputusan}
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

      {/* TAB 6: EDITOR FORMAT SURAT, LOGO KOP, TANDA TANGAN DIGITAL VIA LINK URL & 15 TEMPLATE SURAT */}
      {activeTab === 'pengaturan_kop' && (() => {
        const activeTpl =
          kopForm.templates[selectedTemplateEditKode] ||
          INITIAL_SURAT_SEKRETARIS_CONFIG.templates[selectedTemplateEditKode];

        const updateTemplateField = (field: keyof typeof activeTpl, val: string) => {
          setKopForm((prev) => ({
            ...prev,
            templates: {
              ...prev.templates,
              [selectedTemplateEditKode]: {
                ...activeTpl,
                [field]: val,
              },
            },
          }));
        };

        const samplePreviewSurat: Partial<ArsipSurat> = {
          nomorSurat: generateNomorOtomatis(selectedTemplateEditKode, kopForm),
          tanggalSurat: new Date().toISOString().split('T')[0],
          lampiran: '1 (Satu) Berkas',
          perihal: activeTpl.judulDefault,
          tujuanAtauPengirim: 'Seluruh Pengurus & Civitas Pondok Pesantren Salaf Al-Maliki',
          alamatTujuan: 'Di Tempat',
          salamPembuka: activeTpl.salamPembuka,
          kalimatPembuka: activeTpl.kalimatPembuka,
          isiSurat: activeTpl.isiTemplate,
          penutupSurat: activeTpl.kalimatPenutup,
          kotaTerbit: kopForm.kotaTerbit,
          jabatanPenandatangan: kopForm.jabatanPenandatangan,
          namaPenandatangan: kopForm.namaPenandatangan,
          ttdUrl1: kopForm.ttdUrl1,
          jabatanPenandatangan2: kopForm.jabatanPenandatangan2,
          namaPenandatangan2: kopForm.namaPenandatangan2,
          ttdUrl2: kopForm.ttdUrl2,
          tampilkanPenandatangan2: kopForm.tampilkanPenandatangan2,
          tembusan: activeTpl.catatanKaki || '',
        };

        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Form Pengaturan Lengkap Format Surat (6 cols) */}
            <form
              onSubmit={handleSaveKopConfig}
              className="xl:col-span-6 rounded-3xl bg-[#052419]/95 border border-[#d4af37]/35 p-6 space-y-6 text-xs"
            >
              <div className="border-b border-[#d4af37]/25 pb-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-black text-[#f4f9f5] uppercase tracking-wide flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#e5c158]" />
                    <span>Option Panel Editor Format Surat Sekretaris</span>
                  </h3>
                  <p className="text-xs text-[#d1e7da] mt-0.5">
                    Atur Kop Surat, 2 Logo, Format Nomor, Susunan Kalimat 15 Surat, Tata Letak A4, &amp; Link Tanda Tangan Digital.
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-bold text-xs shadow-lg cursor-pointer"
                >
                  Simpan Pengaturan Surat
                </button>
              </div>

              {/* A. KOP SURAT & 2 LOGO (KIRI & KANAN) */}
              <div className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/30 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-[#e5c158] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>1. Kop Surat: 2 Logo Lembaga, Nama Lembaga, Alamat &amp; Identitas Pondok</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setKopForm((prev) => ({
                        ...prev,
                        kopLogoUrl: 'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png',
                        kopLogoKananUrl: 'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg',
                      }))
                    }
                    className="text-[10px] font-mono text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Gunakan 2 Logo Resmi Kop</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#d1e7da] font-semibold mb-1">Baris 1: Nama Yayasan / Lembaga</label>
                    <input
                      type="text"
                      value={kopForm.kopNamaYayasan}
                      onChange={(e) => setKopForm({ ...kopForm, kopNamaYayasan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#d1e7da] font-semibold mb-1">Baris 2: Nama Pondok Pesantren</label>
                    <input
                      type="text"
                      value={kopForm.kopNamaPondok}
                      onChange={(e) => setKopForm({ ...kopForm, kopNamaPondok: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5] font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[#d1e7da] font-semibold mb-1">Baris 3: Sub-Instansi / Sekretariat</label>
                    <input
                      type="text"
                      value={kopForm.kopSubInstansi}
                      onChange={(e) => setKopForm({ ...kopForm, kopSubInstansi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#e5c158]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[#d1e7da] font-semibold mb-1">Alamat Lengkap, Telepon &amp; Email Kop Surat</label>
                    <input
                      type="text"
                      value={kopForm.kopAlamatKontak}
                      onChange={(e) => setKopForm({ ...kopForm, kopAlamatKontak: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                    />
                  </div>

                  {/* Logo 1 Kiri */}
                  <div className="p-3 rounded-xl bg-[#052419]/80 border border-[#d4af37]/25 space-y-2">
                    <label className="block text-[#e5c158] font-bold">Logo 1 (Kiri Kop Surat) - Link URL / Upload</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={kopForm.kopLogoUrl}
                      onChange={(e) => setKopForm({ ...kopForm, kopLogoUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/35 text-[#f4f9f5] font-mono text-[11px]"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="px-2.5 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#f3d266] text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload File Logo 1</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleUploadImageToField(e, (dataUrl) =>
                              setKopForm((prev) => ({ ...prev, kopLogoUrl: dataUrl }))
                            )
                          }
                        />
                      </label>
                      {kopForm.kopLogoUrl && (
                        <img
                          src={kopForm.kopLogoUrl}
                          alt="Logo 1"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-contain bg-white rounded p-0.5 border border-[#d4af37]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Logo 2 Kanan */}
                  <div className="p-3 rounded-xl bg-[#052419]/80 border border-[#d4af37]/25 space-y-2">
                    <label className="block text-[#e5c158] font-bold">Logo 2 (Kanan Kop Surat) - Link URL / Upload</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={kopForm.kopLogoKananUrl || ''}
                      onChange={(e) => setKopForm({ ...kopForm, kopLogoKananUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/35 text-[#f4f9f5] font-mono text-[11px]"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="px-2.5 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#f3d266] text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload File Logo 2</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleUploadImageToField(e, (dataUrl) =>
                              setKopForm((prev) => ({ ...prev, kopLogoKananUrl: dataUrl }))
                            )
                          }
                        />
                      </label>
                      {kopForm.kopLogoKananUrl && (
                        <img
                          src={kopForm.kopLogoKananUrl}
                          alt="Logo 2"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-contain bg-white rounded p-0.5 border border-[#d4af37]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* B. NOMOR SURAT, TANGGAL, TEMPAT & TATA LETAK KERTAS A4 */}
              <div className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/30 space-y-3.5">
                <h4 className="text-xs font-bold text-[#e5c158] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>2. Penomoran, Tempat/Tanggal &amp; Tata Letak Kertas A4</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[#e5c158] font-bold mb-1">
                      Format Penomoran Surat Otomatis ({`{NOMOR}, {KODE}, {ROMAN}, {TAHUN}`})
                    </label>
                    <input
                      type="text"
                      value={kopForm.formatNomorSurat}
                      onChange={(e) => setKopForm({ ...kopForm, formatNomorSurat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/40 text-[#e5c158] font-mono font-bold"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-[#9ec5b0] mr-1">Preset Format Nomor:</span>
                      {[
                        '{NOMOR}/{KODE}/PP-ALMALIKI/{ROMAN}/{TAHUN}',
                        '{KODE}/{NOMOR}/SEK-MALIKI/{ROMAN}/{TAHUN}',
                        '{NOMOR}/YPI-ALMALIKI/{KODE}/{ROMAN}/{TAHUN}',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setKopForm({ ...kopForm, formatNomorSurat: preset })}
                          className="px-2 py-1 rounded-lg bg-[#052419] hover:bg-[#083524] border border-[#d4af37]/30 text-[10px] font-mono text-emerald-200 cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] font-mono text-emerald-300">
                      Contoh Hasil Nomor ({selectedTemplateEditKode}):{' '}
                      <strong className="text-[#f3d266]">
                        {generateNomorOtomatis(selectedTemplateEditKode, kopForm)}
                      </strong>
                    </p>
                  </div>
                  <div>
                    <label className="block text-[#d1e7da] font-semibold mb-1">Kota / Tempat Terbit Surat</label>
                    <input
                      type="text"
                      value={kopForm.kotaTerbit}
                      onChange={(e) => setKopForm({ ...kopForm, kotaTerbit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#d1e7da] font-semibold mb-1">Ukuran Logo pada Kop A4</label>
                    <select
                      value={kopForm.ukuranLogoPx || 68}
                      onChange={(e) => setKopForm({ ...kopForm, ukuranLogoPx: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                    >
                      <option value={56}>Kecil Proporsional (56 px)</option>
                      <option value={68}>Standar Resmi A4 (68 px)</option>
                      <option value={80}>Besar Jelas (80 px)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d1e7da] font-semibold mb-1">Ukuran Huruf (Font) Kertas A4</label>
                    <select
                      value={kopForm.ukuranFontSurat || 'sedang'}
                      onChange={(e) => setKopForm({ ...kopForm, ukuranFontSurat: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                    >
                      <option value="kecil">Kecil Rapat (10 pt)</option>
                      <option value="sedang">Standar Resmi (11 pt)</option>
                      <option value="besar">Besar Mudah Dibaca (12 pt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d1e7da] font-semibold mb-1">Margin Kertas A4</label>
                    <select
                      value={kopForm.marginSuratMm || 20}
                      onChange={(e) => setKopForm({ ...kopForm, marginSuratMm: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                    >
                      <option value={15}>Margin Rapat (15 mm)</option>
                      <option value={20}>Margin Standar A4 (20 mm)</option>
                      <option value={25}>Margin Lebar Resmi (25 mm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#d1e7da] font-semibold mb-1">Perataan Paragraf Isi Surat</label>
                    <select
                      value={kopForm.perataanIsi || 'justify'}
                      onChange={(e) => setKopForm({ ...kopForm, perataanIsi: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-[#052419] border border-[#d4af37]/30 text-[#f4f9f5]"
                    >
                      <option value="justify">Rata Kiri-Kanan (Justify)</option>
                      <option value="left">Rata Kiri (Left Align)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* C. PENGATURAN TANDA TANGAN & IDENTITAS PEJABAT SURAT */}
              <div className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-[#e5c158] uppercase tracking-wider flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4" />
                    <span>3. Pengaturan Tanda Tangan &amp; Identitas Pejabat Surat</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setKopForm((prev) => ({
                        ...prev,
                        ttdUrl1: '',
                        ttdUrl2: '',
                      }))
                    }
                    className="text-[10px] font-mono text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kosongkan Gambar TTD (TTD Basah)</span>
                  </button>
                </div>

                {/* Pejabat 1: Ketua Pondok */}
                <div className="p-3.5 rounded-xl bg-[#052419] border border-[#d4af37]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-white">
                      Ketua Pondok Pesantren (Sebelah Kiri / Mengetahui)
                    </p>
                    <label className="inline-flex items-center gap-1.5 text-emerald-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={kopForm.tampilkanPenandatangan2}
                        onChange={(e) => setKopForm({ ...kopForm, tampilkanPenandatangan2: e.target.checked })}
                      />
                      <span className="text-[11px] font-bold">Tampilkan</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[#9ec5b0] text-[10px] mb-1">Jabatan Ketua Pondok</label>
                      <input
                        type="text"
                        value={kopForm.jabatanPenandatangan2}
                        onChange={(e) => setKopForm({ ...kopForm, jabatanPenandatangan2: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9ec5b0] text-[10px] mb-1">
                        Nama Lengkap &amp; Gelar Ketua Pondok
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: K.H. Ahmad Faqih Al-Maliki"
                        value={kopForm.namaPenandatangan2}
                        onChange={(e) => setKopForm({ ...kopForm, namaPenandatangan2: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5] font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#e5c158] font-bold text-[11px] mb-1">
                      Link / Gambar Tanda Tangan Ketua Pondok (URL atau Upload PNG/JPG)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Tempel Link URL Tanda Tangan Ketua atau gunakan tombol Upload di samping"
                        value={kopForm.ttdUrl2 || ''}
                        onChange={(e) => setKopForm({ ...kopForm, ttdUrl2: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/40 text-[#e5c158] font-mono text-[11px]"
                      />
                      <label className="px-3 py-1.5 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#f3d266] text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Gambar Tanda Tangan (PNG/JPG)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/*"
                          className="hidden"
                          onChange={(e) => void handleUploadSignatureImage('ketua', e)}
                        />
                      </label>
                    </div>
                    {kopForm.ttdUrl2 ? (
                      <div className="mt-2 p-2 rounded-lg bg-white flex items-center justify-between">
                        <img
                          src={kopForm.ttdUrl2}
                          alt="Preview TTD Ketua Pondok"
                          style={{ height: '56px', objectFit: 'contain' }}
                        />
                        <button
                          type="button"
                          onClick={() => setKopForm({ ...kopForm, ttdUrl2: '' })}
                          className="text-[10px] font-bold text-red-600 hover:underline px-2 cursor-pointer"
                        >
                          Hapus TTD Ketua
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-[#9ec5b0] italic">
                        Kosong — area tanda tangan basah setinggi 65px akan disediakan rapi pada surat.
                      </p>
                    )}
                  </div>
                </div>

                {/* Pejabat 2: Sekretaris */}
                <div className="p-3.5 rounded-xl bg-[#052419] border border-[#d4af37]/30 space-y-2.5">
                  <p className="text-[11px] font-bold text-white">
                    Sekretaris Pondok (Sebelah Kanan)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[#9ec5b0] text-[10px] mb-1">Jabatan Sekretaris</label>
                      <input
                        type="text"
                        value={kopForm.jabatanPenandatangan}
                        onChange={(e) => setKopForm({ ...kopForm, jabatanPenandatangan: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9ec5b0] text-[10px] mb-1">
                        Nama Lengkap &amp; Gelar Sekretaris
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Ustadz Muhammad Yusuf, S.Pd"
                        value={kopForm.namaPenandatangan}
                        onChange={(e) => setKopForm({ ...kopForm, namaPenandatangan: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/30 text-[#f4f9f5] font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#e5c158] font-bold text-[11px] mb-1">
                      Link / Gambar Tanda Tangan Sekretaris (URL atau Upload PNG/JPG)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Tempel Link URL Tanda Tangan Sekretaris atau gunakan tombol Upload di samping"
                        value={kopForm.ttdUrl1 || ''}
                        onChange={(e) => setKopForm({ ...kopForm, ttdUrl1: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#031810] border border-[#d4af37]/40 text-[#e5c158] font-mono text-[11px]"
                      />
                      <label className="px-3 py-1.5 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#f3d266] text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Gambar Tanda Tangan (PNG/JPG)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/*"
                          className="hidden"
                          onChange={(e) => void handleUploadSignatureImage('sekretaris', e)}
                        />
                      </label>
                    </div>
                    {kopForm.ttdUrl1 ? (
                      <div className="mt-2 p-2 rounded-lg bg-white flex items-center justify-between">
                        <img
                          src={kopForm.ttdUrl1}
                          alt="Preview TTD Sekretaris"
                          style={{ height: '56px', objectFit: 'contain' }}
                        />
                        <button
                          type="button"
                          onClick={() => setKopForm({ ...kopForm, ttdUrl1: '' })}
                          className="text-[10px] font-bold text-red-600 hover:underline px-2 cursor-pointer"
                        >
                          Hapus TTD Sekretaris
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-[#9ec5b0] italic">
                        Kosong — area tanda tangan basah setinggi 65px akan disediakan rapi pada surat.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-[#f4f9f5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kopForm.tampilkanStempel}
                      onChange={(e) => setKopForm({ ...kopForm, tampilkanStempel: e.target.checked })}
                    />
                    <span>Tampilkan Stempel Resmi Pondok</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-[#f4f9f5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kopForm.tampilkanBismillah}
                      onChange={(e) => setKopForm({ ...kopForm, tampilkanBismillah: e.target.checked })}
                    />
                    <span>Tampilkan Kalimat Bismillah di Kop</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => persistPengaturanSurat(kopForm)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 border border-emerald-300/40 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Surat</span>
                  </button>
                </div>
              </div>

              {/* D. EDITOR SUSUNAN KALIMAT 15 JENIS SURAT */}
              <div className="p-4 rounded-2xl bg-[#031810] border border-[#d4af37]/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#e5c158] uppercase tracking-wider">
                    4. Edit Susunan Kalimat Default 15 Jenis Surat
                  </h4>
                  <select
                    value={selectedTemplateEditKode}
                    onChange={(e) => setSelectedTemplateEditKode(e.target.value as KodeJenisSurat)}
                    className="px-3 py-1.5 rounded-xl bg-[#052419] border border-[#d4af37]/40 text-[#f4f9f5] font-bold"
                  >
                    {DAFTAR_15_JENIS_SURAT.map((j) => (
                      <option key={j.kode} value={j.kode}>
                        {j.kode} — {j.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[#d1e7da] mb-1">Judul / Perihal Default ({selectedTemplateEditKode})</label>
                    <input
                      type="text"
                      value={activeTpl.judulDefault}
                      onChange={(e) => updateTemplateField('judulDefault', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#d1e7da] mb-1">Salam Pembuka</label>
                    <input
                      type="text"
                      value={activeTpl.salamPembuka}
                      onChange={(e) => updateTemplateField('salamPembuka', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#d1e7da] mb-1">Kalimat Pembuka</label>
                  <textarea
                    rows={2}
                    value={activeTpl.kalimatPembuka}
                    onChange={(e) => updateTemplateField('kalimatPembuka', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                  />
                </div>

                <div>
                  <label className="block text-[#d1e7da] mb-1">Susunan Isi Pokok Surat ({selectedTemplateEditKode})</label>
                  <textarea
                    rows={5}
                    value={activeTpl.isiTemplate}
                    onChange={(e) => updateTemplateField('isiTemplate', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#d1e7da] mb-1">Kalimat Penutup</label>
                  <textarea
                    rows={2}
                    value={activeTpl.kalimatPenutup}
                    onChange={(e) => updateTemplateField('kalimatPenutup', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                  />
                </div>

                <div>
                  <label className="block text-[#d1e7da] mb-1">Tembusan / Catatan Kaki</label>
                  <input
                    type="text"
                    value={activeTpl.catatanKaki || ''}
                    onChange={(e) => updateTemplateField('catatanKaki', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#052419] border border-[#d4af37]/25 text-[#f4f9f5]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-bold text-xs shadow-lg cursor-pointer"
                >
                  Simpan Pengaturan Surat
                </button>
              </div>
            </form>

            {/* Kolom Kanan: Pratinjau Langsung Kertas A4 Sebelum Disimpan/Dicetak (6 cols) */}
            <div className="xl:col-span-6 space-y-3 xl:sticky xl:top-20">
              <div className="flex items-center justify-between px-2 flex-wrap gap-2">
                <span className="text-xs font-bold text-[#e5c158] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Pratinjau Langsung Format Surat A4 ({selectedTemplateEditKode})</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const html = await buildPrintableSuratHtml(samplePreviewSurat, kopForm, selectedTemplateEditKode, true);
                      openPrintWindow(
                        `Pratinjau Cetak - ${selectedTemplateEditKode}`,
                        html,
                        kopForm.marginSuratMm || 20
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 border border-[#d4af37]/40 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#e5c158]" />
                    <span>Cetak Pratinjau</span>
                  </button>
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={async () => {
                      try {
                        setIsDownloadingPdf(true);
                        const previewObj: ArsipSurat = {
                          id: `preview_${Date.now()}`,
                          arah: 'Keluar',
                          kodeJenis: selectedTemplateEditKode,
                          namaJenis: activeTpl.namaJenis,
                          nomorSurat: samplePreviewSurat.nomorSurat || generateNomorOtomatis(selectedTemplateEditKode, kopForm),
                          tanggalSurat: samplePreviewSurat.tanggalSurat || new Date().toISOString().split('T')[0],
                          lampiran: samplePreviewSurat.lampiran || '-',
                          perihal: samplePreviewSurat.perihal || activeTpl.judulDefault,
                          tujuanAtauPengirim: samplePreviewSurat.tujuanAtauPengirim || '-',
                          alamatTujuan: samplePreviewSurat.alamatTujuan || 'Di Tempat',
                          salamPembuka: samplePreviewSurat.salamPembuka || '',
                          kalimatPembuka: samplePreviewSurat.kalimatPembuka || '',
                          isiSurat: samplePreviewSurat.isiSurat || '',
                          penutupSurat: samplePreviewSurat.penutupSurat || '',
                          kotaTerbit: kopForm.kotaTerbit,
                          jabatanPenandatangan: kopForm.jabatanPenandatangan,
                          namaPenandatangan: kopForm.namaPenandatangan,
                          ttdUrl1: kopForm.ttdUrl1,
                          jabatanPenandatangan2: kopForm.jabatanPenandatangan2,
                          namaPenandatangan2: kopForm.namaPenandatangan2,
                          ttdUrl2: kopForm.ttdUrl2,
                          tampilkanPenandatangan2: kopForm.tampilkanPenandatangan2,
                          tembusan: samplePreviewSurat.tembusan || '',
                          status: 'Resmi / Terbit',
                          dibuatOleh: currentUser.nama,
                          createdAt: new Date().toLocaleString('id-ID'),
                        };
                        await downloadSuratSekretarisPDF(previewObj, kopForm, systemConfig.logoUrl);
                        showToast('Contoh PDF Kertas A4 (beserta 2 Logo Kop Surat) berhasil diunduh.');
                      } finally {
                        setIsDownloadingPdf(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF A4'}</span>
                  </button>
                </div>
              </div>
              {renderA4PaperPreview(kopForm, samplePreviewSurat, selectedTemplateEditKode, 'sekretaris-editor-a4-preview', true)}
            </div>
          </div>
        );
      })()}

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-2xl bg-emerald-600 text-white border border-emerald-300 shadow-2xl text-xs font-extrabold flex items-center gap-2.5 no-print"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      <ScanSuratModal
        isOpen={showScanModal}
        initialPreviewUrl={scanInitialPreview}
        onClose={() => {
          setShowScanModal(false);
          setScanInitialPreview(null);
        }}
        onTranscribed={handleScanTranscribed}
      />
    </div>
  );
};
