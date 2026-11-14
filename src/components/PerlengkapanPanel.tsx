import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Send,
  ArrowDownUp,
  BedDouble,
  ShoppingCart,
  Inbox,
  Printer,
  FileSignature,
  Building2,
  Trash2,
} from 'lucide-react';
import {
  BarangInventaris,
  PeminjamanBarang,
  PengajuanDivisi,
  UserAccount,
  SystemConfig,
  Santri,
  MutasiBarang,
  JadwalPerbaikanAset,
  DataKamarAsrama,
  PesanKoordinasi,
  ArsipSurat,
} from '../types';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';

export type PerlengkapanSubTab =
  | 'kotak_masuk'
  | 'inventaris'
  | 'barang_masuk_keluar'
  | 'peminjaman'
  | 'pengajuan_pembelian'
  | 'kamar_santri'
  | 'rusak_perbaikan';

interface PerlengkapanPanelProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  santriList: Santri[];
  barangInventaris: BarangInventaris[];
  peminjamanBarang: PeminjamanBarang[];
  pengajuanDivisi: PengajuanDivisi[];
  koordinasiList?: PesanKoordinasi[];
  initialSubTab?: PerlengkapanSubTab;
}

export const PerlengkapanPanel: React.FC<PerlengkapanPanelProps> = ({
  currentUser,
  systemConfig,
  santriList,
  barangInventaris,
  peminjamanBarang,
  pengajuanDivisi,
  koordinasiList = [],
  initialSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<PerlengkapanSubTab>(initialSubTab || 'inventaris');

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [toastMsg, setToastMsg] = useState('');

  // Form Pesan Koordinasi / Kotak Masuk
  const [pesanForm, setPesanForm] = useState({
    judul: '',
    tujuan: 'Sekretaris Pondok',
    kategori: 'Permintaan Surat Peminjaman / Sarpras',
    isi: '',
  });

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

  // Form Mutasi Barang Masuk & Keluar (Tanggal, Bulan, Siapa yang memasukkan)
  const [mutasiForm, setMutasiForm] = useState({
    barangId: barangInventaris[0]?.id || 'inv_001',
    tipe: 'Masuk' as 'Masuk' | 'Keluar',
    jumlah: 2,
    tanggal: new Date().toISOString().split('T')[0],
    petugas: currentUser.nama,
    keterangan: '',
  });
  const [filterMutasiBulan, setFilterMutasiBulan] = useState('ALL');

  // Form Peminjaman Barang Internal
  const [pinjamForm, setPinjamForm] = useState<Partial<PeminjamanBarang>>({
    barangId: barangInventaris[0]?.id || 'inv_001',
    jumlahPinjam: 1,
    peminjamNama: '',
    peminjamBagian: 'Pendidikan & Taklim',
    noWaPeminjam: '0812',
    tanggalPinjam: new Date().toISOString().split('T')[0],
    batasKembali: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    keperluan: '',
  });

  // Form Pengajuan Peminjaman Barang (Kirim Otomatis ke Sekretaris untuk Cetak Surat)
  const [pengajuanPinjamForm, setPengajuanPinjamForm] = useState({
    namaBarang: '',
    pinjamKe: '',
    mulai: new Date().toISOString().split('T')[0],
    batasAkhir: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    jumlah: 1,
    keperluan: '',
  });

  // Form Jadwal Perbaikan Barang Rusak
  const [perbaikanForm, setPerbaikanForm] = useState<Partial<JadwalPerbaikanAset>>({
    barangId: barangInventaris[0]?.id || 'inv_004',
    lokasi: 'Asrama Putra',
    kerusakan: '',
    teknisi: 'Tim Teknis Sarpras Pondok',
    tanggalJadwal: new Date().toISOString().split('T')[0],
    estimasiBiaya: 500000,
    status: 'Terjadwal',
  });

  // Form Pengajuan Pembelian Barang (Terhubung Ketua Pondok & Bendahara)
  const [pengadaanForm, setPengadaanForm] = useState({
    judul: '',
    deskripsi: '',
    nominalEstimasi: 2500000,
  });

  // Form Input Manual Data Kamar & Fasilitas Pondok
  const [kamarForm, setKamarForm] = useState({
    kodeKamar: `K-${String((systemConfig.kamarSantriList || []).length + 1).padStart(2, '0')}`,
    namaKamar: '',
    asrama: 'Asrama Putra Al-Maliki',
    gender: 'putra' as 'putra' | 'putri',
    kapasitas: 15,
    musyrif: '',
    fasilitasStr: 'Lemari Kayu Jati, Kasur Busa, Kipas Angin Dinding, Rak Kitab, Dispenser Air',
    kondisi: 'Baik' as 'Baik' | 'Perlu Perbaikan',
  });

  // Form Pembagian Kamar Santri
  const [assignKamarSantriId, setAssignKamarSantriId] = useState(santriList[0]?.id || 'san_001');
  const [assignKamarNama, setAssignKamarNama] = useState(
    (systemConfig.kamarSantriList || [])[0]?.namaKamar || "K-01 (Imam Nafi')"
  );

  // Deteksi Barang Hampir Habis (jumlah <= stokMinimal)
  const stokKritisList = useMemo(() => {
    return barangInventaris.filter((b) => b.jumlah <= (b.stokMinimal ?? 3));
  }, [barangInventaris]);

  // Handlers
  const handleKirimPesanKoordinasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesanForm.judul || !pesanForm.isi) return;
    storageService.saveKoordinasi({
      id: `krd_prl_${Date.now()}`,
      nomorTiket: `PRL-MSG-${Math.floor(100 + Math.random() * 900)}`,
      waktu: new Date().toLocaleString('id-ID'),
      tanggal: new Date().toLocaleString('id-ID'),
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: `${currentUser.jabatan} (${currentUser.divisi || 'Perlengkapan'})`,
      tujuan: pesanForm.tujuan,
      kategori: 'Kendala & Kebutuhan',
      prioritas: 'Penting',
      judul: pesanForm.judul,
      isi: pesanForm.isi,
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    });
    setToastMsg(`Pesan koordinasi ke "${pesanForm.tujuan}" berhasil dikirim!`);
    setTimeout(() => setToastMsg(''), 4000);
    setPesanForm({ ...pesanForm, judul: '', isi: '' });
  };

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

  const handleSimpanMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    const target = barangInventaris.find((b) => b.id === mutasiForm.barangId);
    if (!target || !mutasiForm.jumlah) return;

    const mutasi: MutasiBarang = {
      id: `mut_${Date.now()}`,
      barangId: target.id,
      namaBarang: target.namaBarang,
      tanggal: mutasiForm.tanggal || new Date().toISOString().split('T')[0],
      tipe: mutasiForm.tipe,
      jumlah: Number(mutasiForm.jumlah),
      satuan: target.satuan,
      keterangan: mutasiForm.keterangan || `Mutasi ${mutasiForm.tipe} Gudang Perlengkapan`,
      petugas: mutasiForm.petugas || currentUser.nama,
    };

    storageService.updateSystemConfig({
      mutasiBarangList: [mutasi, ...(systemConfig.mutasiBarangList || [])],
    });

    const newQty =
      mutasiForm.tipe === 'Masuk'
        ? target.jumlah + Number(mutasiForm.jumlah)
        : Math.max(0, target.jumlah - Number(mutasiForm.jumlah));
    storageService.saveBarangInventaris({ ...target, jumlah: newQty });

    setToastMsg(
      `Mutasi barang ${mutasi.tipe} (${mutasi.jumlah} ${target.satuan} ${target.namaBarang}) oleh ${mutasi.petugas} berhasil dicatat!`
    );
    setTimeout(() => setToastMsg(''), 4000);
    setMutasiForm({ ...mutasiForm, keterangan: '' });
  };

  const handleSimpanPeminjaman = (e: React.FormEvent) => {
    e.preventDefault();
    const target = barangInventaris.find((b) => b.id === pinjamForm.barangId);
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
    setToastMsg(`Peminjaman "${target.namaBarang}" oleh ${item.peminjamNama} berhasil dicatat!`);
    setTimeout(() => setToastMsg(''), 4000);
    setPinjamForm({ ...pinjamForm, peminjamNama: '', keperluan: '' });
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
          <h2 style="margin: 4px 0; font-size: 13pt; font-weight: 700; text-transform: uppercase;">DIVISI PERLENGKAPAN, INVENTARIS & SARANA PRASARANA</h2>
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
            <p style="font-weight: bold;">Kepala Divisi Perlengkapan,</p>
            <div style="height: 55px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">${currentUser.nama}</p>
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

  const handleSimpanPerbaikan = (e: React.FormEvent) => {
    e.preventDefault();
    const target = barangInventaris.find((b) => b.id === perbaikanForm.barangId);
    if (!target || !perbaikanForm.kerusakan) return;
    const rep: JadwalPerbaikanAset = {
      id: `rep_${Date.now()}`,
      barangId: target.id,
      namaBarang: target.namaBarang,
      lokasi: perbaikanForm.lokasi || target.lokasi,
      kerusakan: perbaikanForm.kerusakan,
      teknisi: perbaikanForm.teknisi || 'Teknisi Pondok',
      tanggalJadwal: perbaikanForm.tanggalJadwal || new Date().toISOString().split('T')[0],
      estimasiBiaya: Number(perbaikanForm.estimasiBiaya) || 0,
      status: 'Terjadwal',
    };
    storageService.updateSystemConfig({
      jadwalPerbaikanList: [rep, ...(systemConfig.jadwalPerbaikanList || [])],
    });
    setToastMsg(`Jadwal perbaikan "${target.namaBarang}" berhasil dijadwalkan!`);
    setTimeout(() => setToastMsg(''), 4000);
    setPerbaikanForm({ ...perbaikanForm, kerusakan: '' });
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
    setToastMsg(`Pengajuan pembelian "${pengadaanForm.judul}" berhasil dikirim ke Ketua Pondok & Bendahara!`);
    setTimeout(() => setToastMsg(''), 4000);
    setPengadaanForm({ judul: '', deskripsi: '', nominalEstimasi: 2500000 });
  };

  // INPUT MANUAL DATA KAMAR DAN FASILITAS PONDOK
  const handleTambahKamarManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kamarForm.namaKamar) return;
    const fasilitasArr = kamarForm.fasilitasStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newKamar: DataKamarAsrama = {
      id: `kmr_${Date.now()}`,
      kodeKamar: kamarForm.kodeKamar || `K-${Date.now().toString().slice(-2)}`,
      namaKamar: kamarForm.namaKamar,
      asrama: kamarForm.asrama,
      gender: kamarForm.gender,
      kapasitas: Number(kamarForm.kapasitas) || 12,
      musyrif: kamarForm.musyrif || 'Ustadz Pembina Asrama',
      fasilitas: fasilitasArr.length > 0 ? fasilitasArr : ['Lemari', 'Kasur', 'Kipas Angin'],
      kondisi: kamarForm.kondisi,
    };

    const updatedList = [...(systemConfig.kamarSantriList || []), newKamar];
    storageService.updateSystemConfig({
      kamarSantriList: updatedList,
    });
    setAssignKamarNama(newKamar.namaKamar);
    setToastMsg(`Data Kamar & Fasilitas "${newKamar.namaKamar}" (${newKamar.asrama}) berhasil ditambahkan secara manual!`);
    setTimeout(() => setToastMsg(''), 4000);
    setKamarForm({
      ...kamarForm,
      kodeKamar: `K-${String(updatedList.length + 1).padStart(2, '0')}`,
      namaKamar: '',
      musyrif: '',
    });
  };

  const handleHapusKamar = (id: string, nama: string) => {
    const updated = (systemConfig.kamarSantriList || []).filter((k) => k.id !== id);
    storageService.updateSystemConfig({ kamarSantriList: updated });
    setToastMsg(`Data kamar "${nama}" telah dihapus.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleAssignKamarSantri = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSantri = santriList.find((s) => s.id === assignKamarSantriId);
    const targetKamar = (systemConfig.kamarSantriList || []).find((k) => k.namaKamar === assignKamarNama);
    if (!targetSantri || !targetKamar) return;
    storageService.saveSantri({
      ...targetSantri,
      kamar: targetKamar.namaKamar,
      asrama: targetKamar.asrama,
    });
    setToastMsg(`Santri ${targetSantri.nama} berhasil ditempatkan di kamar ${targetKamar.namaKamar} (${targetKamar.asrama})!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const filteredMutasiList = useMemo(() => {
    const all = systemConfig.mutasiBarangList || [];
    if (filterMutasiBulan === 'ALL') return all;
    return all.filter((m) => (m.tanggal || '').slice(0, 7) === filterMutasiBulan);
  }, [systemConfig.mutasiBarangList, filterMutasiBulan]);

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER PERLENGKAPAN */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#041d14]/95 border border-[#d4af37]/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266]">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
              DASHBOARD PERLENGKAPAN, INVENTARIS & FASILITAS PONDOK
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
              Manajemen Inventaris, Keluar Masuk, Peminjaman, Pengadaan & Kamar Pondok
            </h1>
            <p className="text-xs text-emerald-200/75">
              Terintegrasi dengan Dashboard Sekretaris (cetak surat peminjaman), Ketua Pondok, & Bendahara
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigasi Perlengkapan */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
          {[
            { id: 'kotak_masuk', label: `Kotak Masuk (${koordinasiList.length})` },
            { id: 'inventaris', label: `Inventaris (${barangInventaris.length})` },
            { id: 'barang_masuk_keluar', label: 'Keluar Masuk Barang' },
            { id: 'peminjaman', label: `Peminjaman Barang (${peminjamanBarang.length})` },
            { id: 'pengajuan_pembelian', label: 'Pengajuan Pembelian' },
            { id: 'kamar_santri', label: 'Data Kamar & Fasilitas' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PerlengkapanSubTab)}
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

      {/* TAB KOTAK MASUK & PESAN DARI SELURUH PENGURUS */}
      {activeTab === 'kotak_masuk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleKirimPesanKoordinasi}
            className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4 text-[#f3d266]" />
              Kirim Pemberitahuan / Permintaan ke Divisi Lain
            </h2>
            <select
              value={pesanForm.tujuan}
              onChange={(e) => setPesanForm({ ...pesanForm, tujuan: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            >
              <option value="Sekretaris Pondok">Ke: Sekretaris Pondok (Permintaan Surat)</option>
              <option value="Bendahara Pondok">Ke: Bendahara Pondok (Pencairan Pengadaan)</option>
              <option value="Ketua Pondok">Ke: Ketua Pondok (Laporan Sarpras)</option>
              <option value="Dewan Keamanan">Ke: Dewan Keamanan (Fasilitas Pos & Asrama)</option>
              <option value="Seluruh Pengurus">Ke: Seluruh Pengurus Pondok</option>
            </select>
            <input
              type="text"
              required
              placeholder="Judul Pemberitahuan / Permintaan..."
              value={pesanForm.judul}
              onChange={(e) => setPesanForm({ ...pesanForm, judul: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <textarea
              rows={4}
              required
              placeholder="Isi pesan koordinasi atau permintaan perlengkapan..."
              value={pesanForm.isi}
              onChange={(e) => setPesanForm({ ...pesanForm, isi: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Kirim Pesan Koordinasi
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#f3d266]" />
              Kotak Masuk Pemberitahuan & Permintaan dari Seluruh Pengurus ({koordinasiList.length})
            </h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {koordinasiList.map((k) => (
                <div
                  key={k.id}
                  className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] text-[10px] font-mono font-bold">
                      Dari: {k.pengirimNama} ({k.pengirimJabatan}) → Kepada: {k.tujuan}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300">{k.tanggal}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{k.judul}</h3>
                  <p className="text-xs text-emerald-100/85 whitespace-pre-line">{k.isi}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
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

      {/* TAB 2: KELUAR MASUK BARANG (DARI TANGGAL DAN BULAN KEMUDIAN SIAPA YANG MEMASUKKAN) */}
      {activeTab === 'barang_masuk_keluar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSimpanMutasi}
            className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowDownUp className="w-4 h-4 text-[#f3d266]" />
              Catat Keluar Masuk Barang
            </h2>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Pilih Barang Inventaris
              </label>
              <select
                value={mutasiForm.barangId}
                onChange={(e) => setMutasiForm({ ...mutasiForm, barangId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {barangInventaris.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.namaBarang} (Stok: {b.jumlah})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Jenis Mutasi
                </label>
                <select
                  value={mutasiForm.tipe}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, tipe: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
                >
                  <option value="Masuk">Barang Masuk (+)</option>
                  <option value="Keluar">Barang Keluar (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Jumlah Barang
                </label>
                <input
                  type="number"
                  min="1"
                  value={mutasiForm.jumlah}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, jumlah: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Tanggal & Bulan
                </label>
                <input
                  type="date"
                  value={mutasiForm.tanggal}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Siapa yang Memasukkan
                </label>
                <input
                  type="text"
                  required
                  value={mutasiForm.petugas}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, petugas: e.target.value })}
                  placeholder="Nama Petugas..."
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Keterangan mutasi barang..."
              value={mutasiForm.keterangan}
              onChange={(e) => setMutasiForm({ ...mutasiForm, keterangan: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Simpan Data Keluar/Masuk & Update Stok
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Data Barang Masuk & Keluar (Tanggal, Bulan, & Siapa yang Memasukkan)
              </h2>
              <input
                type="month"
                value={filterMutasiBulan === 'ALL' ? '' : filterMutasiBulan}
                onChange={(e) => setFilterMutasiBulan(e.target.value || 'ALL')}
                className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-[#f3d266] font-mono"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                    <th className="py-2.5 px-3">Tanggal & Bulan</th>
                    <th className="py-2.5 px-3">Status & Jumlah</th>
                    <th className="py-2.5 px-3">Nama Barang</th>
                    <th className="py-2.5 px-3">Diinput Oleh (Petugas)</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {filteredMutasiList.map((m) => (
                    <tr key={m.id} className="hover:bg-[#06281c]/50">
                      <td className="py-2.5 px-3 font-mono text-[#f3d266]">{m.tanggal}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            m.tipe === 'Masuk'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {m.tipe.toUpperCase()} ({m.tipe === 'Masuk' ? '+' : '-'}
                          {m.jumlah} {m.satuan})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{m.namaBarang}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-300">{m.petugas}</td>
                      <td className="py-2.5 px-3 text-emerald-200/80">{m.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PEMINJAMAN BARANG + PENGAJUAN PEMINJAMAN BARANG KE SEKRETARIS */}
      {activeTab === 'peminjaman' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form 1: Pengajuan Peminjaman Barang (Otomatis Masuk ke Notifikasi & Sekretaris untuk Dicetak) */}
            <form
              onSubmit={handleAjukanPeminjamanKeSekretaris}
              className="rounded-2xl bg-gradient-to-br from-[#06281c] via-[#041d14] to-[#02120c] border-2 border-[#d4af37]/60 p-5 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-[#f3d266]" />
                  Pengajuan Peminjaman Barang (Otomatis ke Sekretaris)
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                  AUTO-SYNC SEKRETARIS
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                Setelah klik <strong>Tombol Pengajuan Pinjaman</strong>, data otomatis masuk ke Notifikasi & Daftar Permintaan Surat pada <strong>Dashboard Sekretaris</strong> untuk dicetak.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      setPengajuanPinjamForm({ ...pengajuanPinjamForm, namaBarang: e.target.value })
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
                      setPengajuanPinjamForm({ ...pengajuanPinjamForm, pinjamKe: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Mulai Pinjam *
                  </label>
                  <input
                    type="date"
                    required
                    value={pengajuanPinjamForm.mulai}
                    onChange={(e) =>
                      setPengajuanPinjamForm({ ...pengajuanPinjamForm, mulai: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Batas Akhir *
                  </label>
                  <input
                    type="date"
                    required
                    value={pengajuanPinjamForm.batasAkhir}
                    onChange={(e) =>
                      setPengajuanPinjamForm({ ...pengajuanPinjamForm, batasAkhir: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Jumlah Unit
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
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Keperluan Acara / Operasional..."
                value={pengajuanPinjamForm.keperluan}
                onChange={(e) =>
                  setPengajuanPinjamForm({ ...pengajuanPinjamForm, keperluan: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Tombol Pengajuan Pinjaman (Kirim ke Notifikasi & Sekretaris)
              </button>
            </form>

            {/* Form 2: Catat Peminjaman Barang Inventaris Internal */}
            <form
              onSubmit={handleSimpanPeminjaman}
              className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/50 p-5 shadow-xl space-y-3"
            >
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Catat Peminjaman Inventaris Internal (Siapa, Kapan, Kapan Dikembalikan)
              </h2>
              <select
                value={pinjamForm.barangId}
                onChange={(e) => setPinjamForm({ ...pinjamForm, barangId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {barangInventaris.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.namaBarang} (Tersedia: {b.jumlah})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Nama Peminjam (Siapa)..."
                value={pinjamForm.peminjamNama}
                onChange={(e) => setPinjamForm({ ...pinjamForm, peminjamNama: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Tanggal Pinjam
                  </label>
                  <input
                    type="date"
                    value={pinjamForm.tanggalPinjam}
                    onChange={(e) => setPinjamForm({ ...pinjamForm, tanggalPinjam: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Batas Kembali
                  </label>
                  <input
                    type="date"
                    value={pinjamForm.batasKembali}
                    onChange={(e) => setPinjamForm({ ...pinjamForm, batasKembali: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Keperluan Peminjaman..."
                value={pinjamForm.keperluan}
                onChange={(e) => setPinjamForm({ ...pinjamForm, keperluan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Simpan Peminjaman Internal
              </button>
            </form>
          </div>

          {/* Daftar Peminjaman Barang beserta Tombol Cetak Surat */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Peminjaman Barang (Siapa, Kapan Dipinjam, Kapan Dikembalikan & Tombol Cetak Surat)
            </h2>
            <div className="space-y-3">
              {peminjamanBarang.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] text-[10px] font-mono font-bold">
                        {p.kodePeminjaman}
                      </span>
                      <p className="text-sm font-bold text-white">
                        {p.namaBarang} ({p.jumlahPinjam} Unit)
                      </p>
                    </div>
                    <p className="text-xs text-emerald-200 mt-1">
                      Peminjam / Tujuan: <strong>{p.peminjamNama}</strong> ({p.peminjamBagian}) · Keperluan: {p.keperluan}
                    </p>
                    <p className="text-[11px] font-mono text-[#f3d266] mt-0.5">
                      Mulai Pinjam: {p.tanggalPinjam} · Batas Akhir: {p.batasKembali}{' '}
                      {p.tanggalAktualKembali ? `· Dikembalikan: ${p.tanggalAktualKembali}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCetakSuratPeminjaman(p)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Surat
                    </button>

                    {p.status === 'Dipinjam' ? (
                      <button
                        onClick={() => handleKembalikanPinjaman(p)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Tandai Dikembalikan
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 text-xs font-mono border border-emerald-700/50">
                        ✓ Dikembalikan
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* TAB 5: DATA KAMAR DAN FASILITAS PONDOK (INPUT MANUAL + PEMBAGIAN KAMAR) */}
      {activeTab === 'kamar_santri' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Input Manual Data Kamar & Fasilitas Pondok */}
            <form
              onSubmit={handleTambahKamarManual}
              className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/50 p-5 shadow-xl space-y-3"
            >
              <h2 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#f3d266]" />
                Input Manual Data Kamar & Fasilitas Pondok Pesantren Salaf Al-Maliki
              </h2>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Kode Kamar
                  </label>
                  <input
                    type="text"
                    required
                    value={kamarForm.kodeKamar}
                    onChange={(e) => setKamarForm({ ...kamarForm, kodeKamar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Nama Kamar / Ruangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: K-05 (Imam Syafi'i)"
                    value={kamarForm.namaKamar}
                    onChange={(e) => setKamarForm({ ...kamarForm, namaKamar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Gedung Asrama
                  </label>
                  <input
                    type="text"
                    value={kamarForm.asrama}
                    onChange={(e) => setKamarForm({ ...kamarForm, asrama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Kategori Asrama
                  </label>
                  <select
                    value={kamarForm.gender}
                    onChange={(e) => setKamarForm({ ...kamarForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  >
                    <option value="putra">Asrama Putra</option>
                    <option value="putri">Asrama Putri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Kapasitas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={kamarForm.kapasitas}
                    onChange={(e) =>
                      setKamarForm({ ...kamarForm, kapasitas: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Musyrif / Pembina Kamar
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Ustadz / Ustadzah..."
                    value={kamarForm.musyrif}
                    onChange={(e) => setKamarForm({ ...kamarForm, musyrif: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Kondisi Fasilitas Kamar
                  </label>
                  <select
                    value={kamarForm.kondisi}
                    onChange={(e) => setKamarForm({ ...kamarForm, kondisi: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  >
                    <option value="Baik">Kondisi Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Daftar Fasilitas Kamar (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={kamarForm.fasilitasStr}
                  onChange={(e) => setKamarForm({ ...kamarForm, fasilitasStr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Simpan Data Kamar & Fasilitas Baru
              </button>
            </form>

            {/* Form Penempatan / Pembagian Kamar Santri */}
            <form
              onSubmit={handleAssignKamarSantri}
              className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#f3d266]" />
                  Penempatan & Pembagian Kamar Santri
                </h2>
                <p className="text-xs text-emerald-200/75">
                  Pilih santri dan tempatkan pada kamar asrama yang tersedia. Data otomatis tersinkronisasi dengan Biodata Santri.
                </p>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Pilih Santri
                  </label>
                  <select
                    value={assignKamarSantriId}
                    onChange={(e) => setAssignKamarSantriId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  >
                    {santriList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.nis}) — Kamar Saat Ini: {s.kamar}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Tempatkan ke Kamar Asrama
                  </label>
                  <select
                    value={assignKamarNama}
                    onChange={(e) => setAssignKamarNama(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  >
                    {(systemConfig.kamarSantriList || []).map((k) => (
                      <option key={k.id} value={k.namaKamar}>
                        {k.namaKamar} — {k.asrama} (Kapasitas {k.kapasitas})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Simpan Penempatan Kamar Santri
              </button>
            </form>
          </div>

          {/* Grid Kamar Asrama, Fasilitas & Penghuni */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(systemConfig.kamarSantriList || []).map((kmr) => {
              const penghuni = santriList.filter((s) => s.kamar === kmr.namaKamar);
              return (
                <div
                  key={kmr.id}
                  className="p-5 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                        {kmr.kodeKamar} · {kmr.gender.toUpperCase()} · {kmr.kondisi}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1">{kmr.namaKamar}</h3>
                      <p className="text-xs text-emerald-300">
                        {kmr.asrama} · Musyrif: {kmr.musyrif}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-300">
                        Terisi: {penghuni.length}/{kmr.kapasitas}
                      </span>
                      <button
                        onClick={() => handleHapusKamar(kmr.id, kmr.namaKamar)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700/40 cursor-pointer"
                        title="Hapus Data Kamar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono uppercase text-[#f3d266] mb-1">
                      Fasilitas Kamar & Pondok:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {kmr.fasilitas.map((f, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#03160f] border border-emerald-800/70 text-[10px] text-emerald-100"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-800/60">
                    <p className="text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Daftar Santri Penghuni Kamar ({penghuni.length}):
                    </p>
                    {penghuni.length === 0 ? (
                      <p className="text-[11px] text-emerald-400/60 italic">
                        Belum ada santri di kamar ini
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {penghuni.map((s, idx) => (
                          <p key={s.id} className="text-xs text-white font-semibold">
                            {idx + 1}. {s.nama}{' '}
                            <span className="text-[10px] font-mono text-emerald-300">
                              ({s.nis} · {s.kelas})
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
