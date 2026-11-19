import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

// ============================================================================
// 1. 3D EXTRUDED NUMERIC TYPOGRAPHY + COUNT-UP ANIMATION + 3D KPI GLASS CARD
// ============================================================================

export type ExtrudedTone = 'gold' | 'emerald' | 'silver' | 'rose' | 'sky';

const TONE_GRADIENTS: Record<ExtrudedTone, string> = {
  gold: 'from-[#fff7d6] via-[#f3d266] to-[#c7951c]',
  emerald: 'from-[#ecfdf5] via-[#6ee7b7] to-[#059669]',
  silver: 'from-[#ffffff] via-[#e2e8f0] to-[#94a3b8]',
  rose: 'from-[#fff1f2] via-[#fda4af] to-[#e11d48]',
  sky: 'from-[#f0f9ff] via-[#7dd3fc] to-[#0284c7]',
};

export function useCountUpValue(target: number, duration = 760): number {
  const [display, setDisplay] = useState<number>(target);
  const prevRef = useRef<number>(0);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setDisplay(0);
      return;
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }

    const startVal = prevRef.current;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = startVal + (target - startVal) * eased;
      setDisplay(nextVal);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        prevRef.current = target;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return display;
}

interface Extruded3DValueProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatAsRupiah?: boolean;
  tone?: ExtrudedTone;
  className?: string;
}

export const Extruded3DValue: React.FC<Extruded3DValueProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatAsRupiah = false,
  tone = 'silver',
  className = 'text-2xl sm:text-3xl',
}) => {
  const animated = useCountUpValue(value);

  const formatted = useMemo(() => {
    if (formatAsRupiah) {
      const rounded = Math.round(animated);
      return `Rp ${rounded.toLocaleString('id-ID')}`;
    }
    if (decimals > 0) {
      return `${prefix}${animated.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(animated).toLocaleString('id-ID')}${suffix}`;
  }, [animated, prefix, suffix, decimals, formatAsRupiah]);

  return (
    <span className={`relative inline-grid align-baseline select-none ${className}`}>
      {/* Back 3D Extruded Shadow Layer */}
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 font-extrabold tabular-nums tracking-tight text-slate-300/35 extruded-3d-base pointer-events-none"
      >
        {formatted}
      </span>
      {/* Front Glossy Metallic Gradient Layer */}
      <span
        className={`col-start-1 row-start-1 relative z-10 font-extrabold tabular-nums tracking-tight bg-gradient-to-b ${TONE_GRADIENTS[tone]} bg-clip-text text-transparent`}
      >
        {formatted}
      </span>
    </span>
  );
};

interface KpiStatCard3DProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatAsRupiah?: boolean;
  tone?: ExtrudedTone;
  subtitle?: string;
  trendPercent?: number;
  trendText?: string;
  icon?: React.ReactNode;
  extraRight?: React.ReactNode;
  valueClassName?: string;
  onClick?: () => void;
  className?: string;
}

export const KpiStatCard3D: React.FC<KpiStatCard3DProps> = ({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatAsRupiah = false,
  tone = 'silver',
  subtitle,
  trendPercent,
  trendText,
  icon,
  extraRight,
  valueClassName = 'text-2xl sm:text-3xl',
  onClick,
  className = '',
}) => {
  const isPositive = (trendPercent ?? 0) >= 0;

  return (
    <div
      onClick={onClick}
      className={`kpi-glass-3d rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-2.5 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-100/85 truncate">
          {label}
        </span>
        {icon && (
          <span className="p-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400/25 shadow-inner shrink-0">
            {icon}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Extruded3DValue
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          formatAsRupiah={formatAsRupiah}
          tone={tone}
          className={valueClassName}
        />

        {(typeof trendPercent === 'number' || trendText) && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold tabular-nums text-white ${
              isPositive ? 'badge-3d-up text-emerald-100' : 'badge-3d-down text-rose-100'
            }`}
          >
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>
              {trendText ??
                `${isPositive ? '+' : ''}${trendPercent?.toFixed(1)}%`}
            </span>
          </span>
        )}
        {extraRight}
      </div>

      {subtitle && (
        <p className="text-[11px] text-emerald-200/75 truncate">{subtitle}</p>
      )}
    </div>
  );
};

// ============================================================================
// 2. 3D PIE CHART (TILTED PERSPECTIVE + CYLINDRICAL EXTRUSION + POP-OUT SLICE)
// ============================================================================

export interface PieSlice3D {
  name: string;
  value: number;
  color: string;
  persen?: number;
}

interface PieChart3DProps {
  data: PieSlice3D[];
  size?: number;
  innerRadiusRatio?: number; // 0 = solid 3D pie, 0.56 = 3D donut ring
  depth?: number;
  centerValue?: number;
  centerSuffix?: string;
  centerLabel?: string;
  centerTone?: ExtrudedTone;
  unit?: string;
  onSliceClick?: (slice: PieSlice3D) => void;
}

function shadeHex(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((num & 255) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

function describeRingSector(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
): string {
  const span = endAngle - startAngle;
  if (span >= Math.PI * 1.999) {
    // Full circle composed of two half arcs
    const mid = startAngle + Math.PI;
    return [
      describeRingSector(cx, cy, rOuter, rInner, startAngle, mid),
      describeRingSector(cx, cy, rOuter, rInner, mid, startAngle + Math.PI * 1.999),
    ].join(' ');
  }

  const x1 = cx + rOuter * Math.cos(startAngle);
  const y1 = cy + rOuter * Math.sin(startAngle);
  const x2 = cx + rOuter * Math.cos(endAngle);
  const y2 = cy + rOuter * Math.sin(endAngle);
  const largeArc = span > Math.PI ? 1 : 0;

  if (rInner <= 0.5) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  const ix1 = cx + rInner * Math.cos(endAngle);
  const iy1 = cy + rInner * Math.sin(endAngle);
  const ix2 = cx + rInner * Math.cos(startAngle);
  const iy2 = cy + rInner * Math.sin(startAngle);

  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${rInner} ${rInner} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
}

export const PieChart3D: React.FC<PieChart3DProps> = ({
  data,
  size = 168,
  innerRadiusRatio = 0.52,
  depth = 14,
  centerValue,
  centerSuffix = '%',
  centerLabel,
  centerTone = 'silver',
  unit = '',
  onSliceClick,
}) => {
  const uid = useId().replace(/:/g, '');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validData = useMemo(
    () => data.filter((d) => Number.isFinite(d.value) && d.value > 0),
    [data]
  );
  const total = useMemo(
    () => validData.reduce((acc, d) => acc + d.value, 0) || 1,
    [validData]
  );

  const slices = useMemo(() => {
    let angle = -Math.PI / 2;
    return validData.map((item, idx) => {
      const fraction = item.value / total;
      const startAngle = angle;
      const endAngle = angle + fraction * Math.PI * 2;
      const midAngle = (startAngle + endAngle) / 2;
      angle = endAngle;
      return {
        ...item,
        idx,
        fraction,
        pct: item.persen ?? Math.round(fraction * 100),
        startAngle,
        endAngle,
        midAngle,
      };
    });
  }, [validData, total]);

  const vb = 220;
  const cx = vb / 2;
  const cy = vb / 2 - depth * 0.45;
  const rOuter = 78;
  const rInner = rOuter * innerRadiusRatio;
  const extrusionLayers = Math.max(6, Math.round(depth / 1.8));
  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <div className="pie-3d-stage w-full h-full flex items-center justify-center">
        <svg
          viewBox={`0 0 ${vb} ${vb}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Grafik 3D Pie Chart"
        >
          <defs>
            {slices.map((s) => (
              <linearGradient
                key={`pg-${s.idx}`}
                id={`pie3d-grad-${uid}-${s.idx}`}
                x1="15%"
                y1="0%"
                x2="85%"
                y2="100%"
              >
                <stop offset="0%" stopColor={shadeHex(s.color, 1.32)} />
                <stop offset="52%" stopColor={s.color} />
                <stop offset="100%" stopColor={shadeHex(s.color, 0.72)} />
              </linearGradient>
            ))}
            <radialGradient id={`pie3d-spec-${uid}`} cx="35%" cy="28%" r="68%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
            </radialGradient>
          </defs>

          {/* Ambient Base Disc Shadow */}
          <ellipse
            cx={cx}
            cy={cy + depth + 6}
            rx={rOuter * 0.96}
            ry={rOuter * 0.88}
            fill="rgba(0, 0, 0, 0.42)"
          />

          {slices.map((s) => {
            const isHovered = hoveredIdx === s.idx;
            const popDist = isHovered ? 9 : 0;
            const dx = Math.cos(s.midAngle) * popDist;
            const dy = Math.sin(s.midAngle) * popDist - (isHovered ? 6 : 0);
            const pathD = describeRingSector(cx, cy, rOuter, rInner, s.startAngle, s.endAngle);
            const sideColor = shadeHex(s.color, 0.46);
            const rimColor = shadeHex(s.color, 0.34);

            return (
              <g
                key={s.idx}
                style={{
                  transform: `translate(${dx}px, ${dy}px)`,
                  transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIdx(s.idx)}
                onTouchStart={() =>
                  setHoveredIdx((prev) => (prev === s.idx ? null : s.idx))
                }
                onClick={() => onSliceClick?.(s)}
              >
                {/* Cylindrical 3D Extruded Bottom Layers */}
                {Array.from({ length: extrusionLayers }).map((_, layerIdx) => {
                  const zOffset = depth - (layerIdx * depth) / extrusionLayers;
                  return (
                    <path
                      key={layerIdx}
                      d={pathD}
                      transform={`translate(0, ${zOffset})`}
                      fill={layerIdx === 0 ? rimColor : sideColor}
                      stroke={layerIdx === 0 ? 'rgba(0,0,0,0.45)' : 'none'}
                      strokeWidth={0.6}
                    />
                  );
                })}

                {/* Top Lit Glossy Surface */}
                <path
                  d={pathD}
                  fill={`url(#pie3d-grad-${uid}-${s.idx})`}
                  stroke={isHovered ? '#f3d266' : 'rgba(255,255,255,0.28)'}
                  strokeWidth={isHovered ? 1.8 : 0.9}
                />
                {/* Specular Overlay */}
                <path
                  d={pathD}
                  fill={`url(#pie3d-spec-${uid})`}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Central Extruded 3D Percentage / Score (if provided) */}
      {typeof centerValue === 'number' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-1">
          <Extruded3DValue
            value={centerValue}
            suffix={centerSuffix}
            tone={centerTone}
            className="text-xl sm:text-2xl"
          />
          {centerLabel && (
            <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-200/90 bg-[#03160f]/80 px-1.5 py-0.5 rounded border border-emerald-500/30 mt-0.5">
              {centerLabel}
            </span>
          )}
        </div>
      )}

      {/* Floating Glass Tooltip on Hover / Touch */}
      {activeSlice && (
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-30 min-w-[138px] max-w-[200px] rounded-xl bg-[#03160f]/95 backdrop-blur-xl border border-[#f3d266]/65 px-2.5 py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.85)] text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeSlice.color }}
            />
            <span className="text-[10px] font-bold text-white truncate">
              {activeSlice.name}
            </span>
          </div>
          <p className="text-[11px] font-mono font-extrabold text-[#f3d266] tabular-nums mt-0.5">
            {activeSlice.value.toLocaleString('id-ID')}
            {unit ? ` ${unit}` : ''} ({activeSlice.pct}%)
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. 3D FLOATING LINE CHART (GLOSSY 3D TUBES + DUAL DROP SHADOWS + SPHERE NODES)
// ============================================================================

export interface LineSeries3D {
  key: string;
  label: string;
  color: string;
  accentColor?: string;
  dashed?: boolean;
  areaFill?: boolean;
}

interface LineChart3DProps {
  data: Record<string, any>[];
  xKey: string;
  series: LineSeries3D[];
  height?: number;
  yDomain?: [number, number];
  yUnit?: string;
  tooltipUnit?: string;
  tooltipPrefix?: string;
  subtitle?: string;
}

function buildSmoothSvgPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const LineChart3D: React.FC<LineChart3DProps> = ({
  data,
  xKey,
  series,
  height = 225,
  yDomain,
  yUnit = '',
  tooltipUnit = '',
  tooltipPrefix = '',
  subtitle,
}) => {
  const uid = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(560);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 120) setWidth(el.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const margin = { top: 18, right: 16, bottom: 30, left: 42 };
  const innerW = Math.max(120, width - margin.left - margin.right);
  const innerH = Math.max(90, height - margin.top - margin.bottom);

  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    data.forEach((row) => {
      series.forEach((s) => {
        const v = Number(row[s.key] ?? 0);
        if (Number.isFinite(v)) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });
    if (yDomain) {
      const boundMin = Number.isFinite(min) ? Math.min(yDomain[0], Math.max(0, Math.floor(min - 8))) : yDomain[0];
      const boundMax = Number.isFinite(max) ? Math.max(yDomain[1], Math.ceil(max)) : yDomain[1];
      return { minVal: boundMin, maxVal: boundMax };
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { minVal: 0, maxVal: 100 };
    if (min === max) return { minVal: Math.max(0, min - 5), maxVal: max + 5 };
    const pad = (max - min) * 0.16;
    return { minVal: Math.max(0, Math.floor(min - pad)), maxVal: Math.ceil(max + pad) };
  }, [data, series, yDomain]);

  const yTicks = useMemo(() => {
    const count = 4;
    const step = (maxVal - minVal) / count || 1;
    return Array.from({ length: count + 1 }, (_, i) => minVal + step * i);
  }, [minVal, maxVal]);

  const getX = (idx: number) => {
    if (data.length <= 1) return margin.left + innerW / 2;
    return margin.left + (idx / (data.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return margin.top + innerH - Math.max(0, Math.min(1, ratio)) * innerH;
  };

  const handlePointer = (clientX: number) => {
    const el = containerRef.current;
    if (!el || data.length === 0) return;
    const rect = el.getBoundingClientRect();
    const relX = clientX - rect.left - margin.left;
    const ratio = Math.max(0, Math.min(1, relX / (innerW || 1)));
    const idx = Math.round(ratio * Math.max(0, data.length - 1));
    setActiveIndex(idx);
  };

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-emerald-200/60 font-mono"
        style={{ height }}
      >
        Belum ada data grafik tersedia.
      </div>
    );
  }

  const activeRow = activeIndex !== null ? data[activeIndex] : null;
  const activeX = activeIndex !== null ? getX(activeIndex) : 0;

  return (
    <div className="space-y-2 select-none">
      <div
        ref={containerRef}
        className="relative w-full touch-pan-y"
        style={{ height }}
        onMouseMove={(e) => handlePointer(e.clientX)}
        onMouseLeave={() => setActiveIndex(null)}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointer(e.touches[0].clientX);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointer(e.touches[0].clientX);
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full h-full overflow-visible"
        >
          <defs>
            <filter id={`line3d-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="160%">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
            <filter id={`line3d-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {series.map((s, sIdx) => (
              <React.Fragment key={s.key}>
                <linearGradient id={`l3d-stroke-${uid}-${sIdx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={s.color} />
                  <stop offset="60%" stopColor={s.accentColor || '#f3d266'} />
                  <stop offset="100%" stopColor={s.color} />
                </linearGradient>
                <linearGradient id={`l3d-area-${uid}-${sIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.38} />
                  <stop offset="65%" stopColor={s.color} stopOpacity={0.09} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
                <radialGradient id={`l3d-sphere-${uid}-${sIdx}`} cx="32%" cy="30%" r="68%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor={s.accentColor || s.color} />
                  <stop offset="100%" stopColor={shadeHex(s.color, 0.55)} />
                </radialGradient>
              </React.Fragment>
            ))}
          </defs>

          {/* Horizontal 3D Depth Grid */}
          {yTicks.map((t, i) => {
            const y = getY(t);
            const label =
              t >= 1_000_000
                ? `${(t / 1_000_000).toFixed(1)}Jt`
                : t >= 1000
                ? `${Math.round(t / 1000)}K`
                : `${Math.round(t)}`;
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  x2={margin.left + innerW}
                  y1={y}
                  y2={y}
                  stroke="rgba(52, 211, 153, 0.14)"
                  strokeDasharray="4 4"
                />
                <text
                  x={margin.left - 7}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#a7f3d0"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {label}
                  {yUnit}
                </text>
              </g>
            );
          })}

          {/* Baseline Floor Bar */}
          <line
            x1={margin.left}
            x2={margin.left + innerW}
            y1={margin.top + innerH}
            y2={margin.top + innerH}
            stroke="rgba(212, 175, 55, 0.35)"
            strokeWidth={1.2}
          />

          {/* X-Axis Labels */}
          {data.map((row, idx) => {
            const step = data.length > 8 ? Math.ceil(data.length / 6) : 1;
            if (idx % step !== 0 && idx !== data.length - 1) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={margin.top + innerH + 17}
                textAnchor="middle"
                fill="#d1fae5"
                fontSize="10"
                fontFamily="ui-monospace, monospace"
              >
                {String(row[xKey] ?? '')}
              </text>
            );
          })}

          {/* Series Areas + Dual Drop-Shadow Floating Splines + Glossy 3D Pipes */}
          {series.map((s, sIdx) => {
            const pts = data.map((row, idx) => ({
              x: getX(idx),
              y: getY(Number(row[s.key] ?? 0)),
              val: Number(row[s.key] ?? 0),
            }));
            const lineD = buildSmoothSvgPath(pts);
            const floorY = margin.top + innerH;
            const areaD =
              pts.length > 0
                ? `${lineD} L ${pts[pts.length - 1].x.toFixed(2)} ${floorY} L ${pts[0].x.toFixed(2)} ${floorY} Z`
                : '';

            return (
              <g key={s.key}>
                {s.areaFill !== false && areaD && (
                  <path d={areaD} fill={`url(#l3d-area-${uid}-${sIdx})`} />
                )}

                {/* Dual 3D Drop Shadow Curves Underneath */}
                <path
                  d={lineD}
                  transform="translate(0, 11)"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.58)"
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  filter={`url(#line3d-shadow-${uid})`}
                />
                <path
                  d={lineD}
                  transform="translate(0, 6)"
                  fill="none"
                  stroke={s.color}
                  strokeOpacity={0.28}
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  filter={`url(#line3d-shadow-${uid})`}
                />

                {/* 3D Pipe Dark Under-Rim */}
                <path
                  d={lineD}
                  transform="translate(0, 1.5)"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.55)"
                  strokeWidth={s.dashed ? 3 : 4.5}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                  strokeLinecap="round"
                />

                {/* Main 4px Luminous Pipe */}
                <path
                  d={lineD}
                  fill="none"
                  stroke={`url(#l3d-stroke-${uid}-${sIdx})`}
                  strokeWidth={s.dashed ? 2.6 : 4}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                  strokeLinecap="round"
                  filter={`url(#line3d-glow-${uid})`}
                />

                {/* Specular Top Sheen Highlight */}
                {!s.dashed && (
                  <path
                    d={lineD}
                    transform="translate(0, -1)"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.45)"
                    strokeWidth={1.1}
                    strokeLinecap="round"
                  />
                )}

                {/* Spherical 3D Nodes */}
                {pts.map((pt, pIdx) => {
                  const isLast = pIdx === pts.length - 1;
                  const isHovered = activeIndex === pIdx;
                  return (
                    <g key={pIdx}>
                      {isLast && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={8.5}
                          fill={s.color}
                          className="node-pulse-3d"
                        />
                      )}
                      {/* Sphere Cast Shadow */}
                      <circle
                        cx={pt.x}
                        cy={pt.y + 4}
                        r={isHovered ? 6 : 4.2}
                        fill="rgba(0, 0, 0, 0.5)"
                      />
                      {/* Glossy 3D Sphere */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6.2 : isLast ? 5.2 : 4.4}
                        fill={`url(#l3d-sphere-${uid}-${sIdx})`}
                        stroke="#ffffff"
                        strokeOpacity={isHovered ? 0.95 : 0.45}
                        strokeWidth={isHovered ? 1.5 : 0.8}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Interactive Crosshair Beam */}
          {activeRow && (
            <line
              x1={activeX}
              x2={activeX}
              y1={margin.top}
              y2={margin.top + innerH}
              stroke="#f3d266"
              strokeWidth={1.4}
              strokeDasharray="4 4"
              opacity={0.85}
            />
          )}
        </svg>

        {/* Floating Glass Tooltip */}
        {activeRow && (
          <div
            className="pointer-events-none absolute top-2 z-30 min-w-[165px] max-w-[230px] rounded-xl bg-[#03160f]/95 backdrop-blur-xl border border-[#f3d266]/65 p-2.5 shadow-[0_14px_30px_rgba(0,0,0,0.85)] text-[11px] font-mono space-y-1"
            style={{
              left: activeX > width * 0.55 ? '10px' : undefined,
              right: activeX > width * 0.55 ? undefined : '10px',
            }}
          >
            <div className="border-b border-emerald-800/70 pb-1">
              <p className="font-extrabold text-[#f3d266]">{String(activeRow[xKey])}</p>
              {subtitle && <p className="text-[9px] text-emerald-200/70">{subtitle}</p>}
            </div>
            {series.map((s) => {
              const raw = Number(activeRow[s.key] ?? 0);
              const valText = tooltipPrefix
                ? `${tooltipPrefix}${raw.toLocaleString('id-ID')}${tooltipUnit}`
                : `${raw.toLocaleString('id-ID')}${tooltipUnit}`;
              return (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-emerald-100/90 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="font-bold text-white tabular-nums shrink-0">{valText}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compact Responsive 3D Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] font-mono">
        {series.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#03160f]/80 border border-emerald-700/40 text-emerald-100"
          >
            <span
              className="w-3 h-1.5 rounded-full inline-block"
              style={{
                background: s.color,
                boxShadow: `0 0 8px ${s.color}`,
              }}
            />
            <span>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. 3D ISOMETRIC BAR CHART (GROUPED & STACKED PILLARS + UPWARD ANIMATION)
// ============================================================================

export interface BarSeries3D {
  key: string;
  label: string;
  color: string;
}

interface BarChart3DProps {
  data: Record<string, any>[];
  xKey: string;
  series: BarSeries3D[];
  stacked?: boolean;
  height?: number;
  unit?: string;
  valuePrefix?: string;
}

export const BarChart3D: React.FC<BarChart3DProps> = ({
  data,
  xKey,
  series,
  stacked = false,
  height = 235,
  unit = '',
  valuePrefix = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(560);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 120) setWidth(el.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const margin = { top: 24, right: 18, bottom: 34, left: 42 };
  const innerW = Math.max(120, width - margin.left - margin.right);
  const innerH = Math.max(90, height - margin.top - margin.bottom);

  const maxY = useMemo(() => {
    let m = 0;
    data.forEach((row) => {
      if (stacked) {
        const sum = series.reduce((acc, s) => acc + Math.max(0, Number(row[s.key] ?? 0)), 0);
        if (sum > m) m = sum;
      } else {
        series.forEach((s) => {
          const v = Math.max(0, Number(row[s.key] ?? 0));
          if (v > m) m = v;
        });
      }
    });
    return m > 0 ? Math.ceil(m * 1.15) : 10;
  }, [data, series, stacked]);

  const yTicks = useMemo(() => {
    const count = 4;
    const step = maxY / count || 1;
    return Array.from({ length: count + 1 }, (_, i) => step * i);
  }, [maxY]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-emerald-200/60 font-mono"
        style={{ height }}
      >
        Belum ada data diagram tersedia.
      </div>
    );
  }

  const slotW = innerW / data.length;
  const isoDx = Math.min(9, Math.max(4, slotW * 0.1));
  const isoDy = Math.round(isoDx * 0.65);

  const renderIsoPillar = (
    x: number,
    yTop: number,
    w: number,
    h: number,
    fillFrontId: string,
    fillTopId: string,
    color: string,
    isActive: boolean,
    delayMs: number,
    keyId: string
  ) => {
    if (h <= 0.5) return null;
    const dx = Math.min(isoDx, w * 0.42);
    const dy = Math.round(dx * 0.65);
    const yBottom = yTop + h;

    const topPoints = `${x},${yTop} ${x + dx},${yTop - dy} ${x + w + dx},${yTop - dy} ${x + w},${yTop}`;
    const rightPoints = `${x + w},${yTop} ${x + w + dx},${yTop - dy} ${x + w + dx},${yBottom - dy} ${x + w},${yBottom}`;

    return (
      <g
        key={keyId}
        className="bar-3d-grow"
        style={{ animationDelay: `${delayMs}ms` }}
      >
        {/* Floor Cast Shadow */}
        <polygon
          points={`${x + 3},${yBottom + 2} ${x + w + dx + 4},${yBottom + 2} ${x + w + dx + 8},${yBottom - dy + 4} ${x + dx},${yBottom - dy + 4}`}
          fill="rgba(0,0,0,0.42)"
        />
        {/* Front Illuminated Face */}
        <rect
          x={x}
          y={yTop}
          width={w}
          height={h}
          fill={`url(#${fillFrontId})`}
          stroke={isActive ? '#ffffff' : 'rgba(255,255,255,0.22)'}
          strokeWidth={isActive ? 1.2 : 0.6}
        />
        {/* Shaded Right Isometric Wall */}
        <polygon
          points={rightPoints}
          fill={shadeHex(color, 0.48)}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={0.5}
        />
        {/* Bright Lit Top Parallelogram Cap */}
        <polygon
          points={topPoints}
          fill={`url(#${fillTopId})`}
          stroke="rgba(255,255,255,0.38)"
          strokeWidth={0.7}
        />
      </g>
    );
  };

  const hoveredRow = hoveredCol !== null ? data[hoveredCol] : null;
  const hoveredCenterX = hoveredCol !== null ? margin.left + hoveredCol * slotW + slotW / 2 : 0;

  return (
    <div className="space-y-2 select-none">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height }}
        onMouseLeave={() => setHoveredCol(null)}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full h-full overflow-visible"
        >
          <defs>
            {series.map((s, sIdx) => (
              <React.Fragment key={s.key}>
                <linearGradient id={`b3d-front-${uid}-${sIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={shadeHex(s.color, 1.18)} />
                  <stop offset="55%" stopColor={s.color} />
                  <stop offset="100%" stopColor={shadeHex(s.color, 0.68)} />
                </linearGradient>
                <linearGradient id={`b3d-top-${uid}-${sIdx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={shadeHex(s.color, 1.48)} />
                  <stop offset="100%" stopColor={shadeHex(s.color, 1.15)} />
                </linearGradient>
              </React.Fragment>
            ))}
            {series.length === 1 &&
              data.map((row, colIdx) => {
                if (typeof row.color !== 'string') return null;
                return (
                  <React.Fragment key={`rc-${colIdx}`}>
                    <linearGradient id={`b3d-front-${uid}-row-${colIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={shadeHex(row.color, 1.18)} />
                      <stop offset="55%" stopColor={row.color} />
                      <stop offset="100%" stopColor={shadeHex(row.color, 0.68)} />
                    </linearGradient>
                    <linearGradient id={`b3d-top-${uid}-row-${colIdx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={shadeHex(row.color, 1.48)} />
                      <stop offset="100%" stopColor={shadeHex(row.color, 1.15)} />
                    </linearGradient>
                  </React.Fragment>
                );
              })}
          </defs>

          {/* 3D Floor Plane */}
          <polygon
            points={`${margin.left},${margin.top + innerH} ${margin.left + innerW},${margin.top + innerH} ${margin.left + innerW + isoDx},${margin.top + innerH - isoDy} ${margin.left + isoDx},${margin.top + innerH - isoDy}`}
            fill="rgba(16, 185, 129, 0.08)"
            stroke="rgba(212, 175, 55, 0.3)"
            strokeWidth={0.8}
          />

          {/* Horizontal Grid Lines */}
          {yTicks.map((t, i) => {
            const y = margin.top + innerH - (t / maxY) * innerH;
            const label =
              t >= 1_000_000
                ? `${(t / 1_000_000).toFixed(1)}Jt`
                : t >= 1000
                ? `${Math.round(t / 1000)}K`
                : `${Math.round(t)}`;
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  x2={margin.left + innerW}
                  y1={y}
                  y2={y}
                  stroke="rgba(52, 211, 153, 0.14)"
                  strokeDasharray="4 4"
                />
                <text
                  x={margin.left - 7}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#a7f3d0"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Isometric 3D Pillars */}
          {data.map((row, colIdx) => {
            const colX = margin.left + colIdx * slotW;
            const isHovered = hoveredCol === colIdx;
            const labelText = String(row[xKey] ?? '');
            const truncated =
              data.length > 6 && labelText.length > 8
                ? `${labelText.slice(0, 7)}..`
                : labelText.length > 14
                ? `${labelText.slice(0, 12)}..`
                : labelText;

            if (stacked) {
              const pillarW = Math.min(34, Math.max(12, slotW * 0.48));
              const x = colX + (slotW - pillarW) / 2 - isoDx * 0.35;
              let accY = margin.top + innerH;

              return (
                <g
                  key={colIdx}
                  onMouseEnter={() => setHoveredCol(colIdx)}
                  onTouchStart={() => setHoveredCol(colIdx)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={colX}
                    y={margin.top}
                    width={slotW}
                    height={innerH}
                    fill={isHovered ? 'rgba(212, 175, 55, 0.06)' : 'transparent'}
                  />
                  {series.map((s, sIdx) => {
                    const val = Math.max(0, Number(row[s.key] ?? 0));
                    const segH = (val / maxY) * innerH;
                    const yTop = accY - segH;
                    accY = yTop;
                    return renderIsoPillar(
                      x,
                      yTop,
                      pillarW,
                      segH,
                      `b3d-front-${uid}-${sIdx}`,
                      `b3d-top-${uid}-${sIdx}`,
                      s.color,
                      isHovered,
                      colIdx * 45 + sIdx * 20,
                      `${colIdx}-${sIdx}`
                    );
                  })}
                  <text
                    x={colX + slotW / 2}
                    y={margin.top + innerH + 17}
                    textAnchor="middle"
                    fill={isHovered ? '#f3d266' : '#d1fae5'}
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                    fontWeight={isHovered ? '700' : '500'}
                  >
                    {truncated}
                  </text>
                </g>
              );
            }

            // Grouped 3D Pillars
            const groupPad = Math.max(6, slotW * 0.16);
            const gap = series.length > 1 ? 4 : 0;
            const usableW = Math.max(12, slotW - groupPad * 2 - gap * (series.length - 1));
            const pillarW = Math.min(34, Math.max(8, usableW / series.length));
            const totalBarsW = pillarW * series.length + gap * (series.length - 1);
            const startX = colX + (slotW - totalBarsW) / 2 - isoDx * 0.3;

            return (
              <g
                key={colIdx}
                onMouseEnter={() => setHoveredCol(colIdx)}
                onTouchStart={() => setHoveredCol(colIdx)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={colX}
                  y={margin.top}
                  width={slotW}
                  height={innerH}
                  fill={isHovered ? 'rgba(212, 175, 55, 0.06)' : 'transparent'}
                />
                {series.map((s, sIdx) => {
                  const val = Math.max(0, Number(row[s.key] ?? 0));
                  const barH = (val / maxY) * innerH;
                  const yTop = margin.top + innerH - barH;
                  const bx = startX + sIdx * (pillarW + gap);
                  const hasCustomRowColor = series.length === 1 && typeof row.color === 'string';
                  const barColor = hasCustomRowColor ? row.color : s.color;
                  const fillFrontId = hasCustomRowColor
                    ? `b3d-front-${uid}-row-${colIdx}`
                    : `b3d-front-${uid}-${sIdx}`;
                  const fillTopId = hasCustomRowColor
                    ? `b3d-top-${uid}-row-${colIdx}`
                    : `b3d-top-${uid}-${sIdx}`;

                  return (
                    <React.Fragment key={sIdx}>
                      {renderIsoPillar(
                        bx,
                        yTop,
                        pillarW,
                        barH,
                        fillFrontId,
                        fillTopId,
                        barColor,
                        isHovered,
                        colIdx * 45 + sIdx * 30,
                        `${colIdx}-${sIdx}`
                      )}
                      {series.length === 1 && data.length <= 6 && (
                        <text
                          x={bx + pillarW / 2 + isoDx * 0.3}
                          y={Math.max(12, yTop - isoDy - 6)}
                          textAnchor="middle"
                          fill={isHovered ? '#f3d266' : shadeHex(barColor, 1.3)}
                          fontSize="11"
                          fontFamily="ui-monospace, monospace"
                          fontWeight="800"
                        >
                          {val}
                        </text>
                      )}
                    </React.Fragment>
                  );
                })}
                <text
                  x={colX + slotW / 2}
                  y={margin.top + innerH + 17}
                  textAnchor="middle"
                  fill={isHovered ? '#f3d266' : '#d1fae5'}
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {truncated}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Glass Tooltip */}
        {hoveredRow && (
          <div
            className="pointer-events-none absolute top-2 z-30 min-w-[165px] max-w-[240px] rounded-xl bg-[#03160f]/95 backdrop-blur-xl border border-[#f3d266]/65 p-2.5 shadow-[0_14px_30px_rgba(0,0,0,0.85)] text-[11px] font-mono space-y-1"
            style={{
              left: hoveredCenterX > width * 0.55 ? '10px' : undefined,
              right: hoveredCenterX > width * 0.55 ? undefined : '10px',
            }}
          >
            <p className="font-extrabold text-[#f3d266] border-b border-emerald-800/70 pb-1 truncate">
              {String(hoveredRow[xKey])}
            </p>
            {series.map((s) => {
              const val = Number(hoveredRow[s.key] ?? 0);
              const dotColor = series.length === 1 && typeof hoveredRow.color === 'string' ? hoveredRow.color : s.color;
              return (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-emerald-100/90 truncate">
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="font-bold text-white tabular-nums shrink-0">
                    {valuePrefix}
                    {val.toLocaleString('id-ID')}
                    {unit}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3D Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] font-mono">
        {series.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#03160f]/80 border border-emerald-700/40 text-emerald-100"
          >
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${shadeHex(s.color, 1.3)}, ${s.color})`,
              }}
            />
            <span>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
