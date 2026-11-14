import React from 'react';

export interface GlowingDotProps {
  cx?: number;
  cy?: number;
  stroke?: string;
  fill?: string;
  value?: number;
  payload?: any;
  color?: string;
  accentColor?: string;
}

/**
 * Custom Glowing Data Point (Soft Neon Halo + Core Dot)
 */
export const GlowingDot: React.FC<GlowingDotProps> = ({
  cx,
  cy,
  color = '#10b981',
  accentColor = '#f3d266',
}) => {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g className="transition-transform duration-300 ease-out">
      {/* Outer Soft Glow Halo */}
      <circle
        cx={cx}
        cy={cy}
        r={9}
        fill={color}
        fillOpacity={0.22}
        style={{ filter: 'blur(2px)' }}
      />
      {/* Mid Ring */}
      <circle
        cx={cx}
        cy={cy}
        r={5.5}
        fill="#03150e"
        stroke={color}
        strokeWidth={2.5}
      />
      {/* Inner Bright Core */}
      <circle cx={cx} cy={cy} r={2.5} fill={accentColor} />
    </g>
  );
};

/**
 * Custom Active Glowing Data Point when hovered / touched (scales up smoothly with pulse halo)
 */
export const GlowingActiveDot: React.FC<GlowingDotProps> = ({
  cx,
  cy,
  color = '#10b981',
  accentColor = '#f3d266',
}) => {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      {/* Large Soft Neon Aura */}
      <circle
        cx={cx}
        cy={cy}
        r={15}
        fill={color}
        fillOpacity={0.28}
        style={{ filter: 'blur(3px)' }}
      />
      {/* Glowing Ring */}
      <circle
        cx={cx}
        cy={cy}
        r={9}
        fill={color}
        fillOpacity={0.35}
        stroke={accentColor}
        strokeWidth={1.5}
      />
      {/* Crisp Core */}
      <circle
        cx={cx}
        cy={cy}
        r={5.5}
        fill={accentColor}
        stroke="#02100a"
        strokeWidth={2}
      />
    </g>
  );
};

export interface LuxuryTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
  valuePrefix?: string;
  subtitle?: string;
}

/**
 * Interactive Luxury Glassmorphic Tooltip for Line Charts
 */
export const LuxuryChartTooltip: React.FC<LuxuryTooltipProps> = ({
  active,
  payload,
  label,
  unit = '%',
  valuePrefix = '',
  subtitle,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  // Deduplicate entries when Area and Line share the same dataKey
  const uniqueEntries = payload.filter(
    (entry, index, self) =>
      index === self.findIndex((e) => e.dataKey === entry.dataKey)
  );

  return (
    <div className="rounded-2xl bg-[#02120b]/95 backdrop-blur-md border border-[#d4af37]/65 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(16,185,129,0.22)] min-w-[180px] pointer-events-none">
      <div className="flex items-center justify-between gap-3 pb-1.5 mb-2 border-b border-emerald-800/60">
        <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#f3d266]">
          Periode: {label}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
      </div>
      {subtitle && (
        <p className="text-[10px] text-emerald-300/80 mb-1.5">{subtitle}</p>
      )}
      <div className="space-y-1.5">
        {uniqueEntries.map((item, idx) => {
          const dotColor =
            item.color && !String(item.color).startsWith('url(')
              ? item.color
              : idx === 0
                ? '#10b981'
                : '#f3d266';
          const formattedVal =
            typeof item.value === 'number'
              ? item.value.toLocaleString('id-ID')
              : item.value;
          return (
            <div
              key={`${item.dataKey}-${idx}`}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: dotColor,
                    boxShadow: `0 0 8px ${dotColor}`,
                  }}
                />
                <span className="text-emerald-100/90 font-medium">
                  {item.name || item.dataKey}
                </span>
              </div>
              <span className="font-mono font-extrabold text-white">
                {valuePrefix}
                {formattedVal}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
