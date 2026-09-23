import React, { useState } from 'react';
import {
  Droplets,
  Thermometer,
  CloudRain,
  Wind,
  SlidersHorizontal,
  Check,
  X,
} from 'lucide-react';
import { SensorReading } from '../types/telemetry';

interface SensorReadingsProps {
  current: SensorReading;
  onApplyManualReading: (reading: Partial<SensorReading>) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

export const SensorReadings: React.FC<SensorReadingsProps> = ({
  current,
  onApplyManualReading,
  isStreaming,
  onToggleStreaming,
}) => {
  const [showInputModal, setShowInputModal] = useState(false);
  const [manualMoisture, setManualMoisture] = useState(current.soilMoisture);
  const [manualTemp, setManualTemp] = useState(current.dhtTemp);
  const [manualHumidity, setManualHumidity] = useState(current.dhtHumidity);
  const [manualRain, setManualRain] = useState(current.rainSensor);

  const handleApply = () => {
    onApplyManualReading({
      soilMoisture: manualMoisture,
      dhtTemp: manualTemp,
      dhtHumidity: manualHumidity,
      rainSensor: manualRain,
      rainAnalog: manualRain ? 250 : 920,
    });
    setShowInputModal(false);
  };

  return (
    <div className="space-y-3.5">
      {/* Header bar for readings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Live Sensor Readings
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            DHT11 Temperature & Humidity · Soil Moisture · Rain Sensor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick manual input trigger */}
          <button
            onClick={() => {
              setManualMoisture(current.soilMoisture);
              setManualTemp(current.dhtTemp);
              setManualHumidity(current.dhtHumidity);
              setManualRain(current.rainSensor);
              setShowInputModal(!showInputModal);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate / Input</span>
          </button>

          {/* Pause / Resume live feed */}
          <button
            onClick={onToggleStreaming}
            className={`px-3 py-2 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer active:scale-95 ${
              isStreaming
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {isStreaming ? '● LIVE STREAM' : '❚❚ PAUSED'}
          </button>
        </div>
      </div>

      {/* Manual Input Dialog / Panel */}
      {showInputModal && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
              Simulate Sensor Readings
            </span>
            <button
              onClick={() => setShowInputModal(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                Soil Moisture (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={manualMoisture}
                onChange={(e) => setManualMoisture(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                DHT11 Temp (°C)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={manualTemp}
                onChange={(e) => setManualTemp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                DHT11 Humidity (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                step="1"
                value={manualHumidity}
                onChange={(e) => setManualHumidity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                Rain Sensor State
              </label>
              <button
                type="button"
                onClick={() => setManualRain(!manualRain)}
                className={`w-full py-1.5 px-2.5 rounded font-mono text-xs font-semibold transition-colors cursor-pointer border ${
                  manualRain
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {manualRain ? '● RAIN DETECTED' : '○ DRY SURFACE'}
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowInputModal(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Reading Values</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of 4 Sensor Cards - 1 col on mobile, 2 col on tablet, 4 col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sensor 1: Soil Moisture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">Soil Moisture</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
                {current.soilMoisture.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">%</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, current.soilMoisture))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Capacitive</span>
              <span
                className={
                  current.soilMoisture < 25
                    ? 'text-amber-400 font-semibold'
                    : current.soilMoisture > 50
                    ? 'text-cyan-300'
                    : 'text-emerald-400'
                }
              >
                {current.soilMoisture < 25 ? 'DRY' : current.soilMoisture > 50 ? 'WET' : 'OPTIMAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor 2: DHT11 Temperature */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">DHT11 Temperature</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Thermometer className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
                {current.dhtTemp.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-amber-400 font-semibold">°C</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Fahrenheit</span>
            <span className="text-slate-300 tabular-nums">
              {((current.dhtTemp * 9) / 5 + 32).toFixed(1)}°F
            </span>
          </div>
        </div>

        {/* Sensor 3: DHT11 Humidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">DHT11 Humidity</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wind className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
                {current.dhtHumidity.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">% RH</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Air Status</span>
            <span
              className={
                current.dhtHumidity > 65
                  ? 'text-cyan-300 font-semibold'
                  : current.dhtHumidity < 35
                  ? 'text-amber-400 font-semibold'
                  : 'text-emerald-400'
              }
            >
              {current.dhtHumidity > 65 ? 'HUMID' : current.dhtHumidity < 35 ? 'DRY' : 'NORMAL'}
            </span>
          </div>
        </div>

        {/* Sensor 4: Rain Sensor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">Rain Sensor</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <span
                className={`text-lg sm:text-xl font-mono font-bold block ${
                  current.rainSensor ? 'text-blue-400 animate-pulse' : 'text-slate-200'
                }`}
              >
                {current.rainSensor ? 'RAIN DETECTED' : 'DRY SURFACE'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Analog Signal</span>
            <span className="text-slate-300 font-semibold tabular-nums">{current.rainAnalog}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
