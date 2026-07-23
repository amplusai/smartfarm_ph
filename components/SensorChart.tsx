"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type SensorRow = {
  time: string;
  temp: number;
  humidity: number;
  co2: number;
  substrate_temp: number;
};

export function TemperatureHumidityChart() {
  const [data, setData] = useState<SensorRow[]>([]);

  useEffect(() => {
    fetch("/api/sensor")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="temp" domain={[20, 28]} tick={{ fontSize: 12 }} unit="°C" />
        <YAxis yAxisId="hum" orientation="right" domain={[75, 95]} tick={{ fontSize: 12 }} unit="%" />
        <Tooltip />
        <Legend />
        <Line yAxisId="temp" type="monotone" dataKey="temp" name="온도" stroke="#16a34a" strokeWidth={2} dot={false} />
        <Line yAxisId="hum" type="monotone" dataKey="humidity" name="습도" stroke="#0ea5e9" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CO2Chart() {
  const [data, setData] = useState<SensorRow[]>([]);

  useEffect(() => {
    fetch("/api/sensor")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis domain={[850, 1000]} tick={{ fontSize: 12 }} unit=" ppm" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="co2" name="CO₂" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
