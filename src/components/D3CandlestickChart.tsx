import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Radio,
  Crosshair,
} from 'lucide-react';
import { OhlcCandle, CandlestickTimeframe } from '../utils/financeCandlestick';

interface D3CandlestickChartProps {
  candlesBulanan: OhlcCandle[];
  candlesMingguan: OhlcCandle[];
  candlesHarian: OhlcCandle[];
  thresholds: {
    darurat: number;
    stabil: number;
    perkembanganPesat: number;
  };
  height?: number;
  compact?: boolean;
}

export const D3CandlestickChart: React.FC<D3CandlestickChartProps> = ({
  candlesBulanan,
  candlesMingguan,
  candlesHarian,
  thresholds,
  height = 360,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const [timeframe, setTimeframe] = useState<CandlestickTimeframe>('bulanan');
  const [containerWidth, setContainerWidth] = useState<number>(820);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredCandle, setHoveredCandle] = useState<{
    candle: OhlcCandle;
    xPx: number;
    yPx: number;
    pointerPrice: number;
  } | null>(null);

  const activeCandles = useMemo(() => {
    if (timeframe === 'harian') return candlesHarian.length > 0 ? candlesHarian : candlesBulanan;
    if (timeframe === 'mingguan') return candlesMingguan.length > 0 ? candlesMingguan : candlesBulanan;
    return candlesBulanan;
  }, [timeframe, candlesBulanan, candlesMingguan, candlesHarian]);

  // Observe container resize so D3 SVG scales smoothly across desktop, tablet, and mobile
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 120) setContainerWidth(w);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset zoom when timeframe changes
  useEffect(() => {
    currentTransformRef.current = d3.zoomIdentity;
    setZoomLevel(1);
    setHoveredCandle(null);
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  }, [timeframe]);

  // Render D3 Trader Candlestick Chart
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || activeCandles.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const margin = {
      top: 22,
      right: compact ? 58 : 70,
      bottom: 36,
      left: 14,
    };
    const width = Math.max(300, containerWidth);
    const innerWidth = Math.max(180, width - margin.left - margin.right);
    const innerHeight = Math.max(180, height - margin.top - margin.bottom);

    // Compute Y domain encompassing all candles + all 3 threshold bands
    const dataMin = d3.min(activeCandles, (d) => Math.min(d.low, d.open, d.close)) ?? 0;
    const dataMax = d3.max(activeCandles, (d) => Math.max(d.high, d.open, d.close)) ?? 40;
    const yMin = Math.min(0, Math.floor(dataMin - 3));
    const yMax = Math.max(thresholds.perkembanganPesat + 8, Math.ceil(dataMax + 5));

    const xBase = d3
      .scaleLinear()
      .domain([-0.6, activeCandles.length - 0.4])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0]);

    const defs = svg.append('defs');

    // Clip path so candles, bands, and crosshairs stay neatly inside the trading plot
    defs
      .append('clipPath')
      .attr('id', 'd3-candle-plot-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Bullish & Bearish 3D volumetric gradients (bright left face -> rich mid -> shaded right)
    const bullGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-bull-candle-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '15%');
    bullGrad.append('stop').attr('offset', '0%').attr('stop-color', '#a7f3d0');
    bullGrad.append('stop').attr('offset', '45%').attr('stop-color', '#10b981');
    bullGrad.append('stop').attr('offset', '100%').attr('stop-color', '#065f46');

    const bearGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-bear-candle-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '15%');
    bearGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fecdd3');
    bearGrad.append('stop').attr('offset', '45%').attr('stop-color', '#f43f5e');
    bearGrad.append('stop').attr('offset', '100%').attr('stop-color', '#881337');

    // Dark right-side 3D extrusion gradients
    const bullSideGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-bull-side-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    bullSideGrad.append('stop').attr('offset', '0%').attr('stop-color', '#047857');
    bullSideGrad.append('stop').attr('offset', '100%').attr('stop-color', '#022c22');

    const bearSideGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-bear-side-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    bearSideGrad.append('stop').attr('offset', '0%').attr('stop-color', '#be123c');
    bearSideGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4c0519');

    // Soft neon glow filter for wicks, 3D live markers & neon price line
    const glowFilter = defs
      .append('filter')
      .attr('id', 'd3-trader-glow')
      .attr('x', '-25%')
      .attr('y', '-25%')
      .attr('width', '150%')
      .attr('height', '150%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2.8').attr('result', 'blur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Dark trading terminal background
    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 14)
      .attr('fill', '#010a06');

    const rootG = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 1. DISTINCT VISUAL THRESHOLD BANDS (Perkembangan Pesat / Stabil / Darurat)
    const clippedLayer = rootG.append('g').attr('clip-path', 'url(#d3-candle-plot-clip)');
    const bandsLayer = clippedLayer.append('g').attr('class', 'threshold-bands');

    const yTopVal = yScale.domain()[1];
    const yBotVal = yScale.domain()[0];

    const yGrow = yScale(thresholds.perkembanganPesat);
    const yStabil = yScale(thresholds.stabil);
    const yDarurat = yScale(thresholds.darurat);
    const yPlotTop = yScale(yTopVal);
    const yPlotBottom = yScale(yBotVal);

    // Pita Perkembangan Pesat (Grow Zone: >= perkembanganPesat)
    if (yGrow > yPlotTop) {
      bandsLayer
        .append('rect')
        .attr('x', 0)
        .attr('y', yPlotTop)
        .attr('width', innerWidth)
        .attr('height', Math.max(0, yGrow - yPlotTop))
        .attr('fill', 'rgba(16, 185, 129, 0.12)');
    }

    // Pita Zona Stabil (antara stabil hingga perkembanganPesat)
    if (yStabil > yGrow) {
      bandsLayer
        .append('rect')
        .attr('x', 0)
        .attr('y', yGrow)
        .attr('width', innerWidth)
        .attr('height', Math.max(0, yStabil - yGrow))
        .attr('fill', 'rgba(212, 175, 55, 0.08)');
    }

    // Pita Zona Waspada (antara darurat hingga stabil)
    if (yDarurat > yStabil) {
      bandsLayer
        .append('rect')
        .attr('x', 0)
        .attr('y', yStabil)
        .attr('width', innerWidth)
        .attr('height', Math.max(0, yDarurat - yStabil))
        .attr('fill', 'rgba(245, 158, 11, 0.05)');
    }

    // Pita Zona Darurat (<= darurat)
    if (yPlotBottom > yDarurat) {
      bandsLayer
        .append('rect')
        .attr('x', 0)
        .attr('y', yDarurat)
        .attr('width', innerWidth)
        .attr('height', Math.max(0, yPlotBottom - yDarurat))
        .attr('fill', 'rgba(244, 63, 94, 0.14)');
    }

    // Subtle trader grid lines
    const gridLayer = clippedLayer.append('g').attr('class', 'trader-grid');
    const yTicks = yScale.ticks(6);
    yTicks.forEach((tickVal) => {
      gridLayer
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(tickVal))
        .attr('y2', yScale(tickVal))
        .attr('stroke', 'rgba(16, 185, 129, 0.11)')
        .attr('stroke-width', 1);
    });

    const vGridLayer = clippedLayer.append('g').attr('class', 'trader-vgrid');

    // Threshold Dashed Glowing Boundary Lines + Zone Labels
    const thresholdDefs = [
      {
        val: thresholds.perkembanganPesat,
        y: yGrow,
        color: '#34d399',
        bg: '#022c22',
        label: `▲ PERKEMBANGAN PESAT (GROW >= Rp ${thresholds.perkembanganPesat} Jt)`,
        shortTag: `GROW ${thresholds.perkembanganPesat}Jt`,
      },
      {
        val: thresholds.stabil,
        y: yStabil,
        color: '#f3d266',
        bg: '#231b04',
        label: `◆ ZONA STABIL (Rp ${thresholds.stabil} Jt)`,
        shortTag: `STABIL ${thresholds.stabil}Jt`,
      },
      {
        val: thresholds.darurat,
        y: yDarurat,
        color: '#fb7185',
        bg: '#2d0611',
        label: `▼ ZONA DARURAT (<= Rp ${thresholds.darurat} Jt)`,
        shortTag: `DARURAT ${thresholds.darurat}Jt`,
      },
    ];

    thresholdDefs.forEach((th) => {
      bandsLayer
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', th.y)
        .attr('y2', th.y)
        .attr('stroke', th.color)
        .attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '6 4')
        .attr('filter', 'url(#d3-trader-glow)');

      // Inline badge on left side of band line
      const pillGroup = bandsLayer
        .append('g')
        .attr('transform', `translate(8, ${Math.max(14, th.y - 8)})`);

      const textNode = pillGroup
        .append('text')
        .attr('x', 7)
        .attr('y', 0)
        .attr('dy', '0.32em')
        .attr('fill', th.color)
        .attr('font-size', compact ? '9px' : '10px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('font-weight', '700')
        .text(compact ? th.shortTag : th.label);

      const bbox = textNode.node()?.getBBox();
      if (bbox) {
        pillGroup
          .insert('rect', 'text')
          .attr('x', 0)
          .attr('y', bbox.y - 3)
          .attr('width', bbox.width + 14)
          .attr('height', bbox.height + 6)
          .attr('rx', 5)
          .attr('fill', th.bg)
          .attr('stroke', th.color)
          .attr('stroke-width', 0.9)
          .attr('opacity', 0.92);
      }
    });

    // Dynamic layers updated by zoom/pan
    const candlesLayer = clippedLayer.append('g').attr('class', 'candles-layer');
    const latestPriceLineLayer = clippedLayer.append('g').attr('class', 'latest-price-line');

    // Axes groups
    const xAxisGroup = rootG
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .attr('class', 'x-axis');

    const yAxisGroup = rootG
      .append('g')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .attr('class', 'y-axis');

    const yAxis = d3
      .axisRight(yScale)
      .ticks(6)
      .tickFormat((d) => `${Number(d).toFixed(0)} Jt`);

    yAxisGroup
      .call(yAxis)
      .call((g) => g.select('.domain').attr('stroke', 'rgba(16, 185, 129, 0.35)'))
      .call((g) => g.selectAll('.tick line').attr('stroke', 'rgba(16, 185, 129, 0.25)'))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', '#6ee7b7')
          .attr('font-size', '10px')
          .attr('font-family', 'ui-monospace, monospace')
      );

    // Interactive Crosshair (Garis Bidik) Layer
    const crosshairLayer = rootG.append('g').attr('class', 'crosshair-layer').style('display', 'none');

    const crosshairV = crosshairLayer
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#f3d266')
      .attr('stroke-width', 1.1)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.85);

    const crosshairH = crosshairLayer
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('stroke', '#f3d266')
      .attr('stroke-width', 1.1)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.85);

    const crosshairHighlightRing = crosshairLayer
      .append('rect')
      .attr('rx', 4)
      .attr('fill', 'none')
      .attr('stroke', '#f3d266')
      .attr('stroke-width', 1.5);

    // Right-axis price pill for crosshair
    const priceTagG = crosshairLayer.append('g');
    const priceTagRect = priceTagG
      .append('rect')
      .attr('x', innerWidth + 2)
      .attr('y', -10)
      .attr('width', margin.right - 6)
      .attr('height', 20)
      .attr('rx', 4)
      .attr('fill', '#d4af37');
    const priceTagText = priceTagG
      .append('text')
      .attr('x', innerWidth + (margin.right - 4) / 2)
      .attr('y', 3)
      .attr('text-anchor', 'middle')
      .attr('fill', '#02100a')
      .attr('font-size', '9.5px')
      .attr('font-weight', '800')
      .attr('font-family', 'ui-monospace, monospace');

    // Bottom-axis period pill for crosshair
    const periodTagG = crosshairLayer.append('g');
    const periodTagRect = periodTagG
      .append('rect')
      .attr('y', innerHeight + 4)
      .attr('height', 20)
      .attr('rx', 4)
      .attr('fill', '#10b981');
    const periodTagText = periodTagG
      .append('text')
      .attr('y', innerHeight + 17)
      .attr('text-anchor', 'middle')
      .attr('fill', '#02100a')
      .attr('font-size', '9.5px')
      .attr('font-weight', '800')
      .attr('font-family', 'ui-monospace, monospace');

    // Latest Close Price Neon Floating Marker Line on Right Axis
    const lastCandle = activeCandles[activeCandles.length - 1];
    if (lastCandle) {
      const yLast = yScale(lastCandle.close);
      const isLastBull = lastCandle.close >= lastCandle.open;
      const neonColor = isLastBull ? '#34d399' : '#fb7185';
      latestPriceLineLayer
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yLast)
        .attr('y2', yLast)
        .attr('stroke', neonColor)
        .attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '5 3')
        .attr('filter', 'url(#d3-trader-glow)')
        .attr('opacity', 0.92);

      const lastBadge = rootG.append('g').attr('transform', `translate(${innerWidth + 2}, ${yLast - 10})`);
      lastBadge
        .append('rect')
        .attr('width', margin.right - 6)
        .attr('height', 20)
        .attr('rx', 5)
        .attr('fill', isLastBull ? '#059669' : '#e11d48')
        .attr('stroke', '#f3d266')
        .attr('stroke-width', 1.1)
        .attr('filter', 'url(#d3-trader-glow)');
      lastBadge
        .append('text')
        .attr('x', (margin.right - 6) / 2)
        .attr('y', 13.5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '9.5px')
        .attr('font-weight', '800')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`${lastCandle.close.toFixed(1)}Jt`);
    }

    // Draw function used initially and on zoom/pan updates
    const renderAtTransform = (transform: d3.ZoomTransform) => {
      const zx = transform.rescaleX(xBase);

      // Compute visible candle width dynamically based on spacing
      const unitPx = Math.abs(zx(1) - zx(0));
      const candleWidth = Math.max(8, Math.min(54, unitPx * 0.56));

      // Vertical grid lines aligned to candle indices
      vGridLayer.selectAll('*').remove();
      activeCandles.forEach((_, idx) => {
        const cx = zx(idx);
        if (cx >= -20 && cx <= innerWidth + 20) {
          vGridLayer
            .append('line')
            .attr('x1', cx)
            .attr('x2', cx)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', 'rgba(16, 185, 129, 0.08)')
            .attr('stroke-width', 1);
        }
      });

      // X-Axis ticks at integer candle indices
      const tickIndices = activeCandles
        .map((_, idx) => idx)
        .filter((idx) => {
          const cx = zx(idx);
          return cx >= 0 && cx <= innerWidth;
        });

      const stepEvery = Math.max(1, Math.ceil((tickIndices.length * 64) / innerWidth));
      const filteredTicks = tickIndices.filter((_, i) => i % stepEvery === 0);

      const xAxis = d3
        .axisBottom(zx)
        .tickValues(filteredTicks)
        .tickFormat((idx) => activeCandles[Math.round(Number(idx))]?.periode || '');

      xAxisGroup
        .call(xAxis)
        .call((g) => g.select('.domain').attr('stroke', 'rgba(212, 175, 55, 0.3)'))
        .call((g) => g.selectAll('.tick line').attr('stroke', 'rgba(212, 175, 55, 0.25)'))
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('fill', '#d1fae5')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .attr('font-family', 'ui-monospace, monospace')
        );

      // Candles
      candlesLayer.selectAll('*').remove();
      const candleGroups = candlesLayer
        .selectAll('g.candle-node')
        .data(activeCandles)
        .enter()
        .append('g')
        .attr('class', 'candle-node');

      candleGroups.each(function (d, idx) {
        const g = d3.select(this);
        const cx = zx(idx);
        if (cx < -candleWidth || cx > innerWidth + candleWidth) return;

        const isBull = d.close >= d.open;
        const yHigh = yScale(d.high);
        const yLow = yScale(d.low);
        const yOpen = yScale(d.open);
        const yClose = yScale(d.close);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyBottom = Math.max(yOpen, yClose);
        const bodyHeight = Math.max(6, bodyBottom - bodyTop);

        const depthX = Math.max(3, Math.min(7.5, candleWidth * 0.24));
        const depthY = Math.round(depthX * 0.55);
        const frontW = Math.max(5, candleWidth - depthX * 0.45);
        const xLeft = cx - frontW / 2 - depthX * 0.2;
        const xRight = xLeft + frontW;

        // 3D Ambient Shadow Behind Candle
        g.append('rect')
          .attr('x', xLeft + 3)
          .attr('y', bodyTop + 3)
          .attr('width', frontW + depthX)
          .attr('height', bodyHeight)
          .attr('rx', 2)
          .attr('fill', 'rgba(0, 0, 0, 0.52)');

        // Glowing Sharp Wick
        g.append('line')
          .attr('x1', xLeft + frontW / 2)
          .attr('x2', xLeft + frontW / 2)
          .attr('y1', yHigh)
          .attr('y2', yLow)
          .attr('stroke', isBull ? '#6ee7b7' : '#fda4af')
          .attr('stroke-width', 2.2)
          .attr('stroke-linecap', 'round')
          .attr('filter', 'url(#d3-trader-glow)');

        // 3D Bright Front / Left Cylindrical Face
        g.append('rect')
          .attr('x', xLeft)
          .attr('y', bodyTop)
          .attr('width', frontW)
          .attr('height', bodyHeight)
          .attr('rx', 1.5)
          .attr('fill', isBull ? 'url(#d3-bull-candle-grad)' : 'url(#d3-bear-candle-grad)')
          .attr('stroke', isBull ? '#a7f3d0' : '#fecdd3')
          .attr('stroke-width', d.isLive ? 1.2 : 0.75);

        // 3D Shaded Right Extrusion Wall
        g.append('polygon')
          .attr(
            'points',
            `${xRight},${bodyTop} ${xRight + depthX},${bodyTop - depthY} ${xRight + depthX},${bodyBottom - depthY} ${xRight},${bodyBottom}`
          )
          .attr('fill', isBull ? 'url(#d3-bull-side-grad)' : 'url(#d3-bear-side-grad)')
          .attr('stroke', 'rgba(0,0,0,0.45)')
          .attr('stroke-width', 0.6);

        // 3D Bright Lit Top Cap
        g.append('polygon')
          .attr(
            'points',
            `${xLeft},${bodyTop} ${xLeft + depthX},${bodyTop - depthY} ${xRight + depthX},${bodyTop - depthY} ${xRight},${bodyTop}`
          )
          .attr('fill', isBull ? '#a7f3d0' : '#fecdd3')
          .attr('stroke', 'rgba(255,255,255,0.4)')
          .attr('stroke-width', 0.6);

        // Left Specular Edge Highlight
        g.append('line')
          .attr('x1', xLeft + 1)
          .attr('x2', xLeft + 1)
          .attr('y1', bodyTop + 1)
          .attr('y2', bodyBottom - 1)
          .attr('stroke', 'rgba(255, 255, 255, 0.45)')
          .attr('stroke-width', 1);

        // Live Neon Pulsing Beacon on Latest Live Candle
        if (idx === activeCandles.length - 1) {
          g.append('circle')
            .attr('cx', xLeft + frontW / 2)
            .attr('cy', Math.max(8, yHigh - 8))
            .attr('r', 7)
            .attr('fill', isBull ? '#10b981' : '#f43f5e')
            .attr('class', 'node-pulse-3d');

          g.append('circle')
            .attr('cx', xLeft + frontW / 2)
            .attr('cy', Math.max(8, yHigh - 8))
            .attr('r', 3.4)
            .attr('fill', '#f3d266')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .attr('filter', 'url(#d3-trader-glow)');
        }
      });
    };

    renderAtTransform(currentTransformRef.current);

    // Setup D3 Zoom & Pan
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.85, 6])
      .translateExtent([
        [-innerWidth * 0.25, 0],
        [innerWidth * 1.25, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('zoom', (event) => {
        currentTransformRef.current = event.transform;
        setZoomLevel(Number(event.transform.k.toFixed(2)));
        renderAtTransform(event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;

    // Interactive Pointer Overlay inside rootG for accurate Crosshair + Zoom
    const interactionRect = rootG
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    svg.call(zoomBehavior).on('dblclick.zoom', null);
    if (currentTransformRef.current !== d3.zoomIdentity) {
      svg.call(zoomBehavior.transform, currentTransformRef.current);
    }

    const updateCrosshair = (event: MouseEvent | TouchEvent) => {
      const [px, py] = d3.pointer(event, rootG.node() as SVGGElement);
      if (px < 0 || px > innerWidth || py < 0 || py > innerHeight) {
        crosshairLayer.style('display', 'none');
        setHoveredCandle(null);
        return;
      }

      const zx = currentTransformRef.current.rescaleX(xBase);
      const rawIndex = zx.invert(px);
      const nearestIdx = Math.max(0, Math.min(activeCandles.length - 1, Math.round(rawIndex)));
      const candle = activeCandles[nearestIdx];
      if (!candle) return;

      const snapX = zx(nearestIdx);
      const unitPx = Math.abs(zx(1) - zx(0));
      const candleWidth = Math.max(8, Math.min(54, unitPx * 0.56));
      const pointerPrice = Number(yScale.invert(py).toFixed(1));

      const yOpen = yScale(candle.open);
      const yClose = yScale(candle.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(5, Math.abs(yClose - yOpen));

      crosshairLayer.style('display', null);
      crosshairV.attr('x1', snapX).attr('x2', snapX);
      crosshairH.attr('y1', py).attr('y2', py);

      crosshairHighlightRing
        .attr('x', snapX - candleWidth / 2 - 3)
        .attr('y', bodyTop - 3)
        .attr('width', candleWidth + 6)
        .attr('height', bodyHeight + 6);

      priceTagRect.attr('y', Math.max(0, Math.min(innerHeight - 20, py - 10)));
      priceTagText
        .attr('y', Math.max(13.5, Math.min(innerHeight - 6.5, py + 3.5)))
        .text(`${pointerPrice}Jt`);

      const pLabel = candle.periode;
      const pillW = Math.max(52, pLabel.length * 7 + 14);
      const pillX = Math.max(0, Math.min(innerWidth - pillW, snapX - pillW / 2));
      periodTagRect.attr('x', pillX).attr('width', pillW);
      periodTagText.attr('x', pillX + pillW / 2).text(pLabel);

      setHoveredCandle({
        candle,
        xPx: snapX + margin.left,
        yPx: py + margin.top,
        pointerPrice,
      });
    };

    interactionRect
      .on('mousemove', function (event) {
        updateCrosshair(event);
      })
      .on('touchstart touchmove', function (event) {
        updateCrosshair(event);
      })
      .on('mouseleave', function () {
        crosshairLayer.style('display', 'none');
        setHoveredCandle(null);
      });
  }, [activeCandles, containerWidth, height, thresholds, compact]);

  // Toolbar Zoom & Pan Controls
  const handleZoomBy = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handlePanBy = (dx: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.translateBy, dx, 0);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(260)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const getZoneStatus = (val: number) => {
    if (val >= thresholds.perkembanganPesat) {
      return { label: 'PERKEMBANGAN PESAT (GROW)', cls: 'text-emerald-300 border-emerald-400/50 bg-emerald-950/90' };
    }
    if (val >= thresholds.stabil) {
      return { label: 'ZONA STABIL', cls: 'text-[#f3d266] border-[#d4af37]/50 bg-[#1f1905]/90' };
    }
    if (val > thresholds.darurat) {
      return { label: 'ZONA WASPADA', cls: 'text-amber-300 border-amber-500/50 bg-amber-950/90' };
    }
    return { label: 'ZONA DARURAT', cls: 'text-rose-300 border-rose-500/50 bg-rose-950/90' };
  };

  return (
    <div className="bg-[#010a06] border-2 border-[#d4af37]/35 rounded-2xl p-3 sm:p-4 space-y-3 shadow-inner">
      {/* Trader Toolbar: Timeframe + Live Indicator + Zoom/Pan Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-emerald-900/70 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            D3.JS TRADER ENGINE · REAL-TIME KAS BENDAHARA
          </span>
          <div className="inline-flex items-center bg-[#02120b] border border-emerald-800/70 rounded-xl p-0.5">
            {(
              [
                { id: 'bulanan', label: 'Bulanan' },
                { id: 'mingguan', label: 'Mingguan' },
                { id: 'harian', label: 'Harian (Live)' },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-[#d4af37] text-[#02100a] shadow'
                    : 'text-emerald-200/80 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#02120b] border border-emerald-800/60 text-[10px] font-mono text-emerald-300">
            <Crosshair className="w-3 h-3 text-[#f3d266]" />
            Bidik &amp; Geser ({zoomLevel.toFixed(1)}x)
          </span>
          <button
            type="button"
            onClick={() => handlePanBy(65)}
            className="p-1.5 rounded-lg bg-[#03160f] hover:bg-[#073021] border border-emerald-800/80 text-emerald-200 hover:text-[#f3d266] cursor-pointer"
            title="Geser Kiri"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handlePanBy(-65)}
            className="p-1.5 rounded-lg bg-[#03160f] hover:bg-[#073021] border border-emerald-800/80 text-emerald-200 hover:text-[#f3d266] cursor-pointer"
            title="Geser Kanan"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomBy(1.3)}
            className="p-1.5 rounded-lg bg-[#03160f] hover:bg-[#073021] border border-emerald-800/80 text-emerald-200 hover:text-[#f3d266] cursor-pointer"
            title="Perbesar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomBy(0.77)}
            className="p-1.5 rounded-lg bg-[#03160f] hover:bg-[#073021] border border-emerald-800/80 text-emerald-200 hover:text-[#f3d266] cursor-pointer"
            title="Perkecil (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1.5 rounded-lg bg-[#03160f] hover:bg-[#073021] border border-[#d4af37]/40 text-[#f3d266] text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            title="Reset Zoom & Posisi"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas + Floating Interactive OHLC Crosshair HUD */}
      <div ref={containerRef} className="relative w-full select-none overflow-hidden rounded-xl">
        <svg
          ref={svgRef}
          width={containerWidth}
          height={height}
          className="block w-full touch-none"
        />

        {/* Floating Trader Crosshair Tooltip */}
        {hoveredCandle && (() => {
          const c = hoveredCandle.candle;
          const isBull = c.close >= c.open;
          const diff = c.close - c.open;
          const pct = c.open !== 0 ? ((diff / Math.abs(c.open)) * 100).toFixed(1) : '0.0';
          const zone = getZoneStatus(c.close);
          const placeLeft = hoveredCandle.xPx > containerWidth * 0.55;

          return (
            <div
              className="pointer-events-none absolute top-3 z-30 w-64 sm:w-72 rounded-xl bg-[#03160f]/95 backdrop-blur-md border border-[#d4af37]/70 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.85)] text-[11px] font-mono space-y-1.5"
              style={{
                left: placeLeft ? '12px' : undefined,
                right: placeLeft ? undefined : '76px',
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-emerald-800/70 pb-1">
                <span className="font-bold text-[#f3d266] truncate">{c.labelLengkap}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                    isBull ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {isBull ? '▲ BULLISH' : '▼ BEARISH'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-emerald-300/70">OPEN:</span>
                  <span className="text-white font-bold">Rp{c.open}Jt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/70">HIGH:</span>
                  <span className="text-emerald-300 font-bold">Rp{c.high}Jt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/70">LOW:</span>
                  <span className="text-rose-300 font-bold">Rp{c.low}Jt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/70">CLOSE:</span>
                  <span className="text-[#f3d266] font-bold">Rp{c.close}Jt</span>
                </div>
              </div>

              <div className="pt-1 border-t border-emerald-900/70 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400">Masuk: Rp{c.masuk}Jt</span>
                <span className="text-rose-400">Keluar: Rp{c.keluar}Jt</span>
                <span className={diff >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                  {diff >= 0 ? `+${pct}%` : `${pct}%`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${zone.cls}`}>
                  {zone.label}
                </span>
                <span className="text-[9px] text-emerald-200/70">
                  Bidik: Rp{hoveredCandle.pointerPrice}Jt
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Hint */}
      <p className="text-[10px] font-mono text-emerald-300/70 flex flex-wrap items-center justify-between gap-2">
        <span>
          Arahkan kursor ke grafik untuk mengaktifkan garis bidik OHLC · Scroll roda mouse untuk zoom · Seret area grafik untuk geser periode.
        </span>
        <span className="text-[#f3d266]">
          Menampilkan {activeCandles.length} candle ({timeframe.toUpperCase()})
        </span>
      </p>
    </div>
  );
};
