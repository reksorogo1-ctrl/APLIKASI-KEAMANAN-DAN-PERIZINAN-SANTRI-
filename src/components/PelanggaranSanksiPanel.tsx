import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Gavel,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Share2,
  Trash2,
  X,
  GraduationCap,
} from 'lucide-react';
import { Pelanggaran, Sanksi, Santri, TataTertib, UserAccount, StatusSanksi } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { SuratSanksiModal } from './SuratSanksiModal';

interface PelanggaranSanksiPanelProps {
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  santriList: Santri[];
  tataTertibList: TataTertib[];
  currentUser: UserAccount;
  preSelectedPelanggaran?: Pelanggaran | null;
  onClearPreSelectedPelanggaran?: () => void;
}

const PRESET_SANKSI = [
  "Menghafal Nadzom Al-Imrithi bait 1-30 di hadapan Ustadz Pembimbing",
  "Khidmah membersihkan serambi dan tempat wudhu Masjid Jami' selama 3 hari",
  "Membaca Al-Qur'an Juz 30 bin-nadhar di serambi masjid ba'da Subuh",
  "Menulis makna pegon kitab Ta'lim Muta'allim sebanyak 5 lembar",
];

export const PelanggaranSanksiPanel: React.FC<PelanggaranSanksiPanelProps> = ({
  pelanggaranList,
  sanksiList,
  santriList,
  tataTertibList,
  currentUser,
  preSelectedPelanggaran,
  onClearPreSelectedPelanggaran,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'belum_sanksi' | 'Belum Dikerjakan' | 'Sedang Berjalan' | 'Selesai'
  >('all');
  const [tingkatFilter, setTingkatFilter] = useState<'all' | 'Ringan' | 'Sedang' | 'Berat'>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignSanksiTarget, setAssignSanksiTarget] = useState<Pelanggaran | null>(null);
  const [selectedSanksiForSurat, setSelectedSanksiForSurat] = useState<Sanksi | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Form Catat Pelanggaran + Sanksi (1 Langkah)
  const [formState, setFormState] = useState({
    santriId: '',
    ruleId: '',
    tanggal: todayStr,
    waktu: nowTimeStr,
    lokasi: 'Area Pondok Pesantren',
    kronologi: '',
    petugas: currentUser.nama,
    sekalianSanksi: true,
    bentukSanksi: PRESET_SANKSI[0],
    ustadzPembina: 'Ustadz Ridwan Malik',
    batasMaksimal: `${nextWeekStr} 17:00 WIB`,
    statusSanksi: 'Belum Dikerjakan' as StatusSanksi,
  });

  // Form Beri Sanksi untuk Pelanggaran yang Sudah Ada
  const [quickSanksiForm, setQuickSanksiForm] = useState({
    bentukSanksi: PRESET_SANKSI[0],
    ustadzPembina: 'Ustadz Ridwan Malik',
    tanggalTargetSelesai: nextWeekStr,
    batasMaksimal: `${nextWeekStr} 17:00 WIB`,
    status: 'Belum Dikerjakan' as StatusSanksi,
    catatanPembinaan: 'Santri berkomitmen menyelesaikan pembinaan secara istiqomah.',
  });

  useEffect(() => {
    if (preSelectedPelanggaran) {
      setAssignSanksiTarget(preSelectedPelanggaran);
    }
  }, [preSelectedPelanggaran]);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const getHariName = (dateStr: string) => {
    try {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[new Date(dateStr).getDay()] || 'Senin';
    } catch {
      return 'Senin';
    }
  };

  // Gabungkan daftar Pelanggaran & Sanksi agar tampil satu pintu & tidak ada yang tertinggal
  const combinedRows = useMemo(() => {
    const usedSanksiIds = new Set<string>();

    const fromPelanggaran = pelanggaranList.map((pel) => {
      const matchedSanksi =
        sanksiList.find((s) => s.pelanggaranId === pel.id || s.id === pel.sanksiId) || null;
      if (matchedSanksi) usedSanksiIds.add(matchedSanksi.id);
      return {
        rowKey: pel.id,
        pelanggaran: pel,
        sanksi: matchedSanksi,
      };
    });

    const orphanSanksi = sanksiList
      .filter((s) => !usedSanksiIds.has(s.id))
      .map((s) => ({
        rowKey: s.id,
        pelanggaran: null as Pelanggaran | null,
        sanksi: s,
      }));

    return [...fromPelanggaran, ...orphanSanksi];
  }, [pelanggaranList, sanksiList]);

  const counts = useMemo(() => {
    const belumAda = combinedRows.filter((r) => !r.sanksi).length;
    const berjalan = combinedRows.filter(
      (r) => r.sanksi && (r.sanksi.status === 'Belum Dikerjakan' || r.sanksi.status === 'Sedang Berjalan')
    ).length;
    const selesai = combinedRows.filter((r) => r.sanksi && r.sanksi.status === 'Selesai').length;
    return { total: combinedRows.length, belumAda, berjalan, selesai };
  }, [combinedRows]);

  const filteredRows = useMemo(() => {
    return combinedRows.filter((r) => {
      if (tingkatFilter !== 'all') {
        if (!r.pelanggaran || r.pelanggaran.kategori !== tingkatFilter) return false;
      }
      if (statusFilter === 'belum_sanksi' && r.sanksi !== null) return false;
      if (
        (statusFilter === 'Belum Dikerjakan' ||
          statusFilter === 'Sedang Berjalan' ||
          statusFilter === 'Selesai') &&
        r.sanksi?.status !== statusFilter
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nama = (r.pelanggaran?.santriNama || r.sanksi?.santriNama || '').toLowerCase();
        const nis = (r.pelanggaran?.santriNis || r.sanksi?.santriNis || '').toLowerCase();
        const jenis = (r.pelanggaran?.jenisPelanggaran || r.sanksi?.jenisPelanggaran || '').toLowerCase();
        const bentuk = (r.sanksi?.bentukSanksi || '').toLowerCase();
        return nama.includes(q) || nis.includes(q) || jenis.includes(q) || bentuk.includes(q);
      }
      return true;
    });
  }, [combinedRows, tingkatFilter, statusFilter, searchQuery]);

  const createAndSaveSanksi = (
    pel: Pelanggaran,
    bentukSanksi: string,
    ustadzPembina: string,
    batasMaksimal: string,
    tanggalTargetSelesai: string,
    status: StatusSanksi,
    catatanPembinaan: string
  ): Sanksi => {
    const santriObj = santriList.find((s) => s.id === pel.santriId);
    const systemCfg = storageService.getSystemConfig();
    const savedSanksi: Sanksi = {
      id: `san_k_${Date.now()}`,
      kodeSanksi: `SNK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customNomorSurat: `SNK/MALIKI/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${Math.floor(
        100 + Math.random() * 900
      )}`,
      pelanggaranId: pel.id,
      santriId: pel.santriId,
      santriNama: pel.santriNama,
      santriNis: pel.santriNis,
      santriGender: pel.santriGender,
      santriKelas: santriObj?.kelas || '1 Ulya (Aliyah)',
      santriKamar: santriObj?.kamar || 'Kamar Asrama',
      jenisPelanggaran: pel.jenisPelanggaran,
      pelanggaranTanggal: pel.tanggal,
      pelanggaranHari: getHariName(pel.tanggal),
      kronologi: pel.kronologi || '',
      bentukSanksi,
      tanggalPenetapan: todayStr,
      petugasPenetap: currentUser.nama,
      petugasPencatat: currentUser.nama,
      tanggalTargetSelesai,
      batasMaksimal,
      status,
      ustadzPembina,
      catatanPembinaan,
      snapshotLayout: systemCfg.suratSanksiLayout,
    };
    storageService.saveSanksi(savedSanksi);
    storageService.savePelanggaran({ ...pel, sanksiId: savedSanksi.id });
    return savedSanksi;
  };

  const handleSaveCombined = (e: React.FormEvent) => {
    e.preventDefault();
    const santri = santriList.find((s) => s.id === formState.santriId);
    const rule = tataTertibList.find((r) => r.id === formState.ruleId);
    if (!santri || !rule) {
      alert('Pilih santri dan pasal tata tertib terlebih dahulu.');
      return;
    }

    const newPel: Pelanggaran = {
      id: `pel_${Date.now()}`,
      kodePelanggaran: `PEL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      santriId: santri.id,
      santriNama: santri.nama,
      santriNis: santri.nis,
      santriGender: santri.gender,
      tanggal: formState.tanggal,
      waktu: formState.waktu,
      tataTertibId: rule.id,
      jenisPelanggaran: rule.deskripsi,
      kategori: rule.tingkat,
      poin: rule.poin,
      kronologi: formState.kronologi || `Pelanggaran ${rule.deskripsi} di ${formState.lokasi}.`,
      lokasi: formState.lokasi,
      namaPetugasPelapor: formState.petugas,
      statusVerifikasi: 'Terverifikasi',
    };

    storageService.savePelanggaran(newPel);
    storageService.addNotification({
      judul: `Pelanggaran Tercatat: ${santri.nama}`,
      pesan: `${rule.deskripsi} (${rule.tingkat} - ${rule.poin} poin).`,
      tipe: 'warning',
      linkMenu: 'pelanggaran',
      noWaTujuan: santri.noWaWali,
      waPesanTemplate: WhatsAppTemplates.pelanggaranSanksi(newPel),
    });

    if (formState.sekalianSanksi && formState.bentukSanksi.trim()) {
      const savedSanksi = createAndSaveSanksi(
        newPel,
        formState.bentukSanksi.trim(),
        formState.ustadzPembina.trim() || 'Ustadz Pembina',
        formState.batasMaksimal.trim() || `${nextWeekStr} 17:00 WIB`,
        nextWeekStr,
        formState.statusSanksi,
        'Pembinaan edukatif terpadu.'
      );
      setIsAddModalOpen(false);
      setSelectedSanksiForSurat(savedSanksi);
      notify(`Pelanggaran & Sanksi Edukatif untuk ${santri.nama} berhasil disimpan.`);
    } else {
      setIsAddModalOpen(false);
      notify(`Pelanggaran untuk ${santri.nama} berhasil dicatat.`);
    }
  };

  const handleSaveQuickSanksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSanksiTarget) return;
    const savedSanksi = createAndSaveSanksi(
      assignSanksiTarget,
      quickSanksiForm.bentukSanksi,
      quickSanksiForm.ustadzPembina,
      quickSanksiForm.batasMaksimal,
      quickSanksiForm.tanggalTargetSelesai,
      quickSanksiForm.status,
      quickSanksiForm.catatanPembinaan
    );
    setAssignSanksiTarget(null);
    if (onClearPreSelectedPelanggaran) onClearPreSelectedPelanggaran();
    setSelectedSanksiForSurat(savedSanksi);
    notify(`Sanksi untuk ${assignSanksiTarget.santriNama} berhasil ditetapkan.`);
  };

  const handleMarkCompleted = (sanksi: Sanksi) => {
    storageService.saveSanksi({
      ...sanksi,
      status: 'Selesai',
      tanggalAktualSelesai: todayStr,
      catatanPembinaan: `${
        sanksi.catatanPembinaan ? sanksi.catatanPembinaan + ' · ' : ''
      }Selesai ditunaikan pada ${todayStr}.`,
    });
    storageService.addLog(
      'Penyelesaian Takzir',
      `Santri ${sanksi.santriNama} menuntaskan sanksi: ${sanksi.bentukSanksi}`,
      'sanksi'
    );
    notify(`Sanksi ${sanksi.santriNama} ditandai Tuntas.`);
  };

  const handleSendWa = (pel: Pelanggaran | null, sanksi: Sanksi | null) => {
    const santriId = pel?.santriId || sanksi?.santriId;
    const santri = santriList.find((s) => s.id === santriId);
    const targetWa = santri?.noWaWali || '08123456789';

    if (sanksi) {
      const text = `*PONDOK PESANTREN SALAF AL-MALIKI*
*Laporan Pelanggaran & Sanksi Edukatif*
Nomor: ${sanksi.customNomorSurat || sanksi.kodeSanksi}
───────────────────────────
Yth. Wali dari *${sanksi.santriNama}* (${sanksi.santriNis})
📌 Pelanggaran: ${sanksi.jenisPelanggaran}
📖 Sanksi Edukatif: ${sanksi.bentukSanksi}
⏰ Batas Waktu: ${sanksi.batasMaksimal || sanksi.tanggalTargetSelesai}
👤 Pembina: ${sanksi.ustadzPembina}
📌 Status: ${sanksi.status}`;
      window.open(createWhatsAppUrl(targetWa, text), '_blank');
    } else if (pel) {
      window.open(createWhatsAppUrl(targetWa, WhatsAppTemplates.pelanggaranSanksi(pel)), '_blank');
    }
  };

  const handleDeletePelanggaran = (pel: Pelanggaran) => {
    if (confirm(`Hapus catatan pelanggaran ${pel.santriNama}? Poin santri akan disesuaikan.`)) {
      storageService.deletePelanggaran(pel.id);
      notify(`Catatan pelanggaran ${pel.santriNama} dihapus.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Ringkas */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>PELANGGARAN &amp; SANKSI EDUKATIF TERPADU</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white mt-1">
            Pencatatan Pelanggaran &amp; Takzir Edukatif Santri
          </h1>
          <p className="text-xs text-emerald-200/75">
            Catat pelanggaran sekaligus tetapkan sanksi edukatif dan cetak surat resmi dalam satu alur sederhana.
          </p>
        </div>

        <button
          onClick={() => {
            setFormState((prev) => ({
              ...prev,
              santriId: santriList[0]?.id || '',
              ruleId: tataTertibList[0]?.id || '',
            }));
            setIsAddModalOpen(true);
          }}
          className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f3d266] text-[#02120a] font-bold text-xs cursor-pointer shadow-lg self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pelanggaran &amp; Sanksi</span>
        </button>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-[#d4af37]/60 text-emerald-100 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#f3d266]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter Ringkas (Status & Tingkat + Search) */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-800/75 p-3.5 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#d4af37] text-[#02120a]'
                : 'bg-[#03160f] text-emerald-200 border border-emerald-800'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            onClick={() => setStatusFilter('belum_sanksi')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              statusFilter === 'belum_sanksi'
                ? 'bg-rose-500 text-white'
                : 'bg-[#03160f] text-rose-300 border border-rose-800/60'
            }`}
          >
            Belum Ada Sanksi ({counts.belumAda})
          </button>
          <button
            onClick={() => setStatusFilter('Belum Dikerjakan')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              statusFilter === 'Belum Dikerjakan'
                ? 'bg-amber-500 text-[#02120a]'
                : 'bg-[#03160f] text-amber-300 border border-amber-800/60'
            }`}
          >
            Belum Dikerjakan
          </button>
          <button
            onClick={() => setStatusFilter('Sedang Berjalan')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              statusFilter === 'Sedang Berjalan'
                ? 'bg-amber-400 text-[#02120a]'
                : 'bg-[#03160f] text-amber-200 border border-emerald-800'
            }`}
          >
            Sedang Berjalan ({counts.berjalan})
          </button>
          <button
            onClick={() => setStatusFilter('Selesai')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              statusFilter === 'Selesai'
                ? 'bg-emerald-500 text-[#02120a]'
                : 'bg-[#03160f] text-emerald-300 border border-emerald-800'
            }`}
          >
            Selesai / Tuntas ({counts.selesai})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              placeholder="Cari nama santri, NIS, jenis pelanggaran, atau sanksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#03160f] border border-emerald-800 rounded-xl text-white placeholder-emerald-200/45 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <select
            value={tingkatFilter}
            onChange={(e) => setTingkatFilter(e.target.value as any)}
            className="sm:col-span-4 px-3 py-2 text-xs bg-[#03160f] border border-emerald-800 rounded-xl text-white"
          >
            <option value="all">Semua Tingkat Pelanggaran</option>
            <option value="Ringan">Pelanggaran Ringan</option>
            <option value="Sedang">Pelanggaran Sedang</option>
            <option value="Berat">Pelanggaran Berat</option>
          </select>
        </div>
      </div>

      {/* Tabel Terpadu Pelanggaran & Sanksi */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#02120a] text-[#f3d266] uppercase text-[10px] font-mono border-b border-emerald-800/70">
              <tr>
                <th className="px-3.5 py-3 text-center w-10">No</th>
                <th className="px-4 py-3">Santri &amp; Kelas</th>
                <th className="px-4 py-3">Pelanggaran &amp; Poin</th>
                <th className="px-4 py-3">Sanksi Edukatif &amp; Batas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-emerald-200/70">
                    Tidak ada catatan pelanggaran atau sanksi pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ rowKey, pelanggaran: pel, sanksi }, idx) => {
                  const santriId = pel?.santriId || sanksi?.santriId;
                  const santriObj = santriList.find((s) => s.id === santriId);
                  const nama = pel?.santriNama || sanksi?.santriNama || '-';
                  const nis = pel?.santriNis || sanksi?.santriNis || '-';
                  const kelas = sanksi?.santriKelas || santriObj?.kelas || '-';
                  const jenis = pel?.jenisPelanggaran || sanksi?.jenisPelanggaran || '-';
                  const tanggal = pel?.tanggal || sanksi?.pelanggaranTanggal || '-';

                  return (
                    <tr key={rowKey} className="hover:bg-[#06281c]/55">
                      <td className="px-3.5 py-3 text-center font-mono text-emerald-300">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{nama}</p>
                        <p className="text-[11px] font-mono text-emerald-300/80">
                          {nis} · {kelas}
                        </p>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-semibold text-slate-100">{jenis}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-mono">
                          <span className="text-emerald-300/80">{tanggal}</span>
                          {pel && (
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                pel.kategori === 'Berat'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : pel.kategori === 'Sedang'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {pel.kategori} (+{pel.poin} Poin)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {sanksi ? (
                          <div>
                            <p className="text-amber-300 font-semibold">{sanksi.bentukSanksi}</p>
                            <p className="text-[10px] font-mono text-emerald-200/75 mt-0.5">
                              Batas: {sanksi.batasMaksimal || sanksi.tanggalTargetSelesai} · Pembina:{' '}
                              {sanksi.ustadzPembina}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-rose-300 italic">
                            Belum ditetapkan sanksi edukatif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sanksi ? (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                              sanksi.status === 'Selesai'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : sanksi.status === 'Sedang Berjalan'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {sanksi.status}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            Menunggu Sanksi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                        {!sanksi && pel && (
                          <button
                            onClick={() => setAssignSanksiTarget(pel)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#f3d266] text-[#02120a] font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            <span>Beri Sanksi</span>
                          </button>
                        )}
                        {sanksi && (
                          <>
                            <button
                              onClick={() => setSelectedSanksiForSurat(sanksi)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                              title="Cetak & Edit Surat Sanksi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Surat</span>
                            </button>
                            {sanksi.status !== 'Selesai' && (
                              <button
                                onClick={() => handleMarkCompleted(sanksi)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-[#02120a] font-bold text-[11px] cursor-pointer"
                              >
                                Tuntas
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => handleSendWa(pel, sanksi)}
                          className="p-1.5 rounded-lg bg-[#03160f] border border-emerald-700 text-emerald-300 hover:text-white cursor-pointer"
                          title="Kirim Laporan ke WA Wali"
                        >
                          <Share2 className="w-3.5 h-3.5 inline" />
                        </button>
                        {pel && (
                          <button
                            onClick={() => handleDeletePelanggaran(pel)}
                            className="p-1.5 rounded-lg bg-[#03160f] border border-rose-800/70 text-rose-300 hover:text-rose-200 cursor-pointer"
                            title="Hapus Catatan Pelanggaran"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1-LANGKAH: CATAT PELANGGARAN & SANKSI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="cyber-modal-card w-full max-w-xl rounded-2xl bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/30 shadow-2xl overflow-hidden my-6">
            <div className="px-5 py-3.5 border-b border-emerald-500/25 bg-[#041A13]/65 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#f3d266]" />
                Catat Pelanggaran &amp; Sanksi Edukatif
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCombined} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Pilih Santri
                  </label>
                  <select
                    required
                    value={formState.santriId}
                    onChange={(e) => setFormState({ ...formState, santriId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  >
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.nis} - {s.kelas})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Pasal Pelanggaran
                  </label>
                  <select
                    required
                    value={formState.ruleId}
                    onChange={(e) => setFormState({ ...formState, ruleId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  >
                    <option value="">-- Pilih Tata Tertib --</option>
                    {tataTertibList.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.kode}] {r.deskripsi} ({r.tingkat} · +{r.poin} Poin)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.tanggal}
                    onChange={(e) => setFormState({ ...formState, tanggal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.lokasi}
                    onChange={(e) => setFormState({ ...formState, lokasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Petugas Pelapor
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.petugas}
                    onChange={(e) => setFormState({ ...formState, petugas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Kronologi Singkat
                </label>
                <textarea
                  rows={2}
                  value={formState.kronologi}
                  onChange={(e) => setFormState({ ...formState, kronologi: e.target.value })}
                  placeholder="Keterangan singkat kejadian..."
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                />
              </div>

              {/* Sekaligus Tetapkan Sanksi */}
              <div className="p-3.5 rounded-xl bg-[#03160f] border border-[#d4af37]/40 space-y-2.5">
                <label className="flex items-center gap-2 font-bold text-[#f3d266] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.sekalianSanksi}
                    onChange={(e) => setFormState({ ...formState, sekalianSanksi: e.target.checked })}
                    className="accent-[#d4af37]"
                  />
                  <span>Sekaligus Tetapkan Sanksi Edukatif &amp; Terbitkan Surat</span>
                </label>

                {formState.sekalianSanksi && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_SANKSI.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormState({ ...formState, bentukSanksi: preset })}
                          className="px-2 py-1 rounded-lg bg-[#041d14] border border-emerald-800 text-[10px] text-emerald-200 hover:border-[#d4af37] cursor-pointer text-left"
                        >
                          {preset.slice(0, 42)}...
                        </button>
                      ))}
                    </div>
                    <textarea
                      required={formState.sekalianSanksi}
                      rows={2}
                      value={formState.bentukSanksi}
                      onChange={(e) => setFormState({ ...formState, bentukSanksi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#041d14] border border-emerald-800 text-white"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Ustadz Pembina"
                        value={formState.ustadzPembina}
                        onChange={(e) => setFormState({ ...formState, ustadzPembina: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#041d14] border border-emerald-800 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Batas Waktu (cth: 2026-11-24 17:00 WIB)"
                        value={formState.batasMaksimal}
                        onChange={(e) => setFormState({ ...formState, batasMaksimal: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#041d14] border border-emerald-800 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-emerald-200 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#f3d266] text-[#02120a] font-bold cursor-pointer"
                >
                  {formState.sekalianSanksi ? 'Simpan & Terbitkan Surat' : 'Simpan Pelanggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BERI SANKSI CEPAT UNTUK PELANGGARAN YANG SUDAH TERCATAT */}
      {assignSanksiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="cyber-modal-card w-full max-w-lg rounded-2xl bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/30 shadow-2xl overflow-hidden my-6">
            <div className="px-5 py-3.5 border-b border-emerald-500/25 bg-[#041A13]/65 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#f3d266]" />
                Tetapkan Sanksi Edukatif
              </h3>
              <button
                onClick={() => {
                  setAssignSanksiTarget(null);
                  if (onClearPreSelectedPelanggaran) onClearPreSelectedPelanggaran();
                }}
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickSanksi} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#03160f] border border-emerald-800">
                <p className="font-bold text-white">{assignSanksiTarget.santriNama}</p>
                <p className="text-[11px] text-amber-300 mt-0.5">{assignSanksiTarget.jenisPelanggaran}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_SANKSI.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuickSanksiForm({ ...quickSanksiForm, bentukSanksi: preset })}
                    className="px-2 py-1 rounded-lg bg-[#03160f] border border-emerald-800 text-[10px] text-emerald-200 hover:border-[#d4af37] cursor-pointer text-left"
                  >
                    {preset.slice(0, 42)}...
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Bentuk Sanksi Edukatif
                </label>
                <textarea
                  required
                  rows={2}
                  value={quickSanksiForm.bentukSanksi}
                  onChange={(e) =>
                    setQuickSanksiForm({ ...quickSanksiForm, bentukSanksi: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Ustadz Pembina
                  </label>
                  <input
                    type="text"
                    required
                    value={quickSanksiForm.ustadzPembina}
                    onChange={(e) =>
                      setQuickSanksiForm({ ...quickSanksiForm, ustadzPembina: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Batas Maksimal
                  </label>
                  <input
                    type="text"
                    required
                    value={quickSanksiForm.batasMaksimal}
                    onChange={(e) =>
                      setQuickSanksiForm({ ...quickSanksiForm, batasMaksimal: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => {
                    setAssignSanksiTarget(null);
                    if (onClearPreSelectedPelanggaran) onClearPreSelectedPelanggaran();
                  }}
                  className="px-4 py-2 rounded-xl text-emerald-200 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#f3d266] text-[#02120a] font-bold cursor-pointer"
                >
                  Simpan &amp; Terbitkan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Surat Sanksi Otomatis */}
      <SuratSanksiModal
        sanksi={selectedSanksiForSurat}
        santriList={santriList}
        onClose={() => setSelectedSanksiForSurat(null)}
        onSanksiUpdated={(updated) => setSelectedSanksiForSurat(updated)}
      />
    </div>
  );
};
