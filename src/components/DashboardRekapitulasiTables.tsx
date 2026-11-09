import React, { useState, useMemo } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertOctagon, 
  DoorOpen, 
  Scale, 
  ShieldAlert, 
  X,
  FileSpreadsheet,
  Download,
  Info
} from 'lucide-react';
import { Perizinan, Pelanggaran, Sanksi, UserAccount } from '../types';

interface DashboardRekapitulasiTablesProps {
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  currentUser: UserAccount;
  onViewSuratIzin: (izin: Perizinan) => void;
}

export const DashboardRekapitulasiTables: React.FC<DashboardRekapitulasiTablesProps> = ({
  perizinanList,
  pelanggaranList,
  sanksiList,
  currentUser,
  onViewSuratIzin,
}) => {
  const [activeTableTab, setActiveTableTab] = useState<'perizinan' | 'pelanggaran' | 'both'>('both');

  // ==========================================
  // STATE & FILTERS: TABEL A (PERIZINAN)
  // ==========================================
  const [searchPerizinan, setSearchPerizinan] = useState('');
  const [filterStatusIzin, setFilterStatusIzin] = useState<string>('all');
  const [filterJenisIzin, setFilterJenisIzin] = useState<string>('all');
  const [filterKetertiban, setFilterKetertiban] = useState<'all' | 'tertib' | 'terlambat'>('all');
  const [filterBulanIzin, setFilterBulanIzin] = useState<string>('all');
  const [currentPageIzin, setCurrentPageIzin] = useState(1);
  const [itemsPerPageIzin, setItemsPerPageIzin] = useState(10);

  // ==========================================
  // STATE & FILTERS: TABEL B (PELANGGARAN)
  // ==========================================
  const [searchPelanggaran, setSearchPelanggaran] = useState('');
  const [filterKategoriPelanggaran, setFilterKategoriPelanggaran] = useState<string>('all');
  const [filterStatusHukuman, setFilterStatusHukuman] = useState<string>('all');
  const [filterBulanPelanggaran, setFilterBulanPelanggaran] = useState<string>('all');
  const [currentPagePelanggaran, setCurrentPagePelanggaran] = useState(1);
  const [itemsPerPagePelanggaran, setItemsPerPagePelanggaran] = useState(10);

  // Helper Sanksi Map by Pelanggaran ID
  const sanksiMap = useMemo(() => {
    const map = new Map<string, Sanksi>();
    sanksiList.forEach(s => {
      if (s.pelanggaranId) {
        map.set(s.pelanggaranId, s);
      }
    });
    return map;
  }, [sanksiList]);

  // Unique Months for Perizinan filter
  const monthsIzin = useMemo(() => {
    const set = new Set<string>();
    perizinanList.forEach(p => {
      const dateStr = p.tglKeluar || p.tglPengajuan;
      if (dateStr && dateStr.length >= 7) {
        set.add(dateStr.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [perizinanList]);

  // Unique Months for Pelanggaran filter
  const monthsPelanggaran = useMemo(() => {
    const set = new Set<string>();
    pelanggaranList.forEach(p => {
      if (p.tanggal && p.tanggal.length >= 7) {
        set.add(p.tanggal.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [pelanggaranList]);

  // ==========================================
  // FILTERING LOGIC: PERIZINAN
  // ==========================================
  const filteredPerizinan = useMemo(() => {
    return perizinanList.filter(izin => {
      // 1. Search (Nama, NIS, No Izin)
      if (searchPerizinan.trim()) {
        const query = searchPerizinan.toLowerCase();
        const matchNama = izin.santriNama?.toLowerCase().includes(query);
        const matchNis = izin.santriNis?.toLowerCase().includes(query);
        const matchNomor = izin.nomorIzin?.toLowerCase().includes(query);
        const matchAlasan = izin.alasan?.toLowerCase().includes(query);
        if (!matchNama && !matchNis && !matchNomor && !matchAlasan) return false;
      }

      // 2. Status Izin
      if (filterStatusIzin !== 'all' && izin.status !== filterStatusIzin) {
        return false;
      }

      // 3. Jenis Izin
      if (filterJenisIzin !== 'all' && izin.jenisIzin !== filterJenisIzin) {
        return false;
      }

      // 4. Status Ketertiban (Terlambat vs Tertib)
      const isLate = izin.status === 'Terlambat' || (izin.menitKeterlambatan && izin.menitKeterlambatan > 0);
      if (filterKetertiban === 'terlambat' && !isLate) return false;
      if (filterKetertiban === 'tertib' && isLate) return false;

      // 5. Bulan Filter
      if (filterBulanIzin !== 'all') {
        const dateStr = izin.tglKeluar || izin.tglPengajuan || '';
        if (!dateStr.startsWith(filterBulanIzin)) return false;
      }

      return true;
    });
  }, [perizinanList, searchPerizinan, filterStatusIzin, filterJenisIzin, filterKetertiban, filterBulanIzin]);

  // Paginated Perizinan
  const totalPagesIzin = Math.ceil(filteredPerizinan.length / itemsPerPageIzin) || 1;
  const paginatedPerizinan = useMemo(() => {
    const start = (currentPageIzin - 1) * itemsPerPageIzin;
    return filteredPerizinan.slice(start, start + itemsPerPageIzin);
  }, [filteredPerizinan, currentPageIzin, itemsPerPageIzin]);

  // ==========================================
  // FILTERING LOGIC: PELANGGARAN
  // ==========================================
  const filteredPelanggaran = useMemo(() => {
    return pelanggaranList.filter(pel => {
      const sanksi = sanksiMap.get(pel.id) || sanksiList.find(s => s.santriId === pel.santriId);

      // 1. Search
      if (searchPelanggaran.trim()) {
        const query = searchPelanggaran.toLowerCase();
        const matchNama = pel.santriNama?.toLowerCase().includes(query);
        const matchNis = pel.santriNis?.toLowerCase().includes(query);
        const matchJenis = pel.jenisPelanggaran?.toLowerCase().includes(query);
        const matchKronologi = pel.kronologi?.toLowerCase().includes(query);
        if (!matchNama && !matchNis && !matchJenis && !matchKronologi) return false;
      }

      // 2. Kategori Tingkat
      if (filterKategoriPelanggaran !== 'all' && pel.kategori !== filterKategoriPelanggaran) {
        return false;
      }

      // 3. Status Sanksi / Hukuman
      if (filterStatusHukuman !== 'all') {
        const statusHukuman = sanksi?.status || 'Sedang Berjalan';
        if (statusHukuman !== filterStatusHukuman) return false;
      }

      // 4. Bulan Filter
      if (filterBulanPelanggaran !== 'all') {
        if (!pel.tanggal.startsWith(filterBulanPelanggaran)) return false;
      }

      return true;
    });
  }, [pelanggaranList, sanksiMap, sanksiList, searchPelanggaran, filterKategoriPelanggaran, filterStatusHukuman, filterBulanPelanggaran]);

  // Paginated Pelanggaran
  const totalPagesPelanggaran = Math.ceil(filteredPelanggaran.length / itemsPerPagePelanggaran) || 1;
  const paginatedPelanggaran = useMemo(() => {
    const start = (currentPagePelanggaran - 1) * itemsPerPagePelanggaran;
    return filteredPelanggaran.slice(start, start + itemsPerPagePelanggaran);
  }, [filteredPelanggaran, currentPagePelanggaran, itemsPerPagePelanggaran]);

  // Format Helper for YYYY-MM
  const formatMonthLabel = (yyyyMm: string) => {
    if (!yyyyMm || yyyyMm === 'all') return 'Semua Bulan';
    const [y, m] = yyyyMm.split('-');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Table Section Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-950/80 border border-cyan-500/40 text-cyan-300">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight font-sans">
              Pusat Administrasi & Rekapitulasi Keamanan Santri
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Pemantauan terpusat real-time perizinan santri & buku induk pelanggaran
            </p>
          </div>
        </div>

        {/* Tab view selector: Both, Tabel A Only, Tabel B Only */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-xs font-mono self-start sm:self-auto">
          <button
            onClick={() => setActiveTableTab('both')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
              activeTableTab === 'both'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tampilkan Kedua Tabel
          </button>
          <button
            onClick={() => setActiveTableTab('perizinan')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1.5 ${
              activeTableTab === 'perizinan'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tabel A: Perizinan</span>
            <span className="px-1.5 py-0.2 rounded-md bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/40">{perizinanList.length}</span>
          </button>
          <button
            onClick={() => setActiveTableTab('pelanggaran')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1.5 ${
              activeTableTab === 'pelanggaran'
                ? 'bg-gradient-to-r from-red-600 to-amber-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tabel B: Pelanggaran</span>
            <span className="px-1.5 py-0.2 rounded-md bg-red-950 text-red-300 text-[10px] border border-red-500/40">{pelanggaranList.length}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TABEL A: TABEL REKAPITULASI PERIZINAN SANTRI
         ========================================================================= */}
      {(activeTableTab === 'both' || activeTableTab === 'perizinan') && (
        <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden">
          
          {/* Glowing Top Specular Line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent opacity-80" />

          {/* Table Header & Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase font-sans flex items-center gap-2">
                  <span>A. Tabel Rekapitulasi Perizinan Santri</span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {filteredPerizinan.length} Data
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Rekapitulasi keluar, kembali, otoritas pemroses & status ketertiban waktu
                </p>
              </div>
            </div>

            {/* Quick Filter Reset */}
            {(searchPerizinan || filterStatusIzin !== 'all' || filterJenisIzin !== 'all' || filterKetertiban !== 'all' || filterBulanIzin !== 'all') && (
              <button
                onClick={() => {
                  setSearchPerizinan('');
                  setFilterStatusIzin('all');
                  setFilterJenisIzin('all');
                  setFilterKetertiban('all');
                  setFilterBulanIzin('all');
                  setCurrentPageIzin(1);
                }}
                className="text-amber-400 hover:text-amber-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer self-start md:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filter Perizinan
              </button>
            )}
          </div>

          {/* Filters Bar: Search & Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchPerizinan}
                onChange={(e) => {
                  setSearchPerizinan(e.target.value);
                  setCurrentPageIzin(1);
                }}
                placeholder="Cari nama santri, NIS, no izin..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            {/* Status Izin Filter */}
            <div>
              <select
                value={filterStatusIzin}
                onChange={(e) => {
                  setFilterStatusIzin(e.target.value);
                  setCurrentPageIzin(1);
                }}
                className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="all">Semua Status Izin</option>
                <option value="Sedang Keluar">Sedang Keluar</option>
                <option value="Sudah Kembali">Sudah Kembali</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            {/* Filter Ketertiban (Tertib / Terlambat) */}
            <div>
              <select
                value={filterKetertiban}
                onChange={(e) => {
                  setFilterKetertiban(e.target.value as any);
                  setCurrentPageIzin(1);
                }}
                className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="all">Semua Ketertiban</option>
                <option value="tertib">✅ Tertib (Tepat Waktu)</option>
                <option value="terlambat">⚠️ Terlambat</option>
              </select>
            </div>

            {/* Filter Bulan */}
            <div>
              <select
                value={filterBulanIzin}
                onChange={(e) => {
                  setFilterBulanIzin(e.target.value);
                  setCurrentPageIzin(1);
                }}
                className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="all">Semua Bulan</option>
                {monthsIzin.map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 text-center w-12">No.</th>
                    <th className="p-3 whitespace-nowrap">Nama Santri</th>
                    <th className="p-3 whitespace-nowrap">Jenis Perizinan</th>
                    <th className="p-3 whitespace-nowrap">Tanggal Pengajuan</th>
                    <th className="p-3 whitespace-nowrap">Pengurus Pemroses</th>
                    <th className="p-3 whitespace-nowrap">Pengurus Penyetujui</th>
                    <th className="p-3 whitespace-nowrap">Status Perizinan</th>
                    <th className="p-3 whitespace-nowrap">Waktu Keluar & Kembali</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 text-center whitespace-nowrap">Surat Izin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {paginatedPerizinan.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500 font-sans">
                        <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-slate-400 font-mono">TIDAK ADA REKAMAN PERIZINAN YANG SESUAI FILTER</p>
                        <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPerizinan.map((izin, idx) => {
                      const rowNum = (currentPageIzin - 1) * itemsPerPageIzin + idx + 1;
                      const isLate = izin.status === 'Terlambat' || (izin.menitKeterlambatan && izin.menitKeterlambatan > 0);
                      
                      return (
                        <tr 
                          key={izin.id}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            isLate ? 'bg-red-950/15' : ''
                          }`}
                        >
                          {/* 1. Nomor */}
                          <td className="p-3 text-center font-bold text-slate-400">
                            {rowNum}
                          </td>

                          {/* 2. Nama Santri */}
                          <td className="p-3 whitespace-nowrap">
                            <strong className="text-white block font-sans text-xs">{izin.santriNama}</strong>
                            <span className="text-[10px] text-cyan-300 font-mono">
                              NIS: {izin.santriNis} · {izin.santriKelas} ({izin.santriGender === 'putra' ? 'Banin' : 'Banat'})
                            </span>
                          </td>

                          {/* 3. Jenis Perizinan */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-[11px]">
                              {izin.jenisIzin}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px] mt-0.5 font-sans">
                              {izin.tujuan || izin.alasan}
                            </span>
                          </td>

                          {/* 4. Tanggal Pengajuan */}
                          <td className="p-3 whitespace-nowrap text-slate-300">
                            <span className="font-semibold block">{izin.tglPengajuan || izin.tglKeluar}</span>
                            <span className="text-[10px] text-slate-500">{izin.nomorIzin}</span>
                          </td>

                          {/* 5. Pengurus yang Memproses */}
                          <td className="p-3 whitespace-nowrap text-amber-300 font-semibold text-[11px]">
                            {izin.petugasPencatat || izin.petugasKeluar || 'Petugas Keamanan Sektor'}
                          </td>

                          {/* 6. Pengurus yang Menyetujui */}
                          <td className="p-3 whitespace-nowrap text-emerald-300 font-semibold text-[11px]">
                            {izin.disetujuiOleh || (izin.riwayatPersetujuan && izin.riwayatPersetujuan[0]?.nama) || 'Otoritas Pusat'}
                          </td>

                          {/* 7. Status Perizinan */}
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                              izin.status === 'Sedang Keluar'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 glow-cyan'
                                : izin.status === 'Sudah Kembali'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : izin.status === 'Terlambat'
                                ? 'bg-red-950 text-red-300 border-red-500/60 glow-red animate-pulse'
                                : izin.status === 'Disetujui'
                                ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                                : izin.status === 'Ditolak'
                                ? 'bg-slate-900 text-slate-400 border-slate-700'
                                : 'bg-amber-950 text-amber-300 border-amber-500/40'
                            }`}>
                              {izin.status}
                            </span>
                          </td>

                          {/* 8. Waktu Keluar dan Kembali */}
                          <td className="p-3 whitespace-nowrap text-[11px]">
                            <div className="text-slate-300">
                              <span className="text-slate-500 text-[10px]">Keluar: </span>
                              <span className="text-white font-semibold">{izin.actualKeluar || `${izin.tglKeluar} ${izin.jamKeluar}`}</span>
                            </div>
                            <div className="text-slate-300 mt-0.5">
                              <span className="text-slate-500 text-[10px]">Kembali: </span>
                              <span className={isLate ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                {izin.actualKembali || `${izin.tglKembali} ${izin.jamKembali}`}
                              </span>
                            </div>
                          </td>

                          {/* 9. Status (Terlambat / Tertib) */}
                          <td className="p-3 whitespace-nowrap">
                            {isLate ? (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-500/60 flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3 text-red-400 animate-pulse" />
                                <span>TERLAMBAT {izin.menitKeterlambatan ? `(${izin.menitKeterlambatan}m)` : ''}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>TERTIB</span>
                              </span>
                            )}
                          </td>

                          {/* 10. Aksi Surat Izin */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => onViewSuratIzin(izin)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Surat Izin Digital"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span>Menampilkan {filteredPerizinan.length > 0 ? (currentPageIzin - 1) * itemsPerPageIzin + 1 : 0} - {Math.min(currentPageIzin * itemsPerPageIzin, filteredPerizinan.length)} dari {filteredPerizinan.length} data</span>
                <span className="text-slate-600">|</span>
                <select
                  value={itemsPerPageIzin}
                  onChange={(e) => {
                    setItemsPerPageIzin(Number(e.target.value));
                    setCurrentPageIzin(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-300"
                >
                  <option value={5}>5 per hal</option>
                  <option value={10}>10 per hal</option>
                  <option value={20}>20 per hal</option>
                </select>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  disabled={currentPageIzin <= 1}
                  onClick={() => setCurrentPageIzin(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-bold text-white bg-slate-950 border border-slate-800 rounded-lg">
                  {currentPageIzin} / {totalPagesIzin}
                </span>
                <button
                  disabled={currentPageIzin >= totalPagesIzin}
                  onClick={() => setCurrentPageIzin(prev => Math.min(prev + 1, totalPagesIzin))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TABEL B: TABEL REKAPITULASI PELANGGARAN SANTRI
         ========================================================================= */}
      {(activeTableTab === 'both' || activeTableTab === 'pelanggaran') && (
        <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden">
          
          {/* Glowing Top Specular Line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-red-500 via-amber-500 to-transparent opacity-80" />

          {/* Table Header & Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase font-sans flex items-center gap-2">
                  <span>B. Tabel Rekapitulasi Pelanggaran Santri</span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-red-950 text-red-300 border border-red-500/30">
                    {filteredPelanggaran.length} Kasus
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Buku induk ketertiban, catatan kronologi insiden & pemantauan status eksekusi takzir
                </p>
              </div>
            </div>

            {/* Quick Filter Reset */}
            {(searchPelanggaran || filterKategoriPelanggaran !== 'all' || filterStatusHukuman !== 'all' || filterBulanPelanggaran !== 'all') && (
              <button
                onClick={() => {
                  setSearchPelanggaran('');
                  setFilterKategoriPelanggaran('all');
                  setFilterStatusHukuman('all');
                  setFilterBulanPelanggaran('all');
                  setCurrentPagePelanggaran(1);
                }}
                className="text-amber-400 hover:text-amber-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer self-start md:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filter Pelanggaran
              </button>
            )}
          </div>

          {/* Filters Bar: Search & Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchPelanggaran}
                onChange={(e) => {
                  setSearchPelanggaran(e.target.value);
                  setCurrentPagePelanggaran(1);
                }}
                placeholder="Cari nama santri, NIS, jenis pelanggaran..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400 font-sans"
              />
            </div>

            {/* Kategori Pelanggaran Filter */}
            <div>
              <select
                value={filterKategoriPelanggaran}
                onChange={(e) => {
                  setFilterKategoriPelanggaran(e.target.value);
                  setCurrentPagePelanggaran(1);
                }}
                className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-400 font-mono"
              >
                <option value="all">Semua Tingkat Pelanggaran</option>
                <option value="Ringan">Ringan (1-15 Poin)</option>
                <option value="Sedang">Sedang (16-30 Poin)</option>
                <option value="Berat">Berat (≥31 Poin)</option>
              </select>
            </div>

            {/* Status Pelaksanaan Hukuman */}
            <div>
              <select
                value={filterStatusHukuman}
                onChange={(e) => {
                  setFilterStatusHukuman(e.target.value);
                  setCurrentPagePelanggaran(1);
                }}
                className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-400 font-mono"
              >
                <option value="all">Semua Status Hukuman</option>
                <option value="Selesai">✅ Selesai</option>
                <option value="Sedang Berjalan">⏳ Sedang Berjalan</option>
                <option value="Belum Dikerjakan">⚠️ Belum Dikerjakan</option>
              </select>
            </div>

            {/* Filter Bulan */}
            <div>
              <select
                value={filterBulanPelanggaran}
                onChange={(e) => {
                  setFilterBulanPelanggaran(e.target.value);
                  setCurrentPagePelanggaran(1);
                }}
                className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-400 font-mono"
              >
                <option value="all">Semua Bulan</option>
                {monthsPelanggaran.map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 text-center w-12">No.</th>
                    <th className="p-3 whitespace-nowrap">Nama Santri</th>
                    <th className="p-3 whitespace-nowrap">Jenis Pelanggaran</th>
                    <th className="p-3 whitespace-nowrap">Tanggal & Waktu</th>
                    <th className="p-3 min-w-[200px]">Keterangan Pelanggaran</th>
                    <th className="p-3 min-w-[180px]">Jenis Hukuman / Takzir</th>
                    <th className="p-3 whitespace-nowrap">Pengurus Pencatat</th>
                    <th className="p-3 whitespace-nowrap">Pengurus Penetap</th>
                    <th className="p-3 whitespace-nowrap text-center">Status Pelaksanaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {paginatedPelanggaran.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-sans">
                        <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-slate-400 font-mono">TIDAK ADA CATATAN PELANGGARAN YANG SESUAI FILTER</p>
                        <p className="text-xs text-slate-500 mt-1">Gunakan filter lain atau ubah kata kunci pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPelanggaran.map((pel, idx) => {
                      const rowNum = (currentPagePelanggaran - 1) * itemsPerPagePelanggaran + idx + 1;
                      const sanksi = sanksiMap.get(pel.id) || sanksiList.find(s => s.santriId === pel.santriId);
                      const statusHukuman = sanksi?.status || 'Sedang Berjalan';

                      return (
                        <tr 
                          key={pel.id}
                          className="hover:bg-slate-900/60 transition-colors"
                        >
                          {/* 1. Nomor */}
                          <td className="p-3 text-center font-bold text-slate-400">
                            {rowNum}
                          </td>

                          {/* 2. Nama Santri */}
                          <td className="p-3 whitespace-nowrap">
                            <strong className="text-white block font-sans text-xs">{pel.santriNama}</strong>
                            <span className="text-[10px] text-cyan-300 font-mono">
                              NIS: {pel.santriNis} · {pel.santriGender === 'putra' ? 'Banin' : 'Banat'}
                            </span>
                          </td>

                          {/* 3. Jenis Pelanggaran */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-white font-bold block">{pel.jenisPelanggaran}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                pel.kategori === 'Berat'
                                  ? 'bg-red-950 text-red-300 border border-red-500/50'
                                  : pel.kategori === 'Sedang'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                              }`}>
                                {pel.kategori}
                              </span>
                              <span className="text-[10px] text-red-400 font-bold">
                                +{pel.poin} Poin
                              </span>
                            </div>
                          </td>

                          {/* 4. Tanggal Kejadian */}
                          <td className="p-3 whitespace-nowrap text-slate-300">
                            <span className="font-semibold block">{pel.tanggal}</span>
                            <span className="text-[10px] text-amber-400">{pel.waktu || '14:30'} WIB</span>
                          </td>

                          {/* 5. Keterangan Pelanggaran */}
                          <td className="p-3">
                            <p className="text-slate-300 text-xs font-sans leading-relaxed line-clamp-2">
                              {pel.kronologi}
                            </p>
                            {pel.lokasi && (
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Lokasi: {pel.lokasi}
                              </span>
                            )}
                          </td>

                          {/* 6. Jenis Hukuman atau Takzir */}
                          <td className="p-3">
                            <span className="text-amber-300 font-bold block text-xs font-sans">
                              {sanksi?.bentukSanksi || 'Pembinaan Adab & Khidmah Mandiri'}
                            </span>
                            {sanksi?.ustadzPembina && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Pembina: {sanksi.ustadzPembina}
                              </span>
                            )}
                          </td>

                          {/* 7. Pengurus yang Mencatat */}
                          <td className="p-3 whitespace-nowrap text-slate-300 font-semibold text-[11px]">
                            {pel.namaPetugasPelapor || 'Pengurus Piket'}
                          </td>

                          {/* 8. Pengurus yang Menetapkan Hukuman */}
                          <td className="p-3 whitespace-nowrap text-emerald-300 font-semibold text-[11px]">
                            {sanksi?.petugasPenetap || pel.namaPetugasPelapor || 'Ketua Keamanan'}
                          </td>

                          {/* 9. Status Pelaksanaan Hukuman */}
                          <td className="p-3 whitespace-nowrap text-center">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                              statusHukuman === 'Selesai'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                                : statusHukuman === 'Sedang Berjalan'
                                ? 'bg-amber-950 text-amber-300 border-amber-500/50 glow-gold'
                                : 'bg-red-950 text-red-300 border-red-500/60'
                            }`}>
                              {statusHukuman === 'Selesai' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                              {statusHukuman === 'Sedang Berjalan' && <Clock className="w-3 h-3 text-amber-400 animate-pulse" />}
                              {statusHukuman === 'Belum Dikerjakan' && <AlertOctagon className="w-3 h-3 text-red-400" />}
                              <span>{statusHukuman}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span>Menampilkan {filteredPelanggaran.length > 0 ? (currentPagePelanggaran - 1) * itemsPerPagePelanggaran + 1 : 0} - {Math.min(currentPagePelanggaran * itemsPerPagePelanggaran, filteredPelanggaran.length)} dari {filteredPelanggaran.length} data</span>
                <span className="text-slate-600">|</span>
                <select
                  value={itemsPerPagePelanggaran}
                  onChange={(e) => {
                    setItemsPerPagePelanggaran(Number(e.target.value));
                    setCurrentPagePelanggaran(1);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-300"
                >
                  <option value={5}>5 per hal</option>
                  <option value={10}>10 per hal</option>
                  <option value={20}>20 per hal</option>
                </select>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  disabled={currentPagePelanggaran <= 1}
                  onClick={() => setCurrentPagePelanggaran(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-bold text-white bg-slate-950 border border-slate-800 rounded-lg">
                  {currentPagePelanggaran} / {totalPagesPelanggaran}
                </span>
                <button
                  disabled={currentPagePelanggaran >= totalPagesPelanggaran}
                  onClick={() => setCurrentPagePelanggaran(prev => Math.min(prev + 1, totalPagesPelanggaran))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
