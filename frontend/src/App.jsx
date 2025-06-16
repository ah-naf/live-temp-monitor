import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Play,
  Square,
  Zap,
  ZapOff,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Eraser,
  Menu,
  X,
} from "lucide-react";

const fixedTicks = [15, 25, 35, 45, 55];
const formatTime = (d) =>
  `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d
    .getMilliseconds()
    .toString()
    .padStart(3, "0")}`;

export default function App() {
  const [intervalMs, setIntervalMs] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Idle");
  const [temperatureData, setTemperatureData] = useState([]);
  const [sidebarData, setSidebarData] = useState([]);
  const [currentTemp, setCurrentTemp] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const wsRef = useRef(null);

  const startStream = () => {
    if (isRunning) return;
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(`ws://localhost:8080/ws?period=${intervalMs}`);
    wsRef.current = ws;

    ws.onopen = () => setConnectionStatus("Connected");
    ws.onerror = () => setConnectionStatus("Disconnected");
    ws.onclose = () => {
      setConnectionStatus("Disconnected");
      setIsRunning(false);
    };

    ws.onmessage = (evt) => {
      const payload = JSON.parse(evt.data);
      const t = new Date(payload.timestamp);

      setCurrentTemp(Math.round(payload.temperature * 10) / 10);

      setTemperatureData((prev) => {
        const next = [
          ...prev,
          { time: formatTime(t), temperature: payload.temperature },
        ];
        return next.slice(-120);
      });

      setSidebarData((prev) => [
        { ...payload, pretty: formatTime(t) },
        ...prev,
      ]);
    };

    setIsRunning(true);
  };

  const stopStream = () => {
    if (wsRef.current) {
      wsRef.current.close();
      setConnectionStatus("Idle");
    }
    setIsRunning(false);
  };

  const clearStream = () => {
    setTemperatureData([]);
    setSidebarData([]);
  };

  useEffect(() => () => wsRef.current?.close(), []);

  const tempTrend =
    temperatureData.length > 1
      ? temperatureData.at(-1).temperature - temperatureData.at(-2).temperature
      : 0;

  const CustomTooltip = ({ active, payload, label }) =>
    active && payload?.length ? (
      <div className="bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg border border-gray-600 shadow-xl">
        <p className="text-gray-300 text-sm">{label}</p>
        <p className="text-white font-semibold">
          {payload[0].value.toFixed(2)}°C
        </p>
      </div>
    ) : null;

  return (
    <div className="min-h-screen mx-auto bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6 font-sans text-white flex">
      <aside
        className={`${
          sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden"
        } lg:flex w-full lg:w-72 max-w-[18rem]`}
      >
        <div
          className="flex-1 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="w-72 max-w-[18rem] bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-2xl p-4 lg:relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Raw Readings</h2>
            <button
              className="lg:hidden p-1 rounded hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-2">
            {sidebarData.map((d, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm bg-gray-700/30 py-1 px-2 rounded"
              >
                <span>{d.pretty}</span>
                <span>{d.temperature.toFixed(2)}°C</span>
              </div>
            ))}
            {sidebarData.length === 0 && (
              <p className="text-gray-400 text-sm">No data yet…</p>
            )}
          </div>
        </div>
      </aside>

      <div className="pl-4 flex-1 mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded hover:bg-gray-800/50 border border-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Live Temperature Monitor
              </h1>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm mb-1" htmlFor="interval">
                Period (ms)
              </label>
              <input
                id="interval"
                type="number"
                min={1000}
                step={100}
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="w-32 bg-gray-800 border border-gray-600 rounded py-1 px-2"
                disabled={isRunning}
              />
            </div>

            {!isRunning ? (
              <button
                onClick={startStream}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 rounded px-4 py-2"
              >
                <Play className="w-4 h-4" /> Start
              </button>
            ) : (
              <button
                onClick={stopStream}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 rounded px-4 py-2"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
            )}
            <button
              onClick={clearStream}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 rounded px-4 py-2"
            >
              <Eraser className="w-4 h-4" /> Clear
            </button>
          </div>
        </header>

        <div className="mb-4 flex items-center gap-4">
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm ${
              connectionStatus === "Connected"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : connectionStatus === "Disconnected"
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }`}
          >
            {connectionStatus === "Connected" ? (
              <Zap className="w-4 h-4 mr-1 animate-pulse" />
            ) : (
              <ZapOff className="w-4 h-4 mr-1" />
            )}
            {connectionStatus}
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="w-6 h-6" />
            <span className="text-lg font-semibold">
              {currentTemp.toFixed(2)}°C
            </span>
            {tempTrend > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : tempTrend < 0 ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : null}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-600 shadow-2xl">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis
                ticks={fixedTicks}
                domain={[15, 50]}
                stroke="#9CA3AF"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
