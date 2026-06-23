#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include "DHT.h"


const char* ssid = "Galaxy ";
const char* password = "123123123";
const char* serverUrl = "http:// 10.38.129.61:5000";
const char* iotEndpoint = "/api/iot-data";

#define DHTPIN 4
#define DHTTYPE DHT11

#define SOIL_MOISTURE_PIN 34

DHT dht(DHTPIN, DHTTYPE);

unsigned long lastSendTime = 0;
const long sendInterval = 5000;

float temperature = 0.0;
float humidity = 0.0;
int soilMoistureRaw = 0;
float soilMoisturePercent = 0.0;
float phValue = 7.0;

bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("====================================");
  Serial.println("ESP32 SMART FARMING");
  Serial.println(" Without pH Sensor Version");
  Serial.println("====================================");

  dht.begin();
  pinMode(SOIL_MOISTURE_PIN, INPUT);

  connectToWiFi();

  Serial.println("System ready.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
    delay(3000);
    return;
  }

  wifiConnected = true;

  unsigned long currentTime = millis();

  if (currentTime - lastSendTime >= sendInterval) {
    lastSendTime = currentTime;

    readSensors();
    sendSensorData();
  }
}

void connectToWiFi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.disconnect();
  delay(1000);

  WiFi.begin(ssid, password);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;

    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    wifiConnected = false;

    Serial.println();
    Serial.println("WiFi connection failed!");
    Serial.print("Status code: ");
    Serial.println(WiFi.status());
  }
}

void readSensors() {
  Serial.println();
  Serial.println("Reading sensors...");

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (!isnan(temp) && !isnan(hum)) {
    temperature = temp;
    humidity = hum;

    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" C");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  } else {
    Serial.println("DHT11 reading failed. Sending last/default values.");
    Serial.println("Check DHT wiring: VCC, GND, DATA to GPIO 4.");
  }

  soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);

  int dryValue = 2800;
  int wetValue = 1200;

  soilMoisturePercent = map(soilMoistureRaw, dryValue, wetValue, 0, 100);
  soilMoisturePercent = constrain(soilMoisturePercent, 0, 100);

  Serial.print("Soil Moisture: ");
  Serial.print(soilMoisturePercent);
  Serial.print(" % | Raw: ");
  Serial.println(soilMoistureRaw);

  Serial.print("pH Level: ");
  Serial.print(phValue);
  Serial.println(" default, no pH sensor connected");
}
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send data. WiFi not connected.");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  String fullUrl = String(serverUrl) + String(iotEndpoint);

  Serial.println();
  Serial.println("Sending data to backend...");
  Serial.print("URL: ");
  Serial.println(fullUrl);

  http.begin(client, fullUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  String jsonPayload = "{";
  jsonPayload += "\"temperature\":" + String(temperature, 1) + ",";
  jsonPayload += "\"humidity\":" + String(humidity, 1) + ",";
  jsonPayload += "\"moisture\":" + String(soilMoistureRaw) + ",";
  jsonPayload += "\"ph\":" + String(phValue, 1) + ",";
  jsonPayload += "\"rainfall\":0";
  jsonPayload += "}";

  Serial.print("Payload: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();

    Serial.print("Response code: ");
    Serial.println(httpResponseCode);

    Serial.print("Response: ");
    Serial.println(response);

    Serial.println("Data sent successfully.");
  } else {
    Serial.print("HTTP error code: ");
    Serial.println(httpResponseCode);

    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));

    Serial.println("Fix: check Flask host, laptop IP, same WiFi, and firewall.");
  }

  http.end();
}