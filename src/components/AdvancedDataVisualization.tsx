import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Activity,
  Clock,
  DoorOpen,
} from 'lucide-react';
import { Perizinan, Pelanggaran, Santri, Sanksi, UserAccount } from '../types';
import {
  BarChart3D,
  Extruded3DValue,
  KpiStatCard3D,
  LineChart3D,
  PieChart3D,
} from './Charts3D';

interface AdvancedDataVisualizationProps {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  currentUser: UserAccount;
}

// ==========================================
// COUNT-UP ANIMATED NUMBER COMPONENT
// ==========================================
export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}> = ({ value, duration = 800, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = isNaN(value) ? 0 : value;

    if (startVal === endVal) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const current = startVal + (endVal - startVal) * easeOutQuad;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString('id-ID');

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

// ==========================================
// 1. PANEL GRAFIK 3D PERIZINAN SANTRI
// ==========================================
export const GrafikPerizinanSantri: React.FC<{
  perizinanList: Perizinan[];
  selectedKelas: string;
  periodFilter: 'today' | '7d' | '30d' | 'all';
}> = ({ perizinanList, selectedKelas, periodFilter }) => {
  const [viewMode, setViewMode] = useState<'status' | 'kelas' | 'tren'>('status');

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return perizinanList.filter((p) => {
      if (selectedKelas !== 'all' && p.santriKelas !== selectedKelas) return false;

      if (periodFilter === 'today') {
        const pDate = p.tglKeluar || p.tglPengajuan || '';
        return pDate.startsWith(todayStr);
      } else if (periodFilter === '7d') {
        const cutoff = new Date(now.getTime() - 7 * 86400000);
        const pDate = new Date(p.tglKeluar || p.tglPengajuan || '');
        return !isNaN(pDate.getTime()) && pDate >= cutoff;
      } else if (periodFilter === '30d') {
        const cutoff = new Date(now.getTime() - 30 * 86400000);
        const pDate = new Date(p.tglKeluar || p.tglPengajuan || '');
        return !isNaN(pDate.getTime()) && pDate >= cutoff;
      }
      return true;
    });
  }, [perizinanList, selectedKelas, periodFilter]);

  const izinAktifCount = filteredData.filter(
    (p) => (p.status === 'Sedang Keluar' || p.status === 'Disetujui') && !p.actualKembali
  ).length;
  const izinSelesaiCount = filteredData.filter(
    (p) => p.status === 'Sudah Kembali' || Boolean(p.actualKembali)
  ).length;
  const izinTerlambatCount = filteredData.filter(
    (p) => p.status === 'Terlambat' || (p.menitKeterlambatan && p.menitKeterlambatan > 0)
  ).length;

  const statusBarData = useMemo(
    () => [
      { label: 'Izin Aktif', jumlah: izinAktifCount, color: '#10b981' },
      { label: 'Izin Selesai', jumlah: izinSelesaiCount, color: '#d4af37' },
      { label: 'Terlambat', jumlah: izinTerlambatCount, color: '#f43f5e' },
    ],
    [izinAktifCount, izinSelesaiCount, izinTerlambatCount]
  );

  const classBarData = useMemo(() => {
    const classMap: Record<string, number> = {};
    filteredData.forEach((p) => {
      const cls = p.santriKelas || 'Lainnya';
      classMap[cls] = (classMap[cls] || 0) + 1;
    });
    const list = Object.entries(classMap)
      .map(([kelas, jumlah], idx) => ({
        kelas,
        jumlah,
        color: idx % 2 === 0 ? '#10b981' : '#34d399',
      }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 6);
    if (list.length === 0) {
      list.push({ kelas: 'Nol Data', jumlah: 0, color: '#10b981' });
    }
    return list;
  }, [filteredData]);

  const trendLineData = useMemo(() => {
    const days = 7;
    const timeline: { hari: string; jumlah: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const count = filteredData.filter(
        (p) => p.tglKeluar === iso || p.tglPengajuan?.startsWith(iso)
      ).length;
      timeline.push({ hari: dayLabel, jumlah: count });
    }
    return timeline;
  }, [filteredData]);

  return (
    <div className="kpi-glass-3d rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-inner">
            <DoorOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                3D ANALYTICS A
              </span>
              <span className="text-[10px] font-mono text-emerald-200/75">· REAL-TIME DATABASE</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik 3D Perizinan Santri
            </h3>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-[#02100a]/90 p-1 rounded-xl border border-emerald-800/80 text-[10px] font-mono shrink-0">
          <button
            onClick={() => setViewMode('status')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'status'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setViewMode('kelas')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'kelas'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Per Kelas
          </button>
          <button
            onClick={() => setViewMode('tren')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'tren'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Tren 3D
          </button>
        </div>
      </div>

      {/* 3D KPI Chips */}
      <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
        <div className="p-2.5 rounded-2xl bg-[#03160f]/90 border border-emerald-500/30 shadow-inner">
          <span className="text-[10px] text-emerald-200/75 block uppercase">Izin Aktif</span>
          <Extruded3DValue value={izinAktifCount} tone="emerald" className="text-lg sm:text-xl mt-0.5" />
        </div>
        <div className="p-2.5 rounded-2xl bg-[#03160f]/90 border border-[#d4af37]/35 shadow-inner">
          <span className="text-[10px] text-emerald-200/75 block uppercase">Izin Selesai</span>
          <Extruded3DValue value={izinSelesaiCount} tone="gold" className="text-lg sm:text-xl mt-0.5" />
        </div>
        <div className="p-2.5 rounded-2xl bg-[#03160f]/90 border border-rose-500/35 shadow-inner">
          <span className="text-[10px] text-emerald-200/75 block uppercase">Terlambat</span>
          <Extruded3DValue value={izinTerlambatCount} tone="rose" className="text-lg sm:text-xl mt-0.5" />
        </div>
      </div>

      {/* 3D Chart Stage */}
      <div className="w-full bg-[#02100a]/85 bg-security-grid rounded-2xl border border-emerald-700/45 p-3 shadow-inner">
        {viewMode === 'status' && (
          <BarChart3D
            data={statusBarData}
            xKey="label"
            height={224}
            unit=" izin"
            series={[{ key: 'jumlah', label: 'Jumlah Perizinan', color: '#10b981' }]}
          />
        )}
        {viewMode === 'kelas' && (
          <BarChart3D
            data={classBarData}
            xKey="kelas"
            height={224}
            unit=" izin"
            series={[{ key: 'jumlah', label: 'Izin per Kelas', color: '#10b981' }]}
          />
        )}
        {viewMode === 'tren' && (
          <LineChart3D
            data={trendLineData}
            xKey="hari"
            height={224}
            tooltipUnit=" izin"
            subtitle="Tren Perizinan 7 Hari Terakhir"
            series={[
              {
                key: 'jumlah',
                label: 'Volume Izin Harian',
                color: '#10b981',
                accentColor: '#f3d266',
              },
            ]}
          />
        )}
      </div>

      {/* Footer Summary */}
      <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] font-mono text-emerald-200/75">
        <span>
          Total Terdata: <strong className="text-white tabular-nums">{filteredData.length} Izin</strong>
        </span>
        <span className="text-emerald-300 font-bold">TERHUBUNG KE RADAR &amp; GERBANG</span>
      </div>
    </div>
  );
};

// ==========================================
// 2. PANEL GRAFIK 3D PELANGGARAN SANTRI
// ==========================================
export const GrafikPelanggaranSantri: React.FC<{
  pelanggaranList: Pelanggaran[];
  selectedKelas: string;
  selectedKategori: string;
  periodFilter: 'today' | '7d' | '30d' | 'all';
}> = ({ pelanggaranList, selectedKategori, periodFilter }) => {
  const [viewMode, setViewMode] = useState<'periode' | 'kategori' | 'kelas'>('periode');

  const nowMs = Date.now();
  const todayStr = new Date(nowMs).toISOString().split('T')[0];

  const countToday = useMemo(() => {
    return pelanggaranList.filter((p) => p.tanggal === todayStr).length;
  }, [pelanggaranList, todayStr]);

  const countWeekly = useMemo(() => {
    const cutoff = nowMs - 7 * 86400000;
    return pelanggaranList.filter((p) => {
      const t = new Date(p.tanggal).getTime();
      return !isNaN(t) && t >= cutoff;
    }).length;
  }, [pelanggaranList, nowMs]);

  const countMonthly = useMemo(() => {
    const cutoff = nowMs - 30 * 86400000;
    return pelanggaranList.filter((p) => {
      const t = new Date(p.tanggal).getTime();
      return !isNaN(t) && t >= cutoff;
    }).length;
  }, [pelanggaranList, nowMs]);

  const countPrevWeekly = useMemo(() => {
    const startPrev = nowMs - 14 * 86400000;
    const endPrev = nowMs - 7 * 86400000;
    return pelanggaranList.filter((p) => {
      const t = new Date(p.tanggal).getTime();
      return !isNaN(t) && t >= startPrev && t < endPrev;
    }).length;
  }, [pelanggaranList, nowMs]);

  const trendWeeklyDiff = countWeekly - countPrevWeekly;
  const isTrendUp = trendWeeklyDiff > 0;

  const filteredData = useMemo(() => {
    return pelanggaranList.filter((p) => {
      if (selectedKategori !== 'all' && p.kategori !== selectedKategori) return false;

      if (periodFilter === 'today') {
        return p.tanggal === todayStr;
      } else if (periodFilter === '7d') {
        const cutoff = nowMs - 7 * 86400000;
        const t = new Date(p.tanggal).getTime();
        return !isNaN(t) && t >= cutoff;
      } else if (periodFilter === '30d') {
        const cutoff = nowMs - 30 * 86400000;
        const t = new Date(p.tanggal).getTime();
        return !isNaN(t) && t >= cutoff;
      }
      return true;
    });
  }, [pelanggaranList, selectedKategori, periodFilter, todayStr, nowMs]);

  const periodBarData = useMemo(
    () => [
      { label: 'Hari Ini', jumlah: countToday, color: '#f59e0b' },
      { label: '7 Hari', jumlah: countWeekly, color: '#fb923c' },
      { label: '30 Hari', jumlah: countMonthly, color: '#f43f5e' },
    ],
    [countToday, countWeekly, countMonthly]
  );

  const kategoriBarData = useMemo(
    () => [
      {
        label: 'Ringan',
        jumlah: filteredData.filter((p) => p.kategori === 'Ringan').length,
        color: '#10b981',
      },
      {
        label: 'Sedang',
        jumlah: filteredData.filter((p) => p.kategori === 'Sedang').length,
        color: '#f59e0b',
      },
      {
        label: 'Berat',
        jumlah: filteredData.filter((p) => p.kategori === 'Berat').length,
        color: '#f43f5e',
      },
    ],
    [filteredData]
  );

  const topKasusBarData = useMemo(() => {
    const jenisMap: Record<string, number> = {};
    filteredData.forEach((p) => {
      const key = p.jenisPelanggaran || 'Lain-lain';
      jenisMap[key] = (jenisMap[key] || 0) + 1;
    });
    const list = Object.entries(jenisMap)
      .map(([jenis, jumlah]) => ({ jenis, jumlah, color: '#f43f5e' }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
    if (list.length === 0) {
      list.push({ jenis: 'Nol Kasus', jumlah: 0, color: '#10b981' });
    }
    return list;
  }, [filteredData]);

  return (
    <div className="kpi-glass-3d rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400 shadow-inner">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                3D ANALYTICS B
              </span>
              <span className="text-[10px] font-mono text-emerald-200/75">· INSIDEN &amp; TATA TERTIB</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik 3D Pelanggaran Santri
            </h3>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#02100a]/90 p-1 rounded-xl border border-emerald-800/80 text-[10px] font-mono shrink-0">
          <button
            onClick={() => setViewMode('periode')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'periode'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Periode
          </button>
          <button
            onClick={() => setViewMode('kategori')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'kategori'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Tingkat
          </button>
          <button
            onClick={() => setViewMode('kelas')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'kelas'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Kasus Top
          </button>
        </div>
      </div>

      {/* 3D KPI Chips & Trend Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
        <div className="p-2 rounded-2xl bg-[#03160f]/90 border border-amber-500/30 shadow-inner">
          <span className="text-[9px] text-emerald-200/75 block uppercase">Hari Ini</span>
          <Extruded3DValue value={countToday} tone="gold" className="text-lg mt-0.5" />
        </div>
        <div className="p-2 rounded-2xl bg-[#03160f]/90 border border-orange-500/30 shadow-inner">
          <span className="text-[9px] text-emerald-200/75 block uppercase">7 Hari</span>
          <Extruded3DValue value={countWeekly} tone="gold" className="text-lg mt-0.5" />
        </div>
        <div className="p-2 rounded-2xl bg-[#03160f]/90 border border-rose-500/35 shadow-inner">
          <span className="text-[9px] text-emerald-200/75 block uppercase">30 Hari</span>
          <Extruded3DValue value={countMonthly} tone="rose" className="text-lg mt-0.5" />
        </div>
        <div className="p-2 rounded-2xl bg-[#03160f]/90 border border-emerald-800/80 flex flex-col items-center justify-center shadow-inner">
          <span className="text-[9px] text-emerald-200/75 uppercase mb-1">Tren 7H</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold tabular-nums ${
              isTrendUp ? 'badge-3d-down text-rose-100' : 'badge-3d-up text-emerald-100'
            }`}
          >
            {isTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendWeeklyDiff >= 0 ? `+${trendWeeklyDiff}` : trendWeeklyDiff}
          </span>
        </div>
      </div>

      {/* 3D Chart Stage */}
      <div className="w-full bg-[#02100a]/85 bg-security-grid rounded-2xl border border-emerald-700/45 p-3 shadow-inner">
        {viewMode === 'periode' && (
          <BarChart3D
            data={periodBarData}
            xKey="label"
            height={224}
            unit=" kasus"
            series={[{ key: 'jumlah', label: 'Insiden Pelanggaran', color: '#f59e0b' }]}
          />
        )}
        {viewMode === 'kategori' && (
          <BarChart3D
            data={kategoriBarData}
            xKey="label"
            height={224}
            unit=" kasus"
            series={[{ key: 'jumlah', label: 'Kategori Qanun', color: '#f43f5e' }]}
          />
        )}
        {viewMode === 'kelas' && (
          <BarChart3D
            data={topKasusBarData}
            xKey="jenis"
            height={224}
            unit=" kasus"
            series={[{ key: 'jumlah', label: 'Kasus Terbanyak', color: '#f43f5e' }]}
          />
        )}
      </div>

      {/* Footer Summary */}
      <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] font-mono text-emerald-200/75">
        <span>
          Total Kasus: <strong className="text-rose-400 tabular-nums">{filteredData.length} Kasus</strong>
        </span>
        <span className="text-amber-300 font-bold">TERKORELASI KEDISIPLINAN REAL-TIME</span>
      </div>
    </div>
  );
};

// ==========================================
// 3. PANEL GRAFIK 3D SANKSI EDUKATIF SANTRI
// ==========================================
export const GrafikSanksiSantri: React.FC<{
  sanksiList: Sanksi[];
  pelanggaranList: Pelanggaran[];
}> = ({ sanksiList }) => {
  const [viewMode, setViewMode] = useState<'status' | 'jenis'>('status');

  const sanksiAktif = sanksiList.filter(
    (s) => s.status === 'Sedang Berjalan' || s.status === 'Belum Dikerjakan'
  );
  const sanksiSelesai = sanksiList.filter((s) => s.status === 'Selesai');
  const totalSanksi = sanksiList.length;
  const tuntasPercent = totalSanksi > 0 ? Math.round((sanksiSelesai.length / totalSanksi) * 100) : 100;

  const pieSlices = useMemo(() => {
    if (totalSanksi === 0) {
      return [{ name: 'Nihil Sanksi (Tertib)', value: 1, color: '#10b981', persen: 100 }];
    }
    const raw = [
      {
        name: 'Sanksi Tuntas',
        value: sanksiSelesai.length,
        color: '#10b981',
        persen: Math.round((sanksiSelesai.length / totalSanksi) * 100),
      },
      {
        name: 'Sedang Dibina',
        value: sanksiAktif.length,
        color: '#f59e0b',
        persen: Math.round((sanksiAktif.length / totalSanksi) * 100),
      },
    ].filter((item) => item.value > 0);
    return raw.length > 0 ? raw : [{ name: 'Sanksi Tuntas', value: 1, color: '#10b981', persen: 100 }];
  }, [sanksiAktif.length, sanksiSelesai.length, totalSanksi]);

  const bentukBarData = useMemo(() => {
    const bentukMap: Record<string, number> = {};
    sanksiList.forEach((s) => {
      const b = s.bentukSanksi || 'Lain-lain';
      bentukMap[b] = (bentukMap[b] || 0) + 1;
    });
    const list = Object.entries(bentukMap)
      .map(([bentuk, jumlah], idx) => ({
        bentuk,
        jumlah,
        color: idx % 2 === 0 ? '#a855f7' : '#d4af37',
      }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
    if (list.length === 0) {
      list.push({ bentuk: 'Belum Ada Sanksi', jumlah: 0, color: '#10b981' });
    }
    return list;
  }, [sanksiList]);

  return (
    <div className="kpi-glass-3d rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 shadow-inner">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                3D ANALYTICS C
              </span>
              <span className="text-[10px] font-mono text-emerald-200/75">· PEMBINAAN &amp; TAKZIR</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik 3D Pie &amp; Takzir Edukatif
            </h3>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-[#02100a]/90 p-1 rounded-xl border border-emerald-800/80 text-[10px] font-mono shrink-0">
          <button
            onClick={() => setViewMode('status')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'status'
                ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            3D Pie Status
          </button>
          <button
            onClick={() => setViewMode('jenis')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              viewMode === 'jenis'
                ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Bentuk Sanksi
          </button>
        </div>
      </div>

      {/* 3D KPI Chips */}
      <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
        <div className="p-2.5 rounded-2xl bg-[#03160f]/90 border border-amber-500/30 shadow-inner">
          <span className="text-[10px] text-emerald-200/75 block uppercase">Sanksi Aktif</span>
          <Extruded3DValue value={sanksiAktif.length} tone="gold" className="text-lg sm:text-xl mt-0.5" />
        </div>
        <div className="p-2.5 rounded-2xl bg-[#03160f]/90 border border-emerald-500/30 shadow-inner">
          <span className="text-[10px] text-emerald-200/75 block uppercase">Sanksi Tuntas</span>
          <Extruded3DValue value={sanksiSelesai.length} tone="emerald" className="text-lg sm:text-xl mt-0.5" />
        </div>
        <div className="p-2.5 rounded-2xl bg-[#03160f]/90 border border-purple-500/35 shadow-inner">
          <span className="text-[10px] text-emerald-200/75 block uppercase">Total Berkas</span>
          <Extruded3DValue value={totalSanksi} tone="silver" className="text-lg sm:text-xl mt-0.5" />
        </div>
      </div>

      {/* 3D Chart Stage */}
      <div className="w-full bg-[#02100a]/85 bg-security-grid rounded-2xl border border-emerald-700/45 p-3 shadow-inner flex items-center justify-center min-h-[248px]">
        {viewMode === 'status' ? (
          <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
            <PieChart3D
              data={pieSlices}
              size={172}
              innerRadiusRatio={0.54}
              depth={15}
              centerValue={tuntasPercent}
              centerSuffix="%"
              centerLabel="TAKZIR TUNTAS"
              centerTone={tuntasPercent >= 80 ? 'emerald' : 'gold'}
              unit=" santri"
            />
            <div className="space-y-2 w-full sm:w-auto min-w-[165px]">
              {pieSlices.map((slice) => (
                <div
                  key={slice.name}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#041d13]/90 border border-emerald-800/70 text-xs font-mono"
                >
                  <span className="flex items-center gap-2 text-emerald-100">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: slice.color,
                        boxShadow: `0 0 8px ${slice.color}`,
                      }}
                    />
                    <span className="truncate">{slice.name}</span>
                  </span>
                  <span className="font-extrabold text-[#f3d266] tabular-nums">{slice.persen}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <BarChart3D
              data={bentukBarData}
              xKey="bentuk"
              height={224}
              unit=" santri"
              series={[{ key: 'jumlah', label: 'Penerima Sanksi', color: '#a855f7' }]}
            />
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] font-mono text-emerald-200/75">
        <span>
          Dibina: <strong className="text-amber-300 tabular-nums">{sanksiAktif.length} Santri</strong>
        </span>
        <span className="text-emerald-400 font-bold">REKAPITULASI TAKZIR AKTUAL</span>
      </div>
    </div>
  );
};

// ==========================================
// 4. PANEL GRAFIK 3D KOMPARASI LAPORAN BULANAN
// ==========================================
export const GrafikKomparasiBulanan: React.FC<{
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
}> = ({ perizinanList, pelanggaranList, sanksiList }) => {
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);

  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const data: { label: string; perizinan: number; pelanggaran: number; sanksiSelesai: number }[] = [];

    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${monthNames[m]} '${String(y).slice(-2)}`;

      const countIzin = perizinanList.filter((p) =>
        (p.tglKeluar || p.tglPengajuan || '').startsWith(monthStr)
      ).length;
      const countPel = pelanggaranList.filter((p) => (p.tanggal || '').startsWith(monthStr)).length;
      const countSanksi = sanksiList.filter(
        (s) =>
          (s.tanggalAktualSelesai || s.tanggalPenetapan || '').startsWith(monthStr) &&
          s.status === 'Selesai'
      ).length;

      data.push({ label, perizinan: countIzin, pelanggaran: countPel, sanksiSelesai: countSanksi });
    }
    return data;
  }, [perizinanList, pelanggaranList, sanksiList, rangeMonths]);

  return (
    <div className="kpi-glass-3d rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 shadow-inner">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                3D ANALYTICS D
              </span>
              <span className="text-[10px] font-mono text-emerald-200/75">· KOMPARASI MULTI-BULAN</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik 3D Komparasi Laporan Bulanan
            </h3>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center bg-[#02100a]/90 p-1 rounded-xl border border-emerald-800/80 text-[10px] font-mono shrink-0">
          <button
            onClick={() => setRangeMonths(6)}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              rangeMonths === 6
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f3d266] text-[#02120a] font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            6 Bulan
          </button>
          <button
            onClick={() => setRangeMonths(12)}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              rangeMonths === 12
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f3d266] text-[#02120a] font-bold shadow'
                : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            12 Bulan
          </button>
        </div>
      </div>

      {/* 3D Isometric Grouped Pillars Stage */}
      <div className="w-full bg-[#02100a]/85 bg-security-grid rounded-2xl border border-emerald-700/45 p-3 shadow-inner">
        <BarChart3D
          data={monthlyData}
          xKey="label"
          height={250}
          unit=" data"
          series={[
            { key: 'perizinan', label: 'Perizinan', color: '#10b981' },
            { key: 'pelanggaran', label: 'Pelanggaran', color: '#f43f5e' },
            { key: 'sanksiSelesai', label: 'Takzir Tuntas', color: '#d4af37' },
          ]}
        />
      </div>

      {/* Footer Summary */}
      <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] font-mono text-emerald-200/75">
        <span>
          Periode: <strong className="text-amber-300">{rangeMonths} Bulan Terakhir</strong>
        </span>
        <span className="text-emerald-300 font-bold">REKAPITULASI DUA ARAH REAL-TIME</span>
      </div>
    </div>
  );
};

// ==========================================
// MAIN WRAPPER: ADVANCED DATA VISUALIZATION
// ==========================================
export const AdvancedDataVisualization: React.FC<AdvancedDataVisualizationProps> = ({
  santriList,
  perizinanList,
  pelanggaranList,
  sanksiList,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');

  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    santriList.forEach((s) => s.kelas && set.add(s.kelas));
    perizinanList.forEach((p) => p.santriKelas && set.add(p.santriKelas));
    return Array.from(set).sort();
  }, [santriList, perizinanList]);

  const totalSantri = santriList.length;
  const totalIzin = perizinanList.length;
  const totalIzinAktif = perizinanList.filter(
    (p) => (p.status === 'Sedang Keluar' || p.status === 'Disetujui') && !p.actualKembali
  ).length;
  const totalIzinSelesai = perizinanList.filter(
    (p) => p.status === 'Sudah Kembali' || Boolean(p.actualKembali)
  ).length;
  const totalTerlambat = perizinanList.filter(
    (p) => (p.status === 'Terlambat' || (p.menitKeterlambatan && p.menitKeterlambatan > 0)) && !p.actualKembali
  ).length;

  const totalPelanggaran = pelanggaranList.length;
  const totalPoinPelanggaran = pelanggaranList.reduce((acc, curr) => acc + (curr.poin || 0), 0);

  const totalSanksiAktif = sanksiList.filter(
    (s) => s.status === 'Sedang Berjalan' || s.status === 'Belum Dikerjakan'
  ).length;
  const totalSanksiSelesai = sanksiList.filter((s) => s.status === 'Selesai').length;
  const totalSanksi = sanksiList.length;

  const izinSelesaiPct = totalIzin > 0 ? Number(((totalIzinSelesai / totalIzin) * 100).toFixed(1)) : 100;
  const pelanggaranBeratCount = pelanggaranList.filter((p) => p.kategori === 'Berat').length;
  const pelanggaranBeratPct =
    totalPelanggaran > 0 ? -Number(((pelanggaranBeratCount / totalPelanggaran) * 100).toFixed(1)) : 0;
  const sanksiTuntasPct = totalSanksi > 0 ? Number(((totalSanksiSelesai / totalSanksi) * 100).toFixed(1)) : 100;
  const terlambatPct =
    totalSantri > 0 ? -Number(((totalTerlambat / totalSantri) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Master Filter & Live 3D KPI Counter Bar */}
      <div className="kpi-glass-3d rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-800/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                3D INTEGRATED SECURITY ANALYTICS
              </span>
              <span className="text-xs font-mono text-emerald-200/75">· 4 Modul 3D Terhubung</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
              Pusat Analitik 3D Keamanan, Perizinan &amp; Kedisiplinan Santri
            </h2>
          </div>

          {/* Global Interactive Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#02100a]/90 p-1 rounded-xl border border-emerald-800/80 text-[10px] font-mono">
              <button
                onClick={() => setPeriodFilter('today')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                  periodFilter === 'today' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-200/75 hover:text-white'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setPeriodFilter('7d')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                  periodFilter === '7d' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-200/75 hover:text-white'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setPeriodFilter('30d')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                  periodFilter === '30d' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-200/75 hover:text-white'
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                  periodFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-200/75 hover:text-white'
                }`}
              >
                Semua
              </button>
            </div>

            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="bg-[#02100a]/90 border border-emerald-800 text-amber-300 text-[11px] font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Semua Kelas</option>
              {distinctClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="bg-[#02100a]/90 border border-emerald-800 text-emerald-300 text-[11px] font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>
        </div>

        {/* 4 Animated 3D KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          <KpiStatCard3D
            label="Total Perizinan"
            value={totalIzin}
            tone="emerald"
            icon={<DoorOpen className="w-4 h-4 text-emerald-300" />}
            trendPercent={izinSelesaiPct}
            subtitle={`${totalIzinAktif} Aktif · ${totalIzinSelesai} Selesai`}
          />
          <KpiStatCard3D
            label="Pelanggaran Terdata"
            value={totalPelanggaran}
            tone="rose"
            icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
            trendPercent={pelanggaranBeratPct}
            subtitle={`${totalPoinPelanggaran} Total Poin · ${pelanggaranBeratCount} Berat`}
          />
          <KpiStatCard3D
            label="Sanksi Edukatif Aktif"
            value={totalSanksiAktif}
            tone="gold"
            icon={<ShieldCheck className="w-4 h-4 text-[#f3d266]" />}
            trendPercent={sanksiTuntasPct}
            subtitle={`${totalSanksiAktif} Dibina · ${totalSanksiSelesai} Tuntas`}
          />
          <KpiStatCard3D
            label="Santri Terlambat"
            value={totalTerlambat}
            tone="rose"
            icon={<Clock className="w-4 h-4 text-amber-300" />}
            trendPercent={terlambatPct}
            subtitle={`${totalTerlambat} Lewat Jadwal · / ${totalSantri} Santri`}
          />
        </div>
      </div>

      {/* 2. THE 4 SYNCHRONIZED 3D CHARTS IN RESPONSIVE GRID (grid-cols-1 md:grid-cols-2 gap-6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GrafikPerizinanSantri
          perizinanList={perizinanList}
          selectedKelas={selectedKelas}
          periodFilter={periodFilter}
        />

        <GrafikPelanggaranSantri
          pelanggaranList={pelanggaranList}
          selectedKelas={selectedKelas}
          selectedKategori={selectedKategori}
          periodFilter={periodFilter}
        />

        <GrafikSanksiSantri
          sanksiList={sanksiList}
          pelanggaranList={pelanggaranList}
        />

        <GrafikKomparasiBulanan
          perizinanList={perizinanList}
          pelanggaranList={pelanggaranList}
          sanksiList={sanksiList}
        />
      </div>
    </div>
  );
};
