'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Automatically fetch the latest logs every 2 seconds
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/logs');
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error("Could not fetch logs");
      }
    };
    
    fetchLogs(); // Fetch immediately on load
    const interval = setInterval(fetchLogs, 2000); 
    return () => clearInterval(interval);
  }, []);

  const simulateTraffic = async (type: 'safe' | 'attack') => {
    setLoading(true);
    
    const mockPacket = type === 'safe' 
   ? { duration: 0.0, src_bytes: 212.0, dst_bytes: 879.0, count: 1.0 } 
   : { duration: 0.0, src_bytes: 0.0, dst_bytes: 0.0, count: 255.0 };

    try {
      await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPacket),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Live Network Monitor</h1>
            <p className="text-slate-400 mt-1">AI-Powered Intrusion Detection System</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => simulateTraffic('safe')} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              + Send Normal Traffic
            </button>
            <button onClick={() => simulateTraffic('attack')} disabled={loading} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              + Simulate Attack
            </button>
          </div>
        </div>

        {/* Live Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-96">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Threat Level Timeline</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={logs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis domain={[0, 1.2]} ticks={[0, 1]} tickFormatter={(val) => val === 0 ? 'Safe' : 'Attack'} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line 
                type="stepAfter" 
                dataKey="threat_level" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }} 
                activeDot={{ r: 8, fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}