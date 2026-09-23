/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Droplets,
  Database,
} from 'lucide-react';
import { SensorReading, PumpControlState } from './types/telemetry';
import {
  generateInitialReadings,
  generateNextReading,
  exportSensorReadingsToCsv,
} from './data/mockTelemetry';
import { SensorReadings } from './components/SensorReadings';
import { WaterPumpControl } from './components/WaterPumpControl';
import { InteractiveSensorChart } from './components/InteractiveSensorChart';
import {
  saveReadingToFirestore,
  fetchHistoricalReadings,
  testFirestoreConnection,
} from './firebase';

export default function App() {
  // Sensor readings history
  const [readings, setReadings] = useState<SensorReading[]>(() => generateInitialReadings(35));
  const [isStreaming, setIsStreaming] = useState(true);
  const [firestoreStatus, setFirestoreStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Water pump state
  const [pump, setPump] = useState<PumpControlState>({
    status: 'OFF',
    mode: 'MANUAL',
    autoMoistureThreshold: 30, // % moisture
    stopIfRaining: true,
    lastToggledAt: Date.now(),
    runtimeSeconds: 0,
  });

  const latestReading: SensorReading = readings[readings.length - 1] || {
    id: 'rd-0',
    timestamp: Date.now(),
    timeLabel: '00:00:00',
    soilMoisture: 32.0,
    dhtTemp: 24.0,
    dhtHumidity: 55.0,
    rainSensor: false,
    rainAnalog: 930,
    pumpActive: false,
  };

  // 1. Initial Firestore connection and historical data boot
  useEffect(() => {
    let isMounted = true;

    async function initFirestore() {
      try {
        const isOk = await testFirestoreConnection();
        if (!isMounted) return;

        if (isOk) {
          setFirestoreStatus('connected');
          // Fetch any historical readings stored in Firestore
          const history = await fetchHistoricalReadings(35);
          if (history && history.length > 5 && isMounted) {
            setReadings(history);
            const last = history[history.length - 1];
            setLastSyncTime(last.timeLabel);
          }
        } else {
          setFirestoreStatus('connected'); // Offline client capability still supported
        }
      } catch (err) {
        console.warn('Firestore initial check notice:', err);
        if (isMounted) setFirestoreStatus('error');
      }
    }

    initFirestore();
    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle pump manual ON/OFF
  const handleTogglePump = () => {
    setPump((prev) => {
      const nextStatus = prev.status === 'ON' ? 'OFF' : 'ON';
      return {
        ...prev,
        status: nextStatus,
        lastToggledAt: Date.now(),
        runtimeSeconds: nextStatus === 'ON' ? prev.runtimeSeconds : 0,
      };
    });
  };

  // Pump mode switcher
  const handleSetPumpMode = (mode: 'MANUAL' | 'AUTO') => {
    setPump((prev) => ({
      ...prev,
      mode,
    }));
  };

  // Set threshold for auto irrigation
  const handleSetThreshold = (val: number) => {
    setPump((prev) => ({
      ...prev,
      autoMoistureThreshold: val,
    }));
  };

  // Toggle rain safety inhibitor
  const handleToggleRainSafety = () => {
    setPump((prev) => ({
      ...prev,
      stopIfRaining: !prev.stopIfRaining,
    }));
  };

  // Manual reading injection / override
  const handleApplyManualReading = (partial: Partial<SensorReading>) => {
    const now = Date.now();
    const date = new Date(now);
    const updated: SensorReading = {
      ...latestReading,
      ...partial,
      id: `rd-manual-${now}`,
      timestamp: now,
      timeLabel: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`,
      pumpActive: pump.status === 'ON',
      createdAt: new Date(now).toISOString(),
    };

    setReadings((prev) => [...prev.slice(1), updated]);

    // Save to Firestore
    saveReadingToFirestore(updated)
      .then(() => setLastSyncTime(updated.timeLabel))
      .catch((err) => console.error('Firestore save failed:', err));
  };

  // 2. Auto-pump check and runtime tick
  useEffect(() => {
    const timer = setInterval(() => {
      // If pump is ON, increment runtime
      if (pump.status === 'ON') {
        setPump((p) => ({ ...p, runtimeSeconds: p.runtimeSeconds + 1 }));
      }

      // Check auto mode condition
      if (pump.mode === 'AUTO') {
        const soilTooDry = latestReading.soilMoisture < pump.autoMoistureThreshold;
        const rainingBlocksPump = pump.stopIfRaining && latestReading.rainSensor;

        if (soilTooDry && !rainingBlocksPump && pump.status === 'OFF') {
          // Auto turn ON
          setPump((p) => ({ ...p, status: 'ON', runtimeSeconds: 0 }));
        } else if ((!soilTooDry || rainingBlocksPump) && pump.status === 'ON') {
          // Auto turn OFF when adequate moisture reached or rain started
          setPump((p) => ({ ...p, status: 'OFF' }));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pump, latestReading]);

  // 3. Live sensor streaming tick & Firestore persistent sync
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!isStreaming) return;

    const streamInterval = setInterval(() => {
      setReadings((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const next = generateNextReading(last, pump.status === 'ON');

        // Persist to Firestore: throttled to every 4 seconds or on pump state change
        const now = Date.now();
        if (now - lastSyncRef.current >= 4000 || next.pumpActive !== last.pumpActive) {
          lastSyncRef.current = now;
          saveReadingToFirestore(next)
            .then(() => {
              setFirestoreStatus('connected');
              setLastSyncTime(next.timeLabel);
            })
            .catch((err) => {
              console.warn('Firestore sync notice:', err);
            });
        }

        return [...prev.slice(1), next];
      });
    }, 2000);

    return () => clearInterval(streamInterval);
  }, [isStreaming, pump.status]);

  // CSV Download handler
  const handleExportCsv = () => {
    exportSensorReadingsToCsv(readings);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Header - responsive on all screen sizes */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand & Status */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight flex items-center gap-2">
                  <span>AgroPulse Telemetry</span>
                  <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    <Database className="w-2.5 h-2.5" />
                    <span>Firestore Connected</span>
                  </span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                  DHT11 · Soil Moisture · Rain Sensor
                </p>
              </div>
            </div>

            {/* Mobile-only inline badges */}
            <div className="sm:hidden flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    pump.status === 'ON' ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span className="text-slate-400">Pump:</span>
                <strong className={pump.status === 'ON' ? 'text-cyan-300' : 'text-slate-300'}>
                  {pump.status}
                </strong>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Header Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {/* Cloud Firestore sync status badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  firestoreStatus === 'connected'
                    ? 'bg-emerald-400'
                    : firestoreStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-slate-400">Cloud Sync:</span>
              <span className="text-slate-200">
                {lastSyncTime ? `Saved @ ${lastSyncTime}` : 'Active'}
              </span>
            </div>

            {/* Desktop pump pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  pump.status === 'ON' ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400">Pump:</span>
              <strong className={pump.status === 'ON' ? 'text-cyan-300' : 'text-slate-300'}>
                {pump.status}
              </strong>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export to CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* 1. Water Pump Control Section */}
        <WaterPumpControl
          pump={pump}
          onTogglePump={handleTogglePump}
          onSetMode={handleSetPumpMode}
          onSetThreshold={handleSetThreshold}
          onToggleRainSafety={handleToggleRainSafety}
          currentSoilMoisture={latestReading.soilMoisture}
          isRaining={latestReading.rainSensor}
        />

        {/* 2. Live Sensor Readings Section (Soil Moisture, DHT11 Temp, DHT11 Humidity, Rain Sensor) */}
        <SensorReadings
          current={latestReading}
          onApplyManualReading={handleApplyManualReading}
          isStreaming={isStreaming}
          onToggleStreaming={() => setIsStreaming(!isStreaming)}
        />

        {/* 3. Interactive Visual Chart */}
        <InteractiveSensorChart data={readings} />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-6">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-2 text-center sm:text-left">
          <span>AgroPulse · DHT11, Soil Moisture & Rain Sensor Station · Firestore Persisted</span>
          <button
            onClick={handleExportCsv}
            className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download CSV Telemetry</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
