"use client";

import { useEffect, useState } from "react";

type ControlState = {
  pump: boolean;
  fan: boolean;
};

const DEVICES: { key: keyof ControlState; label: string; icon: string }[] = [
  { key: "pump", label: "워터펌프", icon: "💧" },
  { key: "fan", label: "공조팬", icon: "🌀" },
];

export function ActuatorControls() {
  const [state, setState] = useState<ControlState | null>(null);
  const [pending, setPending] = useState<keyof ControlState | null>(null);

  useEffect(() => {
    fetch("/api/control")
      .then((r) => r.json())
      .then(setState);
  }, []);

  async function toggle(device: keyof ControlState) {
    if (!state || pending) return;
    const nextValue = !state[device];
    setPending(device);
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device, state: nextValue }),
      });
      const updated = await res.json();
      setState(updated);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-800">장치 제어</h2>
      <div className="grid grid-cols-2 gap-4">
        {DEVICES.map(({ key, label, icon }) => {
          const on = state?.[key] ?? false;
          return (
            <div key={key} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {icon} {label}
                </p>
                <p className={`mt-1 text-xs font-semibold ${on ? "text-green-600" : "text-gray-400"}`}>
                  {on ? "작동 중" : "정지"}
                </p>
              </div>
              <button
                onClick={() => toggle(key)}
                disabled={!state || pending === key}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  on ? "bg-green-600 hover:bg-green-500" : "bg-gray-400 hover:bg-gray-500"
                }`}
              >
                {on ? "ON" : "OFF"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
