import React from 'react';
import { Power, Droplets, CloudRain } from 'lucide-react';
import { PumpControlState } from '../types/telemetry';

interface WaterPumpControlProps {
  pump: PumpControlState;
  onTogglePump: () => void;
  onSetMode: (mode: 'MANUAL' | 'AUTO') => void;
  onSetThreshold: (val: number) => void;
  onToggleRainSafety: () => void;
  currentSoilMoisture: number;
  isRaining: boolean;
}

export const WaterPumpControl: React.FC<WaterPumpControlProps> = ({
  pump,
  onTogglePump,
  onSetMode,
  onSetThreshold,
  onToggleRainSafety,
  currentSoilMoisture,
  isRaining,
}) => {
  const isPumpOn = pump.status === 'ON';

  // Format runtime
  const formatRuntime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
              isPumpOn
                ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Droplets className={`w-4 h-4 sm:w-5 sm:h-5 ${isPumpOn ? 'animate-bounce text-cyan-400' : ''}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                Water Pump Control
              </h2>
              <span
                className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isPumpOn
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPumpOn ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                {isPumpOn ? 'PUMP ACTIVE' : 'PUMP STANDBY'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Relay control & automatic soil moisture irrigation
            </p>
          </div>
        </div>

        {/* Mode Selector - responsive tabs */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onSetMode('MANUAL')}
            className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all text-center cursor-pointer ${
              pump.mode === 'MANUAL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual Mode
          </button>
          <button
            onClick={() => onSetMode('AUTO')}
            className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all text-center cursor-pointer ${
              pump.mode === 'AUTO'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Auto Threshold
          </button>
        </div>
      </div>

      {/* Main Control Panel Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5 pt-3.5">
        {/* Left: Tactile ON/OFF Button & Status */}
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">
              Relay Switch
            </span>
            {isPumpOn && (
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Runtime: {formatRuntime(pump.runtimeSeconds)}
              </span>
            )}
          </div>

          <div className="my-2">
            <button
              onClick={onTogglePump}
              className={`w-full min-h-[46px] py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md active:scale-98 ${
                isPumpOn
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
              }`}
            >
              <Power className="w-4 h-4 shrink-0" />
              <span>{isPumpOn ? 'Turn Water Pump OFF' : 'Turn Water Pump ON'}</span>
            </button>
          </div>

          <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-1">
            {pump.mode === 'MANUAL'
              ? 'Manual Mode: Click button above anytime to start or stop pump.'
              : `Auto Mode: Pump starts if soil moisture drops below ${pump.autoMoistureThreshold}%.`}
          </p>
        </div>

        {/* Right: Automation Settings */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Auto Threshold Target
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
              &lt; {pump.autoMoistureThreshold}% Moisture
            </span>
          </div>

          {/* Threshold Slider */}
          <div>
            <input
              type="range"
              min="15"
              max="60"
              step="1"
              value={pump.autoMoistureThreshold}
              onChange={(e) => onSetThreshold(parseInt(e.target.value, 10))}
              disabled={pump.mode !== 'AUTO'}
              className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
              aria-label="Soil moisture threshold"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Dry (15%)</span>
              <span>Target: {pump.autoMoistureThreshold}%</span>
              <span>Saturated (60%)</span>
            </div>
          </div>

          {/* Rain safety inhibitor toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">Inhibit pump if rain detected</span>
            </div>
            <button
              onClick={onToggleRainSafety}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                pump.stopIfRaining ? 'bg-blue-600' : 'bg-slate-800'
              }`}
              aria-label="Toggle rain safety"
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                  pump.stopIfRaining ? 'left-4.5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Current soil condition feedback */}
          <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between pt-1 gap-1">
            <span>Soil: <strong className="text-white">{currentSoilMoisture.toFixed(1)}%</strong></span>
            {isRaining ? (
              <span className="text-blue-400 font-semibold">● Rain Active (Pump Inhibited)</span>
            ) : currentSoilMoisture < pump.autoMoistureThreshold ? (
              <span className="text-amber-400 font-semibold">▲ Soil Below Threshold</span>
            ) : (
              <span className="text-emerald-400">● Moisture Adequate</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
