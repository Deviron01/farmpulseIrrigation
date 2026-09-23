import { SensorReading } from '../types/telemetry';

export function generateInitialReadings(count: number = 30): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();
  const stepMs = 60 * 1000; // 1 min per point

  let currentMoisture = 34.0;
  let currentTemp = 24.5;
  let currentHumidity = 58.0;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * stepMs;
    const date = new Date(timestamp);

    // Occasional pump activity in the past (e.g., 10-15 mins ago)
    const pumpActive = i >= 10 && i <= 14;

    if (pumpActive) {
      currentMoisture = Math.min(65, currentMoisture + 1.8);
    } else {
      currentMoisture = Math.max(15, currentMoisture - 0.15 + (Math.random() - 0.5) * 0.1);
    }

    // DHT11 temperature fluctuates gently around 23-27°C
    currentTemp = Number((24.0 + Math.sin(i / 5) * 2.0 + (Math.random() - 0.5) * 0.3).toFixed(1));

    // DHT11 humidity fluctuates between 45-65%
    currentHumidity = Number((55.0 - Math.sin(i / 5) * 4.0 + (Math.random() - 0.5) * 0.8).toFixed(1));

    // Rain sensor: mostly dry (analog > 800), with dry state
    const isRaining = i >= 22 && i <= 24;
    const rainAnalog = isRaining ? 280 : 920;

    readings.push({
      id: `rd-${timestamp}`,
      timestamp,
      timeLabel: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`,
      soilMoisture: Number(currentMoisture.toFixed(1)),
      dhtTemp: currentTemp,
      dhtHumidity: currentHumidity,
      rainSensor: isRaining,
      rainAnalog,
      pumpActive,
      createdAt: new Date(timestamp).toISOString(),
    });
  }

  return readings;
}

export function generateNextReading(
  prev: SensorReading,
  pumpActive: boolean,
  forcedRain?: boolean
): SensorReading {
  const now = Date.now();
  const date = new Date(now);

  const isRaining = forcedRain !== undefined ? forcedRain : prev.rainSensor;

  // Moisture reacts to pump and rain
  let moistureDelta = -0.08 + (Math.random() - 0.5) * 0.05;
  if (pumpActive) {
    moistureDelta += 0.8 + Math.random() * 0.4;
  }
  if (isRaining) {
    moistureDelta += 0.5 + Math.random() * 0.3;
  }

  const nextMoisture = Number(Math.min(98, Math.max(5, prev.soilMoisture + moistureDelta)).toFixed(1));

  // DHT11 Temperature
  const tempDelta = (Math.random() - 0.5) * 0.2;
  const nextTemp = Number(Math.min(45, Math.max(10, prev.dhtTemp + tempDelta)).toFixed(1));

  // DHT11 Humidity
  let humidityDelta = (Math.random() - 0.5) * 0.5;
  if (isRaining) humidityDelta += 0.6;
  if (pumpActive) humidityDelta += 0.3;
  const nextHumidity = Number(Math.min(95, Math.max(20, prev.dhtHumidity + humidityDelta)).toFixed(1));

  return {
    id: `rd-${now}`,
    timestamp: now,
    timeLabel: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`,
    soilMoisture: nextMoisture,
    dhtTemp: nextTemp,
    dhtHumidity: nextHumidity,
    rainSensor: isRaining,
    rainAnalog: isRaining ? 240 : 930,
    pumpActive,
    createdAt: new Date(now).toISOString(),
  };
}

export function exportSensorReadingsToCsv(readings: SensorReading[]): void {
  const headers = [
    'Timestamp (ISO)',
    'Time',
    'Soil Moisture (%)',
    'DHT11 Temperature (°C)',
    'DHT11 Humidity (%)',
    'Rain Detected',
    'Rain Sensor Raw Analog',
    'Water Pump State',
  ];

  const rows = readings.map((r) => [
    new Date(r.timestamp).toISOString(),
    r.timeLabel,
    r.soilMoisture,
    r.dhtTemp,
    r.dhtHumidity,
    r.rainSensor ? 'YES' : 'NO',
    r.rainAnalog,
    r.pumpActive ? 'ON' : 'OFF',
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sensor_readings_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
