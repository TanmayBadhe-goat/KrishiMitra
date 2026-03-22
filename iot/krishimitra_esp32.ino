/*
 * =====================================================
 * KRISHIMITRA IoT SMART FARMING SYSTEM
 * =====================================================
 * 
 * This code runs on ESP32 and transmits real-time
 * sensor data to the KrishiMitra backend API.
 * 
 * SENSORS USED:
 * - DHT11: Temperature & Humidity
 * - Soil Moisture Sensor: Capacitive/Resistive
 * - pH Sensor: Analog pH meter (optional)
 * 
 * WIRING:
 * - DHT11 Data → GPIO 4
 * - Soil Moisture A0 → GPIO 34 (ADC1_CH6)
 * - pH Sensor → GPIO 35 (ADC1_CH7) [optional]
 * 
 * POWER:
 * - ESP32 via USB or 5V to VIN
 * - Sensors powered from 3.3V pin
 * 
 * Author: KrishiMitra Team
 * =====================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include "DHT.h"

// =====================================================
// CONFIGURATION - EDIT THESE VALUES
// =====================================================

// WiFi Credentials
const char* ssid = "YOUR_WIFI_NAME";           // Replace with your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";    // Replace with your WiFi password

// Backend API URL
// For local development: Use your computer's IP address
// For production: Use deployed backend URL
const char* serverUrl = "http://192.168.29.153:5000";  // CHANGE THIS to your backend URL
const char* iotEndpoint = "/api/iot-data";

// =====================================================
// PIN DEFINITIONS
// =====================================================

#define DHTPIN 4           // DHT11 Data pin connected to GPIO 4
#define DHTTYPE DHT11      // DHT 11 sensor type

#define SOIL_MOISTURE_PIN 34   // Soil moisture sensor on GPIO 34 (ADC1_CH6)
#define PH_SENSOR_PIN 35       // pH sensor on GPIO 35 (ADC1_CH7) - Optional

// =====================================================
// SENSOR OBJECTS
// =====================================================

DHT dht(DHTPIN, DHTTYPE);

// =====================================================
// GLOBAL VARIABLES
// =====================================================

unsigned long lastSendTime = 0;
const long sendInterval = 5000;  // Send data every 5 seconds

// Sensor readings
float temperature = 0;
float humidity = 0;
int soilMoistureRaw = 0;
float soilMoisturePercent = 0;
float phValue = 7.0;  // Default neutral pH

// WiFi status
bool wifiConnected = false;

// =====================================================
// SETUP FUNCTION
// =====================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n==========================================");
  Serial.println("   KRISHIMITRA IoT SMART FARMING SYSTEM");
  Serial.println("   Smart India Hackathon 2025");
  Serial.println("==========================================\n");
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("✅ DHT11 sensor initialized");
  
  // Set pin modes
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(PH_SENSOR_PIN, INPUT);
  Serial.println("✅ Soil moisture & pH sensors initialized");
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("\n🚀 System ready! Starting sensor readings...\n");
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("⚠️ WiFi disconnected. Reconnecting...");
    connectToWiFi();
    delay(2000);
    return;
  }
  
  wifiConnected = true;
  
  // Send data at specified interval
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= sendInterval) {
    lastSendTime = currentTime;
    
    // Read all sensors
    readSensors();
    
    // Send data to backend
    sendSensorData();
  }
}

// =====================================================
// WIFI CONNECTION
// =====================================================

void connectToWiFi() {
  Serial.print("📡 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm\n");
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi connection failed!");
    Serial.println("   Check your WiFi credentials and try again.\n");
  }
}

// =====================================================
// SENSOR READING FUNCTIONS
// =====================================================

void readSensors() {
  Serial.println("📊 Reading sensors...");
  
  // Read DHT11 (Temperature & Humidity)
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  // Check if DHT readings are valid
  if (!isnan(temp) && !isnan(hum)) {
    temperature = temp;
    humidity = hum;
    Serial.print("   🌡️ Temperature: ");
    Serial.print(temperature);
    Serial.println("°C");
    Serial.print("   💨 Humidity: ");
    Serial.print(humidity);
    Serial.println("%");
  } else {
    Serial.println("   ⚠️ DHT11 reading failed (NaN)");
  }
  
  // Read Soil Moisture (0-4095, higher = drier)
  soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  
  // Convert to percentage (0-100%, higher = wetter)
  // Note: Calibration may be needed for your specific sensor
  // For capacitive sensor: dry ~2800, wet ~1200
  // For resistive sensor: dry ~4095, wet ~1000
  
  // Simple linear conversion (adjust min/max based on your sensor)
  int dryValue = 2800;   // Value when sensor is in dry air
  int wetValue = 1200;   // Value when sensor is in water
  
  soilMoisturePercent = map(soilMoistureRaw, dryValue, wetValue, 0, 100);
  soilMoisturePercent = constrain(soilMoisturePercent, 0, 100);
  
  Serial.print("   💧 Soil Moisture: ");
  Serial.print(soilMoisturePercent);
  Serial.print("% (Raw: ");
  Serial.print(soilMoistureRaw);
  Serial.println(")");
  
  // Read pH Sensor (Optional)
  // Note: pH sensors require calibration with buffer solutions
  int phRaw = analogRead(PH_SENSOR_PIN);
  
  // Simple conversion (requires calibration!)
  // Typical pH sensor: 0-14 pH, ~1650 mV range
  // This is a rough estimate - calibrate with pH 4, 7, 10 buffers
  float voltage = phRaw * (3.3 / 4095.0);
  phValue = 7.0 + (2.5 - voltage) * 2.0;  // Rough conversion
  phValue = constrain(phValue, 0, 14);
  
  Serial.print("   ⚗️ pH Level: ");
  Serial.print(phValue);
  Serial.print(" (Raw: ");
  Serial.print(phRaw);
  Serial.println(")");
  
  Serial.println("");
}

// =====================================================
// SEND DATA TO BACKEND
// =====================================================

void sendSensorData() {
  if (!wifiConnected) {
    Serial.println("❌ Cannot send data - WiFi not connected");
    return;
  }
  
  Serial.println("📤 Sending data to KrishiMitra backend...");
  
  WiFiClient client;
  HTTPClient http;
  
  // Build full URL
  String fullUrl = String(serverUrl) + String(iotEndpoint);
  
  http.begin(client, fullUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);  // 10 second timeout
  
  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"temperature\":" + String(temperature, 1) + ",";
  jsonPayload += "\"humidity\":" + String(humidity, 1) + ",";
  jsonPayload += "\"moisture\":" + String(soilMoistureRaw) + ",";
  jsonPayload += "\"ph\":" + String(phValue, 1) + ",";
  jsonPayload += "\"rainfall\":0";  // No rain sensor in basic setup
  jsonPayload += "}";
  
  Serial.print("   Payload: ");
  Serial.println(jsonPayload);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("   ✅ Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("   Response: ");
    Serial.println(response);
    
    // Parse response for useful info
    if (response.indexOf("\"success\":true") > 0) {
      Serial.println("   🎉 Data processed successfully by backend!");
      
      // Check for alerts in response
      if (response.indexOf("Irrigation needed") > 0) {
        Serial.println("   ⚠️ ALERT: Irrigation needed!");
      }
    }
  } else {
    Serial.print("   ❌ Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("   Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  Serial.println("");
}

// =====================================================
// CALIBRATION HELPER (Run once for sensor calibration)
// =====================================================

void printCalibrationData() {
  // Uncomment to run calibration
  /*
  Serial.println("=== CALIBRATION MODE ===");
  Serial.println("Place sensor in DRY AIR and note the value:");
  Serial.print("Dry value: ");
  Serial.println(analogRead(SOIL_MOISTURE_PIN));
  delay(5000);
  
  Serial.println("Place sensor in WATER and note the value:");
  Serial.print("Wet value: ");
  Serial.println(analogRead(SOIL_MOISTURE_PIN));
  delay(5000);
  */
}

// =====================================================
// END OF CODE
// =====================================================
