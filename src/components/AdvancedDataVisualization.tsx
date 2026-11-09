import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Activity, 
  ChevronRight, 
  Sparkles, 
  Filter, 
  PieChart, 
  ArrowUpRight, 
  Layers, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  DoorOpen,
  Info
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
}> = ({ value, duration = 900, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = value;

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
// 1. PANEL GRAFIK STATISTIK PELANGGARAN (BAR CHART)
// ==========================================
export const GrafikStatistikPelanggaran: React.FC<{
  pelanggaranList: Pelanggaran[];
}> = ({ pelanggaranList }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | 'all'>('30d');
  const [viewMode, setViewMode] = useState<'jenis' | 'tingkat'>('jenis');

  const filteredPelanggaran = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (periodFilter === '7d') cutoff.setDate(now.getDate() - 7);
    else if (periodFilter === '30d') cutoff.setDate(now.getDate() - 30);
    else cutoff.setFullYear(2000, 0, 1);

    return pelanggaranList.filter(p => {
      const pDate = new Date(p.tanggal);
      return isNaN(pDate.getTime()) || pDate >= cutoff;
    });
  }, [pelanggaranList, periodFilter]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 250;
    const margin = { top: 15, right: 25, bottom: 25, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    if (viewMode === 'jenis') {
      // Aggregate by jenisPelanggaran
      const counts: { [key: string]: { count: number; poin: number; kategori: string } } = {};
      filteredPelanggaran.forEach(p => {
        const j = p.jenisPelanggaran || 'Lain-lain';
        if (!counts[j]) counts[j] = { count: 0, poin: 0, kategori: p.kategori };
        counts[j].count += 1;
        counts[j].poin += (p.poin || 0);
      });

      const barData = Object.entries(counts)
        .map(([jenis, d]) => ({ jenis, ...d }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // top 5

      if (barData.length === 0) {
        barData.push({ jenis: 'Nol Pelanggaran', count: 0, poin: 0, kategori: 'Ringan' });
      }

      const yScale = d3.scaleBand()
        .domain(barData.map(d => d.jenis))
        .range([0, innerHeight])
        .padding(0.28);

      const maxVal = Math.max(3, d3.max(barData, d => d.count) || 3);
      const xScale = d3.scaleLinear()
        .domain([0, maxVal + 1])
        .range([0, innerWidth]);

      barData.forEach(d => {
        const y = yScale(d.jenis) || 0;
        const barW = xScale(d.count);
        const barH = yScale.bandwidth();
        const color = d.kategori === 'Berat' ? '#ef4444' : d.kategori === 'Sedang' ? '#f59e0b' : '#06b6d4';

        // Background track
        g.append('rect')
          .attr('x', 0)
          .attr('y', y)
          .attr('width', innerWidth)
          .attr('height', barH)
          .attr('rx', 6)
          .attr('fill', '#090d16')
          .attr('stroke', '#1e293b');

        // Progress bar
        g.append('rect')
          .attr('x', 0)
          .attr('y', y)
          .attr('width', Math.max(4, barW))
          .attr('height', barH)
          .attr('rx', 6)
          .attr('fill', color)
          .attr('opacity', 0.85);

        // Label
        g.append('text')
          .attr('x', 8)
          .attr('y', y + barH / 2 + 4)
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('fill', '#ffffff')
          .text(d.jenis.length > 22 ? d.jenis.substring(0, 22) + '...' : d.jenis);

        // Value
        g.append('text')
          .attr('x', innerWidth - 8)
          .attr('y', y + barH / 2 + 4)
          .attr('text-anchor', 'end')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', color)
          .text(`${d.count} Kasus · ${d.poin} Poin`);
      });

    } else {
      // View by Tingkat: Ringan, Sedang, Berat
      const levels = [
        { label: 'Ringan', count: filteredPelanggaran.filter(p => p.kategori === 'Ringan').length, color: '#06b6d4' },
        { label: 'Sedang', count: filteredPelanggaran.filter(p => p.kategori === 'Sedang').length, color: '#f59e0b' },
        { label: 'Berat', count: filteredPelanggaran.filter(p => p.kategori === 'Berat').length, color: '#ef4444' }
      ];

      const maxCount = Math.max(4, d3.max(levels, d => d.count) || 4);
      const xScale = d3.scaleBand()
        .domain(levels.map(d => d.label))
        .range([0, innerWidth])
        .padding(0.35);

      const yScale = d3.scaleLinear()
        .domain([0, maxCount + 2])
        .range([innerHeight, 0]);

      levels.forEach(d => {
        const x = xScale(d.label) || 0;
        const barW = xScale.bandwidth();
        const barH = innerHeight - yScale(d.count);
        const y = yScale(d.count);

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barW)
          .attr('height', barH)
          .attr('rx', 6)
          .attr('fill', d.color)
          .attr('opacity', 0.85);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', y - 6)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', d.color)
          .text(`${d.count}`);

        g.append('text')
          .attr('x', x + barW / 2)
          .attr('y', innerHeight + 16)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('fill', '#94a3b8')
          .text(d.label.toUpperCase());
      });
    }

  }, [filteredPelanggaran, viewMode]);

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
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">PANEL 1</span>
              <span className="text-[10px] font-mono text-slate-400">· BAR CHART</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Statistik Pelanggaran
            </h3>
          </div>
        </div>

        {/* Independent Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
            <button
              onClick={() => setPeriodFilter('7d')}
              className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodFilter === '7d' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              7H
            </button>
            <button
              onClick={() => setPeriodFilter('30d')}
              className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodFilter === '30d' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              30H
            </button>
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodFilter === 'all' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Semua
            </button>
          </div>

          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
            <button
              onClick={() => setViewMode('jenis')}
              className={`px-2 py-0.5 rounded-lg cursor-pointer ${viewMode === 'jenis' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Jenis
            </button>
            <button
              onClick={() => setViewMode('tingkat')}
              className={`px-2 py-0.5 rounded-lg cursor-pointer ${viewMode === 'tingkat' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Tingkat
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 font-sans">
        Menampilkan perincian jumlah pelanggaran berdasarkan jenis kasus dan pembagian tingkat qanun.
      </p>

      {/* D3 Bar Chart Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[250px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Metrics */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Total: <strong className="text-red-400">{filteredPelanggaran.length} Kasus</strong></span>
        <span className="text-amber-300 font-bold">AKUMULASI QANUN REAL-TIME</span>
      </div>
    </div>
  );
};

// ==========================================
// 2. PANEL GRAFIK TREN PERIZINAN (LINE CHART)
// ==========================================
export const GrafikTrenPerizinan: React.FC<{
  perizinanList: Perizinan[];
}> = ({ perizinanList }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(14);

  const timelineData = useMemo(() => {
    const data: { label: string; izinKeluar: number; izinPulang: number }[] = [];
    const now = new Date();
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      const keluarCount = perizinanList.filter(p => p.tglKeluar === iso && p.jenisIzin === 'Izin Keluar').length;
      const pulangCount = perizinanList.filter(p => (p.tglKeluar === iso || p.tglPengajuan === iso) && p.jenisIzin === 'Izin Pulang').length;

      data.push({ label, izinKeluar: keluarCount, izinPulang: pulangCount });
    }
    return data;
  }, [perizinanList, periodDays]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 250;
    const margin = { top: 20, right: 25, bottom: 30, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible');

    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'line-glow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint()
      .domain(timelineData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const maxVal = Math.max(4, d3.max(timelineData, d => Math.max(d.izinKeluar, d.izinPulang)) || 4);
    const yScale = d3.scaleLinear()
      .domain([0, maxVal + 1])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.5)
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

    // Line generators
    const lineKeluar = d3.line<{ label: string; izinKeluar: number }>()
      .x(d => xScale(d.label) || 0)
      .y(d => yScale(d.izinKeluar))
      .curve(d3.curveMonotoneX);

    const linePulang = d3.line<{ label: string; izinPulang: number }>()
      .x(d => xScale(d.label) || 0)
      .y(d => yScale(d.izinPulang))
      .curve(d3.curveMonotoneX);

    // Draw lines
    g.append('path')
      .datum(timelineData)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#line-glow)')
      .attr('d', lineKeluar);

    g.append('path')
      .datum(timelineData)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#line-glow)')
      .attr('d', linePulang);

    // Draw dots
    timelineData.forEach(d => {
      const x = xScale(d.label) || 0;
      g.append('circle')
        .attr('cx', x)
        .attr('cy', yScale(d.izinKeluar))
        .attr('r', 3.5)
        .attr('fill', '#090d16')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2);

      g.append('circle')
        .attr('cx', x)
        .attr('cy', yScale(d.izinPulang))
        .attr('r', 3.5)
        .attr('fill', '#090d16')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2);
    });

    // Axes
    const xAxis = d3.axisBottom(xScale).tickSize(0);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('dy', '1.2em');

    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d => `${d}`);
    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace');

  }, [timelineData]);

  const totalKeluar = perizinanList.filter(p => p.jenisIzin === 'Izin Keluar').length;
  const totalPulang = perizinanList.filter(p => p.jenisIzin === 'Izin Pulang').length;

  return (
    <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent opacity-80" />
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">PANEL 2</span>
              <span className="text-[10px] font-mono text-slate-400">· LINE CHART</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Tren Perizinan
            </h3>
          </div>
        </div>

        {/* Independent Period Filter */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
          <button
            onClick={() => setPeriodDays(7)}
            className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodDays === 7 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriodDays(14)}
            className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodDays === 14 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            14 Hari
          </button>
          <button
            onClick={() => setPeriodDays(30)}
            className={`px-2 py-0.5 rounded-lg cursor-pointer ${periodDays === 30 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Description & Legend */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 font-sans">Komparasi mutasi keluar dan kepulangan santri.</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Izin Keluar ({totalKeluar})
          </span>
          <span className="flex items-center gap-1 text-amber-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Izin Pulang ({totalPulang})
          </span>
        </div>
      </div>

      {/* D3 Line Chart Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[250px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Metrics */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Rentang: <strong className="text-cyan-300">{periodDays} Hari Terakhir</strong></span>
        <span className="text-emerald-400 font-bold">KURVA PERGERAKAN HARIAN</span>
      </div>
    </div>
  );
};

// ==========================================
// 3. PANEL GRAFIK TINGKAT KEDISIPLINAN (DONUT / PIE CHART)
// ==========================================
export const GrafikTingkatKedisiplinan: React.FC<{
  santriList: Santri[];
  pelanggaranList: Pelanggaran[];
}> = ({ santriList, pelanggaranList }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSantri = santriList.length;
  const santriMelanggarSet = useMemo(() => new Set(pelanggaranList.map(p => p.santriId)), [pelanggaranList]);
  const jumlahSantriMelanggar = santriMelanggarSet.size;
  const jumlahSantriDisiplin = Math.max(0, totalSantri - jumlahSantriMelanggar);
  const rasioDisiplin = totalSantri > 0 ? (jumlahSantriDisiplin / totalSantri) * 100 : 100;

  const countRingan = santriList.filter(s => s.poinPelanggaran > 0 && s.poinPelanggaran <= 15).length;
  const countSedang = santriList.filter(s => s.poinPelanggaran > 15 && s.poinPelanggaran <= 30).length;
  const countBerat = santriList.filter(s => s.poinPelanggaran > 30).length;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 15;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible');

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const pieData = [
      { label: 'Disiplin Tertib', count: jumlahSantriDisiplin, color: '#10b981' },
      { label: 'Pelanggar Ringan', count: countRingan, color: '#06b6d4' },
      { label: 'Pelanggar Sedang', count: countSedang, color: '#f59e0b' },
      { label: 'Pelanggar Berat', count: countBerat, color: '#ef4444' },
    ];

    const pie = d3.pie<{ label: string; count: number; color: string }>()
      .value(d => Math.max(d.count, 0.001))
      .sort(null)
      .padAngle(0.04);

    const arc = d3.arc<d3.PieArcDatum<{ label: string; count: number; color: string }>>()
      .innerRadius(radius * 0.65)
      .outerRadius(radius * 0.95)
      .cornerRadius(6);

    // Decorative outer concentric ring
    g.append('circle')
      .attr('r', radius * 1.06)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '4,4');

    const arcs = g.selectAll('.arc')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc as any)
      .attr('fill', d => d.data.color)
      .attr('opacity', 0.9)
      .attr('stroke', '#090d16')
      .attr('stroke-width', 2);

    // Center Big Percentage
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.15em')
      .attr('font-size', '26px')
      .attr('font-weight', '900')
      .attr('font-family', 'monospace')
      .attr('fill', '#10b981')
      .text(`${rasioDisiplin.toFixed(1)}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#94a3b8')
      .text('INDICE DISIPLIN');

  }, [jumlahSantriDisiplin, countRingan, countSedang, countBerat, rasioDisiplin]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-transparent opacity-80" />
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">PANEL 3</span>
              <span className="text-[10px] font-mono text-slate-400">· DONUT CHART</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Tingkat Kedisiplinan
            </h3>
          </div>
        </div>

        {/* Status Pill */}
        <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold self-start sm:self-auto">
          {rasioDisiplin >= 85 ? 'STATUS: PRIMA' : 'STATUS: WASPADA'}
        </span>
      </div>

      {/* Description & Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
        <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
          Tertib: <strong>{jumlahSantriDisiplin}</strong>
        </div>
        <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
          Ringan: <strong>{countRingan}</strong>
        </div>
        <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
          Sedang: <strong>{countSedang}</strong>
        </div>
        <div className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300">
          Berat: <strong>{countBerat}</strong>
        </div>
      </div>

      {/* D3 Donut Chart Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[250px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Metrics */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Populasi: <strong className="text-white">{totalSantri} Santri</strong></span>
        <span className="text-emerald-400 font-bold">{rasioDisiplin.toFixed(1)}% BEBAS PELANGGARAN</span>
      </div>
    </div>
  );
};

// ==========================================
// 4. PANEL GRAFIK LAPORAN BULANAN (MONTHLY COMPARISON BAR)
// ==========================================
export const GrafikLaporanBulanan: React.FC<{
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
}> = ({ perizinanList, pelanggaranList }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);

  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const data: { label: string; perizinan: number; pelanggaran: number }[] = [];

    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${monthNames[m]} ${y}`;

      const countIzin = perizinanList.filter(p => (p.tglKeluar || p.tglPengajuan || '').startsWith(monthStr)).length;
      const countPel = pelanggaranList.filter(p => (p.tanggal || '').startsWith(monthStr)).length;

      data.push({ label, perizinan: countIzin, pelanggaran: countPel });
    }
    return data;
  }, [perizinanList, pelanggaranList, rangeMonths]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 450;
    const height = 250;
    const margin = { top: 20, right: 25, bottom: 30, left: 35 };
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
      .domain(['perizinan', 'pelanggaran'])
      .range([0, x0.bandwidth()])
      .padding(0.12);

    const maxVal = Math.max(5, d3.max(monthlyData, d => Math.max(d.perizinan, d.pelanggaran)) || 5);
    const yScale = d3.scaleLinear()
      .domain([0, maxVal + 1])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.5)
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

    // Render Double Bars
    monthlyData.forEach(d => {
      const groupX = x0(d.label) || 0;
      const barW = x1.bandwidth();

      // Perizinan Bar (Cyan)
      const hIzin = innerHeight - yScale(d.perizinan);
      g.append('rect')
        .attr('x', groupX + (x1('perizinan') || 0))
        .attr('y', yScale(d.perizinan))
        .attr('width', barW)
        .attr('height', hIzin)
        .attr('rx', 4)
        .attr('fill', '#06b6d4')
        .attr('opacity', 0.85);

      // Pelanggaran Bar (Red)
      const hPel = innerHeight - yScale(d.pelanggaran);
      g.append('rect')
        .attr('x', groupX + (x1('pelanggaran') || 0))
        .attr('y', yScale(d.pelanggaran))
        .attr('width', barW)
        .attr('height', hPel)
        .attr('rx', 4)
        .attr('fill', '#ef4444')
        .attr('opacity', 0.85);

      // Label below
      g.append('text')
        .attr('x', groupX + x0.bandwidth() / 2)
        .attr('y', innerHeight + 16)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('fill', '#94a3b8')
        .text(d.label);
    });

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4);
    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

  }, [monthlyData]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl space-y-4 hover-rainbow-edge relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500 via-purple-500 to-transparent opacity-80" />
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">PANEL 4</span>
              <span className="text-[10px] font-mono text-slate-400">· COMPARATIVE BAR</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
              Grafik Laporan Bulanan
            </h3>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono">
          <button
            onClick={() => setRangeMonths(6)}
            className={`px-2 py-0.5 rounded-lg cursor-pointer ${rangeMonths === 6 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            6 Bulan
          </button>
          <button
            onClick={() => setRangeMonths(12)}
            className={`px-2 py-0.5 rounded-lg cursor-pointer ${rangeMonths === 12 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            12 Bulan
          </button>
        </div>
      </div>

      {/* Description & Legend */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 font-sans">Komparasi perizinan dan pelanggaran per bulan.</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-300 font-semibold">
            <span className="w-2 h-2 rounded-sm bg-cyan-400"></span> Perizinan
          </span>
          <span className="flex items-center gap-1 text-red-400 font-semibold">
            <span className="w-2 h-2 rounded-sm bg-red-500"></span> Pelanggaran
          </span>
        </div>
      </div>

      {/* D3 Monthly Bar Chart Area */}
      <div 
        ref={containerRef} 
        className="w-full min-h-[250px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-x-auto" 
      />

      {/* Footer Metrics */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Periode: <strong className="text-amber-300">{rangeMonths} Bulan Terakhir</strong></span>
        <span className="text-cyan-300 font-bold">REKAPITULASI KALENDER TERPADU</span>
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
  // Aggregate Metrics for Top Counter Bar
  const totalSantri = santriList.length;
  const santriMelanggarSet = useMemo(() => new Set(pelanggaranList.map(p => p.santriId)), [pelanggaranList]);
  const jumlahSantriMelanggar = santriMelanggarSet.size;
  const jumlahSantriDisiplin = Math.max(0, totalSantri - jumlahSantriMelanggar);
  const rasioDisiplin = totalSantri > 0 ? (jumlahSantriDisiplin / totalSantri) * 100 : 100;

  const totalIzin = perizinanList.length;
  const totalIzinKeluar = perizinanList.filter(p => p.jenisIzin === 'Izin Keluar').length;
  const totalIzinPulang = perizinanList.filter(p => p.jenisIzin === 'Izin Pulang').length;
  const totalTerlambat = perizinanList.filter(p => p.status === 'Terlambat' || (p.menitKeterlambatan && p.menitKeterlambatan > 0)).length;
  const persenTertib = totalIzin > 0 ? (((totalIzin - totalTerlambat) / totalIzin) * 100) : 100;

  const totalPelanggaran = pelanggaranList.length;
  const totalPoinPelanggaran = pelanggaranList.reduce((acc, curr) => acc + (curr.poin || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Live Telemetry Count-Up Bar */}
      <div className="p-5 sm:p-6 rounded-3xl metallic-glass-card border border-slate-800 shadow-2xl relative overflow-hidden hover-rainbow-edge">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-500 opacity-80" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                ADVANCED DATA VISUALIZATION GRID
              </span>
              <span className="text-xs font-mono text-slate-400">· 4 Panel Statistik Independen</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
              Pusat Analitik Keamanan, Perizinan & Kedisiplinan Santri
            </h2>
          </div>

          {/* Scope Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Akses Otoritas:</span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold uppercase">
              {currentUser.role === 'admin' ? '🛡️ Admin Terpusat (Semua Sektor)' : `👮 ${currentUser.nama} (${currentUser.genderAccess.toUpperCase()})`}
            </span>
          </div>
        </div>

        {/* 4 Animated KPI Stat Counters */}
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
              <span className="text-cyan-300">{totalIzinKeluar} Keluar</span>
              <span className="text-amber-300">{totalIzinPulang} Pulang</span>
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
              <span className="text-slate-300">{totalPoinPelanggaran} Total Poin</span>
              <span className="text-red-400">{pelanggaranList.filter(p => p.kategori === 'Berat').length} Berat</span>
            </div>
          </div>

          {/* Stat 3: Indeks Kedisiplinan */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Tingkat Kedisiplinan</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              <AnimatedCounter value={rasioDisiplin} decimals={1} suffix="%" />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
              <span className="text-emerald-300">{jumlahSantriDisiplin} Disiplin</span>
              <span className="text-slate-400">/ {totalSantri} Santri</span>
            </div>
          </div>

          {/* Stat 4: Ketertiban Jam Kembali */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Ketertiban Kembali</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-300 mt-1">
              <AnimatedCounter value={persenTertib} decimals={1} suffix="%" />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
              <span className="text-emerald-300">{totalIzin - totalTerlambat} Tepat Waktu</span>
              <span className="text-red-400">{totalTerlambat} Terlambat</span>
            </div>
          </div>

        </div>

      </div>

      {/* 2. THE 4 SEPARATED INDEPENDENT CHART PANELS IN 2-COLUMN RESPONSIVE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Grafik Statistik Pelanggaran (Bar Chart) */}
        <GrafikStatistikPelanggaran pelanggaranList={pelanggaranList} />

        {/* Panel 2: Grafik Tren Perizinan (Line Chart) */}
        <GrafikTrenPerizinan perizinanList={perizinanList} />

        {/* Panel 3: Grafik Tingkat Kedisiplinan (Donut / Pie Chart) */}
        <GrafikTingkatKedisiplinan 
          santriList={santriList} 
          pelanggaranList={pelanggaranList} 
        />

        {/* Panel 4: Grafik Laporan Bulanan (Comparative Bar Chart) */}
        <GrafikLaporanBulanan 
          perizinanList={perizinanList} 
          pelanggaranList={pelanggaranList} 
        />

      </div>

    </div>
  );
};
