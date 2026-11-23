import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Loader2,
  Printer,
  RotateCcw,
  Save,
  Sliders,
} from 'lucide-react';
import {
  PeminjamanPerlengkapan,
  PengaturanSuratPerlengkapan,
  SystemConfig,
} from '../types';
import {
  DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN,
  savePengaturanSuratPerlengkapan,
} from '../services/peminjamanPerlengkapanService';
import { SuratPeminjamanPreview } from './SuratPeminjamanPreview';

interface SuratPerlengkapanLayoutEditorProps {
  pengaturanSurat: PengaturanSuratPerlengkapan;
  systemConfig: SystemConfig;
  peminjamanList?: PeminjamanPerlengkapan[];
  onSaved?: (saved: PengaturanSuratPerlengkapan) => void;
  onCancel?: () => void;
  compactModalMode?: boolean;
}

const SAMPLE_PREVIEW_PINJAM: PeminjamanPerlengkapan = {
  id: 'pjm_preview_sample_001',
  nomorSurat: '001/PJM-PRL/PP-MALIKI/XI/2026',
  namaPeminjam: 'Ahmad Zaki Al-Mubarok',
  statusDivisiKamar: 'Panitia Haflah / Kamar Al-Falah',
  nomorHp: '081234567890',
  tanggalPinjam: new Date().toISOString().split('T')[0],
  estimasiTanggalKembali: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  daftarBarang: [
    {
      id: 'sample_1',
      namaBarang: 'Sound System Portable 15 Inch',
      jumlah: 2,
      satuan: 'Unit',
      kondisiAwal: 'Baik / Normal',
      sumberBarang: 'inventaris',
    },
    {
      id: 'sample_2',
      namaBarang: 'Microphone Wireless + Stand',
      jumlah: 4,
      satuan: 'Set',
      kondisiAwal: 'Baik',
      sumberBarang: 'fasilitas',
      gedungNama: 'Gedung A (Aula & Asrama)',
    },
  ],
  keperluan: 'Pelaksanaan Pengajian Rutin & Musyawarah Kubro Santri',
  status: 'Disetujui',
  diverifikasiOleh: 'Ustadz H. Ahmad Fauzan, M.Pd.I',
  waktuVerifikasi: 'Hari ini, 09:30 WIB',
  createdAt: new Date().toISOString(),
};

export const SuratPerlengkapanLayoutEditor: React.FC<
  SuratPerlengkapanLayoutEditorProps
> = ({
  pengaturanSurat,
  systemConfig,
  peminjamanList = [],
  onSaved,
  onCancel,
  compactModalMode = false,
}) => {
  const [form, setForm] = useState<PengaturanSuratPerlengkapan>({
    ...DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN,
    ...pengaturanSurat,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [selectedSampleId, setSelectedSampleId] = useState<string>('SAMPLE');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    setForm({
      ...DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN,
      ...pengaturanSurat,
    });
  }, [pengaturanSurat]);

  const previewPinjam = useMemo(() => {
    if (selectedSampleId !== 'SAMPLE') {
      const found = peminjamanList.find((p) => p.id === selectedSampleId);
      if (found) return found;
    }
    return SAMPLE_PREVIEW_PINJAM;
  }, [selectedSampleId, peminjamanList]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const saved = await savePengaturanSuratPerlengkapan(form);
      setStatusMsg({
        type: 'ok',
        text: 'Layout & format surat peminjaman berhasil disimpan permanen dan langsung aktif di seluruh cetakan!',
      });
      onSaved?.(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: 'err', text: `Gagal menyimpan pengaturan: ${msg}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    setForm({ ...DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN });
    setStatusMsg({
      type: 'ok',
      text: 'Layout dikembalikan ke template standar. Klik "Simpan Format & Layout Surat" untuk menerapkan.',
    });
  };

  return (
    <div className="space-y-4">
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Mobile View Switcher (Editor vs Pratinjau) */}
      <div className="flex xl:hidden items-center gap-2 p-1 rounded-xl bg-[#02100a] border border-emerald-800">
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileView === 'editor'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a]'
              : 'text-emerald-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Edit Layout Surat</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileView === 'preview'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Pratinjau Surat A4</span>
        </button>
      </div>

      <div
        className={`grid grid-cols-1 ${
          compactModalMode ? 'lg:grid-cols-12' : 'xl:grid-cols-12'
        } gap-5 items-start`}
      >
        {/* KOLOM KIRI: EDITOR LAYOUT & FORMAT SURAT */}
        <form
          onSubmit={handleSave}
          className={`${
            compactModalMode ? 'lg:col-span-6' : 'xl:col-span-6'
          } space-y-4 text-xs ${mobileView === 'preview' ? 'hidden xl:block' : 'block'}`}
        >
          {/* 1. Kop Surat & Gaya Visual */}
          <div className="space-y-3 rounded-2xl bg-[#03160f]/95 border border-emerald-800/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#f3d266] font-bold">
                1. Kop Surat &amp; Tema Visual A4
              </h4>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanKopSurat}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanKopSurat: e.target.checked })
                  }
                  className="accent-emerald-500 w-3.5 h-3.5"
                />
                <span>Tampilkan Kop</span>
              </label>
            </div>

            {form.tampilkanKopSurat && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Nama Instansi / Pondok (Kosongkan untuk pakai nama utama)
                  </label>
                  <input
                    type="text"
                    placeholder={
                      systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'
                    }
                    value={form.kopNamaInstansi || ''}
                    onChange={(e) =>
                      setForm({ ...form, kopNamaInstansi: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Sub Unit / Bagian
                  </label>
                  <input
                    type="text"
                    placeholder={
                      systemConfig.perlengkapanConfig?.namaUnitPerlengkapan ||
                      'BAGIAN PERLENGKAPAN & SARPRAS'
                    }
                    value={form.kopNamaUnit || ''}
                    onChange={(e) => setForm({ ...form, kopNamaUnit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Alamat &amp; Kontak Kop
                  </label>
                  <input
                    type="text"
                    placeholder={
                      systemConfig.alamatPondok || 'Jl. Pesantren Luhur No. 99...'
                    }
                    value={form.kopAlamatKontak || ''}
                    onChange={(e) =>
                      setForm({ ...form, kopAlamatKontak: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Teks Bismillah
                  </label>
                  <input
                    type="text"
                    value={form.kopTeksBismillah ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, kopTeksBismillah: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Gaya Garis Kop Surat
                  </label>
                  <select
                    value={form.gayaBorderKop || 'double'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gayaBorderKop: e.target.value as PengaturanSuratPerlengkapan['gayaBorderKop'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                  >
                    <option value="double">Garis Ganda Resmi (Double)</option>
                    <option value="solid">Garis Tegas Tunggal (Solid)</option>
                    <option value="minimal">Garis Tipis Minimalis</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tampilkanBismillah ?? true}
                    onChange={(e) =>
                      setForm({ ...form, tampilkanBismillah: e.target.checked })
                    }
                    className="accent-emerald-500 w-3.5 h-3.5"
                  />
                  <span className="text-emerald-100">Tampilkan Bismillah</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tampilkanLogoKop ?? true}
                    onChange={(e) =>
                      setForm({ ...form, tampilkanLogoKop: e.target.checked })
                    }
                    className="accent-emerald-500 w-3.5 h-3.5"
                  />
                  <span className="text-emerald-100">Tampilkan Logo Pondok</span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Tema Warna Surat
                </label>
                <select
                  value={form.warnaTemaSurat || 'emerald'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      warnaTemaSurat: e.target.value as PengaturanSuratPerlengkapan['warnaTemaSurat'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                >
                  <option value="emerald">Hijau Zamrud Resmi</option>
                  <option value="gold">Emas Klasik Pondok</option>
                  <option value="classic_bw">Hitam Putih Formal</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Ukuran Font Cetak
                </label>
                <select
                  value={form.ukuranFont}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ukuranFont: e.target.value as PengaturanSuratPerlengkapan['ukuranFont'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                >
                  <option value="kecil">Kecil (Padat)</option>
                  <option value="sedang">Sedang (Standar A4)</option>
                  <option value="besar">Besar (Jelas)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Margin Halaman
                </label>
                <select
                  value={form.marginHalaman || 'standar'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      marginHalaman: e.target.value as PengaturanSuratPerlengkapan['marginHalaman'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                >
                  <option value="rapat">Rapat (Muat Banyak)</option>
                  <option value="standar">Standar A4</option>
                  <option value="lebar">Lebar (Elegan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Judul, Redaksi & Tabel Barang */}
          <div className="space-y-3 rounded-2xl bg-[#03160f]/95 border border-emerald-800/70 p-4">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#f3d266] font-bold">
              2. Judul, Redaksi &amp; Struktur Konten Surat
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Judul Surat
                </label>
                <input
                  type="text"
                  required
                  value={form.judulSurat}
                  onChange={(e) => setForm({ ...form, judulSurat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-bold focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Perataan Judul
                </label>
                <select
                  value={form.perataanJudul || 'center'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      perataanJudul: e.target.value as PengaturanSuratPerlengkapan['perataanJudul'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                >
                  <option value="center">Tengah (Center)</option>
                  <option value="left">Rata Kiri (Left)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Teks Pembuka Surat
              </label>
              <textarea
                rows={2}
                required
                value={form.teksPembuka}
                onChange={(e) => setForm({ ...form, teksPembuka: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Label Judul Tabel Barang
              </label>
              <input
                type="text"
                value={form.labelTabelBarang || ''}
                onChange={(e) =>
                  setForm({ ...form, labelTabelBarang: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Teks Penutup &amp; Ketentuan Tanggung Jawab
              </label>
              <textarea
                rows={2}
                required
                value={form.teksPenutup}
                onChange={(e) => setForm({ ...form, teksPenutup: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Elemen Layout Tampil / Sembunyi */}
            <div className="pt-1">
              <p className="text-[10px] font-mono uppercase text-emerald-300 mb-1.5">
                Blok &amp; Kolom yang Ditampilkan di Surat:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'tampilkanNomorSurat', label: 'Nomor Surat' },
                  { key: 'tampilkanIdentitasPeminjam', label: 'Identitas Peminjam' },
                  { key: 'tampilkanKeperluan', label: 'Baris Keperluan' },
                  { key: 'tampilkanKolomSumber', label: 'Kolom Sumber/Gedung' },
                  { key: 'tampilkanKolomKondisi', label: 'Kolom Kondisi Awal' },
                  { key: 'tampilkanKetentuan', label: 'Box Ketentuan' },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean((form as any)[opt.key] ?? true)}
                      onChange={(e) =>
                        setForm({ ...form, [opt.key]: e.target.checked })
                      }
                      className="accent-emerald-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-medium text-emerald-100">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Penanda Tangan, Stempel & QR Code */}
          <div className="space-y-3 rounded-2xl bg-[#03160f]/95 border border-emerald-800/70 p-4">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#f3d266] font-bold">
              3. Penanda Tangan, Stempel &amp; Pengaturan QR Code
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Nama Ketua Pondok
                </label>
                <input
                  type="text"
                  required
                  value={form.namaKetuaPondok}
                  onChange={(e) =>
                    setForm({ ...form, namaKetuaPondok: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Jabatan Ketua Pondok
                </label>
                <input
                  type="text"
                  required
                  value={form.jabatanKetuaPondok}
                  onChange={(e) =>
                    setForm({ ...form, jabatanKetuaPondok: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Nama Bagian Perlengkapan
                </label>
                <input
                  type="text"
                  required
                  value={form.namaKetuaPerlengkapan}
                  onChange={(e) =>
                    setForm({ ...form, namaKetuaPerlengkapan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Jabatan Bagian Perlengkapan
                </label>
                <input
                  type="text"
                  required
                  value={form.jabatanKetuaPerlengkapan}
                  onChange={(e) =>
                    setForm({ ...form, jabatanKetuaPerlengkapan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanTtdPeminjam}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanTtdPeminjam: e.target.checked })
                  }
                  className="accent-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-semibold text-emerald-100">
                  TTD Peminjam
                </span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanTtdPerlengkapan}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanTtdPerlengkapan: e.target.checked })
                  }
                  className="accent-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-semibold text-emerald-100">
                  TTD Perlengkapan
                </span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanTtdKetuaPondok}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanTtdKetuaPondok: e.target.checked })
                  }
                  className="accent-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-semibold text-emerald-100">
                  TTD Ketua
                </span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanStempel ?? true}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanStempel: e.target.checked })
                  }
                  className="accent-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-semibold text-emerald-100">
                  Stempel Sah
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanQrCode ?? true}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanQrCode: e.target.checked })
                  }
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-emerald-100">Tampilkan QR Code</span>
              </label>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Posisi QR Code
                </label>
                <select
                  value={form.posisiQrCode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      posisiQrCode: e.target.value as PengaturanSuratPerlengkapan['posisiQrCode'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                >
                  <option value="kiri_bawah">Kiri Bawah Surat</option>
                  <option value="kanan_bawah">Kanan Bawah Surat</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Label Catatan Footer
                </label>
                <input
                  type="text"
                  value={form.labelCatatanFooter || ''}
                  onChange={(e) =>
                    setForm({ ...form, labelCatatanFooter: e.target.value })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3.5 py-2.5 rounded-xl bg-[#02100a] hover:bg-[#06281c] border border-emerald-700 text-emerald-200 font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
            <div className="flex items-center gap-2 ml-auto">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                >
                  Tutup
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold inline-flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Format & Layout Surat'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* KOLOM KANAN: PRATINJAU LIVE SURAT PEMINJAMAN A4 */}
        <div
          className={`${
            compactModalMode ? 'lg:col-span-6' : 'xl:col-span-6'
          } rounded-2xl bg-[#03160f]/95 border border-[#d4af37]/45 p-3.5 sm:p-4 space-y-3 ${
            mobileView === 'editor' ? 'hidden xl:block' : 'block'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/70 pb-3">
            <div>
              <h4 className="text-xs font-extrabold text-[#f3d266] uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Pratinjau Langsung Surat Peminjaman (Live A4)</span>
              </h4>
              <p className="text-[11px] text-emerald-200/75">
                Setiap perubahan layout di sebelah kiri langsung terlihat di pratinjau ini.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {peminjamanList.length > 0 && (
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#02100a] border border-emerald-800 text-[11px] text-white max-w-[190px]"
                  title="Pilih data peminjaman untuk pratinjau"
                >
                  <option value="SAMPLE">Data Contoh (Sample)</option>
                  {peminjamanList.slice(0, 10).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nomorSurat} · {p.namaPeminjam}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => {
                  document.body.classList.add('printing-letter');
                  setTimeout(() => window.print(), 80);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                title="Uji Cetak Pratinjau"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Tes Cetak</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border-2 border-emerald-800/80 shadow-2xl bg-white max-h-[760px] overflow-y-auto">
            <SuratPeminjamanPreview
              pinjam={previewPinjam}
              systemConfig={systemConfig}
              pengaturanSurat={form}
              compactScale
            />
          </div>
        </div>
      </div>
    </div>
  );
};
