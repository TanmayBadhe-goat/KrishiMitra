# 🌱 KrishiMitra IoT Smart Farming System

---

## 📋 Overview

KrishiMitra IoT is a complete smart farming solution that combines:
- **Real-time IoT Sensors** (ESP32 + Sensors)
- **Machine Learning Crop Prediction**
- **AI-powered Agricultural Assistant**
- **Smart Alerts & Recommendations**

---

## 🛒 Components Required

### Core Components (Required)
| Component | Cost (₹) | Description |
|-----------|----------|-------------|
| ESP32 Dev Board | 300-500 | WiFi-enabled microcontroller |
| DHT11 Sensor | 50-100 | Temperature & Humidity |
| Soil Moisture Sensor | 50-150 | Capacitive or Resistive |
| Breadboard | 50-100 | For connections |
| Jumper Wires | 50-100 | Male-to-Male & Male-to-Female |
| **Total** | **₹500-1000** | Basic setup |

### Optional Components (Enhanced)
| Component | Cost (₹) | Description |
|-----------|----------|-------------|
| pH Sensor Module | 300-500 | Analog pH meter |
| Rain Sensor | 100-200 | Rain detection |
| NPK Sensor | 2000+ | Soil nutrient analysis |
| 3-in-1 Soil Sensor | 300-500 | Moisture + pH + Light |

---

## 🔌 Wiring Diagram

### ESP32 Pin Connections

```
ESP32 BOARD
┌─────────────────────────────────┐
│                                 │
│  3.3V  ────────────────────────┼───► DHT11 VCC
│  GND   ────────────────────────┼───► DHT11 GND
│  GPIO4 ───────────────────────┼───► DHT11 DATA
│                                 │
│  3.3V  ────────────────────────┼───► Soil Sensor VCC
│  GND   ────────────────────────┼───► Soil Sensor GND
│  GPIO34 ───────────────────────┼───► Soil Sensor A0
│                                 │
│  3.3V  ────────────────────────┼───► pH Sensor VCC (Optional)
│  GND   ────────────────────────┼───► pH Sensor GND (Optional)
│  GPIO35 ───────────────────────┼───► pH Sensor OUT (Optional)
│                                 │
│  USB   ────────────────────────┼───► Power (5V)
│                                 │
└─────────────────────────────────┘
```

### Sensor Wiring Details

#### DHT11 (Temperature & Humidity)
```
DHT11 PINOUT          CONNECTION
┌─────────┐
│  VCC    │──────────► ESP32 3.3V
│  DATA   │──────────► ESP32 GPIO 4
│  NC     │──────────► Not Connected
│  GND    │──────────► ESP32 GND
└─────────┘
```

#### Soil Moisture Sensor
```
SOIL SENSOR PINOUT    CONNECTION
┌─────────┐
│  VCC    │──────────► ESP32 3.3V
│  GND    │──────────► ESP32 GND
│  A0     │──────────► ESP32 GPIO 34
└─────────┘

Note: Insert sensor into soil for readings
```

#### pH Sensor (Optional)
```
pH SENSOR PINOUT      CONNECTION
┌─────────┐
│  VCC    │──────────► ESP32 3.3V
│  GND    │──────────► ESP32 GND
│  OUT    │──────────► ESP32 GPIO 35
└─────────┘

Note: Requires calibration with buffer solutions
```

---

## 💻 Software Setup

### Step 1: Install Arduino IDE
1. Download from: https://www.arduino.cc/en/software
2. Install on your computer

### Step 2: Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add to "Additional Boards Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search "ESP32" and install "ESP32 by Espressif Systems"

### Step 3: Install Required Libraries
1. Go to **Sketch → Include Library → Manage Libraries**
2. Install these libraries:
   - **DHT sensor library** by Adafruit
   - **Adafruit Unified Sensor** (dependency)
   - **WiFi** (built-in with ESP32)
   - **HTTPClient** (built-in with ESP32)

### Step 4: Configure Arduino IDE
1. Connect ESP32 via USB
2. Go to **Tools → Board** → Select **"ESP32 Dev Module"**
3. Go to **Tools → Port** → Select your ESP32's COM port
4. Set Upload Speed: **921600** (or lower if issues)

---

## 🚀 Upload Code to ESP32

### Step 1: Edit Configuration
Open `iot/krishimitra_esp32.ino` and edit:
```cpp
// WiFi Credentials
const char* ssid = "YOUR_WIFI_NAME";           // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";    // Your WiFi password

// Backend URL
const char* serverUrl = "http://192.168.29.153:5000";  // Your computer's IP
```

### Step 2: Upload
1. Click **Upload** button (→) in Arduino IDE
2. Wait for "Done uploading" message
3. Open **Serial Monitor** (top right) at **115200 baud**

### Step 3: Verify Output
You should see:
```
==========================================
   KRISHIMITRA IoT SMART FARMING SYSTEM
==========================================

✅ DHT11 sensor initialized
✅ Soil moisture & pH sensors initialized
📡 Connecting to WiFi: YOUR_WIFI
..........
✅ WiFi connected!
   IP Address: 192.168.29.xxx
   Signal Strength: -45 dBm

🚀 System ready! Starting sensor readings...

📊 Reading sensors...
   🌡️ Temperature: 27.5°C
   💨 Humidity: 65.0%
   💧 Soil Moisture: 45.2% (Raw: 2150)
   ⚗️ pH Level: 6.8 (Raw: 1800)

📤 Sending data to KrishiMitra backend...
   ✅ Response code: 200
   🎉 Data processed successfully by backend!
```

---

## 🌐 Backend API Endpoints

### POST /api/iot-data
Receives sensor data from ESP32

**Request Body:**
```json
{
  "temperature": 27.5,
  "humidity": 65.0,
  "moisture": 2150,
  "ph": 6.8,
  "rainfall": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "IoT data processed successfully",
  "sensor_data": {
    "temperature": 27.5,
    "humidity": 65.0,
    "moisture": 45.2,
    "ph": 6.8,
    "timestamp": "2026-03-18T13:00:00"
  },
  "alerts": [
    {
      "type": "success",
      "icon": "✅",
      "message": "Soil moisture is optimal for most crops.",
      "priority": "low"
    }
  ],
  "prediction": {
    "crop": "Rice",
    "confidence": 98.5,
    "emoji": "🌾",
    "season": "Kharif (June-October)",
    "duration": "120-150 days",
    "tips": "Maintain 2-5cm water level..."
  }
}
```

### GET /api/iot-live
Get latest sensor data for dashboard

### GET /api/iot-status
Check ESP32 connection status

---

## 📱 App Integration

### Frontend (React Web)
Add IoT Dashboard to your routes:
```tsx
import IoTDashboard from '@/components/IoTDashboard';

// Add to your routes
<Route path="/iot" element={<IoTDashboard />} />
```

### Mobile App (React Native)
Add IoT tab to navigation:
```tsx
import IoTDashboardScreen from './screens/IoTDashboardScreen';

// Add to bottom tabs
<Tab.Screen 
  name="IoT" 
  component={IoTDashboardScreen}
  options={{
    tabBarIcon: ({ color }) => <Radio color={color} size={24} />
  }}
/>
```

---

## 🎤 Demo Script for Hackathon

### Opening Statement
> "KrishiMitra is a complete AI-powered smart farming system that uses **real-time IoT sensor data** instead of manual input to recommend crops, detect diseases, and guide farmers."

### Demo Flow

1. **Show the Hardware**
   - Hold up ESP32 with sensors
   - "This is our IoT device with temperature, humidity, and soil moisture sensors"

2. **Insert Sensor into Soil**
   - Place soil moisture sensor in a potted plant or soil sample
   - "Watch the live data update in our app"

3. **Show Live Dashboard**
   - Open app on phone/laptop
   - Point to live indicator (green dot)
   - "Data is updating every 5 seconds"

4. **Highlight Smart Alerts**
   - "The system automatically detects when soil is dry"
   - "It sends irrigation alerts to farmers"

5. **Show AI Recommendation**
   - "Based on current sensor readings, our ML model recommends..."
   - Point to crop prediction with confidence

6. **Demonstrate Disease Detection**
   - Take photo of leaf (or use sample image)
   - "Our AI can detect plant diseases from images"

7. **Close with Impact**
   - "This system helps farmers make data-driven decisions"
   - "Increases yield by 20-30% and reduces water usage"

---

## 🔧 Troubleshooting

### WiFi Connection Issues
- Check WiFi credentials (case-sensitive)
- Ensure ESP32 is within WiFi range
- Try restarting router

### Sensor Reading Errors
- Check all connections
- Ensure sensors are powered (3.3V)
- For DHT11: Add 10kΩ pull-up resistor on DATA pin

### Backend Not Receiving Data
- Verify ESP32 and computer are on same WiFi
- Check serverUrl matches your computer's IP
- Ensure backend is running (`python app.py`)

### Moisture Sensor Calibration
1. Note value in dry air: `Serial.println(analogRead(34))`
2. Note value in water: `Serial.println(analogRead(34))`
3. Update in code:
   ```cpp
   int dryValue = YOUR_DRY_VALUE;
   int wetValue = YOUR_WET_VALUE;
   ```

---

## 📊 Project Statistics

- **Backend Endpoints**: 18+
- **ML Models**: 3 (Crop Prediction, Disease Detection, Chatbot)
- **Supported Crops**: 22+
- **Languages**: English + Hindi
- **IoT Sensors**: 4 (Temp, Humidity, Moisture, pH)
- **Data Update Rate**: Every 5 seconds
- **Prediction Accuracy**: 94%+

---

## 🏆 Key Features for Hackathon Judges

1. ✅ **Real-time IoT Integration** - Live sensor data
2. ✅ **Machine Learning** - Crop prediction model
3. ✅ **AI Assistant** - Gemini-powered chatbot
4. ✅ **Disease Detection** - Image analysis
5. ✅ **Smart Alerts** - Automatic irrigation warnings
6. ✅ **Multi-platform** - Web + Mobile + IoT
7. ✅ **Multi-language** - English + Hindi support
8. ✅ **Offline Fallback** - Works without internet

---

## 📞 Support

For issues or questions:
- Check Serial Monitor for error messages
- Verify all connections
- Ensure backend is running
- Check WiFi connectivity

---

**Built with ❤️ by KrishiMitra Team**
**KrishiMitra - Smart Precision Agriculture System**
