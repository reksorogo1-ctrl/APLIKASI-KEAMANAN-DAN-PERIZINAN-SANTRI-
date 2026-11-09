import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DoorOpen,
  Sparkles,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { Santri, Perizinan, Pelanggaran, Sanksi, LogAktivitas } from '../types';

interface LaporanStatistikProps {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  logsList: LogAktivitas[];
}

export const LaporanStatistik: React.FC<LaporanStatistikProps> = ({
  santriList,
  perizinanList,
  pelanggaranList,
  sanksiList,
  logsList,
}) => {
  const [reportType, setReportType] = useState<'perizinan' | 'gerbang' | 'pelanggaran' | 'sanksi' | 'aktivitas'>('perizinan');
  const [startDate, setStartDate] = useState<string>('2026-11-01');
  const [endDate, setEndDate] = useState<string>('2026-11-30');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');

  // Filtering Perizinan
  const filteredPerizinan = useMemo(() => {
    return perizinanList.filter(i => {
      if (selectedKelas !== 'all' && i.santriKelas !== selectedKelas) return false;
      if (searchName.trim()) {
        const q = searchName.toLowerCase();
        if (!i.santriNama.toLowerCase().includes(q) && !i.santriNis.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [perizinanList, selectedKelas, searchName]);

  // Filtering Pelanggaran
  const filteredPelanggaran = useMemo(() => {
    return pelanggaranList.filter(p => {
      if (searchName.trim()) {
        const q = searchName.toLowerCase();
        if (!p.santriNama.toLowerCase().includes(q) && !p.santriNis.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [pelanggaranList, searchName]);

  // Summary Metrics
  const totalIzin = perizinanList.length;
  const totalKeluarGerbang = perizinanList.filter(i => i.actualKeluar).length;
  const totalTerlambat = perizinanList.filter(i => i.status === 'Terlambat' || (i.menitKeterlambatan && i.menitKeterlambatan > 0)).length;
  const totalPelanggaran = pelanggaranList.length;
  const totalPoinPelanggaran = pelanggaranList.reduce((acc, curr) => acc + curr.poin, 0);
  const totalSanksiTuntas = sanksiList.filter(s => s.status === 'Selesai').length;

  // Export CSV based on currently selected report
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `laporan_${reportType}_${startDate}_sd_${endDate}.csv`;

    if (reportType === 'perizinan' || reportType === 'gerbang') {
      headers = ['Nomor Izin', 'NIS', 'Nama Santri', 'Kelas', 'Kamar', 'Jenis Izin', 'Tujuan', 'Tgl Keluar', 'Jam Keluar', 'Tgl Kembali', 'Jam Kembali', 'Status', 'Keterlambatan (menit)'];
      rows = filteredPerizinan.map(i => [
        `"${i.nomorIzin}"`,
        `"${i.santriNis}"`,
        `"${i.santriNama}"`,
        `"${i.santriKelas}"`,
        `"${i.santriKamar}"`,
        `"${i.jenisIzin}"`,
        `"${i.tujuan}"`,
        i.tglKeluar,
        i.jamKeluar,
        i.tglKembali,
        i.jamKembali,
        i.status,
        i.menitKeterlambatan || 0
      ]);
    } else if (reportType === 'pelanggaran') {
      headers = ['Kode Kasus', 'NIS', 'Nama Santri', 'Tanggal', 'Waktu', 'Jenis Pelanggaran', 'Kategori', 'Poin', 'Lokasi', 'Pelapor'];
      rows = filteredPelanggaran.map(p => [
        `"${p.kodePelanggaran}"`,
        `"${p.santriNis}"`,
        `"${p.santriNama}"`,
        p.tanggal,
        p.waktu,
        `"${p.jenisPelanggaran}"`,
        p.kategori,
        p.poin,
        `"${p.lokasi}"`,
        `"${p.namaPetugasPelapor}"`
      ]);
    } else if (reportType === 'sanksi') {
      headers = ['Kode Sanksi', 'NIS', 'Nama Santri', 'Jenis Pelanggaran', 'Bentuk Sanksi Edukatif', 'Tgl Penetapan', 'Target Selesai', 'Ustadz Pembina', 'Status'];
      rows = sanksiList.map(s => [
        `"${s.kodeSanksi}"`,
        `"${s.santriNis}"`,
        `"${s.santriNama}"`,
        `"${s.jenisPelanggaran}"`,
        `"${s.bentukSanksi}"`,
        s.tanggalPenetapan,
        s.tanggalTargetSelesai,
        `"${s.ustadzPembina}"`,
        s.status
      ]);
    } else {
      headers = ['Waktu', 'Pengguna', 'Peran', 'Aksi', 'Detail'];
      rows = logsList.map(l => [
        l.waktu,
        `"${l.user}"`,
        `"${l.role}"`,
        `"${l.aksi}"`,
        `"${l.detail}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 glow-cyan">
                Intelligence & Executive Forensics
              </span>
              <span className="text-[10px] font-mono text-slate-500">· Comprehensive Reports</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <BarChart3 className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              Laporan Eksekutif & Statistik Kedisiplinan
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Rekapitulasi periodik perizinan, mutasi portal gerbang, evaluasi keterlambatan, dan riwayat takzir edukatif
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="tactile-interactive inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl transition-all cursor-pointer shadow-lg hover-rainbow-edge"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ekspor CSV / Excel</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all shadow-xl cursor-pointer border border-amber-300/60 hover-rainbow-edge"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Cetak Rekap Resmi</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Strip - 3D Floating Glass Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metallic-glass-card rounded-3xl p-5 border border-slate-800/80 hover-rainbow-edge card-3d-floating shadow-xl">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Total Perizinan Santri</span>
          <p className="text-3xl font-black font-mono text-white mt-1.5 tabular-nums">{totalIzin}</p>
          <p className="text-[10px] text-cyan-300 font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Tercatat di sistem database
          </p>
        </div>

        <div className="metallic-glass-card rounded-3xl p-5 border border-slate-800/80 hover-rainbow-edge card-3d-floating shadow-xl">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Kasus Keterlambatan</span>
          <p className="text-3xl font-black font-mono text-rose-400 mt-1.5 tabular-nums glow-red">{totalTerlambat}</p>
          <p className="text-[10px] text-rose-400 font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            Melewati batas jam kepulangan
          </p>
        </div>

        <div className="metallic-glass-card rounded-3xl p-5 border border-slate-800/80 hover-rainbow-edge card-3d-floating shadow-xl">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Total Akumulasi Poin</span>
          <p className="text-3xl font-black font-mono text-amber-300 mt-1.5 tabular-nums glow-gold">{totalPoinPelanggaran}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            Dari {totalPelanggaran} insiden pelanggaran
          </p>
        </div>

        <div className="metallic-glass-card rounded-3xl p-5 border border-slate-800/80 hover-rainbow-edge card-3d-floating shadow-xl">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Takzir Edukatif Tuntas</span>
          <p className="text-3xl font-black font-mono text-emerald-400 mt-1.5 tabular-nums glow-cyan">{totalSanksiTuntas}</p>
          <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Hafalan & khidmah selesai
          </p>
        </div>
      </div>

      {/* Report Type Selector Tabs - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs shadow-lg font-mono">
        {[
          { key: 'perizinan', label: 'Rekap Perizinan Santri' },
          { key: 'gerbang', label: 'Rekap Keluar-Masuk Gerbang' },
          { key: 'pelanggaran', label: 'Rekap Pelanggaran & Poin' },
          { key: 'sanksi', label: 'Rekap Pembinaan & Sanksi' },
          { key: 'aktivitas', label: 'Log Aktivitas Pengurus' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key as any)}
            className={`tactile-interactive px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              reportType === tab.key
                ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Parameters - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono shadow-xl hover-rainbow-edge">
        <div>
          <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1.5">Rentang Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400 shadow-inner"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1.5">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400 shadow-inner"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1.5">Filter Kelas / Marhalah</label>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 shadow-inner"
          >
            <option value="all">Semua Kelas</option>
            <option value="1 Wustho (Tsanawiyah)">1 Wustho</option>
            <option value="2 Wustho (Tsanawiyah)">2 Wustho</option>
            <option value="3 Wustho (Tsanawiyah)">3 Wustho</option>
            <option value="1 Ulya (Aliyah)">1 Ulya</option>
            <option value="2 Ulya (Aliyah)">2 Ulya</option>
            <option value="3 Ulya (Aliyah)">3 Ulya</option>
            <option value="Tahfidz Al-Qur'an">Tahfidz</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1.5">Cari Nama Santri / NIS</label>
          <input
            type="text"
            placeholder="Ketik nama atau NIS..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 shadow-inner"
          />
        </div>
      </div>

      {/* Printable Report Header for Official Documentation - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4 hover-rainbow-edge">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight font-sans">
              {reportType === 'perizinan' && 'Rekapitulasi Administrasi Perizinan Santri'}
              {reportType === 'gerbang' && 'Laporan Keluar-Masuk Pos Gerbang Utama'}
              {reportType === 'pelanggaran' && 'Laporan Pelanggaran & Akumulasi Poin Disiplin'}
              {reportType === 'sanksi' && 'Rekapitulasi Pelaksanaan Sanksi Edukatif & Pembinaan'}
              {reportType === 'aktivitas' && 'Buku Catatan Log Audit Aktivitas Pengurus Keamanan'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Pondok Pesantren Salaf Al-Maliki · Periode: {startDate} s/d {endDate}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 glow-gold">
            KAMTIB AL-MALIKI INTEL
          </span>
        </div>

        {/* Dynamic Table according to reportType */}
        <div className="overflow-x-auto">
          {reportType === 'perizinan' && (
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">No. Izin</th>
                  <th className="px-4 py-3.5">Nama Santri</th>
                  <th className="px-4 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Jenis Izin</th>
                  <th className="px-4 py-3.5">Tujuan</th>
                  <th className="px-4 py-3.5">Jadwal Izin</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {filteredPerizinan.map((i) => (
                  <tr key={i.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-amber-400 font-bold">{i.nomorIzin}</td>
                    <td className="px-4 py-3.5 font-bold text-white font-sans">{i.santriNama}</td>
                    <td className="px-4 py-3.5 text-slate-400">{i.santriKelas}</td>
                    <td className="px-4 py-3.5 text-amber-300">{i.jenisIzin}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-sans">{i.tujuan}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">{i.tglKeluar} - {i.tglKembali}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400">{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'gerbang' && (
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Santri</th>
                  <th className="px-4 py-3.5">Waktu Keluar (Check-Out)</th>
                  <th className="px-4 py-3.5">Waktu Tiba (Check-In)</th>
                  <th className="px-4 py-3.5">Petugas Keluar / Masuk</th>
                  <th className="px-4 py-3.5">Keterlambatan</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {filteredPerizinan.map((i) => (
                  <tr key={i.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3.5 font-bold text-white font-sans">{i.santriNama} ({i.santriNis})</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">{i.actualKeluar || '-'}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">{i.actualKembali || 'Belum Masuk'}</td>
                    <td className="px-4 py-3.5 text-slate-400">{i.petugasKeluar || '-'} / {i.petugasKembali || '-'}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-400">
                      {i.menitKeterlambatan ? `${i.menitKeterlambatan} Menit` : '0 Menit (Tepat Waktu)'}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400">{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'pelanggaran' && (
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Kode Kasus</th>
                  <th className="px-4 py-3.5">Santri</th>
                  <th className="px-4 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Jenis Pelanggaran</th>
                  <th className="px-4 py-3.5">Tingkat</th>
                  <th className="px-4 py-3.5">Poin</th>
                  <th className="px-4 py-3.5">Pelapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {filteredPelanggaran.map((p) => (
                  <tr key={p.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3.5 font-mono text-amber-400 font-bold">{p.kodePelanggaran}</td>
                    <td className="px-4 py-3.5 font-bold text-white font-sans">{p.santriNama}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">{p.tanggal} {p.waktu}</td>
                    <td className="px-4 py-3.5 text-slate-200 font-sans">{p.jenisPelanggaran}</td>
                    <td className="px-4 py-3.5 font-bold text-amber-300">{p.kategori}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-400">+{p.poin}</td>
                    <td className="px-4 py-3.5 text-slate-400 font-sans">{p.namaPetugasPelapor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sanksi' && (
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Kode</th>
                  <th className="px-4 py-3.5">Santri</th>
                  <th className="px-4 py-3.5">Pelanggaran</th>
                  <th className="px-4 py-3.5">Bentuk Sanksi Edukatif</th>
                  <th className="px-4 py-3.5">Target Selesai</th>
                  <th className="px-4 py-3.5">Pembina</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {sanksiList.map((s) => (
                  <tr key={s.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3.5 font-mono text-amber-400 font-bold">{s.kodeSanksi}</td>
                    <td className="px-4 py-3.5 font-bold text-white font-sans">{s.santriNama}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-sans">{s.jenisPelanggaran}</td>
                    <td className="px-4 py-3.5 text-amber-200 font-sans">{s.bentukSanksi}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">{s.tanggalTargetSelesai}</td>
                    <td className="px-4 py-3.5 text-slate-400 font-sans">{s.ustadzPembina}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'aktivitas' && (
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Petugas / Pengguna</th>
                  <th className="px-4 py-3.5">Peran</th>
                  <th className="px-4 py-3.5">Tindakan / Aksi</th>
                  <th className="px-4 py-3.5">Detail Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                {logsList.map((l) => (
                  <tr key={l.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-4 py-3.5 font-mono text-amber-400 font-bold">{l.waktu}</td>
                    <td className="px-4 py-3.5 font-bold text-white font-sans">{l.user}</td>
                    <td className="px-4 py-3.5 text-slate-400">{l.role}</td>
                    <td className="px-4 py-3.5 text-amber-300 font-semibold">{l.aksi}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-sans">{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
