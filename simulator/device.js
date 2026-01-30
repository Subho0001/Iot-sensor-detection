// const mqtt = require('mqtt');
// const client = mqtt.connect('mqtt://test.mosquitto.org');

// let temp = 60;
// let vib = 100;

// client.on('connect', () => {
//   console.log('🤖 Simulator Connected');
//   setInterval(() => {
//     // Randomly increase or decrease
//     temp += (Math.random() - 0.5) * 5;
//     vib += (Math.random() - 0.5) * 5;

//     // Occasional Spike (to trigger AI)
//     if (Math.random() > 0.9) { temp = 95; vib = 250; console.log("🔥 SPIKE TRIGGERED!"); }

//     const data = { machineId: "M1", temperature: temp, vibration: vib, timestamp: new Date() };
//     client.publish('factory/machine/1/sensors', JSON.stringify(data));
//     console.log(`Sent: ${temp.toFixed(1)}°C`);
//   }, 2000);
// });

const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');

let temp = 60;
let vib = 100;
let phase = "good"; // Phases: good, deteriorating, critical, recovering

client.on('connect', () => {
  console.log('🤖 Realistic Simulator Connected');
  
  setInterval(() => {
    // 1. STATE MACHINE LOGIC
    switch(phase) {
      case "good":
        // Stable values
        temp = 60 + (Math.random() * 5);  // 60-65
        vib = 100 + (Math.random() * 10); // 100-110
        if(Math.random() > 0.95) phase = "deteriorating"; // 5% chance to start breaking
        break;

      case "deteriorating":
        // Slowly rising values (Warning Zone)
        temp += 0.5; 
        vib += 2;
        if(temp > 85) phase = "critical";
        console.log("⚠️ Machine wear increasing...");
        break;

      case "critical":
        // Danger Zone (AI should trigger here)
        temp = 90 + (Math.random() * 5); // 90-95
        vib = 220 + (Math.random() * 20); // 220-240
        if(Math.random() > 0.8) { 
            phase = "recovering"; 
            console.log("🛠️ Maintenance applied!"); 
        }
        break;

      case "recovering":
        // Resetting to normal
        temp -= 2;
        vib -= 10;
        if(temp <= 60) phase = "good";
        break;
    }

    const data = { 
        machineId: "M1", 
        temperature: parseFloat(temp.toFixed(2)), 
        vibration: parseFloat(vib.toFixed(2)), 
        timestamp: new Date() 
    };

    client.publish('factory/machine/1/sensors', JSON.stringify(data));
    console.log(`[${phase.toUpperCase()}] Temp: ${data.temperature}, Vib: ${data.vibration}`);

  }, 2000); // Send every 2 seconds
});