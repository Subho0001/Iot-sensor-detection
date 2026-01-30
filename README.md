# 🏭 IoT Predictive Maintenance Dashboard

A Full-Stack AIoT application that visualizes real-time sensor data, calculates equipment health scores, and uses Generative AI (Llama 3) to predict failures and issue alerts.

## 🚀 Overview

This project simulates an industrial IoT environment where a motor's **Temperature** and **Vibration** are monitored in real-time.
- **Ingestion:** Sensor data is streamed via MQTT.
- **Processing:** Node.js backend calculates a dynamic "Health Score" (0-100%).
- **AI Inference:** When critical thresholds are breached, the system calls **Groq (Llama 3)** to analyze the data and generate human-readable alerts.
- **Visualization:** A React.js dashboard displays live telemetry graphs and instant alerts via WebSockets.

## 🛠️ Tech Stack

- **Frontend:** React.js, Recharts, Socket.io-client
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Time-series data storage)
- **Communication:** MQTT (Device -> Server), WebSockets (Server -> Client)
- **AI Model:** Llama-3.3-70b-versatile (via Groq API)

## 📂 Project Structure

```text
iot_dashboard/
├── server/       # Node.js Backend (API, MQTT, AI Logic)
├── client/       # React.js Frontend (Dashboard UI)
└── simulator/    # Virtual IoT Device (Generates sensor data)
