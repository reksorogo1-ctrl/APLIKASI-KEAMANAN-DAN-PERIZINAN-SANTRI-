import React, { useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Download,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Send,
  BookOpen,
  FileSignature,
  Sparkles,
  Eye,
  Inbox,
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  MessageSquare,
  Sliders,
  Upload
} from 'lucide-react';
import {
  ArsipSurat,
  KodeJenisSurat,
  SuratSekretarisConfig,
  UserAccount,
  SystemConfig,
  Santri,
  PesanKoordinasi,
  AgendaPengurus,
  DataUstadz,
  NotulenRapat,
  Gender,
  DivisiPondok
} from '../types';
import { INITIAL_SURAT_SEKRETARIS_CONFIG } from '../data/seedData';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';
import { downloadElementAsPdf } from '../utils/pdfGenerator';

interface SekretarisPanelProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  arsipSurat: ArsipSurat[];
  santriList: Santri[];
  koordinasiList: PesanKoordinasi[];
  agendaPengurus: AgendaPengurus[];
  initialSubTab?: 'buat_surat' | 'arsip' | 'data_santri_psb' | 'data_ustadz' | 'notulen_agenda' | 'kotak_masuk' | 'pengaturan_kop';
}

const DAFTAR_15_JENIS_SURAT: { kode: KodeJenisSurat; label: string; kategori: string }[] = [
  { kode: 'SK', label: '1. Surat Keputusan (SK)', kategori: 'Keputusan & Penetapan' },
  { kode: 'SU', label: '2. Surat Undangan (SU)', kategori: 'Rapat & Acara' },
  { kode: 'SPm', label: '3. Surat Permohonan (SPm)', kategori: 'Kerjasama & Bantuan' },
  { kode: 'SPb', label: '4. Surat Pemberitahuan (SPb)', kategori: 'Maklumat & Edaran' },
  { kode: 'SPp', label: '5. Surat Peminjaman (SPp)', kategori: 'Sarpras & Fasilitas' },
  { kode: 'SPn', label: '6. Surat Pernyataan (SPn)', kategori: 'Komitmen & Disiplin' },
  { kode: 'SM', label: '7. Surat Mandat (SM)', kategori: 'Delegasi & Perwakilan' },
  { kode: 'ST', label: '8. Surat Tugas (ST)', kategori: 'Penugasan Pengurus' },
  { kode: 'SKet', label: '9. Surat Keterangan (SKet)', kategori: 'Keterangan Santri/Aktif' },
  { kode: 'SR', label: '10. Surat Rekomendasi (SR)', kategori: 'Beasiswa & Studi' },
  { kode: 'SB', label: '11. Surat Balasan (SB)', kategori: 'Tanggapan Resmi' },
  { kode: 'SPPD', label: '12. Surat Perintah Perjalanan Dinas (SPPD)', kategori: 'Perjalanan Dinas' },
  { kode: 'SRT', label: '13. Sertifikat (SRT)', kategori: 'Penghargaan & Syahadah' },
  { kode: 'PK', label: '14. Perjanjian Kerja (PK)', kategori: 'MoU & Kontrak Khidmah' },
  { kode: 'SPeng', label: '15. Surat Pengantar (SPeng)', kategori: 'Pengantar Berkas' },
];

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const SekretarisPanel: React.FC<SekretarisPanelProps> = ({
  currentUser,
  systemConfig,
  arsipSurat,
  santriList,
  koordinasiList,
  agendaPengurus,
  initialSubTab,
}) => {
  const suratConfig: SuratSekretarisConfig =
    systemConfig.suratSekretarisConfig || INITIAL_SURAT_SEKRETARIS_CONFIG;

  const [activeTab, setActiveTab] = useState<
    'buat_surat' | 'arsip' | 'data_santri_psb' | 'data_ustadz' | 'notulen_agenda' | 'kotak_masuk' | 'pengaturan_kop'
  >(initialSubTab || 'buat_surat');

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // State 15 Jenis Surat
  const [selectedKode, setSelectedKode] = useState<KodeJenisSurat>('SK');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArah, setFilterArah] = useState<'Semua' | 'Keluar' | 'Masuk'>('Semua');
  const [filterKode, setFilterKode] = useState<string>('Semua');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveBanner, setSaveBanner] = useState('');

  const generateAutoNumber = (kode: KodeJenisSurat) => {
    const now = new Date();
    const roman = ROMAN_MONTHS[now.getMonth()];
    const year = now.getFullYear();
    const seq = String(arsipSurat.length + 1).padStart(3, '0');
    return (suratConfig.formatNomorSurat || '{NOMOR}/{KODE}/PP-ALMALIKI/{ROMAN}/{TAHUN}')
      .replace('{NOMOR}', seq)
      .replace('{KODE}', kode)
      .replace('{ROMAN}', roman)
      .replace('{TAHUN}', String(year));
  };

  const initialTemplate = suratConfig.templates[selectedKode] || INITIAL_SURAT_SEKRETARIS_CONFIG.templates.SK;

  const [formSurat, setFormSurat] = useState<Partial<ArsipSurat>>({
    arah: 'Keluar',
    kodeJenis: 'SK',
    namaJenis: initialTemplate.namaJenis,
    nomorSurat: generateAutoNumber('SK'),
    tanggalSurat: new Date().toISOString().split('T')[0],
    lampiran: '-',
    perihal: initialTemplate.judulDefault,
    tujuanAtauPengirim: 'Seluruh Pengurus & Asatidz Ponpes Salaf Al-Maliki',
    alamatTujuan: 'Di Tempat',
    salamPembuka: initialTemplate.salamPembuka,
    kalimatPembuka: initialTemplate.kalimatPembuka,
    isiSurat: initialTemplate.isiTemplate,
    penutupSurat: initialTemplate.kalimatPenutup,
    kotaTerbit: suratConfig.kotaTerbit,
    jabatanPenandatangan: suratConfig.jabatanPenandatangan,
    namaPenandatangan: suratConfig.namaPenandatangan,
    jabatanPenandatangan2: suratConfig.jabatanPenandatangan2,
    namaPenandatangan2: suratConfig.namaPenandatangan2,
    tampilkanPenandatangan2: suratConfig.tampilkanPenandatangan2,
    tembusan: initialTemplate.catatanKaki || '',
    status: 'Resmi / Terbit',
  });

  // State Data Santri & PSB (Pendaftaran Santri Baru)
  const [searchSantri, setSearchSantri] = useState('');
  const [psbForm, setPsbForm] = useState<Partial<Santri>>({
    nis: `20260${santriList.length + 101}`,
    nama: '',
    gender: 'putra',
    kelas: '1 Wustho (Tsanawiyah)',
    kamar: 'K-01 (Imam Nafi\')',
    asrama: 'Asrama Putra Sunan Giri',
    alamat: '',
    namaWali: '',
    noWaWali: '0812',
    jarakRumahKm: 20,
    status: 'Aktif',
    tglMasuk: new Date().toISOString().split('T')[0],
    foto: '',
  });

  // State Data Ustadz & Pengurus (Status Mukim & Laju)
  const [filterMukimUstadz, setFilterMukimUstadz] = useState<'Semua' | 'Mukim' | 'Laju'>('Semua');
  const [ustadzForm, setUstadzForm] = useState<Partial<DataUstadz>>({
    nip: `UST-MLK-0${(systemConfig.ustadzList || []).length + 11}`,
    nama: '',
    gender: 'ustadz',
    statusMukim: 'Mukim',
    jabatan: 'Pengajar Kitab & Pembina',
    divisi: 'Pendidikan & Taklim',
    bidangKitab: '',
    noWa: '0812',
    jadwalPiket: 'Senin & Kamis',
    statusAktif: true,
  });

  // State Notulen Rapat & Agenda (Tersinkronisasi dengan Kalender Kegiatan)
  const [sinkronKeKalender, setSinkronKeKalender] = useState(true);
  const [notulenForm, setNotulenForm] = useState<Partial<NotulenRapat>>({
    judulRapat: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '19:30 - 21:30 WIB',
    tempat: 'Aula Sekretariat Pusat',
    pimpinanRapat: 'K.H. Ahmad Faqih Al-Maliki',
    jumlahPeserta: 15,
    agendaBahasan: '',
    hasilKeputusan: '',
    notulis: currentUser.nama,
  });

  const [agendaBaruForm, setAgendaBaruForm] = useState<Partial<AgendaPengurus>>({
    judul: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '20:00 WIB',
    tempat: 'Aula Utama Pondok',
    divisiTerkait: 'Seluruh Pengurus',
    deskripsi: '',
    status: 'Terjadwal',
  });

  // State Kotak Masuk & Pesan Divisi Lain
  const [pesanBaru, setPesanBaru] = useState({
    judul: '',
    tujuan: 'Seluruh Divisi / Ketua Pondok',
    isi: '',
  });

  // State Pengaturan Kop Surat, Logo & Tanda Tangan
  const [kopForm, setKopForm] = useState<SuratSekretarisConfig>(suratConfig);

  const handleSelectJenisSurat = (kode: KodeJenisSurat) => {
    setSelectedKode(kode);
    const tpl = suratConfig.templates[kode] || INITIAL_SURAT_SEKRETARIS_CONFIG.templates[kode];
    setFormSurat({
      ...formSurat,
      kodeJenis: kode,
      namaJenis: tpl.namaJenis,
      nomorSurat: generateAutoNumber(kode),
      perihal: tpl.judulDefault,
      salamPembuka: tpl.salamPembuka,
      kalimatPembuka: tpl.kalimatPembuka,
      isiSurat: tpl.isiTemplate,
      penutupSurat: tpl.kalimatPenutup,
      tembusan: tpl.catatanKaki || '',
    });
  };

  const handleSaveSurat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSurat.nomorSurat || !formSurat.perihal) return;

    const saved: ArsipSurat = {
      id: formSurat.id || `srt_${Date.now()}`,
      arah: (formSurat.arah as 'Keluar' | 'Masuk') || 'Keluar',
      kodeJenis: selectedKode,
      namaJenis: formSurat.namaJenis || suratConfig.templates[selectedKode].namaJenis,
      nomorSurat: formSurat.nomorSurat,
      tanggalSurat: formSurat.tanggalSurat || new Date().toISOString().split('T')[0],
      lampiran: formSurat.lampiran || '-',
      perihal: formSurat.perihal,
      tujuanAtauPengirim: formSurat.tujuanAtauPengirim || '-',
      alamatTujuan: formSurat.alamatTujuan || 'Di Tempat',
      salamPembuka: formSurat.salamPembuka,
      kalimatPembuka: formSurat.kalimatPembuka,
      isiSurat: formSurat.isiSurat || '',
      penutupSurat: formSurat.penutupSurat,
      kotaTerbit: formSurat.kotaTerbit || suratConfig.kotaTerbit,
      jabatanPenandatangan: formSurat.jabatanPenandatangan || suratConfig.jabatanPenandatangan,
      namaPenandatangan: formSurat.namaPenandatangan || suratConfig.namaPenandatangan,
      jabatanPenandatangan2: formSurat.jabatanPenandatangan2 || suratConfig.jabatanPenandatangan2,
      namaPenandatangan2: formSurat.namaPenandatangan2 || suratConfig.namaPenandatangan2,
      tampilkanPenandatangan2: formSurat.tampilkanPenandatangan2 ?? suratConfig.tampilkanPenandatangan2,
      tembusan: formSurat.tembusan,
      status: (formSurat.status as ArsipSurat['status']) || 'Resmi / Terbit',
      dibuatOleh: currentUser.nama,
      createdAt: new Date().toISOString().split('T')[0],
    };

    storageService.saveArsipSurat(saved);
    setSaveBanner(`Surat ${saved.nomorSurat} berhasil diterbitkan & disimpan ke Arsip Cloud!`);
    setTimeout(() => setSaveBanner(''), 4000);
  };

  const handlePrintA4 = () => {
    openPrintWindow(
      'sekretaris-surat-a4-print',
      `${selectedKode}_${formSurat.nomorSurat?.replace(/[^a-zA-Z0-9]/g, '_') || 'Surat_Resmi'}`
    );
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadElementAsPdf(
        'sekretaris-surat-a4-print',
        `${selectedKode}_${formSurat.nomorSurat?.replace(/[^a-zA-Z0-9]/g, '_') || 'Surat_Resmi'}.pdf`
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler Pendaftaran Santri Baru (PSB)
  const handleRegisterPSB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!psbForm.nama || !psbForm.nis) return;
    const newSantri: Santri = {
      id: `san_${Date.now()}`,
      nis: psbForm.nis,
      nama: psbForm.nama,
      foto: psbForm.foto || '',
      gender: (psbForm.gender as Gender) || 'putra',
      kelas: psbForm.kelas || '1 Wustho (Tsanawiyah)',
      kamar: psbForm.kamar || 'K-01 (Imam Nafi\')',
      asrama: psbForm.asrama || 'Asrama Putra Sunan Giri',
      alamat: psbForm.alamat || 'Karawang',
      namaWali: psbForm.namaWali || 'Wali Santri',
      noWaWali: psbForm.noWaWali || '0812',
      jarakRumahKm: Number(psbForm.jarakRumahKm) || 15,
      status: 'Aktif',
      poinPelanggaran: 0,
      tglMasuk: psbForm.tglMasuk || new Date().toISOString().split('T')[0],
    };
    storageService.saveSantri(newSantri);
    setSaveBanner(`Santri baru "${newSantri.nama}" (${newSantri.nis}) berhasil didaftarkan ke Buku Induk!`);
    setTimeout(() => setSaveBanner(''), 4000);
    setPsbForm({
      ...psbForm,
      nis: `20260${santriList.length + 102}`,
      nama: '',
      alamat: '',
      namaWali: '',
      foto: '',
    });
  };

  // Handler Tambah Ustadz / Pengurus
  const handleSaveUstadz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ustadzForm.nama) return;
    const newUst: DataUstadz = {
      id: `ust_${Date.now()}`,
      nip: ustadzForm.nip || `UST-MLK-${Date.now().toString().slice(-3)}`,
      nama: ustadzForm.nama,
      gender: (ustadzForm.gender as 'ustadz' | 'ustadzah') || 'ustadz',
      statusMukim: (ustadzForm.statusMukim as 'Mukim' | 'Laju') || 'Mukim',
      jabatan: ustadzForm.jabatan || 'Pengajar Kitab',
      divisi: (ustadzForm.divisi as DivisiPondok) || 'Pendidikan & Taklim',
      bidangKitab: ustadzForm.bidangKitab || 'Fiqih & Nahwu',
      noWa: ustadzForm.noWa || '0812',
      jadwalPiket: ustadzForm.jadwalPiket || 'Senin & Kamis',
      statusAktif: true,
    };
    const updated = [newUst, ...(systemConfig.ustadzList || [])];
    storageService.updateSystemConfig({ ustadzList: updated });
    setSaveBanner(`Data ${newUst.nama} (Status: ${newUst.statusMukim}) berhasil ditambahkan ke Direktori Ustadz & Pengurus!`);
    setTimeout(() => setSaveBanner(''), 4000);
    setUstadzForm({ ...ustadzForm, nama: '', bidangKitab: '' });
  };

  // Handler Simpan Notulen Rapat + Sinkronisasi Otomatis ke Kalender Kegiatan
  const handleSaveNotulen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notulenForm.judulRapat || !notulenForm.hasilKeputusan) return;
    const item: NotulenRapat = {
      id: `not_${Date.now()}`,
      judulRapat: notulenForm.judulRapat,
      tanggal: notulenForm.tanggal || new Date().toISOString().split('T')[0],
      waktu: notulenForm.waktu || '20:00 WIB',
      tempat: notulenForm.tempat || 'Aula Pusat',
      pimpinanRapat: notulenForm.pimpinanRapat || 'Ketua Pondok',
      jumlahPeserta: Number(notulenForm.jumlahPeserta) || 12,
      agendaBahasan: notulenForm.agendaBahasan || '-',
      hasilKeputusan: notulenForm.hasilKeputusan,
      notulis: notulenForm.notulis || currentUser.nama,
    };
    storageService.updateSystemConfig({
      notulenRapatList: [item, ...(systemConfig.notulenRapatList || [])],
    });

    if (sinkronKeKalender) {
      storageService.saveAgendaPengurus({
        id: `agd_${Date.now()}`,
        judul: item.judulRapat,
        tanggal: item.tanggal,
        waktu: item.waktu,
        tempat: item.tempat,
        divisiTerkait: 'Seluruh Pengurus',
        penanggungJawab: item.pimpinanRapat,
        pimpinanRapat: item.pimpinanRapat,
        deskripsi: `Agenda: ${item.agendaBahasan} | Hasil: ${item.hasilKeputusan}`,
        notulensi: item.hasilKeputusan,
        catatan: item.hasilKeputusan,
        status: 'Selesai',
      });
    }

    setSaveBanner(`Notulen rapat "${item.judulRapat}" berhasil disimpan & disinkronkan ke Kalender Kegiatan!`);
    setTimeout(() => setSaveBanner(''), 4000);
    setNotulenForm({ ...notulenForm, judulRapat: '', agendaBahasan: '', hasilKeputusan: '' });
  };

  const handleSaveAgendaKalender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaBaruForm.judul) return;
    storageService.saveAgendaPengurus({
      id: `agd_${Date.now()}`,
      judul: agendaBaruForm.judul,
      tanggal: agendaBaruForm.tanggal || new Date().toISOString().split('T')[0],
      waktu: agendaBaruForm.waktu || '20:00 WIB',
      tempat: agendaBaruForm.tempat || 'Aula Pondok',
      divisiTerkait: (agendaBaruForm.divisiTerkait as DivisiPondok | 'Seluruh Pengurus') || 'Seluruh Pengurus',
      penanggungJawab: currentUser.nama,
      pimpinanRapat: currentUser.nama,
      deskripsi: agendaBaruForm.deskripsi || '-',
      catatan: agendaBaruForm.deskripsi || '-',
      status: (agendaBaruForm.status as AgendaPengurus['status']) || 'Terjadwal',
    });
    setSaveBanner(`Agenda "${agendaBaruForm.judul}" berhasil ditambahkan dan otomatis tampil pada Kalender Kegiatan (Hijriah & Masehi)!`);
    setTimeout(() => setSaveBanner(''), 4000);
    setAgendaBaruForm({ ...agendaBaruForm, judul: '', deskripsi: '' });
  };

  // Handler Kirim Pesan Antar Divisi
  const handleKirimPesanDivisi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesanBaru.judul || !pesanBaru.isi) return;
    storageService.saveKoordinasi({
      id: `krd_${Date.now()}`,
      nomorTiket: `SEK-MSG-${Math.floor(100 + Math.random() * 900)}`,
      judul: `[SEKRETARIAT] ${pesanBaru.judul}`,
      isi: `Kepada: ${pesanBaru.tujuan}\n\n${pesanBaru.isi}`,
      prioritas: 'Penting',
      kategori: 'Laporan Keamanan',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan,
      tujuan: 'semua_dewan',
      waktu: new Date().toLocaleString('id-ID') + ' WIB',
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    });
    setSaveBanner('Pesan koordinasi Sekretariat berhasil dikirim ke divisi tujuan!');
    setTimeout(() => setSaveBanner(''), 4000);
    setPesanBaru({ judul: '', tujuan: 'Seluruh Divisi / Ketua Pondok', isi: '' });
  };

  // Handler Simpan Pengaturan Kop Surat, Logo & Tanda Tangan
  const handleSaveKopConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSystemConfig({ suratSekretarisConfig: kopForm });
    setSaveBanner('Format Kop Surat, Logo, dan Tanda Tangan berhasil diperbarui!');
    setTimeout(() => setSaveBanner(''), 4000);
  };

  const filteredArsip = useMemo(() => {
    return arsipSurat.filter(s => {
      if (filterArah !== 'Semua' && s.arah !== filterArah) return false;
      if (filterKode !== 'Semua' && s.kodeJenis !== filterKode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.nomorSurat.toLowerCase().includes(q) ||
          s.perihal.toLowerCase().includes(q) ||
          s.tujuanAtauPengirim.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [arsipSurat, filterArah, filterKode, searchQuery]);

  const filteredSantri = useMemo(() => {
    return santriList.filter(s => {
      if (!searchSantri.trim()) return true;
      const q = searchSantri.toLowerCase();
      return (
        s.nama.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q) ||
        s.namaWali.toLowerCase().includes(q)
      );
    });
  }, [santriList, searchSantri]);

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER SEKRETARIS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#041d14]/95 border border-[#d4af37]/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266]">
            <FileSignature className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
              SEKRETARIAT PUSAT PONDOK PESANTREN
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
              Manajemen Kesekretariatan, Persuratan, Buku Induk Santri & PSB
            </h1>
            <p className="text-xs text-emerald-200/75">
              15 jenis surat standar pesantren, Data Santri Lengkap, Pendaftaran Santri Baru (PSB), Data Ustadz/Pengurus, Notulen Rapat, & Edit Kop Surat
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigasi Sekretaris */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
          {[
            { id: 'buat_surat', label: '15 Jenis Surat Cepat' },
            { id: 'arsip', label: `Arsip Surat (${arsipSurat.length})` },
            { id: 'data_santri_psb', label: `Data Santri & PSB (${santriList.length})` },
            { id: 'data_ustadz', label: `Data Ustadz & Pengurus (${(systemConfig.ustadzList || []).length})` },
            { id: 'notulen_agenda', label: 'Notulen Rapat & Agenda' },
            { id: 'kotak_masuk', label: 'Kotak Masuk Divisi' },
            { id: 'pengaturan_kop', label: 'Edit Kop, Logo & TTD' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] shadow-md'
                  : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {saveBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-[#d4af37] text-emerald-100 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-[#f3d266] shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* TAB 1: BUAT CEPAT BERDASARKAN 15 JENIS SURAT STANDAR PESANTREN */}
      {activeTab === 'buat_surat' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-4 shadow-xl">
            <p className="text-xs font-bold text-[#f3d266] uppercase tracking-wider mb-3 font-mono">
              Pilih Cepat 15 Jenis Surat Standar Pondok Pesantren:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {DAFTAR_15_JENIS_SURAT.map((item) => (
                <button
                  key={item.kode}
                  type="button"
                  onClick={() => handleSelectJenisSurat(item.kode)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedKode === item.kode
                      ? 'bg-gradient-to-r from-[#0b422d] to-[#06281c] border-[#d4af37] text-white shadow-md'
                      : 'bg-[#03160f] border-emerald-800/60 text-emerald-200 hover:border-[#d4af37]/40'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{item.label}</p>
                  <p className="text-[10px] text-emerald-300/70 truncate">{item.kategori}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Form Editor Surat */}
            <form onSubmit={handleSaveSurat} className="xl:col-span-5 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3 h-fit">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Formulir Penerbitan {formSurat.namaJenis}
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nomor Surat</label>
                  <input
                    type="text"
                    value={formSurat.nomorSurat || ''}
                    onChange={e => setFormSurat({ ...formSurat, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    value={formSurat.tanggalSurat || ''}
                    onChange={e => setFormSurat({ ...formSurat, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Perihal / Judul Surat</label>
                <input
                  type="text"
                  value={formSurat.perihal || ''}
                  onChange={e => setFormSurat({ ...formSurat, perihal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Kepada / Tujuan Surat</label>
                <input
                  type="text"
                  value={formSurat.tujuanAtauPengirim || ''}
                  onChange={e => setFormSurat({ ...formSurat, tujuanAtauPengirim: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Isi Pokok Surat</label>
                <textarea
                  rows={6}
                  value={formSurat.isiSurat || ''}
                  onChange={e => setFormSurat({ ...formSurat, isiSurat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white leading-relaxed"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
                >
                  Simpan & Terbitkan Surat
                </button>
                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak A4
                </button>
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleDownloadPdf}
                  className="px-4 py-2.5 rounded-xl bg-[#06281c] hover:bg-[#0b422d] text-[#f3d266] border border-[#d4af37]/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </form>

            {/* Pratinjau Kertas A4 Resmi */}
            <div className="xl:col-span-7">
              <div
                id="sekretaris-surat-a4-print"
                className="bg-white text-black rounded-2xl p-8 shadow-2xl border border-zinc-300 max-w-[210mm] mx-auto"
              >
                <div className="flex items-center justify-between gap-4 border-b-4 border-double border-black pb-3 mb-5">
                  <img
                    src={suratConfig.kopLogoUrl || systemConfig.logoUrl}
                    alt="Logo Kop Kiri (Logo 1)"
                    className="w-16 h-16 object-contain shrink-0"
                  />
                  <div className="text-center flex-1 px-2">
                    <p className="text-xs font-bold uppercase tracking-wider">{suratConfig.kopNamaYayasan}</p>
                    <h1 className="text-lg font-black uppercase">{suratConfig.kopNamaPondok}</h1>
                    <p className="text-xs font-bold uppercase">{suratConfig.kopSubInstansi}</p>
                    <p className="text-[10px] mt-0.5">{suratConfig.kopAlamatKontak}</p>
                  </div>
                  {(suratConfig.kopLogoKananUrl || suratConfig.kopLogoUrl || systemConfig.logoUrl) && (
                    <img
                      src={suratConfig.kopLogoKananUrl || suratConfig.kopLogoUrl || systemConfig.logoUrl}
                      alt="Logo Kop Kanan (Logo 2)"
                      className="w-16 h-16 object-contain shrink-0"
                    />
                  )}
                </div>

                {suratConfig.tampilkanBismillah && (
                  <p className="text-center font-serif text-base mb-3">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                )}

                <div className="flex justify-between text-xs mb-4">
                  <div>
                    <p>Nomor : <strong>{formSurat.nomorSurat}</strong></p>
                    <p>Lampiran : {formSurat.lampiran}</p>
                    <p>Perihal : <strong>{formSurat.perihal}</strong></p>
                  </div>
                  <div className="text-right">
                    <p>{formSurat.kotaTerbit || suratConfig.kotaTerbit}, {formSurat.tanggalSurat}</p>
                  </div>
                </div>

                <div className="text-xs mb-4">
                  <p>Kepada Yth.</p>
                  <p className="font-bold">{formSurat.tujuanAtauPengirim}</p>
                  <p>{formSurat.alamatTujuan}</p>
                </div>

                <div className="text-xs space-y-3 leading-relaxed">
                  {formSurat.salamPembuka && <p className="font-semibold italic">{formSurat.salamPembuka}</p>}
                  {formSurat.kalimatPembuka && <p>{formSurat.kalimatPembuka}</p>}
                  <div className="whitespace-pre-line py-1">{formSurat.isiSurat}</div>
                  {formSurat.penutupSurat && <p>{formSurat.penutupSurat}</p>}
                </div>

                <div className="mt-10 grid grid-cols-2 gap-6 text-center text-xs">
                  {formSurat.tampilkanPenandatangan2 ? (
                    <div>
                      <p>Mengetahui,</p>
                      <p className="font-bold">{formSurat.jabatanPenandatangan2}</p>
                      <div className="h-16" />
                      <p className="font-bold underline">{formSurat.namaPenandatangan2}</p>
                    </div>
                  ) : <div />}
                  <div>
                    <p>{formSurat.kotaTerbit || suratConfig.kotaTerbit}, {formSurat.tanggalSurat}</p>
                    <p className="font-bold">{formSurat.jabatanPenandatangan}</p>
                    <div className="h-16" />
                    <p className="font-bold underline">{formSurat.namaPenandatangan}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARSIP SURAT MASUK & KELUAR */}
      {activeTab === 'arsip' && (
        <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Buku Agenda Arsip Surat Masuk & Surat Keluar ({filteredArsip.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Cari nomor atau perihal..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <select
                value={filterArah}
                onChange={e => setFilterArah(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                <option value="Semua">Semua Arah</option>
                <option value="Keluar">Surat Keluar</option>
                <option value="Masuk">Surat Masuk</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                  <th className="py-3 px-4">Nomor & Tanggal</th>
                  <th className="py-3 px-4">Arah & Jenis</th>
                  <th className="py-3 px-4">Perihal</th>
                  <th className="py-3 px-4">Tujuan / Pengirim</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/50">
                {filteredArsip.map((srt) => (
                  <tr key={srt.id} className="hover:bg-[#06281c]/50">
                    <td className="py-3 px-4 font-mono text-white">
                      {srt.nomorSurat}
                      <span className="block text-[10px] text-emerald-400">{srt.tanggalSurat}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/20 text-[#f3d266]">
                        {srt.arah} · {srt.kodeJenis}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{srt.perihal}</td>
                    <td className="py-3 px-4 text-emerald-200">{srt.tujuanAtauPengirim}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                        {srt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA SANTRI LENGKAP (BIODATA, WALI, KELAS, ANGKATAN, FOTO) & PENDAFTARAN SANTRI BARU (PSB) */}
      {activeTab === 'data_santri_psb' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulir Pendaftaran Santri Baru (PSB) */}
          <form onSubmit={handleRegisterPSB} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#f3d266]" />
              Pendaftaran Santri Baru (PSB)
            </h2>
            <p className="text-[11px] text-emerald-200/75">
              Input biodata lengkap santri baru untuk langsung masuk ke Buku Induk Santri Cloud
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">NIS Santri</label>
                <input
                  type="text"
                  required
                  value={psbForm.nis}
                  onChange={e => setPsbForm({ ...psbForm, nis: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Gender</label>
                <select
                  value={psbForm.gender}
                  onChange={e => setPsbForm({ ...psbForm, gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  <option value="putra">Putra (Banin)</option>
                  <option value="putri">Putri (Banat)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Lengkap Santri</label>
              <input
                type="text"
                required
                placeholder="Nama lengkap sesuai KK..."
                value={psbForm.nama}
                onChange={e => setPsbForm({ ...psbForm, nama: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Kelas Madrasah</label>
                <input
                  type="text"
                  value={psbForm.kelas}
                  onChange={e => setPsbForm({ ...psbForm, kelas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Angkatan / Tgl Masuk</label>
                <input
                  type="date"
                  value={psbForm.tglMasuk}
                  onChange={e => setPsbForm({ ...psbForm, tglMasuk: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Kamar Asrama</label>
                <input
                  type="text"
                  value={psbForm.kamar}
                  onChange={e => setPsbForm({ ...psbForm, kamar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Wali Santri</label>
                <input
                  type="text"
                  required
                  value={psbForm.namaWali}
                  onChange={e => setPsbForm({ ...psbForm, namaWali: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">No. WA Wali</label>
                <input
                  type="text"
                  value={psbForm.noWaWali}
                  onChange={e => setPsbForm({ ...psbForm, noWaWali: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  value={psbForm.alamat}
                  onChange={e => setPsbForm({ ...psbForm, alamat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Daftarkan Santri Baru (PSB)
            </button>
          </form>

          {/* Buku Induk Data Santri Lengkap */}
          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Buku Induk Data Santri Lengkap (Biodata, Wali, Kelas, Angkatan)
              </h2>
              <input
                type="text"
                placeholder="Cari santri, NIS, wali..."
                value={searchSantri}
                onChange={e => setSearchSantri(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                    <th className="py-3 px-3">Santri & NIS</th>
                    <th className="py-3 px-3">Kelas & Kamar</th>
                    <th className="py-3 px-3">Angkatan Masuk</th>
                    <th className="py-3 px-3">Nama Wali & Kontak</th>
                    <th className="py-3 px-3">Alamat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {filteredSantri.map((s) => (
                    <tr key={s.id} className="hover:bg-[#06281c]/50">
                      <td className="py-3 px-3 font-bold text-white">
                        {s.nama}
                        <span className="block text-[10px] font-mono text-emerald-400">NIS: {s.nis} ({s.gender.toUpperCase()})</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-100">
                        {s.kelas}
                        <span className="block text-[10px] text-emerald-300/75">{s.kamar}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#f3d266]">{s.tglMasuk}</td>
                      <td className="py-3 px-3 text-emerald-100">
                        {s.namaWali}
                        <span className="block text-[10px] font-mono text-emerald-400">{s.noWaWali}</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-200/80">{s.alamat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA USTADZ & USTADZAH (STATUS MUKIM DAN LAJU) */}
      {activeTab === 'data_ustadz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveUstadz} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#f3d266]" />
              Tambah Data Ustadz / Ustadzah & Pengurus
            </h2>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                required
                value={ustadzForm.nama}
                onChange={e => setUstadzForm({ ...ustadzForm, nama: e.target.value })}
                placeholder="Contoh: Ustadz H. Ahmad..."
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Kategori</label>
                <select
                  value={ustadzForm.gender}
                  onChange={e => setUstadzForm({ ...ustadzForm, gender: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  <option value="ustadz">Ustadz (Putra)</option>
                  <option value="ustadzah">Ustadzah (Putri)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#f3d266] mb-1">Status Domisili</label>
                <select
                  value={ustadzForm.statusMukim || 'Mukim'}
                  onChange={e => setUstadzForm({ ...ustadzForm, statusMukim: e.target.value as 'Mukim' | 'Laju' })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-[#d4af37]/60 text-xs text-[#f3d266] font-bold"
                >
                  <option value="Mukim">Mukim (Menetap di Pondok)</option>
                  <option value="Laju">Laju (Pulang-Pergi)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Jabatan</label>
                <input
                  type="text"
                  value={ustadzForm.jabatan}
                  onChange={e => setUstadzForm({ ...ustadzForm, jabatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Divisi Khidmah</label>
                <select
                  value={ustadzForm.divisi}
                  onChange={e => setUstadzForm({ ...ustadzForm, divisi: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  <option value="Pendidikan & Taklim">Pendidikan & Taklim</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Perlengkapan">Perlengkapan</option>
                  <option value="Keamanan">Keamanan</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Bidang Kitab / Tugas</label>
              <input
                type="text"
                value={ustadzForm.bidangKitab}
                onChange={e => setUstadzForm({ ...ustadzForm, bidangKitab: e.target.value })}
                placeholder="Contoh: Fathul Mu'in & Nahwu"
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Simpan Data Ustadz / Ustadzah
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Direktori Ustadz, Ustadzah & Pengurus (Status Mukim & Laju)
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Total: {(systemConfig.ustadzList || []).length} Asatidz · Mukim: {(systemConfig.ustadzList || []).filter(u => (u.statusMukim || 'Mukim') === 'Mukim').length} · Laju: {(systemConfig.ustadzList || []).filter(u => u.statusMukim === 'Laju').length}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {(['Semua', 'Mukim', 'Laju'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterMukimUstadz(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                      filterMukimUstadz === st
                        ? 'bg-[#d4af37] text-[#02120a] border-[#f3d266]'
                        : 'bg-[#03160f] text-emerald-200 border-emerald-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                    <th className="py-3 px-3">Nama & NIP</th>
                    <th className="py-3 px-3">Status Mukim / Laju</th>
                    <th className="py-3 px-3">Jabatan & Divisi</th>
                    <th className="py-3 px-3">Kitab / Bidang</th>
                    <th className="py-3 px-3">Jadwal Piket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {(systemConfig.ustadzList || [])
                    .filter(u => filterMukimUstadz === 'Semua' || (u.statusMukim || 'Mukim') === filterMukimUstadz)
                    .map((u) => {
                      const stMukim = u.statusMukim || 'Mukim';
                      return (
                        <tr key={u.id} className="hover:bg-[#06281c]/50">
                          <td className="py-3 px-3 font-bold text-white">
                            {u.nama}
                            <span className="block text-[10px] font-mono text-emerald-400">{u.nip} · {u.gender.toUpperCase()}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                                stMukim === 'Mukim'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-[#d4af37]/20 text-[#f3d266] border-[#d4af37]/40'
                              }`}
                            >
                              {stMukim.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-emerald-100">
                            {u.jabatan}
                            <span className="block text-[10px] font-mono text-[#f3d266]">{u.divisi}</span>
                          </td>
                          <td className="py-3 px-3 text-emerald-200">{u.bidangKitab}</td>
                          <td className="py-3 px-3 font-mono text-emerald-300">{u.jadwalPiket}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTULEN RAPAT DAN AGENDA (TERSINKRONISASI DENGAN KALENDER KEGIATAN) */}
      {activeTab === 'notulen_agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <form onSubmit={handleSaveNotulen} className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Catat Notulen Rapat Baru
              </h2>
              <input
                type="text"
                required
                placeholder="Judul Rapat / Musyawarah..."
                value={notulenForm.judulRapat}
                onChange={e => setNotulenForm({ ...notulenForm, judulRapat: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={notulenForm.tanggal}
                  onChange={e => setNotulenForm({ ...notulenForm, tanggal: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Tempat Rapat..."
                  value={notulenForm.tempat}
                  onChange={e => setNotulenForm({ ...notulenForm, tempat: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Agenda Bahasan..."
                value={notulenForm.agendaBahasan}
                onChange={e => setNotulenForm({ ...notulenForm, agendaBahasan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <textarea
                rows={3}
                required
                placeholder="Hasil Keputusan Musyawarah..."
                value={notulenForm.hasilKeputusan}
                onChange={e => setNotulenForm({ ...notulenForm, hasilKeputusan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <label className="flex items-center gap-2 text-xs text-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sinkronKeKalender}
                  onChange={e => setSinkronKeKalender(e.target.checked)}
                />
                <span>Sinkronkan otomatis ke Kalender Kegiatan (Hijriah & Masehi)</span>
              </label>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
              >
                Simpan Notulen Rapat
              </button>
            </form>

            {/* Form Tambah Agenda Kalender Kegiatan */}
            <form onSubmit={handleSaveAgendaKalender} className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                2. Tambah Agenda ke Kalender Kegiatan Pondok
              </h2>
              <input
                type="text"
                required
                placeholder="Nama Agenda / Kegiatan Pondok..."
                value={agendaBaruForm.judul}
                onChange={e => setAgendaBaruForm({ ...agendaBaruForm, judul: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={agendaBaruForm.tanggal}
                  onChange={e => setAgendaBaruForm({ ...agendaBaruForm, tanggal: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Waktu (Mis: 20:00 WIB)"
                  value={agendaBaruForm.waktu}
                  onChange={e => setAgendaBaruForm({ ...agendaBaruForm, waktu: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Tempat Pelaksanaan..."
                value={agendaBaruForm.tempat}
                onChange={e => setAgendaBaruForm({ ...agendaBaruForm, tempat: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                + Tambahkan ke Kalender Kegiatan (Hijriah & Masehi)
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Arsip Notulen Rapat ({(systemConfig.notulenRapatList || []).length})
              </h2>
              <div className="space-y-3">
                {(systemConfig.notulenRapatList || []).map((nt) => (
                  <div key={nt.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-[#f3d266]">
                      <span>{nt.tanggal} · {nt.tempat}</span>
                      <span>Notulis: {nt.notulis}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{nt.judulRapat}</h3>
                    <p className="text-xs text-emerald-100 whitespace-pre-line">{nt.hasilKeputusan}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                Daftar Agenda Tersinkronisasi Kalender Kegiatan ({agendaPengurus.length})
              </h2>
              <div className="space-y-2.5">
                {agendaPengurus.map((ag) => (
                  <div key={ag.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">{ag.judul}</p>
                      <p className="text-[11px] text-emerald-200/75">{ag.tanggal} · {ag.waktu} · {ag.tempat}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                      {ag.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PESAN DAN KOTAK MASUK DARI DIVISI LAIN (TERMASUK PERMINTAAN SURAT PEMINJAMAN BARANG) */}
      {activeTab === 'kotak_masuk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleKirimPesanDivisi} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Kirim Pesan Resmi Antar Divisi
            </h2>
            <select
              value={pesanBaru.tujuan}
              onChange={e => setPesanBaru({ ...pesanBaru, tujuan: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            >
              <option value="Seluruh Divisi / Ketua Pondok">Seluruh Divisi / Ketua Pondok</option>
              <option value="Bendahara Pondok">Bendahara Pondok</option>
              <option value="Bagian Perlengkapan">Bagian Perlengkapan</option>
              <option value="Dewan Keamanan">Dewan Keamanan</option>
            </select>
            <input
              type="text"
              required
              placeholder="Perihal Pesan..."
              value={pesanBaru.judul}
              onChange={e => setPesanBaru({ ...pesanBaru, judul: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <textarea
              rows={3}
              required
              placeholder="Isi pesan koordinasi..."
              value={pesanBaru.isi}
              onChange={e => setPesanBaru({ ...pesanBaru, isi: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Kirim Pesan Sekretariat
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Kotak Masuk, Permintaan Surat & Pesan dari Seluruh Pengurus ({koordinasiList.length})
            </h2>
            <div className="space-y-3">
              {koordinasiList.map((msg) => (
                <div key={msg.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-[#f3d266] font-bold">
                      {msg.nomorTiket} · Dari: {msg.pengirimNama} ({msg.pengirimJabatan || msg.pengirimRole})
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300">{msg.waktu}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">{msg.judul}</h3>
                  <p className="text-xs text-emerald-100/85 whitespace-pre-line">{msg.isi}</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const isPeminjaman = msg.judul.toLowerCase().includes('peminjaman') || msg.isi.toLowerCase().includes('pinjam');
                        const targetKode: KodeJenisSurat = isPeminjaman ? 'SPp' : 'SPm';
                        handleSelectJenisSurat(targetKode);
                        setFormSurat((prev) => ({
                          ...prev,
                          kodeJenis: targetKode,
                          nomorSurat: generateAutoNumber(targetKode),
                          perihal: msg.judul.replace(/^\[.*?\]\s*/, ''),
                          isiSurat: msg.isi,
                        }));
                        setActiveTab('buat_surat');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Proses & Cetak Surat Resmi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: OPTION UNTUK MENGEDIT FORMAT POKOK SURAT DARI KOP SURAT, LOGO, DAN TANDA TANGAN */}
      {activeTab === 'pengaturan_kop' && (
        <form onSubmit={handleSaveKopConfig} className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-6 shadow-xl space-y-5">
          <div className="border-b border-emerald-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#f3d266]" />
              Pengaturan Format Pokok Surat: Kop Surat, Logo Resmi, & Tanda Tangan
            </h2>
            <p className="text-xs text-emerald-200/75 mt-0.5">
              Perubahan pada pengaturan ini otomatis diterapkan pada seluruh 15 jenis surat standar pesantren
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Baris 1: Nama Yayasan (Kop Atas)</label>
              <input
                type="text"
                value={kopForm.kopNamaYayasan}
                onChange={e => setKopForm({ ...kopForm, kopNamaYayasan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Baris 2: Nama Pondok Pesantren</label>
              <input
                type="text"
                value={kopForm.kopNamaPondok}
                onChange={e => setKopForm({ ...kopForm, kopNamaPondok: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Baris 3: Sub-Instansi Sekretariat</label>
              <input
                type="text"
                value={kopForm.kopSubInstansi}
                onChange={e => setKopForm({ ...kopForm, kopSubInstansi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>

            {/* 2 LOGO MELALUI LINK URL (LOGO 1 KIRI & LOGO 2 KANAN) KARENA PADA SURAT TERDAPAT 2 LOGO */}
            <div className="p-3.5 rounded-2xl bg-[#03160f]/95 border border-[#d4af37]/45 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#f3d266]">
                  Link URL Logo 1 (Sebelah Kiri Kop Surat)
                </label>
                <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] text-[9px] font-mono font-bold">
                  LOGO 1 (KIRI)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1 border border-[#d4af37] flex items-center justify-center shrink-0">
                  <img
                    src={kopForm.kopLogoUrl || systemConfig.logoUrl}
                    alt="Preview Logo 1 Kiri"
                    className="w-full h-full object-contain"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Masukkan Link URL Logo 1 (Kiri)..."
                  value={kopForm.kopLogoUrl}
                  onChange={e => setKopForm({ ...kopForm, kopLogoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 focus:border-[#d4af37] text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#03160f]/95 border border-[#d4af37]/45 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#f3d266]">
                  Link URL Logo 2 (Sebelah Kanan Kop Surat)
                </label>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                  LOGO 2 (KANAN)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1 border border-[#d4af37] flex items-center justify-center shrink-0">
                  <img
                    src={kopForm.kopLogoKananUrl || kopForm.kopLogoUrl || systemConfig.logoUrl}
                    alt="Preview Logo 2 Kanan"
                    className="w-full h-full object-contain"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Masukkan Link URL Logo 2 (Kanan)..."
                  value={kopForm.kopLogoKananUrl || ''}
                  onChange={e => setKopForm({ ...kopForm, kopLogoKananUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 focus:border-[#d4af37] text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Alamat Lengkap & Kontak Kop Surat</label>
              <input
                type="text"
                value={kopForm.kopAlamatKontak}
                onChange={e => setKopForm({ ...kopForm, kopAlamatKontak: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Jabatan Penandatangan 1 (Sekretaris)</label>
              <input
                type="text"
                value={kopForm.jabatanPenandatangan}
                onChange={e => setKopForm({ ...kopForm, jabatanPenandatangan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Terang Penandatangan 1</label>
              <input
                type="text"
                value={kopForm.namaPenandatangan}
                onChange={e => setKopForm({ ...kopForm, namaPenandatangan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Jabatan Penandatangan 2 (Ketua Pondok)</label>
              <input
                type="text"
                value={kopForm.jabatanPenandatangan2}
                onChange={e => setKopForm({ ...kopForm, jabatanPenandatangan2: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Terang Penandatangan 2</label>
              <input
                type="text"
                value={kopForm.namaPenandatangan2}
                onChange={e => setKopForm({ ...kopForm, namaPenandatangan2: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer shadow-lg"
          >
            Simpan Format Kop Surat, Logo & Tanda Tangan
          </button>
        </form>
      )}
    </div>
  );
};
