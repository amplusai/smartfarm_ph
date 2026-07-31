void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32-S3 연결 확인 OK");
}

void loop() {
  Serial.println("살아있음: " + String(millis() / 1000) + "초");
  delay(1000);
}
