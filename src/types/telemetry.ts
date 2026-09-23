export interface SensorReading {
  id: string;
  timestamp: number;
  timeLabel: string;
  soilMoisture: number; // 0 - 100 %
  dhtTemp: number; // Celsius (°C)
  dhtHumidity: number; // Relative Humidity (%)
  rainSensor: boolean; // true = Rain Detected, false = Dry
  rainAnalog: number; // 0 (dry) - 1023 (submerged)
  pumpActive: boolean; // true = Pump ON, false = Pump OFF
  createdAt?: string;
}

export interface PumpControlState {
  status: 'ON' | 'OFF';
  mode: 'MANUAL' | 'AUTO';
  autoMoistureThreshold: number; // e.g., 30% - turns ON if moisture drops below this
  stopIfRaining: boolean; // If rain is detected, auto-disable pump
  lastToggledAt: number;
  runtimeSeconds: number;
}
