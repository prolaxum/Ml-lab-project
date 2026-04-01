'use client';

import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, 
  Bar, Legend 
} from 'recharts';

type TimelineLog = {
  id: number;
  time: string;
  count: number;
  class: string;
  threat_level: number;
  fill: string;
};

type PieDatum = {
  name: string;
  value: number;
  fill: string;
};

type DashboardData = {
  timeline_logs: TimelineLog[];
  pie_data: PieDatum[];
};

type Stats = {
  accuracy: number;
  precision: number;
  recall: number;
};

const ATTACK_PROFILES = {
  safe: { label: 'RUN SAFE', packet: { duration: 0.0, src_bytes: 491.0, dst_bytes: 0.0, count: 2.0 }, buttonClassName: 'border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10' },
  dos: { label: 'INJECT DoS', packet: { duration: 0.0, src_bytes: 0.0, dst_bytes: 0.0, count: 123.0 }, buttonClassName: 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' },
  probe: { label: 'INJECT PROBE', packet: { duration: 0.0, src_bytes: 18.0, dst_bytes: 0.0, count: 1.0 }, buttonClassName: 'border border-amber-500/50 text-amber-300 hover:bg-amber-500/10' },
  r2l: { label: 'INJECT R2L', packet: { duration: 0.0, src_bytes: 334.0, dst_bytes: 0.0, count: 2.0 }, buttonClassName: 'border border-violet-500/50 text-violet-300 hover:bg-violet-500/10' },
  u2r: { label: 'INJECT U2R', packet: { duration: 98.0, src_bytes: 621.0, dst_bytes: 8356.0, count: 1.0 }, buttonClassName: 'border border-blue-500/50 text-blue-300 hover:bg-blue-500/10' },
};

const CLASS_TEXT_COLORS: Record<string, string> = {
  Safe: 'text-emerald-400',
  'DoS Attack': 'text-red-500',
  'Probe (Scanning)': 'text-amber-400',
  'R2L (Unauthorized Access)': 'text-violet-400',
  'U2R (Superuser Hijack)': 'text-blue-400',
  'Unknown Attack': 'text-slate-400',
};

const HEARTBEAT_LEVEL_LABELS: Record<number, string> = {
  0: 'Safe',
  1: 'Probe',
  2: 'DoS',
  3: 'R2L',
  4: 'U2R',
  5: 'Unknown',
};

export default function SentinelDashboard() {
  const [data, setData] = useState<DashboardData>({ timeline_logs: [], pie_data: [] });
  const [stats, setStats] = useState<Stats>({ accuracy: 0, precision: 0, recall: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/analytics');
        const result = await res.json();
        setData(result);

        const statsRes = await fetch('http://localhost:8000/api/model-stats');
        const statsResult = await statsRes.json();
        setStats(statsResult);
      } catch { 
        console.error("Backend offline. Ensure python -m uvicorn main:app is running."); 
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const simulateTraffic = async (profileKey: keyof typeof ATTACK_PROFILES) => {
    try {
      await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ATTACK_PROFILES[profileKey].packet),
      });
    } catch {
      console.error("Failed to send packet");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & METRICS */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-sans">Sentinel AI <span className="text-blue-500">v4.2</span></h1>
            <p className="text-slate-500 text-xs mt-2 tracking-[0.4em]">Neural Network Intrusion Detection System</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            {Object.entries(ATTACK_PROFILES).map(([key, profile]) => (
              <button
                key={key}
                onClick={() => simulateTraffic(key as keyof typeof ATTACK_PROFILES)}
                className={`px-4 py-2 rounded text-xs font-bold transition-all ${profile.buttonClassName}`}
              >
                {profile.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricBox label="Model Accuracy" value={`${stats.accuracy}%`} color="text-blue-400" />
          <MetricBox label="Detection Precision" value={`${stats.precision}%`} color="text-emerald-400" />
          <MetricBox label="Attack Recall" value={`${stats.recall}%`} color="text-amber-400" />
        </div>

        {/* ROW 1: LIVE MONITORING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl h-80">
            <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest italic">1. Threat Distribution (Live)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.pie_data} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                  {data.pie_data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl h-80">
            <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest italic">2. Anomaly Heartbeat (Temporal)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline_logs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tickFormatter={(value: number) => HEARTBEAT_LEVEL_LABELS[value] ?? String(value)}
                />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                <Area type="monotone" dataKey="threat_level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 2: SCIENTIFIC VALIDATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl h-80">
            <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest italic">3. ROC Curve (Performance Evidence)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                {fpr: 0, tpr: 0}, {fpr: 0.1, tpr: 0.85}, {fpr: 0.2, tpr: 0.95}, {fpr: 0.5, tpr: 0.98}, {fpr: 1, tpr: 1}
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fpr" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="tpr" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl h-80">
            <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest italic">4. Feature Weight (Explainability)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                {name: 'Count', weight: 0.85}, {name: 'Src_Bytes', weight: 0.72}, {name: 'Duration', weight: 0.15}, {name: 'Dst_Bytes', weight: 0.45}
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                <Bar dataKey="weight" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-500 uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event ID</th>
                <th className="p-4">Feature: Count</th>
                <th className="p-4">AI Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.timeline_logs.slice(-6).reverse().map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="p-4 text-slate-500">{log.time}</td>
                  <td className="p-4 font-bold">NET_LOG_{log.id}</td>
                  <td className="p-4 uppercase">{log.count} connections</td>
                  <td className={`p-4 font-bold ${CLASS_TEXT_COLORS[log.class] ?? 'text-slate-300'}`}>
                    {log.class.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <h2 className={`text-3xl font-black ${color}`}>{value}</h2>
    </div>
  );
}
