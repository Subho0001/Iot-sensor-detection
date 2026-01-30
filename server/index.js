// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const mongoose = require('mongoose');
// const mqtt = require('mqtt');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const Groq = require('groq-sdk');
// //const OpenAI = require('openai'); // Updated for v4

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// // 1. Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('✅ MongoDB Connected'))
//   .catch(err => console.error('❌ MongoDB Connection Error:', err));

// // Define Data Models
// const Reading = mongoose.model('Reading', new mongoose.Schema({
//   machineId: String,
//   temperature: Number,
//   vibration: Number,
//   timestamp: { type: Date, default: Date.now }
// }));

// const Alert = mongoose.model('Alert', new mongoose.Schema({
//   machineId: String,
//   message: String,
//   severity: String,
//   timestamp: { type: Date, default: Date.now }
// }));

// // 2. Setup OpenAI
// //const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // async function analyzeRisk(data) {
// //   if (data.temperature < 80 && data.vibration < 200) return null; // Save money on API calls

// //   try {
// //     const response = await openai.chat.completions.create({
// //       model: "gpt-3.5-turbo",
// //       messages: [{
// //         role: "system", 
// //         content: "You are an IoT expert. Analyze sensor data. If dangerous, return 'Critical | Reason'. If warning, return 'Warning | Reason'. Keep it short."
// //       }, {
// //         role: "user",
// //         content: `Temp: ${data.temperature}, Vib: ${data.vibration}`
// //       }],
// //       max_tokens: 20
// //     });
// //     return response.choices[0].message.content;
// //   } catch (error) {
// //     console.error("AI Error:", error.message);
// //     return null;
// //   }
// // }

// async function analyzeRisk(data) {
//   // 1. Cost/Speed Optimization: Don't bother AI if data is obviously safe
//   if (data.temperature < 80 && data.vibration < 200) return null;

//   console.log("--> ⚠️ High values detected. Asking Groq (Llama 3)...");

//   try {
//     const response = await groq.chat.completions.create({
//       // We use Llama 3 because it is fast and smart
//       model: "llama3-8b-8192", 
//       messages: [
//         {
//           role: "system",
//           // STRICT instruction to ensure it replies in the format our code expects
//           content: "You are an IoT Safety AI. Analyze the sensor data. Return ONLY the string format: 'Severity | Short Reason'. Severity must be 'Critical' or 'Warning'. Example: 'Critical | Overheating detected'. Do not write anything else."
//         },
//         {
//           role: "user",
//           content: `Temperature: ${data.temperature}°C, Vibration: ${data.vibration}Hz`
//         }
//       ],
//       temperature: 0.5, // Low temperature = more consistent, less creative answers
//       max_tokens: 50
//     });

//     const result = response.choices[0]?.message?.content || "";
//     console.log("--> ⚡ Groq Replied:", result);
//     return result;

//   } catch (error) {
//     console.error("--> ❌ Groq API Error:", error.message);
//     return null; // Fail gracefully
//   }
// }

// // 3. Connect to MQTT Broker (Data Source)
// const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

// mqttClient.on('connect', () => {
//   console.log('✅ Connected to MQTT Broker');
//   mqttClient.subscribe('factory/machine/1/sensors');
// });

// // mqttClient.on('message', async (topic, message) => {
// //   const data = JSON.parse(message.toString());

// //   // Save to DB
// //   await new Reading(data).save();

// //   // Check for Alerts (AI)
// //   const aiAnalysis = await analyzeRisk(data);
// //   if (aiAnalysis) {
// //     const [severity, msg] = aiAnalysis.split('|');
// //     const newAlert = new Alert({
// //       machineId: data.machineId,
// //       severity: severity.trim().toLowerCase(),
// //       message: msg.trim()
// //     });
// //     await newAlert.save();
// //     io.emit('new_alert', newAlert); // Send to frontend immediately
// //   }

// //   io.emit('sensor_update', data); // Send live data to frontend
// // });



// // ... inside server/index.js

// mqttClient.on('message', async (topic, message) => {
//   const data = JSON.parse(message.toString());

//   // --- NEW: Calculate Health Score (Simple Algorithm) ---
//   // Baseline: Temp 60, Vib 100. Every unit above that lowers score.
//   let penalty = 0;
//   if (data.temperature > 60) penalty += (data.temperature - 60) * 2;
//   if (data.vibration > 100) penalty += (data.vibration - 100) * 0.5;
  
//   // Ensure score stays between 0 and 100
//   const healthScore = Math.max(0, 100 - penalty); 
  
//   // Add score to data object
//   data.healthScore = Math.round(healthScore);

//   // 1. Save to DB
//   // Note: You might need to update your Mongoose Schema if you want to save this permanently,
//   // but for now, we just send it to the UI.
//   await new Reading(data).save();

//   // 2. Check for Alerts (Mock AI)
//   const aiAnalysis = await analyzeRisk(data);
//   if (aiAnalysis) {
//     const [severity, msg] = aiAnalysis.split('|');
//     const newAlert = new Alert({
//       machineId: data.machineId,
//       severity: severity.trim().toLowerCase(),
//       message: msg.trim()
//     });
//     await newAlert.save();
//     io.emit('new_alert', newAlert);
//   }

//   // 3. Emit Data + Health Score to Frontend
//   io.emit('sensor_update', data);
// });

// // 4. API Endpoints for History
// app.get('/api/readings', async (req, res) => {
//   const data = await Reading.find().sort({timestamp: -1}).limit(20);
//   res.json(data.reverse());
// });
// app.get('/api/alerts', async (req, res) => {
//   const data = await Alert.find().sort({timestamp: -1}).limit(10);
//   res.json(data);
// });

// server.listen(process.env.PORT, () => console.log(`🚀 Server running on port ${process.env.PORT}`));



require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const { Server } = require('socket.io');
const cors = require('cors');
const Groq = require('groq-sdk'); // Import Groq Library

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 1. SETUP GROQ (This was missing/broken before) ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- 2. CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const Reading = mongoose.model('Reading', new mongoose.Schema({
  machineId: String,
  temperature: Number,
  vibration: Number,
  healthScore: Number,
  timestamp: { type: Date, default: Date.now }
}));

const Alert = mongoose.model('Alert', new mongoose.Schema({
  machineId: String,
  message: String,
  severity: String,
  timestamp: { type: Date, default: Date.now }
}));

// --- 3. AI ANALYSIS FUNCTION (GROQ) ---
async function analyzeRisk(data) {
  // Optimization: Don't ask AI if data is obviously safe
  if (data.temperature < 80 && data.vibration < 200) return null;

  console.log("--> ⚠️ High values detected. Asking Groq...");

  try {
    const response = await groq.chat.completions.create({
      // UPDATED MODEL NAME HERE:
      model: "llama-3.3-70b-versatile", 
      messages: [
        {
          role: "system",
          content: "You are an IoT Safety AI. Analyze the sensor data. Return ONLY the string format: 'Severity | Short Reason'. Severity must be 'Critical' or 'Warning'. Example: 'Critical | Overheating detected'. Do not write anything else."
        },
        {
          role: "user",
          content: `Temperature: ${data.temperature}°C, Vibration: ${data.vibration}Hz`
        }
      ],
      temperature: 0.5,
      max_tokens: 50
    });

    const result = response.choices[0]?.message?.content || "";
    console.log("--> ⚡ Groq Replied:", result);
    return result;

  } catch (error) {
    console.error("--> ❌ Groq API Error:", error.message);
    return null;
  }
}

// --- 4. MQTT & DATA PROCESSING ---
const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  mqttClient.subscribe('factory/machine/1/sensors');
});

// mqttClient.on('message', async (topic, message) => {
//   const data = JSON.parse(message.toString());

//   // Calculate Health Score
//   let penalty = 0;
//   if (data.temperature > 60) penalty += (data.temperature - 60) * 2;
//   if (data.vibration > 100) penalty += (data.vibration - 100) * 0.5;
//   data.healthScore = Math.max(0, Math.round(100 - penalty));

//   // Save to DB
//   await new Reading(data).save();

//   // AI Check
//   const aiAnalysis = await analyzeRisk(data);
  
//   if (aiAnalysis) {
//     const parts = aiAnalysis.split('|');
//     // Safety check: ensure AI returned the right format
//     if (parts.length === 2) {
//         const newAlert = new Alert({
//           machineId: data.machineId,
//           severity: parts[0].trim().toLowerCase(), // 'critical' or 'warning'
//           message: parts[1].trim()
//         });
//         await newAlert.save();
//         io.emit('new_alert', newAlert);
//     }
//   }

//   io.emit('sensor_update', data);
// });

// ... inside server/index.js ...

mqttClient.on('message', async (topic, message) => {
  const data = JSON.parse(message.toString());

  // --- IMPROVED HEALTH SCORE ALGORITHM ---
  // Baseline: Temp 60, Vib 100.
  // We want: 
  //   - Temp 70, Vib 120 -> Health ~85% (Good)
  //   - Temp 80, Vib 150 -> Health ~60% (Warning)
  //   - Temp 90, Vib 220 -> Health ~10% (Critical)
  
  let tempPenalty = 0;
  let vibPenalty = 0;

  // Only penalize if above normal thresholds
  if (data.temperature > 65) tempPenalty = (data.temperature - 65) * 1.5; 
  if (data.vibration > 110) vibPenalty = (data.vibration - 110) * 0.3;

  let totalPenalty = tempPenalty + vibPenalty;
  
  // Cap the score between 0 and 100
  data.healthScore = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  // 1. Save to DB
  await new Reading(data).save();

  // 2. AI Analysis (Only trigger if actually dangerous to save API calls)
  // Trigger AI if Health drops below 50% OR specific thresholds are met
  if (data.healthScore < 50 || (data.temperature > 85 && data.vibration > 180)) {
       const aiAnalysis = await analyzeRisk(data);
       if (aiAnalysis) {
        const parts = aiAnalysis.split('|');
        if (parts.length === 2) {
            const newAlert = new Alert({
            machineId: data.machineId,
            severity: parts[0].trim().toLowerCase(),
            message: parts[1].trim()
            });
            await newAlert.save();
            io.emit('new_alert', newAlert);
        }
    }
  }

  // 3. Send to Frontend
  io.emit('sensor_update', data);
});

// --- 5. API ENDPOINTS ---
app.get('/api/readings', async (req, res) => {
  const readings = await Reading.find().sort({ timestamp: -1 }).limit(20);
  res.json(readings.reverse());
});

app.get('/api/alerts', async (req, res) => {
  const alerts = await Alert.find().sort({ timestamp: -1 }).limit(10);
  res.json(alerts);
});

server.listen(process.env.PORT, () => console.log(`🚀 Server running on port ${process.env.PORT}`));