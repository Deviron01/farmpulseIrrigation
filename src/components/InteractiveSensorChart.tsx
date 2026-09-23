import React, { useState, useRef, useMemo } from 'react';
import { SensorReading } from '../types/telemetry';

interface InteractiveSensorChartProps {
  data: SensorReading[];
}

export const InteractiveSensorChart: React.FC<InteractiveSensorChartProps> = ({ data }) => {
  const [showMoisture, setShowMoisture] = useState(true);
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // SVG Dimensions
  const svgWidth = 960;
  const svgHeight = 320;
  const padding = { top: 20, right: 20, bottom: 32, left: 42 };

  // Calculate bounds
  const bounds = useMemo(() => {
    if (!data.length) return null;
    const tempVals = data.map((d) => d.dhtTemp);

    return {
      moisture: { min: 0, max: 100 },
      temp: {
        min: Math.floor(Math.min(...tempVals) - 2),
        max: Math.ceil(Math.max(...tempVals) + 2),
      },
      humidity: { min: 0, max: 100 },
    };
  }, [data]);

  const getX = (index: number) => {
    const chartW = svgWidth - padding.left - padding.right;
    return padding.left + (index / (data.length - 1 || 1)) * chartW;
  };

  const getY = (val: number, min: number, max: number) => {
    const chartH = svgHeight - padding.top - padding.bottom;
    const norm = (val - min) / (max - min || 1);
    return padding.top + (1 - norm) * chartH;
  };

  // Paths
  const moisturePath = useMemo(() => {
    if (!bounds || !data.length) return '';
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.soilMoisture, bounds.moisture.min, bounds.moisture.max).toFixed(1)}`)
      .join(' ');
  }, [data, bounds]);

  const moistureAreaPath = useMemo(() => {
    if (!bounds || !data.length) return '';
    const baseY = svgHeight - padding.bottom;
    return `${moisturePath} L ${getX(data.length - 1)} ${baseY} L ${getX(0)} ${baseY} Z`;
  }, [moisturePath, bounds, data]);

  const tempPath = useMemo(() => {
    if (!bounds || !data.length) return '';
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.dhtTemp, bounds.temp.min, bounds.temp.max).toFixed(1)}`)
      .join(' ');
  }, [data, bounds]);

  const humidityPath = useMemo(() => {
    if (!bounds || !data.length) return '';
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.dhtHumidity, bounds.humidity.min, bounds.humidity.max).toFixed(1)}`)
      .join(' ');
  }, [data, bounds]);

  // Coordinate mapper for mouse and touch interactions
  const handlePointerCoord = (clientX: number) => {
    if (!containerRef.current || !data.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const relativeX = (mouseX / rect.width) * svgWidth;

    const chartW = svgWidth - padding.left - padding.right;
    const clampedX = Math.max(padding.left, Math.min(svgWidth - padding.right, relativeX));
    const ratio = (clampedX - padding.left) / chartW;
    const rawIdx = Math.round(ratio * (data.length - 1));
    const safeIdx = Math.max(0, Math.min(data.length - 1, rawIdx));
    setHoverIndex(safeIdx);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    handlePointerCoord(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches && e.touches[0]) {
      handlePointerCoord(e.touches[0].clientX);
    }
  };

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-lg relative">
      {/* Header and series selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Interactive Sensor Chart
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Hover or touch to inspect readings & pump activity cycles
          </p>
        </div>

        {/* Series filters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowMoisture(!showMoisture)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              showMoisture
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Soil Moisture</span>
          </button>

          <button
            onClick={() => setShowTemp(!showTemp)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              showTemp
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>DHT11 Temp</span>
          </button>

          <button
            onClick={() => setShowHumidity(!showHumidity)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              showHumidity
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>DHT11 Humidity</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div ref={containerRef} className="relative mt-3 select-none touch-none">
        {bounds && (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto cursor-crosshair overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
            onTouchStart={handleTouchMove}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + ratio * (svgHeight - padding.top - padding.bottom);
              const label = Math.round(100 - ratio * 100);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    x2={svgWidth - padding.right}
                    y1={y}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {label}%
                  </text>
                </g>
              );
            })}

            {/* Shaded bands when Water Pump is active */}
            {data.map((d, i) => {
              if (!d.pumpActive) return null;
              const x = getX(i);
              const w = (svgWidth - padding.left - padding.right) / (data.length - 1 || 1);
              return (
                <rect
                  key={`pump-band-${i}`}
                  x={x - w / 2}
                  y={padding.top}
                  width={w}
                  height={svgHeight - padding.top - padding.bottom}
                  fill="#06b6d4"
                  opacity="0.12"
                />
              );
            })}

            {/* Rain event markers */}
            {data.map((d, i) => {
              if (!d.rainSensor) return null;
              const x = getX(i);
              return (
                <circle
                  key={`rain-dot-${i}`}
                  cx={x}
                  cy={padding.top + 6}
                  r="3.5"
                  fill="#3b82f6"
                />
              );
            })}

            {/* Curves */}
            {showMoisture && (
              <>
                <path d={moistureAreaPath} fill="url(#moistureGradient)" />
                <path
                  d={moisturePath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}

            {showHumidity && (
              <path
                d={humidityPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}

            {showTemp && (
              <path
                d={tempPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* X-axis time marks */}
            {data.map((d, i) => {
              const step = Math.max(1, Math.floor(data.length / 5));
              if (i % step !== 0 && i !== data.length - 1) return null;
              const x = getX(i);
              return (
                <text
                  key={`time-${i}`}
                  x={x}
                  y={svgHeight - padding.bottom + 16}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {d.timeLabel}
                </text>
              );
            })}

            {/* Crosshair indicator */}
            {hoverIndex !== null && hovered && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  x2={getX(hoverIndex)}
                  y1={padding.top}
                  y2={svgHeight - padding.bottom}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.6"
                />
                {showMoisture && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hovered.soilMoisture, bounds.moisture.min, bounds.moisture.max)}
                    r="4.5"
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                {showTemp && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hovered.dhtTemp, bounds.temp.min, bounds.temp.max)}
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                {showHumidity && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hovered.dhtHumidity, bounds.humidity.min, bounds.humidity.max)}
                    r="4.5"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )}
          </svg>
        )}

        {/* Hover/Touch Tooltip Popup */}
        {hoverIndex !== null && hovered && (
          <div
            className="pointer-events-none absolute top-1 bg-slate-950/95 border border-slate-700 shadow-2xl rounded-lg p-2.5 sm:p-3 text-xs backdrop-blur-md z-20 font-mono transition-transform max-w-[280px] sm:max-w-xs"
            style={{
              left: `${Math.min(75, Math.max(25, (hoverIndex / (data.length - 1)) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-800 text-slate-300">
              <span className="font-bold text-white">{hovered.timeLabel}</span>
              {hovered.pumpActive ? (
                <span className="text-cyan-400 font-bold">● PUMP ON</span>
              ) : (
                <span className="text-slate-500">Pump Standby</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 pt-1.5 text-[11px]">
              <div>
                <span className="text-cyan-400 font-medium">Moisture: </span>
                <strong className="text-white tabular-nums">{hovered.soilMoisture.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-amber-400 font-medium">DHT11 Temp: </span>
                <strong className="text-white tabular-nums">{hovered.dhtTemp.toFixed(1)}°C</strong>
              </div>
              <div>
                <span className="text-sky-400 font-medium">DHT11 Hum: </span>
                <strong className="text-white tabular-nums">{hovered.dhtHumidity.toFixed(1)}%</strong>
              </div>
            </div>

            <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Rain: <strong className="text-white">{hovered.rainSensor ? 'Wet' : 'Dry'}</strong></span>
              <span>Raw: <strong className="text-white">{hovered.rainAnalog}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Legend footnote */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-800/80 mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/20 border border-cyan-400" />
            <span>Cyan zone = Pump Running</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Blue dot = Rain</span>
          </span>
        </div>
        <span>{data.length} readings</span>
      </div>
    </div>
  );
};
