#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "Adafruit_SHT31.h"

// Wi-Fi 프로필 (장소마다 SSID/비밀번호/서버 IP가 다르므로 배열로 등록)
struct WifiProfile {
  const char* ssid;
  const char* password;
  const char* serverHost; // 이 네트워크에서 대시보드 서버(PC)가 받는 로컬 IP
};

#include "wifi_secrets.h" // SSID/비밀번호는 별도 파일(gitignore 처리됨)에 보관
const int WIFI_PROFILE_COUNT = sizeof(WIFI_PROFILES) / sizeof(WIFI_PROFILES[0]);

// 연결된 프로필에 맞춰 connectWifi()에서 갱신됨
const char* SERVER_HOST = WIFI_PROFILES[0].serverHost;

// 대시보드 서버
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
  Serial.println("Wi-Fi 연결 시도...");

  while (WiFi.status() != WL_CONNECTED) {
    for (int i = 0; i < WIFI_PROFILE_COUNT; i++) {
      Serial.printf("'%s' 연결 시도 중", WIFI_PROFILES[i].ssid);
      WiFi.begin(WIFI_PROFILES[i].ssid, WIFI_PROFILES[i].password);

      unsigned long attemptStartedAt = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - attemptStartedAt < 8000) {
        delay(300);
        Serial.print(".");
      }

      if (WiFi.status() == WL_CONNECTED) {
        SERVER_HOST = WIFI_PROFILES[i].serverHost;
        Serial.print("\nWi-Fi 연결됨: ");
        Serial.print(WIFI_PROFILES[i].ssid);
        Serial.print(" / IP: ");
        Serial.println(WiFi.localIP());
        return;
      }

      Serial.println("\n연결 실패, 다음 프로필 시도");
      WiFi.disconnect();
    }
  }
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