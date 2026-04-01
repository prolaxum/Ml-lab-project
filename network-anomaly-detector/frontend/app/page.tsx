'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, Rectangle } from 'recharts';

// Definitive color palette for our engineering theme
const COLORS = {
  safe: '#10b981', // Emerald 500
  attack: '#ef4444', // Red 500
  background: '#0a0f1e', // Very dark blue/black
  border: '#1e293b', // Slate 800
  text: '#94a3b8', // Slate 400
};

export default function MultiGraphDashboard() {
  const [data, setData] = useState({ timeline_logs: [], pie_data: [], confusion_heatmap: {data: []} });
  const [loading, setLoading] = useState(false);

  // Poll the backend for new multi-view data every 2 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/analytics');
        const result = await res.json();
        setData(result);
      } catch (e) { console.error("Database connection lost."); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const simulateTraffic = async (type: 'safe' | 'attack') => {
    setLoading(true);
    // Use mathematically precise KDD averages for simulation
    const mockPacket = type === 'safe' 
      ? { duration: 0.0, src_bytes: 212.0, dst_bytes: 879.0, count: 1.0 } 
      : { duration: 0.0, src_bytes: 0.0, dst_bytes: 0.0, count: 255.0 }; // Neptune DoS

    await fetch('http://localhost:8000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPacket),
    });
    setLoading(false);
  };

  return (
    <div className={`min-h-screen bg-[${COLORS.background}] text-slate-200 p-6 font-mono`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER & CONTROL PANEL */}
        <div className={`flex justify-between items-center border-b border-[${COLORS.border}] pb-6`}>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">SENTINEL MULTI-VIEW <span className="text-blue-500">v4.1</span></h1>
            <p className="text-slate-500 text-xs tracking-[0.2em]">INTEGRATED CYBERSECURITY ANALYTICS</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => simulateTraffic('safe')} disabled={loading} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-xs font-bold text-emerald-400">
              + NORMAL TRAFFIC
            </button>
            <button onClick={() => simulateTraffic('attack')} disabled={loading} className="bg-red-900/30 hover:bg-red-800/50 text-red-500 px-4 py-2 rounded border border-red-900/50 text-xs font-bold">
              + DoS ATTACK
            </button>
          </div>
        </div>

        {/* --- MAIN DASHBOARD GRID (4 PANELS) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* PANEL 1: Threat Distribution (Pie Chart) */}
          <ChartPanel title="1. THREAT DISTRIBUTION (MULTI-CLASS)">
            {data.pie_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pie_data}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.pie_data.map((entry: any, index: any) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke={COLORS.background} strokeWidth={2}/>
                    ))};
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : ( <NoDataPlaceholder /> )}
          </ChartPanel>

          {/* PANEL 2: Real-Time Anomaly Area Chart (Memory View) */}
          <ChartPanel title="2. LIVE ANOMALY HEARTBEAT (MEMORY VIEW)">
             {data.timeline_logs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeline_logs}>
                        <defs>
                            <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false}/>
                        <XAxis dataKey="time" stroke={COLORS.text} fontSize={10} interval={1}/>
                        <YAxis domain={[0, 1.1]} hide/>
                        <Tooltip contentStyle={{backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`}}/>
                        <Area type="stepAfter" dataKey="threat_level" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorThreat)" />
                    </AreaChart>
                </ResponsiveContainer>
             ) : ( <NoDataPlaceholder /> )}
          </ChartPanel>

          {/* PANEL 3: Model Confusion Heatmap (Confidence View) */}
          <ChartPanel title="3. CONFUSION HEATMAP (CONFIDENCE VIEW)">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.confusion_heatmap.data} layout="vertical" stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false}/>
                    <XAxis type="number" hide/>
                    <YAxis dataKey="name" type="category" stroke={COLORS.text} fontSize={10} width={100}/>
                    <Tooltip contentStyle={{backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`}} cursor={{fill: 'transparent'}}/>
                    <Legend iconType="rect" iconSize={10} wrapperStyle={{fontSize: 10, color: COLORS.text}}/>
                    <Bar dataKey="actual_safe" name="Actual Safe" stackId="a" fill={COLORS.safe} radius={[0, 0, 0, 0]} activeBar={<Rectangle fill={COLORS.safe} fillOpacity={0.8} />} />
                    <Bar dataKey="actual_attack" name="Actual Attack" stackId="a" fill={COLORS.attack} radius={[0, 4, 4, 0]} activeBar={<Rectangle fill={COLORS.attack} fillOpacity={0.8} />} />
                </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* PANEL 4: Log Table (Detailed View) */}
          <ChartPanel title="4. DETAILED LOG FEED (LAST 10 REQUESTS)">
              <div className="space-y-2.5 h-full overflow-y-auto pr-2">
                {data.timeline_logs.slice(-10).reverse().map((log: any) => (
                    <div key={log.id} className={`flex items-center justify-between p-3 rounded border ${log.threat_level === 1 ? 'bg-red-950/30 border-red-900/50' : 'bg-emerald-950/30 border-emerald-900/50'}`}>
                        <span className="text-slate-500 text-[10px]">{log.time}</span>
                        <span className="text-slate-300 text-[11px] font-bold">REQ_{log.id}</span>
                        <span className="text-slate-400 text-[10px]">{log.count} CONNS</span>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded ${log.threat_level === 1 ? 'text-red-500' : 'text-emerald-400'}`}>
                            {log.class.toUpperCase()}
                        </span>
                    </div>
                ))}
              </div>
          </ChartPanel>

        </div>
      </div>
    </div>
  );
}

// Utility component to wrap charts in a standard panel
function ChartPanel({ title, children }: any) {
  return (
    <div className={`bg-slate-900/60 border border-[${COLORS.border}] p-6 rounded-xl shadow-2xl h-80 flex flex-col`}>
      <h3 className="text-xs font-bold mb-6 text-slate-400 tracking-widest uppercase border-l-2 border-blue-500 pl-3">{title}</h3>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}

function NoDataPlaceholder() {
    return <div className="flex h-full w-full items-center justify-center text-slate-600 text-xs italic border border-dashed border-slate-800 rounded-lg">WAITING FOR NETWORK TRAFFIC...</div>
}