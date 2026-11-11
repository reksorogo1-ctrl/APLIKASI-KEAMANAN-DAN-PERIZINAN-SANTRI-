import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ShieldCheck, 
  Calendar, 
  AlertTriangle, 
  Activity, 
  PieChart, 
  ArrowUpRight, 
  Layers, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  DoorOpen,
  Filter,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { Perizinan, Pelanggaran, Santri, Sanksi, UserAccount } from '../types';

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

  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString('id-ID');

  return <span>{prefix}{formatted}{suffix}</span>;
};

// ==========================================
// 1. PANEL GRAFIK PERIZINAN SANTRI
// ==========================================
export const GrafikPerizinanSantri: React.FC<{
  perizinanList: Perizinan[];
  selectedKelas: string;
  periodFilter: 'today' | '7d' | '30d' | 'all';
}> = ({ perizinanList, selectedKelas, periodFilter }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'status' | 'kelas' | 'tren'>('status');

  // Filter based on selectedKelas and period
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return perizinanList.filter(p => {
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

  // Exact metrics
  const izinAktifCount = filteredData.filter(p => (p.status === 'Sedang Keluar' || p.status === 'Disetujui') && !p.actualKembali).length;
  const izinSelesaiCount = filteredData.filter(p => p.status === 'Sudah Kembali' || Boolean(p.actualKembali)).length;
  const izinTerlambatCount = filteredData.filter(p => p.status === 'Terlambat' || (p.menitKeterlambatan && p.menitKeterlambatan > 0)).length;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 240;
    const margin = { top: 20, right: 25, bottom: 35, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    if (viewMode === 'status') {
      // Bar Chart: Aktif vs Selesai vs Terlambat
      const statusBars = [
        { label: 'Izin Aktif', count: izinAktifCount, color: '#06b6d4' },
        { label: 'Izin Selesai', count: izinSelesaiCount, color: '#10b981' },
        { label: 'Izin Terlambat', count: izinTerlambatCount, color: '#ef4444' },
      ];

      const maxVal = Math.max(3, d3.max(statusBars, d => d.count) || 3);
      const xScale = d3.scaleBand()
        .domain(statusBars.map(d => d.label))
        .range([0, innerWidth])
        .padding(0.35);

      const yScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([innerHeight, 0])
        .nice();

      // Horizontal grid
      g.append('g')
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-opacity', 0.5)
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

      statusBars.forEach(d => {
        const x = xScale(d.label) || 0;
        const barW = xScale.bandwidth();
        const barH = innerHeight - yScale(d.count);
        const y = yScale(d.count);

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barW)
          .attr('height', Math.max(2, barH))
          .attr('rx', 6)
          .attr('fill', d.color)
          .attr('opacity', 0.9);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', y - 6)
          .attr('text-anchor', 'middle')
          .attr('font-size', '13px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', d.color)
          .text(`${d.count}`);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', innerHeight + 18)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#94a3b8')
          .text(d.label.toUpperCase());
      });

    } else if (viewMode === 'kelas') {
      // Comparison by Class
      const classMap: { [cls: string]: number } = {};
      filteredData.forEach(p => {
        const cls = p.santriKelas || 'Lainnya';
        classMap[cls] = (classMap[cls] || 0) + 1;
      });

      const classData = Object.entries(classMap)
        .map(([kelas, count]) => ({ kelas, count }))
        .sort((a, b) => b.count - a.count);

      if (classData.length === 0) {
        classData.push({ kelas: 'Tidak Ada Data', count: 0 });
      }

      const xScale = d3.scaleBand()
        .domain(classData.map(d => d.kelas))
        .range([0, innerWidth])
        .padding(0.3);

      const maxVal = Math.max(2, d3.max(classData, d => d.count) || 2);
      const yScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([innerHeight, 0])
        .nice();

      classData.forEach(d => {
        const x = xScale(d.kelas) || 0;
        const barW = xScale.bandwidth();
        const barH = innerHeight - yScale(d.count);
        const y = yScale(d.count);

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barW)
          .attr('height', Math.max(2, barH))
          .attr('rx', 5)
          .attr('fill', '#38bdf8')
          .attr('opacity', 0.85);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', y - 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', '#38bdf8')
          .text(`${d.count}`);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', innerHeight + 16)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('fill', '#94a3b8')
          .text(d.kelas);
      });

    } else {
      // Trend Line over past 7 days
      const days = 7;
      const timeline: { label: string; count: number }[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const iso = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const count = filteredData.filter(p => (p.tglKeluar === iso || p.tglPengajuan?.startsWith(iso))).length;
        timeline.push({ label: dayLabel, count });
      }

      const xScale = d3.scalePoint()
        .domain(timeline.map(d => d.label))
        .range([0, innerWidth])
        .padding(0.2);

      const maxVal = Math.max(3, d3.max(timeline, d => d.count) || 3);
      const yScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([innerHeight, 0])
        .nice();

      const line = d3.line<{ label: string; count: number }>()
        .x(d => xScale(d.label) || 0)
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(timeline)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2.5)
        .attr('d', line);

      timeline.forEach(d => {
        const cx = xScale(d.label) || 0;
        const cy = yScale(d.count);

        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 4)
          .attr('fill', '#090d16')
          .attr('stroke', '#22d3ee')
          .attr('stroke-width', 2);

        g.append('text')
          .attr('x', cx)
          .attr('y', cy - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', '#22d3ee')
          .text(`${d.count}`);

        g.append('text')
          .attr('x', cx)
          .attr('y', innerHeight + 16)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .attr('fill', '#94a3b8')
          .text(d.label);
      });
    }

  }, [filteredData, viewMode, izinAktifCount, izinSelesaiCount, izinTerlambatCount]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-transparent opacity-80" />
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <DoorOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">MODUL A</span>
              <span className="text-[10px] font-mono text-slate-400">· REAL-TIME DATABASE</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Perizinan Santri
            </h3>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
          <button
            onClick={() => setViewMode('status')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'status' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Status
          </button>
          <button
            onClick={() => setViewMode('kelas')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'kelas' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Per Kelas
          </button>
          <button
            onClick={() => setViewMode('tren')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'tren' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Tren
          </button>
        </div>
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
          <span className="text-[10px] text-slate-400 block">Izin Aktif:</span>
          <span className="font-bold text-cyan-300 text-sm">{izinAktifCount}</span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          <span className="text-[10px] text-slate-400 block">Izin Selesai:</span>
          <span className="font-bold text-emerald-400 text-sm">{izinSelesaiCount}</span>
        </div>
        <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30">
          <span className="text-[10px] text-slate-400 block">Terlambat:</span>
          <span className="font-bold text-red-400 text-sm">{izinTerlambatCount}</span>
        </div>
      </div>

      {/* D3 Render Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[240px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Summary */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Total Terdata: <strong className="text-white">{filteredData.length} Izin</strong></span>
        <span className="text-cyan-300 font-bold">TERHUBUNG KE RADAR & GERBANG</span>
      </div>
    </div>
  );
};

// ==========================================
// 2. PANEL GRAFIK PELANGGARAN SANTRI
// ==========================================
export const GrafikPelanggaranSantri: React.FC<{
  pelanggaranList: Pelanggaran[];
  selectedKelas: string;
  selectedKategori: string;
  periodFilter: 'today' | '7d' | '30d' | 'all';
}> = ({ pelanggaranList, selectedKelas, selectedKategori, periodFilter }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'periode' | 'kategori' | 'kelas'>('periode');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Specific counts for Pelanggaran Hari Ini, Mingguan, Bulanan
  const countToday = useMemo(() => {
    return pelanggaranList.filter(p => p.tanggal === todayStr).length;
  }, [pelanggaranList, todayStr]);

  const countWeekly = useMemo(() => {
    const cutoff = new Date(now.getTime() - 7 * 86400000);
    return pelanggaranList.filter(p => {
      const d = new Date(p.tanggal);
      return !isNaN(d.getTime()) && d >= cutoff;
    }).length;
  }, [pelanggaranList, now]);

  const countMonthly = useMemo(() => {
    const cutoff = new Date(now.getTime() - 30 * 86400000);
    return pelanggaranList.filter(p => {
      const d = new Date(p.tanggal);
      return !isNaN(d.getTime()) && d >= cutoff;
    }).length;
  }, [pelanggaranList, now]);

  // Previous 7-day period for trend calculation
  const countPrevWeekly = useMemo(() => {
    const startPrev = new Date(now.getTime() - 14 * 86400000);
    const endPrev = new Date(now.getTime() - 7 * 86400000);
    return pelanggaranList.filter(p => {
      const d = new Date(p.tanggal);
      return !isNaN(d.getTime()) && d >= startPrev && d < endPrev;
    }).length;
  }, [pelanggaranList, now]);

  const trendWeeklyDiff = countWeekly - countPrevWeekly;
  const isTrendUp = trendWeeklyDiff > 0;

  // Filtered dataset for charts
  const filteredData = useMemo(() => {
    return pelanggaranList.filter(p => {
      if (selectedKategori !== 'all' && p.kategori !== selectedKategori) return false;

      if (periodFilter === 'today') {
        return p.tanggal === todayStr;
      } else if (periodFilter === '7d') {
        const cutoff = new Date(now.getTime() - 7 * 86400000);
        const d = new Date(p.tanggal);
        return !isNaN(d.getTime()) && d >= cutoff;
      } else if (periodFilter === '30d') {
        const cutoff = new Date(now.getTime() - 30 * 86400000);
        const d = new Date(p.tanggal);
        return !isNaN(d.getTime()) && d >= cutoff;
      }
      return true;
    });
  }, [pelanggaranList, selectedKategori, periodFilter, todayStr, now]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 240;
    const margin = { top: 20, right: 25, bottom: 35, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    if (viewMode === 'periode') {
      // Comparison: Hari Ini vs Mingguan vs Bulanan
      const periodBars = [
        { label: 'Hari Ini', count: countToday, color: '#f59e0b' },
        { label: 'Mingguan (7H)', count: countWeekly, color: '#f97316' },
        { label: 'Bulanan (30H)', count: countMonthly, color: '#ef4444' },
      ];

      const maxVal = Math.max(3, d3.max(periodBars, d => d.count) || 3);
      const xScale = d3.scaleBand()
        .domain(periodBars.map(d => d.label))
        .range([0, innerWidth])
        .padding(0.35);

      const yScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([innerHeight, 0])
        .nice();

      periodBars.forEach(d => {
        const x = xScale(d.label) || 0;
        const barW = xScale.bandwidth();
        const barH = innerHeight - yScale(d.count);
        const y = yScale(d.count);

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barW)
          .attr('height', Math.max(2, barH))
          .attr('rx', 6)
          .attr('fill', d.color)
          .attr('opacity', 0.9);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', y - 6)
          .attr('text-anchor', 'middle')
          .attr('font-size', '13px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', d.color)
          .text(`${d.count}`);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', innerHeight + 18)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#94a3b8')
          .text(d.label);
      });

    } else if (viewMode === 'kategori') {
      // Tingkat Pelanggaran: Ringan vs Sedang vs Berat
      const katLevels = [
        { label: 'Ringan', count: filteredData.filter(p => p.kategori === 'Ringan').length, color: '#06b6d4' },
        { label: 'Sedang', count: filteredData.filter(p => p.kategori === 'Sedang').length, color: '#f59e0b' },
        { label: 'Berat', count: filteredData.filter(p => p.kategori === 'Berat').length, color: '#ef4444' }
      ];

      const maxVal = Math.max(3, d3.max(katLevels, d => d.count) || 3);
      const xScale = d3.scaleBand()
        .domain(katLevels.map(d => d.label))
        .range([0, innerWidth])
        .padding(0.35);

      const yScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([innerHeight, 0])
        .nice();

      katLevels.forEach(d => {
        const x = xScale(d.label) || 0;
        const barW = xScale.bandwidth();
        const barH = innerHeight - yScale(d.count);
        const y = yScale(d.count);

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barW)
          .attr('height', Math.max(2, barH))
          .attr('rx', 6)
          .attr('fill', d.color)
          .attr('opacity', 0.9);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', y - 6)
          .attr('text-anchor', 'middle')
          .attr('font-size', '13px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', d.color)
          .text(`${d.count}`);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', innerHeight + 18)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#94a3b8')
          .text(d.label.toUpperCase());
      });

    } else {
      // Jenis Pelanggaran Horizontal Top Bars
      const jenisMap: { [j: string]: number } = {};
      filteredData.forEach(p => {
        const key = p.jenisPelanggaran || 'Lain-lain';
        jenisMap[key] = (jenisMap[key] || 0) + 1;
      });

      const jenisData = Object.entries(jenisMap)
        .map(([jenis, count]) => ({ jenis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (jenisData.length === 0) {
        jenisData.push({ jenis: 'Nol Pelanggaran', count: 0 });
      }

      const yScale = d3.scaleBand()
        .domain(jenisData.map(d => d.jenis))
        .range([0, innerHeight])
        .padding(0.28);

      const maxVal = Math.max(2, d3.max(jenisData, d => d.count) || 2);
      const xScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([0, innerWidth]);

      jenisData.forEach(d => {
        const y = yScale(d.jenis) || 0;
        const barW = xScale(d.count);
        const barH = yScale.bandwidth();

        g.append('rect')
          .attr('x', 0)
          .attr('y', y)
          .attr('width', innerWidth)
          .attr('height', barH)
          .attr('rx', 6)
          .attr('fill', '#090d16')
          .attr('stroke', '#1e293b');

        g.append('rect')
          .attr('x', 0)
          .attr('y', y)
          .attr('width', Math.max(3, barW))
          .attr('height', barH)
          .attr('rx', 6)
          .attr('fill', '#ef4444')
          .attr('opacity', 0.85);

        g.append('text')
          .attr('x', 8)
          .attr('y', y + barH / 2 + 4)
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('fill', '#ffffff')
          .text(d.jenis.length > 20 ? d.jenis.substring(0, 20) + '...' : d.jenis);

        g.append('text')
          .attr('x', innerWidth - 8)
          .attr('y', y + barH / 2 + 4)
          .attr('text-anchor', 'end')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', '#ef4444')
          .text(`${d.count} Kasus`);
      });
    }

  }, [filteredData, viewMode, countToday, countWeekly, countMonthly]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-red-500 via-amber-500 to-transparent opacity-80" />
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">MODUL B</span>
              <span className="text-[10px] font-mono text-slate-400">· INSIDEN & TATA TERTIB</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Pelanggaran Santri
            </h3>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
          <button
            onClick={() => setViewMode('periode')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'periode' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Periode
          </button>
          <button
            onClick={() => setViewMode('kategori')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'kategori' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Tingkat
          </button>
          <button
            onClick={() => setViewMode('kelas')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'kelas' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Kasus Top
          </button>
        </div>
      </div>

      {/* KPI Chips & Trend Indicator */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
          <span className="text-[9px] text-slate-400 block">Hari Ini:</span>
          <span className="font-bold text-amber-300 text-sm">{countToday}</span>
        </div>
        <div className="p-2 rounded-xl bg-orange-950/30 border border-orange-500/30">
          <span className="text-[9px] text-slate-400 block">7 Hari:</span>
          <span className="font-bold text-orange-400 text-sm">{countWeekly}</span>
        </div>
        <div className="p-2 rounded-xl bg-red-950/30 border border-red-500/30">
          <span className="text-[9px] text-slate-400 block">30 Hari:</span>
          <span className="font-bold text-red-400 text-sm">{countMonthly}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col items-center justify-center">
          <span className="text-[9px] text-slate-400">Tren 7H:</span>
          <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isTrendUp ? 'text-red-400' : 'text-emerald-400'}`}>
            {isTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendWeeklyDiff >= 0 ? `+${trendWeeklyDiff}` : trendWeeklyDiff}
          </span>
        </div>
      </div>

      {/* D3 Render Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[240px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Summary */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Total Kasus: <strong className="text-red-400">{filteredData.length} Kasus</strong></span>
        <span className="text-amber-300 font-bold">TERKORELASI KEDISIPLINAN REAL-TIME</span>
      </div>
    </div>
  );
};

// ==========================================
// 3. PANEL GRAFIK SANKSI EDUKATIF SANTRI
// ==========================================
export const GrafikSanksiSantri: React.FC<{
  sanksiList: Sanksi[];
  pelanggaranList: Pelanggaran[];
}> = ({ sanksiList, pelanggaranList }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'status' | 'jenis'>('status');

  const sanksiAktif = sanksiList.filter(s => s.status === 'Sedang Berjalan' || s.status === 'Belum Dikerjakan');
  const sanksiSelesai = sanksiList.filter(s => s.status === 'Selesai');
  const totalSanksi = sanksiList.length;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 240;

    if (viewMode === 'status') {
      // Donut Chart: Aktif vs Selesai
      const radius = Math.min(width, height) / 2 - 15;
      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'overflow-visible');

      const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

      const pieData = [
        { label: 'Sanksi Selesai', count: sanksiSelesai.length, color: '#10b981' },
        { label: 'Sedang Menjalani', count: sanksiAktif.length, color: '#f59e0b' }
      ];

      const pie = d3.pie<{ label: string; count: number; color: string }>()
        .value(d => Math.max(d.count, totalSanksi === 0 ? 0.001 : 0))
        .sort(null)
        .padAngle(0.04);

      const arc = d3.arc<d3.PieArcDatum<{ label: string; count: number; color: string }>>()
        .innerRadius(radius * 0.65)
        .outerRadius(radius * 0.95)
        .cornerRadius(6);

      const arcs = g.selectAll('.arc')
        .data(pie(pieData))
        .enter()
        .append('g')
        .attr('class', 'arc');

      arcs.append('path')
        .attr('d', arc as any)
        .attr('fill', d => d.data.color)
        .attr('stroke', '#090d16')
        .attr('stroke-width', 2);

      const tuntasPercent = totalSanksi > 0 ? (sanksiSelesai.length / totalSanksi) * 100 : 100;

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.15em')
        .attr('font-size', '24px')
        .attr('font-weight', '900')
        .attr('font-family', 'monospace')
        .attr('fill', '#10b981')
        .text(`${tuntasPercent.toFixed(0)}%`);

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.4em')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#94a3b8')
        .text('TAKZIR TUNTAS');

    } else {
      // Horizontal Bar Chart of Forms of Punishment (Bentuk Sanksi)
      const margin = { top: 15, right: 25, bottom: 25, left: 20 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'overflow-visible');

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const bentukMap: { [b: string]: number } = {};
      sanksiList.forEach(s => {
        const b = s.bentukSanksi || 'Lain-lain';
        bentukMap[b] = (bentukMap[b] || 0) + 1;
      });

      const bentukData = Object.entries(bentukMap)
        .map(([bentuk, count]) => ({ bentuk, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (bentukData.length === 0) {
        bentukData.push({ bentuk: 'Belum Ada Sanksi', count: 0 });
      }

      const yScale = d3.scaleBand()
        .domain(bentukData.map(d => d.bentuk))
        .range([0, innerHeight])
        .padding(0.25);

      const maxVal = Math.max(2, d3.max(bentukData, d => d.count) || 2);
      const xScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([0, innerWidth]);

      bentukData.forEach(d => {
        const y = yScale(d.bentuk) || 0;
        const barW = xScale(d.count);
        const barH = yScale.bandwidth();

        g.append('rect')
          .attr('x', 0)
          .attr('y', y)
          .attr('width', innerWidth)
          .attr('height', barH)
          .attr('rx', 6)
          .attr('fill', '#090d16')
          .attr('stroke', '#1e293b');

        g.append('rect')
          .attr('x', 0)
          .attr('y', y)
          .attr('width', Math.max(3, barW))
          .attr('height', barH)
          .attr('rx', 6)
          .attr('fill', '#a855f7')
          .attr('opacity', 0.85);

        g.append('text')
          .attr('x', 8)
          .attr('y', y + barH / 2 + 4)
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('fill', '#ffffff')
          .text(d.bentuk.length > 22 ? d.bentuk.substring(0, 22) + '...' : d.bentuk);

        g.append('text')
          .attr('x', innerWidth - 8)
          .attr('y', y + barH / 2 + 4)
          .attr('text-anchor', 'end')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', '#c084fc')
          .text(`${d.count} Santri`);
      });
    }

  }, [sanksiList, viewMode, sanksiAktif, sanksiSelesai, totalSanksi]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-purple-500 via-emerald-500 to-transparent opacity-80" />
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">MODUL C</span>
              <span className="text-[10px] font-mono text-slate-400">· PEMBINAAN & TAKZIR</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Sanksi Edukatif
            </h3>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
          <button
            onClick={() => setViewMode('status')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'status' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Status
          </button>
          <button
            onClick={() => setViewMode('jenis')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${viewMode === 'jenis' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Bentuk Sanksi
          </button>
        </div>
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
          <span className="text-[10px] text-slate-400 block">Sanksi Aktif:</span>
          <span className="font-bold text-amber-300 text-sm">{sanksiAktif.length}</span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
          <span className="text-[10px] text-slate-400 block">Sanksi Selesai:</span>
          <span className="font-bold text-emerald-400 text-sm">{sanksiSelesai.length}</span>
        </div>
        <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30">
          <span className="text-[10px] text-slate-400 block">Total Berkas:</span>
          <span className="font-bold text-purple-300 text-sm">{totalSanksi}</span>
        </div>
      </div>

      {/* D3 Render Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[240px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Summary */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Dibina: <strong className="text-amber-300">{sanksiAktif.length} Santri</strong></span>
        <span className="text-emerald-400 font-bold">REKAPITULASI TAKZIR AKTUAL</span>
      </div>
    </div>
  );
};

// ==========================================
// 4. PANEL GRAFIK KOMPARASI LAPORAN BULANAN
// ==========================================
export const GrafikKomparasiBulanan: React.FC<{
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
}> = ({ perizinanList, pelanggaranList, sanksiList }) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
      const label = `${monthNames[m]} ${y}`;

      const countIzin = perizinanList.filter(p => (p.tglKeluar || p.tglPengajuan || '').startsWith(monthStr)).length;
      const countPel = pelanggaranList.filter(p => (p.tanggal || '').startsWith(monthStr)).length;
      const countSanksi = sanksiList.filter(s => (s.tanggalAktualSelesai || s.tanggalPenetapan || '').startsWith(monthStr) && s.status === 'Selesai').length;

      data.push({ label, perizinan: countIzin, pelanggaran: countPel, sanksiSelesai: countSanksi });
    }
    return data;
  }, [perizinanList, pelanggaranList, sanksiList, rangeMonths]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 240;
    const margin = { top: 20, right: 25, bottom: 35, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(monthlyData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.24);

    const x1 = d3.scaleBand()
      .domain(['perizinan', 'pelanggaran', 'sanksi'])
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const maxVal = Math.max(4, d3.max(monthlyData, d => Math.max(d.perizinan, d.pelanggaran, d.sanksiSelesai)) || 4);
    const yScale = d3.scaleLinear()
      .domain([0, maxVal + 1])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    g.append('g')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.5)
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

    monthlyData.forEach(d => {
      const groupX = x0(d.label) || 0;
      const barW = x1.bandwidth();

      // Perizinan (Cyan)
      const hIzin = innerHeight - yScale(d.perizinan);
      g.append('rect')
        .attr('x', groupX + (x1('perizinan') || 0))
        .attr('y', yScale(d.perizinan))
        .attr('width', barW)
        .attr('height', Math.max(2, hIzin))
        .attr('rx', 4)
        .attr('fill', '#06b6d4')
        .attr('opacity', 0.9);

      // Pelanggaran (Red)
      const hPel = innerHeight - yScale(d.pelanggaran);
      g.append('rect')
        .attr('x', groupX + (x1('pelanggaran') || 0))
        .attr('y', yScale(d.pelanggaran))
        .attr('width', barW)
        .attr('height', Math.max(2, hPel))
        .attr('rx', 4)
        .attr('fill', '#ef4444')
        .attr('opacity', 0.9);

      // Sanksi Selesai (Emerald)
      const hSanksi = innerHeight - yScale(d.sanksiSelesai);
      g.append('rect')
        .attr('x', groupX + (x1('sanksi') || 0))
        .attr('y', yScale(d.sanksiSelesai))
        .attr('width', barW)
        .attr('height', Math.max(2, hSanksi))
        .attr('rx', 4)
        .attr('fill', '#10b981')
        .attr('opacity', 0.9);

      // X Label
      g.append('text')
        .attr('x', groupX + x0.bandwidth() / 2)
        .attr('y', innerHeight + 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('fill', '#94a3b8')
        .text(d.label);
    });

  }, [monthlyData]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500 via-cyan-500 to-transparent opacity-80" />
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">MODUL D</span>
              <span className="text-[10px] font-mono text-slate-400">· KOMPARASI MULTI-BULAN</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Komparasi Laporan Bulanan
            </h3>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
          <button
            onClick={() => setRangeMonths(6)}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${rangeMonths === 6 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            6 Bulan
          </button>
          <button
            onClick={() => setRangeMonths(12)}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${rangeMonths === 12 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            12 Bulan
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> Perizinan
        </span>
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Pelanggaran
        </span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span> Takzir Tuntas
        </span>
      </div>

      {/* D3 Render Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[240px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Summary */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Periode: <strong className="text-amber-300">{rangeMonths} Bulan Terakhir</strong></span>
        <span className="text-cyan-300 font-bold">REKAPITULASI DUA ARAH REAL-TIME</span>
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
  currentUser,
}) => {
  // Global Filter State
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');

  // Extract distinct kelas from santri and perizinan
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    santriList.forEach(s => s.kelas && set.add(s.kelas));
    perizinanList.forEach(p => p.santriKelas && set.add(p.santriKelas));
    return Array.from(set).sort();
  }, [santriList, perizinanList]);

  // Aggregate Metrics for Top Counter Bar (Exact Database Sync)
  const totalSantri = santriList.length;
  const totalIzin = perizinanList.length;
  const totalIzinAktif = perizinanList.filter(p => (p.status === 'Sedang Keluar' || p.status === 'Disetujui') && !p.actualKembali).length;
  const totalIzinSelesai = perizinanList.filter(p => p.status === 'Sudah Kembali' || Boolean(p.actualKembali)).length;
  const totalTerlambat = perizinanList.filter(p => (p.status === 'Terlambat' || (p.menitKeterlambatan && p.menitKeterlambatan > 0)) && !p.actualKembali).length;

  const totalPelanggaran = pelanggaranList.length;
  const totalPoinPelanggaran = pelanggaranList.reduce((acc, curr) => acc + (curr.poin || 0), 0);

  const totalSanksiAktif = sanksiList.filter(s => s.status === 'Sedang Berjalan' || s.status === 'Belum Dikerjakan').length;
  const totalSanksiSelesai = sanksiList.filter(s => s.status === 'Selesai').length;

  return (
    <div className="space-y-6">
      
      {/* 1. Master Filter & Live Telemetry Count-Up Bar */}
      <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl relative overflow-hidden hover-rainbow-edge">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-500 opacity-80" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                INTEGRATED ANALYTIC GRID & VISUALIZATION
              </span>
              <span className="text-xs font-mono text-slate-400">· 4 Modul Terhubung</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
              Pusat Analitik Keamanan, Perizinan & Kedisiplinan Santri
            </h2>
          </div>

          {/* Global Interactive Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Periode filter */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
              <button
                onClick={() => setPeriodFilter('today')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodFilter === 'today' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setPeriodFilter('7d')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodFilter === '7d' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setPeriodFilter('30d')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodFilter === '30d' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodFilter === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Semua
              </button>
            </div>

            {/* Kelas filter */}
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="bg-slate-900/90 border border-slate-700 text-amber-300 text-[11px] font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Semua Kelas</option>
              {distinctClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            {/* Kategori filter */}
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="bg-slate-900/90 border border-slate-700 text-cyan-300 text-[11px] font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>
        </div>

        {/* 4 Animated KPI Stat Counters (Matching exact database numbers) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          
          {/* Stat 1: Total Perizinan */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Perizinan</span>
              <DoorOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              <AnimatedCounter value={totalIzin} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
              <span className="text-cyan-300">{totalIzinAktif} Aktif</span>
              <span className="text-emerald-400">{totalIzinSelesai} Selesai</span>
            </div>
          </div>

          {/* Stat 2: Total Pelanggaran & Poin */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Pelanggaran Terdata</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black font-mono text-red-400 mt-1">
              <AnimatedCounter value={totalPelanggaran} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
              <span className="text-slate-300">{totalPoinPelanggaran} Poin</span>
              <span className="text-red-400">{pelanggaranList.filter(p => p.kategori === 'Berat').length} Berat</span>
            </div>
          </div>

          {/* Stat 3: Santri Menjalani Sanksi */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Sanksi Edukatif</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-300 mt-1">
              <AnimatedCounter value={totalSanksiAktif} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
              <span className="text-amber-300">{totalSanksiAktif} Dibina</span>
              <span className="text-emerald-400">{totalSanksiSelesai} Tuntas</span>
            </div>
          </div>

          {/* Stat 4: Keterlambatan Gerbang */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Santri Terlambat</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-red-400 mt-1">
              <AnimatedCounter value={totalTerlambat} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
              <span className="text-red-400">{totalTerlambat} Lewat Jadwal</span>
              <span className="text-slate-400">/ {totalSantri} Santri</span>
            </div>
          </div>

        </div>

      </div>

      {/* 2. THE 4 SYNCHRONIZED CHARTS IN 2-COLUMN RESPONSIVE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Modul A: Grafik Perizinan Santri */}
        <GrafikPerizinanSantri 
          perizinanList={perizinanList} 
          selectedKelas={selectedKelas}
          periodFilter={periodFilter}
        />

        {/* Modul B: Grafik Pelanggaran Santri */}
        <GrafikPelanggaranSantri 
          pelanggaranList={pelanggaranList} 
          selectedKelas={selectedKelas}
          selectedKategori={selectedKategori}
          periodFilter={periodFilter}
        />

        {/* Modul C: Grafik Sanksi Edukatif */}
        <GrafikSanksiSantri 
          sanksiList={sanksiList} 
          pelanggaranList={pelanggaranList} 
        />

        {/* Modul D: Grafik Komparasi Laporan Bulanan */}
        <GrafikKomparasiBulanan 
          perizinanList={perizinanList} 
          pelanggaranList={pelanggaranList} 
          sanksiList={sanksiList} 
        />

      </div>

    </div>
  );
};
