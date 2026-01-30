import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const socket = io('http://localhost:5000'); // Connect to backend

function App() {
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch initial history
    axios.get('http://localhost:5000/api/readings').then(res => setData(res.data));
    axios.get('http://localhost:5000/api/alerts').then(res => setAlerts(res.data));

    // Listen for live updates
    socket.on('sensor_update', (newData) => {
      setData(prev => [...prev.slice(-19), newData]); // Keep last 20 points
    });

    socket.on('new_alert', (alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    return () => socket.off();
  }, []);

  // ... inside App function ...

  const latest = data[data.length - 1] || { temperature: 0, vibration: 0, healthScore: 100 };

  // Helper to choose color based on health
  const getHealthColor = (score) => {
    if (score > 80) return '#2ecc71'; // Green
    if (score > 50) return '#f1c40f'; // Yellow
    return '#e74c3c'; // Red
  };

  return (
    <div className="dashboard">
      <header>
        <h1>🏭 IoT Predictive Maintenance</h1>
        
        {/* NEW: Health Score Display */}
        <div className="health-score-card" style={{borderColor: getHealthColor(latest.healthScore)}}>
            <span>Machine Health</span>
            <h2 style={{color: getHealthColor(latest.healthScore)}}>{latest.healthScore}%</h2>
        </div>

        <div className="metrics">
          <div className="card">Temp: {latest.temperature?.toFixed(1)}°C</div>
          <div className="card">Vib: {latest.vibration?.toFixed(1)}Hz</div>
        </div>
      </header>

      {/* ... rest of your code ... */}

      <div className="grid">
        <div className="chart-box">
          <h3>Live Sensor Data</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={false} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#ff0000" name="Temp (°C)" />
              <Line type="monotone" dataKey="vibration" stroke="#0000ff" name="Vib (Hz)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="alert-box">
          <h3>🚨 AI Alerts</h3>
          <ul>
            {alerts.map((alert, i) => (
              <li key={i} className={alert.severity}>
                <strong>{alert.severity.toUpperCase()}:</strong> {alert.message}
                <br/><small>{new Date(alert.timestamp).toLocaleTimeString()}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;