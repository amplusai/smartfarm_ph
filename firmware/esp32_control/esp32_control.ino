#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "Adafruit_SHT31.h"

// Wi-Fi
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 대시보드 서버
const char* SERVER_HOST = "http://192.168.0.10:3000";
const char* CONTROL_ENDPOINT = "/api/control";
const char* SENSOR_ENDPOINT = "/api/sensor";

// SHT31 (온습도) I2C
const int I2C_SDA_PIN = 21;
const int I2C_SCL_PIN = 22;
const uint8_t SHT31_ADDR = 0x44;
Adafruit_SHT31 sht31 = Adafruit_SHT31();

// 5분 간격으로 센서값 업로드 (dashboard 24h 차트가 5분 간격 기준)
const unsigned long SENSOR_INTERVAL_MS = 5UL * 60UL * 1000UL;
unsigned long lastSensorAt = 0;

// 릴레이 핀
const int PUMP_RELAY_PIN = 26;
const int FAN_RELAY_PIN = 27;

// 대부분의 릴레이 모듈은 Active-Low
const bool RELAY_ACTIVE_LOW = true;

// 3초마다 서버 상태 확인
const unsigned long POLL_INTERVAL_MS = 3000;
unsigned long lastPollAt = 0;

// 현재 장치 상태
bool pumpOn = false;
bool fanOn = false;

void setRelay(int pin, bool on) {
  bool level = RELAY_ACTIVE_LOW ? !on : on;
  digitalWrite(pin, level ? HIGH : LOW);
}

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Wi-Fi 연결 중");

  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  Serial.print("\nWi-Fi 연결됨: ");
  Serial.println(WiFi.localIP());
}

void pollControlState() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    return;
  }

  HTTPClient http;
  String url = String(SERVER_HOST) + CONTROL_ENDPOINT;

  http.begin(url);
  int httpCode = http.GET();

  if (httpCode != HTTP_CODE_OK) {
    Serial.printf("GET %s 실패, code=%d\n", CONTROL_ENDPOINT, httpCode);
    http.end();
    return;
  }

  String body = http.getString();
  http.end();

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, body);

  if (err) {
    Serial.print("JSON 파싱 실패: ");
    Serial.println(err.c_str());
    return;
  }

  bool nextPump = doc["pump"] | false;
  bool nextFan = doc["fan"] | false;

  if (nextPump != pumpOn) {
    pumpOn = nextPump;
    setRelay(PUMP_RELAY_PIN, pumpOn);
    Serial.printf("워터펌프 -> %s\n", pumpOn ? "ON" : "OFF");
  }

  if (nextFan != fanOn) {
    fanOn = nextFan;
    setRelay(FAN_RELAY_PIN, fanOn);
    Serial.printf("공조팬 -> %s\n", fanOn ? "ON" : "OFF");
  }
}

void postSensorReading() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    return;
  }

  float temp = sht31.readTemperature();
  float humidity = sht31.readHumidity();

  if (isnan(temp) || isnan(humidity)) {
    Serial.println("SHT31 읽기 실패");
    return;
  }

  JsonDocument doc;
  doc["temp"] = temp;
  doc["humidity"] = humidity;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(String(SERVER_HOST) + SENSOR_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(body);

  if (httpCode == HTTP_CODE_OK) {
    Serial.printf("센서 업로드 완료: %.1f°C, %.0f%%\n", temp, humidity);
  } else {
    Serial.printf("POST %s 실패, code=%d\n", SENSOR_ENDPOINT, httpCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(FAN_RELAY_PIN, OUTPUT);

  setRelay(PUMP_RELAY_PIN, false);
  setRelay(FAN_RELAY_PIN, false);

  connectWifi();

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  if (!sht31.begin(SHT31_ADDR)) {
    Serial.println("SHT31 센서를 찾을 수 없습니다 (배선/주소 확인)");
  }
}

void loop() {
  unsigned long now = millis();

  if (now - lastPollAt >= POLL_INTERVAL_MS) {
    lastPollAt = now;
    pollControlState();
  }

  if (now - lastSensorAt >= SENSOR_INTERVAL_MS) {
    lastSensorAt = now;
    postSensorReading();
  }
}